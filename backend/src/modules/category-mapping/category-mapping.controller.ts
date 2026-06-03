import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CategoryMappingService } from './category-mapping.service';
import { SessionAuthGuard } from '../../common/guards/session-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { User } from '../../db/types';

@ApiTags('category-mapping')
@ApiBearerAuth()
@UseGuards(SessionAuthGuard)
@Controller('category-mapping')
export class CategoryMappingController {
  constructor(private categoryMappingService: CategoryMappingService) {}

  @Get()
  @ApiOperation({ summary: "Get category mappings for user\\'s active site" })
  async getMappings(@CurrentUser() user: User) {
    return this.categoryMappingService.getMappings(user.id);
  }

  @Post()
  @ApiOperation({ summary: 'Save/update category mappings' })
  async saveMappings(
    @CurrentUser() user: User,
    @Body()
    dto: {
      mappings: Array<{ source: string; targetId: string; targetName: string }>;
    },
  ) {
    return this.categoryMappingService.saveMappings(user.id, dto.mappings);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a category mapping' })
  async deleteMapping(@Param('id') id: string) {
    return this.categoryMappingService.deleteMapping(id);
  }
}
