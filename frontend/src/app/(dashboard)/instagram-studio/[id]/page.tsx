'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useConfirm } from '@/components/ui/confirm-dialog'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DropResult } from '@hello-pangea/dnd'
import { ArrowLeft, Download, Eye, Loader2, Sparkles } from 'lucide-react'
import { SlideEditor, SlidePreview, PreviewModal, API_BASE_URL } from './_components'
import type { Project, Slide } from './_components'

export default function InstagramStudioEditorPage() {
  const params = useParams()
  const router = useRouter()
  const confirm = useConfirm()
  const projectId = params.id as string

  const [project, setProject] = useState<Project | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isGeneratingStoryboard, setIsGeneratingStoryboard] = useState(false)
  const [isGeneratingImage, setIsGeneratingImage] = useState<string | null>(null)
  const [isGeneratingText, setIsGeneratingText] = useState<string | null>(null)
  const [isExporting, setIsExporting] = useState(false)
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0)
  const [editedContent, setEditedContent] = useState('')
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [previewSlideIndex, setPreviewSlideIndex] = useState(0)

  useEffect(() => {
    fetchProject()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId])
  useEffect(() => { if (project?.slides?.length) setEditedContent(project.slides[currentSlideIndex]?.textContent || '') }, [project, currentSlideIndex])

  const fetchProject = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/instagram-studio/projects/${projectId}`, { credentials: 'include', headers: { 'ngrok-skip-browser-warning': 'true' } })
      const data = await response.json()
      setProject(data)
    } catch (error) { console.error('Failed to fetch project:', error) }
    finally { setIsLoading(false) }
  }

  const handleGenerateStoryboard = async () => {
    if (!project?.sourceContent && !project?.sourceUrl) { toast.info('Harap tambahkan konten atau URL untuk membuat storyboard'); return }
    setIsGeneratingStoryboard(true)
    try {
      const response = await fetch(`${API_BASE_URL}/instagram-studio/projects/${projectId}/generate-storyboard`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ content: project.sourceContent, style: project.globalStyle }) })
      if (response.ok) { const updatedProject = await response.json(); setProject(updatedProject); setCurrentSlideIndex(0); toast.success('Storyboard berhasil dibuat!') }
    } catch (error) { console.error('Failed to generate storyboard:', error); toast.error('Gagal membuat storyboard') }
    finally { setIsGeneratingStoryboard(false) }
  }

  const [isGeneratingAll, setIsGeneratingAll] = useState(false)

  const handleGenerateAll = async () => {
    setIsGeneratingAll(true)
    try {
      const response = await fetch(`${API_BASE_URL}/instagram-studio/projects/${projectId}/generate-all`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include' })
      if (response.ok) {
        const updatedProject = await response.json()
        setProject(updatedProject)
        toast.success('Semua gambar berhasil dibuat!')
      } else {
        const errData = await response.json().catch(() => null)
        toast.error(`Gagal: ${errData?.message || response.statusText}`)
      }
    } catch (error) { console.error('Failed to generate all:', error); toast.error('Terjadi kesalahan') }
    finally { setIsGeneratingAll(false) }
  }

  const handleGenerateImage = async (slideId: string) => {
    setIsGeneratingImage(slideId)
    try {
      const response = await fetch(`${API_BASE_URL}/instagram-studio/slides/${slideId}/generate-image`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ style: project?.globalStyle }) })
      if (response.ok) { fetchProject(); toast.success('Gambar berhasil dibuat!') }
    } catch (error) { console.error('Failed to generate image:', error); toast.error('Gagal membuat gambar') }
    finally { setIsGeneratingImage(null) }
  }

  const handleGenerateText = async (slideId: string) => {
    setIsGeneratingText(slideId)
    try {
      const response = await fetch(`${API_BASE_URL}/instagram-studio/slides/${slideId}/generate-text`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include' })
      if (response.ok) { fetchProject(); toast.success('Pembuatan teks berhasil disimulasikan!') }
      else { const errData = await response.json().catch(() => null); toast.error(`Gagal membuat teks overlay: ${errData?.message || response.statusText}`) }
    } catch (error) { console.error('Failed to generate text:', error); toast.error('Terjadi kesalahan saat membuat teks overlay') }
    finally { setIsGeneratingText(null) }
  }

  const handleUpdateSlide = async (slideId: string, updates: Partial<Slide>) => {
    try {
      await fetch(`${API_BASE_URL}/instagram-studio/slides/${slideId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(updates) })
      setHasUnsavedChanges(false)
    } catch (error) { console.error('Failed to update slide:', error) }
  }

  const handleExport = async () => {
    setIsExporting(true)
    try {
      const response = await fetch(`${API_BASE_URL}/instagram-studio/projects/${projectId}/export`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ format: 'png' }) })
      if (response.ok) {
        const results = await response.json()
        for (const result of results) { const link = document.createElement('a'); link.href = `data:image/png;base64,${Buffer.from(result.buffer).toString('base64')}`; link.download = result.filename; link.click() }
      }
    } catch (error) { console.error('Failed to export:', error) }
    finally { setIsExporting(false) }
  }

  const handleAddSlide = async () => {
    try {
      const newSlideNumber = (project?.slides?.length || 0) + 1
      const response = await fetch(`${API_BASE_URL}/instagram-studio/projects/${projectId}/slides`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ slideNumber: newSlideNumber }) })
      if (response.ok) { await fetchProject(); setCurrentSlideIndex(newSlideNumber - 1) }
    } catch (error) { console.error('Failed to add slide:', error) }
  }

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination || !project?.slides) return
    const { index: sourceIndex } = result.source
    const { index: destinationIndex } = result.destination
    if (sourceIndex === destinationIndex) return
    const slideToMove = project.slides[sourceIndex]
    try {
      const response = await fetch(`${API_BASE_URL}/instagram-studio/projects/${projectId}/slides/reorder`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ slideId: slideToMove.id, newSlideNumber: destinationIndex + 1 }) })
      if (response.ok) { await fetchProject(); setCurrentSlideIndex(destinationIndex); toast.success('Urutan slide diperbarui') }
    } catch (error) { console.error('Failed to reorder slides:', error); toast.error('Gagal mengurutkan slide') }
  }

  const handleDeleteSlide = async (slideId: string) => {
    await confirm({
      title: 'Hapus Slide', description: 'Apakah Anda yakin ingin menghapus slide ini?', confirmText: 'Hapus', cancelText: 'Batal', variant: 'destructive',
      onConfirm: async () => {
        try {
          const response = await fetch(`${API_BASE_URL}/instagram-studio/slides/${slideId}`, { method: 'DELETE', credentials: 'include' })
          if (response.ok) { await fetchProject(); setCurrentSlideIndex(Math.max(0, currentSlideIndex - 1)) }
        } catch (error) { console.error('Failed to delete slide:', error) }
      },
    })
  }

  const handleReorderSlide = async (slideId: string, direction: 'left' | 'right') => {
    if (!project?.slides) return
    const currentSlideInfo = project.slides.find(s => s.id === slideId)
    if (!currentSlideInfo) return
    const newNumber = direction === 'left' ? currentSlideInfo.slideNumber - 1 : currentSlideInfo.slideNumber + 1
    if (newNumber < 1 || newNumber > project.slides.length) return
    try {
      const response = await fetch(`${API_BASE_URL}/instagram-studio/projects/${projectId}/slides/reorder`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ slideId, newSlideNumber: newNumber }) })
      if (response.ok) { await fetchProject(); setCurrentSlideIndex(newNumber - 1) }
    } catch (error) { console.error('Failed to reorder slide:', error) }
  }

  const currentSlide = project?.slides?.[currentSlideIndex]

  if (isLoading) {
    return (<div className="flex items-center justify-center min-h-[400px]"><Loader2 className="h-8 w-8 animate-spin text-pink-600" /></div>)
  }

  if (!project) {
    return (<div className="flex flex-col items-center justify-center min-h-[400px]"><p className="text-muted-foreground">Proyek tidak ditemukan</p><Button variant="link" onClick={() => router.push('/instagram-studio')}>Kembali ke proyek</Button></div>)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push('/instagram-studio')}><ArrowLeft className="h-4 w-4 mr-2" />Kembali</Button>
          <div><h1 className="text-2xl font-bold">{project.title}</h1><p className="text-muted-foreground text-sm">{project.totalSlides} slide • {project.globalStyle}</p></div>
        </div>
        <Badge className={project.status === 'ready' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}>{project.status}</Badge>
      </div>

      {!project.slides || project.slides.length === 0 ? (
        <Card className="glass border-2 border-white/60 dark:border-white/20 overflow-hidden hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-none transition-all duration-500 rounded-3xl">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Sparkles className="h-16 w-16 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium mb-2">Belum ada slide</h3>
            <p className="text-muted-foreground text-center max-w-sm mb-4">Buat storyboard dari konten Anda untuk membuat slide</p>
            <Button onClick={handleGenerateStoryboard} disabled={isGeneratingStoryboard || (!project.sourceContent && !project.sourceUrl)} className="bg-gradient-to-r from-pink-500 to-purple-600">
              {isGeneratingStoryboard ? (<><Loader2 className="h-4 w-4 mr-2 animate-spin" />Membuat Storyboard...</>) : (<><Sparkles className="h-4 w-4 mr-2" />Buat Storyboard (1 Token)</>)}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            <SlideEditor
              currentSlide={currentSlide} currentSlideIndex={currentSlideIndex} totalSlides={project.slides.length}
              editedContent={editedContent} setEditedContent={setEditedContent}
              hasUnsavedChanges={hasUnsavedChanges} setHasUnsavedChanges={setHasUnsavedChanges}
              isGeneratingImage={isGeneratingImage} isGeneratingText={isGeneratingText}
              onUpdateSlide={handleUpdateSlide} onGenerateImage={handleGenerateImage} onGenerateText={handleGenerateText}
              onReorderSlide={handleReorderSlide} onDeleteSlide={handleDeleteSlide} onNavigate={setCurrentSlideIndex}
            />
            <div className="flex gap-2">
              <Button onClick={handleGenerateAll} disabled={isGeneratingAll || !project.slides?.length} className="flex-1 bg-gradient-to-r from-violet-500 to-pink-600 hover:from-violet-600 hover:to-pink-700">
                {isGeneratingAll ? (<><Loader2 className="h-4 w-4 mr-2 animate-spin" />Membuat Semua Gambar...</>) : (<><Sparkles className="h-4 w-4 mr-2" />Generate Semua ({(project.slides?.length || 0) * 2} Token)</>)}
              </Button>
              <Button onClick={handleExport} disabled={isExporting || !project.slides?.some(s => s.imageUrl)} className="flex-1 bg-gradient-to-r from-pink-500 to-purple-600">
                {isExporting ? (<><Loader2 className="h-4 w-4 mr-2 animate-spin" />Mengekspor...</>) : (<><Download className="h-4 w-4 mr-2" />Ekspor Korsel</>)}
              </Button>
              <Button variant="outline" onClick={() => { setPreviewSlideIndex(0); setIsPreviewOpen(true) }} disabled={!project.slides?.length} className="flex-1">
                <Eye className="h-4 w-4 mr-2" />Pratinjau All
              </Button>
            </div>
          </div>

          <SlidePreview
            currentSlide={currentSlide} currentSlideIndex={currentSlideIndex}
            slides={project.slides} onDragEnd={handleDragEnd}
            onSlideSelect={setCurrentSlideIndex} onAddSlide={handleAddSlide}
          />
        </div>
      )}

      <PreviewModal
        isOpen={isPreviewOpen} onOpenChange={setIsPreviewOpen}
        slides={project?.slides || []} previewSlideIndex={previewSlideIndex} setPreviewSlideIndex={setPreviewSlideIndex}
      />
    </div>
  )
}
