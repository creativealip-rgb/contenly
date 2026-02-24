import { Controller, Get, Post, Body, Query, UseGuards, Headers, Req, Logger, RawBodyRequest } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { BillingService } from './billing.service';
import { SessionAuthGuard } from '../../common/guards/session-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { User } from '../../db/types';
import Stripe from 'stripe';
import { Request } from 'express';

@ApiTags('billing')
@ApiBearerAuth()
@UseGuards(SessionAuthGuard)
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
    @ApiOperation({ summary: 'Get token balance' })
    async getBalance(@CurrentUser() user: User) {
        return this.billingService.getBalance(user.id);
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
    @UseGuards() // Override class-level guard
    @ApiOperation({ summary: 'Stripe webhook handler' })
    async handleStripeWebhook(
        @Req() req: RawBodyRequest<Request>,
        @Headers('stripe-signature') signature: string,
    ) {
        if (!this.stripe) {
            this.logger.error('Stripe not initialized');
            return { received: false, error: 'Stripe not configured' };
        }

        const webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET');
        if (!webhookSecret) {
            this.logger.error('STRIPE_WEBHOOK_SECRET not set');
            return { received: false, error: 'Webhook secret not configured' };
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
            return { received: false, error: err.message };
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
            return { received: false, error: err.message };
        }
    }
}
