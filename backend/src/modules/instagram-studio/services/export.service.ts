import { Injectable, Logger } from '@nestjs/common';
import * as sharp from 'sharp';

interface SlideExportData {
  imageUrl: string;
  textContent: string;
  fontFamily: string;
  fontSize: number;
  fontColor: string;
  layoutPosition: string;
}

export interface ExportResult {
  buffer: Buffer;
  filename: string;
  mimeType: string;
}

@Injectable()
export class ExportService {
  private readonly logger = new Logger(ExportService.name);
  private readonly CANVAS_WIDTH = 1080;
  private readonly CANVAS_HEIGHT = 1350;

  async exportSlide(
    slide: SlideExportData,
    format: 'png' | 'jpg' = 'png',
  ): Promise<ExportResult> {
    try {
      let imageBuffer: Buffer;

      if (slide.imageUrl && slide.imageUrl.startsWith('http')) {
        const response = await fetch(slide.imageUrl);
        const arrayBuffer = await response.arrayBuffer();
        imageBuffer = Buffer.from(arrayBuffer);
      } else if (slide.imageUrl && slide.imageUrl.startsWith('data:')) {
        const base64 = slide.imageUrl.split(',')[1];
        imageBuffer = Buffer.from(base64, 'base64');
      } else if (
        slide.imageUrl &&
        (slide.imageUrl.startsWith('#') || slide.imageUrl.startsWith('rgb'))
      ) {
        imageBuffer = await sharp({
          create: {
            width: this.CANVAS_WIDTH,
            height: this.CANVAS_HEIGHT,
            channels: 3,
            background: slide.imageUrl,
          },
        })
          .png()
          .toBuffer();
      } else {
        imageBuffer = await this.createPlaceholderImage();
      }

      const svgBuffer = this.createTextSvg(slide);

      const processedImage = await sharp(imageBuffer)
        .resize(this.CANVAS_WIDTH, this.CANVAS_HEIGHT, {
          fit: 'cover',
          position: 'center',
        })
        .composite([
          {
            input: svgBuffer,
            top: 0,
            left: 0,
          },
        ])
        .toFormat(format === 'png' ? 'png' : 'jpeg', {
          quality: format === 'jpg' ? 90 : undefined,
        })
        .toBuffer();

      const filename = `slide-${Date.now()}.${format}`;

      return {
        buffer: processedImage,
        filename,
        mimeType: format === 'png' ? 'image/png' : 'image/jpeg',
      };
    } catch (error) {
      this.logger.error(`Export failed: ${error.message}`);
      throw error;
    }
  }

  private createTextSvg(slide: SlideExportData): Buffer {
    const { textContent, fontFamily, fontColor, layoutPosition } = slide;

    // Scale font size up because the canvas is 1080x1350,
    // while the frontend preview is much smaller.
    const scaleFactor = 2.5;
    const fontSize = (slide.fontSize || 24) * scaleFactor;

    // Simple word wrapping based on relative width
    const maxCharsPerLine = Math.floor(
      (this.CANVAS_WIDTH * 0.8) / (fontSize * 0.5),
    );
    const words = textContent.replace(/\n/g, ' \n ').split(' ');
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
      if (word === '\n') {
        lines.push(currentLine.trim());
        currentLine = '';
      } else if ((currentLine + word).length > maxCharsPerLine) {
        lines.push(currentLine.trim());
        currentLine = word + ' ';
      } else {
        currentLine += word + ' ';
      }
    }
    if (currentLine) {
      lines.push(currentLine.trim());
    }

    const lineHeight = fontSize * 1.3;
    const totalTextHeight = lines.length * lineHeight;

    // Alignment and positioning based on layoutPosition
    const position = this.getTextPosition(layoutPosition);
    let textAnchor = 'middle';
    let x = position.x;

    if (layoutPosition.includes('left')) {
      textAnchor = 'start';
      x = position.x;
    } else if (layoutPosition.includes('right')) {
      textAnchor = 'end';
      x = position.x;
    }

