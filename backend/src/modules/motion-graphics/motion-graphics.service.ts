import { Injectable, Logger, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { OpenAiService } from '../ai/services/openai.service';
import { VideoScriptService } from '../video-script/video-script.service';
import { BillingService } from '../billing/billing.service';
import { DrizzleService } from '../../db/drizzle.service';
import { renderJobs, renderPresets } from '../../db/schema';
import { eq, desc, and } from 'drizzle-orm';
import * as path from 'path';
import * as fs from 'fs';

export interface TemplateInfo {
  id: string;
  name: string;
  category: string;
  description: string;
  defaultProps: Record<string, any>;
  defaultDuration: number;
  defaultWidth: number;
  defaultHeight: number;
}

const TEMPLATES: TemplateInfo[] = [
  {
    id: 'TitleCard',
    name: 'Title Card',
    category: 'title',
    description: 'Animated title with accent line and optional subtitle',
    defaultProps: { title: 'Your Title', subtitle: '', style: 'modern', bgColor: '#0f172a', textColor: '#ffffff', accentColor: '#3b82f6' },
    defaultDuration: 90,
    defaultWidth: 1920,
    defaultHeight: 1080,
  },
  {
    id: 'GlitchTitle',
    name: 'Glitch Title',
    category: 'title',
    description: 'RGB split glitch effect title animation',
    defaultProps: { title: 'GLITCH', bgColor: '#000000', textColor: '#ffffff', glitchColor: '#00ffff' },
    defaultDuration: 75,
    defaultWidth: 1920,
    defaultHeight: 1080,
  },
  {
    id: 'LowerThird',
    name: 'Lower Third',
    category: 'lower-third',
    description: 'Name and title overlay with slide-in animation',
    defaultProps: { name: 'John Doe', title: 'Content Creator', style: 'clean', accentColor: '#3b82f6' },
    defaultDuration: 90,
    defaultWidth: 1920,
    defaultHeight: 1080,
  },
  {
    id: 'TextReveal',
    name: 'Text Reveal',
    category: 'text',
    description: 'Word-by-word text reveal with bounce/slide effects',
    defaultProps: { text: 'Breaking News', style: 'bounce', bgColor: '#000000', textColor: '#ffffff' },
    defaultDuration: 60,
    defaultWidth: 1080,
    defaultHeight: 1920,
  },
  {
    id: 'CounterAnimation',
    name: 'Counter Animation',
    category: 'counter',
    description: 'Animated number counter with easing',
    defaultProps: { from: 0, to: 1000000, label: 'Subscribers', bgColor: '#0f172a', textColor: '#ffffff', accentColor: '#10b981' },
    defaultDuration: 90,
    defaultWidth: 1080,
    defaultHeight: 1080,
  },
  {
    id: 'SubscribeButton',
    name: 'Subscribe Button',
    category: 'subscribe',
    description: 'Animated subscribe CTA with bell icon',
    defaultProps: { channel: '@YourChannel', style: 'youtube' },
    defaultDuration: 60,
    defaultWidth: 1920,
    defaultHeight: 1080,
  },
  {
    id: 'TransitionSwipe',
    name: 'Transition Swipe',
    category: 'transition',
    description: 'Directional wipe transition with optional text',
    defaultProps: { text: '', direction: 'left', color: '#3b82f6' },
    defaultDuration: 45,
    defaultWidth: 1920,
    defaultHeight: 1080,
  },
  {
    id: 'LogoIntro',
    name: 'Logo Intro',
    category: 'logo',
    description: 'Logo reveal with zoom/spin/reveal effects',
    defaultProps: { logoText: 'BRAND', effect: 'zoom', bgColor: '#0f172a', textColor: '#ffffff' },
    defaultDuration: 75,
    defaultWidth: 1920,
    defaultHeight: 1080,
  },
  {
    id: 'CalloutBox',
    name: 'Callout Box',
    category: 'callout',
    description: 'Positioned callout overlay with border accent',
    defaultProps: { text: 'Important note here!', position: 'bottom-left', bgColor: '#1e293b', textColor: '#ffffff', borderColor: '#3b82f6' },
    defaultDuration: 90,
    defaultWidth: 1920,
    defaultHeight: 1080,
  },
  {
    id: 'AutoCaption',
    name: 'Auto Caption (TikTok Style)',
    category: 'caption',
    description: 'Word-by-word animated captions from Whisper timestamps',
    defaultProps: { words: [{ word: 'Hello', start: 0, end: 0.5 }, { word: 'World', start: 0.5, end: 1 }], style: 'highlight', textColor: '#ffffff', highlightColor: '#facc15', fontSize: 48 },
    defaultDuration: 150,
    defaultWidth: 1080,
    defaultHeight: 1920,
  },
  {
    id: 'AnimatedBackground',
    name: 'Animated Background',
    category: 'background',
    description: 'Looping animated backgrounds (gradient, particles, geometric, waveform)',
    defaultProps: { type: 'gradient-mesh', color1: '#0f172a', color2: '#3b82f6', color3: '#8b5cf6', speed: 1 },
    defaultDuration: 300,
    defaultWidth: 1920,
    defaultHeight: 1080,
  },
  {
    id: 'TypewriterText',
    name: 'Typewriter Text',
    category: 'text',
    description: 'Text appears character by character with blinking cursor',
    defaultProps: { text: 'Hello World...', bgColor: '#0f172a', textColor: '#22c55e', speed: 1 },
    defaultDuration: 90,
    defaultWidth: 1920,
    defaultHeight: 1080,
  },
  {
    id: 'BulletList',
    name: 'Bullet List',
    category: 'text',
    description: 'Animated bullet points appearing one by one',
    defaultProps: { items: ['Point one', 'Point two', 'Point three', 'Point four'], bgColor: '#0f172a', textColor: '#ffffff', bulletColor: '#3b82f6', style: 'slide' },
    defaultDuration: 90,
    defaultWidth: 1920,
    defaultHeight: 1080,
  },
  {
    id: 'QuoteCard',
    name: 'Quote Card',
    category: 'text',
    description: 'Elegant quote with author attribution',
    defaultProps: { quote: 'The only way to do great work is to love what you do.', author: 'Steve Jobs', bgColor: '#0f172a', textColor: '#ffffff', accentColor: '#f59e0b' },
    defaultDuration: 90,
    defaultWidth: 1080,
    defaultHeight: 1080,
  },
  {
    id: 'ProgressBar',
    name: 'Progress Bar',
    category: 'counter',
    description: 'Animated progress bar filling to percentage',
    defaultProps: { percentage: 85, label: 'Completion', bgColor: '#0f172a', barColor: '#10b981', textColor: '#ffffff' },
    defaultDuration: 75,
    defaultWidth: 1920,
    defaultHeight: 1080,
  },
  {
    id: 'SplitScreen',
    name: 'Split Screen',
    category: 'title',
    description: 'Two-panel split screen with slide-in animation',
    defaultProps: { title: 'BEFORE', subtitle: 'After the transformation', bgColor: '#1e293b', textColor: '#ffffff', accentColor: '#3b82f6' },
    defaultDuration: 75,
    defaultWidth: 1920,
    defaultHeight: 1080,
  },
  {
    id: 'SocialProof',
    name: 'Social Proof Card',
    category: 'subscribe',
    description: 'Profile card with follower count animation',
    defaultProps: { handle: '@creator', followers: '1.2M', bio: 'Content Creator & Educator', bgColor: '#f1f5f9', accentColor: '#8b5cf6' },
    defaultDuration: 75,
    defaultWidth: 1080,
    defaultHeight: 1080,
  },
];

@Injectable()
export class MotionGraphicsService {
  private readonly logger = new Logger(MotionGraphicsService.name);
  private bundlePath: string | null = null;

  constructor(
    private configService: ConfigService,
    private openAiService: OpenAiService,
    private billingService: BillingService,
    private drizzle: DrizzleService,
    @InjectQueue('render') private renderQueue: Queue,
    @Inject(forwardRef(() => VideoScriptService))
    private videoScriptService: VideoScriptService,
  ) {
    // Resolve bundle path (pre-built by `cd remotion && npm run build`)
    const bundleDir = path.resolve(process.cwd(), '..', 'remotion', 'dist', 'bundle');
    if (fs.existsSync(bundleDir)) {
      this.bundlePath = bundleDir;
      this.logger.log(`Remotion bundle found at: ${bundleDir}`);
    } else {
      this.logger.warn(`Remotion bundle not found at ${bundleDir}. Run 'cd remotion && npm run build' first.`);
    }
  }

  getTemplates(category?: string): TemplateInfo[] {
    if (!category || category === 'all') return TEMPLATES;
    return TEMPLATES.filter((t) => t.category === category);
  }

  healthCheck(): { ready: boolean; bundlePath: string | null; templateCount: number; message: string } {
    return {
      ready: this.bundlePath !== null,
      bundlePath: this.bundlePath,
      templateCount: TEMPLATES.length,
      message: this.bundlePath
        ? 'Motion graphics renderer is ready'
        : 'Remotion bundle not found. Run "cd remotion && npm run build" to enable rendering.',
    };
  }

  getTemplate(templateId: string): TemplateInfo | undefined {
    return TEMPLATES.find((t) => t.id === templateId);
  }

  async renderTemplate(
    userId: string,
    templateId: string,
    props: Record<string, any>,
    options: { format?: 'mp4' | 'webm' | 'png'; durationFrames?: number; width?: number; height?: number } = {},
  ): Promise<{ jobId: string }> {
    const template = this.getTemplate(templateId);
    if (!template) throw new BadRequestException(`Template '${templateId}' not found`);
    if (!this.bundlePath) throw new BadRequestException('Remotion bundle not available.');

    const featureType = (options.format || 'mp4') === 'png' ? 'MOTION_GRAPHICS_PNG_RENDER' : 'MOTION_GRAPHICS_RENDER';
    const cost = (options.format || 'mp4') === 'png' ? 1 : 3;
    const billing = await this.billingService.ensureBilling(userId, featureType);
    if (!billing.allowed) throw new BadRequestException(billing.reason || 'Billing limit reached');

    await this.billingService.recordUsage(userId, featureType, billing);

    const db = this.drizzle.getDb();
    const [job] = await db.insert(renderJobs).values({
      userId,
      type: 'template',
      status: 'queued',
      input: { templateId, props, options },
      tokensCost: cost,
    }).returning();

    await this.renderQueue.add({ jobId: job.id, userId, type: 'template', input: { templateId, props, options } }, { attempts: 1, timeout: 5 * 60 * 1000 });
    return { jobId: job.id };
  }

  /** Direct render (no billing) — called by processor */
  async renderTemplateDirect(
    templateId: string,
    props: Record<string, any>,
    options: { format?: 'mp4' | 'webm' | 'png'; durationFrames?: number; width?: number; height?: number } = {},
  ): Promise<{ outputPath: string; format: string }> {
    const template = this.getTemplate(templateId);
    if (!template) throw new BadRequestException(`Template '${templateId}' not found`);
    if (!this.bundlePath) throw new BadRequestException('Remotion bundle not available.');

    const format = options.format || 'mp4';
    const durationInFrames = options.durationFrames || template.defaultDuration;
    const width = options.width || template.defaultWidth;
    const height = options.height || template.defaultHeight;

    // Dynamic import to avoid bundling issues
    const { renderMedia, renderStill, selectComposition } = await import('@remotion/renderer');

    const composition = await selectComposition({
      serveUrl: this.bundlePath,
      id: templateId,
      inputProps: { ...template.defaultProps, ...props },
    });

    // Override dimensions and duration
    const compositionOverride = {
      ...composition,
      width,
      height,
      durationInFrames,
    };

    const outputDir = path.resolve(process.cwd(), 'tmp', 'renders');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const filename = `${templateId}-${Date.now()}.${format === 'png' ? 'png' : format}`;
    const outputPath = path.join(outputDir, filename);

    if (format === 'png') {
      await renderStill({
        serveUrl: this.bundlePath,
        composition: compositionOverride,
        output: outputPath,
        inputProps: { ...template.defaultProps, ...props },
      });
    } else {
      await renderMedia({
        serveUrl: this.bundlePath,
        composition: compositionOverride,
        codec: format === 'webm' ? 'vp8' : 'h264',
        outputLocation: outputPath,
        inputProps: { ...template.defaultProps, ...props },
      });
    }

    this.logger.log(`Rendered ${templateId} → ${outputPath}`);
    return { outputPath, format };
  }

  /**
   * AI Custom Animation Generator
   * GPT generates props for an existing template based on natural language prompt.
   */
  async aiGenerateAnimation(
    prompt: string,
    options: { durationSeconds?: number; resolution?: string; style?: string } = {},
  ) {
    const resolution = options.resolution || '1920x1080';
    const [width, height] = resolution.split('x').map(Number);
    const durationSeconds = options.durationSeconds || 3;
    const durationFrames = durationSeconds * 30;

    const systemPrompt = `You are a motion graphics designer. Given a user's description, choose the best template and generate props for it.

Available templates and their props:
- TitleCard: { title, subtitle, style: "modern"|"neon"|"minimal", bgColor, textColor, accentColor }
- GlitchTitle: { title, bgColor, textColor, glitchColor }
- TextReveal: { text, style: "bounce"|"fade"|"slide", bgColor, textColor }
- CounterAnimation: { from, to, label, bgColor, textColor, accentColor }
- LowerThird: { name, title, style: "clean"|"gradient"|"neon", accentColor }
- LogoIntro: { logoText, effect: "zoom"|"spin"|"reveal", bgColor, textColor }
- CalloutBox: { text, position: "top-left"|"top-right"|"bottom-left"|"bottom-right", bgColor, textColor, borderColor }
- TransitionSwipe: { text, direction: "left"|"right"|"up"|"down", color }
- SubscribeButton: { channel, style: "youtube"|"modern" }

Return ONLY valid JSON:
{
  "templateId": "...",
  "props": { ... },
  "reasoning": "brief explanation"
}

User style hint: ${options.style || 'modern'}
Resolution: ${width}x${height}`;

    const result = await this.openAiService.generateContent(prompt, {
      mode: 'custom',
      systemPrompt,
    }) as { templateId?: string; props?: Record<string, any>; reasoning?: string };

    if (!result.templateId || !result.props) {
      throw new BadRequestException('AI failed to generate valid animation config');
    }

    const template = this.getTemplate(result.templateId);
    if (!template) {
      throw new BadRequestException(`AI selected invalid template: ${result.templateId}`);
    }

    return {
      templateId: result.templateId,
      props: { ...template.defaultProps, ...result.props },
      reasoning: result.reasoning || '',
      durationFrames,
      width,
      height,
    };
  }

  /**
   * Render Auto-Caption — queued version
   */
  async renderCaption(
    userId: string,
    words: Array<{ word: string; start: number; end: number }>,
    options: { style?: string; textColor?: string; highlightColor?: string; fontSize?: number } = {},
  ): Promise<{ jobId: string }> {
    if (!this.bundlePath) throw new BadRequestException('Remotion bundle not available.');
    if (!words.length) throw new BadRequestException('No words provided for caption rendering.');

    const CAPTION_COST = 3;
    const billing = await this.billingService.ensureBilling(userId, 'MOTION_GRAPHICS_RENDER');
    if (!billing.allowed) throw new BadRequestException(billing.reason || 'Billing limit reached');

    await this.billingService.recordUsage(userId, 'MOTION_GRAPHICS_RENDER', billing);

    const db = this.drizzle.getDb();
    const [job] = await db.insert(renderJobs).values({
      userId, type: 'caption', status: 'queued',
      input: { words, options }, tokensCost: CAPTION_COST,
    }).returning();

    await this.renderQueue.add({ jobId: job.id, userId, type: 'caption', input: { words, options } }, { attempts: 1, timeout: 5 * 60 * 1000 });
    return { jobId: job.id };
  }

  /** Direct caption render (no billing) — called by processor */
  async renderCaptionDirect(
    words: Array<{ word: string; start: number; end: number }>,
    options: { style?: string; textColor?: string; highlightColor?: string; fontSize?: number } = {},
  ): Promise<{ outputPath: string; format: string }> {
    const lastWord = words[words.length - 1];
    const totalDuration = Math.ceil(lastWord.end) + 1;
    const durationInFrames = totalDuration * 30;

    const props = {
      words,
      style: options.style || 'highlight',
      textColor: options.textColor || '#ffffff',
      highlightColor: options.highlightColor || '#facc15',
      fontSize: options.fontSize || 48,
    };

    const { renderMedia, selectComposition } = await import('@remotion/renderer');

    const composition = await selectComposition({
      serveUrl: this.bundlePath,
      id: 'AutoCaption',
      inputProps: props,
    });

    const compositionOverride = { ...composition, width: 1080, height: 1920, durationInFrames };

    const outputDir = path.resolve(process.cwd(), 'tmp', 'renders');
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

    const outputPath = path.join(outputDir, `caption-${Date.now()}.webm`);

    await renderMedia({
      serveUrl: this.bundlePath,
      composition: compositionOverride,
      codec: 'vp8',
      outputLocation: outputPath,
      inputProps: props,
    });

    this.logger.log(`Rendered AutoCaption (${words.length} words) → ${outputPath}`);
    return { outputPath, format: 'webm' };
  }

  /**
   * Compose full video from a Video Script project.
   * Combines scenes (footage + voiceover text + captions) into one video.
   */
  async composeVideo(
    userId: string,
    projectId: string,
    options: { showCaptions?: boolean; captionStyle?: string; aspectRatio?: string; voice?: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer'; includeAudio?: boolean } = {},
  ): Promise<{ jobId: string }> {
    if (!this.bundlePath) throw new BadRequestException('Remotion bundle not available.');

    const project = await this.videoScriptService.getProject(userId, projectId);
    if (!project.scenes || project.scenes.length === 0) throw new BadRequestException('No scenes to compose.');

    const includeAudio = options.includeAudio !== false;
    const COMPOSE_COST = includeAudio ? 10 : 5;
    const billing = await this.billingService.ensureBilling(userId, 'MOTION_GRAPHICS_RENDER');
    if (!billing.allowed) throw new BadRequestException(billing.reason || 'Billing limit reached');

    await this.billingService.recordUsage(userId, 'MOTION_GRAPHICS_RENDER', billing);

    const db = this.drizzle.getDb();
    const [job] = await db.insert(renderJobs).values({
      userId, type: 'compose', status: 'queued',
      input: { projectId, options }, tokensCost: COMPOSE_COST,
    }).returning();

    await this.renderQueue.add({ jobId: job.id, userId, type: 'compose', input: { projectId, options } }, { attempts: 1, timeout: 10 * 60 * 1000 });
    return { jobId: job.id };
  }

  /** Direct compose (no billing) — called by processor */
  async composeVideoDirect(
    userId: string,
    projectId: string,
    options: { showCaptions?: boolean; captionStyle?: string; aspectRatio?: string; voice?: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer'; includeAudio?: boolean } = {},
  ): Promise<{ outputPath: string; format: string }> {
    const project = await this.videoScriptService.getProject(userId, projectId);

    const includeAudio = options.includeAudio !== false;
    const aspectRatio = options.aspectRatio || '9:16';
    const [width, height] = aspectRatio === '16:9' ? [1920, 1080] : aspectRatio === '1:1' ? [1080, 1080] : [1080, 1920];

    const audioDir = path.resolve(process.cwd(), 'tmp', 'compose-audio', `${projectId}-${Date.now()}`);
    let audioFiles: string[] = [];
    if (includeAudio) {
      fs.mkdirSync(audioDir, { recursive: true });
      const voice = options.voice || 'alloy';
      // Sequential TTS to avoid rate limits (ElevenLabs max 2 concurrent)
      const ttsResults: Array<{ sceneNumber: number; filePath: string } | null> = [];
      for (const s of project.scenes as any[]) {
        const text = (s.voiceoverText || '').trim();
        if (!text) { ttsResults.push(null); continue; }
        const buffer = await this.openAiService.generateSpeech(text, voice);
        const filePath = path.join(audioDir, `scene-${s.sceneNumber}.mp3`);
        fs.writeFileSync(filePath, buffer);
        audioFiles.push(filePath);
        ttsResults.push({ sceneNumber: s.sceneNumber, filePath });
      }
      const audioMap = new Map(
        ttsResults
          .filter((r): r is { sceneNumber: number; filePath: string } => r !== null)
          .map((r) => [r.sceneNumber, r.filePath]),
      );
      (project.scenes as any[]).forEach((s) => {
        (s as any).__audioPath = audioMap.get(s.sceneNumber) || null;
      });
    }

    const totalDuration = project.scenes.reduce((sum, s) => sum + (s.estimatedDuration || 5), 0);
    const durationInFrames = (totalDuration + 2) * 30;

    const scenes = project.scenes.map((s: any) => {
      const audioPath: string | null = (s as any).__audioPath || null;
      const audioUrl = audioPath ? `http://localhost:${process.env.PORT || 3001}/tmp/${path.relative(path.resolve(process.cwd(), 'tmp'), audioPath).replace(/\\/g, '/')}` : null;
      return {
        sceneNumber: s.sceneNumber,
        voiceoverText: s.voiceoverText,
        visualContext: s.visualContext,
        estimatedDuration: s.estimatedDuration || 5,
        emoji: s.emoji,
        footageUrl: s.selectedFootage?.[0]?.thumbnailUrl || null,
        audioUrl,
      };
    });

    const props = {
      scenes,
      title: project.title,
      showCaptions: options.showCaptions !== false,
      captionStyle: options.captionStyle || 'classic',
      bgColor: '#0f172a',
      textColor: '#ffffff',
      accentColor: '#3b82f6',
    };

    const { renderMedia, selectComposition } = await import('@remotion/renderer');

    const composition = await selectComposition({
      serveUrl: this.bundlePath,
      id: 'ComposedVideo',
      inputProps: props,
    });

    const compositionOverride = { ...composition, width, height, durationInFrames };

    const outputDir = path.resolve(process.cwd(), 'tmp', 'renders');
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

    const outputPath = path.join(outputDir, `composed-${Date.now()}.mp4`);

    try {
      await renderMedia({
        serveUrl: this.bundlePath,
        composition: compositionOverride,
        codec: 'h264',
        outputLocation: outputPath,
        inputProps: props,
      });
    } finally {
      audioFiles.forEach((f) => fs.unlink(f, () => {}));
      try { if (fs.existsSync(audioDir)) fs.rmdirSync(audioDir); } catch { /* ignore */ }
    }

    this.logger.log(`Composed video (${scenes.length} scenes, ${totalDuration}s) → ${outputPath}`);
    return { outputPath, format: 'mp4' };
  }

  /** Get render job status (for polling) */
  async getJob(userId: string, jobId: string) {
    const db = this.drizzle.getDb();
    const [job] = await db.select().from(renderJobs)
      .where(and(eq(renderJobs.id, jobId), eq(renderJobs.userId, userId)));
    if (!job) throw new BadRequestException('Render job not found');
    return job;
  }

  /** List user's render jobs */
  async getJobs(userId: string, limit = 20) {
    const db = this.drizzle.getDb();
    return db.select().from(renderJobs)
      .where(eq(renderJobs.userId, userId))
      .orderBy(desc(renderJobs.createdAt))
      .limit(limit);
  }

  // ─── #1: Preview (instant still frame, no queue) ───────────────────

  async previewTemplate(
    templateId: string,
    props: Record<string, any>,
    options: { width?: number; height?: number; frame?: number } = {},
  ): Promise<{ outputPath: string }> {
    const template = this.getTemplate(templateId);
    if (!template) throw new BadRequestException(`Template '${templateId}' not found`);
    if (!this.bundlePath) throw new BadRequestException('Remotion bundle not available.');

    const { renderStill, selectComposition } = await import('@remotion/renderer');
    const width = options.width || Math.min(template.defaultWidth, 960);
    const height = options.height || Math.min(template.defaultHeight, 960);

    const composition = await selectComposition({
      serveUrl: this.bundlePath,
      id: templateId,
      inputProps: { ...template.defaultProps, ...props },
    });

    const compositionOverride = { ...composition, width, height, durationInFrames: template.defaultDuration };

    const outputDir = path.resolve(process.cwd(), 'tmp', 'previews');
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
    const outputPath = path.join(outputDir, `preview-${Date.now()}.jpg`);

    await renderStill({
      serveUrl: this.bundlePath,
      composition: compositionOverride,
      output: outputPath,
      frame: options.frame || Math.floor(template.defaultDuration / 3),
      inputProps: { ...template.defaultProps, ...props },
      imageFormat: 'jpeg',
      jpegQuality: 75,
    });

    return { outputPath };
  }

  // ─── #2: Progress-aware render (used by processor) ─────────────────

  async renderTemplateWithProgress(
    templateId: string,
    props: Record<string, any>,
    options: { format?: 'mp4' | 'webm' | 'png'; durationFrames?: number; width?: number; height?: number } = {},
    onProgress?: (progress: number) => void,
  ): Promise<{ outputPath: string; format: string }> {
    const template = this.getTemplate(templateId);
    if (!template) throw new BadRequestException(`Template '${templateId}' not found`);

    const format = options.format || 'mp4';
    const durationInFrames = options.durationFrames || template.defaultDuration;
    const width = options.width || template.defaultWidth;
    const height = options.height || template.defaultHeight;

    const { renderMedia, renderStill, selectComposition } = await import('@remotion/renderer');

    const composition = await selectComposition({
      serveUrl: this.bundlePath,
      id: templateId,
      inputProps: { ...template.defaultProps, ...props },
    });

    const compositionOverride = { ...composition, width, height, durationInFrames };

    const outputDir = path.resolve(process.cwd(), 'tmp', 'renders');
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
    const outputPath = path.join(outputDir, `${templateId}-${Date.now()}.${format === 'png' ? 'png' : format}`);

    if (format === 'png') {
      await renderStill({
        serveUrl: this.bundlePath,
        composition: compositionOverride,
        output: outputPath,
        inputProps: { ...template.defaultProps, ...props },
      });
      onProgress?.(100);
    } else {
      await renderMedia({
        serveUrl: this.bundlePath,
        composition: compositionOverride,
        codec: format === 'webm' ? 'vp8' : 'h264',
        outputLocation: outputPath,
        inputProps: { ...template.defaultProps, ...props },
        onProgress: ({ progress }) => onProgress?.(Math.round(progress * 100)),
      });
    }

    return { outputPath, format };
  }

  async composeVideoWithProgress(
    userId: string,
    projectId: string,
    options: { showCaptions?: boolean; captionStyle?: string; aspectRatio?: string; voice?: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer'; includeAudio?: boolean } = {},
    onProgress?: (progress: number) => void,
  ): Promise<{ outputPath: string; format: string }> {
    const project = await this.videoScriptService.getProject(userId, projectId);
    const includeAudio = options.includeAudio !== false;
    const aspectRatio = options.aspectRatio || '9:16';
    const [width, height] = aspectRatio === '16:9' ? [1920, 1080] : aspectRatio === '1:1' ? [1080, 1080] : [1080, 1920];

    const audioDir = path.resolve(process.cwd(), 'tmp', 'compose-audio', `${projectId}-${Date.now()}`);
    let audioFiles: string[] = [];
    if (includeAudio) {
      fs.mkdirSync(audioDir, { recursive: true });
      const voice = options.voice || 'alloy';
      const ttsResults: Array<{ sceneNumber: number; filePath: string } | null> = [];
      for (const s of project.scenes as any[]) {
        const text = (s.voiceoverText || '').trim();
        if (!text) { ttsResults.push(null); continue; }
        const buffer = await this.openAiService.generateSpeech(text, voice);
        const filePath = path.join(audioDir, `scene-${s.sceneNumber}.mp3`);
        fs.writeFileSync(filePath, buffer);
        audioFiles.push(filePath);
        ttsResults.push({ sceneNumber: s.sceneNumber, filePath });
      }
      const audioMap = new Map(
        ttsResults.filter((r): r is { sceneNumber: number; filePath: string } => r !== null).map((r) => [r.sceneNumber, r.filePath]),
      );
      (project.scenes as any[]).forEach((s) => { (s as any).__audioPath = audioMap.get(s.sceneNumber) || null; });
    }

    const totalDuration = project.scenes.reduce((sum, s) => sum + (s.estimatedDuration || 5), 0);
    const durationInFrames = (totalDuration + 2) * 30;

    const scenes = project.scenes.map((s: any) => {
      const audioPath: string | null = (s as any).__audioPath || null;
      const audioUrl = audioPath ? `http://localhost:${process.env.PORT || 3001}/tmp/${path.relative(path.resolve(process.cwd(), 'tmp'), audioPath).replace(/\\/g, '/')}` : null;
      return { sceneNumber: s.sceneNumber, voiceoverText: s.voiceoverText, visualContext: s.visualContext, estimatedDuration: s.estimatedDuration || 5, emoji: s.emoji, footageUrl: s.selectedFootage?.[0]?.thumbnailUrl || null, audioUrl };
    });

    const props = { scenes, title: project.title, showCaptions: options.showCaptions !== false, captionStyle: options.captionStyle || 'classic', bgColor: '#0f172a', textColor: '#ffffff', accentColor: '#3b82f6' };

    const { renderMedia, selectComposition } = await import('@remotion/renderer');
    const composition = await selectComposition({ serveUrl: this.bundlePath, id: 'ComposedVideo', inputProps: props });
    const compositionOverride = { ...composition, width, height, durationInFrames };

    const outputDir = path.resolve(process.cwd(), 'tmp', 'renders');
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
    const outputPath = path.join(outputDir, `composed-${Date.now()}.mp4`);

    try {
      await renderMedia({
        serveUrl: this.bundlePath,
        composition: compositionOverride,
        codec: 'h264',
        outputLocation: outputPath,
        inputProps: props,
        onProgress: ({ progress }) => onProgress?.(Math.round(progress * 100)),
      });
    } finally {
      audioFiles.forEach((f) => fs.unlink(f, () => {}));
      try { if (fs.existsSync(audioDir)) fs.rmdirSync(audioDir); } catch { /* ignore */ }
    }

    return { outputPath, format: 'mp4' };
  }

  // ─── #4: Batch Render ──────────────────────────────────────────────

  async batchRender(
    userId: string,
    items: Array<{ templateId: string; props: Record<string, any>; format?: 'mp4' | 'webm' | 'png' }>,
  ): Promise<{ jobIds: string[] }> {
    if (!this.bundlePath) throw new BadRequestException('Remotion bundle not available.');
    if (items.length > 10) throw new BadRequestException('Maximum 10 items per batch.');

    const totalCost = items.reduce((sum, item) => sum + ((item.format || 'mp4') === 'png' ? 1 : 3), 0);
    const billing = await this.billingService.ensureBilling(userId, 'MOTION_GRAPHICS_RENDER');
    if (!billing.allowed) throw new BadRequestException(billing.reason || 'Billing limit reached');

    await this.billingService.recordUsage(userId, 'MOTION_GRAPHICS_RENDER', billing);

    const db = this.drizzle.getDb();
    const jobIds: string[] = [];

    for (const item of items) {
      const template = this.getTemplate(item.templateId);
      if (!template) continue;
      const cost = (item.format || 'mp4') === 'png' ? 1 : 3;
      const [job] = await db.insert(renderJobs).values({
        userId, type: 'template', status: 'queued',
        input: { templateId: item.templateId, props: item.props, options: { format: item.format } },
        tokensCost: cost,
      }).returning();
      await this.renderQueue.add({ jobId: job.id, userId, type: 'template', input: { templateId: item.templateId, props: item.props, options: { format: item.format } } }, { attempts: 1, timeout: 5 * 60 * 1000 });
      jobIds.push(job.id);
    }

    return { jobIds };
  }

  // ─── #3: Presets CRUD ──────────────────────────────────────────────

  async getPresets(userId: string) {
    const db = this.drizzle.getDb();
    return db.select().from(renderPresets)
      .where(eq(renderPresets.userId, userId))
      .orderBy(desc(renderPresets.createdAt));
  }

  async savePreset(userId: string, data: { templateId: string; name: string; props: Record<string, any>; format?: string }) {
    const db = this.drizzle.getDb();
    const [preset] = await db.insert(renderPresets).values({
      userId, templateId: data.templateId, name: data.name, props: data.props, format: data.format || 'mp4',
    }).returning();
    return preset;
  }

  async deletePreset(userId: string, presetId: string) {
    const db = this.drizzle.getDb();
    await db.delete(renderPresets)
      .where(and(eq(renderPresets.id, presetId), eq(renderPresets.userId, userId)));
    return { success: true };
  }
}
