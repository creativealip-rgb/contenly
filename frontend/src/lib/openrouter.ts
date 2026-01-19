import type { OpenRouterRequest, OpenRouterResponse } from '@/types/ai'

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions'

export class OpenRouterClient {
    private apiKey: string
    private defaultModel: string

    constructor(apiKey: string, defaultModel: string = 'xiaomi/mimo-v2-flash:free') {
        this.apiKey = apiKey
        this.defaultModel = defaultModel
    }

    async chat(request: Partial<OpenRouterRequest>): Promise<OpenRouterResponse> {
        const payload: OpenRouterRequest = {
            model: request.model || this.defaultModel,
            messages: request.messages || [],
            temperature: request.temperature ?? 0.7,
            max_tokens: request.max_tokens ?? 2000,
            top_p: request.top_p ?? 1,
        }

        const response = await fetch(OPENROUTER_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'https://camedia.app', // Optional: for OpenRouter analytics
                'X-Title': 'Camedia AI Content Lab', // Optional: for OpenRouter analytics
            },
            body: JSON.stringify(payload),
        })

        if (!response.ok) {
            const error = await response.text()
            throw new Error(`OpenRouter API Error: ${response.status} - ${error}`)
        }

        return response.json()
    }

    async generateCompletion(
        prompt: string,
        systemPrompt?: string,
        options?: {
            model?: string
            temperature?: number
            maxTokens?: number
        }
    ): Promise<string> {
        const messages = []

        if (systemPrompt) {
            messages.push({
                role: 'system' as const,
                content: systemPrompt,
            })
        }

        messages.push({
            role: 'user' as const,
            content: prompt,
        })

        const response = await this.chat({
            model: options?.model,
            messages,
            temperature: options?.temperature,
            max_tokens: options?.maxTokens,
        })

        return response.choices[0]?.message?.content || ''
    }
}

// Singleton instance for server-side use
let clientInstance: OpenRouterClient | null = null

export function getOpenRouterClient(): OpenRouterClient {
    if (!clientInstance) {
        const apiKey = process.env.OPENROUTER_API_KEY
        if (!apiKey) {
            throw new Error('OPENROUTER_API_KEY is not set in environment variables')
        }
        clientInstance = new OpenRouterClient(apiKey)
    }
    return clientInstance
}
