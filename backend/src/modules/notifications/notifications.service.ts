import { Injectable } from '@nestjs/common';
import { eq, desc } from 'drizzle-orm';
import { DrizzleService } from '../../db/drizzle.service';
import { notification } from '../../db/schema';

@Injectable()
export class NotificationsService {
    constructor(private drizzle: DrizzleService) { }

    get db() {
        return this.drizzle.db;
    }

    async findAll(userId: string) {
        return this.db.query.notification.findMany({
            where: eq(notification.userId, userId),
            orderBy: [desc(notification.createdAt)],
            limit: 50,
        });
    }

    async markAsRead(userId: string, id: string) {
        await this.db
            .update(notification)
            .set({ isRead: true })
            .where(eq(notification.id, id));
        return { message: 'Marked as read' };
    }

    async markAllAsRead(userId: string) {
        await this.db
            .update(notification)
            .set({ isRead: true })
            .where(eq(notification.userId, userId));
        return { message: 'All marked as read' };
    }

    async create(userId: string, type: string, title: string, message: string, data?: object) {
        const [newNotification] = await this.db
            .insert(notification)
            .values({
                userId,
                type: type as any,
                title,
                message,
                data: data || {},
            })
            .returning();

        return newNotification;
    }
}
