import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AiCostControlService } from './ai-cost-control.service';

describe('AiCostControlService', () => {
  const createService = (env: Record<string, string> = {}) =>
    new AiCostControlService({
      get: jest.fn((key: string) => env[key]),
    } as unknown as ConfigService);

  it('estimates prompt and total tokens', () => {
    const service = createService();

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
    const service = createService({
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
    const service = createService({
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
    const service = createService({ AI_FALLBACK_MODEL: 'openai/gpt-4o-mini' });

    expect(service.resolveModel('')).toBe('openai/gpt-4o-mini');
  });
});
