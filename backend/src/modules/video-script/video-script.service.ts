import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { asc, desc, eq, sql } from 'drizzle-orm';
import { schema } from '../../db/schema';
import { DrizzleService } from '../../db/drizzle.service';
import {
  CreateScriptProjectDto,
  GenerateScriptDto,
  UpdateScriptProjectDto,
  UpdateScriptSceneDto,
} from './video-script.dto';
import { OpenAiService } from '../ai/services/openai.service';
import { AdvancedScraperService } from '../scraper/advanced-scraper.service';
import { BillingService } from '../billing/billing.service';
import { BILLING_TIERS } from '../billing/billing.constants';
import { FootageService, FootageItem } from './footage.service';
import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

type EditableProjectField =
  | 'headline'
  | 'subHeadline'
  | 'caption'
  | 'thumbnailPrompt';

type FootageSearch = {
  platform: string;
  keyword: string;
  url: string;
};

type SelectedFootage = Partial<FootageItem> & {
  url?: string;
  type?: string;
};

type GeneratedScene = {
  scene_number?: number;
  visual_context?: string;
  voiceover_text?: string;
  estimated_duration?: number;
  emoji?: string;
  footage_searches?: FootageSearch[];
  broll_prompt?: string;
};

type GeneratedScript = {
  title?: string;
  headline?: string;
  sub_headline?: string;
  caption?: string;
  hook?: string;
  thumbnail_prompt?: string;
  music_suggestion?: string;
  hashtags?: string[];
  scenes?: GeneratedScene[];
};

type ScriptProjectRecord = typeof schema.scriptProject.$inferSelect;
type ScriptSceneRecord = typeof schema.scriptScene.$inferSelect;
type ScriptProjectWithScenes = ScriptProjectRecord & {
  scenes: ScriptSceneRecord[];
};
type ScriptProjectDetails = Omit<
  ScriptProjectWithScenes,
  'hashtags' | 'scenes'
> & {
  hashtags: string[];
  scenes: Array<ScriptSceneRecord & { footageSearches: FootageSearch[]; selectedFootage: SelectedFootage[] }>;
};

@Injectable()
export class VideoScriptService {
  private readonly logger = new Logger(VideoScriptService.name);

  constructor(
    private readonly drizzle: DrizzleService,
    private readonly openAiService: OpenAiService,
    private readonly scraperService: AdvancedScraperService,
    private readonly billingService: BillingService,
    private readonly footageService: FootageService,
  ) {}

  async createProject(userId: string, dto: CreateScriptProjectDto) {
    let content = dto.sourceContent || '';

    if (!content && dto.sourceUrl) {
      try {
        const scrapedData = await this.scraperService.scrapeArticle(
          dto.sourceUrl,
        );
        content = scrapedData.content;
      } catch (error) {
        this.logger.error('Failed to scrape URL for script:', error);
      }
    }

    const [project] = await this.drizzle.db
      .insert(schema.scriptProject)
      .values({
        userId,
        title: dto.title,
        sourceUrl: dto.sourceUrl,
        sourceContent: content,
      })
      .returning();

    return project;
  }

  async getProjects(userId: string) {
    const rows = await this.drizzle.db.query.scriptProject.findMany({
      where: eq(schema.scriptProject.userId, userId),
      orderBy: [desc(schema.scriptProject.createdAt)],
      with: {
        scenes: {
          columns: {
            id: true,
            sceneNumber: true,
            estimatedDuration: true,
            voiceoverText: true,
            selectedFootage: true,
          },
        },
      },
    });

    return rows.map((row) => {
      const scenes = row.scenes || [];
      const totalDuration = scenes.reduce((acc, s) => {
        if (s.estimatedDuration && s.estimatedDuration > 0) return acc + s.estimatedDuration;
        const words = (s.voiceoverText || '').trim().split(/\s+/).filter(Boolean).length;
        return acc + Math.max(1, Math.round((words / 160) * 60));
      }, 0);
      const scenesWithFootage = scenes.filter(
        (s) => Array.isArray(s.selectedFootage) && (s.selectedFootage as unknown[]).length > 0,
      ).length;
      const firstFootage = (() => {
        for (const s of scenes) {
          if (Array.isArray(s.selectedFootage) && s.selectedFootage.length > 0) {
            const item = (s.selectedFootage as Array<{ thumbnailUrl?: string }>)[0];
            if (item?.thumbnailUrl) return item.thumbnailUrl;
          }
        }
        return null;
      })();
      return {
        ...row,
        sceneCount: scenes.length,
        totalEstimatedDuration: totalDuration,
        scenesWithFootage,
        coverThumbnail: firstFootage,
        scenes: undefined, // strip scenes from list response
      };
    });
  }

  async getProject(userId: string, projectId: string) {
    const project = (await this.drizzle.db.query.scriptProject.findFirst({
      where: eq(schema.scriptProject.id, projectId),
      with: {
        scenes: true,
      },
    })) as ScriptProjectWithScenes | undefined;

    if (!project || project.userId !== userId) {
      throw new NotFoundException('Project not found');
    }

    const normalizedProject: ScriptProjectDetails = {
      ...project,
      hashtags: this.normalizeHashtags(project.hashtags),
      scenes: [...project.scenes]
        .sort((a, b) => a.sceneNumber - b.sceneNumber)
        .map((scene) => ({
          ...scene,
          footageSearches: this.normalizeFootageSearches(scene.footageSearches),
          selectedFootage: this.normalizeSelectedFootage(scene.selectedFootage),
        })),
    };

    return normalizedProject;
  }

  async deleteProject(userId: string, projectId: string) {
    await this.getProject(userId, projectId);
    await this.drizzle.db
      .delete(schema.scriptProject)
      .where(eq(schema.scriptProject.id, projectId));
    return { success: true };
  }

  async updateProject(
    userId: string,
    projectId: string,
    dto: UpdateScriptProjectDto,
  ) {
    const project = await this.getProject(userId, projectId);

    const [updatedProject] = await this.drizzle.db
      .update(schema.scriptProject)
      .set({
        title: dto.title ?? project.title,
        sourceContent: dto.sourceContent ?? project.sourceContent,
        headline: dto.headline ?? project.headline,
        subHeadline: dto.subHeadline ?? project.subHeadline,
        caption: dto.caption ?? project.caption,
        hook: dto.hook ?? project.hook,
        thumbnailPrompt: dto.thumbnailPrompt ?? project.thumbnailPrompt,
        musicSuggestion: dto.musicSuggestion ?? project.musicSuggestion,
        hashtags: dto.hashtags ?? project.hashtags,
        targetDurationSeconds:
          dto.targetDurationSeconds ?? project.targetDurationSeconds,
        updatedAt: new Date(),
      })
      .where(eq(schema.scriptProject.id, projectId))
      .returning();

    return {
      ...updatedProject,
      hashtags: this.normalizeHashtags(updatedProject.hashtags),
    };
  }

