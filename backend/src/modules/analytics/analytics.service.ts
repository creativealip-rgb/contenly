import { Injectable } from '@nestjs/common';
import { eq, sql, and, gte } from 'drizzle-orm';
import { DrizzleService } from '../../db/drizzle.service';
import { article, feed, wpSite, tokenBalance, transaction } from '../../db/schema';

@Injectable()
export class AnalyticsService {
    constructor(private drizzle: DrizzleService) { }

    get db() {
        return this.drizzle.db;
    }

    async getDashboardStats(userId: string) {
        // Get counts
        const [articles] = await this.db
            .select({ count: sql<number>`count(*)` })
            .from(article)
            .where(eq(article.userId, userId));

        const [feeds] = await this.db
            .select({ count: sql<number>`count(*)` })
            .from(feed)
            .where(eq(feed.userId, userId));

        const [wpSites] = await this.db
            .select({ count: sql<number>`count(*)` })
            .from(wpSite)
            .where(eq(wpSite.userId, userId));

        const [publishedArticles] = await this.db
            .select({ count: sql<number>`count(*)` })
            .from(article)
            .where(and(eq(article.userId, userId), eq(article.status, 'PUBLISHED')));

        const balance = await this.db.query.tokenBalance.findFirst({
            where: eq(tokenBalance.userId, userId),
        });

        return {
            totalArticles: Number(articles.count),
            publishedArticles: Number(publishedArticles.count),
            activeFeeds: Number(feeds.count),
            connectedSites: Number(wpSites.count),
            tokenBalance: balance?.balance || 0,
        };
    }

    async getContentPerformance(userId: string, days = 30) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const articles = await this.db.query.article.findMany({
            where: and(
                eq(article.userId, userId),
                gte(article.createdAt, startDate),
            ),
            columns: {
                createdAt: true,
                status: true,
            },
        });

        return articles;
    }

    async getTokenUsage(userId: string, days = 30) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const transactions = await this.db.query.transaction.findMany({
            where: and(
                eq(transaction.userId, userId),
                eq(transaction.type, 'USAGE'),
                gte(transaction.createdAt, startDate),
            ),
            orderBy: (t, { asc }) => [asc(t.createdAt)],
        });

        return transactions;
    }
}
