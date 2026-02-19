import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { eq, desc } from 'drizzle-orm';
import { DrizzleService } from '../../db/drizzle.service';
import { notification } from '../../db/schema';
import { NotificationsGateway } from './notifications.gateway';
import { NotificationType } from '../../db/types';

@Injectable()
export class NotificationsService {
    constructor(
        private drizzle: DrizzleService,
        @Inject(forwardRef(() => NotificationsGateway))
        private notificationsGateway: NotificationsGateway,
    ) { }

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

    async create(
        userId: string,
        type: NotificationType,
        title: string,
        message: string,
        data?: Record<string, unknown>,
    ) {
        const [newNotification] = await this.db
            .insert(notification)
            .values({
                userId,
                type,
                title,
                message,
                data: data || {},
            })
            .returning();

        // Send real-time notification via WebSocket
        if (this.notificationsGateway) {
            this.notificationsGateway.notifyUser(userId, {
                id: newNotification.id,
                type: newNotification.type,
                title: newNotification.title,
                message: newNotification.message,
                data: newNotification.data as Record<string, unknown>,
                createdAt: newNotification.createdAt,
            });
        }

        return newNotification;
    }

    /**
     * Create notification and send to multiple users
     */
    async createForUsers(
        userIds: string[],
        type: NotificationType,
        title: string,
        message: string,
        data?: Record<string, unknown>,
    ) {
        const notifications = [];

        for (const userId of userIds) {
            const notification = await this.create(userId, type, title, message, data);
            notifications.push(notification);
        }

        return notifications;
    }

    /**
     * Create a job success notification
     */
    async notifyJobSuccess(userId: string, jobTitle: string, details?: string) {
        return this.create(
            userId,
            'JOB_SUCCESS',
            'Job Completed Successfully',
            details || `Your job "${jobTitle}" has been completed.`,
        );
    }

    /**
     * Create a job failed notification
     */
    async notifyJobFailed(userId: string, jobTitle: string, error?: string) {
        return this.create(
            userId,
            'JOB_FAILED',
            'Job Failed',
            error ? `Your job "${jobTitle}" failed: ${error}` : `Your job "${jobTitle}" has failed.`,
        );
    }

    /**
     * Create a low tokens notification
     */
    async notifyLowTokens(userId: string, currentBalance: number) {
        return this.create(
            userId,
            'LOW_TOKENS',
            'Low Token Balance',
            `Your token balance is running low (${currentBalance} tokens remaining). Consider purchasing more tokens.`,
            { balance: currentBalance },
        );
    }

    /**
     * Create a subscription expiring notification
     */
    async notifySubscriptionExpiring(userId: string, daysRemaining: number) {
        return this.create(
            userId,
            'SUBSCRIPTION_EXPIRING',
            'Subscription Expiring Soon',
            `Your subscription will expire in ${daysRemaining} days. Renew now to continue enjoying premium features.`,
            { daysRemaining },
        );
    }

    /**
     * Create a system notification
     */
    async notifySystem(userId: string, title: string, message: string, data?: Record<string, unknown>) {
        return this.create(userId, 'SYSTEM', title, message, data);
    }
}
