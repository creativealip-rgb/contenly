import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { sql } from 'drizzle-orm';
import { DrizzleService } from '../../../db/drizzle.service';
import { AiCostControlService } from './ai-cost-control.service';

@Injectable()
export class OpenAiService {
  private openai: OpenAI; // Used for OpenRouter or main OpenAI
  private nativeOpenai: OpenAI | null = null; // Used for native OpenAI (e.g., DALL-E)
  private model: string;

  constructor(
    private configService: ConfigService,
    private drizzle: DrizzleService,
    private aiCostControlService: AiCostControlService,
  ) {
    console.log('🔍 OpenAiService: Initializing...');

    // Get model preference from env (default to GPT-4o-mini)
    const preferredModel = (
      this.configService.get('OPENAI_MODEL') || 'gpt-4o-mini'
    ).trim();

    // Try OpenAI API first
    let apiKey = (this.configService.get('OPENAI_API_KEY') || '').trim();
    const customBaseURL = (
      this.configService.get('OPENAI_BASE_URL') || ''
    ).trim();
    let baseURL = 'https://api.openai.com/v1';
    let model = preferredModel;

    // Priority order:
    // 1. If OPENAI_BASE_URL is set explicitly, use it as a custom OpenAI-compatible endpoint
    //    (e.g. self-hosted gateway, proxy, regional endpoint).
    // 2. Else if model name contains a slash (e.g. 'openai/gpt-5.2') OR OPENAI_API_KEY missing,
    //    fall back to OpenRouter.
    // 3. Else default to api.openai.com/v1.
    let useOpenRouter = false;
    let useCustomEndpoint = false;

    if (customBaseURL) {
      useCustomEndpoint = true;
      baseURL = customBaseURL;
      console.log(`📝 Using custom OPENAI_BASE_URL: ${baseURL}`);
    } else {
      useOpenRouter = model.includes('/') || !apiKey;

      if (useOpenRouter) {
        console.log(
          '📝 Switching to OpenRouter (model contains slash or OpenAI key missing)',
        );
        apiKey = (
          this.configService.get('OPENROUTER_API_KEY') || apiKey
        ).trim();
        baseURL = (
          this.configService.get('OPENROUTER_BASE_URL') ||
          'https://openrouter.ai/api/v1'
        ).trim();

        // If we are using OpenRouter, check if there's a specific OpenRouter model set
        if (this.configService.get('OPENROUTER_MODEL')) {
          model = this.configService.get('OPENROUTER_MODEL');
        }
      }
    }

    if (!apiKey) {
      console.error(
        '❌ No API key found! Set either OPENAI_API_KEY or OPENROUTER_API_KEY',
      );
      throw new Error(
        'No AI API key configured. Set OPENAI_API_KEY or OPENROUTER_API_KEY in environment variables',
      );
    }

    // Debug: Show API key info (safe to log)
    const keyPrefix = apiKey.substring(0, 15) + '...';
    console.log(`🔑 Using API Key prefix: ${keyPrefix}`);
    console.log(`🔑 API Key length: ${apiKey.length}`);
    console.log(`🌐 Base URL: ${baseURL}`);

    // OpenRouter requires additional headers
    let defaultHeaders: Record<string, string> | undefined;
    if (useOpenRouter) {
      defaultHeaders = {
        'HTTP-Referer':
          this.configService.get('APP_URL') || 'https://contenly.web.id',
        'X-Title': 'Contently AI Platform',
      };
      console.log(`🔑 OpenRouter headers:`, defaultHeaders);
    } else if (useCustomEndpoint) {
      // Some custom OpenAI-compatible gateways (e.g. behind Cloudflare) block
      // requests with the official `OpenAI/JS` user-agent. Override it with a
      // generic one so the gateway doesn't reject our calls with 403.
      defaultHeaders = {
        'User-Agent': 'Mozilla/5.0 (compatible; Contenly/1.0)',
      };
      console.log(
        `🔑 Custom endpoint mode — overriding User-Agent to bypass gateway WAF`,
      );
    }

    // Initialize OpenAI client
    try {
      this.openai = new OpenAI({
        apiKey,
        baseURL,
        ...(defaultHeaders && { defaultHeaders }),
      });
      console.log(`✅ OpenAI client initialized successfully`);
    } catch (initError) {
      console.error('❌ Failed to initialize OpenAI client:', initError);
      throw initError;
    }
    this.model = model;

    console.log(
      `✅ Model set to: ${this.model} via ${useCustomEndpoint ? 'Custom Endpoint' : useOpenRouter ? 'OpenRouter' : 'OpenAI'}`,
    );

    // Native OpenAI client is only used for DALL-E / TTS which require the real
    // api.openai.com endpoint. Skip native init when custom endpoint mode is active
    // unless an explicit OPENAI_NATIVE_API_KEY is provided.
    if (!this.nativeOpenai) {
      const nativeApiKey = (
        this.configService.get('OPENAI_NATIVE_API_KEY') ||
        (useCustomEndpoint
          ? ''
          : this.configService.get('OPENAI_API_KEY') || '')
      ).trim();
      if (nativeApiKey) {
        this.nativeOpenai = new OpenAI({ apiKey: nativeApiKey });
        console.log(`✅ Native OpenAI client initialized for DALL-E / TTS`);
      } else if (useCustomEndpoint) {
        console.log(
          `ℹ️  Native OpenAI client not initialized (custom endpoint mode). DALL-E / TTS disabled unless OPENAI_NATIVE_API_KEY is set.`,
        );
      }
    }
  }

