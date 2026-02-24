import {
    Injectable,
    NotFoundException,
    BadRequestException,
    Logger,
} from '@nestjs/common';
import { eq, and, desc } from 'drizzle-orm';
import { DrizzleService } from '../../db/drizzle.service';
import { instagramProject, instagramSlide, stylePreset } from '../../db/schema';
import { BillingService } from '../billing/billing.service';
import { StoryboardService } from './services/storyboard.service';
import { OpenAiService } from '../ai/services/openai.service';
import { FontService } from './services/font.service';
import { ExportService } from './services/export.service';
import { ScraperService } from '../scraper/scraper.service';
import { ImageTextService } from './services/image-text.service';
import {
    CreateProjectDto,
    UpdateProjectDto,
    UpdateSlideDto,
    GenerateStoryboardDto,
    InstagramGenerateImageDto,
    ExportCarouselDto,
    CreateSlideDto,
    ReorderSlidesDto,
} from './dto';

@Injectable()
export class InstagramStudioService {
    private readonly logger = new Logger(InstagramStudioService.name);

    constructor(
        private drizzle: DrizzleService,
        private billingService: BillingService,
        private storyboardService: StoryboardService,
        private openAiService: OpenAiService,
        private fontService: FontService,
        private exportService: ExportService,
        private scraperService: ScraperService,
        private imageTextService: ImageTextService,
    ) { }

    async fetchUrlContent(url: string) {
        if (!url) {
            throw new BadRequestException('URL is required');
        }
        try {
            const scraped = await this.scraperService.scrapeUrl({
                url,
                extractImages: false,
                extractMetadata: false,
            });
            return {
                title: scraped.title,
                content: scraped.content,
            };
        } catch (error) {
            this.logger.error(`Failed to fetch URL content: ${error.message}`);
            throw new BadRequestException(`Failed to fetch URL: ${error.message}`);
        }
    }

    async createProject(userId: string, dto: CreateProjectDto) {
        let finalContent = dto.sourceContent;

        if (!finalContent && dto.sourceUrl) {
            try {
                const scraped = await this.scraperService.scrapeUrl({
                    url: dto.sourceUrl,
                    extractImages: false,
                    extractMetadata: false,
                });
                finalContent = scraped.content;
            } catch (error) {
                this.logger.warn(
                    `Failed to scrape URL ${dto.sourceUrl}: ${error.message}`,
                );
            }
        }

        const [project] = await this.drizzle.db
            .insert(instagramProject)
            .values({
                userId,
                title: dto.title,
                sourceUrl: dto.sourceUrl,
                sourceContent: finalContent,
                globalStyle: dto.globalStyle,
                fontFamily: dto.fontFamily || 'Montserrat',
            })
            .returning();

        return project;
    }

    async getProjects(userId: string) {
        return this.drizzle.db
            .select()
            .from(instagramProject)
            .where(eq(instagramProject.userId, userId))
            .orderBy(desc(instagramProject.createdAt));
    }

    async getProject(userId: string, projectId: string) {
        const [project] = await this.drizzle.db
            .select()
            .from(instagramProject)
            .where(
                and(
                    eq(instagramProject.id, projectId),
                    eq(instagramProject.userId, userId),
                ),
            );

        if (!project) {
            throw new NotFoundException('Project not found');
        }

        const slides = await this.drizzle.db
            .select()
            .from(instagramSlide)
            .where(eq(instagramSlide.projectId, projectId))
            .orderBy(instagramSlide.slideNumber);

        return { ...project, slides };
    }

    async updateProject(
        userId: string,
        projectId: string,
        dto: UpdateProjectDto,
    ) {
        await this.getProject(userId, projectId);

        const [updated] = await this.drizzle.db
            .update(instagramProject)
            .set({
                ...dto,
                updatedAt: new Date(),
            })
            .where(eq(instagramProject.id, projectId))
            .returning();

        return updated;
    }

    async deleteProject(userId: string, projectId: string) {
        await this.getProject(userId, projectId);

        await this.drizzle.db
            .delete(instagramProject)
            .where(eq(instagramProject.id, projectId));

        return { success: true };
    }

