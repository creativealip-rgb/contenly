import { Controller, Get, Post, Delete, Patch, Body, Param, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { VideoClipService } from './video-clip.service';
import { CreateProjectDto, AnalyzeDto, ExportClipDto, UpdateSegmentDto } from './video-clip.dto';
import { SessionAuthGuard } from '../../common/guards/session-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import * as fs from 'fs/promises';
import * as path from 'path';

@Controller('video-clips')
@UseGuards(SessionAuthGuard)
export class VideoClipController {
  constructor(private readonly videoClipService: VideoClipService) {}

  @Post()
  async createProject(@CurrentUser() user: any, @Body() dto: CreateProjectDto) {
    return this.videoClipService.createProject(user.id, dto.sourceUrl, dto.title);
  }

  @Get()
  async getProjects(@CurrentUser() user: any) {
    return this.videoClipService.getProjects(user.id);
  }

  @Get(':id')
  async getProject(@CurrentUser() user: any, @Param('id') id: string) {
    return this.videoClipService.getProject(user.id, id);
  }

  @Delete(':id')
  async deleteProject(@CurrentUser() user: any, @Param('id') id: string) {
    return this.videoClipService.deleteProject(user.id, id);
  }

  @Post(':id/analyze')
  async analyzeVideo(@CurrentUser() user: any, @Param('id') id: string) {
    return this.videoClipService.analyzeVideo(user.id, id);
  }

  @Patch(':id/segments/:index')
  async updateSegment(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Param('index') index: string,
    @Body() dto: UpdateSegmentDto,
  ) {
    return this.videoClipService.updateSegment(user.id, id, parseInt(index), dto);
  }

  @Post('export')
  async exportClip(@CurrentUser() user: any, @Body() dto: ExportClipDto) {
    return this.videoClipService.exportClip(
      user.id,
      dto.projectId,
      dto.segmentIndex,
      dto.subtitleStyle,
      dto.titleStyle,
    );
  }

  @Get(':id/download/:jobId')
  async downloadClip(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Param('jobId') jobId: string,
    @Res() res: Response,
  ) {
    const project = await this.videoClipService.getProject(user.id, id);
    const exports = (project.exports as any[]) || [];
    const exportItem = exports.find(e => e.jobId === jobId);
    if (!exportItem) {
      return res.status(404).json({ message: 'Export not found' });
    }

    try {
      await fs.access(exportItem.outputPath);
      const filename = `clip-${path.basename(exportItem.outputPath)}`;
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Type', 'video/mp4');
      const { createReadStream } = await import('fs');
      createReadStream(exportItem.outputPath).pipe(res);
    } catch {
      return res.status(404).json({ message: 'File not found' });
    }
  }
}
