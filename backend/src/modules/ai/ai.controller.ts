import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AiService } from './ai.service';
import { GenerateContentDto, GenerateSeoDto, GenerateImageDto } from './dto';
import { SessionAuthGuard } from '../../common/guards/session-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { User } from '../../db/types';

@ApiTags('ai')
@ApiBearerAuth()
@UseGuards(SessionAuthGuard)
@Controller('ai')
export class AiController {
  constructor(private aiService: AiService) {}

  @Post('generate')
  @ApiOperation({ summary: 'Generate rewritten content' })
  async generate(@CurrentUser() user: User, @Body() dto: GenerateContentDto) {
    const data = await this.aiService.generateContent(user.id, dto);
    return {
      success: true,
      data: {
        ...data,
        title: dto.title || 'Rewritten Article', // Ensure title is returned for frontend
      },
    };
  }

  @Post('generate-seo')
  @ApiOperation({ summary: 'Generate SEO metadata' })
  async generateSeo(@CurrentUser() user: User, @Body() dto: GenerateSeoDto) {
    return this.aiService.generateSeo(user.id, dto);
  }

  @Post('generate-image')
  @ApiOperation({ summary: 'Generate featured image with DALL-E' })
  async generateImage(
    @CurrentUser() user: User,
    @Body() dto: GenerateImageDto,
  ) {
    return this.aiService.generateImage(user.id, dto);
  }
}
