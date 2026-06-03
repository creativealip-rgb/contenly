import { Controller, Get, Post, Body, Query, UseGuards, UseInterceptors, Headers, Req, Logger, RawBodyRequest, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { BillingService } from './billing.service';
import { MidtransService } from './midtrans.service';
import { SessionAuthGuard } from '../../common/guards/session-auth.guard';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuditInterceptor } from '../../common/interceptors/audit.interceptor';
import type { User } from '../../db/types';
import Stripe from 'stripe';
import { SkipThrottle } from '@nestjs/throttler';
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
        private midtransService: MidtransService,
    ) {
        const stripeSecretKey = this.configService.get<string>('STRIPE_SECRET_KEY');
        if (stripeSecretKey) {
            this.stripe = new Stripe(stripeSecretKey);
        }
    }

    @Get('balance')
    @ApiOperation({ summary: 'Get token balance with per-category limits' })
    async getBalance(@CurrentUser() user: User) {
        const balance = await this.billingService.getBalance(user.id);
        const tier = await this.billingService.getSubscriptionTier(user.id);
        const { BILLING_TIERS } = await import('./billing.constants');
        const tierConfig = BILLING_TIERS[tier] || BILLING_TIERS.FREE;
        
        // Get current month usage per category
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const usage = await this.billingService.getMonthlyUsageByCategory(user.id, monthStart);
        
        return {
            ...balance,
            tier,
            categories: {
                artikel: {
                    used: usage.ARTICLE_GENERATION || 0,
                    limit: tierConfig.monthlyLimits.ARTICLE_GENERATION,
                    label: 'Artikel',
                },
                generate: {
                    used: (usage.VIDEO_GENERATION || 0) + (usage.STORYBOARD_GENERATION || 0),
                    limit: tierConfig.monthlyLimits.VIDEO_GENERATION,
                    label: 'Generate',
                },
                gambar: {
                    used: (usage.IMAGE_GENERATION || 0) + (usage.SLIDE_IMAGE || 0) + (usage.THUMBNAIL_GENERATION || 0),
                    limit: tierConfig.monthlyLimits.IMAGE_GENERATION || tierConfig.monthlyLimits.ARTICLE_GENERATION,
                    label: 'Gambar',
                },
            },
        };
    }

    @Get('transactions')
    @ApiOperation({ summary: 'List transactions' })
    async getTransactions(
        @CurrentUser() user: User,
        @Query('page') page = 1,
        @Query('limit') limit = 20,
    ) {
        return this.billingService.getTransactions(user.id, +page, +limit);
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
    @Public() // Stripe webhooks have no user session; verified via signature instead
    @SkipThrottle() // Stripe can burst events; don't rate-limit the webhook
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
    // ==========================================
    // MIDTRANS ENDPOINTS
    // ==========================================

    @Post('midtrans/checkout')
    @ApiOperation({ summary: 'Create Midtrans Snap checkout session' })
    async createMidtransCheckout(
        @CurrentUser() user: User,
        @Body() body: { plan: 'STARTER' | 'PRO' | 'BUSINESS' },
    ) {
        return this.midtransService.createSnapToken(
            user.id,
            user.email,
            user.name || 'User',
            body.plan,
        );
    }

    @Post('webhooks/midtrans')
    @Public()
    @SkipThrottle()
    @ApiOperation({ summary: 'Midtrans notification webhook' })
    async handleMidtransWebhook(@Body() notification: any) {
        return this.midtransService.handleNotification(notification);
    }
}