import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { eq, sql, and } from 'drizzle-orm';
import { DrizzleService } from '../../db/drizzle.service';
import { tokenBalance, transaction, subscription } from '../../db/schema';
import Stripe from 'stripe';

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);
  private stripe: Stripe | null = null;

  constructor(
    private drizzle: DrizzleService,
    private configService: ConfigService,
  ) {
    // Initialize Stripe only if secret key is provided
    const stripeSecretKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    if (stripeSecretKey) {
      this.stripe = new Stripe(stripeSecretKey);
    }
  }

  get db() {
    return this.drizzle.db;
  }

  async initializeBalance(userId: string) {
    // Check if balance already exists
    const existing = await this.db.query.tokenBalance.findFirst({
      where: eq(tokenBalance.userId, userId),
    });

    if (!existing) {
      await this.db.insert(tokenBalance).values({
        userId,
        balance: 10, // Free trial tokens
      });
    }
  }

  async getBalance(userId: string) {
    let balance = await this.db.query.tokenBalance.findFirst({
      where: eq(tokenBalance.userId, userId),
    });

    if (!balance) {
      // Create initial balance
      const [newBalance] = await this.db
        .insert(tokenBalance)
        .values({
          userId,
          balance: 10, // Free trial tokens
        })
        .returning();
      balance = newBalance;
    }

    return balance;
  }

  async checkBalance(userId: string, required: number): Promise<boolean> {
    const balance = await this.getBalance(userId);
    return (balance?.balance || 0) >= required;
  }

  async deductTokens(userId: string, amount: number, description: string) {
    const balance = await this.getBalance(userId);

    if ((balance?.balance || 0) < amount) {
      throw new BadRequestException('Insufficient token balance');
    }

    // Use transaction for atomic operation
    await this.db.transaction(async (tx) => {
      await tx
        .update(tokenBalance)
        .set({
          balance: sql`${tokenBalance.balance} - ${amount}`,
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
        metadata: { description },
      });
    });
  }

  async addTokens(userId: string, amount: number, stripePaymentId?: string) {
    await this.db.transaction(async (tx) => {
      // Upsert token balance
      const existing = await tx.query.tokenBalance.findFirst({
        where: eq(tokenBalance.userId, userId),
      });

      if (existing) {
        await tx
          .update(tokenBalance)
          .set({
            balance: sql`${tokenBalance.balance} + ${amount}`,
            totalPurchased: sql`${tokenBalance.totalPurchased} + ${amount}`,
            updatedAt: new Date(),
          })
          .where(eq(tokenBalance.userId, userId));
      } else {
        await tx.insert(tokenBalance).values({
          userId,
          balance: amount,
          totalPurchased: amount,
        });
      }

      await tx.insert(transaction).values({
        userId,
        type: 'PURCHASE',
        amount: 0, // To be set with actual price
        tokens: amount,
        stripePaymentId,
        status: 'COMPLETED',
      });
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

    // Get total count
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

  // ==========================================
  // STRIPE WEBHOOK HANDLERS
  // ==========================================

  async handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
    this.logger.log(`Processing checkout session: ${session.id}`);

    const userId = session.metadata?.userId;
    if (!userId) {
      this.logger.error('No userId in checkout session metadata');
      return;
    }

    // Handle one-time payment for tokens
    if (session.mode === 'payment') {
      const tokens = parseInt(session.metadata?.tokens || '0', 10);
      const amount = session.amount_total ? session.amount_total / 100 : 0;

      if (tokens > 0) {
        await this.addTokens(userId, tokens, session.payment_intent as string);

        // Update transaction with actual amount
        await this.db
          .update(transaction)
          .set({ amount })
          .where(eq(transaction.stripePaymentId, session.payment_intent as string));

        this.logger.log(`Added ${tokens} tokens to user ${userId}`);
      }
    }

    // Handle subscription creation
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

    // Create subscription record
    await this.db.insert(subscription).values({
      userId,
      plan: plan as 'PRO' | 'ENTERPRISE',
      stripeSubscriptionId: subscriptionId,
      status: 'ACTIVE',
      tokensPerMonth,
      currentPeriodStart: new Date((stripeSubscription as any).current_period_start * 1000),
      currentPeriodEnd: new Date((stripeSubscription as any).current_period_end * 1000),
    });

    // Add initial monthly tokens
    await this.addTokens(userId, tokensPerMonth, subscriptionId);

    this.logger.log(`Subscription created for user ${userId} with ${tokensPerMonth} tokens/month`);
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

    // Get subscription to find tokens to add
    const sub = await this.db.query.subscription.findFirst({
      where: eq(subscription.stripeSubscriptionId, subscriptionId as string),
    });

    if (sub) {
      // Add monthly tokens
      await this.addTokens(userId, sub.tokensPerMonth, invoice.id);

      // Update subscription period
      await this.db
        .update(subscription)
        .set({
          status: 'ACTIVE',
          currentPeriodStart: new Date((invoice as any).period_start * 1000),
          currentPeriodEnd: new Date((invoice as any).period_end * 1000),
        })
        .where(eq(subscription.stripeSubscriptionId, subscriptionId as string));

      this.logger.log(`Added ${sub.tokensPerMonth} monthly tokens to user ${userId}`);
    }
  }

  async handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
    this.logger.warn(`Invoice payment failed: ${invoice.id}`);

    const subscriptionId = (invoice as any).subscription;
    if (!subscriptionId) return;

    // Update subscription status
    await this.db
      .update(subscription)
      .set({ status: 'PAST_DUE' })
      .where(eq(subscription.stripeSubscriptionId, subscriptionId as string));
  }

  async handleCustomerSubscriptionDeleted(stripeSubscription: Stripe.Subscription) {
    this.logger.log(`Subscription deleted: ${stripeSubscription.id}`);

    // Update subscription status
    await this.db
      .update(subscription)
      .set({
        status: 'CANCELED',
        canceledAt: new Date(),
      })
      .where(eq(subscription.stripeSubscriptionId, stripeSubscription.id));
  }

  // ==========================================
  // CHECKOUT SESSION CREATION
  // ==========================================

  async createCheckoutSession(
    userId: string,
    priceId: string,
    mode: 'payment' | 'subscription',
    tokens?: number,
    plan?: string,
  ) {
    if (!this.stripe) {
      throw new BadRequestException('Stripe is not configured');
    }

    const session = await this.stripe.checkout.sessions.create({
      mode,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${this.configService.get('FRONTEND_URL')}/billing?success=true`,
      cancel_url: `${this.configService.get('FRONTEND_URL')}/billing?canceled=true`,
      metadata: {
        userId,
        tokens: tokens?.toString() || '0',
        plan: plan || 'PRO',
      },
    });

    return { url: session.url };
  }

  async createCustomerPortalSession(userId: string, customerId: string) {
    if (!this.stripe) {
      throw new BadRequestException('Stripe is not configured');
    }

    const session = await this.stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${this.configService.get('FRONTEND_URL')}/billing`,
    });

    return { url: session.url };
  }
}
