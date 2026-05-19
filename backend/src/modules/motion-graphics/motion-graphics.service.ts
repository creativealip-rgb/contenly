import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OpenAiService } from '../ai/services/openai.service';
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
];

@Injectable()
export class MotionGraphicsService {
  private readonly logger = new Logger(MotionGraphicsService.name);
  private bundlePath: string | null = null;

  constructor(
    private configService: ConfigService,
    private openAiService: OpenAiService,
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

  getTemplate(templateId: string): TemplateInfo | undefined {
    return TEMPLATES.find((t) => t.id === templateId);
  }

  async renderTemplate(
    templateId: string,
    props: Record<string, any>,
    options: { format?: 'mp4' | 'webm' | 'png'; durationFrames?: number; width?: number; height?: number } = {},
  ): Promise<{ outputPath: string; format: string }> {
    const template = this.getTemplate(templateId);
    if (!template) {
      throw new BadRequestException(`Template '${templateId}' not found`);
    }

    if (!this.bundlePath) {
      throw new BadRequestException(
        'Remotion bundle not available. Run "cd remotion && npm run build" to create the bundle.',
      );
    }

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
   * Render Auto-Caption from Whisper word timestamps
   */
  async renderCaption(
    words: Array<{ word: string; start: number; end: number }>,
    options: { style?: string; textColor?: string; highlightColor?: string; fontSize?: number } = {},
  ): Promise<{ outputPath: string; format: string }> {
    if (!this.bundlePath) {
      throw new BadRequestException('Remotion bundle not available.');
    }

    if (!words.length) {
      throw new BadRequestException('No words provided for caption rendering.');
    }

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
}
