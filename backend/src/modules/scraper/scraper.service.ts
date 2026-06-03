import { Injectable, BadRequestException } from '@nestjs/common';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { ScrapeUrlDto } from './dto';

export interface ScrapedContent {
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
}

@Injectable()
export class ScraperService {
  async scrapeUrl(dto: ScrapeUrlDto): Promise<ScrapedContent> {
    try {
      const response = await axios.get(dto.url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
        timeout: 30000,
      });

      const $ = cheerio.load(response.data);

      // Remove unwanted elements
      $(
        'script, style, nav, footer, header, aside, noscript, iframe, svg, .advertisement, .ad, .sidebar, .social-share, .related-posts, .cookie-banner, .popup, .modal, [role="banner"], [role="complementary"], .gtm-container, .analytics, .tracking, .comments, .comment-section',
      ).remove();

      // Extract title
      const title =
        $('h1').first().text().trim() ||
        $('meta[property="og:title"]').attr('content') ||
        $('title').text().trim() ||
        'Untitled';

      // Extract main content
      const articleSelectors = [
        'article',
        '.post-content',
        '.entry-content',
        '.content',
        'main',
        '.article-body',
      ];
      let content = '';

      for (const selector of articleSelectors) {
        const element = $(selector);
        if (element.length > 0) {
          content = element.text().trim();
          break;
        }
      }

      // Fallback to body if no article found
      if (!content) {
        content = $('body').text().trim();
      }

      // Clean up content
      content = this.cleanText(content);

      // Extract images if requested
      const images: string[] = [];
      if (dto.extractImages) {
        $('img').each((_, el) => {
          const src = $(el).attr('src') || $(el).attr('data-src');
          if (src && !src.includes('data:image') && !src.includes('base64')) {
            const fullUrl = this.resolveUrl(src, dto.url);
            if (fullUrl) images.push(fullUrl);
          }
        });
      }

      // Extract metadata
      const metadata: ScrapedContent['metadata'] = {};
      if (dto.extractMetadata) {
        metadata.author =
          $('meta[name="author"]').attr('content') ||
          $('[rel="author"]').text().trim() ||
          undefined;

        metadata.publishedDate =
          $('meta[property="article:published_time"]').attr('content') ||
          $('time').attr('datetime') ||
          undefined;

        metadata.description =
          $('meta[name="description"]').attr('content') ||
          $('meta[property="og:description"]').attr('content') ||
          undefined;

        const tags: string[] = [];
        $('meta[property="article:tag"]').each((_, el) => {
          const tag = $(el).attr('content');
          if (tag) tags.push(tag);
        });
        if (tags.length > 0) metadata.tags = tags;
      }

      return {
        title,
        content,
        excerpt: content.substring(0, 200) + '...',
        images: images.slice(0, 10), // Limit to 10 images
        metadata,
      };
    } catch (error) {
      throw new BadRequestException(
        `Failed to scrape URL: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  private cleanText(text: string): string {
    return text
      // Remove tracking/analytics script content
      .replace(/googletagmanager[^\n]*/gi, '')
      .replace(/google-analytics[^\n]*/gi, '')
      .replace(/gtag\([^)]*\)[^;]*;/gi, '')
      .replace(/fbq\([^)]*\)[^;]*;/gi, '')
      .replace(/\(function\([^)]*\)[^}]*\}/gi, '')
      // Remove noscript iframe content
      .replace(/<noscript>[\s\S]*?<\/noscript>/gi, '')
      .replace(/<iframe[\s\S]*?<\/iframe>/gi, '')
      // Remove common noise patterns
      .replace(/\[\s*\]/g, '') // Empty brackets
      .replace(/\(function\(w,d,s,l,i\)[\s\S]*?\}\(window,document,'script'[^)]*\)\);?/gi, '')
      // Clean whitespace
      .replace(/\s+/g, ' ')
      .replace(/\n\s*\n/g, '\n\n')
      .trim();
  }

  private resolveUrl(src: string, baseUrl: string): string | null {
    try {
      return new URL(src, baseUrl).href;
    } catch {
      return null;
    }
  }
}
