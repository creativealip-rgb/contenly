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
import { FeedsService } from './feeds.service';
import { SessionAuthGuard } from '../../common/guards/session-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { User } from '../../db/types';

@ApiTags('feeds')
@ApiBearerAuth()
@UseGuards(SessionAuthGuard)
@Controller('feeds')
export class FeedsController {
  constructor(private feedsService: FeedsService) {}

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

  @Patch(':id')
  @ApiOperation({ summary: 'Update RSS feed' })
  async update(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body()
    dto: { name?: string; url?: string; pollingIntervalMinutes?: number },
  ) {
    return this.feedsService.update(user.id, id, dto);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update RSS feed status' })
  async updateStatus(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() dto: { status: 'ACTIVE' | 'PAUSED' },
  ) {
    return this.feedsService.updateStatus(user.id, id, dto.status);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove RSS feed' })
  async delete(@CurrentUser() user: User, @Param('id') id: string) {
    return this.feedsService.delete(user.id, id);
  }

  @Post(':id/poll')
  @ApiOperation({ summary: 'Manually trigger feed polling' })
  async pollFeed(@Param('id') id: string) {
    await this.feedsService.triggerPoll(id);
    return { message: 'Feed polling initiated' };
  }

  @Get('pending-items')
  @ApiOperation({ summary: 'Get pending feed items' })
  async getPendingItems(@CurrentUser() user: User) {
    return this.feedsService.getPendingItems(user.id);
  }

  @Post('pending-items/:id/process')
  @ApiOperation({ summary: 'Process a pending feed item into an article' })
  async processPendingItem(@CurrentUser() user: User, @Param('id') id: string) {
    return this.feedsService.processPendingItem(user.id, id);
  }
}
