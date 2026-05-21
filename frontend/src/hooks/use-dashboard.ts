import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'

interface DashboardStats {
  totalArticles: number
  publishedArticles: number
  activeFeeds: number
  connectedSites: number
  tokenBalance: number
  currentTier: string
  recentActivity: any[]
}

interface TrendItem {
  title: string
  source: string
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
      const data = await api.get<any>('/trend-radar/search?q=trending+indonesia')
      return ((data.results || data || []) as TrendItem[]).slice(0, 4)
    },
    refetchInterval: 60000,
    refetchIntervalInBackground: false,
  })
}
