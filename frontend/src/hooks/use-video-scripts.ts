import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

interface ScriptProject {
  id: string
  title: string
  sourceUrl: string
  status: string
  createdAt: string
  updatedAt: string
}

export function useVideoProjects() {
  return useQuery<ScriptProject[]>({
    queryKey: ['video-projects'],
    queryFn: () => api.get('/video-scripts/projects'),
  })
}

export function useCreateVideoProject() {
  return useMutation<ScriptProject, Error, { title: string; sourceUrl: string }>({
    mutationFn: (body) => api.post('/video-scripts/projects', body),
  })
}

export function useDeleteVideoProject() {
  const queryClient = useQueryClient()
  return useMutation<unknown, Error, string>({
    mutationFn: (id) => api.delete(`/video-scripts/projects/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['video-projects'] })
    },
  })
}
