import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

export interface ArticlesParams {
  search?: string
  status?: string
  wpSiteId?: string
  page?: number
  limit?: number
  fromDate?: string
  toDate?: string
}

export interface ArticleListItem {
  id: string
  title: string
  status: string
  generatedContent?: string
  metaTitle?: string | null
  metaDescription?: string | null
  slug?: string | null
  sourceUrl?: string | null
  wpPostId?: string | null
  wpPostUrl?: string | null
  wpSiteId?: string | null
  wpSite?: { id: string; name: string; url: string } | null
  featuredImageUrl?: string | null
  tokensUsed?: number
  createdAt: string
  updatedAt?: string
  publishedAt?: string | null
}

export interface ArticlesResponse {
  data: ArticleListItem[]
  meta: { total: number; page: number; limit: number; totalPages: number }
}

export interface ArticleStatsResponse {
  counts: Record<string, number>
  totalTokens: number
  totalArticles: number
}

const ARTICLES_KEY = ['articles'] as const

export function useArticles(params: ArticlesParams) {
  const queryParams = new URLSearchParams()
  if (params.search) queryParams.append('search', params.search)
  if (params.status && params.status !== 'all') queryParams.append('status', params.status.toUpperCase())
  if (params.wpSiteId && params.wpSiteId !== 'all') queryParams.append('wpSiteId', params.wpSiteId)
  if (params.page) queryParams.append('page', String(params.page))
  if (params.limit) queryParams.append('limit', String(params.limit))

  return useQuery<ArticlesResponse>({
    queryKey: [...ARTICLES_KEY, params],
    queryFn: () => api.get(`/articles?${queryParams.toString()}`),
  })
}

export function useArticle(id: string | undefined) {
  return useQuery<ArticleListItem>({
    queryKey: ['article', id],
    queryFn: () => api.get(`/articles/${id}`),
    enabled: !!id,
  })
}

export function useArticleStats() {
  return useQuery<ArticleStatsResponse>({
    queryKey: ['articles-stats'],
    queryFn: () => api.get(`/articles/stats/summary`),
  })
}

export function useDeleteArticle() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/articles/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ARTICLES_KEY })
      queryClient.invalidateQueries({ queryKey: ['articles-stats'] })
    },
  })
}

export function useBulkDeleteArticles() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (ids: string[]) => api.post<{ deleted: number }>('/articles/bulk/delete', { ids }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ARTICLES_KEY })
      queryClient.invalidateQueries({ queryKey: ['articles-stats'] })
    },
  })
}

export function useBulkUpdateStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ ids, status }: { ids: string[]; status: string }) =>
      api.post<{ updated: number }>('/articles/bulk/status', { ids, status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ARTICLES_KEY })
      queryClient.invalidateQueries({ queryKey: ['articles-stats'] })
    },
  })
}

export function useSyncScheduled() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => api.post('/wordpress/sync-scheduled'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ARTICLES_KEY })
      queryClient.invalidateQueries({ queryKey: ['articles-stats'] })
    },
  })
}

export function useUpdateArticle() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ArticleListItem> & { generatedContent?: string; originalContent?: string } }) =>
      api.patch<ArticleListItem>(`/articles/${id}`, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ARTICLES_KEY })
      queryClient.invalidateQueries({ queryKey: ['articles-stats'] })
      if (data?.id) queryClient.invalidateQueries({ queryKey: ['article', data.id] })
    },
  })
}

export function useCreateArticle() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: {
      title: string
      generatedContent: string
      originalContent: string
      sourceUrl: string
      metaTitle?: string
      metaDescription?: string
      slug?: string
      tokensUsed?: number
      wpSiteId?: string
      status?: string
      featuredImageUrl?: string
    }) => api.post<ArticleListItem>('/articles', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ARTICLES_KEY })
      queryClient.invalidateQueries({ queryKey: ['articles-stats'] })
    },
  })
}
