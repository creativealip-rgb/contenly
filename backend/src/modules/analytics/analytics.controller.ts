import { Controller, Get, Query, UseGuards, Post, Body, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { SessionAuthGuard } from '../../common/guards/session-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { User } from '../../db/types';
import { Response } from 'express';

@ApiTags('analytics')
@ApiBearerAuth()
@UseGuards(SessionAuthGuard)
@Controller('analytics')
export class AnalyticsController {
  constructor(private analyticsService: AnalyticsService) {}

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
  async getTokenUsage(@CurrentUser() user: User, @Query('days') days = 30) {
    return this.analyticsService.getTokenUsage(user.id, +days);
  }

  @Get('platform-breakdown')
  @ApiOperation({ summary: 'Get platform breakdown analytics' })
  async getPlatformBreakdown(@CurrentUser() user: User) {
    return this.analyticsService.getPlatformBreakdown(user.id);
  }

  @Get('top-content')
  @ApiOperation({ summary: 'Get top performing content' })
  async getTopPerformingContent(
    @CurrentUser() user: User,
    @Query('limit') limit = 10,
  ) {
    return this.analyticsService.getTopPerformingContent(user.id, +limit);
  }

  @Post('track/view')
  @ApiOperation({ summary: 'Track content view' })
  async trackView(
    @CurrentUser() user: User,
    @Body() data: { contentType: string; contentId: string; platform?: string },
  ) {
    return this.analyticsService.trackContentView(
      user.id,
      data.contentType,
      data.contentId,
      data.platform,
    );
  }

  @Post('track/engagement')
  @ApiOperation({ summary: 'Track content engagement' })
  async trackEngagement(
    @CurrentUser() user: User,
    @Body() data: { 
      contentType: string; 
      contentId: string; 
      engagementType: 'like' | 'comment' | 'share' | 'click';
      platform?: string;
    },
  ) {
    return this.analyticsService.trackContentEngagement(
      user.id,
      data.contentType,
      data.contentId,
      data.engagementType,
      data.platform,
    );
  }

  @Get('export')
  @ApiOperation({ summary: 'Export analytics data' })
  async exportAnalytics(
    @CurrentUser() user: User,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('format') format: 'csv' | 'json' = 'json',
    @Res() res: Response,
  ) {
    const result = await this.analyticsService.exportAnalytics(
      user.id,
      new Date(startDate),
      new Date(endDate),
      format,
    );

    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="analytics-${startDate}-${endDate}.csv"`);
      res.send(result.data);
    } else {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="analytics-${startDate}-${endDate}.json"`);
      res.json(result.data);
    }
  }
}
