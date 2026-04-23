import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { desc, eq } from 'drizzle-orm';
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

type GeneratedScene = {
  scene_number?: number;
  visual_context?: string;
  voiceover_text?: string;
  estimated_duration?: number;
  emoji?: string;
  footage_searches?: FootageSearch[];
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
  scenes: Array<ScriptSceneRecord & { footageSearches: FootageSearch[] }>;
};

@Injectable()
export class VideoScriptService {
  constructor(
    private readonly drizzle: DrizzleService,
    private readonly openAiService: OpenAiService,
    private readonly scraperService: AdvancedScraperService,
    private readonly billingService: BillingService,
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
        console.error('Failed to scrape URL for script:', error);
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
    return this.drizzle.db.query.scriptProject.findMany({
      where: eq(schema.scriptProject.userId, userId),
      orderBy: [desc(schema.scriptProject.createdAt)],
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

    const hasBalance = await this.billingService.checkBalance(userId, 1);
    if (!hasBalance) {
      throw new BadRequestException(
        'Saldo kredit Anda tidak mencukupi untuk request ini.',
      );
    }

    const withinDailyLimit = await this.billingService.checkDailyLimit(
      userId,
      'VIDEO_GENERATION',
    );
    if (!withinDailyLimit) {
      throw new BadRequestException(
        'Daily limit reached for Video Script Generation on your current plan. Please upgrade or try again tomorrow.',
      );
    }

    await this.drizzle.db
      .update(schema.scriptProject)
      .set({ status: 'generating', updatedAt: new Date() })
      .where(eq(schema.scriptProject.id, projectId));

    try {
      const systemPrompt = this.buildSystemPrompt(
        project.title,
        dto.targetDurationSeconds,
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

      await this.billingService.deductTokens(
        userId,
        1,
        'Video script generation',
      );
      await this.billingService.incrementDailyUsage(userId, 'VIDEO_GENERATION');

      return this.getProject(userId, projectId);
    } catch (error) {
      console.error('Script generation error:', error);
      await this.drizzle.db
        .update(schema.scriptProject)
        .set({ status: 'error', updatedAt: new Date() })
        .where(eq(schema.scriptProject.id, projectId));
      throw error;
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

    return {
      ...updatedScene,
      footageSearches: this.normalizeFootageSearches(
        updatedScene.footageSearches,
      ),
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
  ): string {
    const totalSeconds =
      targetDuration && targetDuration > 0 ? targetDuration : 45;
    const targetWords = Math.round(totalSeconds * (160 / 60));
    const maxWords = Math.round(targetWords * 1.15);

    return `You are an expert short-form video scriptwriter and content strategist for TikTok, Instagram Reels, and YouTube Shorts.

Project title: ${projectTitle}

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
      "footage_searches": [
        { "platform": "YouTube", "keyword": "keyword", "url": "https://..." }
      ]
    }
  ]
}

Rules:
- Language for headline, sub-headline, caption, hook, visuals, and voiceover: Indonesian.
- Thumbnail prompt must be in English, highly descriptive, and at least 35 words.
- Caption must be ready to post and include relevant hashtags.
- Hashtags array must contain 5-10 items.
- The combined voiceover across all scenes should target about ${targetWords} words, with an absolute maximum of ${maxWords} words.
- Scene 1 must hook hard in the first seconds.
- Final scene should close naturally with a CTA or takeaway.
- Split the script into concise scenes with fast pacing.
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

  async exportAudio(
    userId: string,
    projectId: string,
    voice: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer' = 'alloy',
  ) {
    const project = await this.getProject(userId, projectId);

    if (!project.scenes || project.scenes.length === 0) {
      throw new BadRequestException('No scenes to generate audio from');
    }

    const hasBalance = await this.billingService.checkBalance(userId, 1);
    if (!hasBalance) {
      throw new BadRequestException(
        'Saldo kredit Anda tidak mencukupi untuk request ini.',
      );
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
      await this.billingService.deductTokens(
        userId,
        1,
        'TTS Voiceover Generation',
      );

      return {
        buffer: mp3Buffer,
        filename: `${project.title
          .replace(/[^a-z0-9]/gi, '_')
          .toLowerCase()}-voiceover.mp3`,
      };
    } catch (error: unknown) {
      console.error('TTS generation error:', error);
      throw new BadRequestException(
        'Failed to generate audio: ' +
          (error instanceof Error ? error.message : 'Unknown error'),
      );
    }
  }
}
