'use client'

import { useCallback, useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  ArrowLeft,
  Copy,
  CopyPlus,
  Download,
  Eye,
  Film,
  GripVertical,
  Image,
  Loader2,
  Mic,
  Music4,
  Package,
  PlayCircle,
  Plus,
  RefreshCw,
  Save,
  Search,
  Sparkles,
  Trash2,
  Upload,
  Volume2,
  Wand2,
} from 'lucide-react'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

type FootageSearch = {
  platform: string
  keyword: string
  url: string
}

type Scene = {
  id: string
  sceneNumber: number
  visualContext: string
  voiceoverText: string
  estimatedDuration?: number | null
  emoji?: string | null
  footageSearches: FootageSearch[]
}

type ScriptProject = {
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

type ProjectFormState = {
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

const defaultFormState: ProjectFormState = {
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

const getErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback

export default function VideoScriptEditorPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.id as string

  const [project, setProject] = useState<ScriptProject | null>(null)
  const [projectForm, setProjectForm] = useState<ProjectFormState>(defaultFormState)
  const [scenes, setScenes] = useState<Scene[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSavingProject, setIsSavingProject] = useState(false)
  const [savingSceneId, setSavingSceneId] = useState<string | null>(null)
  const [regeneratingField, setRegeneratingField] = useState<string | null>(null)
  const [regeneratingSceneId, setRegeneratingSceneId] = useState<string | null>(null)
  const [exportingFormat, setExportingFormat] = useState<string | null>(null)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [transcription, setTranscription] = useState<{ text: string; srt: string; vtt: string } | null>(null)
  const [isGeneratingThumbnail, setIsGeneratingThumbnail] = useState(false)
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null)
  const [isBrollFilling, setIsBrollFilling] = useState(false)
  const [isExportingZip, setIsExportingZip] = useState(false)
  const [playingTtsSceneId, setPlayingTtsSceneId] = useState<string | null>(null)
  const [ttsAudioUrl, setTtsAudioUrl] = useState<string | null>(null)
  const [isExportingAudio, setIsExportingAudio] = useState(false)
  const [selectedVoice, setSelectedVoice] = useState<'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer'>('nova')
  const [addingSceneAfter, setAddingSceneAfter] = useState<number | null>(null)
  const [duplicatingSceneId, setDuplicatingSceneId] = useState<string | null>(null)
  const [deletingSceneId, setDeletingSceneId] = useState<string | null>(null)
  const [sceneFootageSearch, setSceneFootageSearch] = useState<Record<string, { query: string; loading: boolean; results: any[] }>>({})

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = scenes.findIndex((s) => s.id === active.id)
    const newIndex = scenes.findIndex((s) => s.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return

    const reordered = arrayMove(scenes, oldIndex, newIndex)
    setScenes(reordered)

    try {
      await fetch(`${API_BASE_URL}/video-scripts/projects/${projectId}/scenes/reorder`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ orderedSceneIds: reordered.map((s) => s.id) }),
      })
      toast.success('Urutan scene diperbarui.')
    } catch {
      toast.error('Gagal menyimpan urutan scene.')
      await fetchProject()
    }
  }

  const fetchProject = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`${API_BASE_URL}/video-scripts/projects/${projectId}`, {
        headers: { 'Cache-Control': 'no-cache' },
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error('Failed to fetch project')
      }

      const data: ScriptProject = await response.json()
      setProject(data)
      setScenes(data.scenes || [])
      setProjectForm({
        title: data.title || '',
        sourceContent: data.sourceContent || '',
        headline: data.headline || '',
        subHeadline: data.subHeadline || '',
        caption: data.caption || '',
        hook: data.hook || '',
        thumbnailPrompt: data.thumbnailPrompt || '',
        musicSuggestion: data.musicSuggestion || '',
        hashtagsText: (data.hashtags || []).join(' '),
        targetDurationSeconds: String(data.targetDurationSeconds || 60),
      })
    } catch (error) {
      console.error('Failed to fetch script project:', error)
      toast.error('Gagal memuat project video script.')
    } finally {
      setIsLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    if (projectId) {
      fetchProject()
    }
  }, [projectId, fetchProject])

  const setProjectField = (field: keyof ProjectFormState, value: string) => {
    setProjectForm((prev) => ({ ...prev, [field]: value }))
  }

  const updateSceneDraft = (sceneId: string, patch: Partial<Scene>) => {
    setScenes((prev) => prev.map((scene) => (scene.id === sceneId ? { ...scene, ...patch } : scene)))
  }

  const parseHashtags = () =>
    projectForm.hashtagsText
      .split(/[\n,\s]+/)
      .map((tag) => tag.trim())
      .filter(Boolean)
      .map((tag) => (tag.startsWith('#') ? tag : `#${tag}`))

  const handleGenerateScript = async () => {
    if (!projectForm.sourceContent.trim()) {
      toast.info('Masukkan konten sumber terlebih dahulu.')
      return
    }

    setIsGenerating(true)
    try {
      const response = await fetch(`${API_BASE_URL}/video-scripts/projects/${projectId}/generate-script`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          content: projectForm.sourceContent,
          targetDurationSeconds: Number(projectForm.targetDurationSeconds || 60),
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || 'Gagal membuat script')
      }

      await fetchProject()
      toast.success('Script video berhasil dibuat.')
    } catch (error: unknown) {
      console.error('Failed to generate script:', error)
      toast.error(getErrorMessage(error, 'Terjadi kesalahan saat membuat script.'))
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSaveProject = async () => {
    setIsSavingProject(true)
    try {
      const response = await fetch(`${API_BASE_URL}/video-scripts/projects/${projectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          title: projectForm.title,
          sourceContent: projectForm.sourceContent,
          headline: projectForm.headline,
          subHeadline: projectForm.subHeadline,
          caption: projectForm.caption,
          hook: projectForm.hook,
          thumbnailPrompt: projectForm.thumbnailPrompt,
          musicSuggestion: projectForm.musicSuggestion,
          hashtags: parseHashtags(),
          targetDurationSeconds: Number(projectForm.targetDurationSeconds || 60),
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || 'Gagal menyimpan project')
      }

      await fetchProject()
      toast.success('Project video script disimpan.')
    } catch (error: unknown) {
      console.error('Failed to save project:', error)
      toast.error(getErrorMessage(error, 'Gagal menyimpan perubahan project.'))
    } finally {
      setIsSavingProject(false)
    }
  }

  const handleSaveScene = async (sceneId: string) => {
    const scene = scenes.find((item) => item.id === sceneId)
    if (!scene) return

    setSavingSceneId(sceneId)
    try {
      const response = await fetch(`${API_BASE_URL}/video-scripts/scenes/${sceneId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          visualContext: scene.visualContext,
          voiceoverText: scene.voiceoverText,
          estimatedDuration: scene.estimatedDuration || undefined,
          emoji: scene.emoji || undefined,
          footageSearches: scene.footageSearches,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || 'Gagal menyimpan scene')
      }

      const updatedScene: Scene = await response.json()
      updateSceneDraft(sceneId, updatedScene)
      toast.success(`Scene ${scene.sceneNumber} disimpan.`)
    } catch (error: unknown) {
      console.error('Failed to save scene:', error)
      toast.error(getErrorMessage(error, 'Gagal menyimpan scene.'))
    } finally {
      setSavingSceneId(null)
    }
  }

  const handleRegenerateField = async (
    field: 'headline' | 'subHeadline' | 'caption' | 'thumbnailPrompt',
  ) => {
    setRegeneratingField(field)
    try {
      const response = await fetch(`${API_BASE_URL}/video-scripts/projects/${projectId}/regenerate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ field }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || 'Gagal regenerate field')
      }

      const updatedProject = await response.json()
      setProject((prev) => (prev ? { ...prev, ...updatedProject } : prev))
      setProjectForm((prev) => ({
        ...prev,
        headline: updatedProject.headline ?? prev.headline,
        subHeadline: updatedProject.subHeadline ?? prev.subHeadline,
        caption: updatedProject.caption ?? prev.caption,
        thumbnailPrompt: updatedProject.thumbnailPrompt ?? prev.thumbnailPrompt,
      }))
      toast.success('Field berhasil dibuat ulang.')
    } catch (error: unknown) {
      console.error('Failed to regenerate field:', error)
      toast.error(getErrorMessage(error, 'Gagal regenerate field.'))
    } finally {
      setRegeneratingField(null)
    }
  }

  const handleRegenerateSceneVoiceover = async (sceneId: string) => {
    setRegeneratingSceneId(sceneId)
    try {
      const response = await fetch(`${API_BASE_URL}/video-scripts/scenes/${sceneId}/regenerate-voiceover`, {
        method: 'POST',
        credentials: 'include',
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || 'Gagal regenerate voiceover scene')
      }

      const updatedScene: Scene = await response.json()
      updateSceneDraft(sceneId, updatedScene)
      toast.success('Voiceover scene berhasil dibuat ulang.')
    } catch (error: unknown) {
      console.error('Failed to regenerate scene voiceover:', error)
      toast.error(getErrorMessage(error, 'Gagal regenerate voiceover scene.'))
    } finally {
      setRegeneratingSceneId(null)
    }
  }

  const handleCopyScript = async () => {
    const lines: string[] = []

    if (projectForm.headline) lines.push(`[HEADLINE]\n${projectForm.headline}\n`)
    if (projectForm.subHeadline) lines.push(`[SUB-HEADLINE]\n${projectForm.subHeadline}\n`)
    if (projectForm.hook) lines.push(`[HOOK]\n${projectForm.hook}\n`)
    if (projectForm.caption) lines.push(`[CAPTION]\n${projectForm.caption}\n`)
    if (projectForm.thumbnailPrompt) lines.push(`[THUMBNAIL PROMPT]\n${projectForm.thumbnailPrompt}\n`)

    scenes.forEach((scene) => {
      lines.push(`SCENE ${scene.sceneNumber} ${scene.emoji || ''}`.trim())
      lines.push(`[VISUAL]\n${scene.visualContext}`)
      if (scene.footageSearches?.length) {
        lines.push(
          `[FOOTAGE]\n${scene.footageSearches
            .map((search) => `- ${search.platform}: ${search.keyword} (${search.url})`)
            .join('\n')}`,
        )
      }
      lines.push(`[VOICEOVER]\n${scene.voiceoverText}\n`)
    })

    await navigator.clipboard.writeText(lines.join('\n'))
    toast.success('Script lengkap disalin.')
  }

  const handleCopyCaption = async () => {
    if (!projectForm.caption.trim()) {
      toast.info('Caption belum tersedia.')
      return
    }

    await navigator.clipboard.writeText(projectForm.caption)
    toast.success('Caption disalin.')
  }

  const handleExport = async (format: 'json' | 'txt' | 'srt' | 'caption') => {
    setExportingFormat(format)
    try {
      const response = await fetch(`${API_BASE_URL}/video-scripts/projects/${projectId}/export?format=${format}`, {
        credentials: 'include',
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || 'Gagal export script')
      }

      const isJson = format === 'json' || format === 'caption'
      const content = isJson ? JSON.stringify(await response.json(), null, 2) : await response.text()
      const blob = new Blob([content], {
        type: isJson ? 'application/json' : 'text/plain;charset=utf-8',
      })
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = `${(projectForm.title || 'video-script').replace(/[^a-z0-9]/gi, '_').toLowerCase()}.${format === 'caption' ? 'json' : format}`
      document.body.appendChild(anchor)
      anchor.click()
      document.body.removeChild(anchor)
      URL.revokeObjectURL(url)
    } catch (error: unknown) {
      console.error('Failed to export script:', error)
      toast.error(getErrorMessage(error, 'Gagal export script.'))
    } finally {
      setExportingFormat(null)
    }
  }

  const handleTranscribe = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 25 * 1024 * 1024) {
      toast.error('File terlalu besar. Maksimal 25MB.')
      return
    }

    setIsTranscribing(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('language', 'auto')

      const response = await fetch(`${API_BASE_URL}/video-scripts/projects/${projectId}/transcribe`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || 'Gagal transcribe audio')
      }

      const data = await response.json()
      setTranscription(data)
      toast.success('Transcription berhasil! Teks bisa dipakai sebagai source content.')
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Gagal transcribe audio.'))
    } finally {
      setIsTranscribing(false)
      e.target.value = ''
    }
  }

  const handleGenerateThumbnail = async () => {
    setIsGeneratingThumbnail(true)
    try {
      const response = await fetch(`${API_BASE_URL}/video-scripts/projects/${projectId}/thumbnail`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ style: 'cinematic' }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || 'Gagal generate thumbnail')
      }

      const data = await response.json()
      setThumbnailUrl(data.imageUrl)
      toast.success('Thumbnail berhasil di-generate!')
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Gagal generate thumbnail.'))
    } finally {
      setIsGeneratingThumbnail(false)
    }
  }

  const handleBrollAutoFill = async () => {
    setIsBrollFilling(true)
    try {
      const response = await fetch(`${API_BASE_URL}/video-scripts/projects/${projectId}/broll-autofill`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ perSource: 4, orientation: 'landscape' }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || 'Gagal auto-fill B-Roll')
      }

      const data = await response.json()
      let totalFootage = 0

      // Populate inline footage grid per scene
      const newFootageSearch: Record<string, { query: string; loading: boolean; results: any[] }> = {}
      for (const r of data.results) {
        const allResults = [...(r.footage.pexelsPhotos || []), ...(r.footage.pexelsVideos || [])].slice(0, 8)
        totalFootage += allResults.length
        newFootageSearch[r.sceneId] = { query: r.query, loading: false, results: allResults }
      }
      setSceneFootageSearch((prev) => ({ ...prev, ...newFootageSearch }))

      toast.success(`B-Roll ditemukan: ${totalFootage} footage untuk ${data.results.length} scene.`)
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Gagal auto-fill B-Roll.'))
    } finally {
      setIsBrollFilling(false)
    }
  }

  const handleExportZip = async () => {
    setIsExportingZip(true)
    try {
      const response = await fetch(`${API_BASE_URL}/video-scripts/projects/${projectId}/export/zip`, {
        credentials: 'include',
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || 'Gagal export ZIP')
      }

      const data = await response.json()
      // Download each file
      for (const file of data.files) {
        const blob = new Blob([file.content], { type: 'text/plain;charset=utf-8' })
        const url = URL.createObjectURL(blob)
        const anchor = document.createElement('a')
        anchor.href = url
        anchor.download = file.name
        document.body.appendChild(anchor)
        anchor.click()
        document.body.removeChild(anchor)
        URL.revokeObjectURL(url)
      }
      toast.success(`${data.files.length} file berhasil di-download.`)
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Gagal export ZIP.'))
    } finally {
      setIsExportingZip(false)
    }
  }

  const handleTtsPreview = async (sceneId: string) => {
    if (playingTtsSceneId === sceneId && ttsAudioUrl) {
      // Stop playing
      setPlayingTtsSceneId(null)
      setTtsAudioUrl(null)
      return
    }

    setPlayingTtsSceneId(sceneId)
    try {
      const response = await fetch(`${API_BASE_URL}/video-scripts/scenes/${sceneId}/tts-preview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ voice: selectedVoice }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || 'Gagal generate TTS')
      }

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      setTtsAudioUrl(url)

      const audio = new Audio(url)
      audio.onended = () => {
        setPlayingTtsSceneId(null)
        setTtsAudioUrl(null)
        URL.revokeObjectURL(url)
      }
      audio.play()
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Gagal generate TTS preview.'))
      setPlayingTtsSceneId(null)
    }
  }

  const handleExportAudio = async () => {
    setIsExportingAudio(true)
    try {
      const response = await fetch(`${API_BASE_URL}/video-scripts/projects/${projectId}/export/audio`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ voice: selectedVoice }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || 'Gagal export audio')
      }

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = `${(projectForm.title || 'voiceover').replace(/[^a-z0-9]/gi, '_').toLowerCase()}.mp3`
      document.body.appendChild(anchor)
      anchor.click()
      document.body.removeChild(anchor)
      URL.revokeObjectURL(url)
      toast.success('Voiceover MP3 berhasil di-download.')
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Gagal export audio.'))
    } finally {
      setIsExportingAudio(false)
    }
  }

  const handleAddScene = async (afterSceneNumber?: number) => {
    setAddingSceneAfter(afterSceneNumber ?? -1)
    try {
      const response = await fetch(`${API_BASE_URL}/video-scripts/projects/${projectId}/scenes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ afterSceneNumber }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || 'Gagal tambah scene')
      }

      await fetchProject()
      toast.success('Scene baru ditambahkan.')
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Gagal tambah scene.'))
    } finally {
      setAddingSceneAfter(null)
    }
  }

  const handleDuplicateScene = async (sceneId: string) => {
    setDuplicatingSceneId(sceneId)
    try {
      const response = await fetch(`${API_BASE_URL}/video-scripts/scenes/${sceneId}/duplicate`, {
        method: 'POST',
        credentials: 'include',
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || 'Gagal duplikasi scene')
      }

      await fetchProject()
      toast.success('Scene berhasil diduplikasi.')
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Gagal duplikasi scene.'))
    } finally {
      setDuplicatingSceneId(null)
    }
  }

  const handleDeleteScene = async (sceneId: string) => {
    if (scenes.length <= 1) {
      toast.error('Minimal harus ada 1 scene.')
      return
    }

    setDeletingSceneId(sceneId)
    try {
      const response = await fetch(`${API_BASE_URL}/video-scripts/scenes/${sceneId}`, {
        method: 'DELETE',
        credentials: 'include',
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || 'Gagal hapus scene')
      }

      await fetchProject()
      toast.success('Scene berhasil dihapus.')
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Gagal hapus scene.'))
    } finally {
      setDeletingSceneId(null)
    }
  }

  const handleSceneFootageSearch = async (sceneId: string, query?: string) => {
    const scene = scenes.find((s) => s.id === sceneId)
    if (!scene) return

    const searchQuery = query || sceneFootageSearch[sceneId]?.query || scene.visualContext?.slice(0, 80) || ''
    if (!searchQuery.trim()) return

    setSceneFootageSearch((prev) => ({
      ...prev,
      [sceneId]: { query: searchQuery, loading: true, results: prev[sceneId]?.results || [] },
    }))

    try {
      const response = await fetch(`${API_BASE_URL}/video-scripts/scenes/${sceneId}/fetch-footage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ query: searchQuery, perSource: 4 }),
      })

      if (!response.ok) throw new Error('Gagal search footage')

      const data = await response.json()
      const allResults = [
        ...(data.pexelsPhotos || []),
        ...(data.pexelsVideos || []),
      ].slice(0, 8)

      setSceneFootageSearch((prev) => ({
        ...prev,
        [sceneId]: { query: searchQuery, loading: false, results: allResults },
      }))
    } catch {
      setSceneFootageSearch((prev) => ({
        ...prev,
        [sceneId]: { ...prev[sceneId], loading: false },
      }))
      toast.error('Gagal search footage.')
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto max-w-7xl p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96" />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-8 xl:grid-cols-12">
          <div className="xl:col-span-4 space-y-4">
            <Skeleton className="h-[400px] rounded-3xl" />
            <Skeleton className="h-[200px] rounded-3xl" />
          </div>
          <div className="xl:col-span-8 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-[180px] rounded-3xl" />
              <Skeleton className="h-[180px] rounded-3xl" />
            </div>
            <Skeleton className="h-[300px] rounded-3xl" />
            <Skeleton className="h-[250px] rounded-3xl" />
          </div>
        </div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="container mx-auto p-6 text-center">
        <h1 className="text-2xl font-bold mb-4">Proyek Tidak Ditemukan</h1>
        <Button onClick={() => router.push('/video-scripts')}>Kembali ke Dashboard</Button>
      </div>
    )
  }

  const hasScenes = scenes.length > 0

  return (
    <div className="container mx-auto max-w-7xl p-6 space-y-8">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/video-scripts')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-3xl font-black tracking-tight">{projectForm.title || project.title}</h1>
              <Badge variant="secondary">{project.status}</Badge>
            </div>
            {project.sourceUrl && (
              <a
                href={project.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:underline"
              >
                Sumber: {project.sourceUrl}
              </a>
            )}
            <p className="text-sm text-slate-500">
              Editor ini sudah mendukung metadata lengkap, regenerate granular, scene editing, dan export.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={handleCopyScript} disabled={!hasScenes}>
            <Copy className="mr-2 h-4 w-4" />
            Salin Script
          </Button>
          <Button variant="outline" onClick={handleCopyCaption} disabled={!projectForm.caption.trim()}>
            <Sparkles className="mr-2 h-4 w-4" />
            Salin Caption
          </Button>
          <Button onClick={handleSaveProject} disabled={isSavingProject}>
            {isSavingProject ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Simpan Project
          </Button>
          <Button
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            onClick={handleGenerateScript}
            disabled={isGenerating || !projectForm.sourceContent.trim()}
          >
            {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
            {hasScenes ? 'Generate Ulang' : 'Generate Script'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 xl:grid-cols-12">
        <div className="space-y-6 xl:col-span-4">
          <Card className="glass rounded-3xl border-2 border-white/60 dark:border-white/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Film className="h-5 w-5 text-blue-600" />
                Project Setup
              </CardTitle>
              <CardDescription>Kontrol sumber artikel, judul project, dan target durasi script.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold">Judul Project</label>
                <Input value={projectForm.title} onChange={(e) => setProjectField('title', e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold">Target Durasi</label>
                <select
                  value={projectForm.targetDurationSeconds}
                  onChange={(e) => setProjectField('targetDurationSeconds', e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="30">30 detik</option>
                  <option value="45">45 detik</option>
                  <option value="60">60 detik</option>
                  <option value="90">90 detik</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold">Konten Sumber</label>
                <Textarea
                  value={projectForm.sourceContent}
                  onChange={(e) => setProjectField('sourceContent', e.target.value)}
                  className="min-h-[360px] resize-y"
                  placeholder="Tempel artikel, briefing, atau ringkasan sumber di sini."
                />
              </div>
            </CardContent>
          </Card>

          <Card className="glass rounded-3xl border-2 border-white/60 dark:border-white/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5 text-indigo-600" />
                Export
              </CardTitle>
              <CardDescription>Unduh hasil script dalam format kerja yang dibutuhkan.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3">
              {(['json', 'txt', 'srt', 'caption'] as const).map((format) => (
                <Button
                  key={format}
                  variant="outline"
                  disabled={!hasScenes || exportingFormat === format}
                  onClick={() => handleExport(format)}
                  className="uppercase"
                >
                  {exportingFormat === format ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="mr-2 h-4 w-4" />
                  )}
                  {format}
                </Button>
              ))}
              <Button
                variant="outline"
                disabled={!hasScenes || isExportingZip}
                onClick={handleExportZip}
                className="col-span-2"
              >
                {isExportingZip ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Package className="mr-2 h-4 w-4" />
                )}
                Export Semua (ZIP)
              </Button>
              <div className="col-span-2 space-y-2">
                <label className="text-xs font-semibold text-slate-500">Voice</label>
                <select
                  value={selectedVoice}
                  onChange={(e) => setSelectedVoice(e.target.value as any)}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                >
                  <option value="nova">Nova (Female, warm)</option>
                  <option value="alloy">Alloy (Male, neutral)</option>
                  <option value="echo">Echo (Female, soft)</option>
                  <option value="onyx">Onyx (Male, deep)</option>
                  <option value="fable">Fable (Female, expressive)</option>
                  <option value="shimmer">Shimmer (Female, clear)</option>
                </select>
              </div>
              <Button
                variant="outline"
                disabled={!hasScenes || isExportingAudio}
                onClick={handleExportAudio}
                className="col-span-2"
              >
                {isExportingAudio ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Volume2 className="mr-2 h-4 w-4" />
                )}
                Download Voiceover MP3
              </Button>
            </CardContent>
          </Card>

          <Card className="glass rounded-3xl border-2 border-white/60 dark:border-white/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wand2 className="h-5 w-5 text-purple-600" />
                AI Tools
              </CardTitle>
              <CardDescription>Transcribe audio, generate thumbnail, dan auto-fill B-Roll.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <label className="text-sm font-semibold">Transcribe Audio → Teks</label>
                <div className="flex gap-2">
                  <label className="flex-1 cursor-pointer">
                    <input
                      type="file"
                      accept="audio/*,video/*"
                      className="hidden"
                      onChange={handleTranscribe}
                      disabled={isTranscribing}
                    />
                    <div className="flex h-10 w-full items-center justify-center rounded-md border border-dashed border-slate-300 text-sm text-slate-600 hover:border-purple-400 hover:bg-purple-50">
                      {isTranscribing ? (
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Transcribing...</>
                      ) : (
                        <><Upload className="mr-2 h-4 w-4" /> Upload Audio/Video (max 25MB)</>
                      )}
                    </div>
                  </label>
                </div>
                {transcription && (
                  <div className="space-y-2 rounded-lg border bg-slate-50 p-3">
                    <p className="text-xs font-semibold text-slate-500">Hasil Transcription:</p>
                    <p className="text-sm text-slate-700 line-clamp-4">{transcription.text}</p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setProjectField('sourceContent', transcription.text)
                          toast.success('Teks transcription dipakai sebagai source content.')
                        }}
                      >
                        <Mic className="mr-1 h-3 w-3" /> Pakai sebagai Source
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          navigator.clipboard.writeText(transcription.srt)
                          toast.success('SRT disalin ke clipboard.')
                        }}
                      >
                        Copy SRT
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold">Generate Thumbnail (DALL-E 3)</label>
                <Button
                  variant="outline"
                  className="w-full"
                  disabled={isGeneratingThumbnail || !projectForm.headline.trim()}
                  onClick={handleGenerateThumbnail}
                >
                  {isGeneratingThumbnail ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Image className="mr-2 h-4 w-4" />
                  )}
                  Generate Thumbnail
                </Button>
                {thumbnailUrl && (
                  <div className="space-y-2">
                    <img src={thumbnailUrl} alt="Generated thumbnail" className="w-full rounded-lg" />
                    <a
                      href={thumbnailUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:underline"
                    >
                      Buka full-size ↗
                    </a>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold">B-Roll Auto-Fill</label>
                <Button
                  variant="outline"
                  className="w-full"
                  disabled={isBrollFilling || !hasScenes}
                  onClick={handleBrollAutoFill}
                >
                  {isBrollFilling ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Film className="mr-2 h-4 w-4" />
                  )}
                  Auto-Search Footage Semua Scene
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6 xl:col-span-8">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <MetadataCard
              title="Headline"
              value={projectForm.headline}
              onChange={(value) => setProjectField('headline', value)}
              onRegenerate={() => handleRegenerateField('headline')}
              isRegenerating={regeneratingField === 'headline'}
            />
            <MetadataCard
              title="Sub-headline"
              value={projectForm.subHeadline}
              onChange={(value) => setProjectField('subHeadline', value)}
              onRegenerate={() => handleRegenerateField('subHeadline')}
              isRegenerating={regeneratingField === 'subHeadline'}
            />
          </div>

          <Card className="glass rounded-3xl border-2 border-white/60 dark:border-white/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-pink-600" />
                Caption & Hook
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold">Caption</label>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleRegenerateField('caption')}
                    disabled={regeneratingField === 'caption'}
                  >
                    {regeneratingField === 'caption' ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="mr-2 h-4 w-4" />
                    )}
                    Regenerate
                  </Button>
                </div>
                <Textarea
                  value={projectForm.caption}
                  onChange={(e) => setProjectField('caption', e.target.value)}
                  className="min-h-[120px]"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold">Hook</label>
                <Textarea value={projectForm.hook} onChange={(e) => setProjectField('hook', e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold">Hashtags</label>
                <Textarea
                  value={projectForm.hashtagsText}
                  onChange={(e) => setProjectField('hashtagsText', e.target.value)}
                  className="min-h-[90px]"
                  placeholder="#viral #reels #contentcreator"
                />
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Card className="glass rounded-3xl border-2 border-white/60 dark:border-white/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5 text-emerald-600" />
                  Thumbnail Prompt
                </CardTitle>
                <CardDescription>Prompt image detail dalam Bahasa Inggris untuk thumbnail video.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Textarea
                  value={projectForm.thumbnailPrompt}
                  onChange={(e) => setProjectField('thumbnailPrompt', e.target.value)}
                  className="min-h-[180px]"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleRegenerateField('thumbnailPrompt')}
                  disabled={regeneratingField === 'thumbnailPrompt'}
                >
                  {regeneratingField === 'thumbnailPrompt' ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="mr-2 h-4 w-4" />
                  )}
                  Regenerate Prompt
                </Button>
              </CardContent>
            </Card>

            <Card className="glass rounded-3xl border-2 border-white/60 dark:border-white/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Music4 className="h-5 w-5 text-violet-600" />
                  Music Suggestion
                </CardTitle>
                <CardDescription>Arah mood audio untuk editor video.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Textarea
                  value={projectForm.musicSuggestion}
                  onChange={(e) => setProjectField('musicSuggestion', e.target.value)}
                  className="min-h-[180px]"
                />
              </CardContent>
            </Card>
          </div>

          {!hasScenes ? (
            <div className="flex min-h-[360px] flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50/40 p-12 text-center">
              <Wand2 className="mb-4 h-12 w-12 text-slate-300" />
              <h3 className="mb-2 text-xl font-semibold text-slate-800">Belum ada scene</h3>
              <p className="max-w-md text-slate-500">
                Generate script untuk membuat metadata lengkap, footage references, dan voiceover per scene.
              </p>
            </div>
          ) : (
            <>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={scenes.map((s) => s.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-6">
                  {scenes.map((scene, index) => (
                    <SortableSceneCard
                      key={scene.id}
                      scene={scene}
                      index={index}
                      totalScenes={scenes.length}
                      playingTtsSceneId={playingTtsSceneId}
                      regeneratingSceneId={regeneratingSceneId}
                      savingSceneId={savingSceneId}
                      addingSceneAfter={addingSceneAfter}
                      duplicatingSceneId={duplicatingSceneId}
                      deletingSceneId={deletingSceneId}
                      footageSearch={sceneFootageSearch[scene.id]}
                      onTtsPreview={handleTtsPreview}
                      onRegenerateVoiceover={handleRegenerateSceneVoiceover}
                      onAddScene={handleAddScene}
                      onDuplicate={handleDuplicateScene}
                      onDelete={handleDeleteScene}
                      onSave={handleSaveScene}
                      onUpdateDraft={updateSceneDraft}
                      onFootageSearch={handleSceneFootageSearch}
                      onFootageQueryChange={(sceneId, query) =>
                        setSceneFootageSearch((prev) => ({
                          ...prev,
                          [sceneId]: { ...prev[sceneId], query, loading: false, results: prev[sceneId]?.results || [] },
                        }))
                      }
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>

            <Button
              variant="outline"
              className="w-full border-dashed border-2 py-6 mt-6"
              onClick={() => handleAddScene()}
              disabled={addingSceneAfter !== null}
            >
              {addingSceneAfter !== null ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Plus className="mr-2 h-4 w-4" />
              )}
              Tambah Scene Baru
            </Button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function MetadataCard({
  title,
  value,
  onChange,
  onRegenerate,
  isRegenerating,
}: {
  title: string
  value: string
  onChange: (value: string) => void
  onRegenerate: () => void
  isRegenerating: boolean
}) {
  return (
    <Card className="glass rounded-3xl border-2 border-white/60 dark:border-white/20">
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-lg">{title}</CardTitle>
          <Button size="sm" variant="outline" onClick={onRegenerate} disabled={isRegenerating}>
            {isRegenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            Regenerate
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Textarea value={value} onChange={(e) => onChange(e.target.value)} className="min-h-[120px]" />
      </CardContent>
    </Card>
  )
}

function SortableSceneCard({
  scene,
  index,
  totalScenes,
  playingTtsSceneId,
  regeneratingSceneId,
  savingSceneId,
  addingSceneAfter,
  duplicatingSceneId,
  deletingSceneId,
  footageSearch,
  onTtsPreview,
  onRegenerateVoiceover,
  onAddScene,
  onDuplicate,
  onDelete,
  onSave,
  onUpdateDraft,
  onFootageSearch,
  onFootageQueryChange,
}: {
  scene: Scene
  index: number
  totalScenes: number
  playingTtsSceneId: string | null
  regeneratingSceneId: string | null
  savingSceneId: string | null
  addingSceneAfter: number | null
  duplicatingSceneId: string | null
  deletingSceneId: string | null
  footageSearch?: { query: string; loading: boolean; results: any[] }
  onTtsPreview: (id: string) => void
  onRegenerateVoiceover: (id: string) => void
  onAddScene: (afterNum: number) => void
  onDuplicate: (id: string) => void
  onDelete: (id: string) => void
  onSave: (id: string) => void
  onUpdateDraft: (id: string, patch: Partial<Scene>) => void
  onFootageSearch: (id: string, query?: string) => void
  onFootageQueryChange: (id: string, query: string) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: scene.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div ref={setNodeRef} style={style}>
      <Card className="glass overflow-hidden rounded-3xl border-2 border-white/60 dark:border-white/20">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b bg-slate-950 px-5 py-3 text-white">
          <div className="flex items-center gap-2">
            <button {...attributes} {...listeners} className="cursor-grab touch-none text-slate-400 hover:text-white">
              <GripVertical className="h-4 w-4" />
            </button>
            <span className="text-sm font-bold uppercase tracking-wider">Scene {scene.sceneNumber}</span>
            {index === 0 && <Badge className="bg-pink-500/20 text-pink-100">Hook</Badge>}
            {index === totalScenes - 1 && <Badge className="bg-blue-500/20 text-blue-100">CTA</Badge>}
            {scene.estimatedDuration ? (
              <Badge variant="secondary" className="bg-white/10 text-white">{scene.estimatedDuration}s</Badge>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-1.5">
            <Button size="sm" variant="secondary" onClick={() => onTtsPreview(scene.id)} disabled={playingTtsSceneId !== null && playingTtsSceneId !== scene.id} title="Preview TTS">
              {playingTtsSceneId === scene.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Volume2 className="h-4 w-4" />}
            </Button>
            <Button size="sm" variant="secondary" onClick={() => onRegenerateVoiceover(scene.id)} disabled={regeneratingSceneId === scene.id} title="Regenerate VO">
              {regeneratingSceneId === scene.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            </Button>
            <Button size="sm" variant="secondary" onClick={() => onAddScene(scene.sceneNumber)} disabled={addingSceneAfter !== null} title="Tambah scene">
              <Plus className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="secondary" onClick={() => onDuplicate(scene.id)} disabled={duplicatingSceneId === scene.id} title="Duplikasi">
              {duplicatingSceneId === scene.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CopyPlus className="h-4 w-4" />}
            </Button>
            <Button size="sm" variant="destructive" onClick={() => onDelete(scene.id)} disabled={deletingSceneId === scene.id || totalScenes <= 1} title="Hapus">
              {deletingSceneId === scene.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            </Button>
            <Button size="sm" variant="secondary" onClick={() => onSave(scene.id)} disabled={savingSceneId === scene.id} title="Simpan">
              {savingSceneId === scene.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        <CardContent className="grid gap-6 p-5 md:grid-cols-2">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
              <Eye className="h-3.5 w-3.5" />
              Visual / Footage Direction
            </div>
            <Textarea
              value={scene.visualContext}
              onChange={(e) => onUpdateDraft(scene.id, { visualContext: e.target.value })}
              className="min-h-[150px]"
            />

            {/* Inline Footage Search */}
            <div className="space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Search Footage</div>
              <div className="flex gap-2">
                <Input
                  placeholder="Cari footage..."
                  value={footageSearch?.query || ''}
                  onChange={(e) => onFootageQueryChange(scene.id, e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && onFootageSearch(scene.id)}
                  className="h-8 text-xs"
                />
                <Button size="sm" variant="outline" onClick={() => onFootageSearch(scene.id)} disabled={footageSearch?.loading} className="h-8 px-2">
                  {footageSearch?.loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Search className="h-3 w-3" />}
                </Button>
              </div>
              {footageSearch?.results && footageSearch.results.length > 0 && (
                <div className="grid grid-cols-4 gap-1.5 mt-2">
                  {footageSearch.results.map((item: any, i: number) => (
                    <a key={i} href={item.previewUrl || item.thumbnailUrl} target="_blank" rel="noopener noreferrer" className="block overflow-hidden rounded-md border hover:ring-2 hover:ring-blue-400">
                      <img src={item.thumbnailUrl} alt={item.title || ''} className="h-16 w-full object-cover" loading="lazy" />
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
              <PlayCircle className="h-3.5 w-3.5" />
              Voiceover
            </div>
            <Textarea
              value={scene.voiceoverText}
              onChange={(e) => onUpdateDraft(scene.id, { voiceoverText: e.target.value })}
              className="min-h-[150px]"
            />
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Durasi Estimasi</label>
                <Input type="number" value={scene.estimatedDuration || ''} onChange={(e) => onUpdateDraft(scene.id, { estimatedDuration: e.target.value ? Number(e.target.value) : null })} />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Emoji</label>
                <Input value={scene.emoji || ''} onChange={(e) => onUpdateDraft(scene.id, { emoji: e.target.value })} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
