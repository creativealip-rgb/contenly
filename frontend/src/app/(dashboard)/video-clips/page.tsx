'use client'

import { useEffect, useMemo, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  ExternalLink,
  Film,
  Loader2,
  Plus,
  Scissors,
  Sparkles,
  Trash2,
  Upload,
} from 'lucide-react'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import { useConfirm } from '@/components/ui/confirm-dialog'
import { api } from '@/lib/api'
import { ExportJobsTracker, API_BASE_URL, formatTime } from './[id]/_components'

interface Project {
  id: string
  title: string
  sourceUrl: string
  status: string
  duration?: number
  segments?: Array<{ viralScore?: number }>
  thumbnailPath?: string | null
  metadata?: { title?: string; uploader?: string; thumbnail?: string; duration?: number }
  createdAt: string
}

interface Metadata {
  title?: string
  duration?: number
  uploader?: string
  thumbnail?: string
}

const statusConfig: Record<string, { label: string; color: string; spinning?: boolean }> = {
  created: { label: 'Baru', color: 'bg-slate-100 text-slate-700' },
  downloading: { label: 'Mengunduh...', color: 'bg-blue-100 text-blue-700', spinning: true },
  transcribing: { label: 'Transkripsi...', color: 'bg-purple-100 text-purple-700', spinning: true },
  analyzing: { label: 'Menganalisis...', color: 'bg-amber-100 text-amber-700', spinning: true },
  ready: { label: 'Siap', color: 'bg-green-100 text-green-700' },
  failed: { label: 'Gagal', color: 'bg-red-100 text-red-700' },
}

