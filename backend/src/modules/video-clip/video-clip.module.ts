import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { VideoClipController } from './video-clip.controller';
import { VideoClipService } from './video-clip.service';
import { VideoClipProcessor } from './video-clip.processor';
import { AuthModule } from '../auth/auth.module';
import { AiModule } from '../ai/ai.module';
import { BillingModule } from '../billing/billing.module';
import { SystemSettingsModule } from '../system-settings/system-settings.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { VideoScriptModule } from '../video-script/video-script.module';

@Module({
  imports: [
    AuthModule,
    AiModule,
    BillingModule,
    SystemSettingsModule,
    NotificationsModule,
    VideoScriptModule, // for reusing FootageService
    BullModule.registerQueue({ name: 'video-clip' }),
  ],
  controllers: [VideoClipController],
  providers: [VideoClipService, VideoClipProcessor],
  exports: [VideoClipService],
})
export class VideoClipModule {}
