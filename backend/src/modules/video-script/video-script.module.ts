import { Module } from '@nestjs/common';
import { VideoScriptController } from './video-script.controller';
import { VideoScriptService } from './video-script.service';
import { AiModule } from '../ai/ai.module';
import { ScraperModule } from '../scraper/scraper.module';
import { AuthModule } from '../auth/auth.module';
import { AdvancedScraperService } from '../scraper/advanced-scraper.service';

@Module({
  imports: [AiModule, ScraperModule, AuthModule],
  controllers: [VideoScriptController],
  providers: [VideoScriptService, AdvancedScraperService],
  exports: [VideoScriptService],
})
export class VideoScriptModule { }
