import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import type { Request } from 'express';
import { ArticlesService } from './articles.service';
import { CreateArticleDto, UpdateArticleDto } from './dto';
import { AuthGuard } from '../../common/guards/auth.guard';

@ApiTags('articles')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('articles')
export class ArticlesController {
    constructor(private articlesService: ArticlesService) { }

    @Get()
    @ApiOperation({ summary: 'List all articles' })
    async findAll(
        @Req() req: Request,
        @Query('page') page?: number,
        @Query('limit') limit?: number,
        @Query('status') status?: string,
        @Query('wpSiteId') wpSiteId?: string,
        @Query('search') search?: string,
    ) {
        const userId = (req as any).user?.id;
        return this.articlesService.findAll(userId, { page, limit, status, wpSiteId, search });
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get article details' })
    async findById(@Req() req: Request, @Param('id') id: string) {
        const userId = (req as any).user?.id;
        return this.articlesService.findById(userId, id);
    }

    @Post()
    @ApiOperation({ summary: 'Create new article' })
    async create(@Req() req: Request, @Body() dto: CreateArticleDto) {
        const userId = (req as any).user?.id;
        return this.articlesService.create(userId, dto);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update article' })
    async update(
        @Req() req: Request,
        @Param('id') id: string,
        @Body() dto: UpdateArticleDto,
    ) {
        const userId = (req as any).user?.id;
        return this.articlesService.update(userId, id, dto);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete article' })
    async delete(@Req() req: Request, @Param('id') id: string) {
        const userId = (req as any).user?.id;
        return this.articlesService.delete(userId, id);
    }
}
