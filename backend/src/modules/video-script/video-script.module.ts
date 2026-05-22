import { Module } from '@nestjs/common';
import { VideoScriptController } from './video-script.controller';
import { VideoScriptService } from './video-script.service';
import { FootageService } from './footage.service';
import { DrizzleModule } from '../../db/drizzle.module';
import { AiModule } from '../ai/ai.module';
import { BillingModule } from '../billing/billing.module';
import { ScraperModule } from '../scraper/scraper.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [DrizzleModule, AiModule, BillingModule, ScraperModule, AuthModule],
  controllers: [VideoScriptController],
  providers: [VideoScriptService, FootageService],
  exports: [VideoScriptService, FootageService],
})
export class VideoScriptModule { }
