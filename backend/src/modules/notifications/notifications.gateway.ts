import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    OnGatewayConnection,
    OnGatewayDisconnect,
    ConnectedSocket,
    MessageBody,
} from '@nestjs/websockets';
import { Logger, Inject, forwardRef } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth/auth.service';

@WebSocketGateway({
    cors: {
        origin: (origin, callback) => {
            const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
            const origins = frontendUrl.includes(',')
                ? frontendUrl.split(',').map(url => url.trim())
                : [frontendUrl];
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
    private authenticatedUsers: Map<string, string> = new Map();

    constructor(
        private configService: ConfigService,
        @Inject(forwardRef(() => AuthService))
        private authService: AuthService,
    ) { }

    async handleConnection(client: Socket) {
        this.logger.log(`Client connected: ${client.id}`);
        try {
            const cookie = client.handshake.headers.cookie || '';
            const token = client.handshake.auth?.token;
            const headers = new Headers();
            if (cookie) headers.set('cookie', cookie);
            if (token) headers.set('authorization', `Bearer ${token}`);
            const session = await this.authService.getSession({ headers });
            if (session?.user) {
                this.authenticatedUsers.set(client.id, session.user.id);
            } else {
                client.disconnect();
            }
        } catch {
            client.disconnect();
        }
    }

    handleDisconnect(client: Socket) {
        this.logger.log(`Client disconnected: ${client.id}`);
        this.authenticatedUsers.delete(client.id);
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
        const authenticatedUserId = this.authenticatedUsers.get(client.id);
        if (!authenticatedUserId) {
            return { success: false, error: 'Not authenticated' };
        }
        if (userId !== authenticatedUserId) {
            return { success: false, error: 'Unauthorized' };
        }
        client.join(`user:${userId}`);
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

    notifyUser(userId: string, notification: {
        id: string; type: string; title: string; message: string;
        data?: Record<string, unknown>; createdAt: Date;
    }) {
        const room = `user:${userId}`;
        (this.server as any).to(room).emit('notification', notification);
        this.logger.log(`Notification sent to user:${userId} - ${notification.title}`);
    }

    notifyUsers(userIds: string[], notification: {
        id: string; type: string; title: string; message: string;
        data?: Record<string, unknown>; createdAt: Date;
    }) {
        for (const userId of userIds) {
            this.notifyUser(userId, notification);
        }
    }

    broadcast(notification: {
        type: string; title: string; message: string;
        data?: Record<string, unknown>;
    }) {
        this.server.emit('broadcast', notification);
        this.logger.log(`Broadcast sent: ${notification.title}`);
    }

    isUserConnected(userId: string): boolean {
        return this.userSockets.has(userId) && this.userSockets.get(userId)!.size > 0;
    }

    getUserConnectionCount(userId: string): number {
        return this.userSockets.get(userId)?.size || 0;
    }

    getTotalConnections(): number {
        let total = 0;
        for (const sockets of this.userSockets.values()) {
            total += sockets.size;
        }
        return total;
    }
}
