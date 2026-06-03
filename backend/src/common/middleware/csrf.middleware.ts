import { Injectable, NestMiddleware, ForbiddenException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request, Response, NextFunction } from 'express';

/**
 * CSRF protection via Origin/Referer header validation.
 * Only applies to state-changing methods (POST, PUT, PATCH, DELETE).
 * Requests with API key auth or no cookies bypass this check.
 */
@Injectable()
export class CsrfMiddleware implements NestMiddleware {
  private readonly logger = new Logger(CsrfMiddleware.name);
  private readonly allowedOrigins: string[];

  constructor(private readonly configService: ConfigService) {
    const frontendUrl = this.configService.get('FRONTEND_URL') || 'http://localhost:3000';
    const backendUrl = this.configService.get('API_URL') || 'http://localhost:3001';
    this.allowedOrigins = [
      ...frontendUrl.split(',').map((u: string) => u.trim()),
      ...backendUrl.split(',').map((u: string) => u.trim()),
    ].filter(Boolean);
  }

  use(req: Request, _res: Response, next: NextFunction) {
    // Only check state-changing methods
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
      return next();
    }

    // Skip if using API key auth (not cookie-based)
    if (req.headers['x-api-key'] || req.headers['authorization']?.startsWith('Bearer ')) {
      return next();
    }

    // Skip if no cookies (not a browser session)
    if (!req.headers.cookie) {
      return next();
    }

    const origin = req.headers.origin || '';
    const referer = req.headers.referer || '';

    // Check origin first, then referer
    const source = origin || referer;
    if (!source) {
      // No origin/referer with cookies on a mutating request is suspicious
      // but some legitimate tools don't send these — allow with warning
      this.logger.warn(`CSRF: No origin/referer on ${req.method} ${req.url}`);
      return next();
    }

    const isAllowed = this.allowedOrigins.some(
      (allowed) => source === allowed || source.startsWith(allowed),
    );

    if (!isAllowed) {
      this.logger.warn(`CSRF blocked: origin=${origin} referer=${referer} url=${req.url}`);
      throw new ForbiddenException('CSRF validation failed');
    }

    next();
  }
}
