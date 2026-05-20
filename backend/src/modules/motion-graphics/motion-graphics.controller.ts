import { Controller, Get, Post, Body, Query, Param, Res, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import * as fs from 'fs';
import { SessionAuthGuard } from '../../common/guards/session-auth.guard';
import { UserRateLimitGuard, SetUserRateLimit } from '../../common/guards/user-rate-limit.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { User } from '../../db/types';
import { MotionGraphicsService } from './motion-graphics.service';
import { RenderTemplateDto, AiGenerateAnimationDto, RenderCaptionDto, ComposeVideoDto } from './motion-graphics.dto';

@ApiTags('Motion Graphics')
@ApiBearerAuth()
@UseGuards(SessionAuthGuard, UserRateLimitGuard)
@SetUserRateLimit({ limit: 10, windowMs: 60000 })
@Controller('motion-graphics')
export class MotionGraphicsController {
  constructor(private readonly service: MotionGraphicsService) {}

  @Get('health')
  @ApiOperation({ summary: 'Check if Remotion bundle is available' })
  health() {
    return this.service.healthCheck();
  }

  @Get('templates')
  @ApiOperation({ summary: 'List available motion graphics templates' })
  getTemplates(@Query('category') category?: string) {
    return this.service.getTemplates(category);
  }

  @Get('templates/:id')
  @ApiOperation({ summary: 'Get template details' })
  getTemplate(@Param('id') id: string) {
    return this.service.getTemplate(id);
  }

  @Post('render')
  @SetUserRateLimit({ limit: 3, windowMs: 60000 })
  @ApiOperation({ summary: 'Queue a motion graphics render job' })
  async renderTemplate(
    @CurrentUser() user: User,
    @Body() dto: RenderTemplateDto,
  ) {
    return this.service.renderTemplate(user.id, dto.templateId, dto.props, {
      format: dto.format,
      durationFrames: dto.durationFrames,
      width: dto.width,
      height: dto.height,
    });
  }

  @Post('ai-generate')
  @SetUserRateLimit({ limit: 5, windowMs: 60000 })
  @ApiOperation({ summary: 'AI generates animation config from natural language prompt' })
  async aiGenerate(
    @CurrentUser() user: User,
    @Body() dto: AiGenerateAnimationDto,
  ) {
    return this.service.aiGenerateAnimation(dto.prompt, {
      durationSeconds: dto.durationSeconds,
      resolution: dto.resolution,
      style: dto.style,
    });
  }

  @Post('render-caption')
  @SetUserRateLimit({ limit: 3, windowMs: 60000 })
  @ApiOperation({ summary: 'Queue auto-caption render job' })
  async renderCaption(
    @CurrentUser() user: User,
    @Body() dto: RenderCaptionDto,
  ) {
    return this.service.renderCaption(user.id, dto.words, {
      style: dto.style,
      textColor: dto.textColor,
      highlightColor: dto.highlightColor,
      fontSize: dto.fontSize,
    });
  }

  @Post('compose-video')
  @SetUserRateLimit({ limit: 2, windowMs: 60000 })
  @ApiOperation({ summary: 'Queue compose video job from a Video Script project' })
  async composeVideo(
    @CurrentUser() user: User,
    @Body() dto: ComposeVideoDto,
  ) {
    return this.service.composeVideo(user.id, dto.projectId, {
      showCaptions: dto.showCaptions,
      captionStyle: dto.captionStyle,
      aspectRatio: dto.aspectRatio,
      includeAudio: dto.includeAudio,
      voice: dto.voice,
    });
  }

  // ─── Polling & Download ───────────────────────────────────────────

  @Get('jobs')
  @ApiOperation({ summary: 'List render jobs for current user' })
  async listJobs(@CurrentUser() user: User) {
    return this.service.getJobs(user.id);
  }

  @Get('jobs/:id')
  @ApiOperation({ summary: 'Get render job status (for polling)' })
  async getJob(@CurrentUser() user: User, @Param('id') id: string) {
    return this.service.getJob(user.id, id);
  }

  @Get('jobs/:id/download')
  @ApiOperation({ summary: 'Download completed render output' })
  async downloadJob(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    const job = await this.service.getJob(user.id, id);
    if (job.status !== 'completed' || !job.outputPath) {
      res.status(400).json({ message: 'Job not completed or output not available' });
      return;
    }

    if (!fs.existsSync(job.outputPath)) {
      res.status(410).json({ message: 'Render output expired. Please re-render.' });
      return;
    }

    const mimeTypes: Record<string, string> = {
      mp4: 'video/mp4', webm: 'video/webm', png: 'image/png',
    };

    const ext = job.outputFormat || 'mp4';
    const stream = fs.createReadStream(job.outputPath);
    res.setHeader('Content-Type', mimeTypes[ext] || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="render-${job.id}.${ext}"`);
    stream.pipe(res);
  }

  // ─── Preview & Batch ──────────────────────────────────────────────

  @Post('preview')
  @SetUserRateLimit({ limit: 10, windowMs: 60000 })
  @ApiOperation({ summary: 'Generate instant preview frame (no queue, free)' })
  async preview(
    @CurrentUser() user: User,
    @Body() dto: RenderTemplateDto,
    @Res() res: Response,
  ) {
    const result = await this.service.previewTemplate(dto.templateId, dto.props, {
      width: dto.width,
      height: dto.height,
    });

    const stream = fs.createReadStream(result.outputPath);
    res.setHeader('Content-Type', 'image/jpeg');
    res.setHeader('Content-Disposition', `inline; filename="preview.jpg"`);
    stream.pipe(res);
    res.on('finish', () => fs.unlink(result.outputPath, () => {}));
    res.on('close', () => fs.unlink(result.outputPath, () => {}));
  }

  @Post('batch-render')
  @SetUserRateLimit({ limit: 2, windowMs: 60000 })
  @ApiOperation({ summary: 'Queue multiple render jobs at once (max 10)' })
  async batchRender(
    @CurrentUser() user: User,
    @Body() dto: { items: Array<{ templateId: string; props: Record<string, any>; format?: 'mp4' | 'webm' | 'png' }> },
  ) {
    return this.service.batchRender(user.id, dto.items);
  }

  // ─── Presets ──────────────────────────────────────────────────────

  @Get('presets')
  @ApiOperation({ summary: 'List saved presets' })
  async getPresets(@CurrentUser() user: User) {
    return this.service.getPresets(user.id);
  }

  @Post('presets')
  @ApiOperation({ summary: 'Save a preset' })
  async savePreset(
    @CurrentUser() user: User,
    @Body() dto: { templateId: string; name: string; props: Record<string, any>; format?: string },
  ) {
    return this.service.savePreset(user.id, dto);
  }

  @Post('presets/:id/delete')
  @ApiOperation({ summary: 'Delete a preset' })
  async deletePreset(@CurrentUser() user: User, @Param('id') id: string) {
    return this.service.deletePreset(user.id, id);
  }
}
