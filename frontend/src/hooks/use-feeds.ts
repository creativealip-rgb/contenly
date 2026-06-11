import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { RssFeed } from '@/lib/feeds-store'

type FeedResponse = RssFeed & { pollingIntervalMinutes?: number }

type FeedsResponse = FeedResponse[] | { data?: FeedResponse[] }

function transformFeed(feed: FeedResponse): RssFeed {
  return {
    ...feed,
    pollingInterval: feed.pollingIntervalMinutes,
    status: feed.status || 'active',
  }
}

export function useFeeds() {
  return useQuery<RssFeed[]>({
    queryKey: ['feeds'],
    queryFn: async () => {
      const res = await api.get<FeedsResponse>('/feeds')
      const feeds = Array.isArray(res) ? res : (res.data || [])
      return feeds.map(transformFeed)
    },
  })
}

export function useCreateFeed() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: { name: string; url: string; pollingInterval: number }) =>
      api.post('/feeds', {
        name: data.name,
        url: data.url,
        pollingIntervalMinutes: data.pollingInterval,
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['feeds'] }),
  })
}

export function useUpdateFeed() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; name?: string; url?: string; pollingInterval?: number; status?: string }) =>
      api.post(`/feeds/${id}`, {
        name: data.name,
        url: data.url,
        pollingIntervalMinutes: data.pollingInterval,
        status: data.status,
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['feeds'] }),
  })
}

export function useDeleteFeed() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/feeds/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['feeds'] }),
  })
}

export function usePollFeed() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.post<{ data: { newItems: number; totalItems: number } }>(`/feeds/${id}/poll`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['feeds'] }),
  })
}
