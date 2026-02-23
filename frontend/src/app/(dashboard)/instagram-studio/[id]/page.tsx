'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
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
    const projectId = params.id as string

    const [project, setProject] = useState<Project | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isGeneratingStoryboard, setIsGeneratingStoryboard] = useState(false)
    const [isGeneratingImage, setIsGeneratingImage] = useState<string | null>(null)
    const [isExporting, setIsExporting] = useState(false)
    const [isApplyingStyle, setIsApplyingStyle] = useState(false)
    const [currentSlideIndex, setCurrentSlideIndex] = useState(0)
    const [editedContent, setEditedContent] = useState('')
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

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
            alert('Please add content or a URL to generate storyboard')
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
            }
        } catch (error) {
            console.error('Failed to generate storyboard:', error)
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
            }
        } catch (error) {
            console.error('Failed to generate image:', error)
        } finally {
            setIsGeneratingImage(null)
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

    const handleDeleteSlide = async (slideId: string) => {
        if (!confirm('Are you sure you want to delete this slide?')) return
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
        if (!confirm('Apply this slide\'s font size, font color, and text position to ALL slides?')) return
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
                <p className="text-muted-foreground">Project not found</p>
                <Button variant="link" onClick={() => router.push('/instagram-studio')}>
                    Back to projects
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
                        Back
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold">{project.title}</h1>
                        <p className="text-muted-foreground text-sm">
                            {project.totalSlides} slides • {project.globalStyle}
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
                        <h3 className="text-lg font-medium mb-2">No slides yet</h3>
                        <p className="text-muted-foreground text-center max-w-sm mb-4">
                            Generate a storyboard from your content to create slides
                        </p>
                        <Button
                            onClick={handleGenerateStoryboard}
                            disabled={isGeneratingStoryboard || (!project.sourceContent && !project.sourceUrl)}
                            className="bg-gradient-to-r from-pink-500 to-purple-600"
                        >
                            {isGeneratingStoryboard ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Generating Storyboard...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="h-4 w-4 mr-2" />
                                    Generate Storyboard (1 Token)
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
                                        Slide {currentSlideIndex + 1} of {project.slides.length}
                                    </CardTitle>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            onClick={() => setCurrentSlideIndex(Math.max(0, currentSlideIndex - 1))}
                                            disabled={currentSlideIndex === 0}
                                            title="Previous Slide"
                                        >
                                            <ChevronLeft className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            onClick={() => setCurrentSlideIndex(Math.min(project.slides.length - 1, currentSlideIndex + 1))}
                                            disabled={currentSlideIndex === project.slides.length - 1}
                                            title="Next Slide"
                                        >
                                            <ChevronRight className="h-4 w-4" />
                                        </Button>
                                        <div className="w-px h-6 bg-border mx-1"></div>
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            onClick={() => handleReorderSlide(currentSlide!.id, 'left')}
                                            disabled={currentSlideIndex === 0}
                                            title="Move Left"
                                        >
                                            <MoveLeft className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            onClick={() => handleReorderSlide(currentSlide!.id, 'right')}
                                            disabled={currentSlideIndex === project.slides.length - 1}
                                            title="Move Right"
                                        >
                                            <MoveRight className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="destructive"
                                            size="icon"
                                            onClick={() => handleDeleteSlide(currentSlide!.id)}
                                            disabled={project.slides.length <= 1}
                                            title="Delete Slide"
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
                                            <Label>Text Content</Label>
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
                                            <Label>Visual Prompt</Label>
                                            <Textarea
                                                value={currentSlide.visualPrompt || ''}
                                                onChange={(e) => handleUpdateSlide(currentSlide.id, { visualPrompt: e.target.value })}
                                                className="min-h-[60px]"
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label>Font Size</Label>
                                                <Input
                                                    type="number"
                                                    value={currentSlide.fontSize || 24}
                                                    onChange={(e) => handleUpdateSlide(currentSlide.id, { fontSize: parseInt(e.target.value) })}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Font Color</Label>
                                                <Input
                                                    type="color"
                                                    value={currentSlide.fontColor || '#FFFFFF'}
                                                    onChange={(e) => handleUpdateSlide(currentSlide.id, { fontColor: e.target.value })}
                                                    className="h-10"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Text Position</Label>
                                            <Select
                                                value={currentSlide.layoutPosition || 'center'}
                                                onValueChange={(v) => handleUpdateSlide(currentSlide.id, { layoutPosition: v })}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="top-left">Top Left</SelectItem>
                                                    <SelectItem value="top-center">Top Center</SelectItem>
                                                    <SelectItem value="top-right">Top Right</SelectItem>
                                                    <SelectItem value="center-left">Center Left</SelectItem>
                                                    <SelectItem value="center">Center</SelectItem>
                                                    <SelectItem value="center-right">Center Right</SelectItem>
                                                    <SelectItem value="bottom-left">Bottom Left</SelectItem>
                                                    <SelectItem value="bottom-center">Bottom Center</SelectItem>
                                                    <SelectItem value="bottom-right">Bottom Right</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="pt-2">
                                            <Button
                                                variant="secondary"
                                                size="sm"
                                                className="w-full text-xs"
                                                onClick={() => handleApplyStyleToAll({
                                                    fontSize: currentSlide.fontSize,
                                                    fontColor: currentSlide.fontColor,
                                                    layoutPosition: currentSlide.layoutPosition
                                                })}
                                                disabled={isApplyingStyle}
                                            >
                                                {isApplyingStyle ? (
                                                    <><Loader2 className="h-3 w-3 mr-2 animate-spin" /> Applying...</>
                                                ) : (
                                                    <><Palette className="h-3 w-3 mr-2" /> Apply Formatting to All Slides</>
                                                )}
                                            </Button>
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Solid Background Color</Label>
                                            <div className="flex gap-2 items-center">
                                                <Input
                                                    type="color"
                                                    value={currentSlide.imageUrl?.startsWith('#') ? currentSlide.imageUrl : '#1a1a2e'}
                                                    onChange={(e) => handleUpdateSlide(currentSlide.id, { imageUrl: e.target.value })}
                                                    className="h-10 w-20 cursor-pointer"
                                                />
                                                <p className="text-xs text-muted-foreground flex-1">
                                                    Pick a color to instantly use a solid background instead of AI image.
                                                </p>
                                            </div>
                                        </div>

                                        <Button
                                            onClick={() => handleGenerateImage(currentSlide.id)}
                                            disabled={true} // Disabled temporarily
                                            className="w-full"
                                            variant={currentSlide.imageUrl ? 'outline' : 'default'}
                                        >
                                            {isGeneratingImage === currentSlide.id ? (
                                                <>
                                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                    Generating...
                                                </>
                                            ) : currentSlide.imageUrl ? (
                                                <>
                                                    <RefreshCw className="h-4 w-4 mr-2" />
                                                    Regenerate Image (2 Tokens)
                                                </>
                                            ) : (
                                                <>
                                                    <ImageIcon className="h-4 w-4 mr-2" />
                                                    Generate Image (2 Tokens) <Badge className="ml-2 bg-yellow-500 hover:bg-yellow-600 text-white border-0 text-[10px] px-1 py-0 h-4">SOON</Badge>
                                                </>
                                            )}
                                        </Button>
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
                                Generate Missing Images
                                <Badge className="ml-2 bg-yellow-500 hover:bg-yellow-600 text-white border-0 text-[10px] px-1 py-0 h-4">SOON</Badge>
                            </Button>
                            <Button
                                onClick={handleExport}
                                disabled={isExporting || !project.slides?.some(s => s.imageUrl)}
                                className="flex-1 bg-gradient-to-r from-pink-500 to-purple-600"
                            >
                                {isExporting ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Exporting...
                                    </>
                                ) : (
                                    <>
                                        <Download className="h-4 w-4 mr-2" />
                                        Export Carousel
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <Card className="glass border-2 border-white/60 dark:border-white/20 overflow-hidden hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-none transition-all duration-500 rounded-3xl">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-lg">Preview</CardTitle>
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
                                            <p className="opacity-50 text-sm">No Background Image</p>
                                        </div>
                                    )}

                                    {/* Text Overlay Layer */}
                                    {currentSlide && (
                                        <div
                                            className="absolute inset-0 flex p-6 pointer-events-none"
                                            style={{
                                                justifyContent: currentSlide.layoutPosition?.includes('left')
                                                    ? 'flex-start'
                                                    : currentSlide.layoutPosition?.includes('right')
                                                        ? 'flex-end'
                                                        : 'center',
                                                alignItems: currentSlide.layoutPosition?.includes('top')
                                                    ? 'flex-start'
                                                    : currentSlide.layoutPosition?.includes('bottom')
                                                        ? 'flex-end'
                                                        : 'center',
                                            }}
                                        >
                                            <p
                                                style={{
                                                    fontFamily: project.fontFamily,
                                                    fontSize: `${currentSlide.fontSize || 24}px`,
                                                    color: currentSlide.fontColor || '#FFFFFF',
                                                    textShadow: '0 2px 8px rgba(0,0,0,0.8), 0 4px 16px rgba(0,0,0,0.6)',
                                                    maxWidth: '85%',
                                                    textAlign: 'center',
                                                    whiteSpace: 'pre-wrap',
                                                }}
                                                dangerouslySetInnerHTML={{
                                                    __html: currentSlide.textContent?.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') || ''
                                                }}
                                            />
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="glass border-2 border-white/60 dark:border-white/20 overflow-hidden hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-none transition-all duration-500 rounded-3xl">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-lg">All Slides</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-5 gap-2">
                                    {project.slides?.map((slide, index) => (
                                        <div
                                            key={slide.id}
                                            className={`relative aspect-[4/5] rounded-lg overflow-hidden cursor-pointer border-2 transition-all ${index === currentSlideIndex
                                                ? 'border-pink-500'
                                                : 'border-transparent hover:border-slate-400'
                                                }`}
                                            onClick={() => setCurrentSlideIndex(index)}
                                        >
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

                                            {/* Minimal text preview (Thumbnail) */}
                                            <div
                                                className="absolute inset-0 p-2 flex pointer-events-none overflow-hidden"
                                                style={{
                                                    justifyContent: slide.layoutPosition?.includes('left') ? 'flex-start' : slide.layoutPosition?.includes('right') ? 'flex-end' : 'center',
                                                    alignItems: slide.layoutPosition?.includes('top') ? 'flex-start' : slide.layoutPosition?.includes('bottom') ? 'flex-end' : 'center',
                                                }}
                                            >
                                                <div
                                                    style={{
                                                        fontSize: '5px',
                                                        lineHeight: '1.2',
                                                        color: slide.fontColor || '#FFFFFF',
                                                        textAlign: 'center',
                                                        textShadow: '0 1px 2px rgba(0,0,0,0.8)'
                                                    }}
                                                    dangerouslySetInnerHTML={{ __html: slide.textContent?.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').substring(0, 50) + '...' }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                    <div
                                        className="aspect-[4/5] rounded-lg border-2 border-dashed border-gray-300 hover:border-pink-400 hover:bg-pink-50/50 flex flex-col items-center justify-center cursor-pointer transition-colors text-muted-foreground hover:text-pink-600"
                                        onClick={handleAddSlide}
                                    >
                                        <Plus className="h-6 w-6 mb-1" />
                                        <span className="text-xs font-medium">Add</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            )}
        </div>
    )
}
