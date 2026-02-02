import {
  Injectable,
  NotFoundException,
  Logger,
  BadRequestException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { eq, and, ilike, or, sql, desc, lt } from 'drizzle-orm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DrizzleService } from '../../db/drizzle.service';
import { article, wpSite } from '../../db/schema';
import { CreateArticleDto, UpdateArticleDto } from './dto';
import { WordpressService } from '../wordpress/wordpress.service';

@Injectable()
export class ArticlesService {
  private readonly logger = new Logger(ArticlesService.name);

  constructor(
    private drizzle: DrizzleService,
    @Inject(forwardRef(() => WordpressService))
    private wordpressService: WordpressService,
  ) {}

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
    if (status) conditions.push(eq(article.status, status as any));
    if (wpSiteId) conditions.push(eq(article.wpSiteId, wpSiteId));

    let articles;
    if (search) {
      articles = await this.db.query.article.findMany({
        where: and(
          ...conditions,
          or(
            ilike(article.title, `%${search}%`),
            ilike(article.generatedContent, `%${search}%`),
          ),
        ),
        orderBy: [desc(article.createdAt)],
        offset,
        limit,
        with: {
          wpSite: {
            columns: { id: true, name: true, url: true },
          },
        },
      });
    } else {
      articles = await this.db.query.article.findMany({
        where: and(...conditions),
        orderBy: [desc(article.createdAt)],
        offset,
        limit,
        with: {
          wpSite: {
            columns: { id: true, name: true, url: true },
          },
        },
      });
    }

    // Get total count
    const [{ count }] = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(article)
      .where(and(...conditions));

    return {
      data: articles,
      meta: {
        total: Number(count),
        page,
        limit,
        totalPages: Math.ceil(Number(count) / limit),
      },
    };
  }

  async findById(userId: string, id: string) {
    const result = await this.db.query.article.findFirst({
      where: and(eq(article.id, id), eq(article.userId, userId)),
      with: {
        wpSite: true,
        feedItem: true,
      },
    });

    if (!result) throw new NotFoundException('Article not found');
    return result;
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
        status: (dto.status as any) || 'DRAFT',
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
    await this.findById(userId, id);

    const [updated] = await this.db
      .update(article)
      .set({
        ...dto,
        status: dto.status ? (dto.status as any) : undefined,
        updatedAt: new Date(),
      })
      .where(eq(article.id, id))
      .returning();

    return updated;
  }

  async delete(userId: string, id: string) {
    await this.findById(userId, id);
    await this.db.delete(article).where(eq(article.id, id));
    return { message: 'Article deleted' };
  }

  async updateStatus(
    id: string,
    status: string,
    wpData?: { wpPostId: string; wpPostUrl: string },
  ) {
    const [updated] = await this.db
      .update(article)
      .set({
        status: status as any,
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

  async publishToWordPress(userId: string, articleId: string) {
    const existingArticle = await this.findById(userId, articleId);

    if (existingArticle.status === 'PUBLISHED') {
      throw new BadRequestException('Article is already published');
    }

    const result = await this.wordpressService.publishArticle(userId, {
      title: existingArticle.title,
      content: existingArticle.generatedContent,
      status: 'publish',
      sourceUrl: existingArticle.sourceUrl || undefined,
      originalContent: existingArticle.originalContent || undefined,
      feedItemId: existingArticle.feedItemId || undefined,
      articleId: articleId,
      featuredImageUrl: existingArticle.featuredImageUrl || undefined,
    });

    return result;
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async deleteOldDrafts() {
    this.logger.log('Starting cleanup of old draft articles...');
    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const deletedArticles = await this.db
        .delete(article)
        .where(
          and(eq(article.status, 'DRAFT'), lt(article.createdAt, sevenDaysAgo)),
        )
        .returning();

      this.logger.log(`Deleted ${deletedArticles.length} old draft articles`);
    } catch (error) {
      this.logger.error('Failed to delete old draft articles:', error);
    }
  }
}
