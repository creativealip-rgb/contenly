import { Module } from '@nestjs/common';
import { WordpressController } from './wordpress.controller';
import { WordpressService } from './wordpress.service';
import { AuthModule } from '../auth/auth.module';
import { ArticlesModule } from '../articles/articles.module';
import { BillingModule } from '../billing/billing.module';

@Module({
  imports: [AuthModule, ArticlesModule, BillingModule],
  controllers: [WordpressController],
  providers: [WordpressService],
  exports: [WordpressService],
})
export class WordpressModule { }
