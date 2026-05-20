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
  @ApiOperation({ summary: 'Render a motion graphics template to video/image' })
  async renderTemplate(
    @CurrentUser() user: User,
    @Body() dto: RenderTemplateDto,
    @Res() res: Response,
  ) {
    const result = await this.service.renderTemplate(user.id, dto.templateId, dto.props, {
      format: dto.format,
      durationFrames: dto.durationFrames,
      width: dto.width,
      height: dto.height,
    });

    const mimeTypes: Record<string, string> = {
      mp4: 'video/mp4',
      webm: 'video/webm',
      png: 'image/png',
    };

    const stream = fs.createReadStream(result.outputPath);
    res.setHeader('Content-Type', mimeTypes[result.format] || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${dto.templateId}.${result.format}"`);
    stream.pipe(res);

    // Cleanup after send (handles both normal end and client disconnect)
    const cleanup = () => {
      fs.unlink(result.outputPath, () => {});
    };
    res.on('finish', cleanup);
    res.on('close', cleanup);
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
  @ApiOperation({ summary: 'Render auto-caption video from word timestamps (WebM transparent)' })
  async renderCaption(
    @CurrentUser() user: User,
    @Body() dto: RenderCaptionDto,
    @Res() res: Response,
  ) {
    const result = await this.service.renderCaption(user.id, dto.words, {
      style: dto.style,
      textColor: dto.textColor,
      highlightColor: dto.highlightColor,
      fontSize: dto.fontSize,
    });

    const stream = fs.createReadStream(result.outputPath);
    res.setHeader('Content-Type', 'video/webm');
    res.setHeader('Content-Disposition', 'attachment; filename="caption.webm"');
    stream.pipe(res);
    const cleanup = () => fs.unlink(result.outputPath, () => {});
    res.on('finish', cleanup);
    res.on('close', cleanup);
  }

  @Post('compose-video')
  @SetUserRateLimit({ limit: 2, windowMs: 60000 })
  @ApiOperation({ summary: 'Compose full video from a Video Script project (scenes → 1 video)' })
  async composeVideo(
    @CurrentUser() user: User,
    @Body() dto: ComposeVideoDto,
    @Res() res: Response,
  ) {
    const result = await this.service.composeVideo(user.id, dto.projectId, {
      showCaptions: dto.showCaptions,
      captionStyle: dto.captionStyle,
      aspectRatio: dto.aspectRatio,
      includeAudio: dto.includeAudio,
      voice: dto.voice,
    });

    const stream = fs.createReadStream(result.outputPath);
    res.setHeader('Content-Type', 'video/mp4');
    res.setHeader('Content-Disposition', 'attachment; filename="composed-video.mp4"');
    stream.pipe(res);
    const cleanup = () => fs.unlink(result.outputPath, () => {});
    res.on('finish', cleanup);
    res.on('close', cleanup);
  }
}
