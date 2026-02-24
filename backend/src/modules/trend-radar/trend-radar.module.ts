import { Module } from '@nestjs/common';
import { TrendRadarService } from './trend-radar.service';
import { TrendRadarController } from './trend-radar.controller';
import { AiModule } from '../ai/ai.module';
import { ScraperModule } from '../scraper/scraper.module';
import { AuthModule } from '../auth/auth.module';

@Module({
    imports: [AiModule, ScraperModule, AuthModule],
    controllers: [TrendRadarController],
    providers: [TrendRadarService],
})
export class TrendRadarModule { }
