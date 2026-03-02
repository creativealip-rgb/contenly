import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { eq, and, gte, lte, between } from 'drizzle-orm';
import { DrizzleService } from '../../db/drizzle.service';
import { schema } from '../../db/schema';

export interface CreateScheduledContentDto {
  contentType: 'article' | 'carousel' | 'video_script';
  contentId?: string;
  title: string;
  scheduledAt: Date;
  platform: 'wordpress' | 'instagram' | 'linkedin' | 'twitter';
  metadata?: Record<string, any>;
}

export interface UpdateScheduledContentDto {
  title?: string;
  scheduledAt?: Date;
  platform?: string;
  status?: 'pending' | 'published' | 'failed';
  metadata?: Record<string, any>;
  publishedAt?: Date;
}

@Injectable()
export class CalendarService {
  constructor(private readonly drizzle: DrizzleService) {}

  async create(userId: string, dto: CreateScheduledContentDto) {
    const [scheduled] = await this.drizzle.db
      .insert(schema.scheduledContent)
      .values({
        userId,
        contentType: dto.contentType,
        contentId: dto.contentId,
        title: dto.title,
        scheduledAt: dto.scheduledAt,
        platform: dto.platform,
        metadata: dto.metadata,
        status: 'pending',
      })
      .returning();

    return scheduled;
  }

  async findAll(userId: string, startDate?: Date, endDate?: Date) {
    let query = this.drizzle.db
      .select()
      .from(schema.scheduledContent)
      .where(eq(schema.scheduledContent.userId, userId));

    if (startDate && endDate) {
      query = this.drizzle.db
        .select()
        .from(schema.scheduledContent)
        .where(
          and(
            eq(schema.scheduledContent.userId, userId),
            gte(schema.scheduledContent.scheduledAt, startDate),
            lte(schema.scheduledContent.scheduledAt, endDate)
          )
        ) as any;
    }

    return query.orderBy(schema.scheduledContent.scheduledAt);
  }

  async findById(userId: string, id: string) {
    const [scheduled] = await this.drizzle.db
      .select()
      .from(schema.scheduledContent)
      .where(eq(schema.scheduledContent.id, id));

    if (!scheduled || scheduled.userId !== userId) {
      throw new NotFoundException('Scheduled content not found');
    }

    return scheduled;
  }

  async update(userId: string, id: string, dto: UpdateScheduledContentDto) {
    await this.findById(userId, id);

    const [updated] = await this.drizzle.db
      .update(schema.scheduledContent)
      .set({
        ...dto,
        updatedAt: new Date(),
      })
      .where(eq(schema.scheduledContent.id, id))
      .returning();

    return updated;
  }

  async delete(userId: string, id: string) {
    await this.findById(userId, id);

    await this.drizzle.db
      .delete(schema.scheduledContent)
      .where(eq(schema.scheduledContent.id, id));

    return { success: true };
  }

  async markAsPublished(userId: string, id: string) {
    return this.update(userId, id, {
      status: 'published',
      publishedAt: new Date(),
    });
  }

  async getUpcoming(userId: string, days: number = 7) {
    const now = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + days);

    return this.drizzle.db
      .select()
      .from(schema.scheduledContent)
      .where(
        and(
          eq(schema.scheduledContent.userId, userId),
          eq(schema.scheduledContent.status, 'pending'),
          gte(schema.scheduledContent.scheduledAt, now),
          lte(schema.scheduledContent.scheduledAt, endDate)
        )
      )
      .orderBy(schema.scheduledContent.scheduledAt);
  }

  async getCalendarData(userId: string, year: number, month: number) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const events = await this.drizzle.db
      .select()
      .from(schema.scheduledContent)
      .where(
        and(
          eq(schema.scheduledContent.userId, userId),
          gte(schema.scheduledContent.scheduledAt, startDate),
          lte(schema.scheduledContent.scheduledAt, endDate)
        )
      )
      .orderBy(schema.scheduledContent.scheduledAt);

    return events.map(event => ({
      id: event.id,
      title: event.title,
      date: event.scheduledAt,
      platform: event.platform,
      status: event.status,
      contentType: event.contentType,
    }));
  }

  async getStats(userId: string) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    const [thisMonthCount, lastMonthCount, publishedCount, pendingCount] = await Promise.all([
      this.drizzle.db
        .select({ count: schema.scheduledContent.id })
        .from(schema.scheduledContent)
        .where(
          and(
            eq(schema.scheduledContent.userId, userId),
            gte(schema.scheduledContent.scheduledAt, startOfMonth)
          )
        ),
      this.drizzle.db
        .select({ count: schema.scheduledContent.id })
        .from(schema.scheduledContent)
        .where(
          and(
            eq(schema.scheduledContent.userId, userId),
            gte(schema.scheduledContent.scheduledAt, startOfLastMonth),
            lte(schema.scheduledContent.scheduledAt, endOfLastMonth)
          )
        ),
      this.drizzle.db
        .select({ count: schema.scheduledContent.id })
        .from(schema.scheduledContent)
        .where(
          and(
            eq(schema.scheduledContent.userId, userId),
            eq(schema.scheduledContent.status, 'published')
          )
        ),
      this.drizzle.db
        .select({ count: schema.scheduledContent.id })
        .from(schema.scheduledContent)
        .where(
          and(
            eq(schema.scheduledContent.userId, userId),
            eq(schema.scheduledContent.status, 'pending')
          )
        ),
    ]);

    return {
      thisMonth: thisMonthCount.length,
      lastMonth: lastMonthCount.length,
      totalPublished: publishedCount.length,
      totalPending: pendingCount.length,
    };
  }
}
