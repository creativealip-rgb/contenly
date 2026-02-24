import { Injectable } from '@nestjs/common';
import { eq, sql, and, gte } from 'drizzle-orm';
import { DrizzleService } from '../../db/drizzle.service';
import {
  article,
  feed,
  wpSite,
  tokenBalance,
  transaction,
} from '../../db/schema';

@Injectable()
export class AnalyticsService {
  constructor(private drizzle: DrizzleService) {}

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

    let balance = await this.db.query.tokenBalance.findFirst({
      where: eq(tokenBalance.userId, userId),
    });

    if (!balance) {
      // Create initial balance if not exists (sync with BillingService logic)
      const [newBalance] = await this.db
        .insert(tokenBalance)
        .values({
          userId,
          balance: 10, // Default free trial tokens
          totalPurchased: 0,
          totalUsed: 0,
        })
        .returning();
      balance = newBalance;
    }

    console.log('Dashboard Stats Debug:', {
      userId,
      articlesCount: articles.count,
      feedsCount: feeds.count,
      sitesCount: wpSites.count,
      tokenBalance: balance,
    });

    // Get recent activity
    const recentArticles = await this.db.query.article.findMany({
      where: eq(article.userId, userId),
      orderBy: (t, { desc }) => [desc(t.createdAt)],
      limit: 5,
    });

    const recentFeeds = await this.db.query.feed.findMany({
      where: eq(feed.userId, userId),
      orderBy: (t, { desc }) => [desc(t.createdAt)],
      limit: 5,
    });

    const recentSites = await this.db.query.wpSite.findMany({
      where: eq(wpSite.userId, userId),
      orderBy: (t, { desc }) => [desc(t.createdAt)],
      limit: 5,
    });

    const recentTransactions = await this.db.query.transaction.findMany({
      where: eq(transaction.userId, userId),
      orderBy: (t, { desc }) => [desc(t.createdAt)],
      limit: 5,
    });

    const activity = [
      ...recentArticles.map((a) => ({
        id: a.id,
        type: 'article_published', // or 'article_created'
        title: a.title,
        description: a.status === 'PUBLISHED' ? 'Published' : 'Draft created',
        timestamp: a.createdAt,
      })),
      ...recentFeeds.map((f) => ({
        id: f.id,
        type: 'feed_added',
        title: f.name,
        description: 'RSS Feed added',
        timestamp: f.createdAt,
      })),
      ...recentSites.map((s) => ({
        id: s.id,
        type: 'site_connected',
        title: s.name,
        description: 'WordPress site connected',
        timestamp: s.createdAt,
      })),
      ...recentTransactions.map((t) => ({
        id: t.id,
        type: 'tokens_purchased',
        title: `${t.tokens} Tokens`,
        description: t.type === 'PURCHASE' ? 'Purchased' : 'Used',
        timestamp: t.createdAt,
      })),
    ]
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      )
      .slice(0, 5);

    return {
      totalArticles: Number(articles.count),
      publishedArticles: Number(publishedArticles.count),
      activeFeeds: Number(feeds.count),
      connectedSites: Number(wpSites.count),
      tokenBalance: balance.balance,
      recentActivity: activity,
    };
  }

  async getContentPerformance(userId: string, days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const articles = await this.db.query.article.findMany({
      where: and(eq(article.userId, userId), gte(article.createdAt, startDate)),
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
