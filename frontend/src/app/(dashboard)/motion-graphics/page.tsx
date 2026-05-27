'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Loader2, Download, Play, Palette, Type, Hash, Bell, Film, Clapperboard, Sparkles, Clock, CheckCircle2, XCircle, History } from 'lucide-react'
import { toast } from 'sonner'
import { JsonArrayEditor } from '@/components/ui/json-array-editor'
import dynamic from 'next/dynamic'

const MotionPreview = dynamic(() => import('@/components/motion/MotionPreview').then(m => ({ default: m.MotionPreview })), { ssr: false })

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api/v1'

type Template = {
  id: string
  name: string
  category: string
  description: string
  defaultProps: Record<string, any>
  defaultDuration: number
  defaultWidth: number
  defaultHeight: number
}

type RenderJob = {
  id: string
  type: string
  status: 'queued' | 'processing' | 'completed' | 'failed' | 'timeout'
  outputFormat: string | null
  tokensCost: number
  error: string | null
  createdAt: string
}

const categoryIcons: Record<string, React.ReactNode> = {
  title: <Type className="h-5 w-5" />,
  'lower-third': <Film className="h-5 w-5" />,
  text: <Type className="h-5 w-5" />,
  counter: <Hash className="h-5 w-5" />,
  subscribe: <Bell className="h-5 w-5" />,
  transition: <Clapperboard className="h-5 w-5" />,
  logo: <Sparkles className="h-5 w-5" />,
  callout: <Film className="h-5 w-5" />,
  caption: <Type className="h-5 w-5" />,
  background: <Palette className="h-5 w-5" />,
}

