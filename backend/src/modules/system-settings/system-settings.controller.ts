import { Body, Controller, Delete, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
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

  private async getBaseUrl(): Promise<string> {
    const dbUrl = await this.getSetting('api_base_url', '');
    return (dbUrl || this.config.get<string>('OPENAI_BASE_URL') || 'https://9router-168-144-37-19.sslip.io/v1').replace(/\/$/, '');
  }

  private async getApiKey(): Promise<string> {
    const dbKey = await this.getSetting('api_key_9router', '');
    return (dbKey || this.config.get<string>('OPENAI_API_KEY') || '').trim();
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
        status: (await this.getApiKey()) ? 'configured' : 'missing_key',
        baseUrl: await this.getBaseUrl(),
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
    const baseUrl = await this.getBaseUrl();
    const apiKey = await this.getApiKey();
    const response = await fetch(`${baseUrl}/models`, {
      headers: { Authorization: `Bearer ${apiKey}` },
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
  async testProvider(@Param('provider') provider: string, @Body() dto: { model?: string; prompt?: string; type?: 'text' | 'image' }) {
    if (provider !== '9router') return { ok: false, error: 'Unsupported provider' };
    const type = dto.type || 'text';
    const started = Date.now();

    if (type === 'image') {
      const model = (dto.model || (await this.getSetting('model_image_generation', this.defaultImageModel))).trim();
      const apiKey = await this.getSetting(
        'image_api_key',
        this.config.get('IMAGE_API_KEY') || this.config.get('CODEX_API_KEY') || (await this.getApiKey()),
      );
      const imageBaseUrl = await this.getSetting(
        'image_base_url',
        this.config.get('IMAGE_BASE_URL') || this.config.get('CODEX_BASE_URL') || (await this.getBaseUrl()),
      );
      
      const response = await fetch(`${imageBaseUrl}/images/generations`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          prompt: dto.prompt || 'A beautiful futuristic workspace with a computer screen showing "OK" in glowing cyan text',
          n: 1,
          size: model.includes('gpt-5.5-image') ? 'auto' : '1080x1350',
          quality: 'auto',
          background: 'auto',
          image_detail: 'low',
          output_format: 'png',
        }),
        signal: AbortSignal.timeout(60000),
      });

      const raw = await response.text();
      let parsed: any;
      try {
        parsed = JSON.parse(raw);
      } catch {
        parsed = null;
      }

      return {
        ok: response.ok,
        status: response.status,
        latencyMs: Date.now() - started,
        model,
        message: parsed?.data?.[0]?.url || parsed?.error?.message || raw.slice(0, 300),
      };
    }

    const model = (dto.model || (await this.getSetting('model_text_generation', this.defaultTextModel))).trim();
    const baseUrl = await this.getBaseUrl();
    const apiKey = await this.getApiKey();
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
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

  // ─── General Settings CRUD ─────────────────────────────────────────

  @Get()
  async listSettings(@Query('category') category?: string) {
    await this.ensureSettingsTable();
    let rows: any[];
    if (category) {
      const result = await this.drizzle.db.execute(sql`
        SELECT key, value, created_at, updated_at FROM system_settings
        WHERE key LIKE ${category + '%'} OR key LIKE 'api_key_%' OR key LIKE 'custom_provider_%' OR key LIKE 'cookie_%'
        ORDER BY key
      `);
      rows = Array.isArray(result) ? result : ((result as any).rows || []);
    } else {
      const result = await this.drizzle.db.execute(sql`
        SELECT key, value, created_at, updated_at FROM system_settings ORDER BY key
      `);
      rows = Array.isArray(result) ? result : ((result as any).rows || []);
    }
    return rows;
  }

  @Post()
  async saveSetting(@Body() dto: { key: string; value: string }) {
    if (!dto.key) return { ok: false, error: 'key required' };
    await this.setSetting(dto.key, dto.value);
    return { ok: true, key: dto.key };
  }

  // ─── Custom Providers CRUD ─────────────────────────────────────────

  @Get('custom-providers')
  async listCustomProviders() {
    await this.ensureSettingsTable();
    const result = await this.drizzle.db.execute(sql`
      SELECT key, value FROM system_settings WHERE key LIKE 'custom_provider_%'
    `);
    const rows: any[] = Array.isArray(result) ? result : ((result as any).rows || []);
    return rows.map(r => {
      try {
        const data = JSON.parse(r.value);
        return { id: r.key.replace('custom_provider_', ''), ...data };
      } catch { return null; }
    }).filter(Boolean);
  }

  @Post('custom-provider')
  async addCustomProvider(@Body() dto: { label: string; baseUrl: string; apiKey: string; models?: string }) {
    if (!dto.label || !dto.baseUrl || !dto.apiKey) {
      return { ok: false, error: 'label, baseUrl, and apiKey required' };
    }
    const id = dto.label.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
    const value = JSON.stringify({
      label: dto.label,
      baseUrl: dto.baseUrl.replace(/\/+$/, ''),
      apiKey: dto.apiKey,
      models: dto.models ? dto.models.split(',').map(m => m.trim()).filter(Boolean) : [],
    });
    await this.setSetting(`custom_provider_${id}`, value);
    return { ok: true, id };
  }

  @Delete('custom-provider/:id')
  async deleteCustomProvider(@Param('id') id: string) {
    await this.ensureSettingsTable();
    await this.drizzle.db.execute(sql`DELETE FROM system_settings WHERE key = ${'custom_provider_' + id}`);
    return { ok: true };
  }

  // ─── Validate API Key ──────────────────────────────────────────────

  @Post('validate')
  async validateApiKey(@Body() dto: { provider: string; apiKey: string; baseUrl?: string }) {
    const baseUrl = (dto.baseUrl || await this.getBaseUrl()).replace(/\/+$/, '');
    try {
      const response = await fetch(`${baseUrl}/models`, {
        headers: { Authorization: `Bearer ${dto.apiKey}` },
        signal: AbortSignal.timeout(10000),
      });
      if (response.ok) {
        const data: any = await response.json();
        const models = Array.isArray(data?.data) ? data.data : [];
        const modelIds = models.map((m: any) => m.id);
        return { valid: true, models: modelIds, modelCount: modelIds.length };
      }
      return { valid: false, error: `HTTP ${response.status}` };
    } catch (e: any) {
      return { valid: false, error: e.message };
    }
  }

  // ─── YouTube Cookies ───────────────────────────────────────────────

  @Get('cookie/youtube/status')
  async getYouTubeCookieStatus() {
    const cookie = await this.getSetting('cookie_youtube', '');
    return {
      connected: !!cookie,
      hasCookie: !!cookie,
      updatedAt: cookie ? 'stored' : null,
    };
  }

  @Post('cookie/youtube/save')
  async saveYouTubeCookies(@Body() dto: { cookies: string }) {
    if (!dto.cookies?.trim()) return { ok: false, error: 'cookies required' };
    const raw = dto.cookies.trim();
    const parsed = this.parseCookieFormat(raw);
    await this.setSetting('cookie_youtube', parsed);
    return { ok: true, cookieCount: (parsed.match(/;/g) || []).length + 1 };
  }

  private parseCookieFormat(raw: string): string {
    const TAB = String.fromCharCode(9); // actual tab character
    // Already HTTP header format (key=value; key=value)
    if (raw.includes('=') && !raw.includes(TAB) && (raw.includes(';') || !raw.includes('\n'))) {
      return raw;
    }
    // Netscape format: domain<TAB>TRUE<TAB>/<TAB>FALSE<TAB>expiry<TAB>name<TAB>value
    const lines = raw.split('\n');
    const cookies: string[] = [];
    let currentName = '';
    let currentValue = '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;

      const parts = line.split(TAB);
      if (parts.length >= 7) {
        if (currentName && currentValue) {
          cookies.push(`${currentName}=${currentValue}`);
        }
        currentName = parts[5]?.trim() || '';
        currentValue = parts[6]?.trim() || '';
      } else if (currentName && !line.includes(TAB)) {
        // Continuation line for long wrapped values
        currentValue += trimmed;
      }
    }
    if (currentName && currentValue) {
      cookies.push(`${currentName}=${currentValue}`);
    }
    return cookies.length > 0 ? cookies.join('; ') : raw;
  }

  @Post('cookie/youtube/test')
  async testYouTubeCookies() {
    const cookie = await this.getSetting('cookie_youtube', '');
    if (!cookie) return { ok: false, error: 'No cookies saved' };
    try {
      const response = await fetch('https://www.youtube.com/', {
        headers: { Cookie: cookie, 'User-Agent': 'Mozilla/5.0' },
        signal: AbortSignal.timeout(10000),
      });
      return { ok: response.ok, status: response.status };
    } catch (e: any) {
      return { ok: false, error: e.message };
    }
  }

  @Delete('cookie/youtube')
  async deleteYouTubeCookies() {
    await this.ensureSettingsTable();
    await this.drizzle.db.execute(sql`DELETE FROM system_settings WHERE key = 'cookie_youtube'`);
    return { ok: true };
  }
}
