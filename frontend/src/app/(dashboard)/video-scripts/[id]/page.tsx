'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import {
  ArrowLeft,
  Copy,
  Eye,
  Loader2,
  Music4,
  Plus,
  RefreshCw,
  Save,
  Sparkles,
  Wand2,
} from 'lucide-react'
import { useConfirm } from '@/components/ui/confirm-dialog'
import {
  MetadataCard,
  SortableSceneCard,
  SidebarPanels,
  API_BASE_URL,
  defaultFormState,
  getErrorMessage,
} from './_components'
import type { Scene, ScriptProject, ProjectFormState } from './_components'

export default function VideoScriptEditorPage() {
  const params = useParams()
  const router = useRouter()
  const confirm = useConfirm()
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
  const [sidebarTab, setSidebarTab] = useState<'setup' | 'export' | 'tools'>('setup')
  const [isComposing, setIsComposing] = useState(false)
  const [addingSceneAfter, setAddingSceneAfter] = useState<number | null>(null)
  const [duplicatingSceneId, setDuplicatingSceneId] = useState<string | null>(null)
  const [deletingSceneId, setDeletingSceneId] = useState<string | null>(null)
  const [sceneFootageSearch, setSceneFootageSearch] = useState<Record<string, { query: string; loading: boolean; results: any[] }>>({})

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const dirtyScenes = useRef<Set<string>>(new Set())
  const autoSaveTimer = useRef<NodeJS.Timeout | null>(null)

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

  useEffect(() => { if (projectId) fetchProject() }, [projectId, fetchProject])
  useEffect(() => { return () => { if (ttsAudioUrl) URL.revokeObjectURL(ttsAudioUrl) } }, [ttsAudioUrl])

  const setProjectField = (field: keyof ProjectFormState, value: string) => {
    setProjectForm((prev) => ({ ...prev, [field]: value }))
  }

  const updateSceneDraft = (sceneId: string, patch: Partial<Scene>) => {
    setScenes((prev) => prev.map((scene) => (scene.id === sceneId ? { ...scene, ...patch } : scene)))
    dirtyScenes.current.add(sceneId)
  }

  // Auto-save dirty scenes after 3s of inactivity
  useEffect(() => {
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current)
    autoSaveTimer.current = setTimeout(async () => {
      const ids = Array.from(dirtyScenes.current)
      if (ids.length === 0) return
      dirtyScenes.current.clear()
      for (const sceneId of ids) {
        const scene = scenes.find((s) => s.id === sceneId)
        if (!scene) continue
        try {
          await fetch(`${API_BASE_URL}/video-scripts/scenes/${sceneId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              visualContext: scene.visualContext,
              voiceoverText: scene.voiceoverText,
              estimatedDuration: scene.estimatedDuration || undefined,
              emoji: scene.emoji || undefined,
            }),
          })
        } catch { /* silent auto-save */ }
      }
    }, 3000)
    return () => { if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current) }
  }, [scenes])

  const parseHashtags = () =>
    projectForm.hashtagsText.split(/[\n,\s]+/).map((tag) => tag.trim()).filter(Boolean).map((tag) => (tag.startsWith('#') ? tag : `#${tag}`))

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
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({ orderedSceneIds: reordered.map((s) => s.id) }),
      })
      toast.success('Urutan scene diperbarui.')
    } catch { toast.error('Gagal menyimpan urutan scene.'); await fetchProject() }
  }

  const handleGenerateScript = async () => {
    if (!projectForm.sourceContent.trim()) { toast.info('Masukkan konten sumber terlebih dahulu.'); return }
    if (scenes.length > 0) {
      const confirmed = await new Promise<boolean>((resolve) => {
        confirm({ title: 'Generate ulang script?', description: `Semua ${scenes.length} scene yang sudah ada akan dihapus dan diganti dengan script baru. Aksi ini tidak bisa dibatalkan.`, confirmText: 'Ya, Generate Ulang', cancelText: 'Batal', variant: 'destructive', onConfirm: () => resolve(true) }).catch(() => resolve(false))
        setTimeout(() => resolve(false), 30000)
      })
      if (!confirmed) return
    }
    setIsGenerating(true)
    try {
      const response = await fetch(`${API_BASE_URL}/video-scripts/projects/${projectId}/generate-script`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({ content: projectForm.sourceContent, targetDurationSeconds: Number(projectForm.targetDurationSeconds || 60) }),
      })
      if (!response.ok) { const d = await response.json().catch(() => ({})); throw new Error(d.message || 'Gagal membuat script') }
      await fetchProject(); toast.success('Script video berhasil dibuat.')
    } catch (error: unknown) { toast.error(getErrorMessage(error, 'Terjadi kesalahan saat membuat script.')) }
    finally { setIsGenerating(false) }
  }

  const handleSaveProject = async () => {
    setIsSavingProject(true)
    try {
      const response = await fetch(`${API_BASE_URL}/video-scripts/projects/${projectId}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({ title: projectForm.title, sourceContent: projectForm.sourceContent, headline: projectForm.headline, subHeadline: projectForm.subHeadline, caption: projectForm.caption, hook: projectForm.hook, thumbnailPrompt: projectForm.thumbnailPrompt, musicSuggestion: projectForm.musicSuggestion, hashtags: parseHashtags(), targetDurationSeconds: Number(projectForm.targetDurationSeconds || 60) }),
      })
      if (!response.ok) { const d = await response.json().catch(() => ({})); throw new Error(d.message || 'Gagal menyimpan project') }
      await fetchProject(); toast.success('Project video script disimpan.')
    } catch (error: unknown) { toast.error(getErrorMessage(error, 'Gagal menyimpan perubahan project.')) }
    finally { setIsSavingProject(false) }
  }

  const handleSaveScene = async (sceneId: string) => {
    const scene = scenes.find((item) => item.id === sceneId)
    if (!scene) return
    setSavingSceneId(sceneId)
    try {
      const response = await fetch(`${API_BASE_URL}/video-scripts/scenes/${sceneId}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({ visualContext: scene.visualContext, voiceoverText: scene.voiceoverText, estimatedDuration: scene.estimatedDuration || undefined, emoji: scene.emoji || undefined, footageSearches: scene.footageSearches }),
      })
      if (!response.ok) { const d = await response.json().catch(() => ({})); throw new Error(d.message || 'Gagal menyimpan scene') }
      const updatedScene: Scene = await response.json()
      updateSceneDraft(sceneId, updatedScene)
      toast.success(`Scene ${scene.sceneNumber} disimpan.`)
    } catch (error: unknown) { toast.error(getErrorMessage(error, 'Gagal menyimpan scene.')) }
    finally { setSavingSceneId(null) }
  }

  const handleRegenerateField = async (field: 'headline' | 'subHeadline' | 'caption' | 'thumbnailPrompt') => {
    setRegeneratingField(field)
    try {
      const response = await fetch(`${API_BASE_URL}/video-scripts/projects/${projectId}/regenerate`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({ field }),
      })
      if (!response.ok) { const d = await response.json().catch(() => ({})); throw new Error(d.message || 'Gagal regenerate field') }
      const updatedProject = await response.json()
      setProject((prev) => (prev ? { ...prev, ...updatedProject } : prev))
      setProjectForm((prev) => ({ ...prev, headline: updatedProject.headline ?? prev.headline, subHeadline: updatedProject.subHeadline ?? prev.subHeadline, caption: updatedProject.caption ?? prev.caption, thumbnailPrompt: updatedProject.thumbnailPrompt ?? prev.thumbnailPrompt }))
      toast.success('Field berhasil dibuat ulang.')
    } catch (error: unknown) { toast.error(getErrorMessage(error, 'Gagal regenerate field.')) }
    finally { setRegeneratingField(null) }
  }

  const handleRegenerateSceneVoiceover = async (sceneId: string) => {
    setRegeneratingSceneId(sceneId)
    try {
      const response = await fetch(`${API_BASE_URL}/video-scripts/scenes/${sceneId}/regenerate-voiceover`, { method: 'POST', credentials: 'include' })
      if (!response.ok) { const d = await response.json().catch(() => ({})); throw new Error(d.message || 'Gagal regenerate voiceover scene') }
      const updatedScene: Scene = await response.json()
      updateSceneDraft(sceneId, updatedScene)
      toast.success('Voiceover scene berhasil dibuat ulang.')
    } catch (error: unknown) { toast.error(getErrorMessage(error, 'Gagal regenerate voiceover scene.')) }
    finally { setRegeneratingSceneId(null) }
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
      if (scene.footageSearches?.length) lines.push(`[FOOTAGE]\n${scene.footageSearches.map((s) => `- ${s.platform}: ${s.keyword} (${s.url})`).join('\n')}`)
      lines.push(`[VOICEOVER]\n${scene.voiceoverText}\n`)
    })
    await navigator.clipboard.writeText(lines.join('\n'))
    toast.success('Script lengkap disalin.')
  }

  const handleCopyCaption = async () => {
    if (!projectForm.caption.trim()) { toast.info('Caption belum tersedia.'); return }
    await navigator.clipboard.writeText(projectForm.caption)
    toast.success('Caption disalin.')
  }

  const handleExport = async (format: 'json' | 'txt' | 'srt' | 'caption') => {
    setExportingFormat(format)
    try {
      const response = await fetch(`${API_BASE_URL}/video-scripts/projects/${projectId}/export?format=${format}`, { credentials: 'include' })
      if (!response.ok) { const d = await response.json().catch(() => ({})); throw new Error(d.message || 'Gagal export script') }
      const isJson = format === 'json' || format === 'caption'
      const content = isJson ? JSON.stringify(await response.json(), null, 2) : await response.text()
      const blob = new Blob([content], { type: isJson ? 'application/json' : 'text/plain;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = `${(projectForm.title || 'video-script').replace(/[^a-z0-9]/gi, '_').toLowerCase()}.${format === 'caption' ? 'json' : format}`
      document.body.appendChild(anchor); anchor.click(); document.body.removeChild(anchor); URL.revokeObjectURL(url)
    } catch (error: unknown) { toast.error(getErrorMessage(error, 'Gagal export script.')) }
    finally { setExportingFormat(null) }
  }

  const handleTranscribe = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 25 * 1024 * 1024) { toast.error('File terlalu besar. Maksimal 25MB.'); return }
    setIsTranscribing(true)
    try {
      const formData = new FormData(); formData.append('file', file); formData.append('language', 'auto')
      const response = await fetch(`${API_BASE_URL}/video-scripts/projects/${projectId}/transcribe`, { method: 'POST', credentials: 'include', body: formData })
      if (!response.ok) { const d = await response.json().catch(() => ({})); throw new Error(d.message || 'Gagal transcribe audio') }
      const data = await response.json()
      setTranscription(data)
      toast.success('Transcription berhasil! Teks bisa dipakai sebagai source content.')
    } catch (error: unknown) { toast.error(getErrorMessage(error, 'Gagal transcribe audio.')) }
    finally { setIsTranscribing(false); e.target.value = '' }
  }

  const handleGenerateThumbnail = async () => {
    setIsGeneratingThumbnail(true)
    try {
      const response = await fetch(`${API_BASE_URL}/video-scripts/projects/${projectId}/thumbnail`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ style: 'cinematic' }) })
      if (!response.ok) { const d = await response.json().catch(() => ({})); throw new Error(d.message || 'Gagal generate thumbnail') }
      const data = await response.json()
      setThumbnailUrl(data.imageUrl)
      toast.success('Thumbnail berhasil di-generate!')
    } catch (error: unknown) { toast.error(getErrorMessage(error, 'Gagal generate thumbnail.')) }
    finally { setIsGeneratingThumbnail(false) }
  }

  const handleBrollAutoFill = async () => {
    setIsBrollFilling(true)
    try {
      const response = await fetch(`${API_BASE_URL}/video-scripts/projects/${projectId}/broll-autofill`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ perSource: 4, orientation: 'landscape' }) })
      if (!response.ok) { const d = await response.json().catch(() => ({})); throw new Error(d.message || 'Gagal auto-fill B-Roll') }
      const data = await response.json()
      let totalFootage = 0
      const newFootageSearch: Record<string, { query: string; loading: boolean; results: any[] }> = {}
      for (const r of data.results) {
        const allResults = [...(r.footage.pexelsPhotos || []), ...(r.footage.pexelsVideos || [])].slice(0, 8)
        totalFootage += allResults.length
        newFootageSearch[r.sceneId] = { query: r.query, loading: false, results: allResults }
      }
      setSceneFootageSearch((prev) => ({ ...prev, ...newFootageSearch }))
      toast.success(`B-Roll ditemukan: ${totalFootage} footage untuk ${data.results.length} scene.`)
    } catch (error: unknown) { toast.error(getErrorMessage(error, 'Gagal auto-fill B-Roll.')) }
    finally { setIsBrollFilling(false) }
  }

  const handleExportZip = async () => {
    setIsExportingZip(true)
    try {
      const response = await fetch(`${API_BASE_URL}/video-scripts/projects/${projectId}/export/zip`, { credentials: 'include' })
      if (!response.ok) { const d = await response.json().catch(() => ({})); throw new Error(d.message || 'Gagal export ZIP') }
      const data = await response.json()
      for (const file of data.files) {
        const blob = new Blob([file.content], { type: 'text/plain;charset=utf-8' })
        const url = URL.createObjectURL(blob)
        const anchor = document.createElement('a'); anchor.href = url; anchor.download = file.name
        document.body.appendChild(anchor); anchor.click(); document.body.removeChild(anchor); URL.revokeObjectURL(url)
      }
      toast.success(`${data.files.length} file berhasil di-download.`)
    } catch (error: unknown) { toast.error(getErrorMessage(error, 'Gagal export ZIP.')) }
    finally { setIsExportingZip(false) }
  }

  const handleTtsPreview = async (sceneId: string) => {
    if (playingTtsSceneId === sceneId && ttsAudioUrl) { URL.revokeObjectURL(ttsAudioUrl); setPlayingTtsSceneId(null); setTtsAudioUrl(null); return }
    if (ttsAudioUrl) URL.revokeObjectURL(ttsAudioUrl)
    setPlayingTtsSceneId(sceneId)
    try {
      const response = await fetch(`${API_BASE_URL}/video-scripts/scenes/${sceneId}/tts-preview`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ voice: selectedVoice }) })
      if (!response.ok) { const d = await response.json().catch(() => ({})); throw new Error(d.message || 'Gagal generate TTS') }
      const blob = await response.blob()
      const url = URL.createObjectURL(blob); setTtsAudioUrl(url)
      const audio = new Audio(url)
      audio.onended = () => { setPlayingTtsSceneId(null); setTtsAudioUrl(null); URL.revokeObjectURL(url) }
      audio.onerror = () => { setPlayingTtsSceneId(null); setTtsAudioUrl(null); URL.revokeObjectURL(url) }
      audio.play()
    } catch (error: unknown) { toast.error(getErrorMessage(error, 'Gagal generate TTS preview.')); setPlayingTtsSceneId(null) }
  }

  const handleExportAudio = async () => {
    setIsExportingAudio(true)
    try {
      const response = await fetch(`${API_BASE_URL}/video-scripts/projects/${projectId}/export/audio`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ voice: selectedVoice }) })
      if (!response.ok) { const d = await response.json().catch(() => ({})); throw new Error(d.message || 'Gagal export audio') }
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a'); anchor.href = url; anchor.download = `${(projectForm.title || 'voiceover').replace(/[^a-z0-9]/gi, '_').toLowerCase()}.mp3`
      document.body.appendChild(anchor); anchor.click(); document.body.removeChild(anchor); URL.revokeObjectURL(url)
      toast.success('Voiceover MP3 berhasil di-download.')
    } catch (error: unknown) { toast.error(getErrorMessage(error, 'Gagal export audio.')) }
    finally { setIsExportingAudio(false) }
  }

  const handleComposeVideo = async () => {
    setIsComposing(true)
    let toastId: string | number | undefined
    try {
      const response = await fetch(`${API_BASE_URL}/motion-graphics/compose-video`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ projectId, showCaptions: true, captionStyle: 'classic', aspectRatio: '9:16', voice: selectedVoice, includeAudio: true }) })
      if (!response.ok) { const d = await response.json().catch(() => ({})); throw new Error(d.message || 'Gagal compose video') }
      const { jobId } = await response.json()
      toast.info('Render job dimulai...')
      for (let i = 0; i < 120; i++) {
        await new Promise((r) => setTimeout(r, 3000))
        const statusRes = await fetch(`${API_BASE_URL}/motion-graphics/jobs/${jobId}`, { credentials: 'include' })
        if (!statusRes.ok) throw new Error('Gagal cek status render')
        const job = await statusRes.json()
        if (job.status === 'processing' && job.progress > 0) toastId = toast.loading(`Composing video... ${job.progress}%`, { id: toastId })
        if (job.status === 'completed') {
          if (toastId) toast.dismiss(toastId)
          const dlRes = await fetch(`${API_BASE_URL}/motion-graphics/jobs/${jobId}/download`, { credentials: 'include' })
          if (!dlRes.ok) throw new Error('Gagal download render output')
          const blob = await dlRes.blob(); const url = URL.createObjectURL(blob)
          const a = document.createElement('a'); a.href = url; a.download = `${(projectForm.title || 'video').replace(/[^a-z0-9]/gi, '_').toLowerCase()}.mp4`
          document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url)
          toast.success('Video berhasil di-compose dan di-download!'); return
        } else if (job.status === 'failed' || job.status === 'timeout') { if (toastId) toast.dismiss(toastId); throw new Error(job.error || 'Render gagal') }
      }
      throw new Error('Render timeout — coba lagi nanti')
    } catch (error: unknown) { if (toastId) toast.dismiss(toastId); toast.error(getErrorMessage(error, 'Gagal compose video.')) }
    finally { setIsComposing(false) }
  }

  const handleAddScene = async (afterSceneNumber?: number) => {
    setAddingSceneAfter(afterSceneNumber ?? -1)
    try {
      const response = await fetch(`${API_BASE_URL}/video-scripts/projects/${projectId}/scenes`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ afterSceneNumber }) })
      if (!response.ok) { const d = await response.json().catch(() => ({})); throw new Error(d.message || 'Gagal tambah scene') }
      await fetchProject(); toast.success('Scene baru ditambahkan.')
    } catch (error: unknown) { toast.error(getErrorMessage(error, 'Gagal tambah scene.')) }
    finally { setAddingSceneAfter(null) }
  }

  const handleDuplicateScene = async (sceneId: string) => {
    setDuplicatingSceneId(sceneId)
    try {
      const response = await fetch(`${API_BASE_URL}/video-scripts/scenes/${sceneId}/duplicate`, { method: 'POST', credentials: 'include' })
      if (!response.ok) { const d = await response.json().catch(() => ({})); throw new Error(d.message || 'Gagal duplikasi scene') }
      await fetchProject(); toast.success('Scene berhasil diduplikasi.')
    } catch (error: unknown) { toast.error(getErrorMessage(error, 'Gagal duplikasi scene.')) }
    finally { setDuplicatingSceneId(null) }
  }

  const handleDeleteScene = async (sceneId: string) => {
    if (scenes.length <= 1) { toast.error('Minimal harus ada 1 scene.'); return }
    setDeletingSceneId(sceneId)
    try {
      const response = await fetch(`${API_BASE_URL}/video-scripts/scenes/${sceneId}`, { method: 'DELETE', credentials: 'include' })
      if (!response.ok) { const d = await response.json().catch(() => ({})); throw new Error(d.message || 'Gagal hapus scene') }
      await fetchProject(); toast.success('Scene berhasil dihapus.')
    } catch (error: unknown) { toast.error(getErrorMessage(error, 'Gagal hapus scene.')) }
    finally { setDeletingSceneId(null) }
  }

  const handleSceneFootageSearch = async (sceneId: string, query?: string) => {
    const scene = scenes.find((s) => s.id === sceneId)
    if (!scene) return
    const searchQuery = query || sceneFootageSearch[sceneId]?.query || scene.visualContext?.slice(0, 80) || ''
    if (!searchQuery.trim()) return
    setSceneFootageSearch((prev) => ({ ...prev, [sceneId]: { query: searchQuery, loading: true, results: prev[sceneId]?.results || [] } }))
    try {
      const response = await fetch(`${API_BASE_URL}/video-scripts/scenes/${sceneId}/fetch-footage`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ query: searchQuery, perSource: 4 }) })
      if (!response.ok) throw new Error('Gagal search footage')
      const data = await response.json()
      const allResults = [...(data.pexelsPhotos || []), ...(data.pexelsVideos || [])].slice(0, 8)
      setSceneFootageSearch((prev) => ({ ...prev, [sceneId]: { query: searchQuery, loading: false, results: allResults } }))
    } catch { setSceneFootageSearch((prev) => ({ ...prev, [sceneId]: { ...prev[sceneId], loading: false } })); toast.error('Gagal search footage.') }
  }

  const handleSelectFootage = async (sceneId: string, item: any) => {
    try {
      const res = await fetch(`${API_BASE_URL}/video-scripts/scenes/${sceneId}/select-footage`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ items: [item] }) })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      updateSceneDraft(sceneId, { selectedFootage: [item] })
      toast.success('Footage dipilih untuk scene ini.')
    } catch { toast.error('Gagal menyimpan footage.') }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto max-w-7xl p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <div className="space-y-2"><Skeleton className="h-8 w-64" /><Skeleton className="h-4 w-96" /></div>
        </div>
        <div className="grid grid-cols-1 gap-8 xl:grid-cols-12">
          <div className="xl:col-span-4 space-y-4"><Skeleton className="h-[400px] rounded-3xl" /><Skeleton className="h-[200px] rounded-3xl" /></div>
          <div className="xl:col-span-8 space-y-4">
            <div className="grid grid-cols-2 gap-4"><Skeleton className="h-[180px] rounded-3xl" /><Skeleton className="h-[180px] rounded-3xl" /></div>
            <Skeleton className="h-[300px] rounded-3xl" /><Skeleton className="h-[250px] rounded-3xl" />
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
              <a href={project.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">
                Sumber: {project.sourceUrl}
              </a>
            )}
            <p className="text-sm text-slate-500">Editor ini sudah mendukung metadata lengkap, regenerate granular, scene editing, dan export.</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={handleCopyScript} disabled={!hasScenes}><Copy className="mr-2 h-4 w-4" />Salin Script</Button>
          <Button variant="outline" onClick={handleCopyCaption} disabled={!projectForm.caption.trim()}><Sparkles className="mr-2 h-4 w-4" />Salin Caption</Button>
          <Button onClick={handleSaveProject} disabled={isSavingProject}>{isSavingProject ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}Simpan Project</Button>
          <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700" onClick={handleGenerateScript} disabled={isGenerating || !projectForm.sourceContent.trim()}>
            {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}{hasScenes ? 'Generate Ulang' : 'Generate Script'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 xl:grid-cols-12">
        <div className="space-y-4 xl:col-span-4">
          <SidebarPanels
            sidebarTab={sidebarTab} setSidebarTab={setSidebarTab}
            projectForm={projectForm} setProjectField={setProjectField}
            hasScenes={hasScenes}
            exportingFormat={exportingFormat} onExport={handleExport}
            isExportingZip={isExportingZip} onExportZip={handleExportZip}
            selectedVoice={selectedVoice} setSelectedVoice={setSelectedVoice}
            isExportingAudio={isExportingAudio} onExportAudio={handleExportAudio}
            isComposing={isComposing} onComposeVideo={handleComposeVideo}
            isTranscribing={isTranscribing} onTranscribe={handleTranscribe}
            transcription={transcription}
            isGeneratingThumbnail={isGeneratingThumbnail} onGenerateThumbnail={handleGenerateThumbnail}
            thumbnailUrl={thumbnailUrl}
            isBrollFilling={isBrollFilling} onBrollAutoFill={handleBrollAutoFill}
            headlineAvailable={!!projectForm.headline.trim()}
          />
        </div>

        <div className="space-y-4 xl:col-span-8">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <MetadataCard title="Headline" value={projectForm.headline} onChange={(v) => setProjectField('headline', v)} onRegenerate={() => handleRegenerateField('headline')} isRegenerating={regeneratingField === 'headline'} />
            <MetadataCard title="Sub-headline" value={projectForm.subHeadline} onChange={(v) => setProjectField('subHeadline', v)} onRegenerate={() => handleRegenerateField('subHeadline')} isRegenerating={regeneratingField === 'subHeadline'} />
          </div>

          <Card className="glass rounded-3xl border-2 border-white/60 dark:border-white/20">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base"><Sparkles className="h-5 w-5 text-pink-600" />Caption & Hook</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold">Caption</label>
                  <Button size="sm" variant="outline" onClick={() => handleRegenerateField('caption')} disabled={regeneratingField === 'caption'}>
                    {regeneratingField === 'caption' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}Regenerate
                  </Button>
                </div>
                <Textarea value={projectForm.caption} onChange={(e) => setProjectField('caption', e.target.value)} className="min-h-[80px] resize-y" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold">Hook</label>
                <Textarea value={projectForm.hook} onChange={(e) => setProjectField('hook', e.target.value)} className="min-h-[60px] resize-y" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold">Hashtags</label>
                <Textarea value={projectForm.hashtagsText} onChange={(e) => setProjectField('hashtagsText', e.target.value)} className="min-h-[50px] resize-y" placeholder="#viral #reels #contentcreator" />
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Card className="glass rounded-3xl border-2 border-white/60 dark:border-white/20">
              <CardHeader><CardTitle className="flex items-center gap-2"><Eye className="h-5 w-5 text-emerald-600" />Thumbnail Prompt</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <Textarea value={projectForm.thumbnailPrompt} onChange={(e) => setProjectField('thumbnailPrompt', e.target.value)} className="min-h-[180px]" />
                <Button size="sm" variant="outline" onClick={() => handleRegenerateField('thumbnailPrompt')} disabled={regeneratingField === 'thumbnailPrompt'}>
                  {regeneratingField === 'thumbnailPrompt' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}Regenerate Prompt
                </Button>
              </CardContent>
            </Card>
            <Card className="glass rounded-3xl border-2 border-white/60 dark:border-white/20">
              <CardHeader><CardTitle className="flex items-center gap-2"><Music4 className="h-5 w-5 text-violet-600" />Music Suggestion</CardTitle></CardHeader>
              <CardContent><Textarea value={projectForm.musicSuggestion} onChange={(e) => setProjectField('musicSuggestion', e.target.value)} className="min-h-[180px]" /></CardContent>
            </Card>
          </div>

          {!hasScenes ? (
            <div className="flex min-h-[360px] flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50/40 p-12 text-center">
              <Wand2 className="mb-4 h-12 w-12 text-slate-300" />
              <h3 className="mb-2 text-xl font-semibold text-slate-800">Belum ada scene</h3>
              <p className="max-w-md text-slate-500">Generate script untuk membuat metadata lengkap, footage references, dan voiceover per scene.</p>
            </div>
          ) : (
            <>
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={scenes.map((s) => s.id)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-6">
                    {scenes.map((scene, index) => (
                      <SortableSceneCard
                        key={scene.id} scene={scene} index={index} totalScenes={scenes.length}
                        playingTtsSceneId={playingTtsSceneId} regeneratingSceneId={regeneratingSceneId}
                        savingSceneId={savingSceneId} addingSceneAfter={addingSceneAfter}
                        duplicatingSceneId={duplicatingSceneId} deletingSceneId={deletingSceneId}
                        footageSearch={sceneFootageSearch[scene.id]}
                        onTtsPreview={handleTtsPreview} onRegenerateVoiceover={handleRegenerateSceneVoiceover}
                        onAddScene={handleAddScene} onDuplicate={handleDuplicateScene}
                        onDelete={handleDeleteScene} onSave={handleSaveScene}
                        onUpdateDraft={updateSceneDraft} onFootageSearch={handleSceneFootageSearch}
                        onFootageQueryChange={(sceneId, query) => setSceneFootageSearch((prev) => ({ ...prev, [sceneId]: { ...prev[sceneId], query, loading: false, results: prev[sceneId]?.results || [] } }))}
                        onSelectFootage={handleSelectFootage}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
              <Button variant="outline" className="w-full border-dashed border-2 py-6 mt-6" onClick={() => handleAddScene()} disabled={addingSceneAfter !== null}>
                {addingSceneAfter !== null ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}Tambah Scene Baru
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
