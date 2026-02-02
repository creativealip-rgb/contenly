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
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ArticlesService } from './articles.service';
import { CreateArticleDto, UpdateArticleDto } from './dto';
import { SessionAuthGuard } from '../../common/guards/session-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { User } from '../../db/types';

@ApiTags('articles')
@ApiBearerAuth()
@UseGuards(SessionAuthGuard)
@Controller('articles')
export class ArticlesController {
  constructor(private articlesService: ArticlesService) {}

  @Get()
  @ApiOperation({ summary: 'List all articles' })
  async findAll(
    @CurrentUser() user: User,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: string,
    @Query('wpSiteId') wpSiteId?: string,
    @Query('search') search?: string,
  ) {
    return this.articlesService.findAll(user.id, {
      page,
      limit,
      status,
      wpSiteId,
      search,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get article details' })
  async findById(@CurrentUser() user: User, @Param('id') id: string) {
    return this.articlesService.findById(user.id, id);
  }

  @Post()
  @ApiOperation({ summary: 'Create new article' })
  async create(@CurrentUser() user: User, @Body() dto: CreateArticleDto) {
    return this.articlesService.create(user.id, dto);
  }

  @Patch(':id/publish')
  @ApiOperation({ summary: 'Publish article to WordPress' })
  @HttpCode(HttpStatus.OK)
  async publishToWordPress(@CurrentUser() user: User, @Param('id') id: string) {
    return this.articlesService.publishToWordPress(user.id, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update article' })
  async update(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() dto: UpdateArticleDto,
  ) {
    return this.articlesService.update(user.id, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete article' })
  async delete(@CurrentUser() user: User, @Param('id') id: string) {
    return this.articlesService.delete(user.id, id);
  }
}
