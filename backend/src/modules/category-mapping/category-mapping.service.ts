import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { db, schema } from '../../db';
import { eq, and } from 'drizzle-orm';
import * as crypto from 'crypto';

const { categoryMapping, wpSite } = schema;

@Injectable()
export class CategoryMappingService {
  async getMappings(userId: string) {
    // Get user's active site (single-site model)
    const site = await db.query.wpSite.findFirst({
      where: eq(wpSite.userId, userId),
    });

    if (!site) {
      throw new NotFoundException('No WordPress site connected');
    }

    // Get all category mappings for this site
    const mappings = await db.query.categoryMapping.findMany({
      where: eq(categoryMapping.wpSiteId, site.id),
    });

    return mappings;
  }

  async saveMappings(
    userId: string,
    mappings: Array<{ source: string; targetId: string; targetName: string }>,
  ) {
    // Get user's active site
    const site = await db.query.wpSite.findFirst({
      where: eq(wpSite.userId, userId),
    });

    if (!site) {
      throw new NotFoundException('No WordPress site connected');
    }

    // Delete all existing mappings for this site
    await db
      .delete(categoryMapping)
      .where(eq(categoryMapping.wpSiteId, site.id));

    // Insert new mappings
    if (mappings.length > 0) {
      const mappingsToInsert = mappings.map((m) => ({
        id: crypto.randomUUID(),
        wpSiteId: site.id,
        sourceCategory: m.source,
        targetCategoryId: m.targetId,
        targetCategoryName: m.targetName,
      }));

      await db.insert(categoryMapping).values(mappingsToInsert);
    }

    return { message: 'Category mappings saved successfully' };
  }

  async deleteMapping(id: string) {
    await db.delete(categoryMapping).where(eq(categoryMapping.id, id));
    return { message: 'Category mapping deleted' };
  }

  // Get mapping for a specific source category
  async getMapping(wpSiteId: string, sourceCategory: string) {
    return db.query.categoryMapping.findFirst({
      where: and(
        eq(categoryMapping.wpSiteId, wpSiteId),
        eq(categoryMapping.sourceCategory, sourceCategory),
      ),
    });
  }
}
