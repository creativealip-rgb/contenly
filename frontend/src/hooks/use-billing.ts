import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'

export function useBillingBalance() {
  return useQuery<{
    balance: number
    credits?: number
    tier?: string
    categories?: Record<string, { used: number; limit: number; label: string }>
  }>({
    queryKey: ['billing-balance'],
    queryFn: () => api.get('/billing/balance'),
  })
}

interface BillingSubscription {
  plan?: string
  status?: string
  [key: string]: unknown
}

interface BillingTransaction {
  id: string
  type: string
  tokens: number
  status?: string
  createdAt: string
  metadata?: { description?: string }
  [key: string]: unknown
}

interface BillingTransactionsResponse {
  data?: BillingTransaction[]
}

export function useBillingSubscription() {
  return useQuery<BillingSubscription>({
    queryKey: ['billing-subscription'],
    queryFn: () => api.get('/billing/subscriptions'),
  })
}

export function useBillingTransactions(limit = 10) {
  return useQuery<BillingTransaction[]>({
    queryKey: ['billing-transactions', limit],
    queryFn: async () => {
      const data = await api.get<BillingTransactionsResponse>(`/billing/transactions?limit=${limit}`)
      return data.data || []
    },
  })
}

// Backward-compatible hook used by trend-radar and view-boost
export function useBilling() {
  const { data: balanceData, isLoading: l1 } = useBillingBalance()
  const { data: subscription, isLoading: l2 } = useBillingSubscription()
  return {
    data: !l1 && !l2 ? { tier: balanceData?.tier || subscription?.plan || 'FREE', balance: balanceData?.balance ?? 0, categories: balanceData?.categories, subscription } : null,
    loading: l1 || l2,
  }
}
