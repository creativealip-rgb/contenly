import { Injectable } from '@nestjs/common';
import { OpenAiService } from '../../ai/services/openai.service';
import * as fs from 'fs';

interface StoryboardSlide {
  slide_number: number;
  text_content: string;
  visual_prompt: string;
  layout_position: string;
}

interface StoryboardResult {
  total_slides: number;
  slides: StoryboardSlide[];
}

@Injectable()
export class StoryboardService {
  constructor(private openAiService: OpenAiService) { }

  async generateStoryboard(
    content: string,
    style: string = 'modern minimal',
    targetSlides?: number,
    model?: string,
  ): Promise<StoryboardResult> {
    const systemPrompt = this.buildSystemPrompt(style, targetSlides);
    const userPrompt = this.buildUserPrompt(content);

    const response = await this.openAiService.generateContent(userPrompt, {
      mode: 'custom',
      systemPrompt,
      responseFormat: 'json',
      model,
    } as any);

    return this.parseResponse(response);
  }

  private buildSystemPrompt(style: string, targetSlides?: number): string {
    const slideGuidance = targetSlides
      ? `Create exactly ${targetSlides} slides.`
      : `Determine optimal slide count (4-8) based on content complexity.`;

    return `You are an expert Instagram content creator and copywriter for a top-tier technology/news media outlet.

TASK: Analyze the provided content and create a highly engaging storyboard for an Instagram carousel.

STYLE & TONE: ${style}
LANGUAGE: Indonesian (Bahasa Indonesia yang engaging, kekinian, namun tetap profesional dan berbobot).
RULES FOR TEXT CONTENT:
- Slide 1: Must be a strong, curiosity-inducing "Hook" (Headline) and a brief opening caption.
- Slide 2-N: Each slide MUST HAVE BOTH a Headline and a Caption paragraph.
- Format the \`text_content\` exactly like this:
"**[YOUR PUNCHY HEADLINE HERE]**\n\n[Your captivating 2-3 sentence explanation here]"
- The Headline must be short (max 6 words). The Caption must provide the context.

RULES FOR VISUAL PROMPTS (For Image Generation):
- Visual prompts MUST be extremely exhaustive and professional (min 40 words).
- Include SPECIFICS: Lighting (e.g., volumetric lighting, neon glow), Camera Angle (e.g., low angle, close-up, wide shot), Atmosphere (e.g., futuristic, tense, mystical), and color palette.
- ALL slides MUST share the EXACT SAME style keywords and color palette to ensure a cohesive carousel.
- ALWAYS specify "negative space" and clean backgrounds (e.g., "deep black background with ample negative space at the right") so the text can be overlaid easily.
- The visual prompt MUST end with a newline containing ONLY the aspect ratio parameter: "\\n~4:5"
- Example: "Cinematic medium shot of a glowing blue cybernetic brain floating over a metallic pedestal. Volumetric lighting, deep shadows, neon cyan accents. Photorealistic 8k render, Unreal Engine 5 aesthetic. Deep black background with ample negative space at the top for text placement\\n~4:5"

LAYOUT POSITIONS:
- Choose logical text placements based on where the negative space is in your visual prompt: top-left, top-center, top-right, center-left, center, center-right, bottom-left, bottom-center, bottom-right.

OUTPUT FORMAT (JSON only, no markdown):
{
    "total_slides": 5,
    "slides": [
        {
            "slide_number": 1,
            "text_content": "**Deepfake: Fitnah Dajjal 'Kecil' di Tahun 2026**\\n\\nSaat mata dan telinga tak lagi bisa dipercaya. Ancaman ini bukan sekadar alat politik, tapi sudah berubah menjadi mesin penipu raksasa yang merusak akal sehat.",
            "visual_prompt": "Cinematic close-up of a digital human face disintegrating into glowing blue data particles. Volumetric dramatic lighting, deep shadows, neon cyan and deep blue color palette. Photorealistic 8k octane render. Deep black background with ample negative space at the top for clean text overlay\\n~4:5",
            "layout_position": "top-center"
        }
    ]
}

CRITICAL: DO NOT INCLUDE ANY HTML TAGS OR MARKDOWN HEADERS IN YOUR RESPONSE. ONLY OUTPUT THE PURE JSON OBJECT.`;
  }

  private buildUserPrompt(content: string): string {
    return `Please transform the following content into a viral Instagram carousel storyboard. Extract the most shocking, interesting, or valuable points and turn them into punchy slide texts.

--- CONTENT SOURCE ---
${content.slice(0, 4000)}
----------------------

Remember: Output valid JSON only. Ensure the visual prompts enforce a single, unifying aesthetic across all slides.`;
  }

  private parseResponse(parsed: any): StoryboardResult {
    console.log('--- RAW AI RESPONSE (Parsed) ---');
    console.log(JSON.stringify(parsed, null, 2));
    console.log('-----------------------');

    try {
      fs.writeFileSync(
        'ai_response_log.txt',
        JSON.stringify(parsed, null, 2),
        'utf-8',
      );
    } catch (e) {
      console.error('Could not write log file', e);
    }

    try {
      if (!parsed || typeof parsed !== 'object') {
        throw new Error('AI returned an empty or invalid response object');
      }

      if (!parsed.slides || !Array.isArray(parsed.slides)) {
        throw new Error('Invalid storyboard structure. Missing slides array.');
      }

      return {
        total_slides: parsed.total_slides || parsed.slides.length,
        slides: parsed.slides.map((slide: any, index: number) => ({
          slide_number: slide.slide_number || index + 1,
          text_content: slide.text_content || '',
          visual_prompt: slide.visual_prompt || '',
          layout_position: slide.layout_position || 'center',
        })),
      };
    } catch (error) {
      console.error('Failed to parse storyboard response:', error);
      throw new Error(`Failed to parse AI response: ${error.message} `);
    }
  }
}
