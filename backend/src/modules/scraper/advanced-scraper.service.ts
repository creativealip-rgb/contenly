import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { Readability } from '@mozilla/readability';
import { JSDOM } from 'jsdom';

export interface AdvancedScrapedContent {
  title: string;
  content: string;
  excerpt: string;
  images: string[];
  metadata: {
    author?: string;
    publishedDate?: string;
    tags?: string[];
    description?: string;
  };
  extractionTier?: 1 | 2 | 3; // Track which method succeeded
}

@Injectable()
export class AdvancedScraperService {
  private readonly logger = new Logger(AdvancedScraperService.name);

  async scrapeArticle(url: string): Promise<AdvancedScrapedContent> {
    try {
      this.logger.log(`Scraping article: ${url}`);

      // Fetch HTML
      const response = await axios.get(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
        timeout: 30000,
        maxRedirects: 10,
      });

      const html = response.data;
      this.logger.log(`Fetched HTML for ${url}, length: ${html?.length || 0}`);

      // Try Tier 1: Mozilla Readability
      try {
        const tier1Result = await this.extractWithReadability(url, html);
        if (tier1Result) {
          this.logger.log(`✅ Tier 1 (Readability) succeeded for ${url}`);
          return { ...tier1Result, extractionTier: 1 };
        }
      } catch (e) {
        this.logger.warn(`Tier 1 failed for ${url}: ${e.message}`);
      }

      // Try Tier 2: Advanced Heuristics
      try {
        const tier2Result = await this.extractWithHeuristics(html, url);
        if (tier2Result) {
          this.logger.log(`✅ Tier 2 (Heuristics) succeeded for ${url}`);
          return { ...tier2Result, extractionTier: 2 };
        }
      } catch (e) {
        this.logger.warn(`Tier 2 failed for ${url}: ${e.message}`);
      }

      // Try Tier 3: CSS Selectors (Fallback)
      try {
        const tier3Result = await this.extractWithSelectors(html, url);
        if (tier3Result) {
          this.logger.log(`✅ Tier 3 (Selectors) succeeded for ${url}`);
          return { ...tier3Result, extractionTier: 3 };
        }
      } catch (e) {
        this.logger.warn(`Tier 3 failed for ${url}: ${e.message}`);
      }

      this.logger.error(`Scrape failed for ${url}: No usable content extracted across all tiers`);
      throw new Error('All content extraction methods failed to produce usable text');
    } catch (error) {
      this.logger.error(
        `Failed to scrape ${url}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      if (error.response) {
        this.logger.error(`Axios Error Status: ${error.response.status}`);
      }
      throw new BadRequestException(
        `Failed to scrape article: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Tier 1: Mozilla Readability Algorithm
   * Success Rate: ~95%
   */
  private async extractWithReadability(
    url: string,
    html: string,
  ): Promise<Omit<AdvancedScrapedContent, 'extractionTier'> | null> {
    try {
      const dom = new JSDOM(html, { url });
      const reader = new Readability(dom.window.document);
      const article = reader.parse();

      if (article && article.textContent && article.textContent.length > 100) {
        const images = this.extractImagesFromHtml(article.content || '');

        return {
          title: article.title || 'Untitled',
          content: article.textContent.trim(),
          excerpt:
            article.excerpt || article.textContent.substring(0, 200) + '...',
          images: images.slice(0, 10),
          metadata: {
            author: article.byline || undefined,
            publishedDate: this.extractDateFromHtml(html),
            description: article.excerpt || undefined,
          },
        };
      }

      return null;
    } catch (error) {
      this.logger.warn(
        `Tier 1 (Readability) failed: ${error instanceof Error ? error.message : 'Unknown'}`,
      );
      return null;
    }
  }

  /**
   * Tier 2: Advanced Content Heuristics
   * Success Rate: ~80%
   */
  private async extractWithHeuristics(
    html: string,
    url: string,
  ): Promise<Omit<AdvancedScrapedContent, 'extractionTier'> | null> {
    try {
      const $ = cheerio.load(html);

      // Remove noise
      $(
        'script, style, nav, footer, header, aside, .advertisement, .ad, .sidebar, .comments, .related-posts',
      ).remove();

      // Extract title
      const title =
        $('h1').first().text().trim() ||
        $('meta[property="og:title"]').attr('content') ||
        $('title').text().trim() ||
        'Untitled';

      // Find all potential content blocks
      const candidates = $('div, article, section, main');
      let bestCandidate: any = null;
      let bestScore = 0;

      candidates.each((_, elem) => {
        const $elem = $(elem);
        const text = $elem.text();
        const score = this.calculateContentScore($elem, text);

        if (score > bestScore) {
          bestScore = score;
          bestCandidate = elem;
        }
      });

      // Require minimum score
      if (bestCandidate && bestScore > 50) {
        const $best = $(bestCandidate);
        const content = $best.text().trim();

        if (content.length > 100) {
          return {
            title,
            content: this.cleanText(content),
            excerpt: content.substring(0, 200) + '...',
            images: this.extractImages($best, url),
            metadata: {
              author: this.extractAuthor($),
              publishedDate: this.extractDateFromHtml(html),
              description: $('meta[name="description"]').attr('content'),
            },
          };
        }
      }

      return null;
    } catch (error) {
      this.logger.warn(
        `Tier 2 (Heuristics) failed: ${error instanceof Error ? error.message : 'Unknown'}`,
      );
      return null;
    }
  }

  /**
   * Tier 3: CSS Selector Fallback (Current Method)
   * Success Rate: ~50%
   */
  private async extractWithSelectors(
    html: string,
    url: string,
  ): Promise<Omit<AdvancedScrapedContent, 'extractionTier'> | null> {
    try {
      const $ = cheerio.load(html);

      // Remove unwanted elements
      $(
        'script, style, nav, footer, header, aside, .advertisement, .ad, .sidebar',
      ).remove();

      // Extract title
      const title =
        $('h1').first().text().trim() ||
        $('meta[property="og:title"]').attr('content') ||
        $('title').text().trim() ||
        'Untitled';

      // Try common article selectors
      const articleSelectors = [
        'article .entry-content',
        'article .post-content',
        '.td-post-content', // WordPress Newspaper theme
        '.post-content',
        '.entry-content',
        'article',
        '.content',
        'main',
        '.article-body',
      ];

      let content = '';
      for (const selector of articleSelectors) {
        const element = $(selector);
        if (element.length > 0) {
          const text = element.text().trim();
          if (text.length > 100) {
            content = text;
            break;
          }
        }
      }

      // Fallback to body if no article found
      if (!content || content.length < 100) {
        content = $('body').text().trim();
      }

      if (content.length > 100) {
        return {
          title,
          content: this.cleanText(content),
          excerpt: content.substring(0, 200) + '...',
          images: this.extractImages($('body'), url),
          metadata: {
            author: this.extractAuthor($),
            publishedDate: this.extractDateFromHtml(html),
            description: $('meta[name="description"]').attr('content'),
          },
        };
      }

      return null;
    } catch (error) {
      this.logger.warn(
        `Tier 3 (Selectors) failed: ${error instanceof Error ? error.message : 'Unknown'}`,
      );
      return null;
    }
  }

  /**
   * Calculate content score for heuristic extraction
   */
  private calculateContentScore(
    $elem: cheerio.Cheerio<any>,
    text: string,
  ): number {
    let score = 0;

    // Text length (primary signal)
    const textLength = text.length;
    score += Math.min(textLength / 10, 100);

    // Paragraph count
    const paragraphCount = $elem.find('p').length;
    score += paragraphCount * 5;

    // Penalize if has ads/navigation keywords
    const lowerText = text.toLowerCase();
    if (
      lowerText.includes('advertisement') ||
      lowerText.includes('iklan') ||
      lowerText.includes('navigation') ||
      lowerText.includes('menu')
    ) {
      score -= 50;
    }

    // Bonus for article-like elements
    if ($elem.find('h1, h2, h3').length > 0) score += 10;
    if ($elem.find('time').length > 0) score += 15;
    if ($elem.find('p').length > 3) score += 20;

    // Penalize if very short
    if (textLength < 100) score -= 100;

    // Bonus for article semantic tags
    const tagName = $elem.prop('tagName')?.toLowerCase();
    if (tagName === 'article') score += 30;
    if (tagName === 'main') score += 20;

    return score;
  }

  /**
   * Extract images from HTML content
   */
  private extractImagesFromHtml(html: string): string[] {
    const $ = cheerio.load(html);
    const images: string[] = [];

    $('img').each((_, el) => {
      const src = $(el).attr('src') || $(el).attr('data-src');
      if (src && !src.includes('data:image') && !src.includes('base64')) {
        images.push(src);
      }
    });

    return images;
  }

  /**
   * Extract images from cheerio element
   */
  private extractImages(
    $elem: cheerio.Cheerio<any>,
    baseUrl: string,
  ): string[] {
    const images: string[] = [];

    $elem.find('img').each((_, el) => {
      const src = $elem.find(el).attr('src') || $elem.find(el).attr('data-src');
      if (src && !src.includes('data:image') && !src.includes('base64')) {
        const fullUrl = this.resolveUrl(src, baseUrl);
        if (fullUrl) images.push(fullUrl);
      }
    });

    return images.slice(0, 10);
  }

  /**
   * Extract author from HTML
   */
  private extractAuthor($: cheerio.CheerioAPI): string | undefined {
    return (
      $('meta[name="author"]').attr('content') ||
      $('[rel="author"]').text().trim() ||
      $('meta[property="article:author"]').attr('content') ||
      undefined
    );
  }

  /**
   * Extract published date from HTML
   */
  private extractDateFromHtml(html: string): string | undefined {
    const $ = cheerio.load(html);
    return (
      $('meta[property="article:published_time"]').attr('content') ||
      $('time').attr('datetime') ||
      $('meta[name="pubdate"]').attr('content') ||
      undefined
    );
  }

  /**
   * Clean text content and decode HTML entities
   */
  private cleanText(text: string): string {
    if (!text) return '';

    return text
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&#(\d+);/g, (match, dec) => String.fromCharCode(dec))
      .replace(/&#x([0-9a-f]+);/gi, (match, hex) =>
        String.fromCharCode(parseInt(hex, 16)),
      )
      .replace(/\s+/g, ' ')
      .replace(/\n\s*\n/g, '\n\n')
      .trim();
  }

  /**
   * Resolve relative URLs to absolute
   */
  private resolveUrl(src: string, baseUrl: string): string | null {
    try {
      return new URL(src, baseUrl).href;
    } catch {
      return null;
    }
  }
}
