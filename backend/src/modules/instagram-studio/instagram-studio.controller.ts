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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SessionAuthGuard } from '../../common/guards/session-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { User } from '../../db/types';
import { InstagramStudioService } from './instagram-studio.service';
import {
  CreateProjectDto,
  UpdateProjectDto,
  UpdateSlideDto,
  GenerateStoryboardDto,
  InstagramGenerateImageDto,
  ExportCarouselDto,
  CreateSlideDto,
  ReorderSlidesDto,
} from './dto';

@ApiTags('Instagram Studio')
@ApiBearerAuth()
@UseGuards(SessionAuthGuard)
@Controller('instagram-studio')
export class InstagramStudioController {
  constructor(private readonly service: InstagramStudioService) { }

  @Post('projects')
  @ApiOperation({ summary: 'Create a new Instagram project' })
  async createProject(
    @CurrentUser() user: User,
    @Body() dto: CreateProjectDto,
  ) {
    return this.service.createProject(user.id, dto);
  }

  @Get('projects')
  @ApiOperation({ summary: 'List all Instagram projects' })
  async getProjects(@CurrentUser() user: User) {
    return this.service.getProjects(user.id);
  }

  @Get('projects/:id')
  @ApiOperation({ summary: 'Get project details with slides' })
  async getProject(@CurrentUser() user: User, @Param('id') id: string) {
    return this.service.getProject(user.id, id);
  }

  @Patch('projects/:id')
  @ApiOperation({ summary: 'Update project settings' })
  async updateProject(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() dto: UpdateProjectDto,
  ) {
    return this.service.updateProject(user.id, id, dto);
  }

  @Delete('projects/:id')
  @ApiOperation({ summary: 'Delete a project' })
  async deleteProject(@CurrentUser() user: User, @Param('id') id: string) {
    return this.service.deleteProject(user.id, id);
  }

  @Post('projects/:id/generate-storyboard')
  @ApiOperation({ summary: 'Generate storyboard from content' })
  async generateStoryboard(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() dto: GenerateStoryboardDto,
  ) {
    return this.service.generateStoryboard(user.id, id, dto);
  }

  @Post('slides/:id/generate-image')
  @ApiOperation({ summary: 'Generate or swap an image for a slide' })
  async generateImage(
    @CurrentUser() user: User,
    @Param('id') slideId: string,
    @Body() dto: InstagramGenerateImageDto,
  ) {
    return this.service.generateImage(user.id, slideId, dto);
  }

  @Patch('slides/:id')
  @ApiOperation({ summary: 'Update slide content and settings' })
  async updateSlide(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() dto: UpdateSlideDto,
  ) {
    return this.service.updateSlide(user.id, id, dto);
  }

  @Post('projects/:id/export')
  @ApiOperation({ summary: 'Export carousel as images' })
  async exportCarousel(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() dto: ExportCarouselDto,
  ) {
    return this.service.exportCarousel(user.id, id, dto);
  }

  @Get('fonts')
  @ApiOperation({ summary: 'List available Google Fonts' })
  async getFonts() {
    return this.service.getFonts();
  }

  @Get('styles')
  @ApiOperation({ summary: 'List available style presets' })
  async getStyles() {
    return this.service.getStyles();
  }

  // --- Slide Management APIs ---

  @Post('projects/:id/slides')
  @ApiOperation({ summary: 'Add a new slide to a project' })
  async createSlide(
    @CurrentUser() user: User,
    @Param('id') projectId: string,
    @Body() dto: CreateSlideDto,
  ) {
    return this.service.createSlide(user.id, projectId, dto);
  }

  @Delete('slides/:id')
  @ApiOperation({ summary: 'Delete a slide' })
  async deleteSlide(@CurrentUser() user: User, @Param('id') slideId: string) {
    return this.service.deleteSlide(user.id, slideId);
  }

  @Patch('projects/:id/slides/reorder')
  @ApiOperation({ summary: 'Reorder slides in a project' })
  async reorderSlides(
    @CurrentUser() user: User,
    @Param('id') projectId: string,
    @Body() dto: ReorderSlidesDto,
  ) {
    return this.service.reorderSlides(user.id, projectId, dto);
  }

  @Patch('projects/:id/apply-style-to-all')
  @ApiOperation({ summary: 'Apply styles to all slides in a project' })
  async applyStyleToAll(
    @CurrentUser() user: User,
    @Param('id') projectId: string,
    @Body() dto: UpdateSlideDto,
  ) {
    return this.service.applyStyleToAll(user.id, projectId, dto);
  }
}
