import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

@Injectable()
export class OpenAiService {
  private openai: OpenAI; // Used for OpenRouter or main OpenAI
  private nativeOpenai: OpenAI | null = null; // Used for native OpenAI (e.g., DALL-E)
  private model: string;

  constructor(private configService: ConfigService) {
    console.log('🔍 OpenAiService: Initializing...');

    // Get model preference from env (default to GPT-5.3-Codex or Gemini)
    const preferredModel = (this.configService.get('OPENAI_MODEL') || 'gpt-5.3-codex').trim();

    // Try OpenAI API first, then fall back to OpenRouter
    let apiKey = (this.configService.get('OPENAI_API_KEY') || '').trim();
    let baseURL = 'https://api.openai.com/v1';
    let model = preferredModel;

    // If OpenAI key not available, try OpenRouter
    if (!apiKey) {
      apiKey = (this.configService.get('OPENROUTER_API_KEY') || '').trim();
      baseURL = (this.configService.get('OPENROUTER_BASE_URL') || 'https://openrouter.ai/api/v1').trim();
      model = this.configService.get('OPENROUTER_MODEL') || 'google/gemini-2.0-flash-exp:free';
      console.log('📝 Using OpenRouter configuration');
    } else {
      console.log('📝 Using OpenAI API configuration');
      // If native OpenAI is used for text, we also use it for nativeOpenai
      this.nativeOpenai = new OpenAI({ apiKey });
    }

    if (!apiKey) {
      console.error('❌ No API key found! Set either OPENAI_API_KEY or OPENROUTER_API_KEY');
      throw new Error('No AI API key configured. Set OPENAI_API_KEY or OPENROUTER_API_KEY in environment variables');
    }

    this.openai = new OpenAI({
      apiKey,
      baseURL,
    });
    this.model = model;

    // Explicitly check for native OpenAI key for DALL-E if not already set
    if (!this.nativeOpenai) {
      const nativeApiKey = (this.configService.get('OPENAI_API_KEY') || '').trim();
      if (nativeApiKey) {
        this.nativeOpenai = new OpenAI({ apiKey: nativeApiKey });
      }
    }

    console.log(`✅ Model set to: ${this.model}`);
  }

  async generateContent(
    originalContent: string,
    options: {
      tone?: string;
      length?: 'short' | 'medium' | 'long';
      keywords?: string[];
      targetLanguage?: string;
      mode?: 'rewrite' | 'idea' | 'custom';
      systemPrompt?: string;
    },
  ): Promise<any> {
    const lengthGuide = {
      short: '300-500 words',
      medium: '600-900 words',
      long: '1000-1500 words',
    };

    const isIdeaMode = options.mode === 'idea';
    const isCustomMode = options.mode === 'custom';

    let systemPrompt = '';
    let userPrompt = '';

    if (isCustomMode && options.systemPrompt) {
      systemPrompt = options.systemPrompt;
      userPrompt = originalContent;
    } else {
      systemPrompt = `You are an expert article writer and SEO professional. Your task is to:
1. ${isIdeaMode ? 'Generate a high-quality, comprehensive article based on the provided ideas/keywords.' : 'Completely rewrite the given content to make it unique while preserving factual accuracy.'}
2. Use a ${options.tone || 'professional'} tone.
3. Target length: ${lengthGuide[options.length || 'medium']}.
4. Naturally incorporate related keywords to ensure the content is thorough.
5. LANGUAGE: Indonesian (Bahasa Indonesia).
6. Return a VALID JSON object containing:
   - "title": An engaging, unique, and SEO-friendly title. It MUST be different and more catchy than any source title provided.
   - "content": The rewrite/generated article body in HTML format. Use ONLY <h2>, <p>, <ul>, <li>, <strong>, and <a> tags. DO NOT use <h1>. Start directly with an introductory paragraph. IMPORTANT: Use <ul><li>item1</li><li>item2</li></ul> format. DO NOT nest <ul> inside <li> or use multiple nested <ul> tags.
   - "metaDescription": A compelling SEO meta description (150-160 characters).
   - "slug": A URL-friendly slug based on the new title.
7. CRITICAL: DO NOT use Markdown formatting.
8. Each paragraph MUST be short and concise.
9. Ensure the article reaches a natural and complete conclusion. DO NOT cut off.
10. Return ONLY the JSON object.`;

      userPrompt = isIdeaMode
        ? `Generate an article based on these ideas/keywords:\n\n${originalContent}`
        : `Rewrite this content and provide a new title and SEO metadata:\n\n${originalContent}`;
    }

    try {
      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 4000,
        response_format: { type: 'json_object' },
      });

      const result = JSON.parse(response.choices[0]?.message?.content || '{}');

      if (isCustomMode) {
        return result;
      }

      // Fix nested <ul> structure
      let fixedContent = result.content || '';
      fixedContent = fixedContent.replace(/<ul>\s*<ul>/g, '<ul>');
      fixedContent = fixedContent.replace(/<\/ul>\s*<\/ul>/g, '</ul>');
      fixedContent = fixedContent.replace(
        /<ul>\s*<li>(.*?)<\/li>\s*<\/ul>/g,
        '<li>$1</li>',
      );

      return {
        title: result.title || '',
        content: fixedContent,
        metaDescription: result.metaDescription || '',
        slug: result.slug || '',
      };
    } catch (error: any) {
      console.error('[OpenAiService] Generation failed:', error);
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
    const client = this.nativeOpenai || this.openai;
    const response = await client.images.generate({
      model: 'dall-e-3',
      prompt: `Create a professional, high-quality featured image for an article about: ${prompt}. The image should be clean, modern, and suitable for a blog post.`,
      n: 1,
      size: '1024x1024',
      quality: 'standard',
    });

    return response.data[0]?.url || '';
  }

  async analyzeTrend(content: string, title: string): Promise<any> {
    const prompt = `Analyze this trending content and provide viral insights:
    
    TITLE: ${title}
    CONTENT: ${content.substring(0, 3000)}
    
    Return a VALID JSON object with:
    - "score": A number from 1-100 indicating viral potential.
    - "reason": A brief explanation of why this is trending.
    - "hooks": An array of 3 catchy hooks/angles for a new article.
    - "strategy": A one-sentence content strategy for this topic.
    - "keywords": An array of 5 high-value SEO keywords.
    - "sentiment": "positive", "negative", or "neutral".
    
    LANGUAGE: Indonesian (Bahasa Indonesia).
    Return ONLY the JSON.`;

    try {
      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: 'You are a viral content strategist. Return only valid JSON.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
        response_format: { type: 'json_object' },
      });

      return JSON.parse(response.choices[0]?.message?.content || '{}');
    } catch (error) {
      console.error('[OpenAiService] Trend analysis failed:', error);
      return {
        score: 50,
        reason: 'Gagal menganalisis tren.',
        hooks: ['Gagal memuat hook'],
        strategy: 'Kembangkan konten berdasarkan topik ini.',
        keywords: [],
        sentiment: 'neutral'
      };
    }
  }

  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 60);
  }
}
