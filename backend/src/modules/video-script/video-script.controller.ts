import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SessionAuthGuard } from '../../common/guards/session-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { User } from '../../db/types';
import { VideoScriptService } from './video-script.service';
import {
  CreateScriptProjectDto,
  GenerateScriptDto,
  RegenerateScriptFieldDto,
  UpdateScriptProjectDto,
  UpdateScriptSceneDto,
  FetchSceneFootageDto,
  SelectSceneFootageDto,
  AddSceneDto,
  ReorderScenesDto,
  TtsPreviewDto,
} from './video-script.dto';

@ApiTags('Video Scripts')
@ApiBearerAuth()
@UseGuards(SessionAuthGuard)
@Controller('video-scripts')
export class VideoScriptController {
  constructor(private readonly service: VideoScriptService) {}

  @Post('projects')
  @ApiOperation({ summary: 'Create a new Video Script project' })
  async createProject(
    @CurrentUser() user: User,
    @Body() dto: CreateScriptProjectDto,
  ) {
    return this.service.createProject(user.id, dto);
  }

  @Get('projects')
  @ApiOperation({ summary: 'List all Video Script projects' })
  async getProjects(@CurrentUser() user: User) {
    return this.service.getProjects(user.id);
  }

  @Get('projects/:id')
  @ApiOperation({ summary: 'Get script project details with scenes' })
  async getProject(@CurrentUser() user: User, @Param('id') id: string) {
    return this.service.getProject(user.id, id);
  }

  @Delete('projects/:id')
  @ApiOperation({ summary: 'Delete a script project' })
  async deleteProject(@CurrentUser() user: User, @Param('id') id: string) {
    return this.service.deleteProject(user.id, id);
  }

  @Patch('projects/:id/generate-script')
  @ApiOperation({ summary: 'Generate a video script from article content' })
  async generateScript(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() dto: GenerateScriptDto,
  ) {
    return this.service.generateScript(user.id, id, dto);
  }

  @Patch('projects/:id')
  @ApiOperation({ summary: 'Update video script project metadata' })
  async updateProject(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() dto: UpdateScriptProjectDto,
  ) {
    return this.service.updateProject(user.id, id, dto);
  }

  @Post('projects/:id/regenerate')
  @ApiOperation({ summary: 'Regenerate a specific video script field' })
  async regenerateProjectField(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() dto: RegenerateScriptFieldDto,
  ) {
    return this.service.regenerateProjectField(user.id, id, dto.field);
  }

  @Patch('scenes/:id')
  @ApiOperation({ summary: 'Update a specific scene content' })
  async updateScene(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() dto: UpdateScriptSceneDto,
  ) {
    return this.service.updateScene(user.id, id, dto);
  }

  @Post('scenes/:id/regenerate-voiceover')
  @ApiOperation({ summary: 'Regenerate a specific scene voiceover' })
  async regenerateSceneVoiceover(
    @CurrentUser() user: User,
    @Param('id') id: string,
  ) {
    return this.service.regenerateSceneVoiceover(user.id, id);
  }

  @Post('scenes/:id/fetch-footage')
  @ApiOperation({ summary: 'Fetch footage suggestions (Pexels + Google) for a scene' })
  async fetchSceneFootage(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() dto: FetchSceneFootageDto,
  ) {
    return this.service.fetchSceneFootage(user.id, id, dto);
  }

  @Patch('scenes/:id/select-footage')
  @ApiOperation({ summary: 'Attach selected footage items to a scene' })
  async selectSceneFootage(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() dto: SelectSceneFootageDto,
  ) {
    return this.service.selectSceneFootage(user.id, id, dto.items as any);
  }

  @Post('projects/:id/scenes')
  @ApiOperation({ summary: 'Add a new empty scene to a project' })
  async addScene(
    @CurrentUser() user: User,
    @Param('id') projectId: string,
    @Body() dto: AddSceneDto,
  ) {
    return this.service.addScene(user.id, projectId, dto);
  }

  @Post('scenes/:id/duplicate')
  @ApiOperation({ summary: 'Duplicate a scene (insert copy right after it)' })
  async duplicateScene(
    @CurrentUser() user: User,
    @Param('id') id: string,
  ) {
    return this.service.duplicateScene(user.id, id);
  }

  @Delete('scenes/:id')
  @ApiOperation({ summary: 'Delete a scene and renumber subsequent scenes' })
  async deleteScene(
    @CurrentUser() user: User,
    @Param('id') id: string,
  ) {
    return this.service.deleteScene(user.id, id);
  }

  @Patch('projects/:id/scenes/reorder')
  @ApiOperation({ summary: 'Reorder all scenes by ordered ID array' })
  async reorderScenes(
    @CurrentUser() user: User,
    @Param('id') projectId: string,
    @Body() dto: ReorderScenesDto,
  ) {
    return this.service.reorderScenes(user.id, projectId, dto.orderedSceneIds);
  }

  @Post('scenes/:id/tts-preview')
  @ApiOperation({ summary: 'Generate MP3 TTS audio for a single scene voiceover' })
  async ttsPreviewScene(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() dto: TtsPreviewDto,
    @Res() res: Response,
  ) {
    const result = await this.service.ttsPreviewScene(user.id, id, dto.voice);
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader(
      'Content-Disposition',
      `inline; filename="${result.filename}"`,
    );
    res.send(result.buffer);
  }

  @Get('projects/:id/export')
  @ApiOperation({ summary: 'Export video script in various formats' })
  async exportScript(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Query('format') format: 'json' | 'srt' | 'txt' | 'caption',
  ) {
    return this.service.exportScript(user.id, id, format || 'json');
  }

  @Post('projects/:id/export/audio')
  @ApiOperation({ summary: 'Export video script as MP3 voiceover using TTS' })
  async exportAudio(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body()
    body: { voice?: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer' },
    @Res() res: Response,
  ) {
    const result = await this.service.exportAudio(
      user.id,
      id,
      body.voice || 'alloy',
    );

    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${result.filename}"`,
    );
    res.send(result.buffer);
  }
}
