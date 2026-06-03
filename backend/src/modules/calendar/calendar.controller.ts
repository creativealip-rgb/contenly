import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SessionAuthGuard } from '../../common/guards/session-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { User } from '../../db/types';
import { CalendarService, CreateScheduledContentDto, UpdateScheduledContentDto } from './calendar.service';

@ApiTags('Calendar')
@ApiBearerAuth()
@UseGuards(SessionAuthGuard)
@Controller('calendar')
export class CalendarController {
  constructor(private readonly service: CalendarService) {}

  @Post()
  @ApiOperation({ summary: 'Create scheduled content' })
  async create(@CurrentUser() user: User, @Body() dto: CreateScheduledContentDto) {
    return this.service.create(user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all scheduled content' })
  async findAll(
    @CurrentUser() user: User,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.service.findAll(
      user.id,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  @Get('upcoming')
  @ApiOperation({ summary: 'Get upcoming scheduled content' })
  async getUpcoming(@CurrentUser() user: User, @Query('days') days?: number) {
    return this.service.getUpcoming(user.id, days || 7);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get calendar statistics' })
  async getStats(@CurrentUser() user: User) {
    return this.service.getStats(user.id);
  }

  @Get('month/:year/:month')
  @ApiOperation({ summary: 'Get calendar data for a specific month' })
  async getMonthData(
    @CurrentUser() user: User,
    @Param('year') year: string,
    @Param('month') month: string,
  ) {
    return this.service.getCalendarData(user.id, parseInt(year), parseInt(month));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get scheduled content by ID' })
  async findById(@CurrentUser() user: User, @Param('id') id: string) {
    return this.service.findById(user.id, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update scheduled content' })
  async update(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() dto: UpdateScheduledContentDto,
  ) {
    return this.service.update(user.id, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete scheduled content' })
  async delete(@CurrentUser() user: User, @Param('id') id: string) {
    return this.service.delete(user.id, id);
  }

  @Post(':id/publish')
  @ApiOperation({ summary: 'Mark content as published' })
  async markPublished(@CurrentUser() user: User, @Param('id') id: string) {
    return this.service.markAsPublished(user.id, id);
  }
}
