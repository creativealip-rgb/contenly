import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ViewBoostService } from './view-boost.service';
import { ViewBoostController } from './view-boost.controller';
import { ViewBoostJob } from './entities/view-boost-job.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ViewBoostJob])],
  controllers: [ViewBoostController],
  providers: [ViewBoostService],
  exports: [ViewBoostService],
})
export class ViewBoostModule {}
