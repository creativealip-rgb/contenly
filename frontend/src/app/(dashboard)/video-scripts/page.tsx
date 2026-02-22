'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Plus, Clock, ExternalLink, RefreshCw, Trash2, Film } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { motion, AnimatePresence } from 'framer-motion'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

interface ScriptProject {
    id: string
    title: string
    sourceUrl: string
    status: string
    createdAt: string
    updatedAt: string
}

export default function VideoScriptsPage() {
    const router = useRouter()
    const [projects, setProjects] = useState<ScriptProject[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isCreating, setIsCreating] = useState(false)
    const [newTitle, setNewTitle] = useState('')
    const [newUrl, setNewUrl] = useState('')
    const [isDialogOpen, setIsDialogOpen] = useState(false)

    const fetchProjects = async () => {
        try {
            setIsLoading(true)
            const response = await fetch(`${API_BASE_URL}/video-scripts/projects`, {
                headers: { 'Cache-Control': 'no-cache' },
                credentials: 'include'
            })
            if (response.ok) {
                const data = await response.json()
                setProjects(data)
            }
        } catch (error) {
            console.error('Failed to fetch video scripts:', error)
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
                body: JSON.stringify({
                    title: newTitle,
                    sourceUrl: newUrl
                })
            })

            if (response.ok) {
                const newProject = await response.json()
                setIsDialogOpen(false)
                setNewTitle('')
                setNewUrl('')
                router.push(`/video-scripts/${newProject.id}`)
            }
        } catch (error) {
            console.error('Failed to create script:', error)
        } finally {
            setIsCreating(false)
        }
    }

    const handleDeleteProject = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation()
        if (!confirm('Are you sure you want to delete this script?')) return

        try {
            const response = await fetch(`${API_BASE_URL}/video-scripts/projects/${id}`, {
                method: 'DELETE',
                credentials: 'include'
            })
            if (response.ok) {
                fetchProjects()
            }
        } catch (error) {
            console.error('Failed to delete script:', error)
        }
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'ready': return 'bg-green-100 text-green-800 border-green-200'
            case 'generating': return 'bg-blue-100 text-blue-800 border-blue-200'
            case 'error': return 'bg-red-100 text-red-800 border-red-200'
            default: return 'bg-gray-100 text-gray-800 border-gray-200'
        }
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
        >
            <div className="flex justify-between items-center">
                <div className="space-y-1">
                    <h1 className="text-4xl font-black tracking-tighter bg-gradient-to-r from-slate-900 to-slate-500 dark:from-white dark:to-slate-400 bg-clip-text text-transparent">
                        Script Studio
                    </h1>
                    <p className="text-slate-500 font-medium font-outfit">Convert articles into viral hooks and voiceover scripts.</p>
                </div>

                <div className="flex gap-4">
                    <Button
                        variant="ghost"
                        onClick={fetchProjects}
                        disabled={isLoading}
                        className="h-12 px-6 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-white/40 glass border-none transition-all active:scale-95"
                    >
                        <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                        Sync
                    </Button>

                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="h-12 px-8 bg-slate-900 hover:bg-black text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-slate-200 transition-all hover:scale-[1.02] active:scale-[0.98]">
                                <Plus className="h-4 w-4 mr-2" />
                                Create Script
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="glass border-none max-w-md">
                            <DialogHeader>
                                <DialogTitle className="text-2xl font-black tracking-tight">Generate Narrative</DialogTitle>
                                <DialogDescription className="font-medium">
                                    Transform URLs into high-impact video scripts.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-6">
                                <div className="space-y-2">
                                    <Label className="text-[10px] uppercase font-black tracking-widest text-slate-400 ml-1">Script Identity</Label>
                                    <Input
                                        placeholder="e.g., Apple Vision Pro Roast"
                                        value={newTitle}
                                        onChange={(e) => setNewTitle(e.target.value)}
                                        disabled={isCreating}
                                        className="h-12 rounded-xl bg-white/50 border-slate-200 focus:ring-blue-400 font-bold"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] uppercase font-black tracking-widest text-slate-400 ml-1">Reference URL</Label>
                                    <Input
                                        placeholder="https://techcrunch.com/..."
                                        value={newUrl}
                                        onChange={(e) => setNewUrl(e.target.value)}
                                        disabled={isCreating}
                                        className="h-12 rounded-xl bg-white/50 border-slate-200 focus:ring-blue-400 font-mono text-xs"
                                    />
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide px-1 italic">Context is key for better scripts.</p>
                                </div>
                            </div>
                            <DialogFooter className="gap-2">
                                <Button variant="ghost" className="rounded-xl font-bold" onClick={() => setIsDialogOpen(false)} disabled={isCreating}>Cancel</Button>
                                <Button
                                    className="h-12 px-8 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black uppercase tracking-widest shadow-lg shadow-blue-100"
                                    onClick={handleCreateProject}
                                    disabled={!newTitle.trim() || isCreating}
                                >
                                    {isCreating ? 'Engine Starting...' : 'Ignite Generation'}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-8 pb-12">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="card-clean h-64 animate-pulse bg-slate-50/50" />
                    ))}
                </div>
            ) : projects.length === 0 ? (
                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="flex flex-col items-center justify-center p-20 text-center card-clean border-dashed border-2 bg-slate-50/30"
                >
                    <div className="h-20 w-20 bg-blue-50 rounded-[2.5rem] flex items-center justify-center mb-6 shadow-inner">
                        <Film className="h-10 w-10 text-blue-600" />
                    </div>
                    <h2 className="text-2xl font-black tracking-tight mb-3">Quiet on the set</h2>
                    <p className="max-w-md text-slate-500 font-medium">
                        Your production studio is ready. Input a story and we'll craft the performance tools you need.
                    </p>
                    <Button
                        className="mt-8 h-12 px-8 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-blue-100"
                        onClick={() => setIsDialogOpen(true)}
                    >
                        Begin First Production
                    </Button>
                </motion.div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-8 pb-12">
                    {projects.map((project, idx) => (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: idx * 0.05 }}
                            key={project.id}
                            whileHover={{ y: -8, scale: 1.02 }}
                            className="group cursor-pointer"
                            onClick={() => router.push(`/video-scripts/${project.id}`)}
                        >
                            <Card className="card-clean h-full border-none shadow-sm flex flex-col p-6 overflow-hidden">
                                <div className="flex justify-between items-start mb-6">
                                    <Badge className={`rounded-lg px-2 py-0.5 font-extrabold uppercase text-[9px] tracking-wider border-none ${project.status === 'ready'
                                        ? 'bg-emerald-100 text-emerald-700'
                                        : 'bg-blue-100 text-blue-700'
                                        }`}>
                                        {project.status || 'draft'}
                                    </Badge>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-9 w-9 opacity-0 group-hover:opacity-100 transition-opacity text-rose-500 hover:bg-rose-50 rounded-xl"
                                        onClick={(e) => handleDeleteProject(e, project.id)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>

                                <h3 className="text-lg font-black leading-tight uppercase tracking-tight line-clamp-2 mb-4 group-hover:text-blue-600 transition-colors">
                                    {project.title}
                                </h3>

                                <div className="mt-auto pt-6 border-t border-slate-50 flex items-center justify-between">
                                    <div className="flex items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                        <Clock className="h-3 w-3 mr-1.5" />
                                        {format(new Date(project.updatedAt), 'MMM d, yy')}
                                    </div>
                                    {project.sourceUrl && (
                                        <div className="h-8 w-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                                            <ExternalLink className="h-4 w-4" />
                                        </div>
                                    )}
                                </div>
                            </Card>
                        </motion.div>
                    ))}
                </div>
            )}
        </motion.div>
    )
}
