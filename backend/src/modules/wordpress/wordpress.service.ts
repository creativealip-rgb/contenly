import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { eq, and, sql } from 'drizzle-orm';
import { DrizzleService } from '../../db/drizzle.service';
import { wpSite, categoryMapping, article } from '../../db/schema';
import { ArticlesService } from '../articles/articles.service';
import axios from 'axios';
import sharp from 'sharp';
import {
  WpCategory,
  WpPostData,
  WpPostResponse,
  ArticleStatus,
  ArticleUpdateData,
} from '../../db/types';
import { BillingService } from '../billing/billing.service';
import { BILLING_TIERS } from '../billing/billing.constants';
import * as path from 'path';
import * as fs from 'fs';
// import { Cron, Timeout } from '@nestjs/schedule';
import { EncryptionService } from '../security/encryption.service';

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const isUuid = (value: string) => UUID_REGEX.test(value);
const WP_REQUEST_TIMEOUT_MS = 10000;
const WP_RETRYABLE_STATUS_CODES = new Set([408, 429, 500, 502, 503, 504]);

@Injectable()
export class WordpressService implements OnModuleInit {
  private readonly logger = new Logger(WordpressService.name);

  constructor(
    private drizzle: DrizzleService,
    private configService: ConfigService,
    private articlesService: ArticlesService,
    private billingService: BillingService,
    private encryptionService: EncryptionService,
  ) {}

  async onModuleInit() {
    this.logger.log('WordpressService initialized.');
  }

  // @Cron('0 */30 * * * *') // Run every 30 minutes
  async handleScheduledSync() {
    this.logger.log('Running automated sync (Cron)...');
    try {
      await this.syncScheduledArticles();
    } catch (err: any) {
      this.logger.error('Error in automated sync', err.message);
    }
  }

  // @Timeout(10000) // Run once 10 seconds after startup
  async handleStartupSync() {
    this.logger.log('Running initial sync after startup (Timeout)...');
    try {
      await this.syncScheduledArticles();
    } catch (err: any) {
      this.logger.error('Error in startup sync', err.message);
    }
  }

  get db() {
    return this.drizzle.db;
  }

  private normalizeSiteUrl(url: string): string {
    return url.trim().replace(/\/$/, '');
  }

  private getWpErrorMessage(error: any): string {
    const status = error?.response?.status;
    const wpMessage = error?.response?.data?.message;
    const code = error?.code;

    if (status === 401 || status === 403)
      return 'WordPress authentication failed. Check username and application password.';
    if (status === 404)
      return 'WordPress REST API endpoint not found. Check site URL and permalink/REST API settings.';
    if (status === 429)
      return 'WordPress rate limit reached. Please retry later.';
    if (status >= 500)
      return 'WordPress server error. Please retry later or check site health.';
    if (code === 'ECONNABORTED')
      return 'WordPress request timed out. Check site connectivity.';
    if (code === 'ENOTFOUND' || code === 'ECONNREFUSED')
      return 'WordPress site is unreachable. Check site URL and hosting status.';
    if (wpMessage) return `WordPress error: ${wpMessage}`;
    return error?.message || 'Failed to communicate with WordPress.';
  }

  private shouldRetryWpRequest(error: any): boolean {
    const status = error?.response?.status;
    return (
      !status ||
      WP_RETRYABLE_STATUS_CODES.has(status) ||
      error?.code === 'ECONNABORTED'
    );
  }

  private async retryWpRequest<T>(
    operation: () => Promise<T>,
    label: string,
    attempts = 2,
  ): Promise<T> {
    let lastError: any;
    for (let attempt = 1; attempt <= attempts; attempt += 1) {
      try {
        return await operation();
      } catch (error: any) {
        lastError = error;
        if (attempt >= attempts || !this.shouldRetryWpRequest(error)) break;
        this.logger.warn(
          `${label} failed on attempt ${attempt}; retrying: ${this.getWpErrorMessage(error)}`,
        );
        await new Promise((resolve) => setTimeout(resolve, 250 * attempt));
      }
    }
    throw lastError;
  }

  private async markSiteHealth(
    siteId: string,
    connected: boolean,
  ): Promise<void> {
    await this.db
      .update(wpSite)
      .set({
        status: connected ? 'CONNECTED' : 'ERROR',
        lastHealthCheck: new Date(),
      })
      .where(eq(wpSite.id, siteId));
  }

