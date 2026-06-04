import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { eq, sql, and } from 'drizzle-orm';
import { DrizzleService } from '../../db/drizzle.service';
import { tokenBalance, transaction, subscription, dailyUsage } from '../../db/schema';
import { BILLING_TIERS, FEATURE_TO_CATEGORY, KREDIT_COSTS } from './billing.constants';
import Stripe from 'stripe';
import { ModuleRef } from '@nestjs/core';
import { NotificationsService } from '../notifications/notifications.service';

export interface BillingResult {
    allowed: boolean;
    reason?: string;
    usingKredit: boolean;
    kreditCost: number;
}

@Injectable()
export class BillingService {
    private readonly logger = new Logger(BillingService.name);
    private stripe: Stripe | null = null;

    private notificationsService: NotificationsService;

    constructor(
        private drizzle: DrizzleService,
        private configService: ConfigService,
        private moduleRef: ModuleRef,
    ) {
        const stripeSecretKey = this.configService.get<string>('STRIPE_SECRET_KEY');
        if (stripeSecretKey) {
            this.stripe = new Stripe(stripeSecretKey);
        }
    }

    private getNotificationsService(): NotificationsService | null {
        try {
            if (!this.notificationsService) {
                this.notificationsService = this.moduleRef.get(NotificationsService, { strict: false });
            }
            return this.notificationsService;
        } catch { return null; }
    }

    get db() {
        return this.drizzle.db;
    }

    async initializeBalance(userId: string) {
        const existing = await this.db.query.tokenBalance.findFirst({
            where: eq(tokenBalance.userId, userId),
        });
        if (!existing) {
            await this.db.insert(tokenBalance).values({
                userId,
                balance: 0,
                monthlyQuota: 0,
                monthlyUsed: 0,
                credits: 0,
            });
        }
    }

    async getBalance(userId: string) {
        let balance = await this.db.query.tokenBalance.findFirst({
            where: eq(tokenBalance.userId, userId),
        });
        if (!balance) {
            const [newBalance] = await this.db
                .insert(tokenBalance)
                .values({
                    userId,
                    balance: 0,
                    monthlyQuota: 0,
                    monthlyUsed: 0,
                    credits: 0,
                })
                .returning();
            balance = newBalance;
        }
        return balance;
    }

    async getMonthlyUsageByCategory(userId: string, monthStart: Date): Promise<Record<string, number>> {
        const usageRows = await this.db.query.dailyUsage.findMany({
            where: and(
                eq(dailyUsage.userId, userId),
                sql`${dailyUsage.date} >= ${monthStart.toISOString()}`
            ),
        });
        const result: Record<string, number> = {};
        for (const row of usageRows) {
            const key = row.featureType;
            result[key] = (result[key] || 0) + (row.count || 0);
        }
        return result;
    }

    async getSubscriptionTier(userId: string) {
        const sub = await this.getSubscription(userId);
        const plan = sub?.plan || 'FREE';
        return plan === 'ENTERPRISE' ? 'BUSINESS' : plan;
    }

    async checkDailyLimit(userId: string, featureType: string): Promise<boolean> {
        const tier = await this.getSubscriptionTier(userId);
        const limit = BILLING_TIERS[tier]?.monthlyLimits?.[featureType] || 0;
        if (limit <= 0) return false;
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const usageRows = await this.db.query.dailyUsage.findMany({
            where: and(
                eq(dailyUsage.userId, userId),
                eq(dailyUsage.featureType, featureType as any),
                sql`${dailyUsage.date} >= ${monthStart.toISOString()}`
            ),
        });
        const currentUsage = usageRows.reduce((sum, row) => sum + (row.count || 0), 0);
        return currentUsage < limit;
    }

