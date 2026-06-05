import { Controller, Get, Post, Delete, Patch, Body, Param, Query, Res, Headers, UseGuards, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { VideoClipService } from './video-clip.service';
import {
  CreateProjectDto,
  ExportClipDto,
  UpdateSegmentDto,
  AddSegmentDto,
  SplitSegmentDto,
  GenerateAlternateHooksDto,
  FetchUrlMetadataDto,
  BatchExportDto,
  BrollSearchDto,
  AddBrollItemDto,
  UpdateBrollItemDto,
  SuggestBrollKeywordsDto,
  AutoCutawayDto,
  CreatePresetDto,
  UpdatePresetDto,
} from './video-clip.dto';
import { SessionAuthGuard } from '../../common/guards/session-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import * as fs from 'fs/promises';
import * as path from 'path';
import { createReadStream, statSync } from 'fs';

@Controller('video-clips')
@UseGuards(SessionAuthGuard)
export class VideoClipController {
  constructor(private readonly videoClipService: VideoClipService) {}

  @Post()
  async createProject(@CurrentUser() user: { id: string }, @Body() dto: CreateProjectDto) {
    return this.videoClipService.createProject(user.id, dto.sourceUrl, dto.title);
  }

  @Get()
  async getProjects(@CurrentUser() user: { id: string }) {
    return this.videoClipService.getProjects(user.id);
  }

  @Post('fetch-metadata')
  async fetchMetadata(@CurrentUser() _user: { id: string }, @Body() dto: FetchUrlMetadataDto) {
    const meta = await this.videoClipService.fetchVideoMetadata(dto.sourceUrl);
    return meta || {};
  }

  // --- Presets ---

  @Get('presets')
  async listPresets(@CurrentUser() user: { id: string }) {
    return this.videoClipService.listPresets(user.id);
  }

  @Post('presets')
  async createPreset(@CurrentUser() user: { id: string }, @Body() dto: CreatePresetDto) {
    return this.videoClipService.createPreset(user.id, dto.name, dto.config as never, dto.description);
  }

  @Patch('presets/:presetId')
  async updatePreset(
    @CurrentUser() user: { id: string },
    @Param('presetId') presetId: string,
    @Body() dto: UpdatePresetDto,
  ) {
    return this.videoClipService.updatePreset(user.id, presetId, {
      name: dto.name,
      description: dto.description,
      config: dto.config as never,
      isFavorite: dto.isFavorite,
    });
  }

  @Delete('presets/:presetId')
  async deletePreset(@CurrentUser() user: { id: string }, @Param('presetId') presetId: string) {
    return this.videoClipService.deletePreset(user.id, presetId);
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 1024 * 1024 * 1024 } })) // 1GB
  async uploadVideo(
    @CurrentUser() user: { id: string },
    @UploadedFile() file: any,
    @Body('title') title?: string,
  ) {
    return this.videoClipService.createProjectFromFile(user.id, file, title);
  }

  @Get(':id')
  async getProject(@CurrentUser() user: { id: string }, @Param('id') id: string) {
    return this.videoClipService.getProject(user.id, id);
  }

  @Delete(':id')
  async deleteProject(@CurrentUser() user: { id: string }, @Param('id') id: string) {
    return this.videoClipService.deleteProject(user.id, id);
  }

  @Post(':id/analyze')
  async analyzeVideo(@CurrentUser() user: { id: string }, @Param('id') id: string) {
    return this.videoClipService.analyzeVideo(user.id, id);
  }

  // --- Segment CRUD ---

  @Patch(':id/segments/:index')
  async updateSegment(
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
    @Param('index') index: string,
    @Body() dto: UpdateSegmentDto,
  ) {
    return this.videoClipService.updateSegment(user.id, id, parseInt(index, 10), dto);
  }

  @Post(':id/segments')
  async addSegment(
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
    @Body() dto: AddSegmentDto,
  ) {
    return this.videoClipService.addCustomSegment(user.id, id, dto);
  }

  @Delete(':id/segments/:index')
  async deleteSegment(
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
    @Param('index') index: string,
  ) {
    return this.videoClipService.deleteSegment(user.id, id, parseInt(index, 10));
  }

  @Post(':id/segments/:index/duplicate')
  async duplicateSegment(
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
    @Param('index') index: string,
  ) {
    return this.videoClipService.duplicateSegment(user.id, id, parseInt(index, 10));
  }

  @Post(':id/segments/:index/split')
  async splitSegment(
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
    @Param('index') index: string,
    @Body() dto: SplitSegmentDto,
  ) {
    return this.videoClipService.splitSegment(user.id, id, parseInt(index, 10), dto.splitAt);
  }

  @Post(':id/segments/:index/alternate-hooks')
  async alternateHooks(
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
    @Param('index') index: string,
    @Body() dto: GenerateAlternateHooksDto,
  ) {
    const hooks = await this.videoClipService.generateAlternateHooks(
      user.id,
      id,
      parseInt(index, 10),
      dto.count,
    );
    return { hooks };
  }

  // --- Export ---

  @Post('export')
  async exportClip(@CurrentUser() user: { id: string }, @Body() dto: ExportClipDto) {
    return this.videoClipService.exportClip(
      user.id,
      dto.projectId,
      dto.segmentIndex,
      dto.subtitleStyle,
      dto.titleStyle,
      { aspectRatio: dto.aspectRatio, cropOffsetX: dto.cropOffsetX, includeBroll: dto.includeBroll },
    );
  }

  @Post('export-batch')
  async exportBatch(@CurrentUser() user: { id: string }, @Body() dto: BatchExportDto) {
    const jobs = [];
    for (const idx of dto.segmentIndexes) {
      const job = await this.videoClipService.exportClip(
        user.id,
        dto.projectId,
        idx,
        dto.subtitleStyle,
        dto.titleStyle,
        { aspectRatio: dto.aspectRatio, cropOffsetX: dto.cropOffsetX, includeBroll: dto.includeBroll },
      );
      jobs.push({ segmentIndex: idx, ...job });
    }
    return { jobs };
  }

  // --- B-roll plan ---

  @Post(':id/broll/search')
  async brollSearch(
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
    @Body() dto: BrollSearchDto,
  ) {
    return this.videoClipService.searchBrollFootage(user.id, id, dto);
  }

  @Get(':id/broll')
  async getBroll(@CurrentUser() user: { id: string }, @Param('id') id: string) {
    return { items: await this.videoClipService.getBrollPlan(user.id, id) };
  }

  @Post(':id/broll')
  async addBroll(
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
    @Body() dto: AddBrollItemDto,
  ) {
    const items = await this.videoClipService.addBrollItem(user.id, id, dto);
    return { items };
  }

  @Patch(':id/broll/:itemId')
  async updateBroll(
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @Body() dto: UpdateBrollItemDto,
  ) {
    const items = await this.videoClipService.updateBrollItem(user.id, id, itemId, dto);
    return { items };
  }

  @Delete(':id/broll/:itemId')
  async deleteBroll(
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
    @Param('itemId') itemId: string,
  ) {
    const items = await this.videoClipService.deleteBrollItem(user.id, id, itemId);
    return { items };
  }

  @Post(':id/broll/suggest')
  async brollSuggest(
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
    @Body() dto: SuggestBrollKeywordsDto,
  ) {
    const keywords = await this.videoClipService.suggestBrollKeywords(user.id, id, dto.segmentIndex, dto.count);
    return { keywords };
  }

  @Post(':id/broll/auto-cutaway')
  async brollAutoCutaway(
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
    @Body() dto: AutoCutawayDto,
  ) {
    const result = await this.videoClipService.autoCutaway(user.id, id, dto.segmentIndex, {
      maxOverlays: dto.maxOverlays,
      preferVideo: dto.preferVideo,
      orientation: dto.orientation,
    });
    return result;
  }

  // --- Streaming ---

  @Get(':id/stream')
  async streamVideo(
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
    @Headers('range') range: string | undefined,
    @Res() res: Response,
  ) {
    let videoPath: string;
    try {
      videoPath = await this.videoClipService.getVideoStreamPath(user.id, id);
    } catch (err) {
      return res.status(404).json({ message: (err as Error).message });
    }

    const stat = statSync(videoPath);
    const fileSize = stat.size;

    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : Math.min(start + 1024 * 1024, fileSize - 1);
      const chunkSize = end - start + 1;
      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunkSize,
        'Content-Type': 'video/mp4',
      });
      createReadStream(videoPath, { start, end }).pipe(res);
    } else {
      res.writeHead(200, {
        'Content-Length': fileSize,
        'Content-Type': 'video/mp4',
        'Accept-Ranges': 'bytes',
      });
      createReadStream(videoPath).pipe(res);
    }
  }

  @Get(':id/thumbnail')
  async getThumbnail(
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    const thumbPath = await this.videoClipService.getThumbnailPath(user.id, id);
    if (!thumbPath) {
      return res.status(404).json({ message: 'Thumbnail not available' });
    }
    res.setHeader('Content-Type', 'image/jpeg');
    res.setHeader('Cache-Control', 'private, max-age=3600');
    createReadStream(thumbPath).pipe(res);
  }

  @Get(':id/download/:jobId')
  async downloadClip(
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
    @Param('jobId') jobId: string,
    @Query('inline') inline: string | undefined,
    @Res() res: Response,
  ) {
    const project = await this.videoClipService.getProject(user.id, id);
    const exports = (project.exports as Array<{ jobId: string; outputPath: string }>) || [];
    const exportItem = exports.find(e => e.jobId === jobId);
    if (!exportItem) {
      return res.status(404).json({ message: 'Export not found' });
    }

    try {
      await fs.access(exportItem.outputPath);
      const filename = `clip-${path.basename(exportItem.outputPath)}`;
      if (!inline) {
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      }
      res.setHeader('Content-Type', 'video/mp4');
      res.setHeader('Accept-Ranges', 'bytes');
      createReadStream(exportItem.outputPath).pipe(res);
    } catch {
      return res.status(404).json({ message: 'File not found' });
    }
  }
}
