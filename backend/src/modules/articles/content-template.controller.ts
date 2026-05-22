import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { SessionAuthGuard } from '../../common/guards/session-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { DrizzleService } from '../../db/drizzle.service';
import { contentTemplate } from '../../db/schema';
import { eq, and, desc } from 'drizzle-orm';
import type { User } from '../../db/types';
import { IsString, IsOptional, IsObject, IsBoolean } from 'class-validator';

class CreateTemplateDto {
  @IsString() name: string;
  @IsOptional() @IsString() description?: string;
  @IsObject() config: Record<string, unknown>;
}

class UpdateTemplateDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsObject() config?: Record<string, unknown>;
  @IsOptional() @IsBoolean() isFavorite?: boolean;
}

@ApiTags('content-templates')
@ApiBearerAuth()
@UseGuards(SessionAuthGuard)
@Controller('content-templates')
export class ContentTemplateController {
  constructor(private drizzle: DrizzleService) {}

  private get db() { return this.drizzle.db; }

  @Get()
  async list(@CurrentUser() user: User) {
    return this.db
      .select()
      .from(contentTemplate)
      .where(eq(contentTemplate.userId, user.id))
      .orderBy(desc(contentTemplate.isFavorite), desc(contentTemplate.usageCount));
  }

  @Post()
  async create(@CurrentUser() user: User, @Body() dto: CreateTemplateDto) {
    const [row] = await this.db
      .insert(contentTemplate)
      .values({
        userId: user.id,
        name: dto.name.trim().slice(0, 100),
        description: dto.description?.slice(0, 500) || null,
        config: dto.config,
      })
      .returning();
    return row;
  }

  @Patch(':id')
  async update(@CurrentUser() user: User, @Param('id') id: string, @Body() dto: UpdateTemplateDto) {
    const [existing] = await this.db
      .select()
      .from(contentTemplate)
      .where(and(eq(contentTemplate.id, id), eq(contentTemplate.userId, user.id)));
    if (!existing) throw new Error('Template not found');
    const [row] = await this.db
      .update(contentTemplate)
      .set({
        name: dto.name?.trim() || existing.name,
        description: dto.description !== undefined ? (dto.description || null) : existing.description,
        config: dto.config ?? existing.config,
        isFavorite: dto.isFavorite ?? existing.isFavorite,
      })
      .where(eq(contentTemplate.id, id))
      .returning();
    return row;
  }

  @Post(':id/use')
  async incrementUsage(@CurrentUser() user: User, @Param('id') id: string) {
    const [existing] = await this.db
      .select()
      .from(contentTemplate)
      .where(and(eq(contentTemplate.id, id), eq(contentTemplate.userId, user.id)));
    if (!existing) throw new Error('Template not found');
    await this.db
      .update(contentTemplate)
      .set({ usageCount: (existing.usageCount || 0) + 1 })
      .where(eq(contentTemplate.id, id));
    return { success: true };
  }

  @Delete(':id')
  async remove(@CurrentUser() user: User, @Param('id') id: string) {
    await this.db
      .delete(contentTemplate)
      .where(and(eq(contentTemplate.id, id), eq(contentTemplate.userId, user.id)));
    return { success: true };
  }
}
