import { Controller, Get, Post, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { FeedsService } from './feeds.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '@prisma/client';

@ApiTags('feeds')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('feeds')
export class FeedsController {
    constructor(private feedsService: FeedsService) { }

    @Get()
    @ApiOperation({ summary: 'List all RSS feeds' })
    async findAll(@CurrentUser() user: User) {
        return this.feedsService.findAll(user.id);
    }

    @Post()
    @ApiOperation({ summary: 'Add new RSS feed' })
    async create(
        @CurrentUser() user: User,
        @Body() dto: { name: string; url: string; pollingIntervalMinutes?: number },
    ) {
        return this.feedsService.create(user.id, dto);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Remove RSS feed' })
    async delete(@CurrentUser() user: User, @Param('id') id: string) {
        return this.feedsService.delete(user.id, id);
    }
}
