import { Injectable, NotFoundException } from '@nestjs/common';
import { eq, and, ilike, or, sql, desc } from 'drizzle-orm';
import { DrizzleService } from '../../db/drizzle.service';
import { article, wpSite } from '../../db/schema';
import { CreateArticleDto, UpdateArticleDto } from './dto';
import { validate as uuidValidate } from 'uuid';

@Injectable()
export class ArticlesService {
    constructor(private drizzle: DrizzleService) { }

    get db() {
        return this.drizzle.db;
    }

    async findAll(userId: string, query: {
        page?: number;
        limit?: number;
        status?: string;
        wpSiteId?: string;
        search?: string;
    }) {
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
            meta: { total: Number(count), page, limit, totalPages: Math.ceil(Number(count) / limit) },
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
        console.log(`[ArticlesService] Attempting update for article ${id} (User: ${userId})`);
        await this.findById(userId, id);

        const updateData: any = {
            ...dto,
            updatedAt: new Date(),
        };

        // Validate feedItemId is a proper UUID if provided
        if (dto.feedItemId !== undefined) {
            if (dto.feedItemId === null || dto.feedItemId === '' || !uuidValidate(dto.feedItemId)) {
                if (dto.feedItemId) {
                    console.warn(`[ArticlesService] Ignoring invalid feedItemId UUID: ${dto.feedItemId}`);
                }
                delete updateData.feedItemId;
            }
        }

        // Ensure status is correctly typed for enum
        if (dto.status) {
            updateData.status = dto.status as any;
        }

        console.log(`[ArticlesService] Fields to update:`, Object.keys(updateData));

        try {
            const [updated] = await this.db
                .update(article)
                .set(updateData)
                .where(and(eq(article.id, id), eq(article.userId, userId)))
                .returning();

            if (!updated) {
                console.error(`[ArticlesService] Update successful but no record returned for ID ${id}`);
            } else {
                console.log(`[ArticlesService] Update successful. New Status: ${updated.status}`);
            }

            return updated;
        } catch (error: any) {
            console.error(`[ArticlesService] Update query failed:`, error.message || error);
            throw error;
        }
    }

    async delete(userId: string, id: string) {
        await this.findById(userId, id);
        await this.db.delete(article).where(eq(article.id, id));
        return { message: 'Article deleted' };
    }

    async updateStatus(id: string, status: string, wpData?: { wpPostId: string; wpPostUrl: string }) {
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
}