    async generateStoryboard(
        userId: string,
        projectId: string,
        dto: GenerateStoryboardDto,
    ) {
        const project = await this.getProject(userId, projectId);

        const hasBalance = await this.billingService.checkBalance(userId, 1);
        if (!hasBalance) {
            throw new BadRequestException('Insufficient token balance');
        }

        const withinDailyLimit = await this.billingService.checkDailyLimit(userId, 'INSTAGRAM_GENERATION');
        if (!withinDailyLimit) {
            throw new BadRequestException('Daily limit reached for Instagram Content Generation on your current plan. Please upgrade or try again tomorrow.');
        }

        let content = dto.content || project.sourceContent;
        if (!content && project.sourceUrl) {
            try {
                const scraped = await this.scraperService.scrapeUrl({
                    url: project.sourceUrl,
                    extractImages: false,
                    extractMetadata: false,
                });
                content = scraped.content;

                await this.drizzle.db
                    .update(instagramProject)
                    .set({ sourceContent: content })
                    .where(eq(instagramProject.id, projectId));
            } catch (error) {
                this.logger.warn(
                    `Failed to scrape URL ${project.sourceUrl} during storyboard generation: ${error.message}`,
                );
            }
        }

        if (!content) {
            throw new BadRequestException(
                'No content provided for storyboard generation',
            );
        }

        const storyboard = await this.storyboardService.generateStoryboard(
            content,
            dto.style || project.globalStyle,
            dto.targetSlides,
        );

        await this.drizzle.db
            .delete(instagramSlide)
            .where(eq(instagramSlide.projectId, projectId));

        const slidesData = storyboard.slides.map((slide) => ({
            projectId,
            slideNumber: slide.slide_number,
            textContent: slide.text_content,
            visualPrompt: slide.visual_prompt,
            layoutPosition: slide.layout_position,
        }));

        await this.drizzle.db.insert(instagramSlide).values(slidesData);

        await this.drizzle.db
            .update(instagramProject)
            .set({
                totalSlides: storyboard.total_slides,
                status: 'storyboard',
                updatedAt: new Date(),
            })
            .where(eq(instagramProject.id, projectId));

        await this.billingService.deductTokens(userId, 1, 'Storyboard generation');
        await this.billingService.incrementDailyUsage(userId, 'INSTAGRAM_GENERATION');

        return this.getProject(userId, projectId);
    }

    async generateImage(
        userId: string,
        slideId: string,
        dto: InstagramGenerateImageDto,
    ) {
        const [slide] = await this.drizzle.db
            .select()
            .from(instagramSlide)
            .where(eq(instagramSlide.id, slideId));

        if (!slide) {
            throw new NotFoundException('Slide not found');
        }

        const hasBalance = await this.billingService.checkBalance(userId, 2);
        if (!hasBalance) {
            this.logger.error(
                `[Image Generation] User ${userId} has insufficient tokens.`,
            );
            throw new BadRequestException(
                'Insufficient token balance. You need at least 2 tokens.',
            );
        }

        const withinDailyLimit = await this.billingService.checkDailyLimit(userId, 'INSTAGRAM_GENERATION');
        if (!withinDailyLimit) {
            throw new BadRequestException('Daily limit reached for Instagram Image Generation on your current plan.');
        }

        const project = await this.getProject(userId, slide.projectId);

        // Combine prompts for the AI
        const finalPrompt = `${dto.prompt || slide.visualPrompt || ''}. Style: ${dto.style || project.globalStyle || 'Modern Minimalist'}`;

        try {
            const imageUrl = await this.openAiService.generateImage(finalPrompt);

            const [updated] = await this.drizzle.db
                .update(instagramSlide)
                .set({ imageUrl: imageUrl })
                .where(eq(instagramSlide.id, slideId))
                .returning();

            await this.billingService.deductTokens(
                userId,
                2,
                'Slide image generation',
            );
            await this.billingService.incrementDailyUsage(userId, 'INSTAGRAM_GENERATION');

            return updated;
        } catch (error: any) {
            this.logger.error(
                `[Image Generation] OpenAI Error: ${error.message}`,
                error.stack,
            );
            throw new BadRequestException(
                `Image generation failed: ${error.message}`,
            );
        }
    }

