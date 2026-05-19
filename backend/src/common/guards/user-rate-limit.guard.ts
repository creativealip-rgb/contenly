import { Injectable, CanActivate, ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';

const USER_RATE_LIMIT_KEY = 'user-rate-limit';

export interface UserRateLimitOptions {
  limit: number;
  windowMs: number;
}

export const SetUserRateLimit = (options: UserRateLimitOptions) =>
  Reflect.metadata(USER_RATE_LIMIT_KEY, options);

/**
 * In-memory per-user rate limiter.
 * Tracks requests by userId (falls back to IP if no user).
 * Use @SetUserRateLimit({ limit: 10, windowMs: 60000 }) on controller/method.
 */
@Injectable()
export class UserRateLimitGuard implements CanActivate {
  private store = new Map<string, { count: number; resetAt: number }>();

  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const options = this.reflector.getAllAndOverride<UserRateLimitOptions | undefined>(
      USER_RATE_LIMIT_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!options) return true;

    const req = context.switchToHttp().getRequest<Request>();
    const userId = (req as any).user?.id || req.ip || 'unknown';
    const key = `${userId}:${context.getClass().name}:${context.getHandler().name}`;
    const now = Date.now();

    const entry = this.store.get(key);

    if (!entry || now > entry.resetAt) {
      this.store.set(key, { count: 1, resetAt: now + options.windowMs });
      return true;
    }

    if (entry.count >= options.limit) {
      const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
      throw new HttpException(
        `Rate limit exceeded. Try again in ${retryAfter}s.`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    entry.count++;
    return true;
  }
}