  async generateScript(
    userId: string,
    projectId: string,
    dto: GenerateScriptDto,
  ) {
    const project = await this.getProject(userId, projectId);

    const billing = await this.billingService.ensureBilling(userId, 'VIDEO_SCRIPT');
    if (!billing.allowed) {
      throw new BadRequestException(billing.reason || 'Billing limit reached');
    }

    await this.drizzle.db
      .update(schema.scriptProject)
      .set({ status: 'generating', updatedAt: new Date() })
      .where(eq(schema.scriptProject.id, projectId));

    try {
      const systemPrompt = this.buildSystemPrompt(
        project.title,
        dto.targetDurationSeconds,
        dto.style,
      );

      const tier = await this.billingService.getSubscriptionTier(userId);
      const model = this.getTierModel(tier);

      const aiResult = (await this.openAiService.generateContent(dto.content, {
        mode: 'custom',
        systemPrompt,
        model,
      })) as GeneratedScript;

      const result = this.normalizeGeneratedScript(
        aiResult,
        dto.content,
        project.title,
        dto.targetDurationSeconds,
      );

      await this.drizzle.db
        .delete(schema.scriptScene)
        .where(eq(schema.scriptScene.projectId, projectId));

      for (const scene of result.scenes) {
        await this.drizzle.db.insert(schema.scriptScene).values({
          projectId,
          sceneNumber: scene.sceneNumber,
          visualContext: scene.visualContext,
          voiceoverText: scene.voiceoverText,
          estimatedDuration: scene.estimatedDuration,
          emoji: scene.emoji,
          footageSearches: scene.footageSearches,
          brollPrompt: scene.brollPrompt || null,
        });
      }

      await this.drizzle.db
        .update(schema.scriptProject)
        .set({
          title: result.title || project.title,
          sourceContent: dto.content,
          headline: result.headline,
          subHeadline: result.subHeadline,
          caption: result.caption,
          hook: result.hook,
          thumbnailPrompt: result.thumbnailPrompt,
          musicSuggestion: result.musicSuggestion,
          hashtags: result.hashtags,
          targetDurationSeconds: dto.targetDurationSeconds ?? null,
          status: 'ready',
          updatedAt: new Date(),
        })
        .where(eq(schema.scriptProject.id, projectId));

      await this.billingService.recordUsage(userId, 'VIDEO_SCRIPT', billing);

      return this.getProject(userId, projectId);
    } catch (error: any) {
      this.logger.error('Script generation error:', error?.message || error);
      await this.drizzle.db
        .update(schema.scriptProject)
        .set({ status: 'error', updatedAt: new Date() })
        .where(eq(schema.scriptProject.id, projectId));
      throw new BadRequestException(
        error?.message || 'AI gagal generate script. Coba lagi atau gunakan konten yang lebih pendek.',
      );
    }
  }

  async regenerateProjectField(
    userId: string,
    projectId: string,
    field: EditableProjectField,
  ) {
    const project = await this.getProject(userId, projectId);
    if (!project.sourceContent?.trim()) {
      throw new BadRequestException('Project source content is empty');
    }

    const billing = await this.billingService.ensureBilling(userId, 'REGENERATE_FIELD');
    if (!billing.allowed) {
      throw new BadRequestException(billing.reason || 'Billing limit reached');
    }

    const fieldPrompt = this.buildFieldRegenerationPrompt(field, project);
    const tier = await this.billingService.getSubscriptionTier(userId);
    const model = this.getTierModel(tier);
    const result = (await this.openAiService.generateContent(
      project.sourceContent,
      {
        mode: 'custom',
        systemPrompt: fieldPrompt,
        model,
      },
    )) as Record<string, unknown>;

    const regeneratedValue = result[field];
    const nextValue =
      typeof regeneratedValue === 'string' ? regeneratedValue.trim() : '';
    if (!nextValue) {
      throw new BadRequestException('Failed to regenerate the requested field');
    }

    const updatePayload: Partial<typeof schema.scriptProject.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (field === 'headline') updatePayload.headline = nextValue;
    if (field === 'subHeadline') updatePayload.subHeadline = nextValue;
    if (field === 'caption') updatePayload.caption = nextValue;
    if (field === 'thumbnailPrompt') updatePayload.thumbnailPrompt = nextValue;

    const [updatedProject] = await this.drizzle.db
      .update(schema.scriptProject)
      .set(updatePayload)
      .where(eq(schema.scriptProject.id, projectId))
      .returning();

    await this.billingService.recordUsage(userId, 'REGENERATE_FIELD', billing);

    return {
      ...updatedProject,
      hashtags: this.normalizeHashtags(updatedProject.hashtags),
    };
  }

  async updateScene(
    userId: string,
    sceneId: string,
    dto: UpdateScriptSceneDto,
  ) {
    const [scene] = await this.drizzle.db
      .select()
      .from(schema.scriptScene)
      .where(eq(schema.scriptScene.id, sceneId));

    if (!scene) {
      throw new NotFoundException('Scene not found');
    }

    await this.getProject(userId, scene.projectId);

    const voiceoverText = dto.voiceoverText ?? scene.voiceoverText;
    const [updatedScene] = await this.drizzle.db
      .update(schema.scriptScene)
      .set({
        visualContext: dto.visualContext ?? scene.visualContext,
        voiceoverText,
        estimatedDuration:
          dto.estimatedDuration ?? this.estimateSceneDuration(voiceoverText),
        emoji: dto.emoji ?? scene.emoji,
        directorNotes: dto.directorNotes ?? scene.directorNotes,
        footageSearches:
          dto.footageSearches ??
          this.normalizeFootageSearches(scene.footageSearches),
        updatedAt: new Date(),
      })
      .where(eq(schema.scriptScene.id, sceneId))
      .returning();

    return {
      ...updatedScene,
      footageSearches: this.normalizeFootageSearches(
        updatedScene.footageSearches,
      ),
    };
  }

  async regenerateSceneVoiceover(userId: string, sceneId: string) {
    const [scene] = await this.drizzle.db
      .select()
      .from(schema.scriptScene)
      .where(eq(schema.scriptScene.id, sceneId));

    if (!scene) {
      throw new NotFoundException('Scene not found');
    }

    const project = await this.getProject(userId, scene.projectId);
    if (!project.sourceContent?.trim()) {
      throw new BadRequestException('Project source content is empty');
    }

    const billing = await this.billingService.ensureBilling(userId, 'REGENERATE_VOICEOVER');
    if (!billing.allowed) {
      throw new BadRequestException(billing.reason || 'Billing limit reached');
    }

    const tier = await this.billingService.getSubscriptionTier(userId);
    const model = this.getTierModel(tier);
    const prompt = `You are an expert short-form video scriptwriter.

Return valid JSON only:
{
  "voiceoverText": "..."
}

Rules:
- Write in natural Indonesian.
- Keep the pacing suitable for short-form video.
- Stay aligned with the project hook and storyline.
- This is only for scene ${scene.sceneNumber}.
- Keep it clearly different from the previous version.
- Match the visual direction of the scene.

Project headline: ${project.headline || ''}
Project hook: ${project.hook || ''}
Scene visual context: ${scene.visualContext}
Previous voiceover: ${scene.voiceoverText}

Source content:
${project.sourceContent}`;

    const result = (await this.openAiService.generateContent(
      project.sourceContent,
      {
        mode: 'custom',
        systemPrompt: prompt,
        model,
      },
    )) as Record<string, unknown>;

    const voiceoverResult = result.voiceoverText;
    const voiceoverText =
      typeof voiceoverResult === 'string' ? voiceoverResult.trim() : '';
    if (!voiceoverText) {
      throw new BadRequestException('Failed to regenerate scene voiceover');
    }

    const [updatedScene] = await this.drizzle.db
      .update(schema.scriptScene)
      .set({
        voiceoverText,
        estimatedDuration: this.estimateSceneDuration(voiceoverText),
        updatedAt: new Date(),
      })
      .where(eq(schema.scriptScene.id, sceneId))
      .returning();

    await this.billingService.recordUsage(userId, 'REGENERATE_VOICEOVER', billing);

    return {
      ...updatedScene,
      footageSearches: this.normalizeFootageSearches(
        updatedScene.footageSearches,
      ),
    };
  }