    async generateTextOverlay(
        userId: string,
        slideId: string,
    ) {
        const [slide] = await this.drizzle.db
            .select()
            .from(instagramSlide)
            .where(eq(instagramSlide.id, slideId));

        if (!slide) {
            throw new NotFoundException('Slide not found');
        }

        if (!slide.imageUrl) {
            throw new BadRequestException('Slide does not have a base image to overlay text on.');
        }

        const project = await this.getProject(userId, slide.projectId);

        const hasBalance = await this.billingService.checkBalance(userId, 1);
        if (!hasBalance) {
            throw new BadRequestException('Insufficient token balance. You need 1 token to add text.');
        }

        const withinDailyLimit = await this.billingService.checkDailyLimit(userId, 'INSTAGRAM_GENERATION');
        if (!withinDailyLimit) {
            throw new BadRequestException('Daily limit reached for Instagram Text Generation on your current plan.');
        }

        this.logger.log(`[Text Overlay] Analyzing image layout for slide ${slideId} using Vision AI.`);

        let layoutSuggestion = { layoutPosition: undefined, fontColor: undefined, headerText: undefined, bodyText: undefined };
        try {
            layoutSuggestion = await this.openAiService.analyzeImageLayout(slide.imageUrl, slide.textContent || '');
            this.logger.log(`[Text Overlay] Vision AI suggested: Position ${layoutSuggestion.layoutPosition}, Color ${layoutSuggestion.fontColor}`);
        } catch (error) {
            this.logger.warn(`[Text Overlay] Vision AI layout analysis failed, falling back to defaults: ${error.message}`);
        }

        try {
            // Options based on style and AI suggestion
            const options = {
                fontFamily: project.fontFamily || 'Montserrat',
                fontSize: slide.fontSize || undefined, // undefined will fallback to 5.5% of image height
                fontColor: layoutSuggestion.fontColor || slide.fontColor || '#FFFFFF',
                layoutPosition: layoutSuggestion.layoutPosition || slide.layoutPosition || 'center'
            };

            // Use the AI parsed text if available, otherwise just use the original content
            const textToRender = layoutSuggestion.headerText ?
                JSON.stringify({ header: layoutSuggestion.headerText, body: layoutSuggestion.bodyText }) :
                (slide.textContent || '');

            const processedImageUrl = await this.imageTextService.overlayTextOnImage(
                slide.imageUrl,
                textToRender,
                options
            );

            // Update the slide with new image URL
            const [updatedSlide] = await this.drizzle.db
                .update(instagramSlide)
                .set({ imageUrl: processedImageUrl })
                .where(eq(instagramSlide.id, slideId))
                .returning();

            await this.billingService.deductTokens(
                userId,
                1,
                'Slide text generation',
            );
            await this.billingService.incrementDailyUsage(userId, 'INSTAGRAM_GENERATION');

            return {
                success: true,
                message: 'Text overlay applied successfully',
                slide: updatedSlide
            };
        } catch (error) {
            this.logger.error(`[Text Overlay] Failed: ${error.message}`);
            throw new BadRequestException(`Failed to apply text overlay: ${error.message}`);
        }
    }

    async updateSlide(userId: string, slideId: string, dto: UpdateSlideDto) {
        const [slide] = await this.drizzle.db
            .select()
            .from(instagramSlide)
            .where(eq(instagramSlide.id, slideId));

        if (!slide) {
            throw new NotFoundException('Slide not found');
        }

        await this.getProject(userId, slide.projectId);

        const [updated] = await this.drizzle.db
            .update(instagramSlide)
            .set(dto)
            .where(eq(instagramSlide.id, slideId))
            .returning();

        return updated;
    }

    async exportCarousel(
        userId: string,
        projectId: string,
        dto: ExportCarouselDto,
    ) {
        const project = await this.getProject(userId, projectId);

        if (!project.slides || project.slides.length === 0) {
            throw new BadRequestException('No slides to export');
        }

        const slidesData = project.slides.map((slide) => ({
            imageUrl: slide.imageUrl || '',
            textContent: slide.textContent,
            fontFamily: project.fontFamily || 'Montserrat',
            fontSize: slide.fontSize || 24,
            fontColor: slide.fontColor || '#FFFFFF',
            layoutPosition: slide.layoutPosition || 'center',
        }));

        const results = await this.exportService.exportMultipleSlides(
            slidesData,
            dto.format || 'png',
        );

        return results;
    }

    // --- Slide Management APIs ---

    async createSlide(userId: string, projectId: string, dto: CreateSlideDto) {
        await this.getProject(userId, projectId); // Verify ownership

        const [newSlide] = await this.drizzle.db
            .insert(instagramSlide)
            .values({
                projectId,
                slideNumber: dto.slideNumber,
                textContent: dto.textContent || '',
                visualPrompt: dto.visualPrompt || '',
                layoutPosition: 'center',
            })
            .returning();

        // Increment totalSlides count
        const project = await this.getProject(userId, projectId);
        await this.drizzle.db
            .update(instagramProject)
            .set({ totalSlides: project.slides.length + 1 })
            .where(eq(instagramProject.id, projectId));

        return newSlide;
    }

