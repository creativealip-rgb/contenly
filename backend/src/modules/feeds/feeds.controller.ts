import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUrl } from 'class-validator';
import { FeedsService } from './feeds.service';
import { SessionAuthGuard } from '../../common/guards/session-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { User } from '../../db/types';

import { CreateFeedDto } from './dto/create-feed.dto';
import { UpdateFeedDto } from './dto/update-feed.dto';

class ParseFeedDto {
  @ApiProperty({ example: 'https://example.com/feed' })
  @IsUrl()
  @IsNotEmpty()
  url: string;
}

@ApiTags('feeds')
@ApiBearerAuth()
@UseGuards(SessionAuthGuard)
@Controller('feeds')
export class FeedsController {
  constructor(private feedsService: FeedsService) { }

  @Get()
  @ApiOperation({ summary: 'List all RSS feeds' })
  async findAll(
    @CurrentUser() user: User,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.feedsService.findAll(user.id, Number(page) || 1, Number(limit) || 20);
  }

  @Post()
  @ApiOperation({ summary: 'Add new RSS feed' })
  async create(
    @CurrentUser() user: User,
    @Body() dto: CreateFeedDto,
  ) {
    return this.feedsService.create(user.id, dto);
  }

  @Post('fetch-items')
  @ApiOperation({ summary: 'Parse RSS feed from URL and return items' })
  async parseFeedUrl(@Body() dto: ParseFeedDto) {
    return this.feedsService.parseFeedUrl(dto.url);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove RSS feed' })
  async delete(@CurrentUser() user: User, @Param('id') id: string) {
    return this.feedsService.delete(user.id, id);
  }

  @Post(':id')
  @ApiOperation({ summary: 'Update RSS feed' })
  async update(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() dto: UpdateFeedDto,
  ) {
    return this.feedsService.update(user.id, id, dto);
  }

  @Post(':id/poll')
  @ApiOperation({ summary: 'Manually trigger feed polling' })
  async pollFeed(@CurrentUser() user: User, @Param('id') id: string) {
    const result = await this.feedsService.triggerPoll(user.id, id);
    return {
      message: 'Feed polling completed',
      data: result,
    };
  }
}