  async getSites(userId: string) {
    return this.db.query.wpSite.findMany({
      where: eq(wpSite.userId, userId),
      columns: {
        id: true,
        name: true,
        url: true,
        username: true,
        status: true,
        lastHealthCheck: true,
        createdAt: true,
      },
    });
  }

  async connectSite(
    userId: string,
    data: { name: string; url: string; username: string; appPassword: string },
  ) {
    // Check tier limits
    const tier = await this.billingService.getSubscriptionTier(userId);
    const limit = BILLING_TIERS[tier]?.maxWpSites || 1;

    const existingSites = await this.getSites(userId);
    if (existingSites.length >= limit) {
      throw new BadRequestException(
        `Tier ${tier} limit reached. Maximum ${limit} WordPress sites allowed.`,
      );
    }

    // Test connection first
    const normalizedUrl = this.normalizeSiteUrl(data.url);
    const isValid = await this.testConnection(
      normalizedUrl,
      data.username,
      data.appPassword,
    );
    if (!isValid) {
      throw new BadRequestException(
        'Failed to connect to WordPress site. Please check credentials.',
      );
    }

    // Encrypt the app password
    const encryptedPassword = this.encryptionService.encrypt(data.appPassword);

    // Create the site
    const [site] = await this.db
      .insert(wpSite)
      .values({
        userId,
        name: data.name,
        url: normalizedUrl,
        username: data.username,
        appPasswordEncrypted: encryptedPassword,
        status: 'CONNECTED',
        lastHealthCheck: new Date(),
      })
      .returning();

    // Fetch and cache categories
    await this.syncCategories(userId, site.id);

    return site;
  }

  async testConnection(
    url: string,
    username: string,
    appPassword: string,
  ): Promise<boolean> {
    try {
      const auth = Buffer.from(`${username}:${appPassword}`).toString('base64');
      const apiUrl = `${this.normalizeSiteUrl(url)}/wp-json/wp/v2/users/me`;
      this.logger.log(`Testing connection to: ${apiUrl}`);

      const response = await this.retryWpRequest(
        () =>
          axios.get(apiUrl, {
            headers: { Authorization: `Basic ${auth}` },
            timeout: WP_REQUEST_TIMEOUT_MS,
          }),
        'testConnection',
      );

      this.logger.log(`Connection test successful: ${response.status}`);
      return response.status === 200;
    } catch (error) {
      this.logger.error(
        `Connection test failed for ${url}: ${this.getWpErrorMessage(error)}`,
      );
      return false;
    }
  }

