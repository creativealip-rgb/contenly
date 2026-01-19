import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { FeedsController } from './feeds.controller';
import { FeedsService } from './feeds.service';
import { FeedPollerService } from './feed-poller.service';
import { FeedPollProcessor } from './feed-poll.processor';

@Module({
    imports: [
        BullModule.registerQueue({
            name: 'feed-polling',
        }),
    ],
    controllers: [FeedsController],
    providers: [FeedsService, FeedPollerService, FeedPollProcessor],
    exports: [FeedsService],
})
export class FeedsModule { }
