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
      // API returns { success, data: [...] }; the old code read .results (always
      // undefined) so the dashboard always fell back to hardcoded topics.
      const res = await api.get<any>('/trend-radar/search?q=trending+indonesia')
      const items = Array.isArray(res) ? res : (res?.data ?? res?.results ?? [])
      return (items as TrendItem[]).slice(0, 4)
    },
    refetchInterval: 60000,
    refetchIntervalInBackground: false,
  })
}
