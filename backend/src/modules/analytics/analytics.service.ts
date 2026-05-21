import { Injectable } from '@nestjs/common';
import { eq, sql, and, gte, lte, between, desc, asc } from 'drizzle-orm';
import { DrizzleService } from '../../db/drizzle.service';
import {
  article,
  feed,
  wpSite,
  tokenBalance,
  transaction,
  subscription,
  contentAnalytics,
  instagramProject,
  scriptProject,
} from '../../db/schema';

@Injectable()
export class AnalyticsService {
  constructor(private drizzle: DrizzleService) { }

  get db() {
    return this.drizzle.db;
  }

  async getDashboardStats(userId: string) {
    // Get current subscription tier
    const sub = await this.db.query.subscription.findFirst({
      where: and(
        eq(subscription.userId, userId),
        eq(subscription.status, 'ACTIVE'),
      ),
      orderBy: (s, { desc }) => [desc(s.createdAt)],
    });

    const currentTier = sub?.plan || 'FREE';

    // Get counts in parallel
    const [
      [articles],
      [feeds],
      [wpSites],
      [publishedArticles],
      [carousels],
      [videoScripts],
      [totalViews],
      [totalEngagement],
    ] = await Promise.all([
      this.db
        .select({ count: sql<number>`count(*)` })
        .from(article)
        .where(eq(article.userId, userId)),
      this.db
        .select({ count: sql<number>`count(*)` })
        .from(feed)
        .where(eq(feed.userId, userId)),
      this.db
        .select({ count: sql<number>`count(*)` })
        .from(wpSite)
        .where(eq(wpSite.userId, userId)),
      this.db
        .select({ count: sql<number>`count(*)` })
        .from(article)
        .where(and(eq(article.userId, userId), eq(article.status, 'PUBLISHED'))),
      this.db
        .select({ count: sql<number>`count(*)` })
        .from(instagramProject)
        .where(eq(instagramProject.userId, userId)),
      this.db
        .select({ count: sql<number>`count(*)` })
        .from(scriptProject)
        .where(eq(scriptProject.userId, userId)),
      this.db
        .select({ sum: sql<number>`coalesce(sum(views), 0)` })
        .from(contentAnalytics)
        .where(eq(contentAnalytics.userId, userId)),
      this.db
        .select({ sum: sql<number>`coalesce(sum(engagement), 0)` })
        .from(contentAnalytics)
        .where(eq(contentAnalytics.userId, userId)),
    ]);

    let balance = await this.db.query.tokenBalance.findFirst({
      where: eq(tokenBalance.userId, userId),
    });

    if (!balance) {
      const [newBalance] = await this.db
        .insert(tokenBalance)
        .values({
          userId,
          balance: 10,
          totalPurchased: 0,
          totalUsed: 0,
        })
        .returning();
      balance = newBalance;
    }

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
        type: 'article_published',
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
      totalCarousels: Number(carousels.count),
      totalVideoScripts: Number(videoScripts.count),
      totalViews: Number(totalViews.sum),
      totalEngagement: Number(totalEngagement.sum),
      tokenBalance: balance.balance,
      currentTier,
      recentActivity: activity,
    };
  }

  async getContentPerformance(userId: string, days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get daily content creation stats
    const articles = await this.db.query.article.findMany({
      where: and(eq(article.userId, userId), gte(article.createdAt, startDate)),
      columns: {
        createdAt: true,
        status: true,
      },
    });

    // Get daily analytics
    const analytics = await this.db
      .select({
        date: contentAnalytics.date,
        views: sql<number>`sum(${contentAnalytics.views})`,
        clicks: sql<number>`sum(${contentAnalytics.clicks})`,
        engagement: sql<number>`sum(${contentAnalytics.engagement})`,
      })
      .from(contentAnalytics)
      .where(and(
        eq(contentAnalytics.userId, userId),
        gte(contentAnalytics.date, startDate)
      ))
      .groupBy(contentAnalytics.date)
      .orderBy(asc(contentAnalytics.date));

    // Group articles by date
    const articlesByDate = articles.reduce((acc, article) => {
      const date = new Date(article.createdAt).toISOString().split('T')[0];
      if (!acc[date]) acc[date] = { created: 0, published: 0 };
      acc[date].created++;
      if (article.status === 'PUBLISHED') acc[date].published++;
      return acc;
    }, {} as Record<string, { created: number; published: number }>);

    return {
      articlesByDate,
      analytics: analytics.map(a => ({
        date: a.date,
        views: Number(a.views),
        clicks: Number(a.clicks),
        engagement: Number(a.engagement),
      })),
    };
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

    // Group by date
    const grouped = transactions.reduce((acc, t) => {
      const date = new Date(t.createdAt).toISOString().split('T')[0];
      if (!acc[date]) acc[date] = 0;
      acc[date] += t.tokens;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(grouped).map(([date, tokens]) => ({
      date,
      tokens,
    }));
  }

  async getPlatformBreakdown(userId: string) {
    const platforms = await this.db
      .select({
        platform: contentAnalytics.platform,
        views: sql<number>`sum(${contentAnalytics.views})`,
        clicks: sql<number>`sum(${contentAnalytics.clicks})`,
        engagement: sql<number>`sum(${contentAnalytics.engagement})`,
      })
      .from(contentAnalytics)
      .where(eq(contentAnalytics.userId, userId))
      .groupBy(contentAnalytics.platform);

    return platforms.map(p => ({
      platform: p.platform || 'unknown',
      views: Number(p.views),
      clicks: Number(p.clicks),
      engagement: Number(p.engagement),
    }));
  }

  async getTopPerformingContent(userId: string, limit = 10) {
    const topContent = await this.db
      .select({
        contentType: contentAnalytics.contentType,
        contentId: contentAnalytics.contentId,
        totalViews: sql<number>`sum(${contentAnalytics.views})`,
        totalEngagement: sql<number>`sum(${contentAnalytics.engagement})`,
      })
      .from(contentAnalytics)
      .where(eq(contentAnalytics.userId, userId))
      .groupBy(contentAnalytics.contentType, contentAnalytics.contentId)
      .orderBy(desc(sql<number>`sum(${contentAnalytics.views})`))
      .limit(limit);

    return topContent.map(c => ({
      contentType: c.contentType,
      contentId: c.contentId,
      views: Number(c.totalViews),
      engagement: Number(c.totalEngagement),
    }));
  }

  async trackContentView(
    userId: string,
    contentType: string,
    contentId: string,
    platform?: string,
  ) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Try to update existing record
    const [updated] = await this.db
      .update(contentAnalytics)
      .set({
        views: sql`${contentAnalytics.views} + 1`,
        updatedAt: new Date(),
      })
      .where(and(
        eq(contentAnalytics.userId, userId),
        eq(contentAnalytics.contentType, contentType),
        eq(contentAnalytics.contentId, contentId),
        gte(contentAnalytics.date, today),
      ))
      .returning();

    if (!updated) {
      await this.db.insert(contentAnalytics).values({
        userId,
        contentType,
        contentId,
        date: today,
        views: 1,
        platform,
      });
    }

    return { success: true };
  }

  async trackContentEngagement(
    userId: string,
    contentType: string,
    contentId: string,
    engagementType: 'like' | 'comment' | 'share' | 'click',
    platform?: string,
  ) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const incrementField = engagementType === 'click' ? contentAnalytics.clicks : contentAnalytics.engagement;

    const [updated] = await this.db
      .update(contentAnalytics)
      .set({
        [engagementType === 'click' ? 'clicks' : 'engagement']: sql`${incrementField} + 1`,
        updatedAt: new Date(),
      })
      .where(and(
        eq(contentAnalytics.userId, userId),
        eq(contentAnalytics.contentType, contentType),
        eq(contentAnalytics.contentId, contentId),
        gte(contentAnalytics.date, today),
      ))
      .returning();

    if (!updated) {
      await this.db.insert(contentAnalytics).values({
        userId,
        contentType,
        contentId,
        date: today,
        [engagementType === 'click' ? 'clicks' : 'engagement']: 1,
        platform,
      });
    }

    return { success: true };
  }

  async exportAnalytics(userId: string, startDate: Date, endDate: Date, format: 'csv' | 'json' = 'json') {
    const analytics = await this.db
      .select()
      .from(contentAnalytics)
      .where(and(
        eq(contentAnalytics.userId, userId),
        between(contentAnalytics.date, startDate, endDate)
      ))
      .orderBy(desc(contentAnalytics.date));

    if (format === 'csv') {
      const headers = ['Date', 'Content Type', 'Content ID', 'Platform', 'Views', 'Clicks', 'Engagement'];
      const rows = analytics.map(a => [
        a.date.toISOString().split('T')[0],
        a.contentType,
        a.contentId,
        a.platform || '',
        a.views,
        a.clicks,
        a.engagement,
      ]);
      
      return {
        format: 'csv',
        data: [headers.join(','), ...rows.map(r => r.join(','))].join('\n'),
      };
    }

    return {
      format: 'json',
      data: analytics,
    };
  }
}
