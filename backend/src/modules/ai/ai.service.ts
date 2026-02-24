import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { OpenAiService } from './services/openai.service';
import { BillingService } from '../billing/billing.service';
import { GenerateContentDto, GenerateSeoDto, AiGenerateImageDto } from './dto';
import { ArticlesService } from '../articles/articles.service';
import { WordpressService } from '../wordpress/wordpress.service';
import { BILLING_TIERS } from '../billing/billing.constants';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(
    private openAiService: OpenAiService,
    private billingService: BillingService,
    private articlesService: ArticlesService,
    private wordpressService: WordpressService,
  ) { }

  async generateContent(userId: string, dto: GenerateContentDto) {
    // Check token balance
    const hasBalance = await this.billingService.checkBalance(userId, 1);
    if (!hasBalance) {
      throw new BadRequestException('Saldo kredit Anda tidak mencukupi untuk request ini.');
    }

    const withinDailyLimit = await this.billingService.checkDailyLimit(userId, 'ARTICLE_GENERATION');
    if (!withinDailyLimit) {
      throw new BadRequestException('Daily limit reached for Article Generation on your current plan. Please upgrade or try again tomorrow.');
    }

    const tier = await this.billingService.getSubscriptionTier(userId);
    const model = BILLING_TIERS[tier]?.aiModel;

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

    // Deduct tokens and increment usage
    await this.billingService.deductTokens(userId, 1, 'Article generation');
    await this.billingService.incrementDailyUsage(userId, 'ARTICLE_GENERATION');

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
