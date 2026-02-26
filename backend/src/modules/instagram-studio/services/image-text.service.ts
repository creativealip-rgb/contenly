import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import sharp from 'sharp';
import axios from 'axios';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class ImageTextService {
    private readonly logger = new Logger(ImageTextService.name);
    private supabase: SupabaseClient;

    constructor(private configService: ConfigService) {
        const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
        const supabaseKey = this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY')
            || this.configService.get<string>('SUPABASE_ANON_KEY');

        if (!supabaseUrl || !supabaseKey) {
            this.logger.warn('Supabase credentials missing. Image storage will fail.');
        } else {
            this.supabase = createClient(supabaseUrl, supabaseKey);
        }
    }

    /**
     * Downloads an image from a URL and returns it as a Buffer
     */
    private async downloadImage(url: string): Promise<Buffer> {
        this.logger.log(`Downloading base image from: ${url}`);
        const response = await axios.get(url, { responseType: 'arraybuffer' });
        return Buffer.from(response.data as ArrayBuffer);
    }

    /**
     * Overlays text onto a base image using Sharp's SVG composition.
     */
    async overlayTextOnImage(
        imageUrl: string,
        text: string,
        options?: {
            fontFamily?: string;
            fontSize?: number;
            fontColor?: string;
            layoutPosition?: string;
        }
    ): Promise<string> {
        try {
            const baseImageBuffer = await this.downloadImage(imageUrl);

            // Get image dimensions
            const metadata = await sharp(baseImageBuffer).metadata();
            const width = metadata.width || 1024;
            const height = metadata.height || 1024;

            // Clean and parse text
            let headerText = '';
            let bodyText = '';

            try {
                // Try to parse if it's the JSON from OpenAI
                const parsed = JSON.parse(text);
                if (parsed.header || parsed.body) {
                    headerText = parsed.header ? parsed.header.replace(/\*\*/g, '').replace(/\*/g, '') : '';
                    bodyText = parsed.body ? parsed.body.replace(/\*\*/g, '').replace(/\*/g, '') : '';
                } else {
                    headerText = text.replace(/\*\*/g, '').replace(/\*/g, '');
                }
            } catch (e) {
                // Not JSON, just normal text
                headerText = text.replace(/\*\*/g, '').replace(/\*/g, '');
            }

            // Optional styling defaults
            const baseFontSize = options?.fontSize || Math.floor(height * 0.055); // 5.5% of height by default
            const headerFontSize = Math.floor(baseFontSize * 1.3); // Header is 30% larger
            const bodyFontSize = Math.floor(baseFontSize * 0.85); // Body is 15% smaller
            const fontColor = options?.fontColor || '#FFFFFF';
            const fontFamily = options?.fontFamily || 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif';

            // Text alignment parsing
            const layoutPos = options?.layoutPosition || 'center';
            let alignX = '50%';
            let alignY = '50%';
            let textAnchor = 'middle';
            let dominantBaseline = 'middle';

            if (layoutPos.includes('top')) {
                alignY = '10%';
                dominantBaseline = 'hanging';
            } else if (layoutPos.includes('bottom')) {
                alignY = '85%';
                dominantBaseline = 'auto'; // Will calculate exact Y later
            }

            // X positioning with 10% padding
            if (layoutPos.includes('left')) {
                alignX = '8%'; // A bit closer to the edge for better utilization
                textAnchor = 'start';
            } else if (layoutPos.includes('right')) {
                alignX = '92%';
                textAnchor = 'end';
            }

            // Helper to wrap text into lines
            const wrapText = (textObj: string, fontSize: number, maxWidthRatio: number) => {
                const words = textObj.split(' ');
                let linesObj = [];
                let currentLine = '';
                const characterWidth = fontSize * 0.55;
                const maxCharsPerLine = Math.floor((width * maxWidthRatio) / characterWidth);

                for (const word of words) {
                    if ((currentLine + word).length > maxCharsPerLine) {
                        linesObj.push(currentLine.trim());
                        currentLine = word + ' ';
                    } else {
                        currentLine += word + ' ';
                    }
                }
                if (currentLine.trim()) linesObj.push(currentLine.trim());
                return linesObj;
            };

            const headerLines = headerText ? wrapText(headerText, headerFontSize, 0.84) : [];
            const bodyLines = bodyText ? wrapText(bodyText, bodyFontSize, 0.84) : [];

            // Calculate heights and start positions
            const headerLineHeight = headerFontSize * 1.25;
            const bodyLineHeight = bodyFontSize * 1.4;

            const totalHeaderHeight = headerLines.length * headerLineHeight;
            const totalBodyHeight = bodyLines.length * bodyLineHeight;

            // Gap between header and body
            const sectionGap = (headerText && bodyText) ? headerFontSize * 0.8 : 0;
            const totalBlockHeight = totalHeaderHeight + sectionGap + totalBodyHeight;

            // Determine starting Y point based on alignment
            let startY = 0;
            if (alignY === '50%') {
                startY = -(totalBlockHeight / 2) + (headerLineHeight / 2);
            } else if (alignY === '85%') {
                // If bottom-aligned, start Y such that the BOTTOM of the body hits alignY
                startY = -(totalBlockHeight) + headerLineHeight;
            } else {
                // Top aligned
                startY = 0;
            }

            // Build TSpans for Header
            const headerTspans = headerLines.map((line, index) => {
                const dy = index === 0 ? startY : headerLineHeight;
                return `<tspan x="${alignX}" dy="${dy}" class="header-text">${line}</tspan>`;
            }).join('');

            // Build TSpans for Body
            const bodyTspans = bodyLines.map((line, index) => {
                // If it's the first line of the body, we jump down by the section gap + body line height
                // relative to the last header line (or 0 if no header)
                const dy = index === 0
                    ? (headerLines.length > 0 ? sectionGap + bodyLineHeight : startY)
                    : bodyLineHeight;
                return `<tspan x="${alignX}" dy="${dy}" class="body-text">${line}</tspan>`;
            }).join('');

            // Create SVG string with an advanced drop shadow filter
            const svgText = `
                <svg width="${width}" height="${height}">
                    <defs>
                        <filter id="dropshadow" x="-20%" y="-20%" width="140%" height="140%">
                            <feDropShadow dx="0" dy="4" stdDeviation="8" flood-color="#000000" flood-opacity="0.85" />
                            <feDropShadow dx="0" dy="0" stdDeviation="15" flood-color="#000000" flood-opacity="0.5" />
                        </filter>
                    </defs>
                    <style>
                        .text-group {
                            fill: ${fontColor};
                            font-family: ${fontFamily};
                            letter-spacing: -0.01em;
                        }
                        .header-text { 
                            font-size: ${headerFontSize}px; 
                            font-weight: 900; /* Super Bold Top Hook */
                            letter-spacing: -0.03em;
                        }
                        .body-text {
                            font-size: ${bodyFontSize}px;
                            font-weight: 500; /* Medium weight for explanation */
                            fill: ${fontColor === '#FFFFFF' ? '#EAEAEA' : '#333333'}; /* Slightly dim the body text for hierarchy */
                        }
                    </style>
                    <text class="text-group" x="${alignX}" y="${alignY}" text-anchor="${textAnchor}" dominant-baseline="${dominantBaseline}" filter="url(#dropshadow)">
                        ${headerTspans}
                        ${bodyTspans}
                    </text>
                </svg>
            `;

            const svgBuffer: Buffer = Buffer.from(svgText);

            // Composite the SVG over the base image
            const resultBuffer = await sharp(baseImageBuffer)
                .composite([
                    {
                        input: svgBuffer,
                        blend: 'over',
                    }
                ])
                .png()
                .toBuffer();

            this.logger.log(`Successfully generated overlayed image buffer.`);

            // Upload the buffer to Supabase Storage
            if (!this.supabase) {
                this.logger.error('Cannot upload image: Supabase client is not initialized due to missing credentials.');
                throw new Error('Storage configuration is missing. Please configure SUPABASE_URL and Keys.');
            }

            const fileName = `overlay-${Date.now()}-${Math.random().toString(36).substring(7)}.png`;
            const { data, error } = await this.supabase.storage
                .from('instagram-studio')
                .upload(`slides/${fileName}`, resultBuffer, {
                    contentType: 'image/png',
                    cacheControl: '3600',
                    upsert: false
                });

            if (error) {
                this.logger.error(`Supabase Upload Error: ${error.message}`);
                throw new Error(`Failed to upload to storage: ${error.message}`);
            }

            const { data: publicUrlData } = this.supabase.storage
                .from('instagram-studio')
                .getPublicUrl(`slides/${fileName}`);

            return publicUrlData.publicUrl;

        } catch (error) {
            this.logger.error(`Failed to overlay text: ${error.message}`);
            throw new Error(`Text overlay failed: ${error.message}`);
        }
    }
}
