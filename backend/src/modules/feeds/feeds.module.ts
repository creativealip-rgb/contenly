import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { FeedsController } from './feeds.controller';
import { FeedsService } from './feeds.service';
import { FeedPollerService } from './feed-poller.service';
import { FeedPollProcessor } from './feed-poll.processor';
import { AuthModule } from '../auth/auth.module';
import { BillingModule } from '../billing/billing.module';

@Module({
  imports: [
    AuthModule,
    BillingModule,
    BullModule.registerQueue({
      name: 'feed-polling',
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
        timeout: 120000,
        removeOnComplete: 100,
        removeOnFail: 500,
      },
    }),
  ],
  controllers: [FeedsController],
  providers: [FeedsService, FeedPollerService, FeedPollProcessor],
  exports: [FeedsService],
})
export class FeedsModule { }
