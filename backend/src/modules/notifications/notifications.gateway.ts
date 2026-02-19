import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    OnGatewayConnection,
    OnGatewayDisconnect,
    ConnectedSocket,
    MessageBody,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { ConfigService } from '@nestjs/config';

@WebSocketGateway({
    cors: {
        origin: (origin, callback) => {
            const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
            const origins = frontendUrl.includes(',')
                ? frontendUrl.split(',').map(url => url.trim())
                : [frontendUrl];

            // Allow requests with no origin (like mobile apps or curl)
            if (!origin) return callback(null, true);

            const isAllowed = origins.some(allowedOrigin => {
                if (allowedOrigin === '*') return true;
                return origin === allowedOrigin || origin.startsWith(allowedOrigin);
            });

            callback(null, isAllowed);
        },
        credentials: true,
    },
    namespace: '/notifications',
})
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    private readonly logger = new Logger(NotificationsGateway.name);
    private userSockets: Map<string, Set<string>> = new Map();

    constructor(private configService: ConfigService) {}

    handleConnection(client: Socket) {
        this.logger.log(`Client connected: ${client.id}`);
        
        // The client should send userId after connection
        // This is handled in the subscribe handler
    }

    handleDisconnect(client: Socket) {
        this.logger.log(`Client disconnected: ${client.id}`);
        
        // Remove client from all user rooms
        for (const [userId, sockets] of this.userSockets.entries()) {
            if (sockets.has(client.id)) {
                sockets.delete(client.id);
                if (sockets.size === 0) {
                    this.userSockets.delete(userId);
                }
            }
        }
    }

    @SubscribeMessage('subscribe')
    handleSubscribe(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { userId: string },
    ) {
        const { userId } = data;

        if (!userId) {
            this.logger.warn(`Subscribe attempt without userId from client ${client.id}`);
            return { success: false, error: 'userId is required' };
        }

        // Join user-specific room
        client.join(`user:${userId}`);

        // Track socket for user
        if (!this.userSockets.has(userId)) {
            this.userSockets.set(userId, new Set());
        }
        this.userSockets.get(userId)!.add(client.id);

        this.logger.log(`Client ${client.id} subscribed to user:${userId}`);
        
        return { success: true, message: `Subscribed to notifications for user ${userId}` };
    }

    @SubscribeMessage('unsubscribe')
    handleUnsubscribe(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { userId: string },
    ) {
        const { userId } = data;

        client.leave(`user:${userId}`);

        if (this.userSockets.has(userId)) {
            this.userSockets.get(userId)!.delete(client.id);
            if (this.userSockets.get(userId)!.size === 0) {
                this.userSockets.delete(userId);
            }
        }

        this.logger.log(`Client ${client.id} unsubscribed from user:${userId}`);
        
        return { success: true };
    }

    /**
     * Send notification to a specific user
     */
    notifyUser(userId: string, notification: {
        id: string;
        type: string;
        title: string;
        message: string;
        data?: Record<string, unknown>;
        createdAt: Date;
    }) {
        const room = `user:${userId}`;
        
        this.server.to(room).emit('notification', notification);
        
        this.logger.log(`Notification sent to user:${userId} - ${notification.title}`);
    }

    /**
     * Send notification to multiple users
     */
    notifyUsers(userIds: string[], notification: {
        id: string;
        type: string;
        title: string;
        message: string;
        data?: Record<string, unknown>;
        createdAt: Date;
    }) {
        for (const userId of userIds) {
            this.notifyUser(userId, notification);
        }
    }

    /**
     * Broadcast notification to all connected clients
     */
    broadcast(notification: {
        type: string;
        title: string;
        message: string;
        data?: Record<string, unknown>;
    }) {
        this.server.emit('broadcast', notification);
        this.logger.log(`Broadcast sent: ${notification.title}`);
    }

    /**
     * Check if user has active connections
     */
    isUserConnected(userId: string): boolean {
        return this.userSockets.has(userId) && this.userSockets.get(userId)!.size > 0;
    }

    /**
     * Get count of active connections for a user
     */
    getUserConnectionCount(userId: string): number {
        return this.userSockets.get(userId)?.size || 0;
    }

    /**
     * Get total connected clients count
     */
    getTotalConnections(): number {
        let total = 0;
        for (const sockets of this.userSockets.values()) {
            total += sockets.size;
        }
        return total;
    }
}