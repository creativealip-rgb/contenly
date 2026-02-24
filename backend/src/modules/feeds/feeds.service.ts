import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { eq, desc } from 'drizzle-orm';
import { DrizzleService } from '../../db/drizzle.service';
import { feed, feedItem } from '../../db/schema';
import { FeedPollerService } from './feed-poller.service';

@Injectable()
export class FeedsService {
  private readonly logger = new Logger(FeedsService.name);

  constructor(
    private drizzle: DrizzleService,
    private feedPoller: FeedPollerService,
    @InjectQueue('feed-polling') private feedQueue: Queue,
  ) { }

  get db() {
    return this.drizzle.db;
  }

  async findAll(userId: string) {
    return this.db.query.feed.findMany({
      where: eq(feed.userId, userId),
      orderBy: [desc(feed.createdAt)],
    });
  }

  async create(userId: string, data: { name: string; url: string; pollingIntervalMinutes?: number }) {
    this.logger.log(`Creating feed for user: ${userId}, URL: ${data.url}`);
    try {
      const [newFeed] = await this.db
        .insert(feed)
        .values({
          userId,
          name: data.name,
          url: data.url,
          pollingIntervalMinutes: data.pollingIntervalMinutes || 15,
        })
        .returning();

      this.logger.log(`Feed created in DB: ${newFeed?.id}`);

      // Trigger immediate poll for new feed
      try {
        await this.triggerPoll(newFeed.id);
      } catch (error: any) {
        this.logger.warn(`Could not trigger immediate poll: ${error.message}`);
      }

      // Schedule recurring polling
      try {
        await this.scheduleFeedPolling(newFeed.id, newFeed.pollingIntervalMinutes);
      } catch (error: any) {
        this.logger.warn(`Could not schedule polling: ${error.message}`);
      }

      return newFeed;
    } catch (error) {
      this.logger.error('Error creating feed:', error);
      throw error;
    }
  }

  async update(userId: string, id: string, data: { name?: string; url?: string; pollingIntervalMinutes?: number; status?: string }) {
    const [updatedFeed] = await this.db
      .update(feed)
      .set({
        ...data,
        status: data.status as any,
        updatedAt: new Date(),
      })
      .where(eq(feed.id, id))
      .returning();
    return updatedFeed;
  }

  async delete(userId: string, id: string) {
    // Remove scheduled polling job before deleting
    try {
      await this.removeScheduledPolling(id);
    } catch (error: any) {
      this.logger.warn(`Could not remove scheduled polling: ${error.message}`);
    }

    await this.db.delete(feed).where(eq(feed.id, id));
    return { message: 'Feed deleted' };
  }

  async triggerPoll(feedId: string) {
    // Add job to queue for immediate processing
    this.logger.log(`Triggering immediate poll for feed: ${feedId}`);
    try {
      await this.feedQueue.add('poll-feed', { feedId }, { priority: 1 });
    } catch (error: any) {
      this.logger.warn(`Queue error (triggerPoll): ${error.message}. Attempting direct poll.`);
      // Fallback to direct poll if Redis is down
      return await this.feedPoller.pollFeed(feedId);
    }
  }

  async scheduleFeedPolling(feedId: string, intervalMinutes: number) {
    // Schedule recurring job based on pollingIntervalMinutes
    this.logger.log(`Scheduling recurring poll for feed ${feedId} every ${intervalMinutes} minutes`);
    try {
      await this.feedQueue.add(
        'poll-feed',
        { feedId },
        {
          repeat: {
            every: intervalMinutes * 60 * 1000, // Convert minutes to milliseconds
          },
          jobId: `feed-${feedId}-recurring`, // Unique ID to prevent duplicates
        },
      );
    } catch (error: any) {
      this.logger.warn(`Could not schedule polling (Redis may be down): ${error.message}`);
    }
  }

  async removeScheduledPolling(feedId: string) {
    // Remove recurring job when feed is deleted
    try {
      const job = await this.feedQueue.getJob(`feed-${feedId}-recurring`);
      if (job) {
        await job.remove();
        this.logger.log(`Removed scheduled polling for feed: ${feedId}`);
      }
    } catch (error: any) {
      this.logger.warn(`Could not remove scheduled polling: ${error.message}`);
    }
  }
}
