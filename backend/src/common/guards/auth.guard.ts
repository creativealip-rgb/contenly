import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import { auth } from '../../auth/auth.config';

@Injectable()
export class AuthGuard implements CanActivate {
    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest<Request>();
        const authHeader = request.headers.authorization;

        if (!authHeader) {
            throw new UnauthorizedException('No authorization header');
        }

        const token = authHeader.replace('Bearer ', '');

        try {
            const session = await auth.api.getSession({
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!session || !session.user) {
                throw new UnauthorizedException('Invalid session');
            }

            // Attach user to request
            (request as any).user = session.user;
            (request as any).session = session.session;

            return true;
        } catch (error) {
            throw new UnauthorizedException('Invalid or expired token');
        }
    }
}
