import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ViewBoostService } from './view-boost.service';
import { CreateViewBoostJobDto } from './dto/view-boost-job.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@ApiTags('View Boost')
@Controller('api/view-boost')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ViewBoostController {
  constructor(private readonly viewBoostService: ViewBoostService) {}

  @Post('jobs')
  @ApiOperation({ summary: 'Create a new view boost job' })
  async createJob(@Body() dto: CreateViewBoostJobDto, @Request() req) {
    const job = await this.viewBoostService.createJob(req.user.userId, dto);
    return {
      success: true,
      data: job,
    };
  }

  @Get('jobs')
  @ApiOperation({ summary: 'Get all view boost jobs' })
  async getJobs(@Request() req) {
    const jobs = await this.viewBoostService.getJobs(req.user.userId);
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
  async startJob(@Param('id') id: string, @Request() req) {
    await this.viewBoostService.startJob(id, req.user.userId);
    return {
      success: true,
      message: 'Job started successfully',
    };
  }

  @Post('jobs/:id/pause')
  @ApiOperation({ summary: 'Pause a view boost job' })
  async pauseJob(@Param('id') id: string, @Request() req) {
    await this.viewBoostService.pauseJob(id, req.user.userId);
    return {
      success: true,
      message: 'Job paused successfully',
    };
  }

  @Delete('jobs/:id')
  @ApiOperation({ summary: 'Delete a view boost job' })
  async deleteJob(@Param('id') id: string, @Request() req) {
    await this.viewBoostService.deleteJob(id, req.user.userId);
    return {
      success: true,
      message: 'Job deleted successfully',
    };
  }
}