  async verifySiteConnection(
    userId: string,
    siteId: string,
  ): Promise<{ connected: boolean; message?: string }> {
    const site = await this.db.query.wpSite.findFirst({
      where: eq(wpSite.id, siteId),
    });

    if (!site) throw new NotFoundException('Site not found');
    if (site.userId !== userId) throw new ForbiddenException('Access denied');

    this.logger.log(
      `Verifying connection for site: ${site.name} (${site.url})`,
    );

    try {
      const appPassword = this.encryptionService.decrypt(
        site.appPasswordEncrypted,
      );
      const isConnected = await this.testConnection(
        site.url,
        site.username,
        appPassword,
      );

      // Update last health check
      await this.markSiteHealth(siteId, isConnected);
      if (isConnected) {
        this.logger.log(`Site ${site.name} connection verified successfully`);
      } else {
        this.logger.warn(`Site ${site.name} connection test returned false`);
      }

      return { connected: isConnected };
    } catch (error: any) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `verifySiteConnection error for site ${siteId}:`,
        message,
      );
      return { connected: false, message };
    }
  }

  async syncCategories(userId: string, siteId: string) {
    this.logger.log(`Starting category sync for site: ${siteId}`);
    const site = await this.db.query.wpSite.findFirst({
      where: eq(wpSite.id, siteId),
    });

    if (!site) {
      this.logger.warn('Site not found for category sync');
      throw new NotFoundException('Site not found');
    }

    if (site.userId !== userId) throw new ForbiddenException('Access denied');

    try {
      const appPassword = this.encryptionService.decrypt(
        site.appPasswordEncrypted,
      );
      const auth = Buffer.from(`${site.username}:${appPassword}`).toString(
        'base64',
      );

      this.logger.log('Fetching categories from WordPress API');
      const response = await this.retryWpRequest(
        () =>
          axios.get(`${site.url}/wp-json/wp/v2/categories?per_page=100`, {
            headers: { Authorization: `Basic ${auth}` },
            timeout: WP_REQUEST_TIMEOUT_MS,
          }),
        'syncCategories',
        3,
      );

      this.logger.log(`Received ${response.data.length} categories`);

      const categories: WpCategory[] = response.data.map((cat: any) => ({
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
      }));

      await this.db
        .update(wpSite)
        .set({ categoriesCache: categories })
        .where(eq(wpSite.id, siteId));

      this.logger.log('Categories cached successfully');
      return categories;
    } catch (error: any) {
      this.logger.error('syncCategories error', error.message);
      return [];
    }
  }

  async publishPost(
    siteId: string,
    data: {
      title: string;
      content: string;
      status?: 'draft' | 'publish' | 'private';
      categoryIds?: number[];
      featuredImageUrl?: string;
    },
  ) {
    const site = await this.db.query.wpSite.findFirst({
      where: eq(wpSite.id, siteId),
    });

    if (!site) throw new NotFoundException('Site not found');

    const appPassword = this.encryptionService.decrypt(
      site.appPasswordEncrypted,
    );
    const auth = Buffer.from(`${site.username}:${appPassword}`).toString(
      'base64',
    );

    // Create the post
    const response = await axios.post(
      `${site.url}/wp-json/wp/v2/posts`,
      {
        title: data.title,
        content: data.content,
        status: data.status || 'draft',
        categories: data.categoryIds || [],
      },
      {
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/json',
        },
      },
    );

    return {
      wpPostId: String(response.data.id),
      wpPostUrl: response.data.link,
    };
  }

  async deleteSite(userId: string, siteId: string) {
    const site = await this.db.query.wpSite.findFirst({
      where: and(eq(wpSite.id, siteId), eq(wpSite.userId, userId)),
    });

    if (!site) throw new NotFoundException('Site not found');

    await this.db.delete(wpSite).where(eq(wpSite.id, siteId));
    return { message: 'Site disconnected' };
  }

  async uploadMediaFromUrl(siteId: string, imageUrl: string): Promise<number> {
    const site = await this.db.query.wpSite.findFirst({
      where: eq(wpSite.id, siteId),
    });
    if (!site) throw new NotFoundException('Site not found');

    const appPassword = this.encryptionService.decrypt(
      site.appPasswordEncrypted,
    );
    const auth = Buffer.from(`${site.username}:${appPassword}`).toString(
      'base64',
    );

    try {
      let buffer: Buffer;
      let mimeType: string;
      let filename: string;

      if (imageUrl.startsWith('data:')) {
        // Handle Base64 Data URL
        const [header, base64Data] = imageUrl.split(',');
        mimeType = header.split(':')[1].split(';')[0];
        buffer = Buffer.from(base64Data, 'base64');
        const extension = mimeType.split('/')[1] || 'png';
        filename = `upload-${Date.now()}.${extension}`;
      } else {
        // Fetch external image
        const imageResponse = await axios.get(imageUrl, {
          responseType: 'arraybuffer',
        });
        buffer = Buffer.from(imageResponse.data, 'binary');
        mimeType = imageResponse.headers['content-type'] || 'image/png';
        filename = `ai-gen-${Date.now()}.png`;
      }

      // Automatic Cropping to 1200x628
      this.logger.log('Cropping image to 1200x628...');
      const croppedBuffer = await sharp(buffer)
        .resize({
          width: 1200,
          height: 628,
          fit: 'cover',
          position: 'center',
        })
        .toBuffer();

      // Upload to WP Media
      const uploadResponse = await axios.post(
        `${site.url}/wp-json/wp/v2/media`,
        croppedBuffer,
        {
          headers: {
            Authorization: `Basic ${auth}`,
            'Content-Type': mimeType,
            'Content-Disposition': `attachment; filename="${filename}"`,
          },
        },
      );

      return uploadResponse.data.id;
    } catch (error: any) {
      this.logger.error('uploadMediaFromUrl error', error.message);
      throw new BadRequestException(
        'Failed to process and upload image to WordPress',
      );
    }
  }

  async uploadMediaFromFile(
    siteId: string,
    fileBuffer: Buffer,
    filename: string,
    mimeType: string,
  ): Promise<number> {
    const site = await this.db.query.wpSite.findFirst({
      where: eq(wpSite.id, siteId),
    });
    if (!site) throw new NotFoundException('Site not found');

    const appPassword = this.encryptionService.decrypt(
      site.appPasswordEncrypted,
    );
    const auth = Buffer.from(`${site.username}:${appPassword}`).toString(
      'base64',
    );

    try {
      // Automatic Cropping to 1200x628
      this.logger.log('Cropping file to 1200x628...');
      const croppedBuffer = await sharp(fileBuffer)
        .resize({
          width: 1200,
          height: 628,
          fit: 'cover',
          position: 'center',
        })
        .toBuffer();

      const uploadResponse = await axios.post(
        `${site.url}/wp-json/wp/v2/media`,
        croppedBuffer,
        {
          headers: {
            Authorization: `Basic ${auth}`,
            'Content-Type': mimeType,
            'Content-Disposition': `attachment; filename="${filename}"`,
          },
        },
      );

      return uploadResponse.data.id;
    } catch (error: any) {
      this.logger.error('uploadMediaFromFile error', error.message);
      throw new BadRequestException(
        'Failed to process and upload image to WordPress',
      );
    }
  }

  async publishArticle(
    userId: string,
    dto: {
      title: string;
      content: string;
      status: string;
      categories?: number[];
      date?: string;
      sourceUrl?: string;
      originalContent?: string;
      feedItemId?: string;
      articleId?: string;
      featuredImageUrl?: string;
    },
  ) {
    // Get user's active site (single-site model)
    const site = await this.db.query.wpSite.findFirst({
      where: eq(wpSite.userId, userId),
    });

    if (!site) {
      throw new NotFoundException(
        'No WordPress site connected. Please connect a site first.',
      );
    }

    this.logger.log(
      `Publish request - User: ${userId}, ArticleId: ${dto.articleId}, Title: ${dto.title}`,
    );

    try {
      const appPassword = this.encryptionService.decrypt(
        site.appPasswordEncrypted,
      );
      const auth = Buffer.from(`${site.username}:${appPassword}`).toString(
        'base64',
      );

      // Handle featured image if provided as URL (from AI generation or external source)
      let featuredMediaId: number | undefined;
      if (
        dto.featuredImageUrl &&
        (dto.featuredImageUrl.startsWith('http') ||
          dto.featuredImageUrl.startsWith('data:'))
      ) {
        try {
          this.logger.log('Uploading featured image...');
          featuredMediaId = await this.uploadMediaFromUrl(
            site.id,
            dto.featuredImageUrl,
          );
          this.logger.log(`Featured image uploaded, ID: ${featuredMediaId}`);
        } catch (imgError) {
          this.logger.error(
            'Failed to upload featured image, continuing without it',
            imgError,
          );
        }
      }

      const postData: WpPostData = {
        title: dto.title,
        content: dto.content,
        status: (dto.status === 'future'
          ? 'future'
          : dto.status || 'draft') as WpPostData['status'],
      };

      if (featuredMediaId) {
        postData.featured_media = featuredMediaId;
      }

      // Add categories if provided
      if (dto.categories && dto.categories.length > 0) {
        postData.categories = dto.categories;
      }

      // For scheduled posts
      if (dto.status === 'future' && dto.date) {
        postData.date = dto.date;
        postData.status = 'future';
      }

      this.logger.log(`Publishing to: ${site.url}/wp-json/wp/v2/posts`);

      const response = await this.retryWpRequest(
        () =>
          axios.post(`${site.url}/wp-json/wp/v2/posts`, postData, {
            headers: { Authorization: `Basic ${auth}` },
            timeout: WP_REQUEST_TIMEOUT_MS,
          }),
        'publishArticle',
      );

      await this.markSiteHealth(site.id, true);
      this.logger.log(`Success! Post ID: ${response.data.id}`);

      let syncWarning: string | undefined;

      // Save to local database
      try {
        // Map WordPress status to our internal Article status
        let localStatus: ArticleStatus = 'DRAFT';
        if (dto.status === 'publish') localStatus = 'PUBLISHED';
        if (dto.status === 'future') localStatus = 'SCHEDULED';

        const articleUpdate: ArticleUpdateData = {
          title: dto.title,
          generatedContent: dto.content,
          status: localStatus,
          wpPostId: String(response.data.id),
          wpPostUrl: response.data.link,
          wpSiteId: site.id,
          metaTitle: dto.title,
          slug: response.data.slug,
          publishedAt: localStatus === 'PUBLISHED' ? new Date() : null,
          updatedAt: new Date(),
        };

        if (dto.featuredImageUrl) {
          articleUpdate.featuredImageUrl = dto.featuredImageUrl;
        }

        if (dto.articleId) {
          // Update existing article
          await this.articlesService.update(
            userId,
            dto.articleId,
            articleUpdate,
          );
        } else {
          // Create new article
          await this.articlesService.create(userId, {
            title: dto.title,
            originalContent: dto.originalContent || '',
            generatedContent: dto.content,
            sourceUrl: dto.sourceUrl || '',
            status: localStatus,
            wpPostId: String(response.data.id),
            wpPostUrl: response.data.link,
            wpSiteId: site.id,
            metaTitle: dto.title,
            slug: response.data.slug,
            feedItemId:
              dto.feedItemId && isUuid(dto.feedItemId)
                ? dto.feedItemId
                : undefined,
          });
        }
      } catch (dbError: any) {
        syncWarning = `WordPress post was created but local article sync failed: ${dbError.message}`;
        this.logger.error('Local DB update failed', dbError.message);
      }

      return {
        success: true,
        syncWarning,
        post: {
          id: response.data.id,
          title: response.data.title.rendered,
          status: response.data.status,
          link: response.data.link,
          date: response.data.date,
        },
      };
    } catch (error: any) {
      await this.markSiteHealth(site.id, false).catch((healthError: any) => {
        this.logger.error(
          'Failed to update WordPress site health',
          healthError.message,
        );
      });
      const message = this.getWpErrorMessage(error);
      this.logger.error('publishArticle error', message);
      throw new BadRequestException(message);
    }
  }

  async getRecentPosts(
    siteId: string,
    categoryId?: number,
  ): Promise<{ title: string; link: string }[]> {
    const site = await this.db.query.wpSite.findFirst({
      where: eq(wpSite.id, siteId),
    });

    if (!site) return [];

    try {
      const appPassword = this.encryptionService.decrypt(
        site.appPasswordEncrypted,
      );
      const auth = Buffer.from(`${site.username}:${appPassword}`).toString(
        'base64',
      );

      const fetchPosts = async (catId?: number) => {
        let url = `${site.url}/wp-json/wp/v2/posts?per_page=3&status=publish`;
        if (catId) {
          url += `&categories=${catId}`;
        }
        const response = await axios.get(url, {
          headers: { Authorization: `Basic ${auth}` },
          timeout: 5000,
        });
        return response.data.map((post: any) => ({
          title: post.title.rendered,
          link: post.link,
        }));
      };

      let posts = await fetchPosts(categoryId);

      // Fallback: if category has no posts, fetch generic posts
      if (posts.length === 0 && categoryId) {
        this.logger.log(
          `No posts in category ${categoryId}, falling back to recent posts`,
        );
        posts = await fetchPosts();
      }

      return posts;
    } catch (error: any) {
      this.logger.error('getRecentPosts error', error.message);
      return [];
    }
  }

  async syncScheduledArticles() {
    this.logger.log('Syncing scheduled articles...');

    try {
      // Find all articles with status SCHEDULED
      const scheduledArticles = await this.db
        .select()
        .from(article)
        .where(sql`${article.status} = 'SCHEDULED'`);

      if (scheduledArticles.length === 0) {
        return;
      }

      this.logger.log(
        `Found ${scheduledArticles.length} scheduled articles to check.`,
      );

      for (const art of scheduledArticles) {
        if (!art.wpSiteId || !art.wpPostId) continue;

        // Fetch wpSite separately
        const wpSiteData = await this.db
          .select()
          .from(wpSite)
          .where(eq(wpSite.id, art.wpSiteId))
          .limit(1);

        if (!wpSiteData || wpSiteData.length === 0) continue;

        const site = wpSiteData[0];

        try {
          const appPassword = this.encryptionService.decrypt(
            site.appPasswordEncrypted,
          );
          const auth = Buffer.from(`${site.username}:${appPassword}`).toString(
            'base64',
          );

          // Check post status on WordPress
          const response = await axios.get(
            `${site.url}/wp-json/wp/v2/posts/${art.wpPostId}`,
            {
              headers: { Authorization: `Basic ${auth}` },
              timeout: 5000,
            },
          );

          if (response.data.status === 'publish') {
            this.logger.log(
              `Article ${art.id} is now PUBLISHED on WordPress. Updating local status.`,
            );
            await this.articlesService.updateStatus(art.id, 'PUBLISHED', {
              wpPostId: String(response.data.id),
              wpPostUrl: response.data.link,
            });
          }
        } catch (err: any) {
          this.logger.error(
            `Failed to check status for article ${art.id}`,
            err.message,
          );
        }
      }
    } catch (error: any) {
      this.logger.error('Error in syncScheduledArticles', error.message);
    }
  }
}
