import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { eq, desc, and } from 'drizzle-orm';
import { DrizzleService } from '../../db/drizzle.service';
import { feed, feedItem } from '../../db/schema';

@Injectable()
export class FeedsService {
  constructor(
    private drizzle: DrizzleService,
    @InjectQueue('feed-polling') private feedQueue: Queue,
  ) {}

  get db() {
    return this.drizzle.db;
  }

  async findAll(userId: string) {
    return this.db.query.feed.findMany({
      where: eq(feed.userId, userId),
      orderBy: [desc(feed.createdAt)],
    });
  }

  async create(
    userId: string,
    data: { name: string; url: string; pollingIntervalMinutes?: number },
  ) {
    console.log(
      '[FeedsService] Creating feed for user:',
      userId,
      'Data:',
      data,
    );
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

      console.log('[FeedsService] Feed created in DB:', newFeed?.id);

      // Trigger immediate poll for new feed (optional - depends on Redis/Bull)
      try {
        await this.triggerPoll(newFeed.id);
      } catch (error) {
        console.warn(
          '[FeedsService] Could not trigger poll (Redis may not be running):',
          error.message,
        );
      }

      // Schedule recurring polling (optional - depends on Redis/Bull)
      try {
        await this.scheduleFeedPolling(
          newFeed.id,
          newFeed.pollingIntervalMinutes,
        );
      } catch (error) {
        console.warn(
          '[FeedsService] Could not schedule polling (Redis may not be running):',
          error.message,
        );
      }

      return newFeed;
    } catch (error) {
      console.error('[FeedsService] Error creating feed:', error);
      throw error;
    }
  }

  async delete(userId: string, id: string) {
    await this.db.delete(feed).where(eq(feed.id, id));
    return { message: 'Feed deleted' };
  }

  async update(
    userId: string,
    id: string,
    data: { name?: string; url?: string; pollingIntervalMinutes?: number },
  ) {
    const existingFeed = await this.db.query.feed.findFirst({
      where: eq(feed.id, id),
    });

    if (!existingFeed) {
      throw new Error('Feed not found');
    }

    if (existingFeed.userId !== userId) {
      throw new Error('Unauthorized');
    }

    const [updated] = await this.db
      .update(feed)
      .set({
        ...(data.name && { name: data.name }),
        ...(data.url && { url: data.url }),
        ...(data.pollingIntervalMinutes !== undefined && {
          pollingIntervalMinutes: data.pollingIntervalMinutes,
        }),
        updatedAt: new Date(),
      })
      .where(eq(feed.id, id))
      .returning();

    return updated;
  }

  async updateStatus(userId: string, id: string, status: 'ACTIVE' | 'PAUSED') {
    const existingFeed = await this.db.query.feed.findFirst({
      where: eq(feed.id, id),
    });

    if (!existingFeed) {
      throw new Error('Feed not found');
    }

    if (existingFeed.userId !== userId) {
      throw new Error('Unauthorized');
    }

    const [updated] = await this.db
      .update(feed)
      .set({
        status: status as any,
        updatedAt: new Date(),
      })
      .where(eq(feed.id, id))
      .returning();

    return updated;
  }

  async triggerPoll(feedId: string) {
    // Add job to queue for immediate polling
    await this.feedQueue.add('poll-feed', { feedId });
  }

  async scheduleFeedPolling(feedId: string, intervalMinutes: number) {
    // Schedule recurring job based on pollingIntervalMinutes
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
  }

  async getPendingItems(userId: string) {
    const feeds = await this.db.query.feed.findMany({
      where: eq(feed.userId, userId),
      columns: { id: true, name: true },
    });

    const feedIds = feeds.map((f) => f.id);

    if (feedIds.length === 0) return [];

    return this.db.query.feedItem.findMany({
      where: and(eq(feedItem.status, 'PENDING')),
      orderBy: [desc(feedItem.fetchedAt)],
      with: {
        feed: {
          columns: { name: true },
        },
      },
    });
  }

  async processPendingItem(userId: string, feedItemId: string) {
    const item = await this.db.query.feedItem.findFirst({
      where: eq(feedItem.id, feedItemId),
      with: {
        feed: true,
      },
    });

    if (!item) {
      throw new Error('Feed item not found');
    }

    if (item.feed.userId !== userId) {
      throw new Error('Unauthorized');
    }

    if (item.status !== 'PENDING') {
      throw new Error('Feed item is not pending');
    }

    // Update status to PROCESSING
    await this.db
      .update(feedItem)
      .set({ status: 'PROCESSING' })
      .where(eq(feedItem.id, feedItemId));

    // In a real implementation, this would:
    // 1. Fetch full content from URL
    // 2. Use AI to generate rewritten content
    // 3. Create an article
    // 4. Update feedItem status to PROCESSED

    // For now, just update status to PROCESSED
    await this.db
      .update(feedItem)
      .set({ status: 'PROCESSED' })
      .where(eq(feedItem.id, feedItemId));

    return { message: 'Feed item processed successfully' };
  }
}
