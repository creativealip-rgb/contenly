import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
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
];

@Injectable()
export class MotionGraphicsService {
  private readonly logger = new Logger(MotionGraphicsService.name);
  private bundlePath: string | null = null;

  constructor(private configService: ConfigService) {
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
}
