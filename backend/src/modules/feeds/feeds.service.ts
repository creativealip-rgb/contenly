import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { eq, desc } from 'drizzle-orm';
import { DrizzleService } from '../../db/drizzle.service';
import { feed, feedItem } from '../../db/schema';

@Injectable()
export class FeedsService {
    constructor(
        private drizzle: DrizzleService,
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
        const [newFeed] = await this.db
            .insert(feed)
            .values({
                userId,
                name: data.name,
                url: data.url,
                pollingIntervalMinutes: data.pollingIntervalMinutes || 15,
            })
            .returning();

        // Trigger immediate poll for new feed (optional - depends on Redis/Bull)
        try {
            await this.triggerPoll(newFeed.id);
        } catch (error) {
            console.warn('[FeedsService] Could not trigger poll (Redis may not be running):', error.message);
        }

        // Schedule recurring polling (optional - depends on Redis/Bull)  
        try {
            await this.scheduleFeedPolling(newFeed.id, newFeed.pollingIntervalMinutes);
        } catch (error) {
            console.warn('[FeedsService] Could not schedule polling (Redis may not be running):', error.message);
        }

        return newFeed;
    }

    async delete(userId: string, id: string) {
        await this.db.delete(feed).where(eq(feed.id, id));
        return { message: 'Feed deleted' };
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
            }
        );
    }
}
