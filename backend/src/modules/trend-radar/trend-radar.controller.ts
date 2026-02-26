import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { TrendRadarService } from './trend-radar.service';
import { SessionAuthGuard } from '../../common/guards/session-auth.guard';
import { BillingService } from '../billing/billing.service';
import { BILLING_TIERS } from '../billing/billing.constants';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { User } from '../../db/types';

@Controller('trend-radar')
@UseGuards(SessionAuthGuard)
export class TrendRadarController {
    constructor(
        private readonly trendRadarService: TrendRadarService,
        private readonly billingService: BillingService,
    ) { }

    @Get('search')
    async search(@Query('q') query: string) {
        return this.trendRadarService.searchTrends(query);
    }

    @Get('analyze')
    async analyze(@Query('url') url: string, @CurrentUser() user: User) {
        const tier = await this.billingService.getSubscriptionTier(user.id);
        const tierConfig = BILLING_TIERS[tier];

        console.log(`[TrendRadar] User: ${user.id}, Tier: ${tier}`);

        if (!tierConfig.canAnalyzeTrends) {
            throw new Error(`Analisis Tren mendalam hanya tersedia untuk paket PRO ke atas. Tier saat ini: ${tier}`);
        }

        return this.trendRadarService.analyzeTrend(url);
    }
}