    async incrementDailyUsage(userId: string, featureType: string) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        try {
            await this.db.transaction(async (tx) => {
                const existing = await tx.query.dailyUsage.findFirst({
                    where: and(
                        eq(dailyUsage.userId, userId),
                        eq(dailyUsage.featureType, featureType as any),
                        sql`${dailyUsage.date}::date = ${today.toISOString().split('T')[0]}::date`
                    ),
                });
                if (existing) {
                    await tx.update(dailyUsage)
                        .set({ count: sql`${dailyUsage.count} + 1` })
                        .where(eq(dailyUsage.id, existing.id));
                } else {
                    await tx.insert(dailyUsage).values({
                        userId,
                        featureType: featureType as any,
                        date: today,
                        count: 1,
                    });
                }
            });
        } catch (e) {
            // Ignore duplicate key errors
        }
    }

    async checkDailyChatLimit(userId: string, dailyLimit: number): Promise<{ allowed: boolean; remaining: number; limit: number }> {
        const tier = await this.getSubscriptionTier(userId);
        if (tier === 'FREE') {
            return { allowed: false, remaining: 0, limit: 0 };
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayStr = today.toISOString().split('T')[0];

        const usageRow = await this.db.query.dailyUsage.findFirst({
            where: and(
                eq(dailyUsage.userId, userId),
                eq(dailyUsage.featureType, 'AI_CHAT' as any),
                sql`${dailyUsage.date}::date = ${todayStr}::date`,
            ),
        });

        const currentCount = usageRow?.count || 0;
        return {
            allowed: currentCount < dailyLimit,
            remaining: Math.max(0, dailyLimit - currentCount),
            limit: dailyLimit,
        };
    }

    async checkCategoryLimit(userId: string, featureType: string): Promise<boolean> {
        const categoryFeature = FEATURE_TO_CATEGORY[featureType];
        if (!categoryFeature) return true;
        return this.checkDailyLimit(userId, categoryFeature);
    }

    /**
     * Main billing gate. 2-layer:
     * Layer 1: Per-kategori count limit (primary)
     * Layer 2: Kredit (fallback when category limit exceeded)
     */
    async ensureBilling(userId: string, featureType: string): Promise<BillingResult> {
        const withinCategory = await this.checkCategoryLimit(userId, featureType);
        if (withinCategory) {
            return { allowed: true, usingKredit: false, kreditCost: 0 };
        }

        const kreditCost = KREDIT_COSTS[featureType] || 0;
        if (kreditCost <= 0) {
            const category = FEATURE_TO_CATEGORY[featureType] || featureType;
            return {
                allowed: false,
                reason: `Kuota ${this.getCategoryLabel(category)} sudah habis bulanan ini. Upgrade plan untuk menambah jatah.`,
                usingKredit: false,
                kreditCost: 0,
            };
        }

        const balance = await this.getBalance(userId);
        const credits = balance.credits || 0;
        if (credits >= kreditCost) {
            return { allowed: true, usingKredit: true, kreditCost };
        }

        const category = FEATURE_TO_CATEGORY[featureType] || featureType;
        return {
            allowed: false,
            reason: `Kuota ${this.getCategoryLabel(category)} habis dan kredit tidak cukup (butuh ${kreditCost} kredit). Upgrade plan atau beli kredit tambahan.`,
            usingKredit: false,
            kreditCost,
        };
    }

    /**
     * Record usage AFTER successful AI work.
     * Always increments category count. Deducts kredits if overflow.
     */
    async recordUsage(userId: string, featureType: string, billingResult?: BillingResult) {
        const category = FEATURE_TO_CATEGORY[featureType];
        if (category) {
            await this.incrementDailyUsage(userId, category);
        }
        if (billingResult?.usingKredit && billingResult.kreditCost > 0) {
            await this.deductKredits(userId, billingResult.kreditCost, `${featureType} (overflow kredit)`);
        }
    }

    private async deductKredits(userId: string, amount: number, description: string) {
        const balance = await this.getBalance(userId);
        const credits = balance.credits || 0;
        if (credits < amount) {
            throw new BadRequestException('Kredit tidak mencukupi.');
        }
        await this.db.transaction(async (tx) => {
            await tx
                .update(tokenBalance)
                .set({
                    credits: sql`${tokenBalance.credits} - ${amount}`,
                    totalUsed: sql`${tokenBalance.totalUsed} + ${amount}`,
                    updatedAt: new Date(),
                })
                .where(eq(tokenBalance.userId, userId));

            await tx.insert(transaction).values({
                userId,
                type: 'USAGE',
                amount: 0,
                tokens: -amount,
                status: 'COMPLETED',
                metadata: { description, deductedFrom: 'kredit' },
            });
        });
        
        // Check if credits are running low and notify
        const newBal = await this.getBalance(userId);
        const remaining = newBal.credits || 0;
        if (remaining <= 10 && remaining > amount) {
            try {
                await this.getNotificationsService()?.notifyLowTokens(userId, remaining);
            } catch (e) { /* notification failure should not block */ }
        } else if (remaining === 0) {
            try {
                await this.getNotificationsService()?.create(userId, 'LOW_TOKENS', 'Kredit Habis', 'Kredit Anda sudah habis. Silakan top up untuk melanjutkan.', { credits: 0 });
            } catch (e) { /* notification failure should not block */ }
        }
    }

    // =============================================
    // LEGACY METHODS - backward compat
    // =============================================

    /** @deprecated Use ensureBilling() + recordUsage() instead. Now just checks kredits as fallback. */
    async checkBalance(userId: string, required: number): Promise<boolean> {
        // Legacy callers also check checkCategoryLimit separately,
        // so we only need to verify kredits as overflow here.
        const balance = await this.getBalance(userId);
        const credits = balance.credits || 0;
        return credits >= required;
    }

    /** @deprecated Use ensureBilling() + recordUsage() instead. Only deducts kredits. */
    async deductTokens(userId: string, amount: number, description: string) {
        await this.deductKredits(userId, amount, description);
    }

    // =============================================
    // KREDIT MANAGEMENT
    // =============================================

    async addCredits(userId: string, amount: number, stripePaymentId?: string) {
        await this.db.transaction(async (tx) => {
            const existing = await tx.query.tokenBalance.findFirst({
                where: eq(tokenBalance.userId, userId),
            });
            if (existing) {
                await tx
                    .update(tokenBalance)
                    .set({
                        credits: sql`${tokenBalance.credits} + ${amount}`,
                        totalPurchased: sql`${tokenBalance.totalPurchased} + ${amount}`,
                        updatedAt: new Date(),
                    })
                    .where(eq(tokenBalance.userId, userId));
            } else {
                await tx.insert(tokenBalance).values({
                    userId,
                    balance: 0,
                    monthlyQuota: 0,
                    monthlyUsed: 0,
                    credits: amount,
                    totalPurchased: amount,
                });
            }
            await tx.insert(transaction).values({
                userId,
                type: 'PURCHASE',
                amount: 0,
                tokens: amount,
                stripePaymentId,
                status: 'COMPLETED',
                metadata: { type: 'kredit' },
            });
        });
    }

    async resetMonthlyQuota(userId: string, newQuota: number) {
        this.logger.log(`Legacy resetMonthlyQuota for user ${userId}: ${newQuota} (no-op in count-based billing)`);
    }

    // =============================================
    // TRANSACTIONS & SUBSCRIPTIONS
    // =============================================

    async getTransactions(userId: string, page = 1, limit = 20) {
        const offset = (page - 1) * limit;
        const transactions = await this.db.query.transaction.findMany({
            where: eq(transaction.userId, userId),
            orderBy: (t, { desc }) => [desc(t.createdAt)],
            offset,
            limit,
        });
        const [{ count }] = await this.db
            .select({ count: sql<number>`count(*)` })
            .from(transaction)
            .where(eq(transaction.userId, userId));
        return {
            data: transactions,
            meta: {
                total: Number(count),
                page,
                limit,
                totalPages: Math.ceil(Number(count) / limit),
            },
        };
    }

    async getSubscription(userId: string) {
        return this.db.query.subscription.findFirst({
            where: and(
                eq(subscription.userId, userId),
                eq(subscription.status, 'ACTIVE'),
            ),
            orderBy: (s, { desc }) => [desc(s.createdAt)],
        });
    }

    // =============================================
    // STRIPE HANDLERS
    // =============================================

    async handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
        this.logger.log(`Processing checkout session: ${session.id}`);
        const userId = session.metadata?.userId;
        if (!userId) {
            this.logger.error('No userId in checkout session metadata');
            return;
        }
        if (session.mode === 'payment') {
            const tokens = parseInt(session.metadata?.tokens || '0', 10);
            const amount = session.amount_total ? session.amount_total / 100 : 0;
            if (tokens > 0) {
                await this.addCredits(userId, tokens, session.payment_intent as string);
                await this.db
                    .update(transaction)
                    .set({ amount })
                    .where(eq(transaction.stripePaymentId, session.payment_intent as string));
                this.logger.log(`Added ${tokens} kredit to user ${userId}`);
            }
        }
        if (session.mode === 'subscription' && session.subscription) {
            await this.handleSubscriptionCreated(userId, session.subscription as string, session);
        }
    }

    async handleSubscriptionCreated(userId: string, subscriptionId: string, session: Stripe.Checkout.Session) {
        this.logger.log(`Creating subscription ${subscriptionId} for user ${userId}`);
        if (!this.stripe) {
            this.logger.error('Stripe not initialized');
            return;
        }
        const stripeSubscription = await this.stripe.subscriptions.retrieve(subscriptionId);
        const plan = session.metadata?.plan || 'PRO';
        await this.db.insert(subscription).values({
            userId,
            plan: plan as 'PRO' | 'ENTERPRISE',
            stripeSubscriptionId: subscriptionId,
            status: 'ACTIVE',
            tokensPerMonth: 0,
            currentPeriodStart: new Date((stripeSubscription as any).current_period_start * 1000),
            currentPeriodEnd: new Date((stripeSubscription as any).current_period_end * 1000),
        });
        this.logger.log(`Subscription created for user ${userId}: plan ${plan}`);
    }

    async handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
        this.logger.log(`Processing invoice payment: ${invoice.id}`);
        const subscriptionId = (invoice as any).subscription;
        if (!subscriptionId) return;
        const userId = invoice.metadata?.userId;
        if (!userId) {
            this.logger.error('No userId in invoice metadata');
            return;
        }
        const sub = await this.db.query.subscription.findFirst({
            where: eq(subscription.stripeSubscriptionId, subscriptionId as string),
        });
        if (sub) {
            await this.db
                .update(subscription)
                .set({
                    status: 'ACTIVE',
                    currentPeriodStart: new Date((invoice as any).period_start * 1000),
                    currentPeriodEnd: new Date((invoice as any).period_end * 1000),
                })
                .where(eq(subscription.stripeSubscriptionId, subscriptionId as string));
            this.logger.log(`Subscription renewed for user ${userId}`);
        }
    }

    async handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
        this.logger.warn(`Invoice payment failed: ${invoice.id}`);
        const subscriptionId = (invoice as any).subscription;
        if (!subscriptionId) return;
        await this.db
            .update(subscription)
            .set({ status: 'PAST_DUE' })
            .where(eq(subscription.stripeSubscriptionId, subscriptionId as string));
    }

    async handleCustomerSubscriptionDeleted(stripeSubscription: Stripe.Subscription) {
        this.logger.log(`Subscription deleted: ${stripeSubscription.id}`);
        await this.db
            .update(subscription)
            .set({ status: 'CANCELED', canceledAt: new Date() })
            .where(eq(subscription.stripeSubscriptionId, stripeSubscription.id));
    }

    async createCheckoutSession(userId: string, priceId: string, mode: 'payment' | 'subscription', tokens?: number, plan?: string) {
        if (!this.stripe) throw new BadRequestException('Stripe is not configured');
        const session = await this.stripe.checkout.sessions.create({
            mode,
            payment_method_types: ['card'],
            line_items: [{ price: priceId, quantity: 1 }],
            success_url: `${this.configService.get('FRONTEND_URL')}/billing?success=true`,
            cancel_url: `${this.configService.get('FRONTEND_URL')}/billing?canceled=true`,
            metadata: { userId, tokens: tokens?.toString() || '0', plan: plan || 'PRO' },
        });
        return { url: session.url };
    }

    async createCustomerPortalSession(userId: string, customerId: string) {
        if (!this.stripe) throw new BadRequestException('Stripe is not configured');
        const session = await this.stripe.billingPortal.sessions.create({
            customer: customerId,
            return_url: `${this.configService.get('FRONTEND_URL')}/billing`,
        });
        return { url: session.url };
    }

    // =============================================
    // MIDTRANS HANDLERS
    // =============================================

    async createPendingTransaction(userId: string, orderId: string, plan: string, amount: number) {
        await this.db.insert(transaction).values({
            userId,
            type: 'PURCHASE',
            amount,
            tokens: 0,
            status: 'PENDING',
            metadata: { orderId, plan, gateway: 'midtrans' },
        });
        this.logger.log(`Pending transaction created: ${orderId} for user ${userId}`);
    }

    async handleMidtransSuccess(orderId: string) {
        this.logger.log(`Processing Midtrans success: ${orderId}`);
        const pendingTx = await this.db.query.transaction.findFirst({
            where: eq(transaction.metadata, { orderId, gateway: 'midtrans' } as any),
        });
        if (!pendingTx) {
            this.logger.error(`Transaction not found for order: ${orderId}`);
            return;
        }
        if (pendingTx.status === 'COMPLETED') {
            this.logger.log(`Transaction already completed: ${orderId}`);
            return;
        }
        const metadata = pendingTx.metadata as any;
        const plan = metadata?.plan;

        await this.db
            .update(transaction)
            .set({ status: 'COMPLETED' })
            .where(eq(transaction.id, pendingTx.id));

        const existingSub = await this.db.query.subscription.findFirst({
            where: eq(subscription.userId, pendingTx.userId),
        });
        const now = new Date();
        const periodEnd = new Date(now);
        periodEnd.setMonth(periodEnd.getMonth() + 1);
        if (existingSub) {
            await this.db
                .update(subscription)
                .set({
                    plan,
                    status: 'ACTIVE',
                    currentPeriodStart: now,
                    currentPeriodEnd: periodEnd,
                    metadata: { ...((existingSub.metadata as any) || {}), gateway: 'midtrans', orderId },
                    updatedAt: now,
                })
                .where(eq(subscription.userId, pendingTx.userId));
        } else {
            await this.db.insert(subscription).values({
                userId: pendingTx.userId,
                plan,
                status: 'ACTIVE',
                currentPeriodStart: now,
                currentPeriodEnd: periodEnd,
                tokensPerMonth: 0,
                metadata: { gateway: 'midtrans', orderId },
            });
        }
        this.logger.log(`Midtrans success: plan ${plan} activated for user ${pendingTx.userId}`);
    }

    async handleMidtransFailure(orderId: string, reason: string) {
        this.logger.log(`Processing Midtrans failure: ${orderId} - ${reason}`);
        
        const pendingTx = await this.db.query.transaction.findFirst({
            where: eq(transaction.metadata, { orderId, gateway: "midtrans" } as any),
        });

        if (!pendingTx) {
            this.logger.error(`Transaction not found for order: ${orderId}`);
            return;
        }

        await this.db
            .update(transaction)
            .set({ 
                status: "FAILED",
                metadata: { ...((pendingTx.metadata as any) || {}), failureReason: reason }
            })
            .where(eq(transaction.id, pendingTx.id));

        this.logger.log(`Transaction ${orderId} marked as failed: ${reason}`);
    }

    private getCategoryLabel(category: string): string {
        const labels: Record<string, string> = {
            ARTICLE_GENERATION: 'Artikel',
            INSTAGRAM_GENERATION: 'Instagram',
            VIDEO_GENERATION: 'Video',
            IMAGE_GENERATION: 'Gambar',
        };
        return labels[category] || category;
    }
}
