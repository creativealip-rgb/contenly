import { useQuery, useMutation } from '@tanstack/react-query'
import { api } from '@/lib/api'

interface TrendItem {
  id: string
  title: string
  url: string
  source: string
  time: string
  type: string
}

interface TrendAnalysis {
  score: number
  reason: string
  hooks: string[]
  strategy: string
  keywords: string[]
  sentiment: string
  content: string
}

interface TrendSearchResponse {
  success: boolean
  data: TrendItem[]
  error?: string
}

interface TrendAnalyzeResponse {
  success: boolean
  data: { analysis: Omit<TrendAnalysis, 'content'>; content: string }
  error?: string
}

export function useTrendSearch(query: string) {
  return useQuery<TrendItem[]>({
    queryKey: ['trend-search', query],
    queryFn: async () => {
      const data = await api.get<TrendSearchResponse>(`/trend-radar/search?q=${encodeURIComponent(query)}`)
      if (!data.success) throw new Error(data.error || 'Failed to search trends')
      return data.data
    },
    enabled: query.trim().length > 0,
  })
}

export function useTrendAnalysis() {
  return useMutation<TrendAnalysis, Error, string>({
    mutationFn: async (url: string) => {
      const data = await api.get<TrendAnalyzeResponse>(`/trend-radar/analyze?url=${encodeURIComponent(url)}`)
      if (!data.success) throw new Error('Failed to analyze trend content')
      return { ...data.data.analysis, content: data.data.content }
    },
  })
}
