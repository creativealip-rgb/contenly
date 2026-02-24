import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { eq, and, ilike, or, sql, desc } from 'drizzle-orm';
import { DrizzleService } from '../../db/drizzle.service';
import { article, wpSite } from '../../db/schema';
import { CreateArticleDto, UpdateArticleDto } from './dto';
import { validate as uuidValidate } from 'uuid';
import { ArticleStatus, ArticleUpdateData } from '../../db/types';

@Injectable()
export class ArticlesService {
  private readonly logger = new Logger(ArticlesService.name);

  constructor(private drizzle: DrizzleService) { }

  get db() {
    return this.drizzle.db;
  }

  async findAll(
    userId: string,
    query: {
      page?: number;
      limit?: number;
      status?: string;
      wpSiteId?: string;
      search?: string;
    },
  ) {
    const { page = 1, limit = 20, status, wpSiteId, search } = query;
    const offset = (page - 1) * limit;

    // Build where conditions
    const conditions = [eq(article.userId, userId)];
    if (status) conditions.push(eq(article.status, status as ArticleStatus));
    if (wpSiteId) conditions.push(eq(article.wpSiteId, wpSiteId));

    // Fetch articles without relational queries to avoid Drizzle ORM issues in some environments
    const articlesData = await this.db
      .select()
      .from(article)
      .where(
        search
          ? and(
            ...conditions,
            or(
              ilike(article.title, `%${search}%`),
              ilike(article.generatedContent, `%${search}%`),
            ),
          )
          : and(...conditions)
      )
      .orderBy(desc(article.createdAt))
      .limit(limit)
      .offset(offset);

    // Fetch wpSite data separately for articles that have wpSiteId
    const wpSiteIds = articlesData
      .filter(a => a.wpSiteId)
      .map(a => a.wpSiteId);

    let wpSitesData: any[] = [];
    if (wpSiteIds.length > 0) {
      wpSitesData = await this.db
        .select({
          id: wpSite.id,
          name: wpSite.name,
          url: wpSite.url,
        })
        .from(wpSite)
        .where(eq(wpSite.id, wpSiteIds[0]));

      // For multiple IDs, we need to query each one separately or use OR conditions
      if (wpSiteIds.length > 1) {
        for (let i = 1; i < wpSiteIds.length; i++) {
          const additionalSites = await this.db
            .select({
              id: wpSite.id,
              name: wpSite.name,
              url: wpSite.url,
            })
            .from(wpSite)
            .where(eq(wpSite.id, wpSiteIds[i]));
          wpSitesData.push(...additionalSites);
        }
      }
    }

    // Merge articles with their wpSite data
    const mergedArticles = articlesData.map(art => ({
      ...art,
      wpSite: wpSitesData.find(ws => ws.id === art.wpSiteId) || null,
    }));

    // Get total count
    const [{ count }] = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(article)
      .where(and(...conditions));

    return {
      data: mergedArticles,
      meta: { total: Number(count), page, limit, totalPages: Math.ceil(Number(count) / limit) },
    };
  }

  async findById(userId: string, id: string) {
    // Fetch article without relational queries
    const result = await this.db
      .select()
      .from(article)
      .where(and(eq(article.id, id), eq(article.userId, userId)))
      .limit(1);

    if (!result || result.length === 0) {
      throw new NotFoundException('Article not found');
    }

    const articleData = result[0];

    // Fetch wpSite separately if exists
    let wpSiteData = null;
    if (articleData.wpSiteId) {
      const wpSiteResult = await this.db
        .select()
        .from(wpSite)
        .where(eq(wpSite.id, articleData.wpSiteId))
        .limit(1);
      wpSiteData = wpSiteResult[0] || null;
    }

    return {
      ...articleData,
      wpSite: wpSiteData,
    };
  }

  async create(userId: string, dto: CreateArticleDto) {
    const [newArticle] = await this.db
      .insert(article)
      .values({
        userId,
        sourceUrl: dto.sourceUrl,
        originalContent: dto.originalContent,
        generatedContent: dto.generatedContent,
        title: dto.title,
        metaTitle: dto.metaTitle,
        metaDescription: dto.metaDescription,
        slug: dto.slug,
        status: (dto.status as ArticleStatus) || 'DRAFT',
        wpPostId: dto.wpPostId,
        wpPostUrl: dto.wpPostUrl,
        wpSiteId: dto.wpSiteId,
        feedItemId: dto.feedItemId,
        tokensUsed: dto.tokensUsed || 0,
      })
      .returning();

    return newArticle;
  }

  async update(userId: string, id: string, dto: UpdateArticleDto) {
    this.logger.log(`Attempting update for article ${id} (User: ${userId})`);
    await this.findById(userId, id);

    const updateData: ArticleUpdateData = {
      title: dto.title,
      generatedContent: dto.generatedContent,
      originalContent: dto.originalContent,
      sourceUrl: dto.sourceUrl,
      metaTitle: dto.metaTitle,
      metaDescription: dto.metaDescription,
      slug: dto.slug,
      featuredImageUrl: dto.featuredImageUrl,
      wpPostId: dto.wpPostId,
      wpPostUrl: dto.wpPostUrl,
      wpSiteId: dto.wpSiteId,
      tokensUsed: dto.tokensUsed,
      updatedAt: new Date(),
    };

    // Validate feedItemId is a proper UUID if provided
    if (dto.feedItemId !== undefined) {
      if (dto.feedItemId === null || dto.feedItemId === '' || !uuidValidate(dto.feedItemId)) {
        if (dto.feedItemId) {
          this.logger.warn(`Ignoring invalid feedItemId UUID: ${dto.feedItemId}`);
        }
      } else {
        updateData.feedItemId = dto.feedItemId;
      }
    }

    // Ensure status is correctly typed for enum
    if (dto.status) {
      updateData.status = dto.status as ArticleStatus;
    }

    this.logger.log(`Fields to update: ${Object.keys(updateData).join(', ')}`);

    try {
      const [updated] = await this.db
        .update(article)
        .set(updateData)
        .where(and(eq(article.id, id), eq(article.userId, userId)))
        .returning();

      if (!updated) {
        this.logger.error(`Update successful but no record returned for ID ${id}`);
      } else {
        this.logger.log(`Update successful. New Status: ${updated.status}`);
      }

      return updated;
    } catch (error: any) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Update query failed: ${message}`);
      throw error;
    }
  }

  async delete(userId: string, id: string) {
    await this.findById(userId, id);
    await this.db.delete(article).where(eq(article.id, id));
    return { message: 'Article deleted' };
  }

  async updateStatus(id: string, status: ArticleStatus, wpData?: { wpPostId: string; wpPostUrl: string }) {
    const [updated] = await this.db
      .update(article)
      .set({
        status,
        ...(wpData && {
          wpPostId: wpData.wpPostId,
          wpPostUrl: wpData.wpPostUrl,
          publishedAt: new Date(),
        }),
        updatedAt: new Date(),
      })
      .where(eq(article.id, id))
      .returning();

    return updated;
  }
}
