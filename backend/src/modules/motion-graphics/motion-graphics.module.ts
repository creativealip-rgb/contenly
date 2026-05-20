import { Module, forwardRef } from '@nestjs/common';
import { MotionGraphicsController } from './motion-graphics.controller';
import { MotionGraphicsService } from './motion-graphics.service';
import { AuthModule } from '../auth/auth.module';
import { AiModule } from '../ai/ai.module';
import { BillingModule } from '../billing/billing.module';
import { VideoScriptModule } from '../video-script/video-script.module';

@Module({
  imports: [AuthModule, AiModule, BillingModule, forwardRef(() => VideoScriptModule)],
  controllers: [MotionGraphicsController],
  providers: [MotionGraphicsService],
  exports: [MotionGraphicsService],
})
export class MotionGraphicsModule {}
