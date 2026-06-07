import { Controller, Get, Post, Body, Query, UseGuards, UseInterceptors, Headers, Req, Logger, RawBodyRequest, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { BillingService } from './billing.service';
import { SessionAuthGuard } from '../../common/guards/session-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuditInterceptor } from '../../common/interceptors/audit.interceptor';
import type { User } from '../../db/types';
import Stripe from 'stripe';
import { Request } from 'express';

@ApiTags('billing')
@ApiBearerAuth()
@UseGuards(SessionAuthGuard)
@UseInterceptors(AuditInterceptor)
@Controller('billing')
export class BillingController {
    private readonly logger = new Logger(BillingController.name);
    private stripe: Stripe | null = null;

    constructor(
        private billingService: BillingService,
        private configService: ConfigService,
    ) {
        const stripeSecretKey = this.configService.get<string>('STRIPE_SECRET_KEY');
        if (stripeSecretKey) {
            this.stripe = new Stripe(stripeSecretKey);
        }
    }

    @Get('balance')
    @ApiOperation({ summary: 'Get billing balance with per-category limits' })
    async getBalance(@CurrentUser() user: User) {
        const balance = await this.billingService.getBalance(user.id);
        const tier = await this.billingService.getSubscriptionTier(user.id);
        const { BILLING_TIERS, FEATURE_TO_CATEGORY } = await import('./billing.constants');
        const tierConfig = BILLING_TIERS[tier] || BILLING_TIERS.FREE;
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const usage = await this.billingService.getMonthlyUsageByCategory(user.id, monthStart);
        const categoryUsage: Record<string, number> = {};
        for (const [feature, count] of Object.entries(usage)) {
            const category = FEATURE_TO_CATEGORY[feature] || feature;
            categoryUsage[category] = (categoryUsage[category] || 0) + count;
        }
        const credits = balance.balance || 0;
        return {
            balance: credits,
            credits,
            tier,
            categories: {
                artikel: { used: categoryUsage.ARTICLE_GENERATION || 0, limit: tierConfig.monthlyLimits.ARTICLE_GENERATION, label: 'Artikel' },
                instagram: { used: categoryUsage.INSTAGRAM_GENERATION || 0, limit: tierConfig.monthlyLimits.INSTAGRAM_GENERATION, label: 'IG Carousel' },
                videoLight: { used: categoryUsage.VIDEO_LIGHT || 0, limit: tierConfig.monthlyLimits.VIDEO_LIGHT, label: 'Video Light' },
                gambar: { used: categoryUsage.IMAGE_GENERATION || 0, limit: tierConfig.monthlyLimits.IMAGE_GENERATION, label: 'Gambar' },
                videoHeavy: { used: categoryUsage.VIDEO_HEAVY || 0, limit: tierConfig.monthlyLimits.VIDEO_HEAVY, label: 'Video Heavy' },
                motion: { used: categoryUsage.MOTION_RENDER || 0, limit: tierConfig.monthlyLimits.MOTION_RENDER, label: 'Motion Render' },
            },
        };
    }

    @Get('usage-breakdown')
    @ApiOperation({ summary: 'Get per-feature usage breakdown for current month' })
    async getUsageBreakdown(@CurrentUser() user: User) {
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const usage = await this.billingService.getMonthlyUsageByCategory(user.id, monthStart);
        const labels: Record<string, string> = {
            ARTICLE_GENERATION: 'Artikel',
            INSTAGRAM_GENERATION: 'IG Carousel',
            VIDEO_GENERATION: 'Video',
            IMAGE_GENERATION: 'Generate Gambar',
            AI_CHAT: 'AI Chat',
        };
        return {
            breakdown: Object.entries(usage)
                .filter(([, count]) => count > 0)
                .map(([feature, count]) => ({ feature, label: labels[feature] || feature, count }))
                .sort((a, b) => b.count - a.count),
        };
    }

    @Get('transactions')
    @ApiOperation({ summary: 'List transactions' })
    async getTransactions(
        @CurrentUser() user: User,
        @Query('page') page = 1,
        @Query('limit') limit = 20,
    ) {
        const safePage = Math.max(1, +page || 1);
        const safeLimit = Math.min(100, Math.max(1, +limit || 20));
        return this.billingService.getTransactions(user.id, safePage, safeLimit);
    }

    @Get('subscriptions')
    @ApiOperation({ summary: 'Get current subscription' })
    async getSubscription(@CurrentUser() user: User) {
        return this.billingService.getSubscription(user.id);
    }

    @Post('checkout')
    @ApiOperation({ summary: 'Create Stripe checkout session' })
    async createCheckoutSession(
        @CurrentUser() user: User,
        @Body() body: { priceId: string; mode: 'payment' | 'subscription'; tokens?: number; plan?: string },
    ) {
        return this.billingService.createCheckoutSession(
            user.id,
            body.priceId,
            body.mode,
            body.tokens,
            body.plan,
        );
    }

    // Stripe webhook - NO AUTH GUARD (Stripe needs to call this)
    @Post('webhooks/stripe')
    @UseGuards() // Override class-level guard
    @ApiOperation({ summary: 'Stripe webhook handler' })
    async handleStripeWebhook(
        @Req() req: RawBodyRequest<Request>,
        @Headers('stripe-signature') signature: string,
    ) {
        if (!this.stripe) {
            this.logger.error('Stripe not initialized');
            throw new BadRequestException('Stripe not configured');
        }

        const webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET');
        if (!webhookSecret) {
            this.logger.error('STRIPE_WEBHOOK_SECRET not set');
            throw new BadRequestException('Webhook secret not configured');
        }

        let event: Stripe.Event;

        try {
            // Verify webhook signature using raw body
            const rawBody = req.rawBody || JSON.stringify(req.body);
            event = this.stripe.webhooks.constructEvent(
                rawBody,
                signature,
                webhookSecret,
            );
        } catch (err: any) {
            this.logger.error(`Webhook signature verification failed: ${err.message}`);
            throw new BadRequestException('Webhook signature verification failed');
        }

        // Handle the event
        try {
            switch (event.type) {
                case 'checkout.session.completed':
                    await this.billingService.handleCheckoutSessionCompleted(
                        event.data.object as Stripe.Checkout.Session,
                    );
                    break;

                case 'invoice.payment_succeeded':
                    await this.billingService.handleInvoicePaymentSucceeded(
                        event.data.object as Stripe.Invoice,
                    );
                    break;

                case 'invoice.payment_failed':
                    await this.billingService.handleInvoicePaymentFailed(
                        event.data.object as Stripe.Invoice,
                    );
                    break;

                case 'customer.subscription.deleted':
                    await this.billingService.handleCustomerSubscriptionDeleted(
                        event.data.object as Stripe.Subscription,
                    );
                    break;

                default:
                    this.logger.log(`Unhandled event type: ${event.type}`);
            }

            return { received: true };
        } catch (err: any) {
            this.logger.error(`Error processing webhook: ${err.message}`);
            throw new InternalServerErrorException('Webhook processing failed');
        }
    }
}

