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

            // Calculate total duration
            let totalDuration = 0;

            // Insert new scenes
            for (const scene of result.scenes) {
                const estimatedDuration = scene.estimated_duration || this.estimateSceneDuration(scene.voiceover_text || '');
                totalDuration += estimatedDuration;

                await this.drizzle.db.insert(schema.scriptScene).values({
                    projectId,
                    sceneNumber: scene.scene_number,
                    visualContext: scene.visual_context || '',
                    voiceoverText: scene.voiceover_text || '',
                    estimatedDuration,
                    emoji: scene.emoji || '',
                });
            }

            // Mark ready with additional metadata
            await this.drizzle.db
                .update(schema.scriptProject)
                .set({ 
                    status: 'ready', 
                    sourceContent: dto.content,
                    // Note: In a real implementation, you'd store hashtags and music suggestions
                    // This would require adding fields to the schema
                })
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

    private estimateSceneDuration(voiceoverText: string): number {
        const wordsPerSecond = 2.5; // Average speaking rate
        const wordCount = voiceoverText.split(/\s+/).length;
        return Math.ceil(wordCount / wordsPerSecond);
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

ENHANCED OUTPUT - You must output a pure JSON object containing:
1. "scenes" array with for each scene:
   - "scene_number": (Integer) Starting from 1
   - "visual_context": (String) Instructions for the video editor. What B-roll, stock footage, or visual text should be on screen?
   - "voiceover_text": (String) The exact words the narrator will speak.
   - "estimated_duration": (Integer) Estimated seconds for this scene (calculate based on word count / 2.5)
   - "emoji": (String) One relevant emoji that represents this scene's mood

2. "metadata" object with:
   - "music_suggestion": (String) 2-3 music/mood suggestions (e.g., "Upbeat Electronic", "Cinematic Ambient", "Trending TikTok Sound")
   - "hashtags": (Array) 5-10 relevant hashtags in Indonesian/English
   - "caption": (String) A ready-to-post caption (max 150 chars) with hooks
   - "thumbnail_suggestion": (String) Description for an eye-catching thumbnail

OUTPUT FORMAT (JSON only, no markdown, no conversational text):
{
    "scenes": [
        {
            "scene_number": 1,
            "visual_context": "Fast zoom into a glowing AI brain, dark background with bold yellow text overlay: 'Rahasia AI Terbongkar'.",
            "voiceover_text": "Pernah bayangin kalau AI ternyata diam-diam menyimpan rahasia terbesar kita?",
            "estimated_duration": 5,
            "emoji": "🧠"
        }
    ],
    "metadata": {
        "music_suggestion": "Upbeat Electronic, Cinematic Dark",
        "hashtags": ["#AI", "#Teknologi", "#Viral", "#Tranding", "#Fakta"],
        "caption": "🚨 Rahasia AI yang selama ini disembunyikan!",
        "thumbnail_suggestion": "Close-up mata dengan reflected AI neural network, high contrast"
    }
}`;
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
                    },
                    scenes: project.scenes.map(scene => ({
                        sceneNumber: scene.sceneNumber,
                        visualContext: scene.visualContext,
                        voiceoverText: scene.voiceoverText,
                        estimatedDuration: scene.estimatedDuration,
                        emoji: scene.emoji,
                    })),
                };

            case 'srt':
                return this.generateSrt(project.scenes);

            case 'txt':
                return this.generatePlainText(project);

            case 'caption':
                return this.generateCaption(project);

            default:
                throw new BadRequestException('Unsupported format. Use: json, srt, txt, or caption');
        }
    }

    private generateSrt(scenes: any[]): string {
        let srt = '';
        let counter = 1;

        for (const scene of scenes) {
            const startTime = this.secondsToSrtTime(this.getSceneStartTime(scenes, scene.sceneNumber));
            const endTime = this.secondsToSrtTime(this.getSceneStartTime(scenes, scene.sceneNumber) + (scene.estimatedDuration || 5));

            srt += `${counter}\n`;
            srt += `${startTime} --> ${endTime}\n`;
            srt += `${scene.voiceoverText}\n\n`;
            counter++;
        }

        return srt;
    }

    private getSceneStartTime(scenes: any[], sceneNumber: number): number {
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

        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')},${String(ms).padStart(3, '0')}`;
    }

    private generatePlainText(project: any): string {
        let text = `# ${project.title}\n\n`;

        for (const scene of project.scenes) {
            text += `=== Scene ${scene.sceneNumber} ${scene.emoji || ''} ===\n`;
            text += `Duration: ~${scene.estimatedDuration || 5} seconds\n\n`;
            text += `🎬 VISUAL:\n${scene.visualContext}\n\n`;
            text += `🎤 VOICEOVER:\n${scene.voiceoverText}\n\n`;
        }

        return text;
    }

    private generateCaption(project: any): string {
        const allVoiceover = project.scenes.map((s: any) => s.voiceoverText).join(' ');
        const hashtags = ['#viral', '#trending', '#fyp', '#contentcreator'];
        
        return JSON.stringify({
            caption: `${allVoiceover.slice(0, 200)}...`,
            hashtags,
            fullScript: allVoiceover,
        });
    }
}