  async fetchSceneFootage(
    userId: string,
    sceneId: string,
    options: { query?: string; perSource?: number; orientation?: 'landscape' | 'portrait' | 'square' } = {},
  ) {
    const [scene] = await this.drizzle.db
      .select()
      .from(schema.scriptScene)
      .where(eq(schema.scriptScene.id, sceneId));

    if (!scene) {
      throw new NotFoundException('Scene not found');
    }

    // Auth check via project ownership
    await this.getProject(userId, scene.projectId);

    // Pick a sensible default query: explicit > brollPrompt > visualContext (truncated)
    const query =
      (options.query && options.query.trim()) ||
      (scene.brollPrompt && scene.brollPrompt.trim()) ||
      (scene.visualContext || '').trim().slice(0, 120);

    const result = await this.footageService.fetchFootage(query, {
      perSource: options.perSource,
      orientation: options.orientation,
    });

    return {
      sceneId,
      sceneNumber: scene.sceneNumber,
      ...result,
    };
  }

  async suggestFootageKeywords(
    userId: string,
    sceneId: string,
    count = 6,
  ): Promise<string[]> {
    const [scene] = await this.drizzle.db
      .select()
      .from(schema.scriptScene)
      .where(eq(schema.scriptScene.id, sceneId));
    if (!scene) throw new NotFoundException('Scene not found');
    const project = await this.getProject(userId, scene.projectId);

    const tier = await this.billingService.getSubscriptionTier(userId);
    const model = this.getTierModel(tier);
    const prompt = `You are a stock footage curator helping creators find b-roll for short-form video.

Return VALID JSON only with this shape:
{ "keywords": ["short keyword 1", "short keyword 2", ...] }

Rules:
- Provide ${Math.max(3, Math.min(12, count))} concise English keywords or 2-3 word phrases.
- Keywords should be searchable on Pexels / Unsplash (concrete nouns + adjectives, no full sentences).
- Avoid duplicates. Mix wide shots and close-ups when relevant.

Scene visual context: ${scene.visualContext}
Scene voiceover: ${scene.voiceoverText}
Project headline: ${project.headline || ''}
Project hook: ${project.hook || ''}`;

    const result = (await this.openAiService.generateContent(
      scene.visualContext || project.title,
      { mode: 'custom', systemPrompt: prompt, model },
    )) as { keywords?: unknown };

    const raw = Array.isArray(result.keywords) ? result.keywords : [];
    return raw
      .map((k) => (typeof k === 'string' ? k.trim() : ''))
      .filter((k) => k.length > 0)
      .slice(0, count);
  }

  async improveSceneVisual(
    userId: string,
    sceneId: string,
    hint?: string,
  ) {
    const [scene] = await this.drizzle.db
      .select()
      .from(schema.scriptScene)
      .where(eq(schema.scriptScene.id, sceneId));
    if (!scene) throw new NotFoundException('Scene not found');
    const project = await this.getProject(userId, scene.projectId);

    const billing = await this.billingService.ensureBilling(userId, 'IMPROVE_VISUAL');
    if (!billing.allowed) {
      throw new BadRequestException(billing.reason || 'Billing limit reached');
    }

    const tier = await this.billingService.getSubscriptionTier(userId);
    const model = this.getTierModel(tier);
    const prompt = `You are a video director writing a vivid visual direction for a short-form video scene.

Return VALID JSON only:
{ "visualContext": "...", "brollPrompt": "..." }

Rules:
- "visualContext" in Indonesian, 1-3 sentences, describes what is on screen, camera angle, mood, motion.
- "brollPrompt" in English, 25-45 words, photorealistic / cinematic, suitable for AI image/video generators.
- Stay coherent with the voiceover text and project hook.
- Make it visually different and richer than the previous version.
${hint ? `- Apply this user hint: ${hint}` : ''}

Scene voiceover: ${scene.voiceoverText}
Previous visual context: ${scene.visualContext}
Project hook: ${project.hook || ''}
Project headline: ${project.headline || ''}`;

    const result = (await this.openAiService.generateContent(
      scene.voiceoverText || project.title,
      { mode: 'custom', systemPrompt: prompt, model },
    )) as { visualContext?: unknown; brollPrompt?: unknown };

    const visualContext =
      typeof result.visualContext === 'string'
        ? result.visualContext.trim()
        : '';
    if (!visualContext) {
      throw new BadRequestException('Failed to improve scene visual');
    }
    const brollPrompt =
      typeof result.brollPrompt === 'string' ? result.brollPrompt.trim() : null;

    const [updatedScene] = await this.drizzle.db
      .update(schema.scriptScene)
      .set({
        visualContext,
        brollPrompt: brollPrompt || scene.brollPrompt,
        updatedAt: new Date(),
      })
      .where(eq(schema.scriptScene.id, sceneId))
      .returning();

    await this.billingService.recordUsage(userId, 'IMPROVE_VISUAL', billing);

    return {
      ...updatedScene,
      footageSearches: this.normalizeFootageSearches(
        updatedScene.footageSearches,
      ),
    };
  }

  async selectSceneFootage(
    userId: string,
    sceneId: string,
    items: Array<Partial<FootageItem> & { source?: string }>,
  ) {
    const [scene] = await this.drizzle.db
      .select()
      .from(schema.scriptScene)
      .where(eq(schema.scriptScene.id, sceneId));

    if (!scene) {
      throw new NotFoundException('Scene not found');
    }

    await this.getProject(userId, scene.projectId);

    const cleanItems = (Array.isArray(items) ? items : [])
      .filter((i) => i && typeof i === 'object' && i.thumbnailUrl)
      .slice(0, 20)
      .map((i) => ({
        source: i.source,
        id: i.id,
        thumbnailUrl: i.thumbnailUrl,
        previewUrl: i.previewUrl || i.thumbnailUrl,
        downloadUrl: i.downloadUrl,
        title: i.title || '',
        width: i.width,
        height: i.height,
        duration: i.duration,
        attribution: i.attribution || {},
      }));

    const [updatedScene] = await this.drizzle.db
      .update(schema.scriptScene)
      .set({
        selectedFootage: cleanItems,
        updatedAt: new Date(),
      })
      .where(eq(schema.scriptScene.id, sceneId))
      .returning();

    return {
      ...updatedScene,
      footageSearches: this.normalizeFootageSearches(
        updatedScene.footageSearches,
      ),
    };
  }

  async addScene(
    userId: string,
    projectId: string,
    options: { afterSceneNumber?: number } = {},
  ) {
    await this.getProject(userId, projectId);

    // Find the max scene number for this project
    const existing = await this.drizzle.db
      .select()
      .from(schema.scriptScene)
      .where(eq(schema.scriptScene.projectId, projectId));

    const maxNumber = existing.reduce(
      (max, s) => Math.max(max, s.sceneNumber),
      0,
    );

    let insertAt = maxNumber + 1;

    // If afterSceneNumber given, shift subsequent scenes by +1 and insert after
    if (typeof options.afterSceneNumber === 'number') {
      const afterNum = options.afterSceneNumber;
      // Shift scenes with number > afterNum
      await this.drizzle.db
        .update(schema.scriptScene)
        .set({
          sceneNumber: sql`${schema.scriptScene.sceneNumber} + 1`,
          updatedAt: new Date(),
        })
        .where(
          sql`${schema.scriptScene.projectId} = ${projectId} AND ${schema.scriptScene.sceneNumber} > ${afterNum}`,
        );
      insertAt = afterNum + 1;
    }

    const [scene] = await this.drizzle.db
      .insert(schema.scriptScene)
      .values({
        projectId,
        sceneNumber: insertAt,
        visualContext: 'New scene visual direction.',
        voiceoverText: 'New scene voiceover.',
        estimatedDuration: 5,
        emoji: '✨',
        footageSearches: [],
        selectedFootage: [],
      })
      .returning();

    return {
      ...scene,
      footageSearches: this.normalizeFootageSearches(scene.footageSearches),
    };
  }

