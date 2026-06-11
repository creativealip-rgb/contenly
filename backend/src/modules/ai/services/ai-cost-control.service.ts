import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export type AiFeature =
  | 'article_generation'
  | 'seo_generation'
  | 'image_generation'
  | 'prompt_generation';

export interface AiCostGuardInput {
  userId?: string;
  feature: AiFeature;
  model?: string;
  prompt: string;
  maxOutputTokens?: number;
}

export interface AiCostEstimate {
  promptChars: number;
  estimatedPromptTokens: number;
  estimatedTotalTokens: number;
  maxPromptChars: number;
  maxEstimatedTokens: number;
}

const DEFAULT_MAX_PROMPT_CHARS: Record<AiFeature, number> = {
  article_generation: 24000,
  seo_generation: 12000,
  image_generation: 1200,
  prompt_generation: 3000,
};

const DEFAULT_MAX_ESTIMATED_TOKENS: Record<AiFeature, number> = {
  article_generation: 10000,
  seo_generation: 4000,
  image_generation: 1000,
  prompt_generation: 2500,
};

@Injectable()
export class AiCostControlService {
  private readonly logger = new Logger(AiCostControlService.name);

  constructor(private readonly configService: ConfigService) {}

  guardPrompt(input: AiCostGuardInput): AiCostEstimate {
    const promptChars = input.prompt.length;
    const estimatedPromptTokens = this.estimateTokens(input.prompt);
    const estimatedTotalTokens =
      estimatedPromptTokens + (input.maxOutputTokens ?? 0);
    const maxPromptChars = this.getFeatureNumber(
      input.feature,
      'MAX_PROMPT_CHARS',
      DEFAULT_MAX_PROMPT_CHARS[input.feature],
    );
    const maxEstimatedTokens = this.getFeatureNumber(
      input.feature,
      'MAX_ESTIMATED_TOKENS',
      DEFAULT_MAX_ESTIMATED_TOKENS[input.feature],
    );

    if (promptChars > maxPromptChars) {
      throw new BadRequestException(
        `AI prompt too long for ${input.feature}. Max ${maxPromptChars} characters, received ${promptChars}.`,
      );
    }

    if (estimatedTotalTokens > maxEstimatedTokens) {
      throw new BadRequestException(
        `AI token estimate too high for ${input.feature}. Max ${maxEstimatedTokens}, estimated ${estimatedTotalTokens}.`,
      );
    }

    return {
      promptChars,
      estimatedPromptTokens,
      estimatedTotalTokens,
      maxPromptChars,
      maxEstimatedTokens,
    };
  }

  resolveModel(primaryModel: string, fallbackModel?: string): string {
    const trimmed = primaryModel?.trim();
    if (trimmed) return trimmed;

    const fallback =
      fallbackModel?.trim() ||
      this.configService.get<string>('AI_FALLBACK_MODEL')?.trim();
    if (fallback) return fallback;

    throw new BadRequestException(
      'AI model is not configured. Set model or AI_FALLBACK_MODEL.',
    );
  }

  logUsage(
    input: AiCostGuardInput,
    estimate: AiCostEstimate,
    actualTokens?: number,
  ): void {
    this.logger.log({
      event: 'ai_usage_estimate',
      feature: input.feature,
      userId: input.userId ?? 'anonymous',
      model: input.model ?? 'unknown',
      promptChars: estimate.promptChars,
      estimatedPromptTokens: estimate.estimatedPromptTokens,
      estimatedTotalTokens: estimate.estimatedTotalTokens,
      actualTokens,
    });
  }

  estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }

  private getFeatureNumber(
    feature: AiFeature,
    suffix: string,
    fallback: number,
  ): number {
    const key = `AI_${feature.toUpperCase()}_${suffix}`;
    const value = Number(this.configService.get<string>(key));
    return Number.isFinite(value) && value > 0 ? value : fallback;
  }
}
