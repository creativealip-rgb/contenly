import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { DrizzleService } from '../../db/drizzle.service';
import { renderJobs } from '../../db/schema';
import { eq } from 'drizzle-orm';
import { MotionGraphicsService } from './motion-graphics.service';
import { NotificationsService } from '../notifications/notifications.service';
import { DeadLetterQueueService } from '../../common/queues/dead-letter-queue.service';

export interface RenderJobData {
  jobId: string;
  userId: string;
  type: 'template' | 'caption' | 'compose';
  input: any;
}

const RENDER_TIMEOUT_MS = 5 * 60 * 1000;

@Processor('render')
export class RenderProcessor {
  private readonly logger = new Logger(RenderProcessor.name);

  constructor(
    private drizzle: DrizzleService,
    private motionGraphicsService: MotionGraphicsService,
    private notificationsService: NotificationsService,
    private deadLetterQueueService: DeadLetterQueueService,
  ) {}

  @Process({ concurrency: 2 })
  async handleRender(job: Job<RenderJobData>) {
    const { jobId, userId, type, input } = job.data;
    const db = this.drizzle.getDb();

    await db.update(renderJobs).set({ status: 'processing', startedAt: new Date() }).where(eq(renderJobs.id, jobId));

    // Progress callback — throttled to avoid DB spam
    let lastProgress = 0;
    const onProgress = async (progress: number) => {
      if (progress - lastProgress >= 5) {
        lastProgress = progress;
        await db.update(renderJobs).set({ progress }).where(eq(renderJobs.id, jobId)).catch(() => {});
      }
    };

    try {
      const result = await this.withTimeout(
        this.executeRender(userId, type, input, onProgress),
        type === 'compose' ? 10 * 60 * 1000 : RENDER_TIMEOUT_MS,
      );

      await db.update(renderJobs).set({
        status: 'completed',
        outputPath: result.outputPath,
        outputFormat: result.format,
        progress: 100,
        completedAt: new Date(),
      }).where(eq(renderJobs.id, jobId));

      this.logger.log(`Render job ${jobId} completed: ${result.outputPath}`);

      // Notify user
      await this.notificationsService.create(
        userId, 'JOB_SUCCESS',
        'Render Selesai ✅',
        `${type} render berhasil. Siap di-download.`,
        { jobId, type },
      ).catch(() => {});

      return result;
    } catch (err: any) {
      const isTimeout = err.message === 'RENDER_TIMEOUT';
      await db.update(renderJobs).set({
        status: isTimeout ? 'timeout' : 'failed',
        error: err.message || 'Unknown error',
        completedAt: new Date(),
      }).where(eq(renderJobs.id, jobId));

      this.logger.error(`Render job ${jobId} failed: ${err.message}`);
      await this.deadLetterQueueService.captureFailedJob(job, err);

      // Notify user of failure
      await this.notificationsService.create(
        userId, 'JOB_FAILED',
        'Render Gagal ❌',
        `${type} render gagal: ${err.message}`,
        { jobId, type, error: err.message },
      ).catch(() => {});
      throw err;
    }
  }

  private async executeRender(
    userId: string,
    type: string,
    input: any,
    onProgress: (progress: number) => void,
  ): Promise<{ outputPath: string; format: string }> {
    switch (type) {
      case 'template':
        return this.motionGraphicsService.renderTemplateWithProgress(
          input.templateId, input.props, input.options, onProgress,
        );
      case 'caption':
        return this.motionGraphicsService.renderCaptionDirect(input.words, input.options);
      case 'compose':
        return this.motionGraphicsService.composeVideoWithProgress(
          userId, input.projectId, input.options, onProgress,
        );
      default:
        throw new Error(`Unknown render type: ${type}`);
    }
  }

  private withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('RENDER_TIMEOUT')), ms);
      promise.then(
        (v) => { clearTimeout(timer); resolve(v); },
        (e) => { clearTimeout(timer); reject(e); },
      );
    });
  }
}
