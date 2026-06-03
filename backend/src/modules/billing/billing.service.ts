import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { eq, sql, and } from 'drizzle-orm';
import { DrizzleService } from '../../db/drizzle.service';
import { tokenBalance, transaction, subscription, dailyUsage } from '../../db/schema';
import { BILLING_TIERS } from './billing.constants';
import Stripe from 'stripe';

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);
  private stripe: Stripe | null = null;

  constructor(
    private drizzle: DrizzleService,
    private configService: ConfigService,
  ) {
    const stripeSecretKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    if (stripeSecretKey) {
      this.stripe = new Stripe(stripeSecretKey);
    }
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
        balance: BILLING_TIERS.FREE.monthlyQuota,
        monthlyQuota: BILLING_TIERS.FREE.monthlyQuota,
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
          balance: BILLING_TIERS.FREE.monthlyQuota,
          monthlyQuota: BILLING_TIERS.FREE.monthlyQuota,
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
    // Map ENTERPRISE to BUSINESS (legacy naming)
    return plan === 'ENTERPRISE' ? 'BUSINESS' : plan;
  }

  async checkDailyLimit(userId: string, featureType: 'ARTICLE_GENERATION' | 'INSTAGRAM_GENERATION' | 'VIDEO_GENERATION'): Promise<boolean> {
    const tier = await this.getSubscriptionTier(userId);
    const limit = BILLING_TIERS[tier]?.monthlyLimits?.[featureType] || 0;
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const usageRows = await this.db.query.dailyUsage.findMany({
      where: and(
        eq(dailyUsage.userId, userId),
        eq(dailyUsage.featureType, featureType),
        sql`${dailyUsage.date} >= ${monthStart.toISOString()}`
      ),
    });
    const currentUsage = usageRows.reduce((sum, row) => sum + (row.count || 0), 0);
    return currentUsage < limit;
  }

  async incrementDailyUsage(userId: string, featureType: 'ARTICLE_GENERATION' | 'INSTAGRAM_GENERATION' | 'VIDEO_GENERATION') {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    // Still track daily for analytics, but limits are now checked monthly
    try {
      await this.db.transaction(async (tx) => {
        const existing = await tx.query.dailyUsage.findFirst({
          where: and(
            eq(dailyUsage.userId, userId),
            eq(dailyUsage.featureType, featureType),
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
            featureType,
            date: today,
            count: 1,
          });
        }
      });
    } catch (e) {
      // Ignore duplicate key errors
    }
  }

  async checkBalance(userId: string, required: number): Promise<boolean> {
    const balance = await this.getBalance(userId);
    const monthlyRemaining = (balance.monthlyQuota || 0) - (balance.monthlyUsed || 0);
    if (monthlyRemaining >= required) return true;
    const creditsRemaining = balance.credits || 0;
    if (creditsRemaining >= required) return true;
    return false;
  }

  async deductTokens(userId: string, amount: number, description: string) {
    const balance = await this.getBalance(userId);
    const monthlyRemaining = (balance.monthlyQuota || 0) - (balance.monthlyUsed || 0);
    await this.db.transaction(async (tx) => {
      let remainingToDeduct = amount;
      if (monthlyRemaining > 0) {
        const deductFromMonthly = Math.min(remainingToDeduct, monthlyRemaining);
        await tx
          .update(tokenBalance)
          .set({
            monthlyUsed: sql`${tokenBalance.monthlyUsed} + ${deductFromMonthly}`,
            balance: sql`${tokenBalance.balance} - ${deductFromMonthly}`,
            totalUsed: sql`${tokenBalance.totalUsed} + ${deductFromMonthly}`,
            updatedAt: new Date(),
          })
          .where(eq(tokenBalance.userId, userId));
        remainingToDeduct -= deductFromMonthly;
      }
      if (remainingToDeduct > 0) {
        const creditsAvailable = balance.credits || 0;
        if (creditsAvailable < remainingToDeduct) {
          throw new BadRequestException('Saldo kredit tidak mencukupi. Silakan top up kredit atau tunggu reset kuota bulanan.');
        }
        await tx
          .update(tokenBalance)
          .set({
            credits: sql`${tokenBalance.credits} - ${remainingToDeduct}`,
            totalUsed: sql`${tokenBalance.totalUsed} + ${remainingToDeduct}`,
            updatedAt: new Date(),
          })
          .where(eq(tokenBalance.userId, userId));
      }
      await tx.insert(transaction).values({
        userId,
        type: 'USAGE',
        amount: 0,
        tokens: -amount,
        status: 'COMPLETED',
        metadata: { description, deductedFrom: monthlyRemaining > 0 ? 'monthly' : 'credits' },
      });
    });
  }

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
        metadata: { type: 'credits' },
      });
    });
  }

  async resetMonthlyQuota(userId: string, newQuota: number) {
    await this.db.transaction(async (tx) => {
      const existing = await tx.query.tokenBalance.findFirst({
        where: eq(tokenBalance.userId, userId),
      });
      if (existing) {
        await tx
          .update(tokenBalance)
          .set({
            monthlyQuota: newQuota,
            monthlyUsed: 0,
            balance: (existing.credits || 0) + newQuota,
            updatedAt: new Date(),
          })
          .where(eq(tokenBalance.userId, userId));
      }
      this.logger.log(`Monthly quota reset for user ${userId}: ${newQuota}`);
    });
  }

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
        this.logger.log(`Added ${tokens} credits to user ${userId}`);
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
    const tokensPerMonth = parseInt(session.metadata?.tokensPerMonth || '1000', 10);
    await this.db.insert(subscription).values({
      userId,
      plan: plan as 'PRO' | 'ENTERPRISE',
      stripeSubscriptionId: subscriptionId,
      status: 'ACTIVE',
      tokensPerMonth,
      currentPeriodStart: new Date((stripeSubscription as any).current_period_start * 1000),
      currentPeriodEnd: new Date((stripeSubscription as any).current_period_end * 1000),
    });
    await this.resetMonthlyQuota(userId, tokensPerMonth);
    this.logger.log(`Subscription created for user ${userId} with ${tokensPerMonth} monthly quota`);
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
      await this.resetMonthlyQuota(userId, sub.tokensPerMonth);
      await this.db
        .update(subscription)
        .set({
          status: 'ACTIVE',
          currentPeriodStart: new Date((invoice as any).period_start * 1000),
          currentPeriodEnd: new Date((invoice as any).period_end * 1000),
        })
        .where(eq(subscription.stripeSubscriptionId, subscriptionId as string));
      this.logger.log(`Reset monthly quota for user ${userId}: ${sub.tokensPerMonth}`);
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

  async createPendingTransaction(userId: string, orderId: string, plan: string, amount: number) {
    const planTokens: Record<string, number> = {
      STARTER: BILLING_TIERS.STARTER.monthlyQuota,
      PRO: BILLING_TIERS.PRO.monthlyQuota,
      BUSINESS: BILLING_TIERS.BUSINESS.monthlyQuota,
    };
    await this.db.insert(transaction).values({
      userId,
      type: 'PURCHASE',
      amount,
      tokens: planTokens[plan] || 0,
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
    const planTokens: Record<string, number> = {
      STARTER: BILLING_TIERS.STARTER.monthlyQuota,
      PRO: BILLING_TIERS.PRO.monthlyQuota,
      BUSINESS: BILLING_TIERS.BUSINESS.monthlyQuota,
    };
    const tokens = planTokens[plan] || pendingTx.tokens;
    await this.db
      .update(transaction)
      .set({ status: 'COMPLETED' })
      .where(eq(transaction.id, pendingTx.id));
    await this.resetMonthlyQuota(pendingTx.userId, tokens);
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
        tokensPerMonth: tokens,
        metadata: { gateway: 'midtrans', orderId },
      });
    }
    this.logger.log(`Midtrans success: added ${tokens} monthly quota to user ${pendingTx.userId}`);
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
}

