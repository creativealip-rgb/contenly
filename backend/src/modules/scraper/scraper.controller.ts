import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AdvancedScraperService } from './advanced-scraper.service';

@ApiTags('scraper')
@Controller('scraper')
export class ScraperController {
    constructor(private advancedScraperService: AdvancedScraperService) { }

    @Post('scrape')
    @ApiOperation({ summary: 'Scrape article content from URL (3-tier extraction)' })
    async scrape(@Body() dto: { url: string }) {
        return this.advancedScraperService.scrapeArticle(dto.url);
    }
}
