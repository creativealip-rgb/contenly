import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { eq, desc } from 'drizzle-orm';
import { DrizzleService } from '../../db/drizzle.service';
import { feed, feedItem } from '../../db/schema';
import { FeedPollerService } from './feed-poller.service';
import { BillingService } from '../billing/billing.service';
import { BILLING_TIERS } from '../billing/billing.constants';

@Injectable()
export class FeedsService {
  private readonly logger = new Logger(FeedsService.name);

  constructor(
    private drizzle: DrizzleService,
    private feedPoller: FeedPollerService,
    private billingService: BillingService,
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
      const tier = await this.billingService.getSubscriptionTier(userId);
      const tierConfig = BILLING_TIERS[tier];

      // Enforce sync rules
      let pollingInterval = data.pollingIntervalMinutes || 15;
      if (!tierConfig.canAutoSync) {
        pollingInterval = 0; // Disable auto-sync
      } else if (pollingInterval < tierConfig.minSyncInterval) {
        pollingInterval = tierConfig.minSyncInterval;
      }

      const [newFeed] = await this.db
        .insert(feed)
        .values({
          userId,
          name: data.name,
          url: data.url,
          pollingIntervalMinutes: pollingInterval,
        })
        .returning();

      this.logger.log(`Feed created in DB: ${newFeed?.id}`);

      // Trigger immediate poll for new feed
      try {
        await this.triggerPoll(newFeed.id);
      } catch (error: any) {
        this.logger.warn(`Could not trigger immediate poll: ${error.message}`);
      }

      // Schedule recurring polling if active and auto-sync is allowed
      if (newFeed.pollingIntervalMinutes > 0) {
        try {
          await this.scheduleFeedPolling(newFeed.id, newFeed.pollingIntervalMinutes);
        } catch (error: any) {
          this.logger.warn(`Could not schedule polling: ${error.message}`);
        }
      }

      return newFeed;
    } catch (error) {
      this.logger.error('Error creating feed:', error);
      throw error;
    }
  }

  async update(userId: string, id: string, data: { name?: string; url?: string; pollingIntervalMinutes?: number; status?: string }) {
    const tier = await this.billingService.getSubscriptionTier(userId);
    const tierConfig = BILLING_TIERS[tier];

    const updateData: any = { ...data };

    if (data.pollingIntervalMinutes !== undefined) {
      if (!tierConfig.canAutoSync) {
        updateData.pollingIntervalMinutes = 0;
      } else if (data.pollingIntervalMinutes < tierConfig.minSyncInterval) {
        updateData.pollingIntervalMinutes = tierConfig.minSyncInterval;
      }
    }

    const [updatedFeed] = await this.db
      .update(feed)
      .set({
        ...updateData,
        status: data.status as any,
        updatedAt: new Date(),
      })
      .where(eq(feed.id, id))
      .returning();

    // Re-schedule if interval changed
    if (updatedFeed.pollingIntervalMinutes > 0) {
      await this.scheduleFeedPolling(updatedFeed.id, updatedFeed.pollingIntervalMinutes);
    } else {
      await this.removeScheduledPolling(updatedFeed.id);
    }

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
    if (intervalMinutes <= 0) {
      this.logger.log(`Skipping scheduling for feed ${feedId} as interval is ${intervalMinutes}`);
      return;
    }

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
