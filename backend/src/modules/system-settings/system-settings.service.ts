import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DrizzleService } from '../../db/drizzle.service';
import { systemSettings } from '../../db/schema';
import { eq, and } from 'drizzle-orm';

@Injectable()
export class SystemSettingsService {
  private readonly logger = new Logger(SystemSettingsService.name);

  constructor(
    private readonly drizzle: DrizzleService,
    private readonly config: ConfigService,
  ) {}

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

  // --- Custom Providers (OpenAI-compatible endpoints, e.g. 9Router/LiteLLM) ---
  private normalizeBaseUrl(raw: string): string {
    // Strip trailing slashes and a trailing /v1 so callers append /v1/... uniformly
    return String(raw || '')
      .trim()
      .replace(/\/+$/, '')
      .replace(/\/v1$/, '');
  }

  private slugifyProviderId(input: string): string {
    return String(input || '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 40);
  }

  async getCustomProviders() {
    const rows = await this.getAll('custom-providers');
    return rows.map((r) => {
      let cfg: any = {};
      try {
        cfg = JSON.parse(r.value || '{}');
      } catch {
        /* ignore malformed */
      }
      const id = r.key.replace('custom_provider_', '');
      return {
        key: id,
        label: cfg.label || id,
        baseUrl: cfg.baseUrl || '',
        models: Array.isArray(cfg.models) ? cfg.models : [],
        custom: true as const,
      };
    });
  }

  async saveCustomProvider(body: {
    id?: string;
    label: string;
    baseUrl: string;
    models?: string[] | string;
    apiKey?: string;
  }) {
    const id = this.slugifyProviderId(body.id || body.label);
    if (!id) throw new Error('Label/ID provider tidak valid');

    const baseUrl = this.normalizeBaseUrl(body.baseUrl);
    if (!baseUrl) throw new Error('Base URL wajib diisi');

    const models = Array.isArray(body.models)
      ? body.models
      : String(body.models || '')
          .split(',')
          .map((m) => m.trim())
          .filter(Boolean);

    await this.set(
      `custom_provider_${id}`,
      JSON.stringify({ label: body.label || id, baseUrl, models }),
      {
        category: 'custom-providers',
        encrypted: false,
        description: `Custom provider ${body.label || id}`,
      },
    );

    if (body.apiKey && body.apiKey !== '\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022') {
      await this.set(`api_key_${id}`, body.apiKey, {
        category: 'api-keys',
        encrypted: true,
        description: `${id} API key`,
      });
    }

    return { saved: true, id, baseUrl, models };
  }

  async deleteCustomProvider(id: string) {
    await this.delete(`custom_provider_${id}`);
    await this.delete(`api_key_${id}`);
    return { deleted: true, id };
  }

  // --- Validate API Key ---
  async validateKey(provider: string, apiKey: string, baseUrlOverride?: string) {
    const baseUrl = baseUrlOverride
      ? this.normalizeBaseUrl(baseUrlOverride)
      : await this.getProviderBaseUrl(provider);
    const startTime = Date.now();

    try {
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

  // --- Cookie/Session-based auth for Codex & Antigravity ---
  async saveCookies(provider: string, cookies: string) {
    if (!['codex', 'antigravity'].includes(provider)) {
      throw new Error(`Cookie auth not supported for ${provider}`);
    }
    
    // Try to parse as JSON (session data format)
    let accessToken: string | null = null;
    let sessionData: any = null;
    
    try {
      sessionData = JSON.parse(cookies);
      if (sessionData.accessToken) {
        accessToken = sessionData.accessToken;
        this.logger.log(`Parsed session data for ${provider}, found accessToken`);
      }
    } catch {
      // Not JSON, treat as raw cookies
      this.logger.log(`Raw cookies format for ${provider}`);
    }
    
    // Store cookies/session data
    await this.set(`cookies_${provider}`, cookies, {
      category: 'cookies',
      description: `${provider} cookies/session for authentication`,
    });
    
    // Store access token separately if found
    if (accessToken) {
      await this.set(`access_token_${provider}`, accessToken, {
        category: 'cookies',
        description: `${provider} access token from session`,
      });
    }
    
    // Store timestamp
    await this.set(`cookies_${provider}_saved_at`, new Date().toISOString(), {
      category: 'cookies',
      description: `${provider} cookies saved timestamp`,
    });

    return { 
      success: true, 
      provider, 
      message: accessToken ? 'Session data saved with access token' : 'Cookies saved',
      hasAccessToken: !!accessToken
    };
  }

  async getCookieStatus(provider: string) {
    const cookies = await this.getByKey(`cookies_${provider}`);
    const savedAt = await this.getByKey(`cookies_${provider}_saved_at`);
    const accessToken = await this.getByKey(`access_token_${provider}`);

    if (!cookies?.value) {
      return { connected: false };
    }

    // Check if it's session data with expiry
    let expiresAt: string | null = null;
    try {
      const sessionData = JSON.parse(cookies.value);
      if (sessionData.expires) {
        expiresAt = sessionData.expires;
      }
    } catch {
      // Not JSON
    }

    return {
      connected: true,
      savedAt: savedAt?.value,
      hasAccessToken: !!accessToken?.value,
      expiresAt,
    };
  }

  async testCookies(provider: string) {
    const cookies = await this.getByKey(`cookies_${provider}`);
    if (!cookies?.value) {
      throw new Error(`No cookies found for ${provider}. Please save cookies first.`);
    }

    // YouTube: test by trying to fetch video metadata with cookies
    if (provider === 'youtube') {
      const startTime = Date.now();
      const { execFile } = require('child_process');
      const { promisify } = require('util');
      const execFileAsync = promisify(execFile);
      const fs = require('fs');
      const path = require('path');
      const os = require('os');

      const tmpFile = path.join(os.tmpdir(), 'yt-test-cookies.txt');
      await fs.promises.writeFile(tmpFile, cookies.value, 'utf-8');

      try {
        await execFileAsync('yt-dlp', [
          '--cookies', tmpFile,
          '--skip-download',
          '--print', '%(title)s',
          'https://www.youtube.com/watch?v=jNQXAC9IVRw',
        ], { timeout: 15000 });

        await fs.promises.unlink(tmpFile).catch(() => {});
        return {
          valid: true,
          latency: Date.now() - startTime,
          message: 'YouTube cookies valid! Video download should work.',
        };
      } catch (e: any) {
        await fs.promises.unlink(tmpFile).catch(() => {});
        const isExpired = e.message?.includes('Sign in') || e.message?.includes('bot') || e.message?.includes('cookie');
        return {
          valid: false,
          error: isExpired
            ? 'Cookies expired. Update dari extension "Get cookies.txt LOCALLY".'
            : `Test failed: ${e.message?.substring(0, 200)}`,
        };
      }
    }

    const startTime = Date.now();

    try {
      // Parse session data if it's JSON
      let cookieString = cookies.value;
      let accessToken: string | null = null;
      
      try {
        const sessionData = JSON.parse(cookies.value);
        if (sessionData.accessToken) {
          accessToken = sessionData.accessToken;
        }
        // Also extract __Secure-next-auth.session-token if present in session
        if (sessionData.sessionToken) {
          cookieString = `__Secure-next-auth.session-token=${sessionData.sessionToken}`;
        }
      } catch {
        // Not JSON, use as-is (raw cookies)
      }

      if (provider === 'codex') {
        // For Codex, try OpenAI API with accessToken first
        if (accessToken) {
          const res = await fetch('https://api.openai.com/v1/models', {
            headers: { Authorization: `Bearer ${accessToken}` },
          });
          const latency = Date.now() - startTime;

          if (res.ok) {
            const data = await res.json();
            return { 
              valid: true, 
              latency,
              message: 'Access token works with OpenAI API',
              modelCount: data.data?.length || 0,
              authType: 'access-token'
            };
          }
          // If 403, accessToken doesn't work with API directly - try chatgpt backend
          this.logger.log(`AccessToken returned ${res.status} for OpenAI API, trying ChatGPT backend...`);
        }

        // Try ChatGPT backend API with cookies
        const res = await fetch('https://chatgpt.com/backend-api/models', {
          headers: {
            'Cookie': cookieString,
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'application/json',
          },
        });
        const latency = Date.now() - startTime;

        if (!res.ok) {
          return { 
            valid: false, 
            error: `HTTP ${res.status}: ${res.statusText}`,
            latency,
            suggestion: res.status === 401 || res.status === 403 
              ? 'ChatGPT cookies may have expired. Copy fresh cookies from DevTools (F12 → Application → Cookies → chatgpt.com)' 
              : undefined
          };
        }

        return { 
          valid: true, 
          latency,
          message: 'ChatGPT cookies are valid',
          authType: 'cookies'
        };
      }

      if (provider === 'antigravity') {
        const res = await fetch('https://antigravity.app/api/models', {
          headers: {
            'Cookie': cookies.value,
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          },
        });
        const latency = Date.now() - startTime;

        if (!res.ok) {
          return { 
            valid: false, 
            error: `HTTP ${res.status}: ${res.statusText}`,
            latency,
            suggestion: res.status === 401 || res.status === 403 
              ? 'Cookies may have expired. Please update cookies.' 
              : undefined
          };
        }

        return { 
          valid: true, 
          latency,
          message: 'Cookies are valid',
          authType: 'cookies'
        };
      }

      throw new Error(`Cookie auth not supported for ${provider}`);
    } catch (e: any) {
      return { 
        valid: false, 
        error: e.message, 
        latency: Date.now() - startTime,
        suggestion: 'Check your internet connection and try again'
      };
    }
  }

  async deleteCookies(provider: string) {
    await this.delete(`cookies_${provider}`);
    await this.delete(`cookies_${provider}_saved_at`);
    await this.delete(`access_token_${provider}`);
    return { deleted: true, provider };
  }

  // --- Test AI Features ---
  async testChat(provider: string, model: string, prompt: string) {
    let apiKey: string;
    let useCookies = false;

    // Check if this is a cookie-based provider
    if (provider === 'codex' || provider === 'antigravity') {
      // First try access token
      const accessTokenRow = await this.getByKey(`access_token_${provider}`);
      if (accessTokenRow?.value) {
        apiKey = accessTokenRow.value;
      } else {
        // Fallback to cookies
        const cookies = await this.getByKey(`cookies_${provider}`);
        if (cookies?.value) {
          useCookies = true;
        } else {
          throw new Error(`${provider} requires cookies or session data. Please save first.`);
        }
      }
    } else {
      const keySetting = await this.getByKey(`api_key_${provider}`);
      if (!keySetting?.value) throw new Error(`No API key for ${provider}`);
      apiKey = keySetting.value;
    }

    const baseUrl = await this.getProviderBaseUrl(provider);
    const startTime = Date.now();

    let headers: Record<string, string>;
    let body: any;

    if (useCookies) {
      // Cookie-based request
      const cookies = await this.getByKey(`cookies_${provider}`);
      headers = {
        'Content-Type': 'application/json',
        'Cookie': cookies.value,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      };
      
      body = {
        model: model || (provider === 'codex' ? 'gpt-4' : 'default'),
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 200,
      };
    } else {
      // API key or access token
      headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      };
      body = {
        model,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 200,
      };
    }

    const endpoint = useCookies 
      ? (provider === 'codex' ? 'https://chatgpt.com/backend-api/conversation' : `${baseUrl}/v1/chat/completions`)
      : `${baseUrl}/v1/chat/completions`;

    // For codex with cookies, also set the proper headers
    if (useCookies && provider === 'codex') {
      headers['Accept'] = 'text/event-stream';
      headers['oai-language'] = 'en';
    }

    const res = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    const latency = Date.now() - startTime;
    const data = await res.json();

    if (!res.ok) throw new Error(data.error?.message || data.detail || `HTTP ${res.status}`);
    
    // Extract response based on provider
    let response: string;
    if (useCookies && provider === 'codex') {
      response = data.message?.content?.parts?.[0] || data.message?.content || 'No response';
    } else {
      response = data.choices?.[0]?.message?.content || 'No response';
    }
    
    return { response, latency, model, authType: useCookies ? 'cookies' : 'access-token' };
  }

  async testImage(provider: string, model: string, prompt: string) {
    let apiKey: string;
    let useCookies = false;

    if (provider === 'codex' || provider === 'antigravity') {
      const accessTokenRow = await this.getByKey(`access_token_${provider}`);
      if (accessTokenRow?.value) {
        apiKey = accessTokenRow.value;
      } else {
        const cookies = await this.getByKey(`cookies_${provider}`);
        if (cookies?.value) {
          useCookies = true;
        } else {
          throw new Error(`${provider} requires cookies or session data. Please save first.`);
        }
      }
    } else {
      const keySetting = await this.getByKey(`api_key_${provider}`);
      if (!keySetting?.value) throw new Error(`No API key for ${provider}`);
      apiKey = keySetting.value;
    }

    const baseUrl = await this.getProviderBaseUrl(provider);
    const startTime = Date.now();

    let headers: Record<string, string>;

    if (useCookies) {
      const cookies = await this.getByKey(`cookies_${provider}`);
      headers = {
        'Content-Type': 'application/json',
        'Cookie': cookies.value,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      };
    } else {
      headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      };
    }

    const res = await fetch(`${baseUrl}/v1/images/generations`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ model, prompt, n: 1, size: 'auto' }),
    });

    const latency = Date.now() - startTime;
    const data = await res.json();

    if (!res.ok) throw new Error(data.error?.message || `HTTP ${res.status}`);
    return { 
      imageUrl: data.data?.[0]?.url || data.data?.[0]?.b64_json, 
      latency, 
      model,
      authType: useCookies ? 'cookies' : 'access-token'
    };
  }

  private async getProviderBaseUrl(provider: string): Promise<string> {
    const urls: Record<string, string> = {
      openai: 'https://api.openai.com',
      openrouter: 'https://openrouter.ai',
      gemini: 'https://generativelanguage.googleapis.com/v1beta/openai',
      groq: 'https://api.groq.com/openai',
      deepseek: 'https://api.deepseek.com',
      mistral: 'https://api.mistral.ai',
      codex: 'https://api.openai.com',
      antigravity: 'https://api.openai.com',
    };
    if (urls[provider]) return urls[provider];

    // Custom provider lookup (OpenAI-compatible)
    const row = await this.getByKey(`custom_provider_${provider}`);
    if (row?.value) {
      try {
        const cfg = JSON.parse(row.value);
        if (cfg.baseUrl) return this.normalizeBaseUrl(cfg.baseUrl);
      } catch {
        /* ignore */
      }
    }
    return `https://api.openai.com`;
  }
}
