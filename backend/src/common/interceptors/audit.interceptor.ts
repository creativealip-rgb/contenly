import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { AuthenticatedRequest } from '../types/authenticated-request';

/**
 * Interceptor that logs sensitive operations for audit trail.
 * Apply to controllers/methods that handle billing, auth, or data deletion.
 */
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger('AuditLog');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const method = req.method;
    const url = req.url;
    const userId = req.user?.id || 'anonymous';
    const ip = req.ip || req.headers['x-forwarded-for'] || '';
    const handler = context.getHandler().name;
    const controller = context.getClass().name;

    return next.handle().pipe(
      tap({
        next: () => {
          this.logger.log(
            JSON.stringify({
              audit: true,
              action: `${controller}.${handler}`,
              method,
              url,
              userId,
              ip,
              status: 'success',
              timestamp: new Date().toISOString(),
            }),
          );
        },
        error: (err: Error) => {
          this.logger.warn(
            JSON.stringify({
              audit: true,
              action: `${controller}.${handler}`,
              method,
              url,
              userId,
              ip,
              status: 'error',
              error: err.message,
              timestamp: new Date().toISOString(),
            }),
          );
        },
      }),
    );
  }
}
