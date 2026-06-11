import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { ObservabilityService } from '../observability/observability.service';

type ErrorResponseBody =
  | string
  | {
      message?: string | string[];
      error?: string;
      code?: string;
      details?: unknown;
    };

export interface StandardErrorResponse {
  message: string | string[];
  code: string;
  details?: unknown;
  requestId?: string;
  timestamp: string;
  path: string;
}

function normalizeErrorResponse(exception: unknown): {
  status: number;
  body: ErrorResponseBody;
} {
  if (exception instanceof HttpException) {
    return {
      status: exception.getStatus(),
      body: exception.getResponse() as ErrorResponseBody,
    };
  }

  return {
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    body: { message: 'Internal server error', code: 'INTERNAL_SERVER_ERROR' },
  };
}

@Catch()
export class HttpErrorFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpErrorFilter.name);

  constructor(private readonly observabilityService?: ObservabilityService) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request & { requestId?: string }>();
    const { status, body } = normalizeErrorResponse(exception);

    const message =
      typeof body === 'string'
        ? body
        : body.message || body.error || 'Request failed';
    const code =
      typeof body === 'string'
        ? `HTTP_${status}`
        : body.code || body.error || `HTTP_${status}`;
    const details = typeof body === 'string' ? undefined : body.details;

    const payload: StandardErrorResponse = {
      message,
      code,
      ...(details !== undefined ? { details } : {}),
      ...(request.requestId ? { requestId: request.requestId } : {}),
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    if (status >= 500) {
      const error =
        exception instanceof Error
          ? exception.stack || exception.message
          : String(exception);
      this.logger.error(
        JSON.stringify({
          requestId: request.requestId,
          status,
          path: request.url,
          error,
        }),
      );
      this.observabilityService?.captureException(exception, {
        requestId: request.requestId,
        status,
        path: request.url,
        message: Array.isArray(message) ? message.join('; ') : message,
      });
    }

    response.status(status).json(payload);
  }
}
