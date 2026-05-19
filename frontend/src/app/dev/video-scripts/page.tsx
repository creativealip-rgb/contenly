'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Film, Plus, Loader2, Wand2, Trash2, ExternalLink, Calendar } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { motion } from 'framer-motion'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

interface ScriptProject {
    id: string
    title: string
    sourceUrl: string
    status: string
    createdAt: string
    updatedAt: string
}

export default function DevVideoScriptsPage() {
    const router = useRouter()
    const [projects, setProjects] = useState<ScriptProject[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isCreating, setIsCreating] = useState(false)
    const [newTitle, setNewTitle] = useState('')
    const [newUrl, setNewUrl] = useState('')
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const fetchProjects = async () => {
        try {
            setIsLoading(true)
            setError(null)
            const response = await fetch(`${API_BASE_URL}/video-scripts/projects`, {
                headers: { 'Cache-Control': 'no-cache' },
                credentials: 'include',
            })
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`)
            }
            const data = await response.json()
            setProjects(data)
        } catch (e) {
            console.error('Failed to fetch video scripts:', e)
            setError(e instanceof Error ? e.message : 'Unknown error')
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchProjects()
    }, [])

    const handleCreateProject = async () => {
        if (!newTitle.trim()) return
        try {
            setIsCreating(true)
            const response = await fetch(`${API_BASE_URL}/video-scripts/projects`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ title: newTitle, sourceUrl: newUrl }),
            })
            if (response.ok) {
                const newProject = await response.json()
                setIsDialogOpen(false)
                setNewTitle('')
                setNewUrl('')
                router.push(`/dev/video-scripts/${newProject.id}`)
            }
        } catch (e) {
            console.error('Failed to create script:', e)
        } finally {
            setIsCreating(false)
        }
    }

    const handleDeleteProject = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation()
        if (!confirm('Hapus script ini?')) return
        try {
            const response = await fetch(`${API_BASE_URL}/video-scripts/projects/${id}`, {
                method: 'DELETE',
                credentials: 'include',
            })
            if (response.ok) fetchProjects()
        } catch (err) {
            console.error('Failed to delete script:', err)
        }
    }

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-7xl space-y-8">
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <h1 className="text-3xl font-black tracking-tight">Script Studio (Dev)</h1>
                    <p className="text-sm text-slate-500">Sandbox isolasi untuk mengembangkan fitur video script tanpa login.</p>
                </div>

                <div className="flex gap-2">
                    <Button variant="outline" onClick={fetchProjects} disabled={isLoading}>
                        <Loader2 className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                        Sinkronisasi
                    </Button>
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="mr-2 h-4 w-4" />
                                Buat Script
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md">
                            <DialogHeader>
                                <DialogTitle>Buat Proyek Script Baru</DialogTitle>
                                <DialogDescription>Mulai dengan judul dan URL sumber (opsional).</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label>Identitas Script</Label>
                                    <Input placeholder="cth: Apple Vision Pro Roast" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} disabled={isCreating} />
                                </div>
                                <div className="space-y-2">
                                    <Label>URL Referensi (Opsional)</Label>
                                    <Input placeholder="https://techcrunch.com/..." value={newUrl} onChange={(e) => setNewUrl(e.target.value)} disabled={isCreating} />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isCreating}>
                                    Batal
                                </Button>
                                <Button onClick={handleCreateProject} disabled={!newTitle.trim() || isCreating}>
                                    {isCreating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
                                    Buat
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {error && (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                    Gagal memuat data: <code>{error}</code>. Pastikan backend jalan dan <code>DEV_BYPASS_AUTH=1</code> aktif.
                </div>
            )}

            {isLoading ? (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 2xl:grid-cols-3">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="h-56 animate-pulse rounded-2xl bg-slate-100" />
                    ))}
                </div>
            ) : projects.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-200 bg-white/50 p-16 text-center">
                    <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-3xl bg-blue-50">
                        <Film className="h-8 w-8 text-blue-600" />
                    </div>
                    <h2 className="mb-2 text-xl font-bold">Belum ada script</h2>
                    <p className="max-w-md text-sm text-slate-500">Mulai proyek pertama untuk testing fitur.</p>
                    <Button className="mt-6" onClick={() => setIsDialogOpen(true)}>
                        Mulai Proyek Pertama
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 2xl:grid-cols-3">
                    {projects.map((project, idx) => (
                        <motion.div
                            key={project.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: idx * 0.04 }}
                            whileHover={{ y: -2 }}
                            className="cursor-pointer"
                            onClick={() => router.push(`/dev/video-scripts/${project.id}`)}
                        >
                            <Card className="group flex h-full flex-col rounded-2xl border-2 border-slate-200/60 bg-white p-6 transition-all hover:border-blue-300 hover:shadow-lg">
                                <Badge className={`mb-4 w-fit text-[10px] uppercase ${project.status === 'ready' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                                    {project.status || 'draft'}
                                </Badge>
                                <h3 className="mb-4 line-clamp-2 text-lg font-bold leading-tight transition-colors group-hover:text-blue-600">
                                    {project.title}
                                </h3>
                                <div className="mt-auto flex items-center justify-between">
                                    <div className="flex items-center text-xs text-slate-400">
                                        <Calendar className="mr-1.5 h-3.5 w-3.5" />
                                        {new Date(project.createdAt).toLocaleDateString()}
                                    </div>
                                    <div className="flex gap-2">
                                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-500 opacity-0 transition-opacity group-hover:opacity-100" onClick={(e) => handleDeleteProject(e, project.id)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                        <ExternalLink className="h-4 w-4 text-slate-400 transition-colors group-hover:text-blue-600" />
                                    </div>
                                </div>
                            </Card>
                        </motion.div>
                    ))}
                </div>
            )}
        </motion.div>
    )
}
