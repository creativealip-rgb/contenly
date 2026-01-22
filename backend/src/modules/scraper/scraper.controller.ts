import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AdvancedScraperService } from './advanced-scraper.service';
import { SessionAuthGuard } from '../../common/guards/session-auth.guard';

@ApiTags('scraper')
@ApiBearerAuth()
@UseGuards(SessionAuthGuard)
@Controller('scraper')
export class ScraperController {
    constructor(private advancedScraperService: AdvancedScraperService) { }

    @Post('scrape')
    @ApiOperation({ summary: 'Scrape article content from URL (3-tier extraction)' })
    async scrape(@Body() dto: { url: string }) {
        return this.advancedScraperService.scrapeArticle(dto.url);
    }
}
