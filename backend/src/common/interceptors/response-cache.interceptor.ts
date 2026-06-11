import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Reflector } from '@nestjs/core';
import { AuthenticatedRequest } from '../types/authenticated-request';

const CACHE_TTL_KEY = 'cache-ttl';

/** Decorator: set cache TTL in seconds for a route */
export const CacheTTL = (seconds: number) => Reflect.metadata(CACHE_TTL_KEY, seconds);

/**
 * Simple in-memory response cache interceptor.
 * Caches GET responses per user+url for the specified TTL.
 */
@Injectable()
export class ResponseCacheInterceptor implements NestInterceptor {
  private cache = new Map<string, { data: unknown; expiresAt: number }>();

  constructor(private reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<AuthenticatedRequest>();

    // Only cache GET requests
    if (req.method !== 'GET') return next.handle();

    const ttl = this.reflector.getAllAndOverride<number | undefined>(CACHE_TTL_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!ttl) return next.handle();

    const userId = req.user?.id || 'anon';
    const key = `${userId}:${req.originalUrl}`;
    const now = Date.now();

    const cached = this.cache.get(key);
    if (cached && now < cached.expiresAt) {
      return of(cached.data);
    }

    return next.handle().pipe(
      tap((data) => {
        this.cache.set(key, { data, expiresAt: now + ttl * 1000 });

        // Cleanup old entries periodically (every 100 sets)
        if (this.cache.size > 500) {
          for (const [k, v] of this.cache) {
            if (now > v.expiresAt) this.cache.delete(k);
          }
        }
      }),
    );
  }
}
