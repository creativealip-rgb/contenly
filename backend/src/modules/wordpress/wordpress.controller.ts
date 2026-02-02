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
import { WordpressService } from './wordpress.service';
import { SessionAuthGuard } from '../../common/guards/session-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { User } from '../../db/types';

@ApiTags('wordpress')
@ApiBearerAuth()
@UseGuards(SessionAuthGuard)
@Controller('wordpress')
export class WordpressController {
  constructor(private wordpressService: WordpressService) {}

  @Get('sites')
  @ApiOperation({ summary: 'List connected WordPress sites' })
  async getSites(@CurrentUser() user: User) {
    return this.wordpressService.getSites(user.id);
  }

  @Post('sites')
  @ApiOperation({ summary: 'Connect a new WordPress site' })
  async connectSite(
    @CurrentUser() user: User,
    @Body()
    dto: { name: string; url: string; username: string; appPassword: string },
  ) {
    return this.wordpressService.connectSite(user.id, dto);
  }

  @Post('sites/:id/test')
  @ApiOperation({ summary: 'Test site connection' })
  async testConnection(@Param('id') siteId: string) {
    return this.wordpressService.verifySiteConnection(siteId);
  }

  @Get('sites/:id/categories')
  @ApiOperation({ summary: 'Sync and get categories from WordPress' })
  async getCategories(@Param('id') siteId: string) {
    return this.wordpressService.syncCategories(siteId);
  }

  @Delete('sites/:id')
  @ApiOperation({ summary: 'Disconnect WordPress site' })
  async deleteSite(@CurrentUser() user: User, @Param('id') siteId: string) {
    return this.wordpressService.deleteSite(user.id, siteId);
  }

  @Post('publish')
  @ApiOperation({ summary: 'Publish article to WordPress' })
  async publishArticle(
    @CurrentUser() user: User,
    @Body(new PublishArticleDto())
    dto: PublishArticleDto,
  ) {
    return this.wordpressService.publishArticle(user.id, dto);
  }
}
}
