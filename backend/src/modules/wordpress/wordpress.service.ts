import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { eq, and } from 'drizzle-orm';
import { DrizzleService } from '../../db/drizzle.service';
import { wpSite, categoryMapping } from '../../db/schema';
import { ArticlesService } from '../articles/articles.service';
import axios from 'axios';
import * as crypto from 'crypto';

@Injectable()
export class WordpressService {
    private encryptionKey: string;

    constructor(
        private drizzle: DrizzleService,
        private configService: ConfigService,
        private articlesService: ArticlesService,
    ) {
        this.encryptionKey = this.configService.get('ENCRYPTION_KEY') || 'default-encryption-key-32bytes!';
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
        } catch (error: any) {
            console.error('[verifySiteConnection] Error:', error);
            return { connected: false, message: error.message };
        }
    }

    async syncCategories(siteId: string) {
        console.log('[syncCategories] Starting sync for site:', siteId);
        const site = await this.db.query.wpSite.findFirst({
            where: eq(wpSite.id, siteId),
        });

        if (!site) {
            console.log('[syncCategories] Site not found');
            throw new NotFoundException('Site not found');
        }

        console.log('[syncCategories] Site found:', { name: site.name, url: site.url });

        try {
            const appPassword = this.decrypt(site.appPasswordEncrypted);
            console.log('[syncCategories] Password decrypted successfully');
            const auth = Buffer.from(`${site.username}:${appPassword}`).toString('base64');

            console.log('[syncCategories] Calling WordPress API:', `${site.url}/wp-json/wp/v2/categories`);
            const response = await axios.get(`${site.url}/wp-json/wp/v2/categories?per_page=100`, {
                headers: { Authorization: `Basic ${auth}` },
            });

            console.log('[syncCategories] API response received:', response.data.length, 'categories');

            const categories = response.data.map((cat: any) => ({
                id: cat.id,
                name: cat.name,
                slug: cat.slug,
            }));

            await this.db
                .update(wpSite)
                .set({ categoriesCache: categories })
                .where(eq(wpSite.id, siteId));

            console.log('[syncCategories] Categories cached successfully');
            return categories;
        } catch (error: any) {
            console.error('[syncCategories] Error:', error.message);
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
        }
    ) {
        // Get user's active site (single-site model)
        const site = await this.db.query.wpSite.findFirst({
            where: eq(wpSite.userId, userId),
        });

        if (!site) {
            throw new NotFoundException('No WordPress site connected. Please connect a site first.');
        }

        try {
            const appPassword = this.decrypt(site.appPasswordEncrypted);
            const auth = Buffer.from(`${site.username}:${appPassword}`).toString('base64');

            const postData: any = {
                title: dto.title,
                content: dto.content,
                status: dto.status || 'draft',
            };

            // Add categories if provided
            if (dto.categories && dto.categories.length > 0) {
                postData.categories = dto.categories;
            }

            // For scheduled posts
            if (dto.status === 'future' && dto.date) {
                postData.date = dto.date;
                postData.status = 'future';
            }

            console.log('[publishArticle] Publishing to:', `${site.url}/wp-json/wp/v2/posts`);

            const response = await axios.post(
                `${site.url}/wp-json/wp/v2/posts`,
                postData,
                {
                    headers: { Authorization: `Basic ${auth}` },
                }
            );

            console.log('[publishArticle] Success! Post ID:', response.data.id);

            // Save to local database
            try {
                const articleData = {
                    title: dto.title,
                    generatedContent: dto.content,
                    originalContent: dto.originalContent || '',
                    sourceUrl: dto.sourceUrl || '',
                    status: (dto.status === 'publish' ? 'PUBLISHED' : dto.status === 'future' ? 'PUBLISHED' : 'DRAFT') as any,
                    wpPostId: String(response.data.id),
                    wpPostUrl: response.data.link,
                    wpSiteId: site.id,
                    feedItemId: dto.feedItemId,
                    metaTitle: dto.title, // Default to title
                    slug: response.data.slug,
                };

                if (dto.articleId) {
                    // Update existing draft
                    await this.articlesService.update(userId, dto.articleId, articleData);
                    console.log('[publishArticle] Updated existing article:', dto.articleId);
                } else {
                    // Create new article
                    await this.articlesService.create(userId, articleData);
                    console.log('[publishArticle] Created new article');
                }
            } catch (dbError) {
                console.error('[publishArticle] Failed to save/update local DB:', dbError);
                // Don't fail the request if WP publish succeeded, but log it
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
        } catch (error: any) {
            console.error('[publishArticle] Error:', error.response?.data || error.message);
            throw new BadRequestException(
                error.response?.data?.message || 'Failed to publish article to WordPress'
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
                    timeout: 5000
                });
                return response.data.map((post: any) => ({
                    title: post.title.rendered,
                    link: post.link,
                }));
            };

            let posts = await fetchPosts(categoryId);

            // Fallback: if category has no posts, fetch generic posts
            if (posts.length === 0 && categoryId) {
                console.log(`[WordpressService] No posts in category ${categoryId}, falling back to recent posts`);
                posts = await fetchPosts();
            }

            return posts;
        } catch (error: any) {
            console.error('[getRecentPosts] Error:', error.message);
            return [];
        }
    }
}
