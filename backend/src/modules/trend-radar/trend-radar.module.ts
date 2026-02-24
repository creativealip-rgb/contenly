import { Module } from '@nestjs/common';
import { TrendRadarService } from './trend-radar.service';
import { TrendRadarController } from './trend-radar.controller';
import { AiModule } from '../ai/ai.module';
import { ScraperModule } from '../scraper/scraper.module';
import { AuthModule } from '../auth/auth.module';
import { BillingModule } from '../billing/billing.module';

@Module({
    imports: [AiModule, ScraperModule, AuthModule, BillingModule],
    controllers: [TrendRadarController],
    providers: [TrendRadarService],
})
export class TrendRadarModule { }