  async duplicateScene(userId: string, sceneId: string) {
    const [scene] = await this.drizzle.db
      .select()
      .from(schema.scriptScene)
      .where(eq(schema.scriptScene.id, sceneId));

    if (!scene) {
      throw new NotFoundException('Scene not found');
    }
    await this.getProject(userId, scene.projectId);

    // Shift all scenes with number > original by +1
    await this.drizzle.db
      .update(schema.scriptScene)
      .set({
        sceneNumber: sql`${schema.scriptScene.sceneNumber} + 1`,
        updatedAt: new Date(),
      })
      .where(
        sql`${schema.scriptScene.projectId} = ${scene.projectId} AND ${schema.scriptScene.sceneNumber} > ${scene.sceneNumber}`,
      );

    const [duplicated] = await this.drizzle.db
      .insert(schema.scriptScene)
      .values({
        projectId: scene.projectId,
        sceneNumber: scene.sceneNumber + 1,
        visualContext: scene.visualContext,
        voiceoverText: scene.voiceoverText,
        estimatedDuration: scene.estimatedDuration,
        emoji: scene.emoji,
        footageSearches: scene.footageSearches,
        brollPrompt: scene.brollPrompt,
        selectedFootage: scene.selectedFootage,
      })
      .returning();

    return {
      ...duplicated,
      footageSearches: this.normalizeFootageSearches(
        duplicated.footageSearches,
      ),
    };
  }

  async deleteScene(userId: string, sceneId: string) {
    const [scene] = await this.drizzle.db
      .select()
      .from(schema.scriptScene)
      .where(eq(schema.scriptScene.id, sceneId));

    if (!scene) {
      throw new NotFoundException('Scene not found');
    }
    await this.getProject(userId, scene.projectId);

    await this.drizzle.db
      .delete(schema.scriptScene)
      .where(eq(schema.scriptScene.id, sceneId));

    // Renumber: shift down all scenes with number > deleted by -1
    await this.drizzle.db
      .update(schema.scriptScene)
      .set({
        sceneNumber: sql`${schema.scriptScene.sceneNumber} - 1`,
        updatedAt: new Date(),
      })
      .where(
        sql`${schema.scriptScene.projectId} = ${scene.projectId} AND ${schema.scriptScene.sceneNumber} > ${scene.sceneNumber}`,
      );

    return { success: true };
  }

  /**
   * Reorder scenes by full array of scene IDs in desired order.
   * Each ID will be assigned scene_number = index + 1.
   */
  async reorderScenes(
    userId: string,
    projectId: string,
    orderedSceneIds: string[],
  ) {
    await this.getProject(userId, projectId);

    if (!Array.isArray(orderedSceneIds) || orderedSceneIds.length === 0) {
      throw new BadRequestException('orderedSceneIds must be a non-empty array');
    }

    // Validate all IDs belong to the project
    const existing = await this.drizzle.db
      .select()
      .from(schema.scriptScene)
      .where(eq(schema.scriptScene.projectId, projectId));

    const existingIds = new Set(existing.map((s) => s.id));
    for (const id of orderedSceneIds) {
      if (!existingIds.has(id)) {
        throw new BadRequestException(`Scene ${id} not in project ${projectId}`);
      }
    }
    if (orderedSceneIds.length !== existing.length) {
      throw new BadRequestException(
        `orderedSceneIds length (${orderedSceneIds.length}) does not match scene count (${existing.length})`,
      );
    }

    // Two-pass to avoid unique-violation if any: temporarily set numbers to negative
    await this.drizzle.db.transaction(async (tx) => {
      for (let i = 0; i < orderedSceneIds.length; i++) {
        await tx
          .update(schema.scriptScene)
          .set({ sceneNumber: -(i + 1), updatedAt: new Date() })
          .where(eq(schema.scriptScene.id, orderedSceneIds[i]));
      }
      for (let i = 0; i < orderedSceneIds.length; i++) {
        await tx
          .update(schema.scriptScene)
          .set({ sceneNumber: i + 1, updatedAt: new Date() })
          .where(eq(schema.scriptScene.id, orderedSceneIds[i]));
      }
    });

    return this.getProject(userId, projectId);
  }

  async ttsPreviewScene(
    userId: string,
    sceneId: string,
    voice: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer' = 'alloy',
  ): Promise<{ buffer: Buffer; filename: string }> {
    const [scene] = await this.drizzle.db
      .select()
      .from(schema.scriptScene)
      .where(eq(schema.scriptScene.id, sceneId));

    if (!scene) {
      throw new NotFoundException('Scene not found');
    }
    await this.getProject(userId, scene.projectId);

    const text = (scene.voiceoverText || '').trim();
    if (!text) {
      throw new BadRequestException('Scene voiceover text is empty');
    }

    const billing = await this.billingService.ensureBilling(userId, 'TTS_PREVIEW');
    if (!billing.allowed) {
      throw new BadRequestException(billing.reason || 'Billing limit reached');
    }

    const buffer = await this.openAiService.generateSpeech(text, voice);
    await this.billingService.recordUsage(userId, 'TTS_PREVIEW', billing);
    return {
      buffer,
      filename: `scene-${scene.sceneNumber}-${voice}.mp3`,
    };
  }

  private estimateSceneDuration(voiceoverText: string): number {
    const trimmedText = voiceoverText.trim();
    if (!trimmedText) {
      return 0;
    }

    const wordsPerSecond = 2.5;
    const wordCount = trimmedText.split(/\s+/).length;
    return Math.max(1, Math.ceil(wordCount / wordsPerSecond));
  }

