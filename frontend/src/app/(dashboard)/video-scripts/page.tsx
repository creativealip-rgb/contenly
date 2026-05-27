'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Calendar,
  Clock,
  ExternalLink,
  Eye,
  Film,
  Loader2,
  Plus,
  Search,
  Sparkles,
  Trash2,
  Wand2,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { motion } from 'framer-motion'
import { useConfirm } from '@/components/ui/confirm-dialog'
import {
  useVideoProjects,
  useCreateVideoProject,
  useDeleteVideoProject,
  type ScriptProject,
} from '@/hooks/use-video-scripts'
import { RenderJobsTracker } from './[id]/_components'

type StatusFilter = 'all' | 'ready' | 'draft' | 'generating' | 'error'
type SortKey = 'recent' | 'title' | 'duration'

const formatDuration = (sec?: number) => {
  if (!sec) return null
  const m = Math.floor(sec / 60)
  const s = Math.round(sec % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export default function VideoScriptsPage() {
  const router = useRouter()
  const confirm = useConfirm()
  const { data: projects = [], isLoading, refetch } = useVideoProjects()
  const createMutation = useCreateVideoProject()
  const deleteMutation = useDeleteVideoProject()

  const [newTitle, setNewTitle] = useState('')
  const [newUrl, setNewUrl] = useState('')
  const [newSource, setNewSource] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [sortKey, setSortKey] = useState<SortKey>('recent')

  const filtered = useMemo(() => {
    let items = [...projects]
    if (statusFilter !== 'all') items = items.filter((p) => p.status === statusFilter)
    const q = search.trim().toLowerCase()
    if (q) items = items.filter((p) => p.title.toLowerCase().includes(q) || (p.headline || '').toLowerCase().includes(q))
    if (sortKey === 'title') items.sort((a, b) => a.title.localeCompare(b.title))
    else if (sortKey === 'duration') items.sort((a, b) => (b.totalEstimatedDuration || 0) - (a.totalEstimatedDuration || 0))
    else items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    return items
  }, [projects, statusFilter, sortKey, search])

  const counts = useMemo(() => {
    return {
      all: projects.length,
      ready: projects.filter((p) => p.status === 'ready').length,
      draft: projects.filter((p) => p.status === 'draft' || !p.status).length,
      generating: projects.filter((p) => p.status === 'generating').length,
      error: projects.filter((p) => p.status === 'error').length,
    }
  }, [projects])

  const handleCreateProject = async () => {
    if (!newTitle.trim()) return
    createMutation.mutate(
      {
        title: newTitle,
        sourceUrl: newUrl || undefined,
        sourceContent: newSource || undefined,
      },
      {
        onSuccess: (newProject) => {
          setIsDialogOpen(false)
          setNewTitle('')
          setNewUrl('')
          setNewSource('')
          router.push(`/video-scripts/${newProject.id}`)
        },
      },
    )
  }

  const handleDeleteProject = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    await confirm({
      title: 'Hapus Script',
      description: 'Apakah Anda yakin ingin menghapus script ini?',
      confirmText: 'Hapus',
      cancelText: 'Batal',
      variant: 'destructive',
      onConfirm: async () => {
        deleteMutation.mutate(id)
      },
    })
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex flex-wrap justify-between items-end gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-4xl font-black tracking-tighter bg-gradient-to-r from-slate-900 to-slate-500 dark:from-white dark:to-slate-400 bg-clip-text text-transparent">
            Script Studio
          </h1>
          <p className="text-slate-500 font-medium font-outfit">
            Ubah artikel atau ide menjadi hook viral, naskah, dan voiceover lengkap.
          </p>
        </div>

        <div className="flex gap-3">
          <Button
            variant="ghost"
            onClick={() => refetch()}
            disabled={isLoading}
            className="h-12 px-6 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-white/40 glass border-none transition-all active:scale-95"
          >
            <Loader2 className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="h-12 px-8 bg-slate-900 hover:bg-black text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-slate-200">
                <Plus className="h-4 w-4 mr-2" />
                Buat Script
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Buat Proyek Script Baru</DialogTitle>
                <DialogDescription>
                  Mulai dengan memasukkan judul, URL referensi (opsional), dan konten sumber. Konten akan dipakai langsung saat Generate Script.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label>Judul Project *</Label>
                  <Input
                    placeholder="cth: Apple Vision Pro Roast"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    disabled={createMutation.isPending}
                  />
                </div>
                <div className="space-y-2">
                  <Label>URL Referensi (Opsional)</Label>
                  <Input
                    placeholder="https://techcrunch.com/..."
                    value={newUrl}
                    onChange={(e) => setNewUrl(e.target.value)}
                    disabled={createMutation.isPending}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Konten Sumber (Opsional)</Label>
                  <Textarea
                    placeholder="Tempel artikel, briefing, atau ide. Kalau diisi, langsung bisa Generate Script di editor."
                    value={newSource}
                    onChange={(e) => setNewSource(e.target.value)}
                    disabled={createMutation.isPending}
                    className="min-h-[100px]"
                  />
                  <p className="text-xs text-muted-foreground">
                    {newSource.length > 0 && `${newSource.length} karakter`}
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={createMutation.isPending}>
                  Batal
                </Button>
                <Button onClick={handleCreateProject} disabled={!newTitle.trim() || createMutation.isPending}>
                  {createMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Membuat...
                    </>
                  ) : (
                    <>
                      <Wand2 className="h-4 w-4 mr-2" /> Buat & Buka Editor
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filter & Search */}
      {projects.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 p-3 rounded-2xl glass border-2 border-white/60 dark:border-white/10">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Cari judul atau headline..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 rounded-xl border-slate-200/60 bg-white/60"
            />
          </div>

          <div className="flex flex-wrap gap-1">
            {(
              [
                ['all', 'Semua', counts.all],
                ['ready', 'Ready', counts.ready],
                ['draft', 'Draft', counts.draft],
                ['generating', 'Generating', counts.generating],
                ['error', 'Error', counts.error],
              ] as Array<[StatusFilter, string, number]>
            ).map(([key, label, count]) => (
              <button
                key={key}
                onClick={() => setStatusFilter(key)}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-all ${
                  statusFilter === key
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-slate-500 hover:bg-white/60'
                }`}
              >
                {label}
                <span className={`text-[10px] ${statusFilter === key ? 'text-white/70' : 'text-slate-400'}`}>{count}</span>
              </button>
            ))}
          </div>

          <select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as SortKey)}
            className="h-9 rounded-xl border border-slate-200/60 bg-white/60 px-3 text-xs font-semibold"
          >
            <option value="recent">Terbaru</option>
            <option value="title">Nama A-Z</option>
            <option value="duration">Durasi terpanjang</option>
          </select>
        </div>
      )}

      {/* List */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-6 pb-12">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="card-clean h-64 animate-pulse bg-slate-50/50" />
          ))}
        </div>
      ) : filtered.length === 0 && projects.length === 0 ? (
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex flex-col items-center justify-center p-20 text-center card-clean border-dashed border-2 bg-slate-50/30"
        >
          <div className="h-20 w-20 bg-blue-50 rounded-[2.5rem] flex items-center justify-center mb-6 shadow-inner">
            <Film className="h-10 w-10 text-blue-600" />
          </div>
          <h2 className="text-2xl font-black tracking-tight mb-3">Belum ada script</h2>
          <p className="max-w-md text-slate-500 font-medium">
            Studio produksi Anda sudah siap. Masukkan cerita dan kami akan membuat naskah yang Anda butuhkan.
          </p>
          <Button
            className="mt-8 h-12 px-8 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-blue-100"
            onClick={() => setIsDialogOpen(true)}
          >
            Mulai Proyek Pertama
          </Button>
        </motion.div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-slate-200 p-12 text-center text-slate-400">
          <p className="text-sm font-semibold">Tidak ada hasil untuk filter ini.</p>
          <button
            onClick={() => {
              setSearch('')
              setStatusFilter('all')
            }}
            className="mt-2 text-xs font-bold uppercase text-blue-600 hover:underline"
          >
            Reset filter
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-6 pb-12">
          {filtered.map((project, idx) => (
            <ProjectCard
              key={project.id}
              project={project}
              idx={idx}
              onOpen={() => router.push(`/video-scripts/${project.id}`)}
              onDelete={(e) => handleDeleteProject(e, project.id)}
            />
          ))}
        </div>
      )}

      <RenderJobsTracker />
    </motion.div>
  )
}

function ProjectCard({
  project,
  idx,
  onOpen,
  onDelete,
}: {
  project: ScriptProject
  idx: number
  onOpen: () => void
  onDelete: (e: React.MouseEvent) => void
}) {
  const duration = formatDuration(project.totalEstimatedDuration)
  const status = project.status || 'draft'
  const statusColors: Record<string, string> = {
    ready: 'bg-emerald-100 text-emerald-700',
    generating: 'bg-blue-100 text-blue-700 animate-pulse',
    error: 'bg-red-100 text-red-700',
    draft: 'bg-slate-100 text-slate-600',
  }
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: idx * 0.04 }}
      whileHover={{ y: -3, scale: 1.005 }}
      className="group cursor-pointer"
      onClick={onOpen}
    >
      <Card className="group relative h-full glass border-2 border-white/60 dark:border-white/20 overflow-hidden hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-none transition-all duration-300 rounded-[2rem] flex flex-col">
        {/* Thumbnail / cover */}
        <div className="relative h-32 w-full overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200">
          {project.coverThumbnail ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={project.coverThumbnail} alt="" className="h-full w-full object-cover opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500" />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <Film className="h-12 w-12 text-slate-300" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
          <Badge className={`absolute top-3 left-3 rounded-lg px-2 py-0.5 font-extrabold uppercase text-[9px] tracking-wider border-none ${statusColors[status] || statusColors.draft}`}>
            {status}
          </Badge>
          {duration && (
            <div className="absolute bottom-3 right-3 flex items-center gap-1 rounded-md bg-black/70 px-2 py-1 text-[10px] font-bold text-white">
              <Clock className="h-3 w-3" /> {duration}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3 p-6 flex-1">
          <h3 className="text-lg font-black tracking-tighter leading-tight line-clamp-2 group-hover:text-blue-600 transition-colors">
            {project.title}
          </h3>
          {project.headline && (
            <p className="line-clamp-2 text-xs text-slate-500 italic">
              <Sparkles className="inline h-3 w-3 mr-1 text-pink-400" />
              {project.headline}
            </p>
          )}

          {/* Stats row */}
          <div className="flex items-center gap-4 text-[11px] font-semibold text-slate-500 mt-auto pt-2">
            <span className="flex items-center gap-1">
              <Film className="h-3 w-3 text-blue-500" />
              {project.sceneCount || 0} scenes
            </span>
            {(project.scenesWithFootage ?? 0) > 0 && (
              <span className="flex items-center gap-1 text-emerald-600">
                <Eye className="h-3 w-3" />
                {project.scenesWithFootage}/{project.sceneCount} footage
              </span>
            )}
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <div className="flex items-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              <Calendar className="h-3 w-3 mr-1.5" />
              {new Date(project.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: '2-digit' })}
            </div>
            <div className="flex gap-1.5">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={onDelete}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
              <div className="h-8 w-8 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <ExternalLink className="h-4 w-4" />
              </div>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  )
}
