'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, ArrowLeft, Wand2, Copy, PlayCircle, Eye, AlignLeft } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

interface Scene {
    id: string
    sceneNumber: number
    visualContext: string
    voiceoverText: string
}

interface ScriptProject {
    id: string
    title: string
    sourceUrl?: string
    sourceContent?: string
    status: string
    scenes: Scene[]
    createdAt: string
}

export default function VideoScriptEditorPage() {
    const params = useParams()
    const router = useRouter()
    const projectId = params.id as string

    const [project, setProject] = useState<ScriptProject | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isGenerating, setIsGenerating] = useState(false)
    const [editedContent, setEditedContent] = useState('')

    const fetchProject = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/video-scripts/projects/${projectId}`, {
                headers: { 'Cache-Control': 'no-cache' },
                credentials: 'include'
            })
            if (response.ok) {
                const data = await response.json()
                setProject(data)
                setEditedContent(data.sourceContent || '')
            }
        } catch (error) {
            console.error('Failed to fetch script project:', error)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        if (projectId) fetchProject()
    }, [projectId])

    const handleGenerateScript = async () => {
        if (!editedContent.trim()) {
            toast.info('Harap berikan beberapa konten sumber terlebih dahulu.')
            return
        }

        setIsGenerating(true)
        try {
            const response = await fetch(`${API_BASE_URL}/video-scripts/projects/${projectId}/generate-script`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    content: editedContent,
                    targetDurationSeconds: 60
                })
            })

            if (response.ok) {
                await fetchProject()
                toast.success('Skrip video berhasil dibuat!')
            } else {
                const errorData = await response.json()
                toast.error(`Kesalahan membuat skrip: ${errorData.message || 'Kesalahan tidak diketahui'}`)
            }
        } catch (error) {
            console.error('Failed to generate script:', error)
            toast.error('Terjadi kesalahan jaringan saat membuat skrip.')
        } finally {
            setIsGenerating(false)
        }
    }

    const handleCopyScript = () => {
        if (!project?.scenes || project.scenes.length === 0) return

        const fullScript = project.scenes.map(s =>
            `--- ADEGAN ${s.sceneNumber} ---\n[Visual]: ${s.visualContext}\n[Voiceover]: ${s.voiceoverText}\n`
        ).join('\n')

        navigator.clipboard.writeText(fullScript).then(() => {
            toast.success('Skrip disalin ke papan klip!')
        })
    }

    if (isLoading) {
        return (
            <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
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

    const hasScenes = project.scenes && project.scenes.length > 0

    return (
        <div className="container mx-auto p-6 max-w-7xl">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.push('/video-scripts')}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold leading-tight">{project.title}</h1>
                        {project.sourceUrl && (
                            <a href={project.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">
                                Sumber: {new URL(project.sourceUrl).hostname}
                            </a>
                        )}
                    </div>
                </div>

                <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                    <Button
                        variant={hasScenes ? "outline" : "default"}
                        className={!hasScenes ? "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 w-full md:w-auto" : "w-full md:w-auto"}
                        onClick={handleGenerateScript}
                        disabled={isGenerating || !editedContent.trim()}
                    >
                        {isGenerating ? (
                            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Membuat...</>
                        ) : (
                            <><Wand2 className="mr-2 h-4 w-4" /> {hasScenes ? "Buat Ulang Skrip" : "Buat Skrip (1 Token)"}</>
                        )}
                    </Button>

                    {hasScenes && (
                        <>
                            <Button variant="secondary" onClick={handleCopyScript} className="whitespace-nowrap">
                                <Copy className="mr-2 h-4 w-4" /> Salin Semua
                            </Button>
                            <Button variant="outline" disabled className="whitespace-nowrap border-indigo-200 text-indigo-700 bg-indigo-50/50">
                                <PlayCircle className="mr-2 h-4 w-4" /> Buat Voiceover <Badge variant="secondary" className="ml-2 text-[10px] h-4 px-1 bg-indigo-100 text-indigo-800">SEGERA</Badge>
                            </Button>
                        </>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Column: Source Content */}
                <div className="lg:col-span-4 space-y-6">
                    <Card className="glass border-2 border-white/60 dark:border-white/20 overflow-hidden hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-none transition-all duration-500 rounded-3xl sticky top-6">
                        <CardHeader className="pb-3 bg-indigo-50/50 rounded-t-xl">
                            <CardTitle className="text-lg flex items-center">
                                <AlignLeft className="h-4 w-4 mr-2 text-indigo-500" /> Konten Sumber
                            </CardTitle>
                            <CardDescription>
                                Teks di bawah ini akan diubah menjadi skrip video yang bergerak cepat. Anda dapat mengeditnya sebelum membuat skrip.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-4">
                            <Textarea
                                placeholder="Tempel artikel atau konten mentah Anda di sini..."
                                className="min-h-[500px] resize-y"
                                value={editedContent}
                                onChange={(e) => setEditedContent(e.target.value)}
                            />
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Generated Script Scenes */}
                <div className="lg:col-span-8">
                    {!hasScenes ? (
                        <div className="h-full min-h-[400px] flex flex-col items-center justify-center border-2 border-dashed rounded-xl border-slate-200 bg-slate-50/50 p-12 text-center">
                            <Wand2 className="h-12 w-12 text-slate-300 mb-4" />
                            <h3 className="text-xl font-medium text-slate-700 mb-2">Belum ada skrip yang dibuat</h3>
                            <p className="text-slate-500 max-w-sm">
                                Tinjau konten sumber Anda di sebelah kiri, lalu klik Buat Skrip untuk membiarkan AI membuat hook visual dan voiceover Anda!
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {project.scenes.map((scene, index) => (
                                <Card key={scene.id} className="glass border-2 border-white/60 dark:border-white/20 overflow-hidden hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-none transition-all duration-500 rounded-3xl">
                                    <div className="bg-slate-900 text-slate-100 px-4 py-2 flex items-center justify-between">
                                        <div className="font-semibold tracking-wide text-sm">
                                            ADEGAN {scene.sceneNumber}
                                            {index === 0 && <Badge variant="secondary" className="ml-3 bg-pink-500/20 text-pink-300 border-none">Hook</Badge>}
                                            {index === project.scenes.length - 1 && <Badge variant="secondary" className="ml-3 bg-blue-500/20 text-blue-300 border-none">Ajakan Bertindak</Badge>}
                                        </div>
                                    </div>

                                    <CardContent className="p-0">
                                        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-100">
                                            {/* Visual Context Column */}
                                            <div className="p-5 bg-slate-50/50">
                                                <div className="flex items-center text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
                                                    <Eye className="h-3.5 w-3.5 mr-1.5" /> Visual / B-Roll
                                                </div>
                                                <p className="text-sm text-slate-700 leading-relaxed font-medium">
                                                    {scene.visualContext}
                                                </p>
                                            </div>

                                            {/* Voiceover Column */}
                                            <div className="p-5">
                                                <div className="flex items-center text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
                                                    <PlayCircle className="h-3.5 w-3.5 mr-1.5" /> Teks Voiceover
                                                </div>
                                                <p className="text-base text-slate-900 leading-relaxed">
                                                    "{scene.voiceoverText}"
                                                </p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
