import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SessionAuthGuard } from '../../common/guards/session-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { User } from '../../db/types';
import { VideoScriptService } from './video-script.service';
import {
  CreateScriptProjectDto,
  GenerateScriptDto,
  UpdateScriptSceneDto,
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

  @Patch('scenes/:id')
  @ApiOperation({ summary: 'Update a specific scene content' })
  async updateScene(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() dto: UpdateScriptSceneDto,
  ) {
    return this.service.updateScene(user.id, id, dto);
  }
}
