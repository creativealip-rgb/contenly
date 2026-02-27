'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useConfirm } from '@/components/ui/confirm-dialog'
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
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import {
    Instagram,
    Plus,
    Loader2,
    Sparkles,
    Image as ImageIcon,
    Trash2,
    Download,
    RefreshCw,
    Palette,
    Type,
    Layout,
    ChevronLeft,
    ChevronRight,
    Eye,
    Calendar,
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
    slides?: Slide[]
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

interface StylePreset {
    id: string
    name: string
    description: string
    promptTemplate: string
}

interface Font {
    family: string
    category: string
    variants: string[]
}

export default function InstagramStudioPage() {
    const router = useRouter()
    const confirm = useConfirm()
    const [projects, setProjects] = useState<Project[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isCreating, setIsCreating] = useState(false)
    const [isNewProjectOpen, setIsNewProjectOpen] = useState(false)

    const [newProject, setNewProject] = useState({
        title: '',
        sourceUrl: '',
        sourceContent: '',
        globalStyle: 'modern minimal',
        fontFamily: 'Montserrat',
    })
    const [isFetchingUrl, setIsFetchingUrl] = useState(false)

    useEffect(() => {
        fetchProjects()
    }, [])

    const fetchProjects = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/instagram-studio/projects`, {
                credentials: 'include',
                headers: { 'ngrok-skip-browser-warning': 'true' },
            })
            const data = await response.json()
            setProjects(Array.isArray(data) ? data : [])
        } catch (error) {
            console.error('Failed to fetch projects:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleCreateProject = async () => {
        if (!newProject.title) return

        setIsCreating(true)
        try {
            const response = await fetch(`${API_BASE_URL}/instagram-studio/projects`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(newProject),
            })

            if (response.ok) {
                const project = await response.json()
                router.push(`/instagram-studio/${project.id}`)
            }
        } catch (error) {
            console.error('Failed to create project:', error)
        } finally {
            setIsCreating(false)
        }
    }

    const handleFetchUrl = async () => {
        if (!newProject.sourceUrl) {
            toast.info('Harap masukkan URL Sumber terlebih dahulu')
            return
        }

        setIsFetchingUrl(true)
        try {
            const response = await fetch(`${API_BASE_URL}/instagram-studio/fetch-url?url=${encodeURIComponent(newProject.sourceUrl)}`, {
                credentials: 'include',
                headers: { 'ngrok-skip-browser-warning': 'true' },
            })
            if (response.ok) {
                const data = await response.json()
                setNewProject(prev => ({
                    ...prev,
                    title: data.title || prev.title,
                    sourceContent: data.content || prev.sourceContent
                }))
            } else {
                toast.error('Gagal mengambil konten URL')
            }
        } catch (error) {
            console.error('Failed to fetch URL:', error)
            toast.error('Terjadi kesalahan saat mengambil URL')
        } finally {
            setIsFetchingUrl(false)
        }
    }

    const handleDeleteProject = async (id: string) => {
        const confirmed = await confirm({
            title: 'Hapus Proyek',
            description: 'Apakah Anda yakin ingin menghapus proyek ini?',
            confirmText: 'Hapus',
            cancelText: 'Batal',
            variant: 'destructive',
            onConfirm: async () => {
                try {
                    await fetch(`${API_BASE_URL}/instagram-studio/projects/${id}`, {
                        method: 'DELETE',
                        credentials: 'include',
                    })
                    fetchProjects()
                } catch (error) {
                    console.error('Failed to delete project:', error)
                }
            },
        })
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'draft':
                return 'bg-gray-100 text-gray-700'
            case 'storyboard':
                return 'bg-blue-100 text-blue-700'
            case 'generating':
                return 'bg-yellow-100 text-yellow-700'
            case 'ready':
                return 'bg-green-100 text-green-700'
            default:
                return 'bg-gray-100 text-gray-700'
        }
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <h1 className="text-4xl font-black tracking-tighter bg-gradient-to-r from-slate-900 to-slate-500 dark:from-white dark:to-slate-400 bg-clip-text text-transparent">
                        Instagram Studio
                    </h1>
                    <p className="text-slate-500 font-medium">
                        Buat carousel Instagram berbasis AI dari konten Anda
                    </p>
                </div>
                <Dialog open={isNewProjectOpen} onOpenChange={setIsNewProjectOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700">
                            <Plus className="h-4 w-4 mr-2" />
                            Proyek Baru
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                        {(isCreating || isFetchingUrl) && (
                            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
                                <div className="flex flex-col items-center gap-3">
                                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                                    <p className="text-sm font-medium text-muted-foreground">
                                        {isFetchingUrl ? 'Mengambil konten dari URL...' : 'Membuat proyek...'}
                                    </p>
                                </div>
                            </div>
                        )}
                        <DialogHeader>
                            <DialogTitle>Buat Proyek Carousel Baru</DialogTitle>
                            <DialogDescription>
                                Mulai dengan memasukkan konten atau URL untuk membuat carousel Instagram Anda
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Judul Proyek</Label>
                                <Input
                                    placeholder="Carousel Instagram Saya"
                                    value={newProject.title}
                                    onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>URL Sumber (Opsional)</Label>
                                <div className="flex gap-2">
                                    <Input
                                        placeholder="https://example.com/article"
                                        value={newProject.sourceUrl}
                                        onChange={(e) => setNewProject({ ...newProject, sourceUrl: e.target.value })}
                                    />
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        onClick={handleFetchUrl}
                                        disabled={isFetchingUrl || !newProject.sourceUrl}
                                    >
                                        {isFetchingUrl ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                                        Tarik Berita
                                    </Button>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Konten</Label>
                                <Textarea
                                    placeholder="Tempelkan konten artikel Anda di sini, atau masukkan URL di atas untuk menarik data..."
                                    value={newProject.sourceContent}
                                    onChange={(e) => setNewProject({ ...newProject, sourceContent: e.target.value })}
                                    className="min-h-[150px]"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Gaya Visual</Label>
                                    <Select
                                        value={newProject.globalStyle}
                                        onValueChange={(v) => setNewProject({ ...newProject, globalStyle: v })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="modern minimal">Modern Minimal</SelectItem>
                                            <SelectItem value="tech futuristic">Tech Futuristic</SelectItem>
                                            <SelectItem value="cinematic">Cinematic</SelectItem>
                                            <SelectItem value="nature organic">Nature Organic</SelectItem>
                                            <SelectItem value="bold colorful">Bold Colorful</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Jenis Huruf</Label>
                                    <Select
                                        value={newProject.fontFamily}
                                        onValueChange={(v) => setNewProject({ ...newProject, fontFamily: v })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Montserrat">Montserrat</SelectItem>
                                            <SelectItem value="Poppins">Poppins</SelectItem>
                                            <SelectItem value="Playfair Display">Playfair Display</SelectItem>
                                            <SelectItem value="Roboto">Roboto</SelectItem>
                                            <SelectItem value="Bebas Neue">Bebas Neue</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsNewProjectOpen(false)}>
                                Batal
                            </Button>
                            <Button onClick={handleCreateProject} disabled={isCreating || isFetchingUrl || !newProject.title}>
                                {isCreating ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Membuat...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="h-4 w-4 mr-2" />
                                        Buat Proyek
                                    </>
                                )}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {projects.length === 0 ? (
                <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <Instagram className="h-16 w-16 text-muted-foreground/50 mb-4" />
                        <h3 className="text-lg font-medium mb-2">Belum ada proyek</h3>
                        <p className="text-muted-foreground text-center max-w-sm mb-4">
                            Buat proyek carousel Instagram pertama Anda untuk memulai
                        </p>
                        <Button onClick={() => setIsNewProjectOpen(true)}>
                            <Plus className="h-4 w-4 mr-2" />
                            Buat Proyek Pertama
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-6 md:grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3">
                    {projects.map((project) => (
                        <Card
                            key={project.id}
                            className="group relative h-full glass border-2 border-white/60 dark:border-white/20 overflow-hidden hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-none transition-all duration-500 rounded-[2.5rem] cursor-pointer"
                            onClick={() => router.push(`/instagram-studio/${project.id}`)}
                        >
                            <CardHeader className="pt-8 px-8">
                                <div className="flex items-start justify-between">
                                    <CardTitle className="text-xl font-black tracking-tighter leading-tight group-hover:text-blue-600 transition-colors">
                                        {project.title}
                                    </CardTitle>
                                    <Badge className={getStatusColor(project.status)}>
                                        {project.status}
                                    </Badge>
                                </div>
                                <CardDescription className="text-xs font-bold text-slate-400 group-hover:text-slate-500 transition-colors mt-2">
                                    <span className="flex items-center gap-1.5">
                                        {project.totalSlides} slide • {project.globalStyle}
                                    </span>
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="px-8 pb-8 mt-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
                                        <Calendar className="h-3.5 w-3.5" />
                                        {new Date(project.createdAt).toLocaleDateString()}
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-xl"
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            handleDeleteProject(project.id)
                                        }}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}
