'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Plus, Scissors, Trash2, Loader2, Clock, AlertCircle, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import { api } from '@/lib/api'

interface Project {
  id: string
  title: string
  sourceUrl: string
  status: string
  duration?: number
  segments?: any[]
  createdAt: string
}

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  created: { label: 'Baru', color: 'bg-slate-100 text-slate-700', icon: Clock },
  downloading: { label: 'Mengunduh...', color: 'bg-blue-100 text-blue-700', icon: Loader2 },
  transcribing: { label: 'Transkripsi...', color: 'bg-purple-100 text-purple-700', icon: Loader2 },
  analyzing: { label: 'Menganalisis...', color: 'bg-amber-100 text-amber-700', icon: Loader2 },
  ready: { label: 'Siap', color: 'bg-green-100 text-green-700', icon: CheckCircle2 },
  failed: { label: 'Gagal', color: 'bg-red-100 text-red-700', icon: AlertCircle },
}

export default function VideoClipsPage() {
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [url, setUrl] = useState('')
  const [title, setTitle] = useState('')

  const fetchProjects = async () => {
    try {
      const data = await api.get<Project[]>('/video-clips')
      setProjects(data)
    } catch { /* */ } finally { setLoading(false) }
  }

  useEffect(() => {
    fetchProjects()
    const interval = setInterval(fetchProjects, 5000)
    return () => clearInterval(interval)
  }, [])

  const createProject = async () => {
    if (!url.trim()) return toast.error('URL wajib diisi')
    setCreating(true)
    try {
      const project = await api.post<Project>('/video-clips', { sourceUrl: url, title: title || undefined })
      setDialogOpen(false)
      setUrl('')
      setTitle('')
      router.push(`/video-clips/${project.id}`)
    } catch (err: any) { toast.error(err.message || 'Gagal membuat project') }
    finally { setCreating(false) }
  }

  const deleteProject = async (id: string) => {
    if (!confirm('Hapus project ini?')) return
    await api.delete(`/video-clips/${id}`)
    setProjects(prev => prev.filter(p => p.id !== id))
    toast.success('Project dihapus')
  }

  const formatDuration = (s?: number) => {
    if (!s) return '-'
    const m = Math.floor(s / 60)
    const sec = Math.floor(s % 60)
    return `${m}:${String(sec).padStart(2, '0')}`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Video Clips</h1>
          <p className="text-muted-foreground">Clip video panjang menjadi short viral</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Project Baru</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Buat Clip Project</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <label className="text-sm font-medium">YouTube URL / Video URL</label>
                <Input
                  placeholder="https://youtube.com/watch?v=..."
                  value={url}
                  onChange={e => setUrl(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Judul (opsional)</label>
                <Input
                  placeholder="Nama project"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                />
              </div>
              <Button onClick={createProject} disabled={creating} className="w-full">
                {creating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Buat Project
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {projects.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Scissors className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">Belum ada project. Buat yang pertama!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map(project => {
            const status = statusConfig[project.status] || statusConfig.created
            const StatusIcon = status.icon
            return (
              <Card
                key={project.id}
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => router.push(`/video-clips/${project.id}`)}
              >
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-start justify-between">
                    <h3 className="font-semibold truncate flex-1">{project.title}</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 shrink-0"
                      onClick={e => { e.stopPropagation(); deleteProject(project.id) }}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{project.sourceUrl}</p>
                  <div className="flex items-center justify-between">
                    <Badge className={status.color}>
                      <StatusIcon className={`h-3 w-3 mr-1 ${project.status.includes('ing') ? 'animate-spin' : ''}`} />
                      {status.label}
                    </Badge>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      {project.duration && <span>{formatDuration(project.duration)}</span>}
                      {project.segments && <span>{project.segments.length} clips</span>}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </motion.div>
  )
}
