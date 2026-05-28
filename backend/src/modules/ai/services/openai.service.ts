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

    // Get model preference from env (default to GPT-4o-mini)
    const preferredModel = (this.configService.get('OPENAI_MODEL') || 'gpt-4o-mini').trim();

    // Try OpenAI API first
    let apiKey = (this.configService.get('OPENAI_API_KEY') || '').trim();
    const customBaseURL = (this.configService.get('OPENAI_BASE_URL') || '').trim();
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
        console.log('📝 Switching to OpenRouter (model contains slash or OpenAI key missing)');
        apiKey = (this.configService.get('OPENROUTER_API_KEY') || apiKey).trim();
        baseURL = (this.configService.get('OPENROUTER_BASE_URL') || 'https://openrouter.ai/api/v1').trim();

        // If we are using OpenRouter, check if there's a specific OpenRouter model set
        if (this.configService.get('OPENROUTER_MODEL')) {
          model = this.configService.get('OPENROUTER_MODEL');
        }
      }
    }

    if (!apiKey) {
      console.error('❌ No API key found! Set either OPENAI_API_KEY or OPENROUTER_API_KEY');
      throw new Error('No AI API key configured. Set OPENAI_API_KEY or OPENROUTER_API_KEY in environment variables');
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
        'HTTP-Referer': this.configService.get('APP_URL') || 'https://contenly.web.id',
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
      console.log(`🔑 Custom endpoint mode — overriding User-Agent to bypass gateway WAF`);
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

    console.log(`✅ Model set to: ${this.model} via ${useCustomEndpoint ? 'Custom Endpoint' : useOpenRouter ? 'OpenRouter' : 'OpenAI'}`);

    // Native OpenAI client is only used for DALL-E / TTS which require the real
    // api.openai.com endpoint. Skip native init when custom endpoint mode is active
    // unless an explicit OPENAI_NATIVE_API_KEY is provided.
    if (!this.nativeOpenai) {
      const nativeApiKey = (
        this.configService.get('OPENAI_NATIVE_API_KEY') ||
        this.configService.get('OPENAI_API_KEY') || ''
      ).trim();
      if (nativeApiKey) {
        const nativeBaseURL = customBaseURL || undefined;
        this.nativeOpenai = new OpenAI({ apiKey: nativeApiKey, ...(nativeBaseURL ? { baseURL: nativeBaseURL } : {}) });
        console.log(`✅ Native OpenAI client initialized for DALL-E / TTS${nativeBaseURL ? ' (custom endpoint: ' + nativeBaseURL + ')' : ''}`);
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
      console.log(`[OpenAiService] Generating content with model: ${options.model || this.model}`);
      
      const response = await this.openai.chat.completions.create({
        model: options.model || this.model,
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
      console.error('[OpenAiService] Generation failed:', {
        message: error.message,
        status: error.status,
        type: error.type,
        code: error.code,
      });
      
      // If it's an API error, provide more context
      if (error.status === 401) {
        console.error('[OpenAiService] 401 Error - Check API key and headers configuration');
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

    const response = await this.openai.chat.completions.create({
      model: model || this.model,
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
    const codexApiKey = this.configService.get('CODEX_API_KEY') || 'sk-752b90456c373287-7ndp1b-1930998e';
    const codexBaseUrl = this.configService.get('CODEX_BASE_URL') || 'https://9router-168-144-37-19.sslip.io';
    const imageModel = this.configService.get('IMAGE_GENERATION_MODEL') || 'cx/gpt-5.4-image';

    console.log(`🎨 Generating image via Codex ${imageModel} for: ${prompt.substring(0, 60)}...`);

    try {
      const response = await fetch(`${codexBaseUrl}/v1/images/generations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${codexApiKey}`,
          'Accept': 'text/event-stream',
        },
        body: JSON.stringify({
          model: imageModel,
          prompt,
          n: 1,
          size: 'auto',
          quality: 'auto',
          background: 'auto',
          image_detail: 'high',
          output_format: 'png',
        }),
        signal: AbortSignal.timeout(180000),
      });

      if (!response.ok) throw new Error(`Codex API ${response.status}: ${response.statusText}`);

      // Parse SSE stream to extract image data
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let imageData: string | null = null;
      let imageUrl: string | null = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const parsed = JSON.parse(line.substring(6));
              // Handle both formats: {data: [{b64_json: "..."}]} and {b64_json: "...", index: 0}
              if (parsed.data?.[0]?.b64_json) imageData = parsed.data[0].b64_json;
              if (parsed.data?.[0]?.url) imageUrl = parsed.data[0].url;
              if (parsed.b64_json && !imageData) imageData = parsed.b64_json;
              if (parsed.url && !imageUrl) imageUrl = parsed.url;
            } catch {}
          }
        }
      }

      if (imageUrl) { console.log(`✅ Image via Codex (URL)`); return imageUrl; }
      if (imageData) { console.log(`✅ Image via Codex (${Math.round(imageData.length * 0.75 / 1024)}KB)`); return `data:image/png;base64,${imageData}`; }
      throw new Error('No image data in Codex response');
    } catch (err: any) {
      console.warn(`⚠️ Codex image gen failed: ${err.message}, trying Pollinations.ai...`);
      try {
        const encodedPrompt = encodeURIComponent(prompt);
        const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&nologo=true`;
        const r = await fetch(imageUrl, { method: 'HEAD', signal: AbortSignal.timeout(60000) });
        if (r.ok && r.headers.get('content-type')?.startsWith('image/')) { console.log(`✅ Image via Pollinations.ai (fallback)`); return imageUrl; }
      } catch {}
      throw new Error('Image generation failed: all providers unavailable.');
    }
  }

  async analyzeTrend(content: string, title: string, model?: string): Promise<any> {
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

  async analyzeImageLayout(imageUrl: string, text: string, model?: string): Promise<{ layoutPosition: string; fontColor: string; headerText: string; bodyText: string }> {
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
      const targetModel = this.nativeOpenai ? 'gpt-4o-mini' : (model || this.model);

      const response = await client.chat.completions.create({
        model: targetModel,
        messages: [
          {
            role: 'system',
            content: 'You are an expert graphic designer and layout AI. Return only valid JSON.',
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

      const result = JSON.parse(response.choices[0]?.message?.content || '{}');
      console.log(`[OpenAiService] Vision layout analysis complete: ${JSON.stringify(result)}`);

      return {
        layoutPosition: result.layoutPosition || 'center',
        fontColor: result.fontColor || '#FFFFFF',
        headerText: result.headerText || text,
        bodyText: result.bodyText || '',
      };
    } catch (error) {
      console.error('[OpenAiService] Vision layout analysis failed:', error.message);
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
  ): Promise<{ text: string; segments: Array<{ start: number; end: number; text: string }> }> {
    if (!this.nativeOpenai) {
      throw new Error('OPENAI_API_KEY is missing. Transcription requires a direct OpenAI API Key.');
    }

    const file = new File([new Uint8Array(buffer)], 'audio.mp3', { type: 'audio/mpeg' });
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
    // Enhance title into a detailed visual prompt via OpenRouter (9router doesn't support chat completions)
    const openRouterKey = (this.configService.get('OPENROUTER_API_KEY') || '').trim();
    const openRouterModel = this.configService.get('OPENROUTER_MODEL') || this.model;
    
    let enhancedPrompt = title;
    
    if (openRouterKey) {
      try {
        const orClient = new OpenAI({
          apiKey: openRouterKey,
          baseURL: 'https://openrouter.ai/api/v1',
          defaultHeaders: {
            'HTTP-Referer': this.configService.get('APP_URL') || 'https://contenly.app',
            'X-Title': 'Contently AI Platform',
          },
        });
        
        const enhanceResponse = await orClient.chat.completions.create({
          model: openRouterModel,
          messages: [
            {
              role: 'system',
              content: `You are a thumbnail design expert. Given a video title and style, generate a detailed image generation prompt for a vertical Reels/TikTok thumbnail (9:16 portrait). The prompt must be in English, highly descriptive (50-80 words), include subject, lighting, mood, composition optimized for vertical format. Output ONLY the prompt text, nothing else.`,
            },
            {
              role: 'user',
              content: `Title: "${title}"\nStyle: ${style}\n\nGenerate the thumbnail prompt:`,
            },
          ],
          max_tokens: 200,
        });
        
        enhancedPrompt = enhanceResponse.choices[0]?.message?.content?.trim() || title;
      } catch (orError: any) {
        console.warn(`[generateThumbnail] OpenRouter prompt enhancement failed, using title directly: ${orError.message}`);
      }
    }

    // Use generateImage method which has Pollinations fallback
    return await this.generateImage(enhancedPrompt);
  }

  async generateSpeech(
    text: string,
    voice: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer' = 'alloy',
  ): Promise<Buffer> {
    const elevenLabsKey = (this.configService.get('ELEVENLABS_API_KEY') || '').trim();

    if (elevenLabsKey) {
      return this.generateSpeechElevenLabs(text, voice, elevenLabsKey);
    }

    // Fallback to native OpenAI TTS
    if (!this.nativeOpenai) {
      throw new Error('No TTS provider configured. Set ELEVENLABS_API_KEY or OPENAI_API_KEY.');
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
      alloy: 'pNInz6obpgDQGcFmaJgB',    // Adam
      echo: '21m00Tcm4TlvDq8ikWAM',      // Rachel
      fable: 'AZnzlk1XvdvUeBnXmlld',     // Domi
      onyx: 'VR6AewLTigWG4xSOukaG',      // Arnold
      nova: 'EXAVITQu4vr4xnSDxMaL',      // Bella
      shimmer: 'MF3mGyEYCl7XYWbV9V6O',   // Elli
    };

    const voiceId = voiceMap[voice] || voiceMap.nova;

    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
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
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`ElevenLabs TTS failed: ${err}`);
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    return buffer;
  }
}
