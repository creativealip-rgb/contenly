import { Injectable, Logger } from '@nestjs/common';

export type AuditAction =
  | 'AUTH_LOGIN'
  | 'AUTH_LOGOUT'
  | 'API_KEY_CREATE'
  | 'API_KEY_DELETE'
  | 'WP_SITE_CONNECT'
  | 'WP_SITE_DELETE'
  | 'ARTICLE_PUBLISH'
  | 'ARTICLE_DELETE'
  | 'BILLING_CHECKOUT'
  | 'BILLING_DEDUCT'
  | 'SUBSCRIPTION_CHANGE'
  | 'USER_ROLE_CHANGE'
  | 'ENCRYPTION_KEY_ACCESS';

export interface AuditEntry {
  action: AuditAction;
  userId: string;
  resourceId?: string;
  resourceType?: string;
  metadata?: Record<string, unknown>;
  ip?: string;
  userAgent?: string;
  timestamp: Date;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger('AuditLog');

  log(entry: Omit<AuditEntry, 'timestamp'>) {
    const full: AuditEntry = { ...entry, timestamp: new Date() };

    // Structured log for aggregation (e.g., DataDog, CloudWatch)
    this.logger.log(
      JSON.stringify({
        audit: true,
        ...full,
      }),
    );
  }
}
