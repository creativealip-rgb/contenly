import { Injectable, Logger } from '@nestjs/common';
import { DrizzleService } from '../../db/drizzle.service';
import { systemSettings } from '../../db/schema';
import { eq } from 'drizzle-orm';

@Injectable()
export class SystemSettingsService {
  private readonly logger = new Logger(SystemSettingsService.name);

  constructor(private readonly drizzle: DrizzleService) {}

  async getAll(category?: string) {
    const query = this.drizzle.db.select().from(systemSettings);
    if (category) {
      query.where(eq(systemSettings.category, category));
    }
    return query;
  }

  async getByKey(key: string) {
    const [row] = await this.drizzle.db
      .select()
      .from(systemSettings)
      .where(eq(systemSettings.key, key))
      .limit(1);
    return row;
  }

  async set(key: string, value: string, opts?: { encrypted?: boolean; category?: string; description?: string }) {
    const existing = await this.getByKey(key);
    if (existing) {
      await this.drizzle.db
        .update(systemSettings)
        .set({ value, updatedAt: new Date(), ...opts })
        .where(eq(systemSettings.key, key));
    } else {
      await this.drizzle.db.insert(systemSettings).values({
        key,
        value,
        encrypted: opts?.encrypted ?? true,
        category: opts?.category ?? 'api-keys',
        description: opts?.description,
      });
    }
    return this.getByKey(key);
  }

  async delete(key: string) {
    await this.drizzle.db.delete(systemSettings).where(eq(systemSettings.key, key));
    return { deleted: true };
  }

  // --- Validate API Key ---
  async validateKey(provider: string, apiKey: string) {
    const baseUrl = this.getProviderBaseUrl(provider);
    const startTime = Date.now();

    try {
      // Try listing models as a lightweight validation
      const res = await fetch(`${baseUrl}/v1/models`, {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      const latency = Date.now() - startTime;

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        return { valid: false, error: err.error?.message || `HTTP ${res.status}`, latency };
      }

      const data = await res.json();
      const modelCount = data.data?.length || 0;
      return { valid: true, modelCount, latency };
    } catch (e: any) {
      return { valid: false, error: e.message, latency: Date.now() - startTime };
    }
  }

  // --- Test AI Features ---
  async testChat(provider: string, model: string, prompt: string) {
    const keySetting = await this.getByKey(`api_key_${provider}`);
    if (!keySetting?.value) throw new Error(`No API key for ${provider}`);

    const baseUrl = this.getProviderBaseUrl(provider);
    const startTime = Date.now();

    const res = await fetch(`${baseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${keySetting.value}`,
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 200,
      }),
    });

    const latency = Date.now() - startTime;
    const data = await res.json();

    if (!res.ok) throw new Error(data.error?.message || `HTTP ${res.status}`);
    return { response: data.choices?.[0]?.message?.content, latency, model };
  }

  async testImage(provider: string, model: string, prompt: string) {
    const keySetting = await this.getByKey(`api_key_${provider}`);
    if (!keySetting?.value) throw new Error(`No API key for ${provider}`);

    const baseUrl = this.getProviderBaseUrl(provider);
    const startTime = Date.now();

    const res = await fetch(`${baseUrl}/v1/images/generations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${keySetting.value}`,
      },
      body: JSON.stringify({ model, prompt, n: 1, size: 'auto' }),
    });

    const latency = Date.now() - startTime;
    const data = await res.json();

    if (!res.ok) throw new Error(data.error?.message || `HTTP ${res.status}`);
    return { imageUrl: data.data?.[0]?.url || data.data?.[0]?.b64_json, latency, model };
  }

  private getProviderBaseUrl(provider: string): string {
    const urls: Record<string, string> = {
      openai: 'https://api.openai.com',
      openrouter: 'https://openrouter.ai',
      gemini: 'https://generativelanguage.googleapis.com/v1beta/openai',
      groq: 'https://api.groq.com/openai',
      deepseek: 'https://api.deepseek.com',
      mistral: 'https://api.mistral.ai',
    };
    return urls[provider] || `https://api.openai.com`;
  }
}
