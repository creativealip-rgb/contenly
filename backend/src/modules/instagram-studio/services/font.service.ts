import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface GoogleFont {
  family: string;
  category: string;
  variants: string[];
  subsets: string[];
  files: Record<string, string>;
}

export interface FontInfo {
  family: string;
  category: string;
  variants: string[];
}

@Injectable()
export class FontService {
  private readonly logger = new Logger(FontService.name);
  private readonly apiKey: string;
  private cachedFonts: FontInfo[] = [];

  constructor(private configService: ConfigService) {
    this.apiKey = this.configService.get<string>('GOOGLE_FONTS_API_KEY') || '';
  }

  async getAvailableFonts(): Promise<FontInfo[]> {
    if (this.cachedFonts.length > 0) {
      return this.cachedFonts;
    }

    if (!this.apiKey) {
      this.logger.warn(
        'Google Fonts API key not configured, returning default fonts',
      );
      return this.getDefaultFonts();
    }

    try {
      const response = await fetch(
        `https://www.googleapis.com/webfonts/v1/webfonts?key=${this.apiKey}&sort=popularity`,
      );

      if (!response.ok) {
        throw new Error(`Google Fonts API error: ${response.status}`);
      }

      const data = await response.json();

      this.cachedFonts = data.items
        .filter((font: GoogleFont) =>
          ['serif', 'sans-serif', 'display', 'handwriting'].includes(
            font.category,
          ),
        )
        .map((font: GoogleFont) => ({
          family: font.family,
          category: font.category,
          variants: font.variants,
        }));

      return this.cachedFonts;
    } catch (error) {
      this.logger.error(`Failed to fetch Google Fonts: ${error.message}`);
      return this.getDefaultFonts();
    }
  }

  async getFontsByCategory(category: string): Promise<FontInfo[]> {
    const fonts = await this.getAvailableFonts();
    return fonts.filter((font) => font.category === category);
  }

  getFontUrl(family: string, variant: string = 'regular'): string {
    return `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@${this.variantToWeight(variant)}&display=swap`;
  }

  private variantToWeight(variant: string): string {
    const weightMap: Record<string, string> = {
      thin: '100',
      extralight: '200',
      light: '300',
      regular: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
      extrabold: '800',
      black: '900',
    };

    if (variant.includes('italic')) {
      const base = variant.replace('italic', '');
      return weightMap[base] || '400';
    }

    return weightMap[variant] || variant;
  }

  private getDefaultFonts(): FontInfo[] {
    return [
      {
        family: 'Montserrat',
        category: 'sans-serif',
        variants: ['regular', 'bold'],
      },
      {
        family: 'Playfair Display',
        category: 'serif',
        variants: ['regular', 'bold'],
      },
      {
        family: 'Poppins',
        category: 'sans-serif',
        variants: ['regular', 'bold'],
      },
      {
        family: 'Roboto',
        category: 'sans-serif',
        variants: ['regular', 'bold'],
      },
      {
        family: 'Open Sans',
        category: 'sans-serif',
        variants: ['regular', 'bold'],
      },
      { family: 'Lato', category: 'sans-serif', variants: ['regular', 'bold'] },
      {
        family: 'Oswald',
        category: 'sans-serif',
        variants: ['regular', 'bold'],
      },
      {
        family: 'Raleway',
        category: 'sans-serif',
        variants: ['regular', 'bold'],
      },
      {
        family: 'Merriweather',
        category: 'serif',
        variants: ['regular', 'bold'],
      },
      { family: 'Bebas Neue', category: 'display', variants: ['regular'] },
    ];
  }
}
