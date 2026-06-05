import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { sql } from 'drizzle-orm';
import { SessionAuthGuard } from '../../common/guards/session-auth.guard';
import { SuperAdminGuard } from '../../common/guards/super-admin.guard';
import { DrizzleService } from '../../db/drizzle.service';

interface ModelConfigDto {
  textModel?: string;
  imageModel?: string;
}

@Controller('admin/settings')
@UseGuards(SessionAuthGuard, SuperAdminGuard)
export class AdminSettingsController {
  constructor(
    private readonly config: ConfigService,
    private readonly drizzle: DrizzleService,
  ) {}

  private get baseUrl() {
    return (this.config.get<string>('OPENAI_BASE_URL') || 'https://9router-168-144-37-19.sslip.io/v1').replace(/\/$/, '');
  }

  private get apiKey() {
    return (this.config.get<string>('OPENAI_API_KEY') || '').trim();
  }

  private get defaultTextModel() {
    return (this.config.get<string>('OPENAI_MODEL') || 'cz/gpt-5.5').trim();
  }

  private get defaultImageModel() {
    return (this.config.get<string>('IMAGE_MODEL') || this.config.get<string>('IMAGE_GENERATION_MODEL') || 'cx/gpt-5.4-image').trim();
  }

  private async ensureSettingsTable() {
    await this.drizzle.db.execute(sql`
      CREATE TABLE IF NOT EXISTS system_settings (
        key text PRIMARY KEY,
        value text NOT NULL,
        created_at timestamp NOT NULL DEFAULT now(),
        updated_at timestamp NOT NULL DEFAULT now()
      )
    `);
  }

  private async getSetting(key: string, fallback = ''): Promise<string> {
    await this.ensureSettingsTable();
    const result = await this.drizzle.db.execute(sql`SELECT value FROM system_settings WHERE key = ${key} LIMIT 1`);
    const rows = Array.isArray(result) ? result : ((result as any).rows || []);
    return rows[0]?.value ?? fallback;
  }

  private async setSetting(key: string, value: string) {
    await this.ensureSettingsTable();
    await this.drizzle.db.execute(sql`
      INSERT INTO system_settings (key, value, updated_at)
      VALUES (${key}, ${value}, now())
      ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()
    `);
  }

  @Get('providers/status')
  async getProvidersStatus() {
    return [
      {
        provider: '9router',
        label: '9Router',
        status: this.apiKey ? 'configured' : 'missing_key',
        baseUrl: this.baseUrl,
        textModel: await this.getSetting('model_text_generation', this.defaultTextModel),
        imageModel: await this.getSetting('model_image_generation', this.defaultImageModel),
      },
    ];
  }

  @Get('models/config')
  async getModelConfig() {
    return {
      textProvider: '9router',
      imageProvider: '9router',
      textModel: await this.getSetting('model_text_generation', this.defaultTextModel),
      imageModel: await this.getSetting('model_image_generation', this.defaultImageModel),
    };
  }

  @Post('models/config')
  async saveModelConfig(@Body() dto: ModelConfigDto) {
    const textModel = dto.textModel?.trim();
    const imageModel = dto.imageModel?.trim();
    if (textModel) await this.setSetting('model_text_generation', textModel);
    if (imageModel) await this.setSetting('model_image_generation', imageModel);
    return this.getModelConfig();
  }

  @Get('providers/:provider/models')
  async listModels(@Param('provider') provider: string) {
    if (provider !== '9router') return { provider, models: [] };
    const response = await fetch(`${this.baseUrl}/models`, {
      headers: { Authorization: `Bearer ${this.apiKey}` },
      signal: AbortSignal.timeout(30000),
    });
    if (!response.ok) {
      return { provider, models: [], error: `Provider returned ${response.status}` };
    }
    const data: any = await response.json();
    const models = Array.isArray(data?.data) ? data.data : [];
    return {
      provider,
      models: models.map((model: any) => ({
        id: model.id,
        name: model.name || model.id,
        contextLength: model.context_length || model.contextLength || null,
      })),
    };
  }

  private parseProviderResponse(raw: string) {
    try {
      return JSON.parse(raw);
    } catch {
      const chunks = raw
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.startsWith('data: '))
        .map((line) => line.replace(/^data:\s*/, '').trim())
        .filter((line) => line && line !== '[DONE]');

      for (const chunk of chunks.reverse()) {
        try {
          const parsed = JSON.parse(chunk);
          if (parsed?.choices?.[0]?.message?.content || parsed?.error?.message) return parsed;
        } catch {
          // keep scanning older chunks
        }
      }
      return null;
    }
  }

  @Post('providers/:provider/test')
  async testProvider(@Param('provider') provider: string, @Body() dto: { model?: string; prompt?: string }) {
    if (provider !== '9router') return { ok: false, error: 'Unsupported provider' };
    const model = (dto.model || (await this.getSetting('model_text_generation', this.defaultTextModel))).trim();
    const started = Date.now();
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        stream: false,
        messages: [{ role: 'user', content: dto.prompt || 'Reply with OK for a short health check.' }],
        max_tokens: 20,
        temperature: 0,
      }),
      signal: AbortSignal.timeout(60000),
    });
    const raw = await response.text();
    const parsed: any = this.parseProviderResponse(raw);
    return {
      ok: response.ok,
      status: response.status,
      latencyMs: Date.now() - started,
      model,
      message: parsed?.choices?.[0]?.message?.content || parsed?.error?.message || raw.slice(0, 300),
    };
  }
}