    async deleteSlide(userId: string, slideId: string) {
        const [slide] = await this.drizzle.db
            .select()
            .from(instagramSlide)
            .where(eq(instagramSlide.id, slideId));

        if (!slide) {
            throw new NotFoundException('Slide not found');
        }

        await this.getProject(userId, slide.projectId); // Verify ownership

        await this.drizzle.db
            .delete(instagramSlide)
            .where(eq(instagramSlide.id, slideId));

        // Decrement totalSlides count and fix order
        const project = await this.getProject(userId, slide.projectId);
        let currentNumber = 1;
        for (const remainingSlide of project.slides) {
            await this.drizzle.db
                .update(instagramSlide)
                .set({ slideNumber: currentNumber })
                .where(eq(instagramSlide.id, remainingSlide.id));
            currentNumber++;
        }

        await this.drizzle.db
            .update(instagramProject)
            .set({ totalSlides: project.slides.length })
            .where(eq(instagramProject.id, slide.projectId));

        return { success: true };
    }

    async reorderSlides(
        userId: string,
        projectId: string,
        dto: ReorderSlidesDto,
    ) {
        const project = await this.getProject(userId, projectId); // Verify ownership
        const { slideId, newSlideNumber } = dto;

        const targetSlide = project.slides.find((s) => s.id === slideId);
        if (!targetSlide) {
            throw new NotFoundException('Slide not found in this project');
        }

        const oldNumber = targetSlide.slideNumber;
        if (oldNumber === newSlideNumber) {
            return project.slides; // No change
        }

        // We temporarily move the target slide to a safe out-of-bounds number to avoid unique constraint issues if any,
        // though slideNumber isn't strictly unique, it's better for ordering logic.

        let newOrder = [...project.slides].sort(
            (a, b) => a.slideNumber - b.slideNumber,
        );
        newOrder = newOrder.filter((s) => s.id !== slideId);

        // Insert at new index
        const insertIndex = newSlideNumber - 1;
        newOrder.splice(insertIndex < 0 ? 0 : insertIndex, 0, targetSlide);

        // Update all slide numbers
        let currentNumber = 1;
        for (const slide of newOrder) {
            await this.drizzle.db
                .update(instagramSlide)
                .set({ slideNumber: currentNumber })
                .where(eq(instagramSlide.id, slide.id));
            currentNumber++;
        }

        return this.getProject(userId, projectId); // Return updated project with slides
    }

    async applyStyleToAll(
        userId: string,
        projectId: string,
        dto: UpdateSlideDto,
    ) {
        await this.getProject(userId, projectId); // Verify ownership

        const updates: Partial<typeof instagramSlide.$inferInsert> = {};
        if (dto.fontSize !== undefined) updates.fontSize = dto.fontSize;
        if (dto.fontColor !== undefined) updates.fontColor = dto.fontColor;
        if (dto.layoutPosition !== undefined)
            updates.layoutPosition = dto.layoutPosition;

        if (Object.keys(updates).length > 0) {
            await this.drizzle.db
                .update(instagramSlide)
                .set(updates)
                .where(eq(instagramSlide.projectId, projectId));
        }

        return this.getProject(userId, projectId);
    }

    async getFonts() {
        return this.fontService.getAvailableFonts();
    }

    async getStyles() {
        const presets = await this.drizzle.db.select().from(stylePreset);

        if (presets.length === 0) {
            return this.getDefaultStyles();
        }

        return presets;
    }

    private getDefaultStyles() {
        return [
            {
                id: 'default-1',
                name: 'Tech Futuristic',
                description:
                    'Modern tech aesthetic with neon accents and dark backgrounds',
                promptTemplate:
                    'futuristic, neon lighting, dark background, tech aesthetic',
                negativePrompt: 'natural, rustic, vintage',
            },
            {
                id: 'default-2',
                name: 'Minimalist',
                description: 'Clean and simple with plenty of white space',
                promptTemplate: 'minimalist, clean, white space, simple, modern',
                negativePrompt: 'cluttered, busy, colorful',
            },
            {
                id: 'default-3',
                name: 'Cinematic',
                description: 'Movie-like quality with dramatic lighting',
                promptTemplate: 'cinematic, dramatic lighting, film grain, moody',
                negativePrompt: 'bright, flat, commercial',
            },
            {
                id: 'default-4',
                name: 'Nature Organic',
                description: 'Natural textures and earthy tones',
                promptTemplate: 'natural, organic, earth tones, botanical, texture',
                negativePrompt: 'artificial, neon, tech',
            },
        ];
    }
}
