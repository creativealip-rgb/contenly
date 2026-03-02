import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SessionAuthGuard } from '../../common/guards/session-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { User } from '../../db/types';
import { BrandKitService, CreateBrandKitDto, UpdateBrandKitDto } from './brand-kit.service';

@ApiTags('Brand Kit')
@ApiBearerAuth()
@UseGuards(SessionAuthGuard)
@Controller('brand-kit')
export class BrandKitController {
  constructor(private readonly service: BrandKitService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new brand kit' })
  async create(@CurrentUser() user: User, @Body() dto: CreateBrandKitDto) {
    return this.service.create(user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all brand kits' })
  async findAll(@CurrentUser() user: User) {
    return this.service.findAll(user.id);
  }

  @Get('default')
  @ApiOperation({ summary: 'Get default brand kit' })
  async getDefault(@CurrentUser() user: User) {
    return this.service.getDefault(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get brand kit by ID' })
  async findById(@CurrentUser() user: User, @Param('id') id: string) {
    return this.service.findById(user.id, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update brand kit' })
  async update(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() dto: UpdateBrandKitDto,
  ) {
    return this.service.update(user.id, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete brand kit' })
  async delete(@CurrentUser() user: User, @Param('id') id: string) {
    return this.service.delete(user.id, id);
  }

  @Post(':id/set-default')
  @ApiOperation({ summary: 'Set brand kit as default' })
  async setDefault(@CurrentUser() user: User, @Param('id') id: string) {
    return this.service.setDefault(user.id, id);
  }

  @Post(':id/apply/:projectId')
  @ApiOperation({ summary: 'Apply brand kit to carousel project' })
  async applyToCarousel(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Param('projectId') projectId: string,
  ) {
    return this.service.applyToCarousel(user.id, id, projectId);
  }
}
