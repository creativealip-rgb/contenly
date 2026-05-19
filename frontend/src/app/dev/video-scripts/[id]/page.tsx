'use client'

import { useCallback, useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  ArrowLeft,
  ArrowDown,
  ArrowUp,
  Copy,
  CopyPlus,
  Download,
  Eye,
  Film,
  Loader2,
  Music4,
  Pause,
  Plus,
  PlayCircle,
  RefreshCw,
  Save,
  Sparkles,
  Trash2,
  Volume2,
  Wand2,
} from 'lucide-react'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

type FootageSearch = {
  platform: string
  keyword: string
  url: string
}

type FootageItem = {
  source: 'pexels-photo' | 'pexels-video' | 'google-image'
  id: string
  thumbnailUrl: string
  previewUrl: string
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

type FootageSearchResult = {
  query: string
  pexelsPhotos: FootageItem[]
  pexelsVideos: FootageItem[]
  googleImages: FootageItem[]
  errors: { source: string; message: string }[]
}

type Scene = {
  id: string
  sceneNumber: number
  visualContext: string
  voiceoverText: string
  estimatedDuration?: number | null
  emoji?: string | null
  footageSearches: FootageSearch[]
  brollPrompt?: string | null
  selectedFootage?: FootageItem[]
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

export default function DevVideoScriptEditorPage() {
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
  const [busySceneId, setBusySceneId] = useState<string | null>(null) // for add/duplicate/delete/reorder
  const [reorderingProject, setReorderingProject] = useState(false)
  const [ttsLoadingSceneId, setTtsLoadingSceneId] = useState<string | null>(null)
  const [ttsAudioUrl, setTtsAudioUrl] = useState<string | null>(null)
  const [ttsAudioSceneId, setTtsAudioSceneId] = useState<string | null>(null)

  const fetchProject = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`${API_BASE_URL}/video-scripts/projects/${projectId}`, {
        headers: { 'Cache-Control': 'no-cache' },
        credentials: 'include',
      })

      if (!response.ok) throw new Error('Failed to fetch project')

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
    if (projectId) fetchProject()
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
      toast.success('Project disimpan.')
    } catch (error: unknown) {
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
        throw new Error(errorData.message || 'Gagal regenerate voiceover')
      }
      const updatedScene: Scene = await response.json()
      updateSceneDraft(sceneId, updatedScene)
      toast.success('Voiceover scene berhasil dibuat ulang.')
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Gagal regenerate voiceover scene.'))
    } finally {
      setRegeneratingSceneId(null)
    }
  }

  const handleAddScene = async (afterSceneNumber?: number) => {
    setBusySceneId('__adding__')
    try {
      const res = await fetch(`${API_BASE_URL}/video-scripts/projects/${projectId}/scenes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(typeof afterSceneNumber === 'number' ? { afterSceneNumber } : {}),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.message || 'Gagal menambahkan scene')
      }
      await fetchProject()
      toast.success('Scene baru ditambahkan.')
    } catch (e) {
      toast.error(getErrorMessage(e, 'Gagal menambahkan scene.'))
    } finally {
      setBusySceneId(null)
    }
  }

  const handleDuplicateScene = async (sceneId: string) => {
    setBusySceneId(sceneId)
    try {
      const res = await fetch(`${API_BASE_URL}/video-scripts/scenes/${sceneId}/duplicate`, {
        method: 'POST',
        credentials: 'include',
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.message || 'Gagal duplikasi scene')
      }
      await fetchProject()
      toast.success('Scene diduplikasi.')
    } catch (e) {
      toast.error(getErrorMessage(e, 'Gagal duplikasi scene.'))
    } finally {
      setBusySceneId(null)
    }
  }

  const handleDeleteScene = async (sceneId: string) => {
    if (!confirm('Hapus scene ini? Aksi tidak bisa dibatalkan.')) return
    setBusySceneId(sceneId)
    try {
      const res = await fetch(`${API_BASE_URL}/video-scripts/scenes/${sceneId}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.message || 'Gagal menghapus scene')
      }
      // Stop TTS audio if it was for the deleted scene
      if (ttsAudioSceneId === sceneId) {
        setTtsAudioUrl(null)
        setTtsAudioSceneId(null)
      }
      await fetchProject()
      toast.success('Scene dihapus.')
    } catch (e) {
      toast.error(getErrorMessage(e, 'Gagal menghapus scene.'))
    } finally {
      setBusySceneId(null)
    }
  }

  const handleMoveScene = async (sceneId: string, direction: 'up' | 'down') => {
    const idx = scenes.findIndex((s) => s.id === sceneId)
    if (idx < 0) return
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1
    if (targetIdx < 0 || targetIdx >= scenes.length) return

    const newOrder = [...scenes]
    ;[newOrder[idx], newOrder[targetIdx]] = [newOrder[targetIdx], newOrder[idx]]

    // Optimistic UI: update local order with renumbered sceneNumbers
    setScenes(newOrder.map((s, i) => ({ ...s, sceneNumber: i + 1 })))
    setReorderingProject(true)
    try {
      const res = await fetch(`${API_BASE_URL}/video-scripts/projects/${projectId}/scenes/reorder`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ orderedSceneIds: newOrder.map((s) => s.id) }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.message || 'Gagal reorder scene')
      }
      // Refresh from server to be authoritative
      await fetchProject()
    } catch (e) {
      toast.error(getErrorMessage(e, 'Gagal reorder scene.'))
      // Rollback by re-fetching
      await fetchProject()
    } finally {
      setReorderingProject(false)
    }
  }

  const handleTtsPreview = async (sceneId: string) => {
    setTtsLoadingSceneId(sceneId)
    try {
      const res = await fetch(`${API_BASE_URL}/video-scripts/scenes/${sceneId}/tts-preview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ voice: 'alloy' }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.message || 'Gagal generate TTS')
      }
      const blob = await res.blob()
      // Revoke previous URL to avoid memory leak
      if (ttsAudioUrl) URL.revokeObjectURL(ttsAudioUrl)
      const url = URL.createObjectURL(blob)
      setTtsAudioUrl(url)
      setTtsAudioSceneId(sceneId)
    } catch (e) {
      toast.error(getErrorMessage(e, 'Gagal generate TTS.'))
    } finally {
      setTtsLoadingSceneId(null)
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
      toast.error(getErrorMessage(error, 'Gagal export script.'))
    } finally {
      setExportingFormat(null)
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (!project) {
    return (
      <div className="container mx-auto p-6 text-center">
        <h1 className="mb-4 text-2xl font-bold">Proyek Tidak Ditemukan</h1>
        <Button onClick={() => router.push('/dev/video-scripts')}>Kembali</Button>
      </div>
    )
  }

  const hasScenes = scenes.length > 0

  return (
    <div className="container mx-auto max-w-7xl space-y-8 p-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/dev/video-scripts')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-3xl font-black tracking-tight">{projectForm.title || project.title}</h1>
              <Badge variant="secondary">{project.status}</Badge>
            </div>
            {project.sourceUrl && (
              <a href={project.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">
                Sumber: {project.sourceUrl}
              </a>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={handleCopyScript} disabled={!hasScenes}>
            <Copy className="mr-2 h-4 w-4" />
            Salin Script
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
          <Card className="rounded-2xl border-2 border-slate-200/60 bg-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Film className="h-5 w-5 text-blue-600" />
                Project Setup
              </CardTitle>
              <CardDescription>Kontrol sumber artikel, judul project, dan target durasi.</CardDescription>
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

          <Card className="rounded-2xl border-2 border-slate-200/60 bg-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5 text-indigo-600" />
                Export
              </CardTitle>
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

          <Card className="rounded-2xl border-2 border-slate-200/60 bg-white">
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
            <Card className="rounded-2xl border-2 border-slate-200/60 bg-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5 text-emerald-600" />
                  Thumbnail Prompt
                </CardTitle>
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

            <Card className="rounded-2xl border-2 border-slate-200/60 bg-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Music4 className="h-5 w-5 text-violet-600" />
                  Music Suggestion
                </CardTitle>
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
            <div className="flex min-h-[280px] flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-200 bg-white/50 p-12 text-center">
              <Wand2 className="mb-4 h-12 w-12 text-slate-300" />
              <h3 className="mb-2 text-xl font-semibold text-slate-800">Belum ada scene</h3>
              <p className="max-w-md text-slate-500">
                Generate script untuk membuat metadata, footage references, dan voiceover per scene.
              </p>
              <Button
                variant="outline"
                className="mt-6"
                onClick={() => handleAddScene()}
                disabled={busySceneId === '__adding__'}
              >
                {busySceneId === '__adding__' ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="mr-2 h-4 w-4" />
                )}
                Atau mulai dengan scene kosong
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {scenes.map((scene, index) => (
                <Card key={scene.id} className="overflow-hidden rounded-2xl border-2 border-slate-200/60 bg-white">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b bg-slate-950 px-5 py-3 text-white">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold uppercase tracking-wider">Scene {scene.sceneNumber}</span>
                      {index === 0 && <Badge className="bg-pink-500/20 text-pink-100">Hook</Badge>}
                      {index === scenes.length - 1 && <Badge className="bg-blue-500/20 text-blue-100">CTA</Badge>}
                      {scene.estimatedDuration ? (
                        <Badge variant="secondary" className="bg-white/10 text-white">
                          {scene.estimatedDuration}s
                        </Badge>
                      ) : null}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleMoveScene(scene.id, 'up')}
                        disabled={index === 0 || reorderingProject}
                        title="Pindah ke atas"
                      >
                        <ArrowUp className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleMoveScene(scene.id, 'down')}
                        disabled={index === scenes.length - 1 || reorderingProject}
                        title="Pindah ke bawah"
                      >
                        <ArrowDown className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleTtsPreview(scene.id)}
                        disabled={ttsLoadingSceneId === scene.id || !scene.voiceoverText?.trim()}
                        title="Play voiceover (TTS)"
                      >
                        {ttsLoadingSceneId === scene.id ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Volume2 className="mr-2 h-4 w-4" />
                        )}
                        Play VO
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleRegenerateSceneVoiceover(scene.id)}
                        disabled={regeneratingSceneId === scene.id}
                      >
                        {regeneratingSceneId === scene.id ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <RefreshCw className="mr-2 h-4 w-4" />
                        )}
                        Regen VO
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleDuplicateScene(scene.id)}
                        disabled={busySceneId === scene.id}
                        title="Duplikasi scene"
                      >
                        {busySceneId === scene.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <CopyPlus className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleSaveScene(scene.id)}
                        disabled={savingSceneId === scene.id}
                      >
                        {savingSceneId === scene.id ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Save className="mr-2 h-4 w-4" />
                        )}
                        Simpan Scene
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteScene(scene.id)}
                        disabled={busySceneId === scene.id}
                        title="Hapus scene"
                      >
                        {busySceneId === scene.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <CardContent className="space-y-6 p-5">
                    <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                        <Eye className="h-3.5 w-3.5" />
                        Visual / Footage Direction
                      </div>
                      <Textarea
                        value={scene.visualContext}
                        onChange={(e) => updateSceneDraft(scene.id, { visualContext: e.target.value })}
                        className="min-h-[180px]"
                      />

                      {scene.footageSearches?.length > 0 && (
                        <div className="space-y-2">
                          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                            Footage Searches
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {scene.footageSearches.map((search, idx) => (
                              <a
                                key={`${scene.id}-${idx}`}
                                href={search.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:border-blue-300 hover:text-blue-700"
                              >
                                {search.platform}: {search.keyword}
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                        <PlayCircle className="h-3.5 w-3.5" />
                        Voiceover
                      </div>
                      <Textarea
                        value={scene.voiceoverText}
                        onChange={(e) => updateSceneDraft(scene.id, { voiceoverText: e.target.value })}
                        className="min-h-[180px]"
                      />
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                            Durasi Estimasi
                          </label>
                          <Input
                            type="number"
                            value={scene.estimatedDuration || ''}
                            onChange={(e) =>
                              updateSceneDraft(scene.id, {
                                estimatedDuration: e.target.value ? Number(e.target.value) : null,
                              })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                            Emoji
                          </label>
                          <Input
                            value={scene.emoji || ''}
                            onChange={(e) => updateSceneDraft(scene.id, { emoji: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>
                    </div>

                    {scene.brollPrompt && (
                      <div className="space-y-2 border-t border-slate-100 pt-4">
                        <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                          B-Roll Prompt (English, for AI image gen)
                        </div>
                        <Textarea
                          value={scene.brollPrompt || ''}
                          onChange={(e) => updateSceneDraft(scene.id, { brollPrompt: e.target.value })}
                          className="min-h-[80px] text-xs"
                        />
                      </div>
                    )}

                    <div className="space-y-2 border-t border-slate-100 pt-4">
                      <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Footage (Pexels + Google)
                      </div>
                      <FootagePanel
                        sceneId={scene.id}
                        defaultQuery={scene.brollPrompt || scene.visualContext.slice(0, 80) || ''}
                        initialSelected={scene.selectedFootage || []}
                        apiBaseUrl={API_BASE_URL}
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
              <div className="flex justify-center">
                <Button
                  variant="outline"
                  onClick={() => handleAddScene()}
                  disabled={busySceneId === '__adding__'}
                >
                  {busySceneId === '__adding__' ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="mr-2 h-4 w-4" />
                  )}
                  Tambah Scene di Akhir
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {ttsAudioUrl && ttsAudioSceneId && (
        <div className="fixed bottom-4 right-4 z-50 flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-2xl">
          <PlayCircle className="h-5 w-5 text-blue-600" />
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-slate-700">
              Scene {scenes.find((s) => s.id === ttsAudioSceneId)?.sceneNumber || '?'} VO
            </span>
            <audio src={ttsAudioUrl} controls autoPlay className="h-8" />
          </div>
          <button
            type="button"
            onClick={() => {
              if (ttsAudioUrl) URL.revokeObjectURL(ttsAudioUrl)
              setTtsAudioUrl(null)
              setTtsAudioSceneId(null)
            }}
            className="ml-2 flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200"
            title="Tutup"
          >
            ×
          </button>
        </div>
      )}
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
    <Card className="rounded-2xl border-2 border-slate-200/60 bg-white">
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

function FootagePanel({
  sceneId,
  defaultQuery,
  initialSelected,
  apiBaseUrl,
}: {
  sceneId: string
  defaultQuery: string
  initialSelected: FootageItem[]
  apiBaseUrl: string
}) {
  const [query, setQuery] = useState(defaultQuery)
  const [result, setResult] = useState<FootageSearchResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState<FootageItem[]>(initialSelected || [])
  const [saving, setSaving] = useState(false)
  const [tab, setTab] = useState<'pexels-photo' | 'pexels-video' | 'google-image'>('pexels-photo')

  const isSelected = (item: FootageItem) =>
    selected.some((s) => s.source === item.source && s.id === item.id)

  const toggle = (item: FootageItem) => {
    setSelected((prev) =>
      isSelected(item)
        ? prev.filter((s) => !(s.source === item.source && s.id === item.id))
        : [...prev, item],
    )
  }

  const handleFetch = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${apiBaseUrl}/video-scripts/scenes/${sceneId}/fetch-footage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ query: query.trim() || defaultQuery, perSource: 8 }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.message || 'Gagal fetch footage')
      }
      const data: FootageSearchResult = await res.json()
      setResult(data)
      // Pick a sensible default tab — first non-empty
      if (data.pexelsPhotos.length) setTab('pexels-photo')
      else if (data.pexelsVideos.length) setTab('pexels-video')
      else if (data.googleImages.length) setTab('google-image')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Gagal fetch footage')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch(`${apiBaseUrl}/video-scripts/scenes/${sceneId}/select-footage`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ items: selected }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.message || 'Gagal simpan footage')
      }
      toast.success(`${selected.length} footage disimpan ke scene.`)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Gagal simpan footage')
    } finally {
      setSaving(false)
    }
  }

  const itemsForTab =
    tab === 'pexels-photo'
      ? result?.pexelsPhotos || []
      : tab === 'pexels-video'
      ? result?.pexelsVideos || []
      : result?.googleImages || []

  return (
    <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/50 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search keyword (default: visual context / b-roll prompt)"
          className="flex-1 min-w-[200px]"
        />
        <Button onClick={handleFetch} disabled={loading} size="sm">
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
          Fetch Footage
        </Button>
        {selected.length > 0 && (
          <Button onClick={handleSave} disabled={saving} size="sm" variant="default">
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save {selected.length}
          </Button>
        )}
      </div>

      {result && (
        <>
          {result.errors.length > 0 && (
            <div className="rounded border border-amber-200 bg-amber-50 p-2 text-xs text-amber-800">
              {result.errors.map((e, i) => (
                <div key={i}>
                  <strong>{e.source}:</strong> {e.message}
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2 text-xs">
            <button
              onClick={() => setTab('pexels-photo')}
              className={`rounded px-3 py-1 font-semibold transition ${
                tab === 'pexels-photo' ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-100'
              }`}
            >
              Pexels Photos ({result.pexelsPhotos.length})
            </button>
            <button
              onClick={() => setTab('pexels-video')}
              className={`rounded px-3 py-1 font-semibold transition ${
                tab === 'pexels-video' ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-100'
              }`}
            >
              Pexels Videos ({result.pexelsVideos.length})
            </button>
            <button
              onClick={() => setTab('google-image')}
              className={`rounded px-3 py-1 font-semibold transition ${
                tab === 'google-image' ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-100'
              }`}
            >
              Google Images ({result.googleImages.length})
            </button>
          </div>

          {itemsForTab.length === 0 ? (
            <div className="py-6 text-center text-sm text-slate-400">Tidak ada hasil untuk source ini.</div>
          ) : (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
              {itemsForTab.map((item) => (
                <button
                  key={`${item.source}-${item.id}`}
                  type="button"
                  onClick={() => toggle(item)}
                  className={`group relative aspect-video overflow-hidden rounded border-2 transition ${
                    isSelected(item) ? 'border-blue-600 ring-2 ring-blue-300' : 'border-transparent hover:border-slate-300'
                  }`}
                  title={item.title || item.attribution?.author || ''}
                >
                  <img
                    src={item.thumbnailUrl}
                    alt={item.title || ''}
                    className="h-full w-full object-cover"
                    loading="lazy"
                    referrerPolicy="no-referrer"
                  />
                  {item.duration ? (
                    <span className="absolute bottom-1 right-1 rounded bg-black/70 px-1 text-[10px] font-bold text-white">
                      {item.duration}s
                    </span>
                  ) : null}
                  {isSelected(item) && (
                    <span className="absolute left-1 top-1 rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-bold text-white">
                      ✓
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {selected.length > 0 && (
        <div className="border-t border-slate-200 pt-3">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
            Selected ({selected.length})
          </div>
          <div className="flex flex-wrap gap-2">
            {selected.map((item) => (
              <div key={`sel-${item.source}-${item.id}`} className="relative h-16 w-24 overflow-hidden rounded border border-slate-200">
                <img src={item.thumbnailUrl} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                <button
                  type="button"
                  onClick={() => toggle(item)}
                  className="absolute right-0 top-0 flex h-5 w-5 items-center justify-center rounded-bl bg-black/70 text-[10px] text-white hover:bg-red-600"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