export default function VideoClipsPage() {
  const router = useRouter()
  const confirm = useConfirm()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [url, setUrl] = useState('')
  const [title, setTitle] = useState('')
  const [meta, setMeta] = useState<Metadata | null>(null)
  const [fetchingMeta, setFetchingMeta] = useState(false)
  const [search, setSearch] = useState('')
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  const fetchProjects = useCallback(async () => {
    try {
      const data = await api.get<Project[]>('/video-clips')
      setProjects(data)
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchProjects() }, [fetchProjects])

  // Smart polling: only when there are processing projects
  useEffect(() => {
    const hasProcessing = projects.some((p) =>
      ['downloading', 'transcribing', 'analyzing'].includes(p.status),
    )
    if (!hasProcessing) return
    const interval = setInterval(fetchProjects, 5000)
    return () => clearInterval(interval)
  }, [projects, fetchProjects])

  const fetchMeta = async () => {
    if (!url.trim()) return
    setFetchingMeta(true)
    setMeta(null)
    try {
      const data = await api.post<Metadata>('/video-clips/fetch-metadata', { sourceUrl: url })
      setMeta(data)
      if (!title && data.title) setTitle(data.title)
    } catch {
      toast.error('Gagal ambil metadata. URL mungkin tidak didukung.')
    } finally {
      setFetchingMeta(false)
    }
  }

  const createProject = async () => {
    if (!url.trim()) { toast.error('URL wajib diisi'); return }
    setCreating(true)
    try {
      const project = await api.post<Project>('/video-clips', { sourceUrl: url, title: title || undefined })
      setDialogOpen(false)
      setUrl('')
      setTitle('')
      setMeta(null)
      router.push(`/video-clips/${project.id}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal membuat project')
    } finally {
      setCreating(false)
    }
  }

  const uploadAndCreate = async () => {
    if (!uploadFile) { toast.error('Pilih file dulu'); return }
    if (uploadFile.size > 1024 * 1024 * 1024) { toast.error('File maksimal 1GB'); return }
    if (!uploadFile.type.startsWith('video/')) { toast.error('File harus berupa video'); return }
    setUploading(true)
    setUploadProgress(0)
    try {
      const formData = new FormData()
      formData.append('file', uploadFile)
      if (title) formData.append('title', title)

      // Use XHR for upload progress
      const project = await new Promise<Project>((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        xhr.open('POST', `${API_BASE_URL}/video-clips/upload`)
        xhr.withCredentials = true
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) setUploadProgress(Math.round((e.loaded / e.total) * 100))
        }
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try { resolve(JSON.parse(xhr.responseText)) } catch { reject(new Error('Invalid response')) }
          } else {
            try {
              const err = JSON.parse(xhr.responseText)
              reject(new Error(err.message || `HTTP ${xhr.status}`))
            } catch {
              reject(new Error(`HTTP ${xhr.status}`))
            }
          }
        }
        xhr.onerror = () => reject(new Error('Upload network error'))
        xhr.send(formData)
      })

      setDialogOpen(false)
      setUploadFile(null)
      setTitle('')
      setUploadProgress(0)
      toast.success('Upload sukses. Klik "Analisis Video" untuk mulai memproses.')
      router.push(`/video-clips/${project.id}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal upload')
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (e: React.MouseEvent, p: Project) => {
    e.stopPropagation()
    await confirm({
      title: 'Hapus project?',
      description: `"${p.title}" akan dihapus permanen, beserta semua clip yang sudah di-export.`,
      confirmText: 'Hapus',
      cancelText: 'Batal',
      variant: 'destructive',
      onConfirm: async () => {
        try {
          await api.delete(`/video-clips/${p.id}`)
          setProjects((prev) => prev.filter((x) => x.id !== p.id))
          toast.success('Project dihapus')
        } catch (err) {
          toast.error(err instanceof Error ? err.message : 'Gagal hapus')
        }
      },
    })
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return projects
    return projects.filter((p) => p.title.toLowerCase().includes(q) || p.sourceUrl.toLowerCase().includes(q))
  }, [projects, search])

  const isProbablyValidUrl = url.trim().length > 8 && /^https?:\/\//.test(url.trim())
  const tooLong: boolean = !!(meta?.duration && meta.duration > 3600)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Video Clips</h1>
          <p className="text-muted-foreground">Clip video panjang menjadi short viral 9:16, 1:1, atau 16:9</p>
        </div>
        <Dialog
          open={dialogOpen}
          onOpenChange={(o) => {
            setDialogOpen(o)
            if (!o) { setMeta(null); setUrl(''); setTitle('') }
          }}
        >
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Project Baru</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Scissors className="h-5 w-5 text-blue-600" />
                Buat Clip Project
              </DialogTitle>
              <DialogDescription>
                Tempel URL video atau upload file langsung. Maksimal 60 menit.
              </DialogDescription>
            </DialogHeader>

            <Tabs defaultValue="url" className="pt-2">
              <TabsList className="w-full grid grid-cols-2">
                <TabsTrigger value="url"><Sparkles className="h-3.5 w-3.5 mr-1.5" />Dari URL</TabsTrigger>
                <TabsTrigger value="upload"><Upload className="h-3.5 w-3.5 mr-1.5" />Upload File</TabsTrigger>
              </TabsList>

              <TabsContent value="url" className="space-y-4 pt-3">
                <div>
                  <Label>Video URL *</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="https://youtube.com/watch?v=..."
                      value={url}
                      onChange={(e) => { setUrl(e.target.value); setMeta(null) }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={fetchMeta}
                      disabled={!isProbablyValidUrl || fetchingMeta}
                      className="shrink-0"
                    >
                      {fetchingMeta ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Cek'}
                    </Button>
                  </div>
                </div>

                {meta && (
                  <div className="rounded-lg border bg-slate-50 dark:bg-slate-900 p-3 flex gap-3">
                    {meta.thumbnail && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={meta.thumbnail} alt="" className="h-16 w-28 rounded object-cover flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate">{meta.title}</p>
                      {meta.uploader && (
                        <p className="text-xs text-muted-foreground truncate">@{meta.uploader}</p>
                      )}
                      <div className="flex items-center gap-2 mt-1 text-[11px]">
                        {meta.duration && (
                          <span className={`font-mono ${tooLong ? 'text-red-600 font-bold' : 'text-slate-500'}`}>
                            ⏱ {formatTime(meta.duration)}
                          </span>
                        )}
                        {tooLong && (
                          <span className="text-red-600 font-semibold">Terlalu panjang (max 60 min)</span>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <Label>Judul (opsional)</Label>
                  <Input
                    placeholder={meta?.title || 'Nama project'}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>Batal</Button>
                  <Button onClick={createProject} disabled={creating || !isProbablyValidUrl || tooLong}>
                    {creating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
                    Buat & Buka Editor
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="upload" className="space-y-4 pt-3">
                <label className="block">
                  <input
                    type="file"
                    accept="video/*"
                    onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                    className="hidden"
                    disabled={uploading}
                  />
                  <div className={`flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed py-8 px-4 cursor-pointer transition-colors ${
                    uploadFile ? 'border-blue-400 bg-blue-50/50' : 'border-slate-300 hover:border-blue-400 hover:bg-blue-50/30'
                  }`}>
                    <Upload className={`h-8 w-8 ${uploadFile ? 'text-blue-600' : 'text-slate-400'}`} />
                    {uploadFile ? (
                      <>
                        <p className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate max-w-full">{uploadFile.name}</p>
                        <p className="text-xs text-slate-500">{(uploadFile.size / (1024 * 1024)).toFixed(1)} MB</p>
                      </>
                    ) : (
                      <>
                        <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Pilih video file</p>
                        <p className="text-xs text-slate-500">MP4, MOV, WebM, dll. — max 1GB / 60 menit</p>
                      </>
                    )}
                  </div>
                </label>

                <div>
                  <Label>Judul (opsional)</Label>
                  <Input
                    placeholder={uploadFile?.name?.replace(/\.[^.]+$/, '') || 'Nama project'}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    disabled={uploading}
                  />
                </div>

                {uploading && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span>Uploading...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-1">
                  <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={uploading}>Batal</Button>
                  <Button onClick={uploadAndCreate} disabled={uploading || !uploadFile}>
                    {uploading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
                    Upload & Buat Project
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      </div>

      {projects.length > 0 && (
        <Input
          placeholder="Cari project..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
      )}

      {filtered.length === 0 && projects.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 gap-3">
            <Scissors className="h-12 w-12 text-muted-foreground/50" />
            <p className="text-muted-foreground">Belum ada project. Buat yang pertama!</p>
            <Button onClick={() => setDialogOpen(true)}><Plus className="h-4 w-4 mr-2" />Project Baru</Button>
          </CardContent>
        </Card>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12 text-muted-foreground">
            Tidak ada project yang cocok dengan &ldquo;{search}&rdquo;.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((p) => {
            const cfg = statusConfig[p.status] || statusConfig.created
            const StatusIcon = cfg.spinning ? Loader2 : p.status === 'failed' ? AlertCircle : CheckCircle2
            const segCount = p.segments?.length || 0
            const topScore = Math.max(0, ...(p.segments?.map((s) => s.viralScore || 0) || [0]))
            return (
              <Card
                key={p.id}
                className="group cursor-pointer hover:shadow-xl transition-all overflow-hidden flex flex-col"
                onClick={() => router.push(`/video-clips/${p.id}`)}
              >
                {/* Thumbnail */}
                <div className="relative aspect-video w-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  {p.thumbnailPath ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={`${API_BASE_URL}/video-clips/${p.id}/thumbnail`}
                      alt=""
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : p.metadata?.thumbnail ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={p.metadata.thumbnail}
                      alt=""
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <Film className="h-10 w-10 text-slate-300" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                  <Badge className={`absolute top-2 left-2 text-[10px] ${cfg.color}`}>
                    <StatusIcon className={`h-3 w-3 mr-1 ${cfg.spinning ? 'animate-spin' : ''}`} />
                    {cfg.label}
                  </Badge>
                  {p.duration && (
                    <span className="absolute bottom-2 right-2 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-mono text-white">
                      <Clock className="inline h-2.5 w-2.5 mr-0.5" />
                      {formatTime(p.duration)}
                    </span>
                  )}
                  {topScore >= 8 && (
                    <span className="absolute top-2 right-2 rounded bg-pink-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                      🔥 Top {topScore}/10
                    </span>
                  )}
                </div>

                <CardContent className="p-4 flex-1 flex flex-col gap-2">
                  <h3 className="font-bold leading-tight line-clamp-2 group-hover:text-blue-600 transition-colors">
                    {p.title}
                  </h3>
                  <p className="text-[11px] text-muted-foreground truncate">{p.sourceUrl}</p>
                  <div className="mt-auto flex items-center justify-between text-[11px] font-semibold text-slate-500">
                    <span className="flex items-center gap-1">
                      <Scissors className="h-3 w-3 text-blue-500" />
                      {segCount} clips
                    </span>
                    <div className="flex gap-1.5">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => handleDelete(e, p)}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-red-500" />
                      </Button>
                      <div className="h-7 w-7 rounded-md bg-slate-50 text-slate-400 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                        <ExternalLink className="h-3.5 w-3.5" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <ExportJobsTracker />
    </motion.div>
  )
}
