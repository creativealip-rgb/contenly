import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DrizzleService } from '../../db/drizzle.service';
import { schema } from '../../db/schema';

export interface CreateBrandKitDto {
  name: string;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  fontTitle?: string;
  fontBody?: string;
  logoUrl?: string;
  website?: string;
  description?: string;
  isDefault?: boolean;
}

export interface UpdateBrandKitDto extends Partial<CreateBrandKitDto> {}

@Injectable()
export class BrandKitService {
  constructor(private readonly drizzle: DrizzleService) {}

  async create(userId: string, dto: CreateBrandKitDto) {
    if (dto.isDefault) {
      await this.clearDefaultBrandKit(userId);
    }

    const [brandKit] = await this.drizzle.db
      .insert(schema.brandKit)
      .values({
        userId,
        name: dto.name,
        primaryColor: dto.primaryColor || '#000000',
        secondaryColor: dto.secondaryColor || '#ffffff',
        accentColor: dto.accentColor || '#ff0000',
        fontTitle: dto.fontTitle || 'Inter',
        fontBody: dto.fontBody || 'Inter',
        logoUrl: dto.logoUrl,
        website: dto.website,
        description: dto.description,
        isDefault: dto.isDefault || false,
      })
      .returning();

    return brandKit;
  }

  async findAll(userId: string) {
    return this.drizzle.db
      .select()
      .from(schema.brandKit)
      .where(eq(schema.brandKit.userId, userId))
      .orderBy(schema.brandKit.createdAt);
  }

  async findById(userId: string, id: string) {
    const [brandKit] = await this.drizzle.db
      .select()
      .from(schema.brandKit)
      .where(eq(schema.brandKit.id, id));

    if (!brandKit || brandKit.userId !== userId) {
      throw new NotFoundException('Brand kit not found');
    }

    return brandKit;
  }

  async getDefault(userId: string) {
    const [brandKit] = await this.drizzle.db
      .select()
      .from(schema.brandKit)
      .where(eq(schema.brandKit.userId, userId));

    return brandKit || null;
  }

  async update(userId: string, id: string, dto: UpdateBrandKitDto) {
    await this.findById(userId, id);

    if (dto.isDefault) {
      await this.clearDefaultBrandKit(userId);
    }

    const [brandKit] = await this.drizzle.db
      .update(schema.brandKit)
      .set({
        ...dto,
        updatedAt: new Date(),
      })
      .where(eq(schema.brandKit.id, id))
      .returning();

    return brandKit;
  }

  async delete(userId: string, id: string) {
    await this.findById(userId, id);

    await this.drizzle.db
      .delete(schema.brandKit)
      .where(eq(schema.brandKit.id, id));

    return { success: true };
  }

  async setDefault(userId: string, id: string) {
    await this.findById(userId, id);
    await this.clearDefaultBrandKit(userId);

    const [brandKit] = await this.drizzle.db
      .update(schema.brandKit)
      .set({ isDefault: true, updatedAt: new Date() })
      .where(eq(schema.brandKit.id, id))
      .returning();

    return brandKit;
  }

  async applyToCarousel(userId: string, brandKitId: string, projectId: string) {
    const brandKit = await this.findById(userId, brandKitId);

    const [project] = await this.drizzle.db
      .select()
      .from(schema.instagramProject)
      .where(eq(schema.instagramProject.id, projectId));

    if (!project || project.userId !== userId) {
      throw new NotFoundException('Project not found');
    }

    const [updated] = await this.drizzle.db
      .update(schema.instagramProject)
      .set({
        fontFamily: brandKit.fontTitle,
        globalStyle: `Brand: ${brandKit.name}`,
        updatedAt: new Date(),
      })
      .where(eq(schema.instagramProject.id, projectId))
      .returning();

    return updated;
  }

  private async clearDefaultBrandKit(userId: string) {
    await this.drizzle.db
      .update(schema.brandKit)
      .set({ isDefault: false })
      .where(eq(schema.brandKit.userId, userId));
  }
}
