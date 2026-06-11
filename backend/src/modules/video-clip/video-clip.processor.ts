import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { DrizzleService } from '../../db/drizzle.service';
import { videoClipProjects } from '../../db/schema';
import { eq } from 'drizzle-orm';
import { VideoClipService } from './video-clip.service';
import { BillingService } from '../billing/billing.service';
import { NotificationsService } from '../notifications/notifications.service';
import { DeadLetterQueueService } from '../../common/queues/dead-letter-queue.service';

@Processor('video-clip')
export class VideoClipProcessor {
  private readonly logger = new Logger(VideoClipProcessor.name);

  constructor(
    private drizzle: DrizzleService,
    private videoClipService: VideoClipService,
    private billingService: BillingService,
    private notificationsService: NotificationsService,
    private deadLetterQueueService: DeadLetterQueueService,
  ) {}

  @Process({ name: 'analyze', concurrency: 2 })
  async handleAnalyze(job: Job<{ projectId: string; userId: string; billing?: { usingKredit?: boolean; kreditCost?: number } }>) {
    const { projectId, userId, billing } = job.data;
    const db = this.drizzle.getDb();

    try {
      // Step 1: Download (skip if videoPath already exists, e.g. uploaded file)
      const [existing] = await db.select().from(videoClipProjects).where(eq(videoClipProjects.id, projectId));
      let videoPath: string;
      if (existing.videoPath) {
        this.logger.log(`Reusing uploaded video for project ${projectId}: ${existing.videoPath}`);
        videoPath = existing.videoPath;
        await db.update(videoClipProjects).set({ status: 'transcribing' }).where(eq(videoClipProjects.id, projectId));
      } else {
        await db.update(videoClipProjects).set({ status: 'downloading' }).where(eq(videoClipProjects.id, projectId));
        this.logger.log(`Downloading video for project ${projectId}`);
        videoPath = await this.videoClipService.downloadVideo(existing.sourceUrl, projectId);
        const thumbnailPath = await this.videoClipService.extractThumbnail(videoPath, projectId);
        const waveform = await this.videoClipService.extractWaveform(videoPath).catch(() => []);
        await db.update(videoClipProjects).set({
          videoPath,
          thumbnailPath: thumbnailPath || null,
          waveform: waveform.length > 0 ? waveform : null,
          status: 'transcribing',
        }).where(eq(videoClipProjects.id, projectId));
      }
      const project = existing;

      // Step 2: Get duration
      const duration = await this.videoClipService.getVideoDuration(videoPath);
      if (duration > 3600) {
        throw new Error('Video exceeds 60 minute limit');
      }

      // Step 3: Transcribe
      this.logger.log(`Transcribing video for project ${projectId}`);
      const { text, words } = await this.videoClipService.transcribeVideo(videoPath);
      await db.update(videoClipProjects).set({ transcript: text, words, status: 'analyzing' }).where(eq(videoClipProjects.id, projectId));

      // Step 4: AI find viral segments
      this.logger.log(`Finding viral segments for project ${projectId}`);
      const segments = await this.videoClipService.findViralSegments(text, duration);
      
      await db.update(videoClipProjects).set({
        segments,
        duration: Math.round(duration),
        status: 'ready',
      }).where(eq(videoClipProjects.id, projectId));

      await this.billingService.recordUsage(userId, 'VIDEO_ANALYSIS', billing);

      await this.notificationsService.create(userId, 'JOB_SUCCESS',
        'Video Analysis Complete',
        `Found ${segments.length} viral segments in "${project.title}"`,
      );

      this.logger.log(`Analysis complete for project ${projectId}: ${segments.length} segments found`);
    } catch (error) {
      this.logger.error(`Analysis failed for project ${projectId}: ${error.message}`);
      await this.deadLetterQueueService.captureFailedJob(job, error);
      await db.update(videoClipProjects).set({
        status: 'failed',
        error: error.message,
      }).where(eq(videoClipProjects.id, projectId));

      await this.notificationsService.create(userId, 'JOB_FAILED',
        'Video Analysis Failed',
        error.message,
      );
    }
  }

  @Process({ name: 'export', concurrency: 2 })
  async handleExport(job: Job<{
    jobId: string;
    userId: string;
    projectId: string;
    segmentIndex: number;
    subtitleStyle: any;
    titleStyle: any;
    aspectRatio?: string;
    cropOffsetX?: number;
    includeBroll?: boolean;
    billing?: { usingKredit?: boolean; kreditCost?: number };
  }>) {
    const { jobId, userId, projectId, segmentIndex, subtitleStyle, titleStyle, aspectRatio, cropOffsetX, includeBroll, billing } = job.data;
    const db = this.drizzle.getDb();

    try {
      const [project] = await db.select().from(videoClipProjects).where(eq(videoClipProjects.id, projectId));
      if (!project) throw new Error('Project not found');

      const segments = project.segments as any[];
      const segment = segments[segmentIndex];
      const words = (project.words as any[]) || [];

      // B-roll: filter to only those for this segment
      let brollItems: any[] = [];
      let brollAssets: Record<string, string> | undefined;
      if (includeBroll !== false) {
        const allBroll = ((project.brollPlan as any[]) || []).filter((b) => b.segmentIndex === segmentIndex);
        if (allBroll.length > 0) {
          this.logger.log(`Downloading ${allBroll.length} b-roll assets for clip ${segmentIndex}`);
          brollAssets = await this.videoClipService.downloadBrollAssets(allBroll);
          brollItems = allBroll;
        }
      }

      this.logger.log(`Exporting clip ${segmentIndex} for project ${projectId}${brollItems.length ? ` with ${brollItems.length} b-roll overlays` : ''}`);
      const outputPath = await this.videoClipService.clipAndExport(
        project.videoPath!,
        segment,
        words,
        subtitleStyle,
        titleStyle,
        jobId,
        {
          aspectRatio: (aspectRatio as any) || '9:16',
          cropOffsetX: cropOffsetX || 0,
          brollItems,
          brollAssets,
        },
      );

      // Store export path in project exports array
      const exports = (project.exports as any[]) || [];
      exports.push({
        segmentIndex,
        outputPath,
        jobId,
        aspectRatio: aspectRatio || '9:16',
        brollCount: brollItems.length,
        createdAt: new Date().toISOString(),
      });
      await db.update(videoClipProjects).set({ exports }).where(eq(videoClipProjects.id, projectId));

      await this.billingService.recordUsage(userId, 'VIDEO_EXPORT', billing);

      await this.notificationsService.create(userId, 'JOB_SUCCESS',
        'Clip Export Complete',
        `Clip "${segment.hookTitle}" is ready to download`,
      );

      this.logger.log(`Export complete: ${outputPath}`);
    } catch (error) {
      this.logger.error(`Export failed for job ${jobId}: ${error.message}`);
      await this.deadLetterQueueService.captureFailedJob(job, error);
      await this.notificationsService.create(userId, 'JOB_FAILED',
        'Clip Export Failed',
        error.message,
      );
    }
  }
}
