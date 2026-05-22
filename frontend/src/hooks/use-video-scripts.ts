import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

export interface ScriptProject {
  id: string
  title: string
  sourceUrl: string
  sourceContent?: string
  status: string
  headline?: string | null
  caption?: string | null
  targetDurationSeconds?: number | null
  sceneCount?: number
  totalEstimatedDuration?: number
  scenesWithFootage?: number
  coverThumbnail?: string | null
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
  return useMutation<ScriptProject, Error, { title: string; sourceUrl?: string; sourceContent?: string }>({
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
