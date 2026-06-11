import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { Activity } from '@/components/dashboard/recent-activity'

interface DashboardStats {
  totalArticles: number
  publishedArticles: number
  activeFeeds: number
  connectedSites: number
  tokenBalance: number
  currentTier: string
  recentActivity: Activity[]
}

interface TrendItem {
  title: string
  source: string
}

interface TrendsResponse {
  results?: TrendItem[]
  data?: TrendItem[]
}

export function useDashboardStats() {
  return useQuery<DashboardStats>({
    queryKey: ['dashboard-stats'],
    queryFn: () => api.get('/analytics/dashboard'),
    refetchInterval: 60000,
    refetchIntervalInBackground: false,
  })
}

export function useTrends() {
  return useQuery<TrendItem[]>({
    queryKey: ['dashboard-trends'],
    queryFn: async () => {
      const data = await api.get<TrendsResponse | TrendItem[]>('/trend-radar/search?q=trending+indonesia')
      const trends = Array.isArray(data) ? data : data.results || data.data || []
      return trends.slice(0, 4)
    },
    refetchInterval: 60000,
    refetchIntervalInBackground: false,
  })
}
