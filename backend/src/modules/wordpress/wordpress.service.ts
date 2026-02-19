import { Injectable, NotFoundException, BadRequestException, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { eq, and } from 'drizzle-orm';
import { DrizzleService } from '../../db/drizzle.service';
import { wpSite, categoryMapping, article } from '../../db/schema';
import { ArticlesService } from '../articles/articles.service';
import axios from 'axios';
import * as crypto from 'crypto';
import sharp from 'sharp';
import { validate as uuidValidate } from 'uuid';
import { WpCategory, WpPostData, WpPostResponse, ArticleStatus, ArticleUpdateData } from '../../db/types';

@Injectable()
export class WordpressService implements OnModuleInit {
    private readonly logger = new Logger(WordpressService.name);
    private encryptionKey: string;

    constructor(
        private drizzle: DrizzleService,
        private configService: ConfigService,
        private articlesService: ArticlesService,
    ) {
        const key = this.configService.get<string>('ENCRYPTION_KEY');
        if (!key || key.length < 32) {
            throw new Error(
                'ENCRYPTION_KEY environment variable is not set or is too short (minimum 32 characters). ' +
                'Generate one with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"'
            );
        }
        this.encryptionKey = key;
    }

    async onModuleInit() {
        this.logger.log('Initializing scheduled article sync...');
        // Run sync every 30 minutes
        setInterval(() => {
            this.syncScheduledArticles().catch(err =>
                this.logger.error('Error in automated sync', err.message)
            );
        }, 30 * 60 * 1000);

        // Also run once on startup after a small delay
        setTimeout(() => this.syncScheduledArticles(), 10000);
    }

    get db() {
        return this.drizzle.db;
    }

    // Encryption helpers
    private encrypt(text: string): string {
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(this.encryptionKey.substring(0, 32)), iv);
        let encrypted = cipher.update(text);
        encrypted = Buffer.concat([encrypted, cipher.final()]);
        return iv.toString('hex') + ':' + encrypted.toString('hex');
    }

    private decrypt(text: string): string {
        const [ivHex, encryptedHex] = text.split(':');
        const iv = Buffer.from(ivHex, 'hex');
        const encrypted = Buffer.from(encryptedHex, 'hex');
        const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(this.encryptionKey.substring(0, 32)), iv);
        let decrypted = decipher.update(encrypted);
        decrypted = Buffer.concat([decrypted, decipher.final()]);
        return decrypted.toString();
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

    async connectSite(userId: string, data: { name: string; url: string; username: string; appPassword: string }) {
        // Test connection first
        const isValid = await this.testConnection(data.url, data.username, data.appPassword);
        if (!isValid) {
            throw new BadRequestException('Failed to connect to WordPress site. Please check credentials.');
        }

        // Encrypt the app password
        const encryptedPassword = this.encrypt(data.appPassword);

        // Create the site
        const [site] = await this.db
            .insert(wpSite)
            .values({
                userId,
                name: data.name,
                url: data.url.replace(/\/$/, ''), // Remove trailing slash
                username: data.username,
                appPasswordEncrypted: encryptedPassword,
                status: 'CONNECTED',
                lastHealthCheck: new Date(),
            })
            .returning();

        // Fetch and cache categories
        await this.syncCategories(site.id);

        return site;
    }

    async testConnection(url: string, username: string, appPassword: string): Promise<boolean> {
        try {
            const auth = Buffer.from(`${username}:${appPassword}`).toString('base64');
            const response = await axios.get(`${url}/wp-json/wp/v2/users/me`, {
                headers: { Authorization: `Basic ${auth}` },
                timeout: 10000,
            });
            return response.status === 200;
        } catch {
            return false;
        }
    }

    async verifySiteConnection(siteId: string): Promise<{ connected: boolean; message?: string }> {
        const site = await this.db.query.wpSite.findFirst({
            where: eq(wpSite.id, siteId),
        });

        if (!site) throw new NotFoundException('Site not found');

        try {
            const appPassword = this.decrypt(site.appPasswordEncrypted);
            const isConnected = await this.testConnection(site.url, site.username, appPassword);

            // Update last health check
            if (isConnected) {
                await this.db
                    .update(wpSite)
                    .set({ status: 'CONNECTED', lastHealthCheck: new Date() })
                    .where(eq(wpSite.id, siteId));
            } else {
                await this.db
                    .update(wpSite)
                    .set({ status: 'ERROR' })
                    .where(eq(wpSite.id, siteId));
            }

            return { connected: isConnected };
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            this.logger.error('verifySiteConnection error', message);
            return { connected: false, message };
        }
    }

    async syncCategories(siteId: string) {
        this.logger.log(`Starting category sync for site: ${siteId}`);
        const site = await this.db.query.wpSite.findFirst({
            where: eq(wpSite.id, siteId),
        });

        if (!site) {
            this.logger.warn('Site not found for category sync');
            throw new NotFoundException('Site not found');
        }

        this.logger.log(`Site found: ${site.name} (${site.url})`);

        try {
            const appPassword = this.decrypt(site.appPasswordEncrypted);
            const auth = Buffer.from(`${site.username}:${appPassword}`).toString('base64');

            this.logger.log('Fetching categories from WordPress API');
            const response = await axios.get(`${site.url}/wp-json/wp/v2/categories?per_page=100`, {
                headers: { Authorization: `Basic ${auth}` },
            });

            this.logger.log(`Received ${response.data.length} categories`);

            const categories: WpCategory[] = response.data.map((cat: { id: number; name: string; slug: string }) => ({
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
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            this.logger.error('syncCategories error', message);
            return [];
        }
    }

    async publishPost(siteId: string, data: {
        title: string;
        content: string;
        status?: 'draft' | 'publish' | 'private';
        categoryIds?: number[];
        featuredImageUrl?: string;
    }) {
        const site = await this.db.query.wpSite.findFirst({
            where: eq(wpSite.id, siteId),
        });

        if (!site) throw new NotFoundException('Site not found');

        const appPassword = this.decrypt(site.appPasswordEncrypted);
        const auth = Buffer.from(`${site.username}:${appPassword}`).toString('base64');

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
        const site = await this.db.query.wpSite.findFirst({ where: eq(wpSite.id, siteId) });
        if (!site) throw new NotFoundException('Site not found');

        const appPassword = this.decrypt(site.appPasswordEncrypted);
        const auth = Buffer.from(`${site.username}:${appPassword}`).toString('base64');

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
                const imageResponse = await axios.get(imageUrl, { responseType: 'arraybuffer' });
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
                    position: 'center'
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
                }
            );

            return uploadResponse.data.id;
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            this.logger.error('uploadMediaFromUrl error', message);
            throw new BadRequestException('Failed to process and upload image to WordPress');
        }
    }

    async uploadMediaFromFile(siteId: string, fileBuffer: Buffer, filename: string, mimeType: string): Promise<number> {
        const site = await this.db.query.wpSite.findFirst({ where: eq(wpSite.id, siteId) });
        if (!site) throw new NotFoundException('Site not found');

        const appPassword = this.decrypt(site.appPasswordEncrypted);
        const auth = Buffer.from(`${site.username}:${appPassword}`).toString('base64');

        try {
            // Automatic Cropping to 1200x628
            this.logger.log('Cropping file to 1200x628...');
            const croppedBuffer = await sharp(fileBuffer)
                .resize({
                    width: 1200,
                    height: 628,
                    fit: 'cover',
                    position: 'center'
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
                }
            );

            return uploadResponse.data.id;
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            this.logger.error('uploadMediaFromFile error', message);
            throw new BadRequestException('Failed to process and upload image to WordPress');
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
        }
    ) {
        // Get user's active site (single-site model)
        const site = await this.db.query.wpSite.findFirst({
            where: eq(wpSite.userId, userId),
        });

        if (!site) {
            throw new NotFoundException('No WordPress site connected. Please connect a site first.');
        }

        this.logger.log(`Publish request - User: ${userId}, ArticleId: ${dto.articleId}, Title: ${dto.title}`);

        try {
            const appPassword = this.decrypt(site.appPasswordEncrypted);
            const auth = Buffer.from(`${site.username}:${appPassword}`).toString('base64');

            // Handle featured image if provided as URL (from AI generation or external source)
            let featuredMediaId: number | undefined;
            if (dto.featuredImageUrl && (dto.featuredImageUrl.startsWith('http') || dto.featuredImageUrl.startsWith('data:'))) {
                try {
                    this.logger.log('Uploading featured image...');
                    featuredMediaId = await this.uploadMediaFromUrl(site.id, dto.featuredImageUrl);
                    this.logger.log(`Featured image uploaded, ID: ${featuredMediaId}`);
                } catch (imgError) {
                    this.logger.error('Failed to upload featured image, continuing without it', imgError);
                }
            }

            const postData: WpPostData = {
                title: dto.title,
                content: dto.content,
                status: (dto.status === 'future' ? 'future' : dto.status || 'draft') as WpPostData['status'],
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

            const response = await axios.post(
                `${site.url}/wp-json/wp/v2/posts`,
                postData,
                {
                    headers: { Authorization: `Basic ${auth}` },
                }
            );

            this.logger.log(`Success! Post ID: ${response.data.id}`);

            // Save to local database
            try {
                // Map WordPress status to our internal Article status
                let localStatus: ArticleStatus = 'DRAFT';
                if (dto.status === 'publish') localStatus = 'PUBLISHED';
                if (dto.status === 'future') localStatus = 'SCHEDULED';

                if (dto.articleId) {
                    // Update existing article
                    const updateData: ArticleUpdateData = {
                        title: dto.title,
                        generatedContent: dto.content,
                        status: localStatus,
                        wpPostId: String(response.data.id),
                        wpPostUrl: response.data.link,
                        wpSiteId: site.id,
                        metaTitle: dto.title,
                        slug: response.data.slug,
                        publishedAt: (localStatus === 'PUBLISHED' ? new Date() : null),
                        updatedAt: new Date(),
                    };

                    if (dto.featuredImageUrl) {
                        updateData.featuredImageUrl = dto.featuredImageUrl;
                    }

                    await this.articlesService.update(userId, dto.articleId, updateData);
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
                        feedItemId: (dto.feedItemId && uuidValidate(dto.feedItemId)) ? dto.feedItemId : undefined,
                    });
                }
            } catch (dbError: unknown) {
                const message = dbError instanceof Error ? dbError.message : 'Unknown error';
                this.logger.error('Local DB update failed', message);
            }

            return {
                success: true,
                post: {
                    id: response.data.id,
                    title: response.data.title.rendered,
                    status: response.data.status,
                    link: response.data.link,
                    date: response.data.date,
                },
            };
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            this.logger.error('publishArticle error', message);
            throw new BadRequestException(
                message || 'Failed to publish article to WordPress'
            );
        }
    }

    async getRecentPosts(siteId: string, categoryId?: number): Promise<{ title: string; link: string }[]> {
        const site = await this.db.query.wpSite.findFirst({
            where: eq(wpSite.id, siteId),
        });

        if (!site) return [];

        try {
            const appPassword = this.decrypt(site.appPasswordEncrypted);
            const auth = Buffer.from(`${site.username}:${appPassword}`).toString('base64');

            const fetchPosts = async (catId?: number) => {
                let url = `${site.url}/wp-json/wp/v2/posts?per_page=3&status=publish`;
                if (catId) {
                    url += `&categories=${catId}`;
                }
                const response = await axios.get(url, {
                    headers: { Authorization: `Basic ${auth}` },
                    timeout: 5000,
                });
                return response.data.map((post: { title: { rendered: string }; link: string }) => ({
                    title: post.title.rendered,
                    link: post.link,
                }));
            };

            let posts = await fetchPosts(categoryId);

            // Fallback: if category has no posts, fetch generic posts
            if (posts.length === 0 && categoryId) {
                this.logger.log(`No posts in category ${categoryId}, falling back to recent posts`);
                posts = await fetchPosts();
            }

            return posts;
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            this.logger.error('getRecentPosts error', message);
            return [];
        }
    }

    async syncScheduledArticles() {
        this.logger.log('Syncing scheduled articles...');

        try {
            // Find all articles with status SCHEDULED
            const scheduledArticles = await this.db.query.article.findMany({
                where: eq(article.status, 'SCHEDULED'),
                with: {
                    wpSite: true,
                }
            });

            if (scheduledArticles.length === 0) {
                return;
            }

            this.logger.log(`Found ${scheduledArticles.length} scheduled articles to check.`);

            for (const art of scheduledArticles) {
                if (!art.wpSite || !art.wpPostId) continue;

                try {
                    const appPassword = this.decrypt(art.wpSite.appPasswordEncrypted);
                    const auth = Buffer.from(`${art.wpSite.username}:${appPassword}`).toString('base64');

                    // Check post status on WordPress
                    const response = await axios.get(`${art.wpSite.url}/wp-json/wp/v2/posts/${art.wpPostId}`, {
                        headers: { Authorization: `Basic ${auth}` },
                        timeout: 5000,
                    });

                    if (response.data.status === 'publish') {
                        this.logger.log(`Article ${art.id} is now PUBLISHED on WordPress. Updating local status.`);
                        await this.articlesService.updateStatus(art.id, 'PUBLISHED', {
                            wpPostId: String(response.data.id),
                            wpPostUrl: response.data.link
                        });
                    }
                } catch (err: unknown) {
                    const errMsg = err instanceof Error ? err.message : 'Unknown error';
                    this.logger.error(`Failed to check status for article ${art.id}`, errMsg);
                }
            }
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            this.logger.error('Error in syncScheduledArticles', message);
        }
    }
}
