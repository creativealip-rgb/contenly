import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { FeedPollerService } from './feed-poller.service';

@Processor('feed-polling')
export class FeedPollProcessor {
  private readonly logger = new Logger(FeedPollProcessor.name);

  constructor(private feedPollerService: FeedPollerService) {}

  @Process('poll-feed')
  async handlePollFeed(job: Job<{ feedId: string }>) {
    const { feedId } = job.data;
    this.logger.log(`Processing poll job for feed: ${feedId}`);

    try {
      const result = await this.feedPollerService.pollFeed(feedId);
      this.logger.log(
        `Successfully polled feed ${feedId}: ${result.newItems} new items, ${result.totalItems} total`,
      );
      return result;
    } catch (error) {
      this.logger.error(
        `Failed to poll feed ${feedId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      throw error;
    }
  }

  @Process('poll-all-feeds')
  async handlePollAllFeeds(job: Job) {
    this.logger.log('Processing poll-all-feeds job');

    try {
      await this.feedPollerService.pollAllActiveFeeds();
      this.logger.log('Successfully polled all active feeds');
    } catch (error) {
      this.logger.error(
        `Failed to poll all feeds: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      throw error;
    }
  }
}
