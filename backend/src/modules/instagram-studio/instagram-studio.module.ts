import { Module } from '@nestjs/common';
import { InstagramStudioController } from './instagram-studio.controller';
import { InstagramStudioService } from './instagram-studio.service';
import { StoryboardService } from './services/storyboard.service';
import { FontService } from './services/font.service';
import { ExportService } from './services/export.service';
import { ImageTextService } from './services/image-text.service';
import { DrizzleModule } from '../../db/drizzle.module';
import { AiModule } from '../ai/ai.module';
import { BillingModule } from '../billing/billing.module';
import { ScraperModule } from '../scraper/scraper.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [DrizzleModule, AiModule, BillingModule, ScraperModule, AuthModule],
  controllers: [InstagramStudioController],
  providers: [
    InstagramStudioService,
    StoryboardService,
    FontService,
    ExportService,
    ImageTextService,
  ],
  exports: [InstagramStudioService],
})
export class InstagramStudioModule { }
