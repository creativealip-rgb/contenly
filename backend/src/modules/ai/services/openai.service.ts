import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

@Injectable()
export class OpenAiService {
    private openai: OpenAI;
    private model: string;

    constructor(private configService: ConfigService) {
        this.openai = new OpenAI({
            apiKey: this.configService.get('OPENAI_API_KEY'),
        });
        this.model = this.configService.get('OPENAI_MODEL') || 'gpt-4o';
    }

    async generateContent(
        originalContent: string,
        options: {
            tone?: string;
            length?: 'short' | 'medium' | 'long';
            keywords?: string[];
            targetLanguage?: string;
        }
    ): Promise<string> {
        const lengthGuide = {
            short: '300-500 words',
            medium: '600-900 words',
            long: '1000-1500 words',
        };

        const systemPrompt = `You are a professional content rewriter. Your task is to:
1. Completely rewrite the given content to make it unique while preserving factual accuracy
2. Use a ${options.tone || 'professional'} tone
3. Target length: ${lengthGuide[options.length || 'medium']}
4. ${options.keywords?.length ? `Naturally incorporate these keywords: ${options.keywords.join(', ')}` : ''}
5. ${options.targetLanguage ? `Write in ${options.targetLanguage}` : ''}
6. Maintain proper HTML formatting with paragraphs, headings where appropriate
7. Make the content SEO-friendly with clear structure`;

        const response = await this.openai.chat.completions.create({
            model: this.model,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: `Rewrite this content:\n\n${originalContent}` },
            ],
            temperature: 0.7,
            max_tokens: 2000,
        });

        return response.choices[0]?.message?.content || '';
    }

    async generateSeoMetadata(
        title: string,
        content: string,
        keywords?: string[]
    ): Promise<{
        metaTitle: string;
        metaDescription: string;
        slug: string;
    }> {
        const prompt = `Generate SEO metadata for this article:

Title: ${title}
Content Preview: ${content.substring(0, 500)}
${keywords?.length ? `Target Keywords: ${keywords.join(', ')}` : ''}

Return JSON with:
- metaTitle: SEO-optimized title (50-60 characters)
- metaDescription: Compelling description (150-160 characters)
- slug: URL-friendly slug`;

        const response = await this.openai.chat.completions.create({
            model: this.model,
            messages: [
                { role: 'system', content: 'You are an SEO expert. Return only valid JSON.' },
                { role: 'user', content: prompt },
            ],
            temperature: 0.5,
            response_format: { type: 'json_object' },
        });

        const result = JSON.parse(response.choices[0]?.message?.content || '{}');
        return {
            metaTitle: result.metaTitle || title,
            metaDescription: result.metaDescription || content.substring(0, 160),
            slug: result.slug || this.generateSlug(title),
        };
    }

    async generateImage(prompt: string): Promise<string> {
        const response = await this.openai.images.generate({
            model: 'dall-e-3',
            prompt: `Create a professional, high-quality featured image for an article about: ${prompt}. The image should be clean, modern, and suitable for a blog post.`,
            n: 1,
            size: '1792x1024',
            quality: 'standard',
        });

        return response.data[0]?.url || '';
    }

    private generateSlug(title: string): string {
        return title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '')
            .substring(0, 60);
    }
}
