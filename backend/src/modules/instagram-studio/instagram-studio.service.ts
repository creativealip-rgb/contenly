import {
    Injectable,
    NotFoundException,
    BadRequestException,
    Logger,
} from '@nestjs/common';
import { eq, and, desc, inArray } from 'drizzle-orm';
import { DrizzleService } from '../../db/drizzle.service';
import { instagramProject, instagramSlide, stylePreset } from '../../db/schema';
import { BillingService } from '../billing/billing.service';
import { BILLING_TIERS } from '../billing/billing.constants';
import { StoryboardService } from './services/storyboard.service';
import { OpenAiService } from '../ai/services/openai.service';
import { FontService } from './services/font.service';
import { ExportService } from './services/export.service';
import { ScraperService } from '../scraper/scraper.service';
import { ImageTextService } from './services/image-text.service';
import { TemplateService, CarouselTemplate } from './services/template.service';
import archiver from 'archiver';
import { Readable } from 'stream';
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
        private templateService: TemplateService,
    ) { }

    private buildImagePrompt(visualPrompt: string, style: string, textContent: string): string {
        const base = `${visualPrompt}. Style: ${style}`.trim();
        if (!textContent) return base;

        const maxPromptLength = 1100;
        const instructionPrefix = `${base}. Include this readable headline text in the design: "`;
        const instructionSuffix = '". Use clean typography, high contrast, editorial Instagram carousel style.';
        const maxTextLength = Math.max(80, maxPromptLength - instructionPrefix.length - instructionSuffix.length);
        const trimmedText = textContent.length > maxTextLength
            ? `${textContent.slice(0, maxTextLength - 1)}…`
            : textContent;

        return `${instructionPrefix}${trimmedText}${instructionSuffix}`;
    }

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
                globalStyle: dto.globalStyle || dto.styleId,
                fontFamily: dto.fontFamily || 'Montserrat',
                templateId: dto.templateId,
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

        const billing = await this.billingService.ensureBilling(userId, 'STORYBOARD_GENERATION');
        if (!billing.allowed) {
            throw new BadRequestException(billing.reason || 'Billing limit reached');
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

        const tier = await this.billingService.getSubscriptionTier(userId);
        const model = BILLING_TIERS[tier]?.aiModel;

        const storyboardStyle = dto.style || dto.styleId || project.globalStyle;
        const targetSlides = dto.targetSlides ?? dto.slideCount;

        const storyboard = await this.storyboardService.generateStoryboard(
            content,
            storyboardStyle,
            targetSlides,
            model,
            dto.templateId,
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

        await this.billingService.recordUsage(userId, 'STORYBOARD_GENERATION', billing);

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

        const billing = await this.billingService.ensureBilling(userId, 'SLIDE_IMAGE');
        if (!billing.allowed) {
            throw new BadRequestException(billing.reason || 'Billing limit reached');
        }

        const project = await this.getProject(userId, slide.projectId);

        // Combine prompts for the AI - include text content so it's styled into the image
        const textContent = slide.textContent || '';
        const visualPrompt = dto.prompt || slide.visualPrompt || '';
        const style = dto.style || project.globalStyle || 'Modern Minimalist';

        // Build a compact prompt that includes the text as part of the design.
        const finalPrompt = this.buildImagePrompt(visualPrompt, style, textContent);

        try {
            const imageUrl = await this.openAiService.generateImage(finalPrompt);

            const [updated] = await this.drizzle.db
                .update(instagramSlide)
                .set({ imageUrl: imageUrl })
                .where(eq(instagramSlide.id, slideId))
                .returning();

            await this.billingService.recordUsage(userId, 'SLIDE_IMAGE', billing);

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

    async generateAllImages(
        userId: string,
        projectId: string,
    ) {
        const project = await this.getProject(userId, projectId);

        if (!project.slides || project.slides.length === 0) {
            throw new BadRequestException('No slides to generate images for');
        }

        const results = [];
        for (const slide of project.slides) {
            try {
                const billing = await this.billingService.ensureBilling(userId, 'SLIDE_IMAGE');
                if (!billing.allowed) {
                    throw new BadRequestException(billing.reason || 'Billing limit reached');
                }
                const textContent = slide.textContent || '';
                const visualPrompt = slide.visualPrompt || '';
                const style = project.globalStyle || 'Modern Minimalist';

                const finalPrompt = this.buildImagePrompt(visualPrompt, style, textContent);

                const imageUrl = await this.openAiService.generateImage(finalPrompt);

                await this.drizzle.db
                    .update(instagramSlide)
                    .set({ imageUrl })
                    .where(eq(instagramSlide.id, slide.id));

                await this.billingService.recordUsage(userId, 'SLIDE_IMAGE', billing);

                results.push({ slideId: slide.id, slideNumber: slide.slideNumber, success: true });
            } catch (error: any) {
                this.logger.error(`[Generate All] Slide ${slide.slideNumber} failed: ${error.message}`);
                results.push({ slideId: slide.id, slideNumber: slide.slideNumber, success: false, error: error.message });
            }
        }

        return this.getProject(userId, projectId);
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

        const billing = await this.billingService.ensureBilling(userId, 'TEXT_OVERLAY');
        if (!billing.allowed) {
            throw new BadRequestException(billing.reason || 'Billing limit reached');
        }

        this.logger.log(`[Text Overlay] Analyzing image layout for slide ${slideId} using Vision AI.`);

        let layoutSuggestion = { layoutPosition: undefined, fontColor: undefined, headerText: undefined, bodyText: undefined };
        try {
            const tier = await this.billingService.getSubscriptionTier(userId);
            const model = BILLING_TIERS[tier]?.aiModel;

            layoutSuggestion = await this.openAiService.analyzeImageLayout(slide.imageUrl, slide.textContent || '', model);
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

            await this.billingService.recordUsage(userId, 'TEXT_OVERLAY', billing);

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

        // If PDF export requested
        if (dto.format === 'pdf') {
            let templateColors = undefined;
            if (dto.templateId) {
                templateColors = this.templateService.getColorPalette(dto.templateId);
            }

            const slidesData = project.slides.map((slide) => ({
                imageUrl: slide.imageUrl || '',
                textContent: slide.textContent,
                fontFamily: project.fontFamily || 'Montserrat',
                fontSize: slide.fontSize || 24,
                fontColor: slide.fontColor || '#FFFFFF',
                layoutPosition: slide.layoutPosition || 'center',
                gradientColors: templateColors 
                    ? [templateColors.primary, templateColors.secondary]
                    : undefined,
                backgroundColor: !slide.imageUrl && !templateColors ? '#1a1a2e' : undefined,
            }));

            const result = await this.exportService.exportToPdf(slidesData);
            return [result];
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

    // =====================
    // Template Methods
    // =====================

    async getTemplates(
        category?: CarouselTemplate['category'],
        platform?: 'instagram' | 'linkedin' | 'twitter',
    ) {
        if (category) {
            return this.templateService.getTemplatesByCategory(category);
        }
        if (platform) {
            return this.templateService.getTemplatesForPlatform(platform);
        }
        return this.templateService.getAllTemplates();
    }

    async getTemplateCategories() {
        return this.templateService.getCategories();
    }

    async getTemplateById(id: string) {
        const template = this.templateService.getTemplateById(id);
        if (!template) {
            throw new NotFoundException(`Template ${id} not found`);
        }
        return template;
    }

    generateTemplatePrompt(templateId: string, customStyle?: string) {
        const template = this.templateService.getTemplateById(templateId);
        if (!template) {
            throw new NotFoundException(`Template ${templateId} not found`);
        }
        return {
            prompt: this.templateService.generateAiPrompt(template, customStyle),
            negative: this.templateService.generateNegativePrompt(template),
            colors: template.colors,
            background: template.background,
            typography: template.typography,
            layout: template.layout,
        };
    }

    async generateHashtags(userId: string, projectId: string, content?: string) {
        const project = await this.getProject(userId, projectId);
        
        const textContent = content || project.slides?.map(s => s.textContent).join(' ') || project.sourceContent || '';
        
        if (!textContent) {
            throw new BadRequestException('No content available to generate hashtags');
        }

        const systemPrompt = `You are a social media expert. Generate relevant, trending hashtags for Instagram carousel posts.
        
RULES:
- Generate 10-15 hashtags
- Mix of popular (#viral, #trending) and niche hashtags
- Include location-based if relevant
- Use Indonesian and English hashtags
- Only output hashtags, one per line, no other text
- Start with #`;

        try {
            const result = await this.openAiService.generateContent(
                `Generate hashtags for this content:\n\n${textContent.slice(0, 2000)}`,
                { mode: 'custom', systemPrompt }
            );

            const hashtags = result.hashtags || result.text || '';
            const hashtagArray = hashtags
                .split('\n')
                .map((h: string) => h.trim())
                .filter((h: string) => h.startsWith('#') && h.length > 1)
                .slice(0, 15);

            return {
                hashtags: hashtagArray,
                caption: this.buildAutoCaption(project.title, hashtagArray),
            };
        } catch (error) {
            this.logger.error(`Hashtag generation failed: ${error.message}`);
            return {
                hashtags: ['#content', '#viral', '#trending'],
                caption: project.title,
            };
        }
    }

    private buildAutoCaption(title: string, hashtags: string[]): string {
        const hook = this.getCaptionHook(title);
        const hashtagStr = hashtags.slice(0, 10).join(' ');
        return `${hook}\n\n${hashtagStr}\n\n#ContentCreatedWithContenly`;
    }

    private getCaptionHook(title: string): string {
        const hooks = [
            `Baca sampai habis! ${title} 🚀`,
            `Penting untuk kamu ketahui! ${title} 👇`,
            `Siapa yang sudah tahu ini? ${title} 🔥`,
            `${title} - Jangan sampai kelewat!`,
            `7 dari 10 orang tidak tahu ini tentang ${title} 😱`,
        ];
        return hooks[Math.floor(Math.random() * hooks.length)];
    }

    // --- Export Features ---

    async exportCarouselZip(
        userId: string,
        projectId: string,
        dto: ExportCarouselDto,
    ) {
        const project = await this.getProject(userId, projectId);

        if (!project.slides || project.slides.length === 0) {
            throw new BadRequestException('No slides to export');
        }

        // ZIP export only supports image formats
        const imageFormat = dto.format === 'pdf' ? 'png' : (dto.format || 'png');

        // Export all slides as images
        const slidesData = project.slides.map((slide) => ({
            imageUrl: slide.imageUrl || '',
            textContent: slide.textContent,
            fontFamily: project.fontFamily || 'Montserrat',
            fontSize: slide.fontSize || 24,
            fontColor: slide.fontColor || '#FFFFFF',
            layoutPosition: slide.layoutPosition || 'center',
            gradientColors: slide.gradientColors ? 
                (Array.isArray(slide.gradientColors) ? slide.gradientColors : [slide.gradientColors]) : 
                undefined,
            backgroundColor: !slide.imageUrl ? '#1a1a2e' : undefined,
        }));

        const exportedImages = await this.exportService.exportMultipleSlides(
            slidesData,
            imageFormat as 'png' | 'jpg',
        );

        // Create ZIP archive
        const archive = archiver('zip', { zlib: { level: 9 } });
        const chunks: Buffer[] = [];

        return new Promise<{ buffer: Buffer; filename: string }>((resolve, reject) => {
            archive.on('data', (chunk) => chunks.push(chunk));
            archive.on('end', () => {
                const buffer = Buffer.concat(chunks);
                resolve({
                    buffer,
                    filename: `${project.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}-${Date.now()}.zip`,
                });
            });
            archive.on('error', reject);

            // Add each image to the archive
            exportedImages.forEach((image, index) => {
                archive.append(image.buffer, {
                    name: `slide-${String(index + 1).padStart(2, '0')}.${dto.format || 'png'}`,
                });
            });

            // Add a README file with project info
            const readme = `# ${project.title}\n\n` +
                `Exported: ${new Date().toISOString()}\n` +
                `Total Slides: ${project.slides.length}\n` +
                `Format: ${dto.format || 'png'}\n\n` +
                `Generated by Contenly`;
            archive.append(readme, { name: 'README.txt' });

            archive.finalize();
        });
    }

    async batchExport(
        userId: string,
        projectIds: string[],
        format: 'png' | 'jpg' | 'pdf',
    ) {
        if (!projectIds || projectIds.length === 0) {
            throw new BadRequestException('No projects selected for export');
        }

        if (projectIds.length > 10) {
            throw new BadRequestException('Maximum 10 projects can be exported at once');
        }

        // Get all projects
        const projects = await this.drizzle.db
            .select()
            .from(instagramProject)
            .where(and(
                eq(instagramProject.userId, userId),
                inArray(instagramProject.id, projectIds)
            ));

        if (projects.length === 0) {
            throw new NotFoundException('No projects found');
        }

        // Create ZIP archive
        const archive = archiver('zip', { zlib: { level: 9 } });
        const chunks: Buffer[] = [];

        return new Promise<{ buffer: Buffer; filename: string }>((resolve, reject) => {
            archive.on('data', (chunk) => chunks.push(chunk));
            archive.on('end', () => {
                const buffer = Buffer.concat(chunks);
                resolve({
                    buffer,
                    filename: `batch-export-${Date.now()}.zip`,
                });
            });
            archive.on('error', reject);

            // Process each project
            const processProjects = async () => {
                for (const project of projects) {
                    // Get slides for this project
                    const slides = await this.drizzle.db
                        .select()
                        .from(instagramSlide)
                        .where(eq(instagramSlide.projectId, project.id))
                        .orderBy(instagramSlide.slideNumber);

                    if (slides.length === 0) continue;

                    if (format === 'pdf') {
                        const slidesData = slides.map((slide) => ({
                            imageUrl: slide.imageUrl || '',
                            textContent: slide.textContent,
                            fontFamily: project.fontFamily || 'Montserrat',
                            fontSize: slide.fontSize || 24,
                            fontColor: slide.fontColor || '#FFFFFF',
                            layoutPosition: slide.layoutPosition || 'center',
                            gradientColors: slide.gradientColors ? 
                                (Array.isArray(slide.gradientColors) ? slide.gradientColors : [slide.gradientColors]) : 
                                undefined,
                            backgroundColor: !slide.imageUrl ? '#1a1a2e' : undefined,
                        }));

                        const pdfResult = await this.exportService.exportToPdf(slidesData);
                        const folderName = project.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
                        archive.append(pdfResult.buffer, {
                            name: `${folderName}/${folderName}.pdf`,
                        });
                    } else {
                        const slidesData = slides.map((slide) => ({
                            imageUrl: slide.imageUrl || '',
                            textContent: slide.textContent,
                            fontFamily: project.fontFamily || 'Montserrat',
                            fontSize: slide.fontSize || 24,
                            fontColor: slide.fontColor || '#FFFFFF',
                            layoutPosition: slide.layoutPosition || 'center',
                            gradientColors: slide.gradientColors ? 
                                (Array.isArray(slide.gradientColors) ? slide.gradientColors : [slide.gradientColors]) : 
                                undefined,
                            backgroundColor: !slide.imageUrl ? '#1a1a2e' : undefined,
                        }));

                        const exportedImages = await this.exportService.exportMultipleSlides(
                            slidesData,
                            format,
                        );

                        const folderName = project.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
                        exportedImages.forEach((image, index) => {
                            archive.append(image.buffer, {
                                name: `${folderName}/slide-${String(index + 1).padStart(2, '0')}.${format}`,
                            });
                        });
                    }
                }

                // Add batch export info
                const readme = `# Batch Export\n\n` +
                    `Exported: ${new Date().toISOString()}\n` +
                    `Total Projects: ${projects.length}\n` +
                    `Format: ${format}\n\n` +
                    `Projects:\n` +
                    projects.map(p => `- ${p.title}`).join('\n') +
                    `\n\nGenerated by Contenly`;
                archive.append(readme, { name: 'README.txt' });

                archive.finalize();
            };

            processProjects().catch(reject);
        });
    }
}
