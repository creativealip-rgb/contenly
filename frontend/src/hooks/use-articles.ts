import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

interface ArticlesParams {
  search?: string
  status?: string
}

interface ArticlesResponse {
  data: any[]
  meta?: { total: number }
}

export function useArticles(params: ArticlesParams) {
  const queryParams = new URLSearchParams()
  if (params.search) queryParams.append('search', params.search)
  if (params.status && params.status !== 'all') queryParams.append('status', params.status.toUpperCase())

  return useQuery<ArticlesResponse>({
    queryKey: ['articles', params],
    queryFn: () => api.get(`/articles?${queryParams.toString()}`),
  })
}

export function useDeleteArticle() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/articles/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articles'] })
    },
  })
}

export function useSyncScheduled() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => api.post('/wordpress/sync-scheduled'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articles'] })
    },
  })
}
