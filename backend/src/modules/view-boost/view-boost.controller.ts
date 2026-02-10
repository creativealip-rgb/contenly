import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ViewBoostService } from './view-boost.service';
import { CreateViewBoostJobDto } from './dto/view-boost-job.dto';
import { SessionAuthGuard } from '../../common/guards/session-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { User } from '../../db/types';

@ApiTags('View Boost')
@Controller('view-boost')
@UseGuards(SessionAuthGuard)
export class ViewBoostController {
  constructor(private readonly viewBoostService: ViewBoostService) { }

  @Post('jobs')
  @ApiOperation({ summary: 'Create a new view boost job' })
  async createJob(@Body() dto: CreateViewBoostJobDto, @CurrentUser() user: User) {
    const job = await this.viewBoostService.createJob(user.id, dto);
    return {
      success: true,
      data: job,
    };
  }

  @Get('jobs')
  @ApiOperation({ summary: 'Get all view boost jobs' })
  async getJobs(@CurrentUser() user: User) {
    const jobs = await this.viewBoostService.getJobs(user.id);
    return {
      success: true,
      data: jobs.map(job => ({
        ...job,
        progress: Math.round((job.currentViews / job.targetViews) * 100),
      })),
    };
  }

  @Post('jobs/:id/start')
  @ApiOperation({ summary: 'Start a view boost job' })
  async startJob(@Param('id') id: string, @CurrentUser() user: User) {
    await this.viewBoostService.startJob(id, user.id);
    return {
      success: true,
      message: 'Job started successfully',
    };
  }

  @Post('jobs/:id/pause')
  @ApiOperation({ summary: 'Pause a view boost job' })
  async pauseJob(@Param('id') id: string, @CurrentUser() user: User) {
    await this.viewBoostService.pauseJob(id, user.id);
    return {
      success: true,
      message: 'Job paused successfully',
    };
  }

  @Delete('jobs/:id')
  @ApiOperation({ summary: 'Delete a view boost job' })
  async deleteJob(@Param('id') id: string, @CurrentUser() user: User) {
    await this.viewBoostService.deleteJob(id, user.id);
    return {
      success: true,
      message: 'Job deleted successfully',
    };
  }
}

