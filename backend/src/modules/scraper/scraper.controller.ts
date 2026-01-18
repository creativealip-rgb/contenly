import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ScraperService } from './scraper.service';
import { ScrapeUrlDto } from './dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('scraper')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('scraper')
export class ScraperController {
    constructor(private scraperService: ScraperService) { }

    @Post('scrape')
    @ApiOperation({ summary: 'Scrape content from URL' })
    async scrape(@Body() dto: ScrapeUrlDto) {
        return this.scraperService.scrapeUrl(dto);
    }
}
