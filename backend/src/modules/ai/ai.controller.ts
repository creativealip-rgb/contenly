import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
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
    constructor(private aiService: AiService) { }

    @Post('generate')
    @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 requests per minute
    @ApiOperation({ summary: 'Generate rewritten content' })
    async generate(@CurrentUser() user: User, @Body() dto: GenerateContentDto) {
        const data = await this.aiService.generateContent(user.id, dto);
        return {
            success: true,
            data
        };
    }

    @Post('generate-seo')
    @Throttle({ default: { limit: 20, ttl: 60000 } }) // 20 requests per minute
    @ApiOperation({ summary: 'Generate SEO metadata' })
    async generateSeo(@CurrentUser() user: User, @Body() dto: GenerateSeoDto) {
        return this.aiService.generateSeo(user.id, dto);
    }

    @Post('generate-image')
    @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 requests per minute (expensive)
    @ApiOperation({ summary: 'Generate featured image with DALL-E' })
    async generateImage(@CurrentUser() user: User, @Body() dto: GenerateImageDto) {
        return this.aiService.generateImage(user.id, dto);
    }
}