  // Getter for accessing the OpenAI client
  getClient(): OpenAI {
    return this.openai;
  }

  getModel(): string {
    return this.model;
  }

  private async getSystemSetting(
    key: string,
    fallback: string,
  ): Promise<string> {
    try {
      const result = await this.drizzle.db.execute(
        sql`SELECT value FROM system_settings WHERE key = ${key} LIMIT 1`,
      );
      const rows = Array.isArray(result) ? result : (result as any).rows || [];
      return (rows[0]?.value || fallback || '').toString().trim();
    } catch (error: any) {
      console.warn(
        `[OpenAiService] Failed to read system setting ${key}:`,
        error?.message || error,
      );
      return fallback;
    }
  }

  async getTextModel(override?: string): Promise<string> {
    // Admin-configured model must win over plan/env defaults so the Provider & Model UI
    // actually controls live AI calls. Per-call overrides are only fallback defaults.
    return this.getSystemSetting(
      'model_text_generation',
      override?.trim() || this.model,
    );
  }

  private async getImageModel(): Promise<string> {
    const fallback =
      this.configService.get('IMAGE_MODEL') ||
      this.configService.get('IMAGE_GENERATION_MODEL') ||
      'cx/gpt-5.4-image';
    return this.getSystemSetting('model_image_generation', fallback);
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
      model?: string;
      userId?: string;
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
      const selectedModel = this.aiCostControlService.resolveModel(
        await this.getTextModel(options.model),
      );
      const guardInput = {
        userId: options.userId,
        feature: 'article_generation' as const,
        model: selectedModel,
        prompt: `${systemPrompt}\n\n${userPrompt}`,
        maxOutputTokens: 4000,
      };
      const costEstimate = await this.aiCostControlService.guardMonthlySpend(
        guardInput,
        this.aiCostControlService.guardPrompt(guardInput),
      );
      this.aiCostControlService.logUsage(guardInput, costEstimate);
      console.log(
        `[OpenAiService] Generating content with model: ${selectedModel}`,
      );

      const response = await this.openai.chat.completions.create({
        model: selectedModel,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 4000,
        response_format: { type: 'json_object' },
      });

      await this.aiCostControlService.recordSpend(guardInput, costEstimate);

      // Sanitize JSON - remove control characters that break parsing
      let rawContent = response.choices[0]?.message?.content || '{}';
      rawContent = rawContent.replace(/[\x00-\x1f\x7f-\x9f]/g, ' ');
      const result = JSON.parse(rawContent);

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
      console.error('[OpenAiService] Generation failed:', {
        message: error.message,
        status: error.status,
        type: error.type,
        code: error.code,
      });

      // If it's an API error, provide more context
      if (error.status === 401) {
        console.error(
          '[OpenAiService] 401 Error - Check API key and headers configuration',
        );
        console.error('[OpenAiService] Current baseURL:', this.openai.baseURL);
      }

      throw error;
    }
  }

  async generateSeoMetadata(
    title: string,
    content: string,
    keywords?: string[],
    model?: string,
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

    const selectedModel = this.aiCostControlService.resolveModel(
      await this.getTextModel(model),
    );
    const costEstimate = this.aiCostControlService.guardPrompt({
      feature: 'seo_generation',
      model: selectedModel,
      prompt,
      maxOutputTokens: 800,
    });
    this.aiCostControlService.logUsage(
      {
        feature: 'seo_generation',
        model: selectedModel,
        prompt,
        maxOutputTokens: 800,
      },
      costEstimate,
    );

    const response = await this.openai.chat.completions.create({
      model: selectedModel,
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

  private async getImageApiKey(): Promise<string> {
    const key = await this.getSystemSetting(
      'image_api_key',
      this.configService.get('IMAGE_API_KEY') ||
        this.configService.get('CODEX_API_KEY') ||
        '',
    );
    if (!key) {
      throw new Error(
        'Image API key is not configured. Set system setting image_api_key or env IMAGE_API_KEY/CODEX_API_KEY.',
      );
    }
    return key;
  }

  private async getImageBaseUrl(): Promise<string> {
    return this.getSystemSetting(
      'image_base_url',
      this.configService.get('IMAGE_BASE_URL') ||
        this.configService.get('CODEX_BASE_URL') ||
        'https://9router-168-144-37-19.sslip.io',
    );
  }

  private buildImageRequestBody(
    model: string,
    prompt: string,
  ): Record<string, any> {
    const normalizedModel = model.toLowerCase();

    if (
      normalizedModel.includes('gpt-5.5-image') ||
      normalizedModel.includes('image')
    ) {
      return {
        model,
        prompt,
        n: 1,
        size: 'auto',
        quality: 'auto',
        background: 'auto',
        image_detail: 'high',
        output_format: 'png',
      };
    }

    // chenzk gpt-image-2 rejects Codex/OpenAI-style auto/background/image_detail/output_format params.
    if (
      normalizedModel === 'gpt-image-2' ||
      normalizedModel.endsWith('/gpt-image-2')
    ) {
      return {
        model,
        prompt,
        n: 1,
        size: '1080x1350', // IG portrait 4:5
      };
    }

    return {
      model,
      prompt,
      n: 1,
      size: 'auto',
      quality: 'auto',
      background: 'auto',
      image_detail: 'low',
      output_format: 'png',
    };
  }

  private async getR2Config(): Promise<{
    bucket: string;
    endpoint: string;
    accessKeyId: string;
    secretAccessKey: string;
    publicBaseUrl?: string;
  } | null> {
    const accountId = await this.getSystemSetting(
      'r2_account_id',
      this.configService.get('R2_ACCOUNT_ID') || '',
    );
    const bucket = await this.getSystemSetting(
      'r2_bucket_name',
      this.configService.get('R2_BUCKET_NAME') || '',
    );
    const endpoint = await this.getSystemSetting(
      'r2_endpoint',
      this.configService.get('R2_ENDPOINT') ||
        (accountId ? `https://${accountId}.r2.cloudflarestorage.com` : ''),
    );
    const accessKeyId = await this.getSystemSetting(
      'r2_access_key_id',
      this.configService.get('R2_ACCESS_KEY_ID') || '',
    );
    const secretAccessKey = await this.getSystemSetting(
      'r2_secret_access_key',
      this.configService.get('R2_SECRET_ACCESS_KEY') || '',
    );
    const publicBaseUrl = await this.getSystemSetting(
      'r2_public_base_url',
      this.configService.get('R2_PUBLIC_BASE_URL') || '',
    );

    if (!bucket || !endpoint || !accessKeyId || !secretAccessKey) {
      return null;
    }

    return {
      bucket,
      endpoint,
      accessKeyId,
      secretAccessKey,
      publicBaseUrl: publicBaseUrl || undefined,
    };
  }

  private getR2Client(
    config: NonNullable<Awaited<ReturnType<OpenAiService['getR2Config']>>>,
  ): S3Client {
    return new S3Client({
      region: 'auto',
      endpoint: config.endpoint,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });
  }

  private imageBufferFromDataUrl(dataUrl: string): Buffer | null {
    const match = dataUrl.match(/^data:image\/([a-zA-Z0-9.+-]+);base64,(.+)$/);
    if (!match) return null;
    return Buffer.from(match[2], 'base64');
  }

  private async uploadGeneratedImageToR2(
    imageBuffer: Buffer,
  ): Promise<string | null> {
    const config = await this.getR2Config();
    if (!config) return null;

    const key = `instagram-studio/${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}.png`;
    const client = this.getR2Client(config);
    await client.send(
      new PutObjectCommand({
        Bucket: config.bucket,
        Key: key,
        Body: imageBuffer,
        ContentType: 'image/png',
        CacheControl: 'public, max-age=31536000, immutable',
      }),
    );

    if (config.publicBaseUrl) {
      return `${config.publicBaseUrl.replace(/\/$/, '')}/${key}`;
    }

    return `/api/v1/ai/assets/${encodeURIComponent(key)}`;
  }

  async getGeneratedImageAsset(
    key: string,
  ): Promise<{ body: Buffer; contentType: string }> {
    if (!key.startsWith('instagram-studio/')) {
      throw new Error('Invalid asset key');
    }

    const config = await this.getR2Config();
    if (!config) {
      throw new Error('R2 is not configured');
    }

    const client = this.getR2Client(config);
    const object = await client.send(
      new GetObjectCommand({
        Bucket: config.bucket,
        Key: key,
      }),
    );

    const bytes = await object.Body?.transformToByteArray();
    if (!bytes) {
      throw new Error('R2 object body is empty');
    }

    return {
      body: Buffer.from(bytes),
      contentType: object.ContentType || 'image/png',
    };
  }

  async generateImage(prompt: string, userId?: string): Promise<string> {
    const codexApiKey = await this.getImageApiKey();
    const codexBaseUrl = await this.getImageBaseUrl();
    const imageModel = await this.getImageModel();

    // Enhance short prompts - Codex requires descriptive prompts (min ~40 chars)
    let enhancedPrompt = prompt;
    if (prompt.length < 40) {
      enhancedPrompt = `${prompt}, high quality, detailed, professional photography, cinematic lighting, 4k resolution`;
      console.log(
        `[generateImage] Enhanced short prompt: ${enhancedPrompt.substring(0, 80)}...`,
      );
    }

    const guardInput = {
      userId,
      feature: 'image_generation' as const,
      model: imageModel,
      prompt: enhancedPrompt,
      maxOutputTokens: 0,
    };
    const costEstimate = await this.aiCostControlService.guardMonthlySpend(
      guardInput,
      this.aiCostControlService.guardPrompt(guardInput),
    );
    this.aiCostControlService.logUsage(guardInput, costEstimate);

    console.log(
      `🎨 Generating image via Codex ${imageModel} for: ${enhancedPrompt.substring(0, 60)}...`,
    );

    let imageData: string | null = null;
    let imageUrl: string | null = null;

    const returnGeneratedImage = async () => {
      if (imageUrl) {
        const imageBuffer = this.imageBufferFromDataUrl(imageUrl);
        if (imageBuffer) {
          const r2Url = await this.uploadGeneratedImageToR2(imageBuffer);
          if (r2Url) return r2Url;
        }
        return imageUrl;
      }
      if (imageData) {
        const imageBuffer = Buffer.from(imageData, 'base64');
        const r2Url = await this.uploadGeneratedImageToR2(imageBuffer);
        if (r2Url) return r2Url;
        return `data:image/png;base64,${imageData}`;
      }
      return null;
    };

    try {
      const response = await fetch(`${codexBaseUrl}/v1/images/generations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${codexApiKey}`,
          Accept: 'text/event-stream',
          'User-Agent': 'curl/8.5.0',
        },
        body: JSON.stringify(
          this.buildImageRequestBody(imageModel, enhancedPrompt),
        ),
        signal: AbortSignal.timeout(300000),
      });

      if (!response.ok)
        throw new Error(`Codex API ${response.status}: ${response.statusText}`);

      await this.aiCostControlService.recordSpend(guardInput, costEstimate);

      // Parse SSE stream to extract image data
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      const applyParsedImage = (parsed: any) => {
        if (parsed.data?.[0]?.b64_json) imageData = parsed.data[0].b64_json;
        if (parsed.data?.[0]?.url) imageUrl = parsed.data[0].url;
        if (parsed.b64_json && !imageData) imageData = parsed.b64_json;
        if (parsed.url && !imageUrl) imageUrl = parsed.url;
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;
          try {
            const payload = trimmed.startsWith('data: ')
              ? trimmed.substring(6)
              : trimmed;
            applyParsedImage(JSON.parse(payload));
            const generatedImage = await returnGeneratedImage();
            if (generatedImage) {
              return generatedImage;
            }
          } catch {}
        }
      }

      if (buffer.trim()) {
        try {
          const payload = buffer.trim().startsWith('data: ')
            ? buffer.trim().substring(6)
            : buffer.trim();
          applyParsedImage(JSON.parse(payload));
        } catch {}
      }

      const generatedImage = await returnGeneratedImage();
      if (generatedImage) {
        return generatedImage;
      }
      throw new Error('No image returned from Codex');
    } catch (error: any) {
      console.error(`[generateImage] Codex failed: ${error.message}`);
      throw error;
    }
  }

  async analyzeTrend(
    content: string,
    title: string,
    model?: string,
  ): Promise<any> {
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
        model: model || this.model,
        messages: [
          {
            role: 'system',
            content:
              'You are a viral content strategist. Return only valid JSON.',
          },
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
        sentiment: 'neutral',
      };
    }
  }

  async analyzeImageLayout(
    imageUrl: string,
    text: string,
    model?: string,
  ): Promise<{
    layoutPosition: string;
    fontColor: string;
    headerText: string;
    bodyText: string;
  }> {
    const prompt = `Analyze this image and the text that will be overlaid on it: "${text}".
    
    1. Determine the best position for the text so it is readable and does not cover important subjects (like faces or main objects). Look for "negative space" or uncluttered areas.
    2. Determine the best font color (either #FFFFFF or #000000) that will contrast well with the background at that specific position.
    3. Separate the provided text into a short, punchy "headerText" (max 5-7 words, e.g. the main point or hook) and "bodyText" (the remaining explanation). If the text is very short, put it all in "headerText" and leave "bodyText" empty.
    
    Return a VALID JSON object with exactly these keys:
    - "layoutPosition": Must be exactly one of ["center", "top", "bottom", "top-left", "top-right", "bottom-left", "bottom-right", "left", "right"].
    - "fontColor": Must be exactly "#FFFFFF" or "#000000".
    - "headerText": The extracted short header.
    - "bodyText": The remaining explanation.
    
    Return ONLY the JSON.`;

    try {
      // Use the native client if available for guaranteed vision support, otherwise fallback to standard
      const client = this.nativeOpenai || this.openai;
      // Force a vision-capable model if using native, else trust the configured or passed model
      const targetModel = this.nativeOpenai
        ? 'gpt-4o-mini'
        : model || this.model;

      const response = await client.chat.completions.create({
        model: targetModel,
        messages: [
          {
            role: 'system',
            content:
              'You are an expert graphic designer and layout AI. Return only valid JSON.',
          },
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              {
                type: 'image_url',
                image_url: {
                  url: imageUrl,
                },
              },
            ],
          },
        ],
        temperature: 0.2,
        max_tokens: 150,
        response_format: { type: 'json_object' },
      });

      // Sanitize JSON - remove control characters that break parsing
      let rawContent = response.choices[0]?.message?.content || '{}';
      rawContent = rawContent.replace(/[\x00-\x1f\x7f-\x9f]/g, ' ');
      const result = JSON.parse(rawContent);
      console.log(
        `[OpenAiService] Vision layout analysis complete: ${JSON.stringify(result)}`,
      );

      return {
        layoutPosition: result.layoutPosition || 'center',
        fontColor: result.fontColor || '#FFFFFF',
        headerText: result.headerText || text,
        bodyText: result.bodyText || '',
      };
    } catch (error) {
      console.error(
        '[OpenAiService] Vision layout analysis failed:',
        error.message,
      );
      // Fallback defaults if vision fails (e.g., URL unaccessible or API error)
      return {
        layoutPosition: 'center',
        fontColor: '#FFFFFF',
        headerText: text, // Fallback to entire text as header
        bodyText: '',
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

  async transcribeAudio(
    buffer: Buffer,
    language?: string,
  ): Promise<{
    text: string;
    segments: Array<{ start: number; end: number; text: string }>;
  }> {
    if (!this.nativeOpenai) {
      throw new Error(
        'OPENAI_API_KEY is missing. Transcription requires a direct OpenAI API Key.',
      );
    }

    const file = new File([new Uint8Array(buffer)], 'audio.mp3', {
      type: 'audio/mpeg',
    });
    const response = await this.nativeOpenai.audio.transcriptions.create({
      model: 'whisper-1',
      file,
      response_format: 'verbose_json',
      timestamp_granularities: ['segment'],
      ...(language && language !== 'auto' ? { language } : {}),
    });

    const segments = ((response as any).segments || []).map((s: any) => ({
      start: s.start,
      end: s.end,
      text: s.text?.trim() || '',
    }));

    return { text: response.text, segments };
  }

  async generateThumbnail(
    title: string,
    style: string = 'cinematic',
  ): Promise<string> {
    // Build thumbnail prompt directly (avoid broken OpenRouter for enhancement)
    const enhancedPrompt = `Vertical 9:16 portrait thumbnail for Instagram Reels/TikTok. ${style} style. Subject: ${title}. Professional lighting, vibrant colors, eye-catching composition, high contrast text area at top or bottom, modern social media aesthetic. Ultra quality, detailed, 4K resolution.`;

    // Use Codex endpoint (same as generateImage)
    const imageBaseUrl = (
      this.configService.get('CODEX_BASE_URL') ||
      'https://9router-168-144-37-19.sslip.io'
    ).replace(/\/+$/, '');
    const imageApiKey = (
      this.configService.get('CODEX_API_KEY') ||
      'sk-752b90456c373287-7ndp1b-1930998e'
    ).trim();
    const imageModel = await this.getImageModel();

    const response = await fetch(`${imageBaseUrl}/v1/images/generations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${imageApiKey}`,
        Accept: 'text/event-stream',
      },
      body: JSON.stringify({
        model: imageModel,
        prompt: enhancedPrompt,
        n: 1,
        size: 'auto',
        quality: 'auto',
        background: 'auto',
        image_detail: 'high',
        output_format: 'png',
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Image generation failed: ${err}`);
    }

    // Handle SSE streaming response from Codex
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('text/event-stream')) {
      const text = await response.text();
      const lines = text.split('\n');
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const jsonStr = line.slice(6).trim();
        if (!jsonStr || jsonStr === '[DONE]') continue;
        try {
          const parsed = JSON.parse(jsonStr);
          // Codex format: {b64_json: "...", index: 0}
          if (parsed.b64_json) {
            return `data:image/png;base64,${parsed.b64_json}`;
          }
          // OpenAI format: {data: [{b64_json: "..."}]}
          if (parsed.data?.[0]?.b64_json) {
            return `data:image/png;base64,${parsed.data[0].b64_json}`;
          }
          if (parsed.data?.[0]?.url) {
            return parsed.data[0].url;
          }
        } catch {}
      }
      throw new Error('No image found in SSE stream');
    }

    // Standard JSON response
    const data = (await response.json()) as any;
    const imageData = data?.data?.[0];
    if (imageData?.url) return imageData.url;
    if (imageData?.b64_json)
      return `data:image/png;base64,${imageData.b64_json}`;
    throw new Error('No image returned from generation API');
  }

  async generateSpeech(
    text: string,
    voice: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer' = 'alloy',
  ): Promise<Buffer> {
    const elevenLabsKey = (
      this.configService.get('ELEVENLABS_API_KEY') || ''
    ).trim();

    if (elevenLabsKey) {
      return this.generateSpeechElevenLabs(text, voice, elevenLabsKey);
    }

    // Fallback to native OpenAI TTS
    if (!this.nativeOpenai) {
      throw new Error(
        'No TTS provider configured. Set ELEVENLABS_API_KEY or OPENAI_API_KEY.',
      );
    }

    try {
      const response = await this.nativeOpenai.audio.speech.create({
        model: 'tts-1',
        voice,
        input: text,
        response_format: 'mp3',
      });

      const buffer = Buffer.from(await response.arrayBuffer());
      return buffer;
    } catch (error: any) {
      console.error('[OpenAiService] TTS generation failed:', error.message);
      throw error;
    }
  }

  private async generateSpeechElevenLabs(
    text: string,
    voice: string,
    apiKey: string,
  ): Promise<Buffer> {
    // Map OpenAI voice names to ElevenLabs voice IDs
    const voiceMap: Record<string, string> = {
      alloy: 'pNInz6obpgDQGcFmaJgB', // Adam
      echo: '21m00Tcm4TlvDq8ikWAM', // Rachel
      fable: 'AZnzlk1XvdvUeBnXmlld', // Domi
      onyx: 'VR6AewLTigWG4xSOukaG', // Arnold
      nova: 'EXAVITQu4vr4xnSDxMaL', // Bella
      shimmer: 'MF3mGyEYCl7XYWbV9V6O', // Elli
    };

    const voiceId = voiceMap[voice] || voiceMap.nova;

    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'xi-api-key': apiKey,
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_multilingual_v2',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
          },
        }),
      },
    );

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`ElevenLabs TTS failed: ${err}`);
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    return buffer;
  }
}
