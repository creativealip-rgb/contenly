import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { TrendRadarService } from './trend-radar.service';
import { SessionAuthGuard } from '../../common/guards/session-auth.guard';

@Controller('trend-radar')
@UseGuards(SessionAuthGuard)
export class TrendRadarController {
    constructor(private readonly trendRadarService: TrendRadarService) { }

    @Get('search')
    async search(@Query('q') query: string) {
        return this.trendRadarService.searchTrends(query);
    }

    @Get('analyze')
    async analyze(@Query('url') url: string) {
        return this.trendRadarService.analyzeTrend(url);
    }
}
