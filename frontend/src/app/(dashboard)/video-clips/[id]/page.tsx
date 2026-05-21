'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  ArrowLeft, Play, Download, Loader2, Scissors, Sparkles, Type, Palette,
  AlertCircle, CheckCircle2, Clock, Zap,
} from 'lucide-react'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import { api } from '@/lib/api'

interface Segment {
  startTime: number
  endTime: number
  hookTitle: string
  reason: string
  viralScore: number
}

interface Project {
  id: string
  title: string
  sourceUrl: string
  status: string
  duration?: number
  transcript?: string
  segments?: Segment[]
  exports?: Array<{ segmentIndex: number; outputPath: string; jobId: string; createdAt: string }>
  error?: string
}

interface SubtitleStyle {
  fontFamily: string
  fontSize: number
  fontColor: string
  bgColor: string
  position: 'top' | 'center' | 'bottom'
  animation: 'none' | 'word-highlight' | 'karaoke' | 'fade-in'
}

interface TitleStyle {
  text: string
  fontFamily: string
  fontSize: number
  fontColor: string
  bgColor: string
  position: 'top' | 'center' | 'bottom'
}

const FONTS = ['Arial', 'Impact', 'Montserrat', 'Poppins', 'Roboto', 'Inter']

export default function VideoClipDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [analyzing, setAnalyzing] = useState(false)
  const [exporting, setExporting] = useState<number | null>(null)
  const [selectedSegment, setSelectedSegment] = useState<number>(0)

  const [subtitleStyle, setSubtitleStyle] = useState<SubtitleStyle>({
    fontFamily: 'Arial',
    fontSize: 24,
    fontColor: '#ffffff',
    bgColor: '#00000080',
    position: 'bottom',
    animation: 'word-highlight',
  })

  const [titleStyle, setTitleStyle] = useState<TitleStyle>({
    text: '',
    fontFamily: 'Impact',
    fontSize: 36,
    fontColor: '#ffffff',
    bgColor: '#00000099',
    position: 'top',
  })

  const fetchProject = useCallback(async () => {
    try {
      const data = await api.get<Project>(`/video-clips/${id}`)
      setProject(data)
      if (data.segments?.[selectedSegment]?.hookTitle && !titleStyle.text) {
        setTitleStyle(prev => ({ ...prev, text: data.segments![selectedSegment].hookTitle }))
      }
    } catch { /* */ } finally { setLoading(false) }
  }, [id, selectedSegment, titleStyle.text])

  useEffect(() => {
    fetchProject()
    const interval = setInterval(fetchProject, 3000)
    return () => clearInterval(interval)
  }, [fetchProject])

  const startAnalysis = async () => {
    setAnalyzing(true)
    try {
      await api.post(`/video-clips/${id}/analyze`, {})
      toast.success('Analisis dimulai!')
    } catch (err: any) { toast.error(err.message || 'Gagal memulai analisis') }
    finally { setAnalyzing(false) }
  }

  const exportClip = async (segmentIndex: number) => {
    setExporting(segmentIndex)
    try {
      await api.post('/video-clips/export', {
        projectId: id,
        segmentIndex,
        subtitleStyle,
        titleStyle: { ...titleStyle, text: titleStyle.text || project?.segments?.[segmentIndex]?.hookTitle },
      })
      toast.success('Export dimulai! Akan selesai dalam beberapa menit.')
    } catch (err: any) { toast.error(err.message || 'Gagal export') }
    finally { setExporting(null) }
  }

  const updateSegment = async (index: number, data: Partial<Segment>) => {
    await api.patch(`/video-clips/${id}/segments/${index}`, data)
  }

  const formatTime = (s: number) => {
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

  if (!project) {
    return <div className="text-center py-16 text-muted-foreground">Project tidak ditemukan</div>
  }

  const isProcessing = ['downloading', 'transcribing', 'analyzing'].includes(project.status)

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push('/video-clips')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{project.title}</h1>
          <p className="text-sm text-muted-foreground truncate">{project.sourceUrl}</p>
        </div>
        {project.status === 'created' && (
          <Button onClick={startAnalysis} disabled={analyzing}>
            {analyzing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
            Analisis Video
          </Button>
        )}
      </div>

      {/* Status Banner */}
      {isProcessing && (
        <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
          <CardContent className="flex items-center gap-3 py-4">
            <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
            <div>
              <p className="font-medium text-blue-900 dark:text-blue-100">
                {project.status === 'downloading' && 'Mengunduh video...'}
                {project.status === 'transcribing' && 'Membuat transkrip (Whisper AI)...'}
                {project.status === 'analyzing' && 'AI sedang mencari momen viral...'}
              </p>
              <p className="text-sm text-blue-700 dark:text-blue-300">Proses ini memakan waktu beberapa menit.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {project.status === 'failed' && (
        <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
          <CardContent className="flex items-center gap-3 py-4">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <div>
              <p className="font-medium text-red-900 dark:text-red-100">Analisis Gagal</p>
              <p className="text-sm text-red-700 dark:text-red-300">{project.error}</p>
            </div>
            <Button variant="outline" size="sm" className="ml-auto" onClick={startAnalysis}>Coba Lagi</Button>
          </CardContent>
        </Card>
      )}

      {/* Main Content - Only show when ready */}
      {project.status === 'ready' && project.segments && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Segment List */}
          <div className="space-y-3">
            <h2 className="font-semibold flex items-center gap-2">
              <Scissors className="h-4 w-4" />
              Viral Segments ({project.segments.length})
            </h2>
            {project.segments.map((seg, i) => (
              <Card
                key={i}
                className={`cursor-pointer transition-all ${selectedSegment === i ? 'ring-2 ring-primary' : 'hover:shadow-md'}`}
                onClick={() => {
                  setSelectedSegment(i)
                  setTitleStyle(prev => ({ ...prev, text: seg.hookTitle }))
                }}
              >
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary" className="text-xs">
                      <Zap className="h-3 w-3 mr-1" />{seg.viralScore}/10
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatTime(seg.startTime)} - {formatTime(seg.endTime)}
                    </span>
                  </div>
                  <p className="font-medium text-sm">{seg.hookTitle}</p>
                  <p className="text-xs text-muted-foreground">{seg.reason}</p>
                  <div className="flex gap-2 pt-1">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs flex-1"
                      onClick={e => { e.stopPropagation(); exportClip(i) }}
                      disabled={exporting === i}
                    >
                      {exporting === i ? <Loader2 className="h-3 w-3 animate-spin" /> : <Download className="h-3 w-3 mr-1" />}
                      Export
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Center + Right: Editor */}
          <div className="lg:col-span-2 space-y-4">
            <Tabs defaultValue="segment">
              <TabsList>
                <TabsTrigger value="segment"><Scissors className="h-4 w-4 mr-1" />Segment</TabsTrigger>
                <TabsTrigger value="subtitle"><Type className="h-4 w-4 mr-1" />Subtitle</TabsTrigger>
                <TabsTrigger value="title"><Palette className="h-4 w-4 mr-1" />Title</TabsTrigger>
              </TabsList>

              {/* Segment Tab */}
              <TabsContent value="segment" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Edit Segment #{selectedSegment + 1}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Hook Title</Label>
                      <Input
                        value={project.segments[selectedSegment]?.hookTitle || ''}
                        onChange={e => {
                          const newSegments = [...project.segments!]
                          newSegments[selectedSegment] = { ...newSegments[selectedSegment], hookTitle: e.target.value }
                          setProject({ ...project, segments: newSegments })
                          setTitleStyle(prev => ({ ...prev, text: e.target.value }))
                        }}
                        onBlur={e => updateSegment(selectedSegment, { hookTitle: e.target.value } as any)}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Start ({formatTime(project.segments[selectedSegment]?.startTime || 0)})</Label>
                        <Slider
                          value={[project.segments[selectedSegment]?.startTime || 0]}
                          max={project.duration || 100}
                          step={1}
                          onValueChange={(val: number[]) => {
                            const newSegments = [...project.segments!]
                            newSegments[selectedSegment] = { ...newSegments[selectedSegment], startTime: val[0] }
                            setProject({ ...project, segments: newSegments })
                          }}
                          onValueCommit={(val: number[]) => updateSegment(selectedSegment, { startTime: val[0] } as any)}
                        />
                      </div>
                      <div>
                        <Label>End ({formatTime(project.segments[selectedSegment]?.endTime || 0)})</Label>
                        <Slider
                          value={[project.segments[selectedSegment]?.endTime || 0]}
                          max={project.duration || 100}
                          step={1}
                          onValueChange={(val: number[]) => {
                            const newSegments = [...project.segments!]
                            newSegments[selectedSegment] = { ...newSegments[selectedSegment], endTime: val[0] }
                            setProject({ ...project, segments: newSegments })
                          }}
                          onValueCommit={(val: number[]) => updateSegment(selectedSegment, { endTime: val[0] } as any)}
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      Durasi: {formatTime((project.segments[selectedSegment]?.endTime || 0) - (project.segments[selectedSegment]?.startTime || 0))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Subtitle Tab */}
              <TabsContent value="subtitle" className="space-y-4">
                <Card>
                  <CardHeader><CardTitle className="text-lg">Subtitle Style</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Font</Label>
                        <Select value={subtitleStyle.fontFamily} onValueChange={v => setSubtitleStyle(s => ({ ...s, fontFamily: v }))}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {FONTS.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Ukuran ({subtitleStyle.fontSize}px)</Label>
                        <Slider value={[subtitleStyle.fontSize]} min={16} max={48} step={2} onValueChange={(val: number[]) => setSubtitleStyle(s => ({ ...s, fontSize: val[0] }))} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Warna Teks</Label>
                        <Input type="color" value={subtitleStyle.fontColor} onChange={e => setSubtitleStyle(s => ({ ...s, fontColor: e.target.value }))} />
                      </div>
                      <div>
                        <Label>Posisi</Label>
                        <Select value={subtitleStyle.position} onValueChange={v => setSubtitleStyle(s => ({ ...s, position: v as any }))}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="top">Atas</SelectItem>
                            <SelectItem value="center">Tengah</SelectItem>
                            <SelectItem value="bottom">Bawah</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <Label>Animasi</Label>
                      <Select value={subtitleStyle.animation} onValueChange={v => setSubtitleStyle(s => ({ ...s, animation: v as any }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Tanpa Animasi</SelectItem>
                          <SelectItem value="word-highlight">Word Highlight</SelectItem>
                          <SelectItem value="karaoke">Karaoke</SelectItem>
                          <SelectItem value="fade-in">Fade In</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Title Tab */}
              <TabsContent value="title" className="space-y-4">
                <Card>
                  <CardHeader><CardTitle className="text-lg">Title Overlay</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Teks Judul</Label>
                      <Input value={titleStyle.text} onChange={e => setTitleStyle(s => ({ ...s, text: e.target.value }))} placeholder="Hook yang menarik perhatian..." />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Font</Label>
                        <Select value={titleStyle.fontFamily} onValueChange={v => setTitleStyle(s => ({ ...s, fontFamily: v }))}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {FONTS.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Ukuran ({titleStyle.fontSize}px)</Label>
                        <Slider value={[titleStyle.fontSize]} min={20} max={60} step={2} onValueChange={(val: number[]) => setTitleStyle(s => ({ ...s, fontSize: val[0] }))} />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label>Warna Teks</Label>
                        <Input type="color" value={titleStyle.fontColor} onChange={e => setTitleStyle(s => ({ ...s, fontColor: e.target.value }))} />
                      </div>
                      <div>
                        <Label>Background</Label>
                        <Input type="color" value={titleStyle.bgColor.slice(0, 7)} onChange={e => setTitleStyle(s => ({ ...s, bgColor: e.target.value + '99' }))} />
                      </div>
                      <div>
                        <Label>Posisi</Label>
                        <Select value={titleStyle.position} onValueChange={v => setTitleStyle(s => ({ ...s, position: v as any }))}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="top">Atas</SelectItem>
                            <SelectItem value="center">Tengah</SelectItem>
                            <SelectItem value="bottom">Bawah</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Export Button */}
            <Button
              size="lg"
              className="w-full"
              onClick={() => exportClip(selectedSegment)}
              disabled={exporting !== null}
            >
              {exporting !== null ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
              Export Clip #{selectedSegment + 1} (9:16 Short)
            </Button>

            {/* Exports List */}
            {project.exports && project.exports.length > 0 && (
              <Card>
                <CardHeader><CardTitle className="text-lg flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-green-600" />Exported Clips</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  {project.exports.map((exp, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div>
                        <p className="text-sm font-medium">Clip #{exp.segmentIndex + 1}</p>
                        <p className="text-xs text-muted-foreground">{new Date(exp.createdAt).toLocaleString('id-ID')}</p>
                      </div>
                      <Button size="sm" variant="outline" asChild>
                        <a href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/video-clips/${id}/download/${exp.jobId}`} download>
                          <Download className="h-4 w-4 mr-1" />Download
                        </a>
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Transcript Preview */}
            {project.transcript && (
              <Card>
                <CardHeader><CardTitle className="text-lg">Transkrip</CardTitle></CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap max-h-48 overflow-y-auto">
                    {project.transcript}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </motion.div>
  )
}
