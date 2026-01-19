export interface AIRewriteRequest {
    content: string
    title?: string
    tone?: 'professional' | 'casual' | 'creative' | 'technical'
    style?: 'blog' | 'news' | 'tutorial' | 'review'
    targetLength?: 'shorter' | 'same' | 'longer'
    includeMetadata?: boolean
}

export interface AIRewriteResponse {
    success: boolean
    data?: {
        title: string
        content: string
        excerpt: string
        metaDescription?: string
        seoKeywords?: string[]
    }
    error?: string
}

export interface OpenRouterMessage {
    role: 'system' | 'user' | 'assistant'
    content: string
}

export interface OpenRouterRequest {
    model: string
    messages: OpenRouterMessage[]
    temperature?: number
    max_tokens?: number
    top_p?: number
}

export interface OpenRouterResponse {
    id: string
    model: string
    choices: {
        message: {
            role: string
            content: string
        }
        finish_reason: string
    }[]
    usage: {
        prompt_tokens: number
        completion_tokens: number
        total_tokens: number
    }
}
