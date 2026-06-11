import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface ObservabilityEvent {
  level: 'error' | 'warn' | 'info';
  message: string;
  requestId?: string;
  path?: string;
  status?: number;
  error?: string;
  extra?: Record<string, unknown>;
}

@Injectable()
export class ObservabilityService {
  private readonly logger = new Logger(ObservabilityService.name);
  private readonly webhookUrl?: string;
  private readonly provider: string;

  constructor(private readonly configService: ConfigService) {
    this.webhookUrl = this.configService
      .get<string>('OBSERVABILITY_WEBHOOK_URL')
      ?.trim();
    this.provider =
      this.configService.get<string>('OBSERVABILITY_PROVIDER')?.trim() ||
      'webhook';
  }

  isEnabled(): boolean {
    return Boolean(this.webhookUrl);
  }

  async capture(event: ObservabilityEvent): Promise<void> {
    if (!this.webhookUrl) return;

    try {
      await fetch(this.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: this.provider,
          service: 'contenly-backend',
          environment:
            this.configService.get<string>('NODE_ENV') || 'development',
          timestamp: new Date().toISOString(),
          ...event,
        }),
        signal: AbortSignal.timeout(3000),
      });
    } catch (error: any) {
      this.logger.warn(
        `Failed to send observability event: ${error?.message || error}`,
      );
    }
  }

  captureException(
    exception: unknown,
    context: Omit<ObservabilityEvent, 'level' | 'message' | 'error'> & {
      message?: string;
    },
  ): void {
    const error =
      exception instanceof Error
        ? exception.stack || exception.message
        : String(exception);
    const message =
      context.message ||
      (exception instanceof Error ? exception.message : 'Unhandled exception');

    void this.capture({
      ...context,
      level: 'error',
      message,
      error,
    });
  }
}
