import { InjectQueue } from '@nestjs/bull';
import { Injectable, Logger } from '@nestjs/common';
import { Job, Queue } from 'bull';

export interface DeadLetterJobPayload {
  sourceQueue: string;
  sourceJobName?: string;
  sourceJobId?: string | number;
  attemptsMade?: number;
  maxAttempts?: number;
  failedReason: string;
  failedAt: string;
  data: unknown;
  stacktrace?: string[];
}

@Injectable()
export class DeadLetterQueueService {
  private readonly logger = new Logger(DeadLetterQueueService.name);

  constructor(@InjectQueue('dead-letter') private readonly deadLetterQueue: Queue) {}

  async captureFailedJob(job: Job, error: unknown): Promise<void> {
    const payload: DeadLetterJobPayload = {
      sourceQueue: job.queue?.name || 'unknown',
      sourceJobName: job.name,
      sourceJobId: job.id,
      attemptsMade: job.attemptsMade,
      maxAttempts: job.opts?.attempts,
      failedReason: this.getErrorMessage(error),
      failedAt: new Date().toISOString(),
      data: job.data,
      stacktrace: job.stacktrace,
    };

    try {
      await this.deadLetterQueue.add('failed-job', payload, {
        attempts: 1,
        removeOnComplete: false,
        removeOnFail: false,
      });
    } catch (deadLetterError) {
      this.logger.error(
        `Failed to write dead-letter job from ${payload.sourceQueue}/${payload.sourceJobId}: ${this.getErrorMessage(deadLetterError)}`,
      );
    }
  }

  private getErrorMessage(error: unknown): string {
    if (error instanceof Error) return error.message;
    if (typeof error === 'string') return error;
    return 'Unknown error';
  }
}
