import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { sql } from 'drizzle-orm';
import { DrizzleService } from '../../../db/drizzle.service';
import { transaction } from '../../../db/schema';

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
  estimatedCostUsd: number;
  monthlySpentUsd?: number;
  monthlyCapUsd?: number;
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

  constructor(
    private readonly configService: ConfigService,
    private readonly drizzle: DrizzleService,
  ) {}

  get db() {
    return this.drizzle.db;
  }

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
    const estimatedCostUsd = this.estimateCostUsd(
      input.model,
      estimatedTotalTokens,
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
      estimatedCostUsd,
    };
  }

  async guardMonthlySpend(
    input: AiCostGuardInput,
    estimate: AiCostEstimate,
  ): Promise<AiCostEstimate> {
    if (!input.userId) return estimate;

    const monthlyCapUsd = this.getMonthlyCapUsd(input.feature);
    if (monthlyCapUsd <= 0) return estimate;

    const monthlySpentUsd = await this.getMonthlyAiSpendUsd(input.userId);
    if (monthlySpentUsd + estimate.estimatedCostUsd > monthlyCapUsd) {
      throw new BadRequestException(
        `AI monthly spending cap reached. Cap $${monthlyCapUsd.toFixed(2)}, current $${monthlySpentUsd.toFixed(4)}, estimated request $${estimate.estimatedCostUsd.toFixed(4)}.`,
      );
    }

    return { ...estimate, monthlySpentUsd, monthlyCapUsd };
  }

  async recordSpend(
    input: AiCostGuardInput,
    estimate: AiCostEstimate,
  ): Promise<void> {
    if (!input.userId || estimate.estimatedCostUsd <= 0) return;

    await this.db.insert(transaction).values({
      userId: input.userId,
      type: 'USAGE',
      amount: estimate.estimatedCostUsd,
      tokens: 0,
      status: 'COMPLETED',
      metadata: {
        source: 'ai_cost_control',
        feature: input.feature,
        model: input.model ?? 'unknown',
        estimatedTotalTokens: estimate.estimatedTotalTokens,
      },
    });
  }

  async getMonthlyAiSpendUsd(userId: string): Promise<number> {
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const rows = await this.db
      .select({ total: sql<number>`coalesce(sum(${transaction.amount}), 0)` })
      .from(transaction)
      .where(
        sql`${transaction.userId} = ${userId}
          and ${transaction.type} = 'USAGE'
          and ${transaction.status} = 'COMPLETED'
          and ${transaction.createdAt} >= ${monthStart.toISOString()}
          and ${transaction.metadata}->>'source' = 'ai_cost_control'`,
      );

    return Number(rows[0]?.total || 0);
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

  estimateCostUsd(
    model: string | undefined,
    estimatedTotalTokens: number,
  ): number {
    const pricePerMillion = this.getModelPricePerMillion(model);
    return (estimatedTotalTokens / 1_000_000) * pricePerMillion;
  }

  private getMonthlyCapUsd(feature: AiFeature): number {
    const featureCap = Number(
      this.configService.get<string>(
        `AI_${feature.toUpperCase()}_MONTHLY_SPEND_CAP_USD`,
      ),
    );
    if (Number.isFinite(featureCap) && featureCap > 0) return featureCap;

    const globalCap = Number(
      this.configService.get<string>('AI_MONTHLY_SPEND_CAP_USD'),
    );
    return Number.isFinite(globalCap) && globalCap > 0 ? globalCap : 0;
  }

  private getModelPricePerMillion(model?: string): number {
    const normalized = (model || 'default')
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, '_');
    const modelOverride = Number(
      this.configService.get<string>(
        `AI_MODEL_PRICE_PER_MILLION_${normalized}`,
      ),
    );
    if (Number.isFinite(modelOverride) && modelOverride > 0)
      return modelOverride;

    const defaultPrice = Number(
      this.configService.get<string>('AI_DEFAULT_PRICE_PER_MILLION_TOKENS_USD'),
    );
    return Number.isFinite(defaultPrice) && defaultPrice > 0 ? defaultPrice : 1;
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
