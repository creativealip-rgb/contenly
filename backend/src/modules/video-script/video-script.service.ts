import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { eq, desc } from 'drizzle-orm';
import { schema } from '../../db/schema';
import { DrizzleService } from '../../db/drizzle.service';
import { CreateScriptProjectDto, GenerateScriptDto, UpdateScriptSceneDto } from './video-script.dto';
import { OpenAiService } from '../ai/services/openai.service';
import { AdvancedScraperService } from '../scraper/advanced-scraper.service';
import { BillingService } from '../billing/billing.service';
import { BILLING_TIERS } from '../billing/billing.constants';

@Injectable()
export class VideoScriptService {
    constructor(
        private readonly drizzle: DrizzleService,
        private readonly openAiService: OpenAiService,
        private readonly scraperService: AdvancedScraperService,
        private readonly billingService: BillingService,
    ) { }

    async createProject(userId: string, dto: CreateScriptProjectDto) {
        let content = dto.sourceContent || '';

        // Auto-scrape if URL provided but no content
        if (!content && dto.sourceUrl) {
            try {
                const scrapedData = await this.scraperService.scrapeArticle(dto.sourceUrl);
                content = scrapedData.content;
            } catch (error) {
                console.error('Failed to scrape URL for script:', error);
                // We keep content empty if it fails, user can manually input later
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
        const project = await this.drizzle.db.query.scriptProject.findFirst({
            where: eq(schema.scriptProject.id, projectId),
            with: {
                scenes: {
                    orderBy: (scenes, { asc }) => [asc(scenes.sceneNumber)],
                },
            },
        });

        if (!project || project.userId !== userId) {
            throw new NotFoundException('Project not found');
        }

        return project;
    }

    async deleteProject(userId: string, projectId: string) {
        await this.getProject(userId, projectId); // Verify ownership
        await this.drizzle.db.delete(schema.scriptProject).where(eq(schema.scriptProject.id, projectId));
        return { success: true };
    }

    async generateScript(userId: string, projectId: string, dto: GenerateScriptDto) {
        const project = await this.getProject(userId, projectId);

        // Check token balance and daily limit
        const hasBalance = await this.billingService.checkBalance(userId, 1);
        if (!hasBalance) {
            throw new BadRequestException('Saldo kredit Anda tidak mencukupi untuk request ini.');
        }

        const withinDailyLimit = await this.billingService.checkDailyLimit(userId, 'VIDEO_GENERATION');
        if (!withinDailyLimit) {
            throw new BadRequestException('Daily limit reached for Video Script Generation on your current plan. Please upgrade or try again tomorrow.');
        }

        // Update Project status to generating
        await this.drizzle.db
            .update(schema.scriptProject)
            .set({ status: 'generating' })
            .where(eq(schema.scriptProject.id, projectId));

        try {
            const systemPrompt = this.buildSystemPrompt(dto.targetDurationSeconds);

            const tier = await this.billingService.getSubscriptionTier(userId);
            const model = BILLING_TIERS[tier]?.aiModel;

            const result = await this.openAiService.generateContent(
                dto.content,
                { mode: 'custom', systemPrompt, model }
            );

            if (!result || !result.scenes || !Array.isArray(result.scenes)) {
                console.error('Invalid script format received from AI:', result);
                throw new Error('Invalid script format received from AI');
            }

            // Clear old scenes
            await this.drizzle.db
                .delete(schema.scriptScene)
                .where(eq(schema.scriptScene.projectId, projectId));

            // Insert new scenes
            for (const scene of result.scenes) {
                await this.drizzle.db.insert(schema.scriptScene).values({
                    projectId,
                    sceneNumber: scene.scene_number,
                    visualContext: scene.visual_context || '',
                    voiceoverText: scene.voiceover_text || '',
                });
            }

            // Mark ready
            await this.drizzle.db
                .update(schema.scriptProject)
                .set({ status: 'ready', sourceContent: dto.content })
                .where(eq(schema.scriptProject.id, projectId));

            // Deduct tokens and increment usage
            await this.billingService.deductTokens(userId, 1, 'Video script generation');
            await this.billingService.incrementDailyUsage(userId, 'VIDEO_GENERATION');

            return this.getProject(userId, projectId);
        } catch (error) {
            console.error('Script generation error:', error);
            await this.drizzle.db
                .update(schema.scriptProject)
                .set({ status: 'error' })
                .where(eq(schema.scriptProject.id, projectId));
            throw error;
        }
    }

    async updateScene(userId: string, sceneId: string, dto: UpdateScriptSceneDto) {
        const [scene] = await this.drizzle.db
            .select()
            .from(schema.scriptScene)
            .where(eq(schema.scriptScene.id, sceneId));

        if (!scene) throw new NotFoundException('Scene not found');

        // Verify ownership
        await this.getProject(userId, scene.projectId);

        const [updatedScene] = await this.drizzle.db
            .update(schema.scriptScene)
            .set({
                visualContext: dto.visualContext !== undefined ? dto.visualContext : scene.visualContext,
                voiceoverText: dto.voiceoverText !== undefined ? dto.voiceoverText : scene.voiceoverText,
                updatedAt: new Date(),
            })
            .where(eq(schema.scriptScene.id, sceneId))
            .returning();

        return updatedScene;
    }

    private buildSystemPrompt(targetDuration?: number): string {
        const durationGuidance = targetDuration
            ? `The entire script should be paced for roughly ${targetDuration} seconds.`
            : `Keep the script concise, engaging, and suitable for a 30-60 second short-form video.`;

        return `You are an expert video scriptwriter and content director for viral TikTok, Instagram Reels, and YouTube Shorts.

TASK: Analyze the provided article/content and convert it into a highly engaging, fast-paced video script.

LANGUAGE: Indonesian (Bahasa Indonesia yang engaging, natural as a voiceover).
PACING: ${durationGuidance}

STRUCTURE RULES:
- Scene 1 MUST be a powerful, curiosity-inducing hook to stop the scroll.
- Subsequent scenes should deliver the core value/story clearly and fast.
- The final scene should include a natural Call to Action (CTA).

OUTPUT INSTRUCTIONS:
You must output a pure JSON object containing an array of "scenes". 
For each scene, provide:
- "scene_number": (Integer) Starting from 1
- "visual_context": (String) Instructions for the video editor. What B-roll, stock footage, or visual text should be on screen?
- "voiceover_text": (String) The exact words the narrator will speak.

OUTPUT FORMAT (JSON only, no markdown, no conversational text):
{
    "scenes": [
        {
            "scene_number": 1,
            "visual_context": "Fast zoom into a glowing AI brain, dark background with bold yellow text overlay: 'Rahasia AI Terbongkar'.",
            "voiceover_text": "Pernah bayangin kalau AI ternyata diam-diam menyimpan rahasia terbesar kita?"
        }
    ]
}`;
    }
}
