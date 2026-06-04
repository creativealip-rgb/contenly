import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'

export interface BillingCategory {
  used: number
  limit: number
  label: string
}

export function useBillingBalance() {
  return useQuery<{ 
    balance: number
    credits: number
    tier: string
    categories: {
      artikel: BillingCategory
      video_ig: BillingCategory
      gambar: BillingCategory
    }
  }>({
    queryKey: ['billing-balance'],
    queryFn: () => api.get('/billing/balance'),
  })
}

export function useBillingSubscription() {
  return useQuery<any>({
    queryKey: ['billing-subscription'],
    queryFn: () => api.get('/billing/subscriptions'),
  })
}

export function useBillingTransactions(limit = 10) {
  return useQuery<any[]>({
    queryKey: ['billing-transactions', limit],
    queryFn: async () => {
      const data = await api.get<any>(`/billing/transactions?limit=${limit}`)
      return data.data || []
    },
  })
}

// Backward-compatible hook used by trend-radar and view-boost
export function useBilling() {
  const { data: balanceData, isLoading: l1 } = useBillingBalance()
  const { data: subscription, isLoading: l2 } = useBillingSubscription()
  return {
    data: !l1 && !l2 ? { 
      tier: subscription?.plan || 'FREE', 
      balance: balanceData?.balance ?? 0, 
      credits: balanceData?.credits ?? 0,
      subscription 
    } : null,
    loading: l1 || l2,
  }
}
