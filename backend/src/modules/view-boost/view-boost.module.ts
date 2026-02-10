import { Module } from '@nestjs/common';
import { ViewBoostService } from './view-boost.service';
import { ViewBoostController } from './view-boost.controller';

@Module({
  controllers: [ViewBoostController],
  providers: [ViewBoostService],
  exports: [ViewBoostService],
})
export class ViewBoostModule {}