  private buildSystemPrompt(
    projectTitle: string,
    targetDuration?: number,
    style?: GenerateScriptDto['style'],
  ): string {
    const totalSeconds =
      targetDuration && targetDuration > 0 ? targetDuration : 45;
    const targetWords = Math.round(totalSeconds * (160 / 60));
    const maxWords = Math.round(targetWords * 1.15);

    const tone = style?.tone || 'casual';
    const hookStyle = style?.hookStyle || 'question';
    const language = style?.language || 'id';
    const audience = style?.audience || 'gen-z';
    const pacing = style?.pacing || 'standard';

    const toneDescriptor: Record<string, string> = {
      casual: 'casual, friendly, conversational, like talking to a close friend',
      professional: 'polished, authoritative, well-structured, confident expert voice',
      edgy: 'bold, provocative, punchy, controversial-but-tasteful, attention-grabbing',
      educational: 'clear, informative, teacherly, with concrete examples and structure',
      comedy: 'humorous, playful, witty punchlines, light sarcasm where appropriate',
    };

    const hookDescriptor: Record<string, string> = {
      question: 'open with a curiosity-driven question that the rest of the script answers',
      statistic: 'open with a surprising statistic, number, or data point',
      'bold-claim': 'open with a bold, contrarian, or counter-intuitive claim',
      story: 'open with the start of a personal or relatable mini-story / scenario',
    };

    const languageDescriptor: Record<string, string> = {
      id: 'Use Indonesian (Bahasa Indonesia, casual modern style) for headline, sub-headline, caption, hook, visual_context, and voiceover_text.',
      en: 'Use English for headline, sub-headline, caption, hook, visual_context, and voiceover_text.',
      mix: 'Use Indonesian as base language but naturally mix relevant English terms (Indo-glish style) for headline, caption, hook, and voiceover_text.',
    };

    const audienceDescriptor: Record<string, string> = {
      'gen-z': 'Gen Z (16-26): use contemporary slang sparingly, references they care about, fast pacing, meme-aware tone',
      millennial: 'Millennial (27-40): nostalgic references where appropriate, balanced pace, practical takeaways',
      professional: 'working professionals: business / career angle, concrete value, no slang',
      general: 'general audience across age groups: clear, accessible language',
    };

    const pacingDescriptor: Record<string, string> = {
      fast: 'Fast cuts: each scene 3-5 seconds, snappy voiceover lines, lots of scene changes.',
      standard: 'Standard pacing: each scene 6-10 seconds, balanced rhythm.',
      slow: 'Slower storytelling: each scene 10-15 seconds, longer narrative beats.',
    };

    return `You are an expert short-form video scriptwriter and content strategist for TikTok, Instagram Reels, and YouTube Shorts.

Project title: ${projectTitle}

Style requirements:
- Tone: ${toneDescriptor[tone]}
- Hook style: ${hookDescriptor[hookStyle]}
- Target audience: ${audienceDescriptor[audience]}
- Pacing: ${pacingDescriptor[pacing]}

Return VALID JSON only with this exact shape:
{
  "title": "short content title",
  "headline": "headline max 40 chars",
  "sub_headline": "sub-headline max 70 chars",
  "caption": "social caption with hashtags",
  "hook": "scroll-stopping opening line",
  "thumbnail_prompt": "detailed English thumbnail prompt",
  "music_suggestion": "2-3 music or mood directions",
  "hashtags": ["#tag1", "#tag2"],
  "scenes": [
    {
      "scene_number": 1,
      "visual_context": "what should appear on screen",
      "voiceover_text": "exact narration line",
      "estimated_duration": 5,
      "emoji": "🔥",
      "broll_prompt": "highly descriptive English prompt for AI image / b-roll generation, cinematic, photorealistic",
      "footage_searches": [
        { "platform": "YouTube", "keyword": "keyword", "url": "https://..." }
      ]
    }
  ]
}

Rules:
- ${languageDescriptor[language]}
- Thumbnail prompt must be in English, highly descriptive, and at least 35 words.
- Each scene's broll_prompt must be in English, vivid, photorealistic/cinematic, 25-45 words, suitable as input for AI image / video generation tools (Midjourney, DALL-E, Sora, etc.). Include subject, setting, lighting, mood, camera angle.
- Caption must be ready to post and include relevant hashtags.
- Hashtags array must contain 5-10 items.
- The combined voiceover across all scenes should target about ${targetWords} words, with an absolute maximum of ${maxWords} words.
- Scene 1 must hook hard in the first seconds following the hook style above.
- Final scene should close naturally with a CTA or takeaway.
- Split the script into concise scenes following the pacing guidance above.
- Each scene must include 3-5 footage search suggestions across mixed platforms such as YouTube, TikTok, Pexels, X, or Instagram.
- Each footage_searches item must contain platform, keyword, and url.
- Do not wrap the JSON in markdown.`;
  }

  private buildFieldRegenerationPrompt(
    field: EditableProjectField,
    project: ScriptProjectDetails,
  ): string {
    const fieldDescriptions: Record<EditableProjectField, string> = {
      headline: 'a bombastic headline with max 40 characters',
      subHeadline: 'a sub-headline with max 70 characters',
      caption: 'a ready-to-post social caption with hashtags',
      thumbnailPrompt:
        'a detailed English thumbnail prompt with cinematic visual detail',
    };

    return `You are an expert short-form content strategist.

Return valid JSON only:
{
  "${field}": "..."
}

Create ${fieldDescriptions[field]} based on this project. It must be different from the previous version.

Current project title: ${project.title}
Current headline: ${project.headline || ''}
Current sub-headline: ${project.subHeadline || ''}
Current hook: ${project.hook || ''}
Current caption: ${project.caption || ''}
Current thumbnail prompt: ${project.thumbnailPrompt || ''}

Source content:
${project.sourceContent}`;
  }

  private normalizeGeneratedScript(
    raw: GeneratedScript,
    sourceContent: string,
    fallbackTitle: string,
    targetDuration?: number,
  ) {
    const rawScenes = Array.isArray(raw?.scenes) ? raw.scenes : [];
    if (rawScenes.length === 0) {
      throw new BadRequestException('Invalid script format received from AI');
    }

    const scenes = rawScenes.map((scene, index) => {
      const voiceoverText = String(scene.voiceover_text || '').trim();
      const visualContext = String(scene.visual_context || '').trim();

      return {
        sceneNumber: scene.scene_number || index + 1,
        visualContext: visualContext || `Visual scene ${index + 1}`,
        voiceoverText,
        estimatedDuration:
          scene.estimated_duration || this.estimateSceneDuration(voiceoverText),
        emoji: String(scene.emoji || '')
          .trim()
          .slice(0, 10),
        footageSearches: this.normalizeFootageSearches(scene.footage_searches),
        brollPrompt: String(scene.broll_prompt || '').trim(),
      };
    });

    const fallbackCaption = `${sourceContent.slice(0, 140).trim()}...`;

    return {
      title: String(raw?.title || fallbackTitle || 'Video Script').trim(),
      headline: String(raw?.headline || fallbackTitle || '').trim(),
      subHeadline: String(raw?.sub_headline || '').trim(),
      caption: String(raw?.caption || fallbackCaption).trim(),
      hook: String(raw?.hook || scenes[0]?.voiceoverText || '').trim(),
      thumbnailPrompt: String(raw?.thumbnail_prompt || '').trim(),
      musicSuggestion: String(raw?.music_suggestion || '').trim(),
      hashtags: this.normalizeHashtags(raw?.hashtags),
      scenes,
      targetDurationSeconds: targetDuration || null,
    };
  }

  private normalizeHashtags(value: unknown): string[] {
    if (!Array.isArray(value)) {
      return [];
    }

    return value
      .map((item) => String(item || '').trim())
      .filter(Boolean)
      .map((tag) => (tag.startsWith('#') ? tag : `#${tag.replace(/\s+/g, '')}`))
      .slice(0, 10);
  }

  private normalizeFootageSearches(value: unknown): FootageSearch[] {
    if (!Array.isArray(value)) {
      return [];
    }

    return value
      .map((item) => {
        const platform = String((item as FootageSearch)?.platform || '').trim();
        const keyword = String((item as FootageSearch)?.keyword || '').trim();
        const requestedUrl = String((item as FootageSearch)?.url || '').trim();

        if (!platform || !keyword) {
          return null;
        }

        return {
          platform,
          keyword,
          url: requestedUrl || this.buildSearchUrl(platform, keyword),
        };
      })
      .filter((item): item is FootageSearch => Boolean(item))
      .slice(0, 5);
  }

  private buildSearchUrl(platform: string, keyword: string) {
    const encoded = encodeURIComponent(keyword);
    switch (platform.toLowerCase()) {
      case 'youtube':
        return `https://www.youtube.com/results?search_query=${encoded}`;
      case 'tiktok':
        return `https://www.tiktok.com/search?q=${encoded}`;
      case 'pexels':
        return `https://www.pexels.com/search/${encoded}/`;
      case 'instagram':
        return `https://www.instagram.com/explore/search/keyword/?q=${encoded}`;
      case 'x':
      case 'twitter':
        return `https://x.com/search?q=${encoded}&src=typed_query`;
      default:
        return `https://www.google.com/search?q=${encoded}`;
    }
  }

