import { Module } from '@nestjs/common';
import { ViewBoostService } from './view-boost.service';
import { ViewBoostController } from './view-boost.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [ViewBoostController],
  providers: [ViewBoostService],
  exports: [ViewBoostService],
})
export class ViewBoostModule { }
