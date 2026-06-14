import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { eq, and, ilike, or, sql, desc, inArray } from 'drizzle-orm';
import { DrizzleService } from '../../db/drizzle.service';
import { article, wpSite } from '../../db/schema';
import { CreateArticleDto, UpdateArticleDto } from './dto';
import { ArticleStatus, ArticleUpdateData } from '../../db/types';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const uuidValidate = (value: string) => UUID_REGEX.test(value);

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

    // Fetch wpSite data in a single query
    const wpSiteIds = [...new Set(articlesData.filter(a => a.wpSiteId).map(a => a.wpSiteId!))];

    let wpSitesData: any[] = [];
    if (wpSiteIds.length > 0) {
      wpSitesData = await this.db
        .select({
          id: wpSite.id,
          name: wpSite.name,
          url: wpSite.url,
        })
        .from(wpSite)
        .where(inArray(wpSite.id, wpSiteIds));
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
    const normalizedSourceUrl = dto.sourceUrl?.trim() || '';

    if (normalizedSourceUrl) {
      const [existingArticle] = await this.db
        .select()
        .from(article)
        .where(and(eq(article.userId, userId), eq(article.sourceUrl, normalizedSourceUrl)))
        .orderBy(desc(article.createdAt))
        .limit(1);

      if (existingArticle) {
        this.logger.log(`Duplicate sourceUrl detected; reusing article ${existingArticle.id}`);
        return existingArticle;
      }
    }

    const [newArticle] = await this.db
      .insert(article)
      .values({
        userId,
        sourceUrl: normalizedSourceUrl,
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
        featuredImageUrl: dto.featuredImageUrl,
        feedItemId: dto.feedItemId,
        tokensUsed: dto.tokensUsed || 0,
      })
      .returning();

    return newArticle;
  }

  async update(userId: string, id: string, dto: UpdateArticleDto) {
    this.logger.log(`Attempting update for article ${id} (User: ${userId})`);
    const existing = await this.findById(userId, id);

    // Auto-snapshot: if generatedContent is changing, save current as version
    if (dto.generatedContent && dto.generatedContent !== existing.generatedContent) {
      const versions = (Array.isArray(existing.versions) ? existing.versions : []) as Array<{
        title: string; content: string; metaTitle?: string; metaDescription?: string; slug?: string; savedAt: string;
      }>;
      versions.unshift({
        title: existing.title,
        content: existing.generatedContent,
        metaTitle: existing.metaTitle || undefined,
        metaDescription: existing.metaDescription || undefined,
        slug: existing.slug || undefined,
        savedAt: new Date().toISOString(),
      });
      // Keep max 10 versions
      const trimmed = versions.slice(0, 10);
      await this.db.update(article).set({ versions: trimmed }).where(eq(article.id, id));
    }

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

  async bulkDelete(userId: string, ids: string[]) {
    if (!ids?.length) return { deleted: 0 };
    // Make sure all belong to user
    const found = await this.db
      .select({ id: article.id })
      .from(article)
      .where(and(eq(article.userId, userId), inArray(article.id, ids)));
    const validIds = found.map((f) => f.id);
    if (validIds.length === 0) return { deleted: 0 };
    await this.db.delete(article).where(inArray(article.id, validIds));
    return { deleted: validIds.length };
  }

  async bulkUpdateStatus(userId: string, ids: string[], status: ArticleStatus) {
    if (!ids?.length) return { updated: 0 };
    const result = await this.db
      .update(article)
      .set({ status, updatedAt: new Date() })
      .where(and(eq(article.userId, userId), inArray(article.id, ids)))
      .returning({ id: article.id });
    return { updated: result.length };
  }

  async restoreVersion(userId: string, articleId: string, versionIndex: number) {
    const existing = await this.findById(userId, articleId);
    const versions = (Array.isArray(existing.versions) ? existing.versions : []) as Array<{
      title: string; content: string; metaTitle?: string; metaDescription?: string; slug?: string; savedAt: string;
    }>;
    if (versionIndex < 0 || versionIndex >= versions.length) {
      throw new NotFoundException('Version not found');
    }
    const ver = versions[versionIndex];
    // Save current as new version before restoring
    versions.unshift({
      title: existing.title,
      content: existing.generatedContent,
      metaTitle: existing.metaTitle || undefined,
      metaDescription: existing.metaDescription || undefined,
      slug: existing.slug || undefined,
      savedAt: new Date().toISOString(),
    });
    const [updated] = await this.db
      .update(article)
      .set({
        title: ver.title,
        generatedContent: ver.content,
        metaTitle: ver.metaTitle || null,
        metaDescription: ver.metaDescription || null,
        slug: ver.slug || null,
        versions: versions.slice(0, 10),
        updatedAt: new Date(),
      })
      .where(eq(article.id, articleId))
      .returning();
    return updated;
  }

  async getStats(userId: string) {
    const rows = await this.db
      .select({
        status: article.status,
        count: sql<number>`count(*)::int`,
        tokens: sql<number>`coalesce(sum(${article.tokensUsed}), 0)::int`,
      })
      .from(article)
      .where(eq(article.userId, userId))
      .groupBy(article.status);

    const counts: Record<string, number> = {};
    let totalTokens = 0;
    let totalArticles = 0;
    for (const r of rows) {
      counts[r.status as string] = r.count;
      totalTokens += r.tokens || 0;
      totalArticles += r.count;
    }
    return { counts, totalTokens, totalArticles };
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