  private getTierModel(tier: string): string | undefined {
    // If OPENAI_MODEL env is set, it takes precedence over tier-based model.
    // This is needed for custom AI providers (e.g. cx/gpt-5.5) that don't
    // support OpenAI's gpt-3.5-turbo / gpt-4o models from tier defaults.
    const envModel = (process.env.OPENAI_MODEL || '').trim();
    if (envModel) {
      return envModel;
    }
    const tiers = BILLING_TIERS as Record<string, { aiModel?: string }>;
    return tiers[tier]?.aiModel;
  }

  async exportScript(userId: string, projectId: string, format: string) {
    const project = await this.getProject(userId, projectId);

    if (!project.scenes || project.scenes.length === 0) {
      throw new BadRequestException('No scenes to export');
    }

    switch (format) {
      case 'json':
        return {
          project: {
            id: project.id,
            title: project.title,
            headline: project.headline,
            subHeadline: project.subHeadline,
            caption: project.caption,
            hook: project.hook,
            thumbnailPrompt: project.thumbnailPrompt,
            musicSuggestion: project.musicSuggestion,
            hashtags: project.hashtags,
            targetDurationSeconds: project.targetDurationSeconds,
          },
          scenes: project.scenes.map((scene) => ({
            sceneNumber: scene.sceneNumber,
            visualContext: scene.visualContext,
            voiceoverText: scene.voiceoverText,
            estimatedDuration: scene.estimatedDuration,
            emoji: scene.emoji,
            footageSearches: this.normalizeFootageSearches(
              scene.footageSearches,
            ),
          })),
        };

      case 'srt':
        return this.generateSrt(project.scenes);

      case 'txt':
        return this.generatePlainText(project);

      case 'caption':
        return this.generateCaption(project);

      default:
        throw new BadRequestException(
          'Unsupported format. Use: json, srt, txt, or caption',
        );
    }
  }

  private generateSrt(
    scenes: Array<{
      sceneNumber: number;
      estimatedDuration: number | null;
      voiceoverText: string;
    }>,
  ) {
    let srt = '';
    let counter = 1;

    for (const scene of scenes) {
      const startTime = this.secondsToSrtTime(
        this.getSceneStartTime(scenes, scene.sceneNumber),
      );
      const endTime = this.secondsToSrtTime(
        this.getSceneStartTime(scenes, scene.sceneNumber) +
          (scene.estimatedDuration || 5),
      );

      srt += `${counter}\n`;
      srt += `${startTime} --> ${endTime}\n`;
      srt += `${scene.voiceoverText}\n\n`;
      counter++;
    }

    return srt;
  }

  private getSceneStartTime(
    scenes: Array<{ estimatedDuration: number | null }>,
    sceneNumber: number,
  ): number {
    let totalSeconds = 0;
    for (let i = 0; i < sceneNumber - 1; i++) {
      totalSeconds += scenes[i]?.estimatedDuration || 5;
    }
    return totalSeconds;
  }

