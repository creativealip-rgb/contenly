import { Injectable, Logger, ForbiddenException, NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { eq, desc, count } from 'drizzle-orm';
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

  async findAll(userId: string, page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    const [data, [{ total }]] = await Promise.all([
      this.db.query.feed.findMany({
        where: eq(feed.userId, userId),
        orderBy: [desc(feed.createdAt)],
        limit,
        offset,
      }),
      this.db.select({ total: count() }).from(feed).where(eq(feed.userId, userId)),
    ]);
    return { data, total, page, limit };
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
        await this.triggerPoll(userId, newFeed.id);
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

  async triggerPoll(userId: string, feedId: string) {
    // Verify ownership
    const feedRecord = await this.db.query.feed.findFirst({
      where: eq(feed.id, feedId),
    });
    if (!feedRecord) throw new NotFoundException('Feed not found');
    if (feedRecord.userId !== userId) throw new ForbiddenException('Access denied');

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
          // Prevent unbounded growth of completed/failed job records in Redis.
          // Without this, every poll iteration is kept forever (caused 500+ stale keys).
          removeOnComplete: 20,
          removeOnFail: 50,
        },
      );
    } catch (error: any) {
      this.logger.warn(`Could not schedule polling (Redis may be down): ${error.message}`);
    }
  }

  async removeScheduledPolling(feedId: string) {
    // Remove recurring job when feed is deleted.
    // NOTE: repeatable jobs are NOT removed by getJob().remove() — that only
    // deletes a single delayed instance, leaving the repeat scheduler alive so
    // it keeps firing "Feed not found" forever. Use removeRepeatableByKey().
    const recurringId = `feed-${feedId}-recurring`;
    try {
      const repeatables = await this.feedQueue.getRepeatableJobs();
      const matches = repeatables.filter((r) => r.id === recurringId);
      for (const r of matches) {
        await this.feedQueue.removeRepeatableByKey(r.key);
        this.logger.log(`Removed repeatable polling for feed ${feedId} (key: ${r.key})`);
      }

      // Clean up any leftover delayed/queued instance with this jobId
      const job = await this.feedQueue.getJob(recurringId);
      if (job) {
        await job.remove();
      }

      if (matches.length === 0) {
        this.logger.warn(`No repeatable job found for feed ${feedId} during removal`);
      }
    } catch (error: any) {
      this.logger.warn(`Could not remove scheduled polling: ${error.message}`);
    }
  }

  async parseFeedUrl(url: string) {
    const cheerio = await import('cheerio');
    const variations = [
      url,
      url.endsWith('/') ? `${url}feed/` : `${url}/feed/`,
      url.endsWith('/') ? `${url}rss/` : `${url}/rss/`,
      url.endsWith('/') ? `${url}atom.xml` : `${url}/atom.xml`,
    ];

    for (const targetUrl of variations) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        const response = await fetch(targetUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'application/rss+xml, application/xml, text/xml, */*'
          },
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        if (!response.ok) continue;
        const text = await response.text();
        if (!text.trim().startsWith('<')) continue;
        if (text.includes('<rss') || text.includes('<feed') || text.includes('<rdf:RDF')) {
          const $ = cheerio.load(text, { xmlMode: true });
          const items: any[] = [];
          $('item, entry').each((_, element) => {
            const el = $(element);
            const title = el.find('title').text();
            let link = el.find('link').text();
            if (!link) link = el.find('link[rel=\"alternate\"]').attr('href') || el.find('link').attr('href') || '';
            const description = el.find('description').text() || el.find('content').text() || el.find('summary').text() || '';
            const pubDate = el.find('pubDate').text() || el.find('date').text() || el.find('updated').text() || new Date().toISOString();
            if (title && link) {
              items.push({
                title: title.replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1').replace(/<[^>]*>/g, '').trim(),
                url: link.trim(),
                excerpt: description.replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1').replace(/<[^>]*>/g, '').trim().substring(0, 200) + '...',
                publishedAt: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
                id: link.trim() || Math.random().toString(36).substring(7),
              });
            }
          });
          if (items.length > 0) {
            return { success: true, items: items.slice(0, 20) };
          }
        }
      } catch (err: any) {
        this.logger.warn(`Feed parse failed for ${targetUrl}: ${err.message}`);
      }
    }
    return { success: false, error: 'Could not find a valid RSS feed at this URL', items: [] };
  }
}