import { Module, forwardRef } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { MotionGraphicsController } from './motion-graphics.controller';
import { MotionGraphicsService } from './motion-graphics.service';
import { RenderProcessor } from './render.processor';
import { RenderCleanupService } from './render-cleanup.service';
import { AuthModule } from '../auth/auth.module';
import { AiModule } from '../ai/ai.module';
import { BillingModule } from '../billing/billing.module';
import { VideoScriptModule } from '../video-script/video-script.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    AuthModule,
    AiModule,
    BillingModule,
    forwardRef(() => VideoScriptModule),
    NotificationsModule,
    BullModule.registerQueue({ name: 'render' }),
  ],
  controllers: [MotionGraphicsController],
  providers: [MotionGraphicsService, RenderProcessor, RenderCleanupService],
  exports: [MotionGraphicsService],
})
export class MotionGraphicsModule {}