  private secondsToSrtTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);

    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(
      2,
      '0',
    )}:${String(secs).padStart(2, '0')},${String(ms).padStart(3, '0')}`;
  }

  private generatePlainText(project: ScriptProjectDetails) {
    let text = `# ${project.title}\n\n`;
    if (project.headline) text += `Headline: ${project.headline}\n`;
    if (project.subHeadline) text += `Sub-headline: ${project.subHeadline}\n`;
    if (project.hook) text += `Hook: ${project.hook}\n`;
    if (project.caption) text += `Caption: ${project.caption}\n`;
    if (project.musicSuggestion) {
      text += `Music Suggestion: ${project.musicSuggestion}\n`;
    }
    if (project.hashtags.length > 0) {
      text += `Hashtags: ${project.hashtags.join(' ')}\n`;
    }
    if (project.thumbnailPrompt) {
      text += `Thumbnail Prompt: ${project.thumbnailPrompt}\n`;
    }
    text += '\n';

    for (const scene of project.scenes) {
      text += `=== Scene ${scene.sceneNumber} ${scene.emoji || ''} ===\n`;
      text += `Duration: ~${scene.estimatedDuration || 5} seconds\n\n`;
      text += `VISUAL:\n${scene.visualContext}\n\n`;
      if (scene.footageSearches.length > 0) {
        text += `FOOTAGE SEARCHES:\n`;
        scene.footageSearches.forEach((search) => {
          text += `- ${search.platform}: ${search.keyword} (${search.url})\n`;
        });
        text += '\n';
      }
      text += `VOICEOVER:\n${scene.voiceoverText}\n\n`;
    }

    return text;
  }

  private generateCaption(project: ScriptProjectDetails) {
    const fullScript = project.scenes
      .map((scene) => scene.voiceoverText)
      .join(' ');

    return {
      caption: project.caption || `${fullScript.slice(0, 200)}...`,
      hashtags: project.hashtags,
      headline: project.headline,
      subHeadline: project.subHeadline,
      fullScript,
    };
  }

  async exportVideo(
    userId: string,
    projectId: string,
    options: {
      voice?: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';
      width?: number;
      height?: number;
    } = {},
  ) {
    const project = await this.getProject(userId, projectId);

    if (!project.scenes || project.scenes.length === 0) {
      throw new BadRequestException('No scenes to render video from');
    }

    const title = project.headline || project.title;
    const safeBase = project.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const outputDir = path.join(os.tmpdir(), 'contenly-video-scripts');
    await fs.mkdir(outputDir, { recursive: true });

    const stamp = Date.now();
    const outputPath = path.join(outputDir, `${project.id}-${stamp}.mp4`);
    const videoPath = path.join(outputDir, `${project.id}-${stamp}-video.mp4`);
    const audioPath = path.join(outputDir, `${project.id}-${stamp}.mp3`);
    const subtitlePath = path.join(outputDir, `${project.id}-${stamp}.srt`);
    const concatPath = path.join(outputDir, `${project.id}-${stamp}-concat.txt`);

    const audio = await this.exportAudio(userId, projectId, options.voice || 'alloy');
    await fs.writeFile(audioPath, audio.buffer);

    const scenes = project.scenes
      .filter((scene) => (scene.voiceoverText || scene.visualContext || '').trim())
      .slice(0, 12);
    const totalDuration = scenes.reduce(
      (sum, scene) => sum + Math.max(3, scene.estimatedDuration || 5),
      0,
    );
    const srt = scenes
      .map((scene, index) => {
        const start = scenes
          .slice(0, index)
          .reduce((sum, s) => sum + Math.max(3, s.estimatedDuration || 5), 0);
        const end = start + Math.max(3, scene.estimatedDuration || 5);
        const text = (scene.voiceoverText || scene.visualContext || '')
          .replace(/\s+/g, ' ')
          .trim()
          .slice(0, 180);
        return `${index + 1}\n${this.secondsToSrtTime(start)} --> ${this.secondsToSrtTime(end)}\n${text}\n`;
      })
      .join('\n');
    await fs.writeFile(subtitlePath, srt, 'utf8');

    const width = options.width || 1080;
    const height = options.height || 1920;
    const safeTitle = this.escapeDrawText(title).slice(0, 80);
    const safeSub = this.escapeDrawText(project.subHeadline || project.hook || 'Generated by Contenly').slice(0, 100);
    const escapedSubtitle = subtitlePath.replace(/\\/g, '/').replace(/:/g, '\\:');
    const segmentPaths: string[] = [];
    const downloadedMedia: string[] = [];

    try {
      for (const [index, scene] of scenes.entries()) {
        const duration = Math.max(3, scene.estimatedDuration || 5);
        const segmentPath = path.join(outputDir, `${project.id}-${stamp}-scene-${index + 1}.mp4`);
        const mediaPath = await this.downloadSceneFootage(scene.selectedFootage, outputDir, `${project.id}-${stamp}-${index + 1}`);
        if (mediaPath) downloadedMedia.push(mediaPath);
        await this.renderVideoScriptSceneSegment({
          scene,
          mediaPath,
          segmentPath,
          width,
          height,
          duration,
          safeTitle: index === 0 ? safeTitle : '',
          safeSub: index === 0 ? safeSub : '',
        });
        segmentPaths.push(segmentPath);
      }

      await fs.writeFile(
        concatPath,
        segmentPaths.map((p) => `file '${p.replace(/'/g, "'\\''")}'`).join('\n'),
        'utf8',
      );

      await execFileAsync('ffmpeg', [
        '-y',
        '-f', 'concat',
        '-safe', '0',
        '-i', concatPath,
        '-c', 'copy',
        videoPath,
      ], { timeout: 900000 });

      const filter = [
        `subtitles='${escapedSubtitle}':force_style='FontName=Arial,FontSize=18,PrimaryColour=&H00FFFFFF,OutlineColour=&H80000000,BorderStyle=3,Outline=1,Alignment=2,MarginV=120'`,
        'format=yuv420p',
      ].join(',');

      await execFileAsync('ffmpeg', [
        '-y',
        '-i', videoPath,
        '-i', audioPath,
        '-vf', filter,
        '-c:v', 'libx264',
        '-preset', 'veryfast',
        '-crf', '24',
        '-c:a', 'aac',
        '-b:a', '128k',
        '-shortest',
        outputPath,
      ], { timeout: 900000 });
    } finally {
      await Promise.all([
        fs.unlink(audioPath).catch(() => undefined),
        fs.unlink(subtitlePath).catch(() => undefined),
        fs.unlink(concatPath).catch(() => undefined),
        fs.unlink(videoPath).catch(() => undefined),
        ...segmentPaths.map((p) => fs.unlink(p).catch(() => undefined)),
        ...downloadedMedia.map((p) => fs.unlink(p).catch(() => undefined)),
      ]);
    }

    return {
      buffer: await fs.readFile(outputPath),
      filename: `${safeBase}-video.mp4`,
      path: outputPath,
    };
  }

  async exportVideoToFile(
    userId: string,
    projectId: string,
    options: {
      voice?: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';
      width?: number;
      height?: number;
    } = {},
  ) {
    const result = await this.exportVideo(userId, projectId, options);
    const publicDir = path.resolve(process.cwd(), 'tmp', 'video-scripts');
    await fs.mkdir(publicDir, { recursive: true });
    const storedFilename = `${projectId}-${Date.now()}.mp4`;
    const storedPath = path.join(publicDir, storedFilename);
    await fs.writeFile(storedPath, result.buffer);
    return {
      filename: result.filename,
      storedFilename,
      path: storedPath,
      downloadUrl: `/api/v1/video-scripts/exports/${storedFilename}`,
      size: result.buffer.length,
    };
  }

  async getStoredVideoExport(filename: string) {
    if (!/^[a-f0-9-]+-\d+\.mp4$/i.test(filename)) {
      throw new NotFoundException('Export not found');
    }
    const filePath = path.resolve(process.cwd(), 'tmp', 'video-scripts', filename);
    try {
      const buffer = await fs.readFile(filePath);
      return { buffer, filename };
    } catch {
      throw new NotFoundException('Export not found');
    }
  }

  private normalizeSelectedFootage(value: unknown): SelectedFootage[] {
    if (!Array.isArray(value)) return [];
    return value
      .map((item) => (item && typeof item === 'object' ? (item as SelectedFootage) : null))
      .filter((item): item is SelectedFootage => Boolean(item))
      .slice(0, 5);
  }

  private async downloadSceneFootage(
    selectedFootage: SelectedFootage[] = [],
    outputDir: string,
    baseName: string,
  ): Promise<string | null> {
    const item = selectedFootage.find((f) => this.pickFootageUrl(f));
    if (!item) return null;

    const url = this.pickFootageUrl(item);
    if (!url) return null;

    try {
      const response = await fetch(url, {
        headers: { 'User-Agent': 'Contenly/1.0' },
        signal: AbortSignal.timeout(30000),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const contentType = response.headers.get('content-type') || '';
      const ext = this.mediaExtension(url, contentType, item);
      const mediaPath = path.join(outputDir, `${baseName}${ext}`);
      const buffer = Buffer.from(await response.arrayBuffer());
      if (buffer.length < 1024) throw new Error('Downloaded media too small');
      await fs.writeFile(mediaPath, buffer);
      return mediaPath;
    } catch (error) {
      this.logger.warn(`Video Script B-roll download skipped: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return null;
    }
  }

  private pickFootageUrl(item: SelectedFootage): string | null {
    return item.downloadUrl || item.previewUrl || item.url || item.thumbnailUrl || null;
  }

  private mediaExtension(url: string, contentType: string, item: SelectedFootage): string {
    const source = item.source || item.type || contentType || url;
    if (/video|pexels-video|\.mp4(\?|$)|\.mov(\?|$)|\.webm(\?|$)/i.test(source)) return '.mp4';
    if (/png|\.png(\?|$)/i.test(source)) return '.png';
    if (/webp|\.webp(\?|$)/i.test(source)) return '.webp';
    return '.jpg';
  }

  private isVideoMedia(mediaPath: string | null): boolean {
    return Boolean(mediaPath && /\.(mp4|mov|webm|m4v)$/i.test(mediaPath));
  }

  private async renderVideoScriptSceneSegment(options: {
    scene: ScriptSceneRecord & { selectedFootage: SelectedFootage[] };
    mediaPath: string | null;
    segmentPath: string;
    width: number;
    height: number;
    duration: number;
    safeTitle: string;
    safeSub: string;
  }) {
    const { scene, mediaPath, segmentPath, width, height, duration, safeTitle, safeSub } = options;
    const visualText = this.escapeDrawText(scene.visualContext || '').slice(0, 160);
    const textFilters = [
      safeTitle ? `drawtext=text='${safeTitle}':fontcolor=white:fontsize=64:x=(w-text_w)/2:y=220:box=1:boxcolor=black@0.35:boxborderw=24` : '',
      safeSub ? `drawtext=text='${safeSub}':fontcolor=white:fontsize=38:x=(w-text_w)/2:y=340:box=1:boxcolor=black@0.25:boxborderw=18` : '',
      visualText ? `drawtext=text='${visualText}':fontcolor=white:fontsize=34:x=(w-text_w)/2:y=h-360:box=1:boxcolor=black@0.25:boxborderw=18` : '',
    ].filter(Boolean);
    const filter = [
      `scale=${width}:${height}:force_original_aspect_ratio=increase`,
      `crop=${width}:${height}`,
      ...textFilters,
      'format=yuv420p',
    ].join(',');

    if (!mediaPath) {
      await execFileAsync('ffmpeg', [
        '-y',
        '-f', 'lavfi',
        '-i', `color=c=#111827:s=${width}x${height}:d=${duration}`,
        '-vf', filter,
        '-t', String(duration),
        '-r', '30',
        '-an',
        '-c:v', 'libx264',
        '-preset', 'veryfast',
        '-crf', '24',
        segmentPath,
      ], { timeout: 300000 });
      return;
    }

    const inputArgs = this.isVideoMedia(mediaPath)
      ? ['-stream_loop', '-1', '-t', String(duration), '-i', mediaPath]
      : ['-loop', '1', '-t', String(duration), '-i', mediaPath];

    await execFileAsync('ffmpeg', [
      '-y',
      ...inputArgs,
      '-vf', filter,
      '-t', String(duration),
      '-r', '30',
      '-an',
      '-c:v', 'libx264',
      '-preset', 'veryfast',
      '-crf', '24',
      segmentPath,
    ], { timeout: 300000 });
  }

  private escapeDrawText(value: string) {
    return value
      .replace(/\\/g, '\\\\')
      .replace(/'/g, "\\'")
      .replace(/:/g, '\\:')
      .replace(/%/g, '\\%')
      .replace(/\n/g, ' ');
  }

  async exportAudio(
    userId: string,
    projectId: string,
    voice: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer' = 'alloy',
  ) {
    const project = await this.getProject(userId, projectId);

    if (!project.scenes || project.scenes.length === 0) {
      throw new BadRequestException('No scenes to generate audio from');
    }

    const billing = await this.billingService.ensureBilling(userId, 'TTS_VOICEOVER');
    if (!billing.allowed) {
      throw new BadRequestException(billing.reason || 'Billing limit reached');
    }

    const fullScript = project.scenes
      .map((scene) => scene.voiceoverText)
      .filter((text) => text && text.trim().length > 0)
      .join('. ');

    if (!fullScript.trim()) {
      throw new BadRequestException('No voiceover text found in scenes');
    }

    try {
      const mp3Buffer = await this.openAiService.generateSpeech(
        fullScript,
        voice,
      );
      await this.billingService.recordUsage(userId, 'TTS_VOICEOVER', billing);

      return {
        buffer: mp3Buffer,
        filename: `${project.title
          .replace(/[^a-z0-9]/gi, '_')
          .toLowerCase()}-voiceover.mp3`,
      };
    } catch (error: unknown) {
      this.logger.error('TTS generation error:', error);
      throw new BadRequestException(
        'Failed to generate audio: ' +
          (error instanceof Error ? error.message : 'Unknown error'),
      );
    }
  }

  // ==========================================
  // WHISPER TRANSCRIPTION
  // ==========================================

  async transcribeAudio(
    userId: string,
    projectId: string,
    fileBuffer: Buffer,
    language?: string,
  ) {
    await this.getProject(userId, projectId);

    const billing = await this.billingService.ensureBilling(userId, 'AUDIO_TRANSCRIPTION');
    if (!billing.allowed) {
      throw new BadRequestException(billing.reason || 'Billing limit reached');
    }

    const result = await this.openAiService.transcribeAudio(fileBuffer, language);

    // Generate SRT from segments
    const srt = result.segments
      .map((seg, i) => {
        const start = this.secondsToSrtTime(seg.start);
        const end = this.secondsToSrtTime(seg.end);
        return `${i + 1}\n${start} --> ${end}\n${seg.text}\n`;
      })
      .join('\n');

    // Generate VTT
    const vtt =
      'WEBVTT\n\n' +
      result.segments
        .map((seg) => {
          const start = this.secondsToSrtTime(seg.start).replace(',', '.');
          const end = this.secondsToSrtTime(seg.end).replace(',', '.');
          return `${start} --> ${end}\n${seg.text}\n`;
        })
        .join('\n');

    await this.billingService.recordUsage(userId, 'AUDIO_TRANSCRIPTION', billing);

    return {
      text: result.text,
      segments: result.segments,
      srt,
      vtt,
    };
  }

  // ==========================================
  // THUMBNAIL GENERATOR
  // ==========================================

  async generateThumbnail(
    userId: string,
    projectId: string,
    style?: string,
  ) {
    const project = await this.getProject(userId, projectId);

    const billing = await this.billingService.ensureBilling(userId, 'THUMBNAIL_GENERATION');
    if (!billing.allowed) {
      throw new BadRequestException(billing.reason || 'Billing limit reached');
    }

    const title = project.headline || project.title;
    const imageUrl = await this.openAiService.generateThumbnail(
      title,
      style || 'cinematic',
    );

    await this.billingService.recordUsage(userId, 'THUMBNAIL_GENERATION', billing);

    // Persist generated thumbnail URL to project
    await this.drizzle.db
      .update(schema.scriptProject)
      .set({ thumbnailUrl: imageUrl, updatedAt: new Date() })
      .where(eq(schema.scriptProject.id, projectId));

    return { imageUrl, title, style: style || 'cinematic' };
  }

  // ==========================================
  // B-ROLL AUTO-FILL (batch footage for all scenes)
  // ==========================================

  async brollAutoFill(
    userId: string,
    projectId: string,
    options: { perSource?: number; orientation?: 'landscape' | 'portrait' | 'square' } = {},
  ) {
    const project = await this.getProject(userId, projectId);

    if (!project.scenes || project.scenes.length === 0) {
      throw new BadRequestException('No scenes to search footage for');
    }

    const perSource = options.perSource || 4;
    const results: Array<{
      sceneId: string;
      sceneNumber: number;
      query: string;
      footage: { pexelsPhotos: any[]; pexelsVideos: any[]; googleImages: any[] };
    }> = [];

    // Process scenes in parallel (max 3 concurrent)
    const batchSize = 3;
    for (let i = 0; i < project.scenes.length; i += batchSize) {
      const batch = project.scenes.slice(i, i + batchSize);
      const batchResults = await Promise.allSettled(
        batch.map(async (scene) => {
          const query =
            (scene.brollPrompt || '').trim() ||
            (scene.visualContext || '').trim().slice(0, 80);

          if (!query) return null;

          const footage = await this.footageService.fetchFootage(query, {
            perSource,
            orientation: options.orientation,
          });

          return {
            sceneId: scene.id,
            sceneNumber: scene.sceneNumber,
            query,
            footage: {
              pexelsPhotos: footage.pexelsPhotos,
              pexelsVideos: footage.pexelsVideos,
              googleImages: footage.googleImages,
            },
          };
        }),
      );

      for (const r of batchResults) {
        if (r.status === 'fulfilled' && r.value) {
          results.push(r.value);
        }
      }
    }

    return { projectId, totalScenes: project.scenes.length, results };
  }

  // ==========================================
  // PROJECT ZIP EXPORT
  // ==========================================

  async exportProjectZip(
    userId: string,
    projectId: string,
  ) {
    const project = await this.getProject(userId, projectId);

    // Build text export
    const scriptTxt = this.generatePlainText(project);

    // Build SRT
    const srt = this.generateSrt(project.scenes);

    // Build caption
    const caption = this.generateCaption(project);

    // Build JSON export
    const jsonExport = {
      project: {
        id: project.id,
        title: project.title,
        headline: project.headline,
        subHeadline: project.subHeadline,
        caption: project.caption,
        hook: project.hook,
        thumbnailPrompt: project.thumbnailPrompt,
        musicSuggestion: project.musicSuggestion,
        hashtags: project.hashtags,
        targetDurationSeconds: project.targetDurationSeconds,
      },
      scenes: project.scenes.map((scene) => ({
        sceneNumber: scene.sceneNumber,
        visualContext: scene.visualContext,
        voiceoverText: scene.voiceoverText,
        estimatedDuration: scene.estimatedDuration,
        emoji: scene.emoji,
        footageSearches: this.normalizeFootageSearches(scene.footageSearches),
      })),
    };

    return {
      files: [
        { name: 'script.txt', content: scriptTxt },
        { name: 'subtitles.srt', content: srt },
        { name: 'caption.txt', content: `${caption.caption}\n\n${caption.hashtags.join(' ')}` },
        { name: 'project.json', content: JSON.stringify(jsonExport, null, 2) },
      ],
      projectTitle: project.title,
    };
  }
}
