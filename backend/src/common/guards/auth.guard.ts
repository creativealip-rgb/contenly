import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import { auth } from '../../auth/auth.config';

@Injectable()
export class AuthGuard implements CanActivate {
    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest<Request>();

        try {
            // Better Auth uses cookies, so we pass the entire request headers
            // This includes cookies which Better Auth will use for session validation
            const session = await auth.api.getSession({
                headers: request.headers as any,
            });

            if (!session || !session.user) {
                throw new UnauthorizedException('Invalid session');
            }

            // Attach user to request
            (request as any).user = session.user;
            (request as any).session = session.session;

            return true;
        } catch (error) {
            throw new UnauthorizedException('Authentication required');
        }
    }
}
