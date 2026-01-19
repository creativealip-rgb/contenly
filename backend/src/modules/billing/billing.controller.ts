import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { BillingService } from './billing.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { User } from '../../db/types';

@ApiTags('billing')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('billing')
export class BillingController {
    constructor(private billingService: BillingService) { }

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

    // Stripe webhook would be handled separately
    @Post('webhooks/stripe')
    @ApiOperation({ summary: 'Stripe webhook handler' })
    async handleStripeWebhook(@Body() body: unknown) {
        // Handle Stripe webhooks (subscription created, payment succeeded, etc.)
        // This would verify the webhook signature and process events
        return { received: true };
    }
}
