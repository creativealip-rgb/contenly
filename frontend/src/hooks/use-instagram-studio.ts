import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

interface Project {
  id: string
  title: string
  sourceUrl: string
  sourceContent: string
  globalStyle: string
  fontFamily: string
  totalSlides: number
  status: string
  createdAt: string
}

export function useInstagramProjects() {
  return useQuery<Project[]>({
    queryKey: ['instagram-projects'],
    queryFn: () => api.get('/instagram-studio/projects'),
  })
}

export type CreateProjectInput = {
  title: string
  sourceUrl?: string
  sourceContent?: string
  globalStyle?: string
  fontFamily?: string
  templateId?: string
}

export function useCreateProject() {
  return useMutation<Project, Error, CreateProjectInput>({
    mutationFn: (body) => api.post('/instagram-studio/projects', body),
  })
}

export function useDeleteProject() {
  const queryClient = useQueryClient()
  return useMutation<unknown, Error, string>({
    mutationFn: (id) => api.delete(`/instagram-studio/projects/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['instagram-projects'] })
    },
  })
}
