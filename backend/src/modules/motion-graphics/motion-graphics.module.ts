import { Module } from '@nestjs/common';
import { MotionGraphicsController } from './motion-graphics.controller';
import { MotionGraphicsService } from './motion-graphics.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [MotionGraphicsController],
  providers: [MotionGraphicsService],
  exports: [MotionGraphicsService],
})
export class MotionGraphicsModule {}
