import { Controller, Post, Body, UseGuards, Get, Param, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SessionAuthGuard } from '../../common/guards/session-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { User } from '../../db/types';
import { SocialService } from './social.service';

class ConnectInstagramDto {
  accessToken: string;
  accountId: string;
}

class PostToInstagramDto {
  imageUrls: string[];
  caption: string;
  hashtags?: string[];
  isCarousel?: boolean;
}

@ApiTags('Social Media')
@ApiBearerAuth()
@UseGuards(SessionAuthGuard)
@Controller('social')
export class SocialController {
  constructor(private readonly socialService: SocialService) {}

  @Get('accounts')
  @ApiOperation({ summary: 'Get connected social media accounts' })
  async getConnectedAccounts(@CurrentUser() user: User) {
    return this.socialService.getConnectedAccounts(user.id);
  }

  @Post('instagram/connect')
  @ApiOperation({ summary: 'Connect Instagram account' })
  async connectInstagram(
    @CurrentUser() user: User,
    @Body() dto: ConnectInstagramDto,
  ) {
    return this.socialService.connectInstagram(
      user.id,
      dto.accessToken,
      dto.accountId
    );
  }

  @Delete('instagram/disconnect')
  @ApiOperation({ summary: 'Disconnect Instagram account' })
  async disconnectInstagram(@CurrentUser() user: User) {
    return this.socialService.disconnectInstagram(user.id);
  }

  @Get('instagram/status')
  @ApiOperation({ summary: 'Check if Instagram is connected' })
  async checkInstagramStatus(@CurrentUser() user: User) {
    const isConnected = await this.socialService.isInstagramConnected(user.id);
    
    if (isConnected) {
      const account = await this.socialService.getInstagramAccount(user.id);
      return {
        connected: true,
        username: account?.username,
        message: 'Instagram is connected and ready to use',
      };
    }

    return {
      connected: false,
      message: 'Please connect your Instagram account first',
    };
  }

  @Post('instagram/post')
  @ApiOperation({ summary: 'Post image(s) to Instagram' })
  async postToInstagram(
    @CurrentUser() user: User,
    @Body() dto: PostToInstagramDto,
  ) {
    const isConnected = await this.socialService.isInstagramConnected(user.id);
    
    if (!isConnected) {
      return {
        success: false,
        message: 'Please connect your Instagram account first using POST /social/instagram/connect',
        setupRequired: true,
      };
    }

    try {
      let result;
      
      if (dto.isCarousel && dto.imageUrls.length > 1) {
        result = await this.socialService.postCarousel(
          user.id,
          dto.imageUrls,
          dto.caption,
          dto.hashtags,
        );
      } else {
        result = await this.socialService.postToInstagram(user.id, {
          imageUrl: dto.imageUrls[0],
          caption: dto.caption,
          hashtags: dto.hashtags,
        });
      }

      return {
        success: true,
        message: 'Posted to Instagram successfully',
        permalink: result.permalink,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }
}