const statusConfig = {
  queued: { icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-50', label: 'Queued' },
  processing: { icon: Loader2, color: 'text-blue-600', bg: 'bg-blue-50', label: 'Processing' },
  completed: { icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50', label: 'Completed' },
  failed: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-50', label: 'Failed' },
  timeout: { icon: XCircle, color: 'text-orange-600', bg: 'bg-orange-50', label: 'Timeout' },
}

export default function MotionGraphicsPage() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)
  const [props, setProps] = useState<Record<string, any>>({})
  const [isRendering, setIsRendering] = useState(false)
  const [format, setFormat] = useState<'mp4' | 'webm' | 'png'>('mp4')
  const [aiPrompt, setAiPrompt] = useState('')
  const [isAiGenerating, setIsAiGenerating] = useState(false)
  const [jobs, setJobs] = useState<RenderJob[]>([])
  const [showHistory, setShowHistory] = useState(false)

  useEffect(() => {
    fetchTemplates()
    fetchJobs()
  }, [])

  const fetchTemplates = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/motion-graphics/templates`, { credentials: 'include' })
      if (res.ok) setTemplates(await res.json())
    } catch {
      toast.error('Gagal memuat templates.')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchJobs = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/motion-graphics/jobs`, { credentials: 'include' })
      if (res.ok) setJobs(await res.json())
    } catch { /* silent */ }
  }

  const selectTemplate = (template: Template) => {
    setSelectedTemplate(template)
    setProps({ ...template.defaultProps })
  }

  const updateProp = (key: string, value: any) => {
    setProps((prev) => ({ ...prev, [key]: value }))
  }

  const handleRender = async () => {
    if (!selectedTemplate) return
    setIsRendering(true)
    try {
      const res = await fetch(`${API_BASE_URL}/motion-graphics/render`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ templateId: selectedTemplate.id, props, format }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.message || 'Render gagal')
      }

      const { jobId } = await res.json()
      toast.info('Render job dimulai...')
      fetchJobs()

      // Poll until done
      for (let i = 0; i < 100; i++) {
        await new Promise((r) => setTimeout(r, 3000))
        const statusRes = await fetch(`${API_BASE_URL}/motion-graphics/jobs/${jobId}`, { credentials: 'include' })
        if (!statusRes.ok) throw new Error('Gagal cek status')
        const job = await statusRes.json()

        if (job.status === 'completed') {
          const dlRes = await fetch(`${API_BASE_URL}/motion-graphics/jobs/${jobId}/download`, { credentials: 'include' })
          if (!dlRes.ok) throw new Error('Gagal download')
          const blob = await dlRes.blob()
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = `${selectedTemplate.id}.${format}`
          document.body.appendChild(a)
          a.click()
          document.body.removeChild(a)
          URL.revokeObjectURL(url)
          toast.success('Render selesai! File di-download.')
          fetchJobs()
          return
        } else if (job.status === 'failed' || job.status === 'timeout') {
          throw new Error(job.error || 'Render gagal')
        }
      }
      throw new Error('Render timeout')
    } catch (error: any) {
      toast.error(error.message || 'Gagal render template.')
    } finally {
      setIsRendering(false)
      fetchJobs()
    }
  }

  const handleAiGenerate = async () => {
    if (!aiPrompt.trim()) return
    setIsAiGenerating(true)
    try {
      const res = await fetch(`${API_BASE_URL}/motion-graphics/ai-generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ prompt: aiPrompt }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.message || 'AI generation gagal')
      }
      const data = await res.json()
      const template = templates.find((t) => t.id === data.templateId)
      if (template) {
        setSelectedTemplate(template)
        setProps(data.props)
        toast.success(`AI memilih "${template.name}": ${data.reasoning}`)
      }
    } catch (error: any) {
      toast.error(error.message || 'Gagal generate animasi.')
    } finally {
      setIsAiGenerating(false)
    }
  }

  const handleDownloadJob = async (jobId: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/motion-graphics/jobs/${jobId}/download`, { credentials: 'include' })
      if (!res.ok) throw new Error('File expired atau tidak tersedia')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `render-${jobId.slice(0, 8)}.mp4`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  const isArrayOrObject = (val: any) => Array.isArray(val) || (typeof val === 'object' && val !== null)

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-7xl p-6 space-y-8">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="space-y-1">
          <h1 className="text-3xl font-black tracking-tight">Motion Graphics Studio</h1>
          <p className="text-slate-500">Pilih template, customize, dan render sebagai MP4/WebM/PNG.</p>
        </div>
        <Button variant="outline" onClick={() => { setShowHistory(!showHistory); fetchJobs() }}>
          <History className="mr-2 h-4 w-4" />
          {showHistory ? 'Templates' : 'Render History'}
        </Button>
      </div>

      {showHistory ? (
        /* ─── Render History ─── */
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Render History</h2>
          {jobs.length === 0 ? (
            <p className="text-sm text-slate-500">Belum ada render jobs.</p>
          ) : (
            <div className="space-y-2">
              {jobs.map((job) => {
                const cfg = statusConfig[job.status]
                const Icon = cfg.icon
                return (
                  <Card key={job.id}>
                    <CardContent className="flex items-center justify-between py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-1.5 rounded-md ${cfg.bg}`}>
                          <Icon className={`h-4 w-4 ${cfg.color} ${job.status === 'processing' ? 'animate-spin' : ''}`} />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{job.type} render</p>
                          <p className="text-xs text-slate-500">
                            {new Date(job.createdAt).toLocaleString('id-ID')} • {job.tokensCost} tokens
                          </p>
                          {job.error && <p className="text-xs text-red-500 mt-0.5">{job.error}</p>}
                        </div>
                      </div>
                      {job.status === 'completed' && (
                        <Button size="sm" variant="outline" onClick={() => handleDownloadJob(job.id)}>
                          <Download className="h-3 w-3 mr-1" /> Download
                        </Button>
                      )}
                      {(job.status === 'queued' || job.status === 'processing') && (
                        <Badge variant="secondary">{cfg.label}</Badge>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      ) : (
        /* ─── Template Studio ─── */
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Template Grid */}
          <div className="lg:col-span-7 space-y-4">
            {/* AI Generator */}
            <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50">
              <CardContent className="pt-5 space-y-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-purple-700">
                  <Sparkles className="h-4 w-4" /> AI Animation Generator
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Contoh: Teks 'WELCOME' muncul dengan efek glitch warna cyan..."
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAiGenerate()}
                    className="flex-1"
                  />
                  <Button onClick={handleAiGenerate} disabled={isAiGenerating || !aiPrompt.trim()} className="bg-purple-600 hover:bg-purple-700">
                    {isAiGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <h2 className="text-lg font-semibold">Templates</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {templates.map((template) => (
                <Card
                  key={template.id}
                  className={`cursor-pointer transition-all hover:ring-2 hover:ring-blue-400 ${
                    selectedTemplate?.id === template.id ? 'ring-2 ring-blue-600 bg-blue-50/50' : ''
                  }`}
                  onClick={() => selectTemplate(template)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                        {categoryIcons[template.category] || <Palette className="h-5 w-5" />}
                      </div>
                      <div>
                        <CardTitle className="text-base">{template.name}</CardTitle>
                        <Badge variant="secondary" className="text-[10px]">{template.category}</Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-slate-500">{template.description}</p>
                    <p className="text-xs text-slate-400 mt-2">
                      {template.defaultWidth}×{template.defaultHeight} • {Math.round(template.defaultDuration / 30)}s
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Editor Panel */}
          <div className="lg:col-span-5 space-y-4">
            {selectedTemplate ? (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Palette className="h-5 w-5 text-purple-600" />
                      Customize: {selectedTemplate.name}
                    </CardTitle>
                    <CardDescription>Edit props lalu klik Render.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {Object.entries(props).map(([key, value]) => (
                      <div key={key} className="space-y-1">
                        <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">{key}</label>
                        {isArrayOrObject(value) ? (
                          <JsonArrayEditor
                            value={value}
                            onChange={(v) => updateProp(key, v)}
                            mode={Array.isArray(value) && value.every((i: any) => typeof i === 'string') ? 'array-strings' : 'json'}
                            placeholder={`${key} item`}
                          />
                        ) : (
                          <Input
                            value={String(value)}
                            onChange={(e) => {
                              const v = e.target.value
                              updateProp(key, isNaN(Number(v)) || v === '' ? v : Number(v))
                            }}
                          />
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Live Preview */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Play className="h-4 w-4 text-green-600" /> Live Preview
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <MotionPreview
                      templateId={selectedTemplate.id}
                      inputProps={props}
                      width={selectedTemplate.defaultWidth}
                      height={selectedTemplate.defaultHeight}
                      durationInFrames={selectedTemplate.defaultDuration}
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Output</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex gap-2">
                      {(['mp4', 'webm', 'png'] as const).map((f) => (
                        <Button key={f} size="sm" variant={format === f ? 'default' : 'outline'} onClick={() => setFormat(f)}>
                          {f.toUpperCase()}
                        </Button>
                      ))}
                    </div>
                    <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600" onClick={handleRender} disabled={isRendering}>
                      {isRendering ? (
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Rendering...</>
                      ) : (
                        <><Play className="mr-2 h-4 w-4" /> Render & Download</>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </>
            ) : (
              <div className="flex min-h-[300px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 p-8 text-center">
                <Palette className="mb-4 h-12 w-12 text-slate-300" />
                <h3 className="text-lg font-semibold text-slate-700">Pilih Template</h3>
                <p className="text-sm text-slate-500 mt-1">Klik salah satu template di kiri untuk mulai customize.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
