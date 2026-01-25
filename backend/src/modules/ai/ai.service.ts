import { Injectable, BadRequestException } from '@nestjs/common';
import { OpenAiService } from './services/openai.service';
import { BillingService } from '../billing/billing.service';
import { GenerateContentDto, GenerateSeoDto, GenerateImageDto } from './dto';
import { ArticlesService } from '../articles/articles.service';

@Injectable()
export class AiService {
    constructor(
        private openAiService: OpenAiService,
        private billingService: BillingService,
        private articlesService: ArticlesService,
    ) { }

    async generateContent(userId: string, dto: GenerateContentDto) {
        // TEMP: Skip billing check for testing without auth
        if (userId !== 'temp-user-id') {
            // Check token balance
            const hasBalance = await this.billingService.checkBalance(userId, 1);
            if (!hasBalance) {
                throw new BadRequestException('Insufficient token balance');
            }
        }

        // Generate content
        const content = await this.openAiService.generateContent(
            dto.originalContent,
            {
                ...dto.options,
                mode: dto.mode,
            } as any,
        );

        // Deduct tokens (skip for temp user)
        if (userId !== 'temp-user-id') {
            await this.billingService.deductTokens(userId, 1, 'Article generation');
        }

        // Save generated content as a draft article
        let articleId = null;
        try {
            const savedArticle = await this.articlesService.create(userId, {
                title: dto.title || 'AI Generated Article',
                generatedContent: content,
                originalContent: dto.originalContent,
                sourceUrl: dto.sourceUrl || '',
                status: 'DRAFT',
                // Only pass feedItemId if it's a valid UUID
                feedItemId: (dto.feedItemId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(dto.feedItemId))
                    ? dto.feedItemId
                    : undefined,
                tokensUsed: 1,
            });
            articleId = savedArticle.id;
        } catch (error) {
            console.error('Failed to auto-save generated article:', error);
            // Don't fail the request if auto-save fails
        }

        return {
            content,
            tokensUsed: 1,
            wordCount: content.split(/\s+/).length,
            articleId,
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
