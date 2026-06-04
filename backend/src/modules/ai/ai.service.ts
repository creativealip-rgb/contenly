import { TOKEN_COSTS } from "../billing/billing.constants";
import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { OpenAiService } from './services/openai.service';
import { BillingService, BillingResult } from '../billing/billing.service';
import { GenerateContentDto, GenerateSeoDto, AiGenerateImageDto, GeneratePromptDto } from './dto';
import { ArticlesService } from '../articles/articles.service';
import { WordpressService } from '../wordpress/wordpress.service';
import { BILLING_TIERS } from '../billing/billing.constants';
import { SystemSettingsService } from '../system-settings/system-settings.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(
    private openAiService: OpenAiService,
    private billingService: BillingService,
    private articlesService: ArticlesService,
    private wordpressService: WordpressService,
    private settingsService: SystemSettingsService,
  
    private notificationsService: NotificationsService,) { }

  async generateContent(userId: string, dto: GenerateContentDto) {
    // Billing gate: category limit (primary) + kredit (fallback)
    const billingArticle = await this.billingService.ensureBilling(userId, 'ARTICLE_GENERATION');
    if (!billingArticle.allowed) {
      throw new BadRequestException(billingArticle.reason);
    }

    const tier = await this.billingService.getSubscriptionTier(userId);
    // Get model from settings first, fall back to tier default
    const settingsModel = await this.settingsService.getByKey('model_text_generation');
    const model = settingsModel?.value || BILLING_TIERS[tier]?.aiModel;

    // Generate content
    this.logger.log(`Generating content for user tier: ${tier}, mode: ${dto.mode}`);
    const aiResponse = await this.openAiService.generateContent(
      dto.originalContent,
      {
        ...dto.options,
        mode: dto.mode,
        model,
      } as any,
    );

    let content = aiResponse.content;
    const generatedTitle = aiResponse.title;
    const metaDescription = aiResponse.metaDescription;
    const slug = aiResponse.slug;

    // Convert potential Markdown to HTML as a fallback
    this.logger.log(`Raw content generated, length: ${content?.length}`);
    content = this.convertMarkdownToHtml(content);
    this.logger.log(`Content converted to HTML, length: ${content?.length}`);
    // Fix malformed HTML structure (headings inside lists)
    content = this.sanitizeListStructure(content);
    this.logger.log(`Content sanitized, length: ${content?.length}`);
    
    

    // Fetch and inject "Baca Juga" links if we have a site and category
    try {
      this.logger.log(`Attempting to inject links for user: ${userId}, category: ${dto.categoryId}`);
      const sites = await this.wordpressService.getSites(userId);

      this.logger.log(`Found ${sites?.length || 0} sites`);
      if (sites && sites.length > 0) {
        const recentPosts = await this.wordpressService.getRecentPosts(sites[0].id, dto.categoryId);
        this.logger.log(`Fetched ${recentPosts?.length || 0} recent posts for category ${dto.categoryId}`);

        if (recentPosts && recentPosts.length > 0) {
          content = this.injectInternalLinks(content, recentPosts);
          this.logger.log(`Successfully injected ${recentPosts.length} links`);
        } else {
          this.logger.warn(`No recent posts found for category ${dto.categoryId}`);
        }
      }
    } catch (linkError) {
      this.logger.error('Failed to inject internal links', linkError);
    }

    // Record usage (category count + kredit if overflow)
    await this.billingService.recordUsage(userId, 'ARTICLE_GENERATION', billingArticle);
    
    // Send notification
    try {
      await this.notificationsService.create(
        userId,
        'JOB_SUCCESS',
        'Artikel Berhasil Dibuat',
        `Artikel "${generatedTitle || 'Artikel Baru'}" berhasil di-generate.`,
        { articleTitle: generatedTitle, slug },
      );
    } catch (e) { /* notification failure should not block */ }

    // Save generated content as a draft article
    let articleId = null;
    try {
      const savedArticle = await this.articlesService.create(userId, {
        title: generatedTitle || dto.title || 'Artikel Generate AI',
        generatedContent: content,
        originalContent: dto.originalContent,
        sourceUrl: dto.sourceUrl || '',
        status: 'DRAFT',
        // Only pass feedItemId if it's a valid UUID
        feedItemId: (dto.feedItemId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(dto.feedItemId))
          ? dto.feedItemId
          : undefined,
        tokensUsed: 1,
      } as any);
      articleId = savedArticle.id;
    } catch (error) {
      this.logger.error('Failed to auto-save generated article', error);
      // Don't fail the request if auto-save fails
    }

    return {
      title: generatedTitle,
      content,
      metaDescription,
      slug,
      tokensUsed: 1,
      wordCount: content.split(/\s+/).length,
      articleId,
    };
  }

  private convertMarkdownToHtml(md: string): string {
    // If it already looks like HTML, do a lighter pass
    const seemsHtml = /<\/[a-z]+>/i.test(md);

    let html = md;

    // Basic Markdown to HTML conversion
    html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');
    html = html.replace(/\*\*(.*)\*\*/gm, '<strong>$1</strong>');
    html = html.replace(/\*(.*)\*/gm, '<em>$1</em>');
    html = html.replace(
      /\[([^\]]+)\]\(([^)]+)\)/gm,
      '<a href="$2" target="_blank">$1</a>',
    );

    // Lists
    html = html.replace(/^\s*-\s+(.*$)/gim, '<li>$1</li>');
    html = html.replace(/^\s*\*\s+(.*$)/gim, '<li>$1</li>');
    // Simple <ul> wrapper for adjacent <li>
    html = html.replace(/(<li>.*<\/li>)+/gim, '<ul>$&</ul>');

    // Paragraphs: Wrap lines that aren't tags in <p> if not already HTML
    if (!seemsHtml) {
      html = html
        .split('\n\n')
        .map((p) => {
          const trimmed = p.trim();
          if (!trimmed) return '';
          if (
            trimmed.startsWith('<h') ||
            trimmed.startsWith('<ul') ||
            trimmed.startsWith('<li')
          )
            return trimmed;
          return `<p>${trimmed}</p>`;
        })
        .join('');
    }

    // Cleanup: AI sometimes leaves stray Markdown bold marks even in HTML
    html = html.replace(/\*\*/g, '').replace(/__/g, '');

    return html;
  }

  private injectInternalLinks(content: string, links: { title: string; link: string }[]): string {
    if (!links || links.length === 0) return content;

    // Detect content format (HTML or Markdown/Text)
    const isHtml = /<\/p>|<\/div>|<br\s*\/?>/i.test(content);
    const delimiter = isHtml ? /<\/p>/i : /\n\s*\n/;

    // Split content into paragraphs
    const chunks = content.split(delimiter);
    const actualChunks = chunks.filter(c => c.trim().length > 0);

    this.logger.log(`Injecting links into ${isHtml ? 'HTML' : 'Markdown'} (${actualChunks.length} paragraphs)`);

    const createLink = (item: { title: string; link: string }) =>
      isHtml
        ? `<p><strong>Baca juga: <a href="${item.link}" target="_blank" rel="noopener noreferrer">${item.title}</a></strong></p>`
        : `\n\n**Baca juga: [${item.title}](${item.link})**\n\n`;

    // Case: Article too short or single block
    if (actualChunks.length < 2) {
      let result = createLink(links[0]) + content;
      if (links[1]) result += createLink(links[1]);
      if (links[2]) result += createLink(links[2]);
      return result;
    }

    let newContent = '';

    const total = actualChunks.length;
    const mid = Math.floor(total / 2);

    for (let i = 0; i < total; i++) {
      newContent += actualChunks[i] + (isHtml ? '</p>' : '\n\n');

      // Position 1: After 1st paragraph (moved from before)
      if (i === 0 && links[0]) {
        newContent += createLink(links[0]);
      }

      // Position 2: Middle of article (after middle paragraph chunk)
      if (i === mid - 1 && links[1]) {
        newContent += createLink(links[1]);
      }

      // Position 3: Before the very last paragraph
      if (i === total - 2 && links[2]) {
        newContent += createLink(links[2]);
      }
    }

    return newContent.trim();
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

  async generateImage(userId: string, dto: AiGenerateImageDto) {
    // Billing gate: category limit (primary) + kredit (fallback)
    const billingImage = await this.billingService.ensureBilling(userId, 'IMAGE_GENERATION');
    if (!billingImage.allowed) {
      throw new BadRequestException(billingImage.reason);
    }

    // Generate image with configured model
    const imageModelSetting = await this.settingsService.getByKey('model_image_generation');
    const imageModel = imageModelSetting?.value || undefined;
    const imageUrl = await this.openAiService.generateImage(dto.prompt, imageModel);

    // Record usage
    await this.billingService.recordUsage(userId, 'IMAGE_GENERATION', billingImage);

    // Send notification
    try {
      await this.notificationsService.create(
        userId,
        'JOB_SUCCESS',
        'Gambar Berhasil Di-generate',
        'Gambar AI berhasil di-generate.',
        { imageUrl },
      );
    } catch (e) { /* notification failure should not block */ }

    return {
      imageUrl,
      tokensUsed: 2,
    };
  }

  async generatePrompt(dto: GeneratePromptDto) {
    this.logger.log(`Generating ${dto.mode} prompt from: ${dto.text}`);

    const systemPrompt = dto.mode === 'image'
      ? `You are an AI image prompt generator. Convert the user's everyday language description into a structured JSON prompt for AI image generation (like Midjourney, DALL-E, or Stable Diffusion).

Respond ONLY with valid JSON in this exact format:
{
  "subject": "The main subject of the image",
  "style": "Art style (e.g., photorealistic, anime, watercolor, 3D render, etc.)",
  "lighting": "Lighting conditions (e.g., golden hour, dramatic, soft, neon, etc.)",
  "composition": "How the image is composed (e.g., close-up, wide shot, rule of thirds, centered, etc.)",
  "colors": "Color palette or dominant colors (e.g., warm tones, cool blues, vibrant, muted, etc.)",
  "mood": "The mood or atmosphere (e.g., peaceful, dramatic, mysterious, joyful, etc.)",
  "additionalDetails": "Extra details like background, texture, specific elements, etc."
}

Keep each field concise but descriptive. Use English.`
      : `You are an AI video prompt generator. Convert the user's everyday language description into a structured JSON prompt for AI video generation (like Runway, Pika, or Sora).

Respond ONLY with valid JSON in this exact format:
{
  "subject": "The main subject of the video",
  "action": "What the subject is doing or the main action",
  "scene": "The setting or environment",
  "cameraMovement": "Camera motion (e.g., static, pan left, zoom in, tracking shot, drone view, etc.)",
  "duration": "Approximate shot duration (e.g., 2-3 seconds, 5 seconds, continuous, etc.)",
  "style": "Visual style (e.g., cinematic, documentary, anime, animation, etc.)",
  "mood": "The mood or atmosphere (e.g., energetic, calm, dramatic, joyful, etc.)",
  "additionalDetails": "Extra details like weather, time of day, specific movements, etc."
}

Keep each field concise but descriptive. Use English.`;

    const response = await this.openAiService.getClient().chat.completions.create({
      model: this.openAiService.getModel() || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: dto.text },
      ],
      temperature: 0.7,
    });

    const prompt = response.choices[0]?.message?.content?.trim();
    
    if (!prompt) {
      throw new BadRequestException('Failed to generate prompt');
    }

    return { prompt };
  }

  async chat(userId: string, message: string, history: Array<{ role: string; content: string }>) {
    // Check plan — FREE users cannot use AI Chat
    const chatLimit = await this.billingService.checkDailyChatLimit(userId, 30);
    if (!chatLimit.allowed) {
      const tier = await this.billingService.getSubscriptionTier(userId);
      if (tier === 'FREE') {
        throw new BadRequestException('AI Chat tidak tersedia di paket Free. Silakan upgrade ke paket Starter atau lebih tinggi.');
      }
      throw new BadRequestException(`Batas harian AI Chat (${chatLimit.limit} pesan/hari) sudah tercapai. Coba lagi besok.`);
    }

    // Track usage
    await this.billingService.incrementDailyUsage(userId, 'AI_CHAT');

    const client = this.openAiService.getClient();
    const messages = [
      { role: 'system' as const, content: 'Kamu adalah AI assistant untuk platform Contenly — platform otomasi konten. Bantu user dengan pertanyaan tentang content creation, SEO, social media strategy, copywriting, dan penggunaan platform. Jawab dalam Bahasa Indonesia, singkat dan actionable.' },
      ...history.map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
      { role: 'user' as const, content: message },
    ];

    const response = await client.chat.completions.create({
      model: this.openAiService.getModel(),
      messages,
      max_tokens: 500,
      temperature: 0.7,
    });

    return { reply: response.choices[0]?.message?.content || 'Maaf, saya tidak bisa menjawab saat ini.' };
  }

  /**
   * Fix malformed HTML where headings/paragraphs are incorrectly nested inside lists.
   * AI sometimes generates: <ul><li>...</li><h2>...</h2><li>...</li></ul>
   * This method fixes it to: <ul><li>...</li></ul><h2>...</h2><ul><li>...</li></ul>
   */
  private sanitizeListStructure(html: string): string {
    if (!html) return html;

    // Fix block elements (headings, paragraphs, divs) incorrectly nested inside ul/ol
    // AI sometimes generates: <ul><li>...</li><h2>...</h2><p>...</p><li>...</li></ul>
    // This fixes it to: <ul><li>...</li></ul><h2>...</h2><p>...</p><ul><li>...</li></ul>
    return html.replace(/(<(?:ul|ol)[^>]*>)([\s\S]*?)(<\/(?:ul|ol)>)/gi, (match, openTag, listContent, closeTag) => {
      const listType = openTag.match(/<(ul|ol)/i)[1].toLowerCase();
      const closeAll = '</' + listType + '>';

      // Split content into segments: li items vs non-li items
      const segments: Array<{ type: 'li' | 'block'; html: string }> = [];
      const regex = /(<li[\s>][\s\S]*?<\/li>)/gi;
      let lastIndex = 0;
      let match2: RegExpExecArray | null;

      while ((match2 = regex.exec(listContent)) !== null) {
        if (match2.index > lastIndex) {
          const before = listContent.substring(lastIndex, match2.index).trim();
          if (before) segments.push({ type: 'block', html: before });
        }
        segments.push({ type: 'li', html: match2[0] });
        lastIndex = regex.lastIndex;
      }
      if (lastIndex < listContent.length) {
        const after = listContent.substring(lastIndex).trim();
        if (after) segments.push({ type: 'block', html: after });
      }

      const hasNonLi = segments.some(s => s.type === 'block');
      if (!hasNonLi) return match;

      let result = '';
      let currentLis: string[] = [];

      for (const seg of segments) {
        if (seg.type === 'li') {
          currentLis.push(seg.html);
        } else {
          if (currentLis.length > 0) {
            result += openTag + currentLis.join('') + closeAll;
            currentLis = [];
          }
          result += seg.html;
        }
      }
      if (currentLis.length > 0) {
        result += openTag + currentLis.join('') + closeAll;
      }

      return result;
    });
  }
}