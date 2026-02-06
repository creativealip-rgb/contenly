import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { SessionAuthGuard } from '../../common/guards/session-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { User } from '../../db/types';

@ApiTags('analytics')
@ApiBearerAuth()
@UseGuards(SessionAuthGuard)
@Controller('analytics')
export class AnalyticsController {
    constructor(private analyticsService: AnalyticsService) { }

    @Get('dashboard')
    @ApiOperation({ summary: 'Get dashboard stats' })
    async getDashboardStats(@CurrentUser() user: User) {
        return this.analyticsService.getDashboardStats(user.id);
    }

    @Get('content-performance')
    @ApiOperation({ summary: 'Get content performance metrics' })
    async getContentPerformance(
        @CurrentUser() user: User,
        @Query('days') days = 30,
    ) {
        return this.analyticsService.getContentPerformance(user.id, +days);
    }

    @Get('token-usage')
    @ApiOperation({ summary: 'Get token usage data' })
    async getTokenUsage(
        @CurrentUser() user: User,
        @Query('days') days = 30,
    ) {
        return this.analyticsService.getTokenUsage(user.id, +days);
    }
}
