import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { DrizzleService } from '../../db/drizzle.service';
import { instagramProject, instagramSlide } from '../../db/schema';
import { eq } from 'drizzle-orm';
import { InstagramStudioService } from './instagram-studio.service';
import { OpenAiService } from '../ai/services/openai.service';
import { BillingService } from '../billing/billing.service';
import { NotificationsService } from '../notifications/notifications.service';

@Processor('instagram-studio')
export class InstagramStudioProcessor {
  private readonly logger = new Logger(InstagramStudioProcessor.name);

  constructor(
    private drizzle: DrizzleService,
    private openAiService: OpenAiService,
    private billingService: BillingService,
    private notificationsService: NotificationsService,
  ) {}

  @Process({ name: 'generate-all-images', concurrency: 1 })
  async handleGenerateAll(job: Job<{ projectId: string; userId: string }>) {
    const { projectId, userId } = job.data;
    const db = this.drizzle.getDb();
    
    this.logger.log(`Starting background generateAllImages for project: ${projectId}`);
    
    // Update project status to generating
    await db
      .update(instagramProject)
      .set({ batchStatus: 'generating' })
      .where(eq(instagramProject.id, projectId));

    try {
      // Fetch fresh project details with slides
      const project = await db.query.instagramProject.findFirst({
        where: eq(instagramProject.id, projectId),
        with: {
          slides: true,
        },
      });

      if (!project || !project.slides || project.slides.length === 0) {
        throw new Error('Project or slides not found');
      }

      let succeededCount = 0;
      let failedCount = 0;

      for (const slide of project.slides) {
        try {
          const billing = await this.billingService.ensureBilling(userId, 'SLIDE_IMAGE');
          if (!billing.allowed) {
            throw new Error(billing.reason || 'Billing limit reached');
          }
          const textContent = slide.textContent || '';
          const visualPrompt = slide.visualPrompt || '';
          const style = project.globalStyle || 'Modern Minimalist';

          const finalPrompt = textContent
            ? `${visualPrompt}. Style: ${style}. The image must prominently feature the following text as an integral part of the design layout: "${textContent}". The text should be large, readable, and elegantly integrated into the visual composition with proper typography hierarchy.`
            : `${visualPrompt}. Style: ${style}`;

          this.logger.log(`Generating slide ${slide.slideNumber} image for project ${projectId}`);
          const imageUrl = await this.openAiService.generateImage(finalPrompt);

          await db
            .update(instagramSlide)
            .set({ imageUrl })
            .where(eq(instagramSlide.id, slide.id));

          await this.billingService.recordUsage(userId, 'SLIDE_IMAGE', billing);
          succeededCount++;
        } catch (error: any) {
          this.logger.error(`[Background Generate All] Slide ${slide.slideNumber} failed: ${error.message}`);
          failedCount++;
        }
      }

      // Update project status to completed/idle
      await db
        .update(instagramProject)
        .set({ batchStatus: 'completed' })
        .where(eq(instagramProject.id, projectId));

      await this.notificationsService.create(userId, 'JOB_SUCCESS',
        'IG Carousel Generation Complete',
        `Finished generating images for "${project.title}". Success: ${succeededCount}, Failed: ${failedCount}.`,
      );
    } catch (error: any) {
      this.logger.error(`[Background Generate All] Project ${projectId} failed: ${error.message}`);
      await db
        .update(instagramProject)
        .set({ batchStatus: 'failed' })
        .where(eq(instagramProject.id, projectId));

      await this.notificationsService.create(userId, 'JOB_FAILED',
        'IG Carousel Generation Failed',
        `Failed to generate images for project: ${error.message}`,
      );
    }
  }
}
