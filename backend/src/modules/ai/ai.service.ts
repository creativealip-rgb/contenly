import { Injectable, BadRequestException } from '@nestjs/common';
import { OpenAiService } from './services/openai.service';
import { BillingService } from '../billing/billing.service';
import { GenerateContentDto, GenerateSeoDto, GenerateImageDto } from './dto';

@Injectable()
export class AiService {
    constructor(
        private openAiService: OpenAiService,
        private billingService: BillingService,
    ) { }

    async generateContent(userId: string, dto: GenerateContentDto) {
        // Check token balance
        const hasBalance = await this.billingService.checkBalance(userId, 1);
        if (!hasBalance) {
            throw new BadRequestException('Insufficient token balance');
        }

        // Generate content
        const content = await this.openAiService.generateContent(
            dto.originalContent,
            dto.options,
        );

        // Deduct tokens
        await this.billingService.deductTokens(userId, 1, 'Article generation');

        return {
            content,
            tokensUsed: 1,
            wordCount: content.split(/\s+/).length,
        };
    }

    async generateSeo(userId: string, dto: GenerateSeoDto) {
        // SEO generation is included with article generation, no extra token cost
        const seoData = await this.openAiService.generateSeoMetadata(
            dto.title,
            dto.content,
            dto.keywords,
        );

        return seoData;
    }

    async generateImage(userId: string, dto: GenerateImageDto) {
        // Check token balance (image costs 2 tokens)
        const hasBalance = await this.billingService.checkBalance(userId, 2);
        if (!hasBalance) {
            throw new BadRequestException('Insufficient token balance');
        }

        // Generate image
        const imageUrl = await this.openAiService.generateImage(dto.prompt);

        // Deduct tokens
        await this.billingService.deductTokens(userId, 2, 'Image generation');

        return {
            imageUrl,
            tokensUsed: 2,
        };
    }
}
