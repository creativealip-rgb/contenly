import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DrizzleService } from '../../db/drizzle.service';
import { wpSite, categoryMapping } from '../../db/schema';
import { eq, and } from 'drizzle-orm';
import { CreateSiteDto } from './dto/create-site.dto';
import { UpdateSiteDto } from './dto/update-site.dto';
import { CreateMappingDto } from './dto/create-mapping.dto';
import * as crypto from 'crypto';

@Injectable()
export class IntegrationsService {
    private readonly logger = new Logger(IntegrationsService.name);
    private encryptionKey: string | null = null;

    constructor(
        private readonly drizzle: DrizzleService,
        private readonly configService: ConfigService,
    ) {
        const key = this.configService.get<string>('ENCRYPTION_KEY');
        if (!key || key.length < 32) {
            this.logger.warn(
                'ENCRYPTION_KEY environment variable is not set or is too short (minimum 32 characters). ' +
                'WordPress integration will not work. Generate one with: ' +
                'node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"'
            );
        } else {
            this.encryptionKey = key;
        }
    }

    private getEncryptionKey(): string {
        if (!this.encryptionKey) {
            throw new Error(
                'ENCRYPTION_KEY is not configured. Please set the ENCRYPTION_KEY environment variable. '
            );
        }
        return this.encryptionKey;
    }

