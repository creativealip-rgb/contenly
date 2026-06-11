export interface ApiErrorPayload {
  message: string
  code?: string
  details?: unknown
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
}

export interface UserProfile {
  id: string
  email: string
  fullName: string
  avatarUrl?: string
  createdAt?: string
  updatedAt?: string
}

export interface AuthResponse {
  user: UserProfile
  session: {
    token: string
    expiresAt: string
  }
}

export interface ArticleSummary {
  id: string
  title: string
  status: 'DRAFT' | 'PUBLISHED' | 'SCHEDULED' | 'GENERATING' | 'FAILED' | string
  content?: string
  createdAt?: string
  updatedAt?: string
}

export interface ArticleStatsResponse {
  totalArticles: number
  counts: Record<string, number>
  totalTokens: number
}

export interface BillingBalanceResponse {
  balance: number
  credits: number
  tier: string
  categories?: Record<string, { used: number; limit: number; label: string }>
}
