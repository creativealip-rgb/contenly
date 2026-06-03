import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DrizzleService } from '../../db/drizzle.service';
import { wpSite, categoryMapping } from '../../db/schema';
import { eq, and } from 'drizzle-orm';
import { CreateSiteDto } from './dto/create-site.dto';
import { UpdateSiteDto } from './dto/update-site.dto';
import { CreateMappingDto } from './dto/create-mapping.dto';

import { EncryptionService } from '../security/encryption.service';

@Injectable()
export class IntegrationsService {
  private readonly logger = new Logger(IntegrationsService.name);

  constructor(
    private readonly drizzle: DrizzleService,
    private readonly configService: ConfigService,
    private readonly encryptionService: EncryptionService,
  ) { }

  // Create WordPress site
  async createSite(userId: string, dto: CreateSiteDto) {
    const encryptedPassword = this.encryptionService.encrypt(dto.appPassword);

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
    return this.drizzle.db
      .select()
      .from(wpSite)
      .where(eq(wpSite.userId, userId))
      .orderBy(wpSite.createdAt);
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
    if (dto.appPassword) updates.appPasswordEncrypted = this.encryptionService.encrypt(dto.appPassword);
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
      decryptedPassword = this.encryptionService.decrypt(site.appPasswordEncrypted);
    } catch (decryptError: any) {
      this.logger.error(`Failed to decrypt password for site ${siteId}: ${decryptError.message}`);

      // Update status to error
      await this.drizzle.db
        .update(wpSite)
        .set({ status: 'ERROR', lastHealthCheck: new Date() })
        .where(eq(wpSite.id, siteId));

      throw new BadRequestException(`Password decryption failed: ${decryptError.message}. Please reconnect the site.`);
    }

    try {
      const credentials = Buffer.from(`${site.username}:${decryptedPassword}`).toString('base64');
      const response = await fetch(`${site.url}/wp-json/wp/v2/users/me`, {
        headers: {
          'Authorization': `Basic ${credentials}`,
        },
      });

      if (!response.ok) {
        this.logger.error(`WordPress API error: ${response.status} - ${response.statusText}`);
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Update status to CONNECTED
      await this.drizzle.db
        .update(wpSite)
        .set({ status: 'CONNECTED', lastHealthCheck: new Date() })
        .where(eq(wpSite.id, siteId));

      this.logger.log(`Connection test successful for site: ${site.name}`);
      return { success: true, message: 'Connection successful' };
    } catch (error: any) {
      this.logger.error(`Connection test failed for site ${siteId}: ${error.message}`);

      // Update status to ERROR
      await this.drizzle.db
        .update(wpSite)
        .set({ status: 'ERROR', lastHealthCheck: new Date() })
        .where(eq(wpSite.id, siteId));

      throw new BadRequestException(`Connection failed: ${error.message}`);
    }
  }

  // Refresh categories from WordPress
  async refreshCategories(siteId: string, userId: string) {
    const site = await this.getSite(siteId, userId);

    let decryptedPassword: string;
    try {
      decryptedPassword = this.encryptionService.decrypt(site.appPasswordEncrypted);
    } catch (decryptError: any) {
      throw new BadRequestException(`Password decryption failed: ${decryptError.message}. Please reconnect the site.`);
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

      const categories = (await response.json()) as any[];

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
    } catch (error: any) {
      throw new BadRequestException(`Failed to refresh categories: ${error.message}`);
    }
  }

  // Get category mappings for a site
  async getCategoryMappings(siteId: string, userId: string) {
    // Verify ownership
    await this.getSite(siteId, userId);

    return this.drizzle.db
      .select()
      .from(categoryMapping)
      .where(eq(categoryMapping.wpSiteId, siteId));
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
