import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AdvancedScraperService } from './advanced-scraper.service';

@ApiTags('scraper')
// Temporarily disabled auth for testing - frontend Next.js API route calls this
// @ApiBearerAuth()
// @UseGuards(JwtAuthGuard)
@Controller('scraper')
export class ScraperController {
    constructor(private advancedScraperService: AdvancedScraperService) { }

    @Post('scrape')
    @ApiOperation({ summary: 'Scrape article content from URL (3-tier extraction)' })
    async scrape(@Body() dto: { url: string }) {
        return this.advancedScraperService.scrapeArticle(dto.url);
    }
}
