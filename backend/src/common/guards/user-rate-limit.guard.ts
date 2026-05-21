import { Injectable, CanActivate, ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import Redis from 'ioredis';

const USER_RATE_LIMIT_KEY = 'user-rate-limit';

export interface UserRateLimitOptions {
  limit: number;
  windowMs: number;
}

export const SetUserRateLimit = (options: UserRateLimitOptions) =>
  Reflect.metadata(USER_RATE_LIMIT_KEY, options);

@Injectable()
export class UserRateLimitGuard implements CanActivate {
  private redis: Redis;

  constructor(private reflector: Reflector) {
    this.redis = new Redis(process.env.REDIS_URL || undefined, { lazyConnect: false });
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const options = this.reflector.getAllAndOverride<UserRateLimitOptions | undefined>(
      USER_RATE_LIMIT_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!options) return true;

    const req = context.switchToHttp().getRequest<Request>();
    const userId = (req as any).user?.id || req.ip || 'unknown';
    const key = `rl:${userId}:${context.getClass().name}:${context.getHandler().name}`;
    const windowSec = Math.ceil(options.windowMs / 1000);

    const count = await this.redis.incr(key);
    if (count === 1) {
      await this.redis.expire(key, windowSec);
    }

    if (count > options.limit) {
      const ttl = await this.redis.ttl(key);
      throw new HttpException(
        `Rate limit exceeded. Try again in ${ttl}s.`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return true;
  }
}
