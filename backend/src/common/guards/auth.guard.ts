import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import { UsersService } from '../../modules/users/users.service';
import { auth } from '../../auth/auth.config';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly usersService?: UsersService) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();

    // 1. Check for Session (Better Auth)
    try {
      const session = await auth.api.getSession({
        headers: request.headers as any,
      });

      if (session && session.user) {
        (request as any).user = session.user;
        (request as any).session = session.session;
        return true;
      }
    } catch (error) {
      // Session check failed, move to API key check
    }

    // 2. Check for API Key
    const authHeader = request.headers['authorization'] as string;
    const apiKeyHeader = request.headers['x-api-key'] as string;
    let rawKey: string | null = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      rawKey = authHeader.substring(7);
    } else if (apiKeyHeader) {
      rawKey = apiKeyHeader;
    }

    if (rawKey && this.usersService) {
      const validatedUser = await this.usersService.validateApiKey(rawKey);
      if (validatedUser) {
        (request as any).user = validatedUser;
        return true;
      }
    }

    throw new UnauthorizedException('Authentication required');
  }
}