    // Adjust Y based on alignment so the text block goes upwards or downwards
    let startY = position.y;
    if (layoutPosition.includes('top')) {
      startY = position.y + fontSize; // Start from top downward
    } else if (layoutPosition.includes('bottom')) {
      startY = position.y - totalTextHeight + fontSize; // End at bottom
    } else {
      // center
      startY = position.y - totalTextHeight / 2 + fontSize;
    }

    const svgContent = `
            <svg width="${this.CANVAS_WIDTH}" height="${this.CANVAS_HEIGHT}">
                <style>
                    .title {
                        fill: ${fontColor || '#FFFFFF'};
                        font-family: "${fontFamily || 'Montserrat'}", sans-serif;
                        font-size: ${fontSize}px;
                        font-weight: bold;
                    }
                    .shadow {
                        fill: rgba(0, 0, 0, 0.5);
                        font-family: "${fontFamily || 'Montserrat'}", sans-serif;
                        font-size: ${fontSize}px;
                        font-weight: bold;
                    }
                </style>
                ${lines
                  .map((line, i) => {
                    const lineY = startY + i * lineHeight;
                    return `
                    <text x="${x + 4}" y="${lineY + 4}" text-anchor="${textAnchor}" class="shadow">${this.escapeXml(line)}</text>
                    <text x="${x}" y="${lineY}" text-anchor="${textAnchor}" class="title">${this.escapeXml(line)}</text>
                    `;
                  })
                  .join('')}
            </svg>
        `;

    return Buffer.from(svgContent);
  }

  private escapeXml(unsafe: string): string {
    return unsafe.replace(/[<>&'"]/g, (c) => {
      switch (c) {
        case '<':
          return '&lt;';
        case '>':
          return '&gt;';
        case '&':
          return '&amp;';
        case "'":
          return '&apos;';
        case '"':
          return '&quot;';
        default:
          return c;
      }
    });
  }

  async exportMultipleSlides(
    slides: SlideExportData[],
    format: 'png' | 'jpg' = 'png',
  ): Promise<ExportResult[]> {
    const results: ExportResult[] = [];

    for (let i = 0; i < slides.length; i++) {
      const result = await this.exportSlide(slides[i], format);
      result.filename = `slide-${i + 1}.${format}`;
      results.push(result);
    }

    return results;
  }

  getTextPosition(layoutPosition: string): { x: number; y: number } {
    const padding = 60;
    const positions: Record<string, { x: number; y: number }> = {
      'top-left': { x: padding, y: padding + 50 },
      'top-center': { x: this.CANVAS_WIDTH / 2, y: padding + 50 },
      'top-right': { x: this.CANVAS_WIDTH - padding, y: padding + 50 },
      'center-left': { x: padding, y: this.CANVAS_HEIGHT / 2 },
      center: { x: this.CANVAS_WIDTH / 2, y: this.CANVAS_HEIGHT / 2 },
      'center-right': {
        x: this.CANVAS_WIDTH - padding,
        y: this.CANVAS_HEIGHT / 2,
      },
      'bottom-left': { x: padding, y: this.CANVAS_HEIGHT - padding - 50 },
      'bottom-center': {
        x: this.CANVAS_WIDTH / 2,
        y: this.CANVAS_HEIGHT - padding - 50,
      },
      'bottom-right': {
        x: this.CANVAS_WIDTH - padding,
        y: this.CANVAS_HEIGHT - padding - 50,
      },
    };

    return positions[layoutPosition] || positions['center'];
  }

  getTextAlignment(layoutPosition: string): 'left' | 'center' | 'right' {
    if (layoutPosition.includes('left')) return 'left';
    if (layoutPosition.includes('right')) return 'right';
    return 'center';
  }

  private async createPlaceholderImage(): Promise<Buffer> {
    return await sharp({
      create: {
        width: this.CANVAS_WIDTH,
        height: this.CANVAS_HEIGHT,
        channels: 3,
        background: { r: 26, g: 26, b: 46 },
      },
    })
      .png()
      .toBuffer();
  }
}
