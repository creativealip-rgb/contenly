import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AiCostControlService } from './ai-cost-control.service';

describe('AiCostControlService', () => {
  const createDb = (monthlySpend = 0) => ({
    select: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    where: jest.fn().mockResolvedValue([{ total: monthlySpend }]),
    insert: jest.fn().mockReturnThis(),
    values: jest.fn().mockResolvedValue(undefined),
  });

  const createService = (
    env: Record<string, string> = {},
    monthlySpend = 0,
  ) => {
    const db = createDb(monthlySpend);
    return {
      service: new AiCostControlService(
        {
          get: jest.fn((key: string) => env[key]),
        } as unknown as ConfigService,
        { db } as any,
      ),
      db,
    };
  };

  it('estimates prompt and total tokens', () => {
    const { service } = createService();

    const estimate = service.guardPrompt({
      feature: 'article_generation',
      model: 'gpt-4o-mini',
      prompt: 'abcd'.repeat(100),
      maxOutputTokens: 100,
    });

    expect(estimate.promptChars).toBe(400);
    expect(estimate.estimatedPromptTokens).toBe(100);
    expect(estimate.estimatedTotalTokens).toBe(200);
  });

  it('rejects prompts over feature character cap', () => {
    const { service } = createService({
      AI_IMAGE_GENERATION_MAX_PROMPT_CHARS: '10',
    });

    expect(() =>
      service.guardPrompt({
        feature: 'image_generation',
        prompt: 'x'.repeat(11),
      }),
    ).toThrow(BadRequestException);
  });

  it('rejects prompts over feature token estimate cap', () => {
    const { service } = createService({
      AI_PROMPT_GENERATION_MAX_ESTIMATED_TOKENS: '10',
    });

    expect(() =>
      service.guardPrompt({
        feature: 'prompt_generation',
        prompt: 'x'.repeat(24),
        maxOutputTokens: 5,
      }),
    ).toThrow('AI token estimate too high for prompt_generation');
  });

  it('uses fallback model when primary model empty', () => {
    const { service } = createService({
      AI_FALLBACK_MODEL: 'openai/gpt-4o-mini',
    });

    expect(service.resolveModel('')).toBe('openai/gpt-4o-mini');
  });

  it('rejects when monthly spend cap would be exceeded', async () => {
    const { service } = createService(
      {
        AI_MONTHLY_SPEND_CAP_USD: '0.01',
        AI_DEFAULT_PRICE_PER_MILLION_TOKENS_USD: '10',
      },
      0.009,
    );
    const estimate = service.guardPrompt({
      userId: 'user-1',
      feature: 'article_generation',
      model: 'expensive-model',
      prompt: 'abcd'.repeat(100),
      maxOutputTokens: 200,
    });

    await expect(
      service.guardMonthlySpend(
        {
          userId: 'user-1',
          feature: 'article_generation',
          model: 'expensive-model',
          prompt: 'abcd'.repeat(100),
          maxOutputTokens: 200,
        },
        estimate,
      ),
    ).rejects.toThrow('AI monthly spending cap reached');
  });

  it('records estimated AI spend as transaction metadata', async () => {
    const { service, db } = createService({
      AI_DEFAULT_PRICE_PER_MILLION_TOKENS_USD: '2',
    });
    const input = {
      userId: 'user-1',
      feature: 'image_generation' as const,
      model: 'image-model',
      prompt: 'abcd'.repeat(100),
      maxOutputTokens: 0,
    };
    const estimate = service.guardPrompt(input);

    await service.recordSpend(input, estimate);

    expect(db.values).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-1',
        type: 'USAGE',
        amount: estimate.estimatedCostUsd,
        tokens: 0,
        status: 'COMPLETED',
        metadata: expect.objectContaining({
          source: 'ai_cost_control',
          feature: 'image_generation',
          model: 'image-model',
        }),
      }),
    );
  });
});
