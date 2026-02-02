import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { IntegrationsService } from './integrations.service';
import { CreateSiteDto } from './dto/create-site.dto';
import { UpdateSiteDto } from './dto/update-site.dto';
import { CreateMappingDto } from './dto/create-mapping.dto';
import { AuthGuard } from '../../common/guards/auth.guard';

@ApiTags('integrations')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('integrations')
export class IntegrationsController {
  constructor(private readonly integrationsService: IntegrationsService) {}

  // Get user ID from request (Better Auth session via AuthGuard)
  private getUserId(req: Request): string {
    const userId = (req as any).user?.id;
    if (!userId) {
      throw new Error('User not authenticated');
    }
    return userId;
  }

  @Post('sites')
  @ApiOperation({ summary: 'Create a new WordPress site integration' })
  @ApiResponse({ status: 201, description: 'Site created successfully' })
  async createSite(@Req() req: Request, @Body() dto: CreateSiteDto) {
    const userId = this.getUserId(req);
    return this.integrationsService.createSite(userId, dto);
  }

  @Get('sites')
  @ApiOperation({
    summary: 'Get all WordPress sites for the authenticated user',
  })
  @ApiResponse({ status: 200, description: 'Sites retrieved successfully' })
  async getUserSites(@Req() req: Request) {
    const userId = this.getUserId(req);
    return this.integrationsService.getUserSites(userId);
  }

  @Get('sites/:id')
  @ApiOperation({ summary: 'Get a specific WordPress site' })
  @ApiResponse({ status: 200, description: 'Site retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Site not found' })
  async getSite(@Req() req: Request, @Param('id') siteId: string) {
    const userId = this.getUserId(req);
    return this.integrationsService.getSite(siteId, userId);
  }

  @Put('sites/:id')
  @ApiOperation({ summary: 'Update a WordPress site' })
  @ApiResponse({ status: 200, description: 'Site updated successfully' })
  @ApiResponse({ status: 404, description: 'Site not found' })
  async updateSite(
    @Req() req: any,
    @Param('id') siteId: string,
    @Body() dto: UpdateSiteDto,
  ) {
    const userId = this.getUserId(req);
    return this.integrationsService.updateSite(siteId, userId, dto);
  }

  @Delete('sites/:id')
  @ApiOperation({ summary: 'Delete a WordPress site' })
  @ApiResponse({ status: 200, description: 'Site deleted successfully' })
  @ApiResponse({ status: 404, description: 'Site not found' })
  async deleteSite(@Req() req: any, @Param('id') siteId: string) {
    const userId = this.getUserId(req);
    return this.integrationsService.deleteSite(siteId, userId);
  }

  @Post('sites/:id/test')
  @ApiOperation({ summary: 'Test WordPress site connection' })
  @ApiResponse({ status: 200, description: 'Connection test completed' })
  async testConnection(@Req() req: any, @Param('id') siteId: string) {
    const userId = this.getUserId(req);
    return this.integrationsService.testConnection(siteId, userId);
  }

  @Post('sites/:id/categories/refresh')
  @ApiOperation({ summary: 'Fetch and refresh categories from WordPress site' })
  @ApiResponse({
    status: 200,
    description: 'Categories refreshed successfully',
  })
  async refreshCategories(@Req() req: any, @Param('id') siteId: string) {
    const userId = this.getUserId(req);
    return this.integrationsService.refreshCategories(siteId, userId);
  }

  @Get('sites/:id/categories')
  @ApiOperation({ summary: 'Get category mappings for a site' })
  @ApiResponse({
    status: 200,
    description: 'Category mappings retrieved successfully',
  })
  async getCategoryMappings(@Req() req: any, @Param('id') siteId: string) {
    const userId = this.getUserId(req);
    return this.integrationsService.getCategoryMappings(siteId, userId);
  }

  @Put('categories/:id')
  @ApiOperation({ summary: 'Update a category mapping' })
  @ApiResponse({ status: 200, description: 'Mapping updated successfully' })
  async updateMapping(
    @Param('id') mappingId: string,
    @Body() dto: CreateMappingDto,
  ) {
    return this.integrationsService.updateMapping(mappingId, dto);
  }

  @Delete('categories/:id')
  @ApiOperation({ summary: 'Delete a category mapping' })
  @ApiResponse({ status: 200, description: 'Mapping deleted successfully' })
  async deleteMapping(@Param('id') mappingId: string) {
    return this.integrationsService.deleteMapping(mappingId);
  }
}
