import { Module } from '@nestjs/common';
import { ScraperController } from './scraper.controller';
import { ScraperService } from './scraper.service';
import { AdvancedScraperService } from './advanced-scraper.service';

@Module({
    controllers: [ScraperController],
    providers: [ScraperService, AdvancedScraperService],
    exports: [ScraperService, AdvancedScraperService],
})
export class ScraperModule { }
