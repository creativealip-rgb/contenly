import { Injectable } from '@nestjs/common';
import { eq, desc } from 'drizzle-orm';
import { DrizzleService } from '../../db/drizzle.service';
import { feed, feedItem } from '../../db/schema';

@Injectable()
export class FeedsService {
    constructor(private drizzle: DrizzleService) { }

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

        return newFeed;
    }

    async delete(userId: string, id: string) {
        await this.db.delete(feed).where(eq(feed.id, id));
        return { message: 'Feed deleted' };
    }

    // Additional methods for feed polling would be implemented here
}
