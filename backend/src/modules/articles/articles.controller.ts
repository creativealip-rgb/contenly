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
import { ArticlesService } from './articles.service';
import { CreateArticleDto, UpdateArticleDto, BulkDeleteDto, BulkStatusDto } from './dto';
import { SessionAuthGuard } from '../../common/guards/session-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { User, ArticleStatus } from '../../db/types';

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

  @Get('stats/summary')
  @ApiOperation({ summary: 'Aggregate stats per status + total tokens' })
  async getStats(@CurrentUser() user: User) {
    return this.articlesService.getStats(user.id);
  }

  @Post('bulk/delete')
  @ApiOperation({ summary: 'Delete multiple articles' })
  async bulkDelete(@CurrentUser() user: User, @Body() dto: BulkDeleteDto) {
    return this.articlesService.bulkDelete(user.id, dto.ids);
  }

  @Post('bulk/status')
  @ApiOperation({ summary: 'Update status for multiple articles' })
  async bulkStatus(@CurrentUser() user: User, @Body() dto: BulkStatusDto) {
    return this.articlesService.bulkUpdateStatus(user.id, dto.ids, dto.status as ArticleStatus);
  }
}
