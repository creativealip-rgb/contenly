export type FootageSearch = {
  platform: string
  keyword: string
  url: string
}

export type FootageItem = {
  source: 'pexels-photo' | 'pexels-video' | 'google-image'
  id?: string
  thumbnailUrl: string
  previewUrl?: string
  downloadUrl?: string
  title?: string
  width?: number
  height?: number
  duration?: number
  attribution?: {
    author?: string
    authorUrl?: string
    sourceUrl?: string
  }
}

export type FootageFilter = 'all' | 'photo' | 'video'

export type Scene = {
  id: string
  sceneNumber: number
  visualContext: string
  voiceoverText: string
  estimatedDuration?: number | null
  emoji?: string | null
  footageSearches: FootageSearch[]
  selectedFootage?: FootageItem[] | null
  directorNotes?: string | null
}

export type ScriptProject = {
  id: string
  title: string
  sourceUrl?: string
  sourceContent?: string
  headline?: string | null
  subHeadline?: string | null
  caption?: string | null
  hook?: string | null
  thumbnailPrompt?: string | null
  musicSuggestion?: string | null
  hashtags: string[]
  targetDurationSeconds?: number | null
  status: string
  scenes: Scene[]
  createdAt: string
}

export type ProjectFormState = {
  title: string
  sourceContent: string
  headline: string
  subHeadline: string
  caption: string
  hook: string
  thumbnailPrompt: string
  musicSuggestion: string
  hashtagsText: string
  targetDurationSeconds: string
}

export const defaultFormState: ProjectFormState = {
  title: '',
  sourceContent: '',
  headline: '',
  subHeadline: '',
  caption: '',
  hook: '',
  thumbnailPrompt: '',
  musicSuggestion: '',
  hashtagsText: '',
  targetDurationSeconds: '60',
}

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'

export const getErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback
