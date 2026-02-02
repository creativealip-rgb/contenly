import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

@Injectable()
export class OpenAiService {
  private openai: OpenAI;
  private model: string;

  constructor(private configService: ConfigService) {
    console.log('🔍 OpenAiService: Initializing...');
    console.log('📝 All env vars:', {
      OPENROUTER_API_KEY: this.configService.get('OPENROUTER_API_KEY')
        ? 'SET'
        : 'NOT SET',
      OPENROUTER_BASE_URL: this.configService.get('OPENROUTER_BASE_URL'),
      OPENROUTER_MODEL: this.configService.get('OPENROUTER_MODEL'),
    });

    const apiKey = (this.configService.get('OPENROUTER_API_KEY') || '').trim();
    const baseURL = (
      this.configService.get('OPENROUTER_BASE_URL') ||
      'https://openrouter.ai/api/v1'
    ).trim();

    if (!apiKey) {
      console.error('❌ OPENROUTER_API_KEY is undefined or empty!');
      throw new Error('OPENROUTER_API_KEY is not set in environment variables');
    }

    console.log('✅ OpenAI client initializing with OpenRouter');
    console.log(`🔑 API Key Prefix: ${apiKey.substring(0, 10)}...`);

    this.openai = new OpenAI({
      apiKey,
      baseURL,
    });
    this.model =
      this.configService.get('OPENROUTER_MODEL') ||
      'google/gemini-2.0-flash-exp:free';
    console.log(`✅ Model set to: ${this.model}`);
  }

  async generateContent(
    originalContent: string,
    options: {
      tone?: string;
      length?: 'short' | 'medium' | 'long';
      keywords?: string[];
      targetLanguage?: string;
      mode?: 'rewrite' | 'idea';
    },
  ): Promise<string> {
    const lengthGuide = {
      short: '300-500 words',
      medium: '600-900 words',
      long: '1000-1500 words',
    };

    const isIdeaMode = options.mode === 'idea';

    const systemPrompt = isIdeaMode
      ? `You are an expert article writer. Your task is to:
1. Generate a high-quality, comprehensive article based on the provided ideas/keywords.
2. Use a ${options.tone || 'professional'} tone.
3. Target length: ${lengthGuide[options.length || 'medium']}.
4. Naturally incorporate related keywords to ensure the content is thorough.
5. ${options.targetLanguage ? `Write in ${options.targetLanguage}` : ''}
6. Return ONLY the HTML content (headings, paragraphs, lists) suitable for the body of an article.
7. LANGUAGE: ${options.targetLanguage ? `Use ${options.targetLanguage}.` : 'Use Indonesian (Bahasa Indonesia) or follow the language of the source content/idea.'}
8. CRITICAL: DO NOT use Markdown formatting (NO **, NO ###, NO [text](url)). Use ONLY HTML tags like <h2>, <p>, <ul>, <li>, <strong>, and <a>.
9. Each paragraph MUST be short, NOT EXCEEDING 25 words.
10. CRITICAL: DO NOT start the article with a heading (H1, H2, etc.). Start directly with an introductory paragraph.
11. DO NOT include <!DOCTYPE html>, <html>, <head>, or <body> tags.
12. Make the content SEO-friendly with a clear structure.`
      : `You are a professional content rewriter. Your task is to:
1. Completely rewrite the given content to make it unique while preserving factual accuracy.
2. Use a ${options.tone || 'professional'} tone.
3. Target length: ${lengthGuide[options.length || 'medium']}.
4. ${options.keywords?.length ? `Naturally incorporate these keywords: ${options.keywords.join(', ')}` : ''}
5. Return ONLY the HTML content (headings, paragraphs, lists) suitable for the body of an article.
6. LANGUAGE: ${options.targetLanguage ? `Use ${options.targetLanguage}.` : 'Use Indonesian (Bahasa Indonesia) or follow the language of the source content.'}
7. CRITICAL: DO NOT use Markdown formatting (NO **, NO ###, NO [text](url)). Use ONLY HTML tags like <h2>, <p>, <ul>, <li>, <strong>, and <a>.
8. Each paragraph MUST be short, NOT EXCEEDING 25 words.
9. CRITICAL: DO NOT start the article with a heading (H1, H2, etc.). Start directly with an introductory paragraph.
10. DO NOT include <!DOCTYPE html>, <html>, <head>, or <body> tags.
11. Make the content SEO-friendly with a clear structure.`;

    const userPrompt = isIdeaMode
      ? `Generate an article based on these ideas/keywords:\n\n${originalContent}`
      : `Rewrite this content:\n\n${originalContent}`;

    try {
      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      });

      return response.choices[0]?.message?.content || '';
    } catch (error: any) {
      console.error('[OpenAiService] Generation failed:', {
        status: error.status,
        message: error.message,
        data: error.response?.data,
        model: this.model,
      });
      throw error;
    }
  }

  async generateSeoMetadata(
    title: string,
    content: string,
    keywords?: string[],
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
        {
          role: 'system',
          content: 'You are an SEO expert. Return only valid JSON.',
        },
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
