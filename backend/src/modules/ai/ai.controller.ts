import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AiService } from './ai.service';
import { GenerateContentDto, GenerateSeoDto, GenerateImageDto } from './dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '@prisma/client';

@ApiTags('ai')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('ai')
export class AiController {
    constructor(private aiService: AiService) { }

    @Post('generate')
    @ApiOperation({ summary: 'Generate rewritten content' })
    async generate(@CurrentUser() user: User, @Body() dto: GenerateContentDto) {
        return this.aiService.generateContent(user.id, dto);
    }

    @Post('generate-seo')
    @ApiOperation({ summary: 'Generate SEO metadata' })
    async generateSeo(@CurrentUser() user: User, @Body() dto: GenerateSeoDto) {
        return this.aiService.generateSeo(user.id, dto);
    }

    @Post('generate-image')
    @ApiOperation({ summary: 'Generate featured image with DALL-E' })
    async generateImage(@CurrentUser() user: User, @Body() dto: GenerateImageDto) {
        return this.aiService.generateImage(user.id, dto);
    }
}