    // Encrypt app password before storing - MUST match wordpress.service.ts implementation
    private encryptPassword(password: string): string {
        const key = this.getEncryptionKey();
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(key.substring(0, 32)), iv);
        let encrypted = cipher.update(password);
        encrypted = Buffer.concat([encrypted, cipher.final()]);
        return iv.toString('hex') + ':' + encrypted.toString('hex');
    }

    // Decrypt app password when retrieving - MUST match wordpress.service.ts implementation
    private decryptPassword(encrypted: string): string {
        if (!encrypted || typeof encrypted !== 'string') {
            throw new Error('Encrypted password is empty or invalid');
        }

        const parts = encrypted.split(':');
        if (parts.length !== 2) {
            throw new Error(`Invalid encrypted password format. Expected: iv:encrypted, got ${parts.length} parts`);
        }

        const [ivHex, encryptedHex] = parts;
        
        if (!ivHex || !encryptedHex) {
            throw new Error('Invalid encrypted password: missing IV or encrypted data');
        }

        try {
            const iv = Buffer.from(ivHex, 'hex');
            const encryptedBuffer = Buffer.from(encryptedHex, 'hex');
            
            if (iv.length !== 16) {
                throw new Error(`Invalid IV length: expected 16 bytes, got ${iv.length}`);
            }

            const key = this.getEncryptionKey();
            const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(key.substring(0, 32)), iv);
            let decrypted = decipher.update(encryptedBuffer);
            decrypted = Buffer.concat([decrypted, decipher.final()]);
            return decrypted.toString();
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Decryption failed: ${error.message}`);
            }
            throw new Error('Decryption failed: unknown error');
        }
    }

    // Create WordPress site
    async createSite(userId: string, dto: CreateSiteDto) {
        const encryptedPassword = this.encryptPassword(dto.appPassword);

        const [site] = await this.drizzle.db
            .insert(wpSite)
            .values({
                userId,
                name: dto.name,
                url: dto.url.endsWith('/') ? dto.url.slice(0, -1) : dto.url,
                username: dto.username,
                appPasswordEncrypted: encryptedPassword,
                status: 'PENDING',
                lastHealthCheck: new Date(),
            })
            .returning();

        return site;
    }

    // Get all sites for a user
    async getUserSites(userId: string) {
        const sites = await this.drizzle.db
            .select()
            .from(wpSite)
            .where(eq(wpSite.userId, userId))
            .orderBy(wpSite.createdAt);

        return sites;
    }

    // Get single site with ownership verification
    async getSite(siteId: string, userId: string) {
        const [site] = await this.drizzle.db
            .select()
            .from(wpSite)
            .where(and(eq(wpSite.id, siteId), eq(wpSite.userId, userId)));

        if (!site) {
            throw new NotFoundException('Site not found');
        }

        return site;
    }

    // Update site
    async updateSite(siteId: string, userId: string, dto: UpdateSiteDto) {
        // Verify ownership
        await this.getSite(siteId, userId);

        const updates: any = {};
        if (dto.name) updates.name = dto.name;
        if (dto.url) updates.url = dto.url.endsWith('/') ? dto.url.slice(0, -1) : dto.url;
        if (dto.username) updates.username = dto.username;
        if (dto.appPassword) updates.appPasswordEncrypted = this.encryptPassword(dto.appPassword);
        updates.updatedAt = new Date();

        const [updatedSite] = await this.drizzle.db
            .update(wpSite)
            .set(updates)
            .where(eq(wpSite.id, siteId))
            .returning();

        return updatedSite;
    }

    // Delete site
    async deleteSite(siteId: string, userId: string) {
        // Verify ownership
        await this.getSite(siteId, userId);

        await this.drizzle.db.delete(wpSite).where(eq(wpSite.id, siteId));

        return { success: true, message: 'Site deleted successfully' };
    }

    // Test WordPress connection
    async testConnection(siteId: string, userId: string) {
        const site = await this.getSite(siteId, userId);
        
        this.logger.log(`Testing connection for site: ${site.name} (${site.url})`);
        
        let decryptedPassword: string;
        try {
            decryptedPassword = this.decryptPassword(site.appPasswordEncrypted);
        } catch (decryptError) {
            const msg = decryptError instanceof Error ? decryptError.message : 'Unknown decryption error';
            this.logger.error(`Failed to decrypt password for site ${siteId}: ${msg}`);
            
            // Update status to error
            await this.drizzle.db
                .update(wpSite)
                .set({ status: 'ERROR', lastHealthCheck: new Date() })
                .where(eq(wpSite.id, siteId));
            
            throw new BadRequestException(`Password decryption failed: ${msg}. Please reconnect the site.`);
        }

        try {
            const credentials = Buffer.from(`${site.username}:${decryptedPassword}`).toString('base64');
            const response = await fetch(`${site.url}/wp-json/wp/v2/users/me`, {
                headers: {
                    'Authorization': `Basic ${credentials}`,
                },
            });

            if (!response.ok) {
                const errorText = await response.text();
                this.logger.error(`WordPress API error: ${response.status} - ${errorText}`);
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            // Update status to CONNECTED
            await this.drizzle.db
                .update(wpSite)
                .set({ status: 'CONNECTED', lastHealthCheck: new Date() })
                .where(eq(wpSite.id, siteId));

            this.logger.log(`Connection test successful for site: ${site.name}`);
            return { success: true, message: 'Connection successful' };
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : 'Unknown error';
            this.logger.error(`Connection test failed for site ${siteId}: ${errorMsg}`);
            
            // Update status to ERROR
            await this.drizzle.db
                .update(wpSite)
                .set({ status: 'ERROR', lastHealthCheck: new Date() })
                .where(eq(wpSite.id, siteId));

            throw new BadRequestException(`Connection failed: ${errorMsg}`);
        }
    }

    // Refresh categories from WordPress
    async refreshCategories(siteId: string, userId: string) {
        const site = await this.getSite(siteId, userId);
        
        let decryptedPassword: string;
        try {
            decryptedPassword = this.decryptPassword(site.appPasswordEncrypted);
        } catch (decryptError) {
            const msg = decryptError instanceof Error ? decryptError.message : 'Unknown decryption error';
            throw new BadRequestException(`Password decryption failed: ${msg}. Please reconnect the site.`);
        }

        try {
            const credentials = Buffer.from(`${site.username}:${decryptedPassword}`).toString('base64');
            const response = await fetch(`${site.url}/wp-json/wp/v2/categories?per_page=100`, {
                headers: {
                    'Authorization': `Basic ${credentials}`,
                },
            });

            if (!response.ok) {
                throw new Error('Failed to fetch categories');
            }

            const categories = await response.json();

            // Delete existing mappings
            await this.drizzle.db.delete(categoryMapping).where(eq(categoryMapping.wpSiteId, siteId));

            // Create new mappings
            const mappings = await Promise.all(
                categories.map((cat: any) =>
                    this.drizzle.db
                        .insert(categoryMapping)
                        .values({
                            wpSiteId: siteId,
                            sourceCategory: cat.slug,
                            targetCategoryId: cat.id.toString(),
                            targetCategoryName: cat.name,
                        })
                        .returning()
                )
            );

            // Cache categories in site
            await this.drizzle.db
                .update(wpSite)
                .set({ categoriesCache: categories, lastHealthCheck: new Date() })
                .where(eq(wpSite.id, siteId));

            return { categories: mappings.map(m => m[0]), count: mappings.length };
        } catch (error) {
            throw new BadRequestException(`Failed to refresh categories: ${error.message}`);
        }
    }

    // Get category mappings for a site
    async getCategoryMappings(siteId: string, userId: string) {
        // Verify ownership
        await this.getSite(siteId, userId);

        const mappings = await this.drizzle.db
            .select()
            .from(categoryMapping)
            .where(eq(categoryMapping.wpSiteId, siteId));

        return mappings;
    }

    // Update category mapping
    async updateMapping(mappingId: string, dto: CreateMappingDto) {
        const [updated] = await this.drizzle.db
            .update(categoryMapping)
            .set({
                sourceCategory: dto.sourceCategory,
                targetCategoryId: dto.targetCategoryId,
                targetCategoryName: dto.targetCategoryName,
            })
            .where(eq(categoryMapping.id, mappingId))
            .returning();

        if (!updated) {
            throw new NotFoundException('Mapping not found');
        }

        return updated;
    }

    // Delete category mapping
    async deleteMapping(mappingId: string) {
        await this.drizzle.db.delete(categoryMapping).where(eq(categoryMapping.id, mappingId));
        return { success: true, message: 'Mapping deleted successfully' };
    }
}
