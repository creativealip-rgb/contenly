'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useConfirm } from '@/components/ui/confirm-dialog'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import {
    ArrowLeft,
    Loader2,
    Sparkles,
    Image as ImageIcon,
    Download,
    RefreshCw,
    Palette,
    Type,
    ChevronLeft,
    ChevronRight,
    Eye,
    Save,
    Trash2,
    Plus,
    MoveLeft,
    MoveRight,
    X,
} from 'lucide-react'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

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
    slides: Slide[]
}

interface Slide {
    id: string
    slideNumber: number
    textContent: string
    visualPrompt: string
    imageUrl: string
    layoutPosition: string
    fontSize: number
    fontColor: string
}

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
    const [isApplyingStyle, setIsApplyingStyle] = useState(false)
    const [currentSlideIndex, setCurrentSlideIndex] = useState(0)
    const [editedContent, setEditedContent] = useState('')
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
    
    // Preview Mode
    const [isPreviewOpen, setIsPreviewOpen] = useState(false)
    const [previewSlideIndex, setPreviewSlideIndex] = useState(0)

    useEffect(() => {
        fetchProject()
    }, [projectId])

    useEffect(() => {
        if (project?.slides?.length) {
            setEditedContent(project.slides[currentSlideIndex]?.textContent || '')
        }
    }, [project, currentSlideIndex])

    const fetchProject = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/instagram-studio/projects/${projectId}`, {
                credentials: 'include',
                headers: { 'ngrok-skip-browser-warning': 'true' },
            })
            const data = await response.json()
            setProject(data)
        } catch (error) {
            console.error('Failed to fetch project:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleGenerateStoryboard = async () => {
        if (!project?.sourceContent && !project?.sourceUrl) {
            toast.info('Harap tambahkan konten atau URL untuk membuat storyboard')
            return
        }

        setIsGeneratingStoryboard(true)
        try {
            const response = await fetch(
                `${API_BASE_URL}/instagram-studio/projects/${projectId}/generate-storyboard`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({
                        content: project.sourceContent,
                        style: project.globalStyle,
                    }),
                },
            )

            if (response.ok) {
                const updatedProject = await response.json()
                setProject(updatedProject)
                setCurrentSlideIndex(0)
                toast.success('Storyboard berhasil dibuat!')
            }
        } catch (error) {
            console.error('Failed to generate storyboard:', error)
            toast.error('Gagal membuat storyboard')
        } finally {
            setIsGeneratingStoryboard(false)
        }
    }

    const handleGenerateImage = async (slideId: string) => {
        setIsGeneratingImage(slideId)
        try {
            const response = await fetch(
                `${API_BASE_URL}/instagram-studio/slides/${slideId}/generate-image`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({
                        style: project?.globalStyle,
                    }),
                },
            )

            if (response.ok) {
                fetchProject()
                toast.success('Gambar berhasil dibuat!')
            }
        } catch (error) {
            console.error('Failed to generate image:', error)
            toast.error('Gagal membuat gambar')
        } finally {
            setIsGeneratingImage(null)
        }
    }

    const handleGenerateText = async (slideId: string) => {
        setIsGeneratingText(slideId)
        try {
            const response = await fetch(
                `${API_BASE_URL}/instagram-studio/slides/${slideId}/generate-text`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                },
            )

            if (response.ok) {
                const data = await response.json().catch(() => null)
                fetchProject()
                toast.success('Pembuatan teks berhasil disimulasikan!')
            } else {
                const errData = await response.json().catch(() => null)
                toast.error(`Gagal membuat teks overlay: ${errData?.message || response.statusText}`)
            }
        } catch (error) {
            console.error('Failed to generate text:', error)
            toast.error('Terjadi kesalahan saat membuat teks overlay')
        } finally {
            setIsGeneratingText(null)
        }
    }

    const handleUpdateSlide = async (slideId: string, updates: Partial<Slide>) => {
        try {
            await fetch(`${API_BASE_URL}/instagram-studio/slides/${slideId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(updates),
            })
            setHasUnsavedChanges(false)
        } catch (error) {
            console.error('Failed to update slide:', error)
        }
    }

    const handleExport = async () => {
        setIsExporting(true)
        try {
            const response = await fetch(
                `${API_BASE_URL}/instagram-studio/projects/${projectId}/export`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({ format: 'png' }),
                },
            )

            if (response.ok) {
                const results = await response.json()
                for (const result of results) {
                    const link = document.createElement('a')
                    link.href = `data:image/png;base64,${Buffer.from(result.buffer).toString('base64')}`
                    link.download = result.filename
                    link.click()
                }
            }
        } catch (error) {
            console.error('Failed to export:', error)
        } finally {
            setIsExporting(false)
        }
    }

    const handleGenerateAllImages = async () => {
        if (!project?.slides) return

        for (const slide of project.slides) {
            if (!slide.imageUrl) {
                await handleGenerateImage(slide.id)
            }
        }
    }

    const handleAddSlide = async () => {
        try {
            const newSlideNumber = (project?.slides?.length || 0) + 1
            const response = await fetch(`${API_BASE_URL}/instagram-studio/projects/${projectId}/slides`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ slideNumber: newSlideNumber })
            })
            if (response.ok) {
                await fetchProject()
                setCurrentSlideIndex(newSlideNumber - 1)
            }
        } catch (error) {
            console.error('Failed to add slide:', error)
        }
    }

    const handleDragEnd = async (result: DropResult) => {
        if (!result.destination || !project?.slides) return
        
        const sourceIndex = result.source.index
        const destinationIndex = result.destination.index
        
        if (sourceIndex === destinationIndex) return
        
        const slideToMove = project.slides[sourceIndex]
        
        try {
            const response = await fetch(
                `${API_BASE_URL}/instagram-studio/projects/${projectId}/slides/reorder`,
                {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({
                        slideId: slideToMove.id,
                        newSlideNumber: destinationIndex + 1
                    })
                }
            )
            
            if (response.ok) {
                await fetchProject()
                setCurrentSlideIndex(destinationIndex)
                toast.success('Urutan slide diperbarui')
            }
        } catch (error) {
            console.error('Failed to reorder slides:', error)
            toast.error('Gagal mengurutkan slide')
        }
    }

    const handleDeleteSlide = async (slideId: string) => {
        const confirmed = await confirm({
            title: 'Hapus Slide',
            description: 'Apakah Anda yakin ingin menghapus slide ini?',
            confirmText: 'Hapus',
            cancelText: 'Batal',
            variant: 'destructive',
            onConfirm: async () => {
                try {
                    const response = await fetch(`${API_BASE_URL}/instagram-studio/slides/${slideId}`, {
                        method: 'DELETE',
                        credentials: 'include'
                    })
                    if (response.ok) {
                        await fetchProject()
                        setCurrentSlideIndex(Math.max(0, currentSlideIndex - 1))
                    }
                } catch (error) {
                    console.error('Failed to delete slide:', error)
                }
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
            const response = await fetch(`${API_BASE_URL}/instagram-studio/projects/${projectId}/slides/reorder`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ slideId, newSlideNumber: newNumber })
            })
            if (response.ok) {
                await fetchProject()
                setCurrentSlideIndex(newNumber - 1)
            }
        } catch (error) {
            console.error('Failed to reorder slide:', error)
        }
    }

    const handleApplyStyleToAll = async (updates: Partial<Slide>) => {
        const confirmed = await confirm({
            title: 'Terapkan Gaya ke Semua Slide',
            description: 'Terapkan ukuran font, warna font, dan posisi teks slide ini ke SEMUA slide?',
            confirmText: 'Terapkan',
            cancelText: 'Batal',
            onConfirm: async () => {
                setIsApplyingStyle(true)
                try {
                    const response = await fetch(`${API_BASE_URL}/instagram-studio/projects/${projectId}/apply-style-to-all`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        credentials: 'include',
                        body: JSON.stringify(updates)
                    })
                    if (response.ok) {
                        await fetchProject()
                    }
                } catch (error) {
                    console.error('Failed to apply style to all:', error)
                } finally {
                    setIsApplyingStyle(false)
                }
            },
        })
    }

    const currentSlide = project?.slides?.[currentSlideIndex]

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-pink-600" />
            </div>
        )
    }

    if (!project) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px]">
                <p className="text-muted-foreground">Proyek tidak ditemukan</p>
                <Button variant="link" onClick={() => router.push('/instagram-studio')}>
                    Kembali ke proyek
                </Button>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="sm" onClick={() => router.push('/instagram-studio')}>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Kembali
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold">{project.title}</h1>
                        <p className="text-muted-foreground text-sm">
                            {project.totalSlides} slide • {project.globalStyle}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Badge className={project.status === 'ready' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}>
                        {project.status}
                    </Badge>
                </div>
            </div>

            {!project.slides || project.slides.length === 0 ? (
                <Card className="glass border-2 border-white/60 dark:border-white/20 overflow-hidden hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-none transition-all duration-500 rounded-3xl">
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <Sparkles className="h-16 w-16 text-muted-foreground/50 mb-4" />
                        <h3 className="text-lg font-medium mb-2">Belum ada slide</h3>
                        <p className="text-muted-foreground text-center max-w-sm mb-4">
                            Buat storyboard dari konten Anda untuk membuat slide
                        </p>
                        <Button
                            onClick={handleGenerateStoryboard}
                            disabled={isGeneratingStoryboard || (!project.sourceContent && !project.sourceUrl)}
                            className="bg-gradient-to-r from-pink-500 to-purple-600"
                        >
                            {isGeneratingStoryboard ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Membuat Storyboard...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="h-4 w-4 mr-2" />
                                    Buat Storyboard (1 Token)
                                </>
                            )}
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-6 lg:grid-cols-2">
                    <div className="space-y-4">
                        <Card className="glass border-2 border-white/60 dark:border-white/20 overflow-hidden hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-none transition-all duration-500 rounded-3xl">
                            <CardHeader className="pb-3 border-b mb-4">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-lg">
                                        Slide {currentSlideIndex + 1} dari {project.slides.length}
                                    </CardTitle>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            onClick={() => setCurrentSlideIndex(Math.max(0, currentSlideIndex - 1))}
                                            disabled={currentSlideIndex === 0}
                                            title="Slide Sebelumnya"
                                        >
                                            <ChevronLeft className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            onClick={() => setCurrentSlideIndex(Math.min(project.slides.length - 1, currentSlideIndex + 1))}
                                            disabled={currentSlideIndex === project.slides.length - 1}
                                            title="Slide Berikutnya"
                                        >
                                            <ChevronRight className="h-4 w-4" />
                                        </Button>
                                        <div className="w-px h-6 bg-border mx-1"></div>
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            onClick={() => handleReorderSlide(currentSlide!.id, 'left')}
                                            disabled={currentSlideIndex === 0}
                                            title="Pindah Kiri"
                                        >
                                            <MoveLeft className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            onClick={() => handleReorderSlide(currentSlide!.id, 'right')}
                                            disabled={currentSlideIndex === project.slides.length - 1}
                                            title="Pindah Kanan"
                                        >
                                            <MoveRight className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="destructive"
                                            size="icon"
                                            onClick={() => handleDeleteSlide(currentSlide!.id)}
                                            disabled={project.slides.length <= 1}
                                            title="Hapus Slide"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {currentSlide && (
                                    <>
                                        <div className="space-y-2">
                                            <Label>Teks Konten</Label>
                                            <Textarea
                                                value={editedContent}
                                                onChange={(e) => {
                                                    setEditedContent(e.target.value)
                                                    setHasUnsavedChanges(true)
                                                }}
                                                onBlur={() => {
                                                    if (hasUnsavedChanges) {
                                                        handleUpdateSlide(currentSlide.id, { textContent: editedContent })
                                                    }
                                                }}
                                                className="min-h-[80px]"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Prompt Visual</Label>
                                            <Textarea
                                                value={currentSlide.visualPrompt || ''}
                                                onChange={(e) => handleUpdateSlide(currentSlide.id, { visualPrompt: e.target.value })}
                                                className="min-h-[60px]"
                                            />
                                        </div>

                                        <div className="space-y-4">
                                            <Label>Warna Latar Solid</Label>
                                            <div className="flex gap-2 items-center">
                                                <Input
                                                    type="color"
                                                    value={currentSlide.imageUrl?.startsWith('#') ? currentSlide.imageUrl : '#1a1a2e'}
                                                    onChange={(e) => handleUpdateSlide(currentSlide.id, { imageUrl: e.target.value })}
                                                    className="h-10 w-20 cursor-pointer"
                                                />
                                                <p className="text-xs text-muted-foreground flex-1">
                                                    Pilih warna untuk menggunakan latar belakang solid daripada gambar AI.
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex flex-col gap-3 pt-4 border-t border-border mt-4">
                                            <Button
                                                onClick={() => handleGenerateImage(currentSlide.id)}
                                                disabled={false}
                                                className="w-full"
                                                variant="outline"
                                            >
                                                {isGeneratingImage === currentSlide.id ? (
                                                    <>
                                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                        Membuat Gambar...
                                                    </>
                                                ) : currentSlide.imageUrl ? (
                                                    <>
                                                        <RefreshCw className="h-4 w-4 mr-2" />
                                                        Buat Ulang Gambar (2 Token)
                                                    </>
                                                ) : (
                                                    <>
                                                        <ImageIcon className="h-4 w-4 mr-2" />
                                                        Buat Gambar Dasar (2 Token)
                                                    </>
                                                )}
                                            </Button>

                                            <Button
                                                onClick={() => handleGenerateText(currentSlide.id)}
                                                disabled={!currentSlide.imageUrl || isGeneratingText === currentSlide.id}
                                                className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
                                            >
                                                {isGeneratingText === currentSlide.id ? (
                                                    <>
                                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                        Menambahkan Teks...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Type className="h-4 w-4 mr-2" />
                                                        Bakar Teks ke Gambar (1 Token) <Badge className="ml-2 bg-yellow-500 hover:bg-yellow-600 text-white border-0 text-[10px] px-1 py-0 h-4 rounded-full">BARU</Badge>
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                    </>
                                )}
                            </CardContent>
                        </Card>

                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                onClick={handleGenerateAllImages}
                                disabled={true} // Disabled temporarily
                                className="flex-1 relative overflow-hidden"
                            >
                                <ImageIcon className="h-4 w-4 mr-2" />
                                Buat Gambar yang Hilang
                                <Badge className="ml-2 bg-yellow-500 hover:bg-yellow-600 text-white border-0 text-[10px] px-1 py-0 h-4">SEGERA</Badge>
                            </Button>
                            <Button
                                onClick={handleExport}
                                disabled={isExporting || !project.slides?.some(s => s.imageUrl)}
                                className="flex-1 bg-gradient-to-r from-pink-500 to-purple-600"
                            >
                                {isExporting ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Mengekspor...
                                    </>
                                ) : (
                                    <>
                                        <Download className="h-4 w-4 mr-2" />
                                        Ekspor Korsel
                                    </>
                                )}
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setPreviewSlideIndex(0)
                                    setIsPreviewOpen(true)
                                }}
                                disabled={!project.slides?.length}
                                className="flex-1"
                            >
                                <Eye className="h-4 w-4 mr-2" />
                                Pratinjau All
                            </Button>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <Card className="glass border-2 border-white/60 dark:border-white/20 overflow-hidden hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-none transition-all duration-500 rounded-3xl">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-lg">Pratinjau</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="relative aspect-[4/5] rounded-lg overflow-hidden bg-slate-900 border border-slate-800 shadow-inner">
                                    {/* Background Layer */}
                                    {currentSlide?.imageUrl ? (
                                        currentSlide.imageUrl.startsWith('#') || currentSlide.imageUrl.startsWith('rgb') ? (
                                            <div className="absolute inset-0 w-full h-full" style={{ backgroundColor: currentSlide.imageUrl }} />
                                        ) : (
                                            <img
                                                src={currentSlide.imageUrl}
                                                alt={`Slide ${currentSlideIndex + 1}`}
                                                className="absolute inset-0 w-full h-full object-cover"
                                            />
                                        )
                                    ) : (
                                        <div className="absolute inset-0 w-full h-full flex flex-col items-center justify-center p-6 text-slate-500">
                                            <ImageIcon className="h-16 w-16 mb-4 opacity-20" />
                                            <p className="opacity-50 text-sm">Gambar Tidak Tersedia</p>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="glass border-2 border-white/60 dark:border-white/20 overflow-hidden hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-none transition-all duration-500 rounded-3xl">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    Semua Slide
                                    <span className="text-xs font-normal text-slate-500">(Drag untuk urutkan)</span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <DragDropContext onDragEnd={handleDragEnd}>
                                    <Droppable droppableId="slides" direction="horizontal">
                                        {(provided) => (
                                            <div 
                                                {...provided.droppableProps}
                                                ref={provided.innerRef}
                                                className="grid grid-cols-5 gap-2"
                                            >
                                                {project.slides?.map((slide, index) => (
                                                    <Draggable key={slide.id} draggableId={slide.id} index={index}>
                                                        {(provided, snapshot) => (
                                                            <div
                                                                ref={provided.innerRef}
                                                                {...provided.draggableProps}
                                                                {...provided.dragHandleProps}
                                                                className={`relative aspect-[4/5] rounded-lg overflow-hidden cursor-grab border-2 transition-all ${
                                                                    index === currentSlideIndex
                                                                        ? 'border-pink-500'
                                                                        : snapshot.isDragging 
                                                                            ? 'border-blue-500 shadow-lg scale-105 z-10' 
                                                                            : 'border-transparent hover:border-slate-400'
                                                                }`}
                                                                onClick={() => setCurrentSlideIndex(index)}
                                                            >
                                                                {/* Drag indicator */}
                                                                <div className="absolute top-1 left-1 z-10 opacity-50">
                                                                    <div className="w-4 h-4 bg-black/50 rounded flex items-center justify-center">
                                                                        <span className="text-white text-[8px] font-bold">{index + 1}</span>
                                                                    </div>
                                                                </div>
                                                                
                                                                {/* Background Layer (Thumbnail) */}
                                                                {slide.imageUrl ? (
                                                                    slide.imageUrl.startsWith('#') || slide.imageUrl.startsWith('rgb') ? (
                                                                        <div className="absolute inset-0 w-full h-full" style={{ backgroundColor: slide.imageUrl }} />
                                                                    ) : (
                                                                        <img
                                                                            src={slide.imageUrl}
                                                                            alt={`Slide ${index + 1}`}
                                                                            className="absolute inset-0 w-full h-full object-cover"
                                                                        />
                                                                    )
                                                                ) : (
                                                                    <div className="absolute inset-0 w-full h-full bg-slate-800 flex items-center justify-center text-slate-500">
                                                                        <span className="text-xl font-bold opacity-30">{index + 1}</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </Draggable>
                                                ))}
                                                {provided.placeholder}
                                                <div
                                                    className="aspect-[4/5] rounded-lg border-2 border-dashed border-gray-300 hover:border-pink-400 hover:bg-pink-50/50 flex flex-col items-center justify-center cursor-pointer transition-colors text-muted-foreground hover:text-pink-600"
                                                    onClick={handleAddSlide}
                                                >
                                                    <Plus className="h-6 w-6 mb-1" />
                                                    <span className="text-xs font-medium">Tambah</span>
                                                </div>
                                            </div>
                                        )}
                                    </Droppable>
                                </DragDropContext>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            )}

            {/* Preview Modal */}
            <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
                    <DialogHeader>
                        <DialogTitle>Pratinjau Carousel - Slide {previewSlideIndex + 1} dari {project?.slides?.length}</DialogTitle>
                    </DialogHeader>
                    
                    <div className="relative flex items-center justify-center">
                        {/* Navigation Left */}
                        {previewSlideIndex > 0 && (
                            <Button
                                variant="ghost"
                                size="icon"
                                className="absolute left-0 z-10 h-12 w-12 rounded-full bg-black/50 hover:bg-black/70"
                                onClick={() => setPreviewSlideIndex(previewSlideIndex - 1)}
                            >
                                <ChevronLeft className="h-6 w-6 text-white" />
                            </Button>
                        )}

                        {/* Slide Preview */}
                        <div className="w-full max-w-[400px] aspect-[4/5] rounded-lg overflow-hidden bg-slate-900 border-4 border-slate-800 shadow-2xl">
                            {project?.slides?.[previewSlideIndex] ? (
                                <>
                                    {/* Background */}
                                    {project.slides[previewSlideIndex].imageUrl ? (
                                        project.slides[previewSlideIndex].imageUrl.startsWith('#') || project.slides[previewSlideIndex].imageUrl.startsWith('rgb') ? (
                                            <div 
                                                className="absolute inset-0 w-full h-full" 
                                                style={{ backgroundColor: project.slides[previewSlideIndex].imageUrl }} 
                                            />
                                        ) : (
                                            <img
                                                src={project.slides[previewSlideIndex].imageUrl}
                                                alt={`Slide ${previewSlideIndex + 1}`}
                                                className="w-full h-full object-cover"
                                            />
                                        )
                                    ) : (
                                        <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
                                            <div className="text-center p-4">
                                                <Sparkles className="h-12 w-12 text-slate-600 mx-auto mb-2" />
                                                <p className="text-slate-500 text-sm">Belum ada gambar</p>
                                            </div>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="w-full h-full bg-slate-900 flex items-center justify-center">
                                    <p className="text-slate-500">Tidak ada slide</p>
                                </div>
                            )}
                        </div>

                        {/* Navigation Right */}
                        {previewSlideIndex < (project?.slides?.length || 0) - 1 && (
                            <Button
                                variant="ghost"
                                size="icon"
                                className="absolute right-0 z-10 h-12 w-12 rounded-full bg-black/50 hover:bg-black/70"
                                onClick={() => setPreviewSlideIndex(previewSlideIndex + 1)}
                            >
                                <ChevronRight className="h-6 w-6 text-white" />
                            </Button>
                        )}
                    </div>

                    {/* Slide Indicators */}
                    <div className="flex justify-center gap-2 py-4">
                        {project?.slides?.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => setPreviewSlideIndex(index)}
                                className={`w-3 h-3 rounded-full transition-all ${
                                    index === previewSlideIndex 
                                        ? 'bg-pink-500 scale-110' 
                                        : 'bg-slate-300 hover:bg-slate-400'
                                }`}
                            />
                        ))}
                    </div>

                    {/* Slide Info */}
                    <div className="text-center">
                        <p className="font-medium text-sm text-slate-600 dark:text-slate-400">
                            {project?.slides?.[previewSlideIndex]?.textContent?.split('\n')[0] || 'Slide ' + (previewSlideIndex + 1)}
                        </p>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
