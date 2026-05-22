'use client'

import { useEffect, useState, useCallback, useMemo, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Copy as CopyIcon,
  Download,
  Layers,
  Loader2,
  Palette,
  Plus,
  Scissors,
  Sparkles,
  Split,
  Trash2,
  Type,
  Wand2,
  Zap,
} from 'lucide-react'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import { useConfirm } from '@/components/ui/confirm-dialog'
import { api } from '@/lib/api'
import {
  VideoPreview,
  SegmentTimeline,
  InteractiveTranscript,
  SubtitleControls,
  TitleControls,
  ExportJobsTracker,
  AlternateHooksDialog,
  SmartCropButton,
  BrollPanel,
  PresetMenu,
  addActiveExport,
  ASPECT_RATIOS,
  API_BASE_URL,
  formatTime,
  type ClipProject,
  type Segment,
  type SubtitleStyle,
  type TitleStyle,
  type AspectRatio,
  type VideoPreviewHandle,
  type BrollItem,
  type ClipPresetConfig,
} from './_components'

const defaultSubtitleStyle: SubtitleStyle = {
  fontFamily: 'Arial',
  fontSize: 24,
  fontColor: '#ffffff',
  bgColor: '',
  outlineColor: '#000000',
  outlineWidth: 2,
  shadow: true,
  position: 'bottom',
  animation: 'word-highlight',
  highlightColor: '#ffd400',
}

const defaultTitleStyle: TitleStyle = {
  text: '',
  fontFamily: 'Impact',
  fontSize: 36,
  fontColor: '#ffffff',
  bgColor: '#000000',
  position: 'top',
}

export default function VideoClipDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const confirm = useConfirm()

  const [project, setProject] = useState<ClipProject | null>(null)
  const [loading, setLoading] = useState(true)
  const [analyzing, setAnalyzing] = useState(false)
  const [exporting, setExporting] = useState<number | null>(null)
  const [batchExporting, setBatchExporting] = useState(false)
  const [selectedSegment, setSelectedSegment] = useState<number>(0)
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('9:16')
  const [cropOffsetX, setCropOffsetX] = useState(0)
  const [subtitleStyle, setSubtitleStyle] = useState<SubtitleStyle>(defaultSubtitleStyle)
  const [titleStyle, setTitleStyle] = useState<TitleStyle>(defaultTitleStyle)
  const [selectedExports, setSelectedExports] = useState<Set<number>>(new Set())
  const [hooksDialogOpen, setHooksDialogOpen] = useState(false)
  const [splittingSegment, setSplittingSegment] = useState<number | null>(null)
  const [splitTime, setSplitTime] = useState<number>(0)
  const previewRef = useRef<VideoPreviewHandle | null>(null)

  // Stream URL with credentials
  const streamUrl = useMemo(() => `${API_BASE_URL}/video-clips/${id}/stream`, [id])

  const fetchProject = useCallback(async () => {
    try {
      const data = await api.get<ClipProject>(`/video-clips/${id}`)
      setProject(data)
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { fetchProject() }, [fetchProject])

  // Smart polling: only when status is processing
  useEffect(() => {
    if (!project) return
    const isProcessing = ['downloading', 'transcribing', 'analyzing'].includes(project.status)
    if (!isProcessing) return
    const interval = setInterval(fetchProject, 4000)
    return () => clearInterval(interval)
  }, [project?.status, fetchProject])

  // Sync title text default to selected segment hook
  useEffect(() => {
    const seg = project?.segments?.[selectedSegment]
    if (seg && !titleStyle.text) {
      setTitleStyle((prev) => ({ ...prev, text: seg.hookTitle }))
    }
  }, [selectedSegment, project?.segments])

  const startAnalysis = async () => {
    setAnalyzing(true)
    try {
      await api.post(`/video-clips/${id}/analyze`, {})
      toast.success('Analisis dimulai!')
      fetchProject()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal memulai analisis')
    } finally {
      setAnalyzing(false)
    }
  }

  const exportClip = async (segmentIndex: number) => {
    if (!project?.segments?.[segmentIndex]) return
    setExporting(segmentIndex)
    try {
      const seg = project.segments[segmentIndex]
      const res = await api.post<{ jobId: string }>('/video-clips/export', {
        projectId: id,
        segmentIndex,
        aspectRatio,
        cropOffsetX,
        subtitleStyle,
        titleStyle: { ...titleStyle, text: titleStyle.text || seg.hookTitle },
      })
      addActiveExport({
        jobId: res.jobId,
        projectId: id,
        segmentIndex,
        hookTitle: titleStyle.text || seg.hookTitle,
        startedAt: Date.now(),
      })
      toast.success('Export dimulai. Progress muncul di pojok kanan bawah.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal export')
    } finally {
      setExporting(null)
    }
  }

  const exportBatch = async () => {
    if (!project?.segments) return
    const indexes = selectedExports.size > 0
      ? Array.from(selectedExports).sort((a, b) => a - b)
      : project.segments.map((_, i) => i)
    if (indexes.length === 0) return
    const confirmed = await new Promise<boolean>((resolve) => {
      confirm({
        title: `Export ${indexes.length} clips?`,
        description: `Setiap clip mengonsumsi 30 token. Total ${indexes.length * 30} token.`,
        confirmText: `Export ${indexes.length} clips`,
        cancelText: 'Batal',
        onConfirm: () => resolve(true),
      }).catch(() => resolve(false))
      setTimeout(() => resolve(false), 30000)
    })
    if (!confirmed) return
    setBatchExporting(true)
    try {
      const res = await api.post<{ jobs: Array<{ jobId: string; segmentIndex: number }> }>(
        '/video-clips/export-batch',
        {
          projectId: id,
          segmentIndexes: indexes,
          aspectRatio,
          cropOffsetX,
          subtitleStyle,
          titleStyle,
        },
      )
      for (const j of res.jobs) {
        const seg = project.segments[j.segmentIndex]
        if (!seg) continue
        addActiveExport({
          jobId: j.jobId,
          projectId: id,
          segmentIndex: j.segmentIndex,
          hookTitle: seg.hookTitle,
          startedAt: Date.now(),
        })
      }
      toast.success(`${res.jobs.length} export dimulai`)
      setSelectedExports(new Set())
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal batch export')
    } finally {
      setBatchExporting(false)
    }
  }

  const updateSegment = async (index: number, data: Partial<Segment>) => {
    if (!project?.segments) return
    const newSegments = [...project.segments]
    newSegments[index] = { ...newSegments[index], ...data }
    setProject({ ...project, segments: newSegments })
    try {
      await api.patch(`/video-clips/${id}/segments/${index}`, data)
    } catch {
      toast.error('Gagal save perubahan segment')
    }
  }

  const addCustomSegment = async (start?: number) => {
    if (!project?.duration) return
    const startT = start ?? Math.max(0, (project.segments?.[selectedSegment]?.endTime ?? 0))
    const endT = Math.min(project.duration, startT + 20)
    try {
      const res = await api.post<{ segments: Segment[] }>(`/video-clips/${id}/segments`, {
        startTime: startT,
        endTime: endT,
        hookTitle: 'Custom Clip',
      })
      setProject({ ...project, segments: res.segments })
      setSelectedSegment(res.segments.length - 1)
      toast.success('Segment baru dibuat')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal tambah segment')
    }
  }

  const deleteSegment = async (index: number) => {
    const confirmed = await new Promise<boolean>((resolve) => {
      confirm({
        title: 'Hapus segment ini?',
        description: 'Aksi ini tidak bisa dibatalkan.',
        confirmText: 'Hapus',
        cancelText: 'Batal',
        variant: 'destructive',
        onConfirm: () => resolve(true),
      }).catch(() => resolve(false))
      setTimeout(() => resolve(false), 30000)
    })
    if (!confirmed) return
    try {
      const res = await api.delete<{ segments: Segment[] }>(`/video-clips/${id}/segments/${index}`)
      setProject((prev) => prev ? { ...prev, segments: res.segments } : prev)
      setSelectedSegment(Math.max(0, Math.min(index, res.segments.length - 1)))
      toast.success('Segment dihapus')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal hapus segment')
    }
  }

  const duplicateSegment = async (index: number) => {
    try {
      const res = await api.post<{ segments: Segment[] }>(`/video-clips/${id}/segments/${index}/duplicate`, {})
      setProject((prev) => prev ? { ...prev, segments: res.segments } : prev)
      toast.success('Segment diduplikasi')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal duplikasi')
    }
  }

  const splitSegment = async (index: number, splitAt: number) => {
    try {
      const res = await api.post<{ segments: Segment[] }>(`/video-clips/${id}/segments/${index}/split`, { splitAt })
      setProject((prev) => prev ? { ...prev, segments: res.segments } : prev)
      setSplittingSegment(null)
      toast.success('Segment di-split')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal split segment')
    }
  }

  const applyPreset = (preset: ClipPresetConfig) => {
    if (preset.subtitleStyle) setSubtitleStyle((prev) => ({ ...prev, ...preset.subtitleStyle }))
    if (preset.titleStyle) setTitleStyle((prev) => ({ ...prev, ...preset.titleStyle, text: prev.text || preset.titleStyle?.text || '' }))
    if (preset.aspectRatio) setAspectRatio(preset.aspectRatio)
    if (typeof preset.cropOffsetX === 'number') setCropOffsetX(preset.cropOffsetX)
  }

  const currentPresetConfig: ClipPresetConfig = {
    subtitleStyle,
    titleStyle,
    aspectRatio,
    cropOffsetX,
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
  const segments = project.segments || []
  const currentSegment = segments[selectedSegment]
  const words = project.words || []

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 flex-wrap">
        <Button variant="ghost" size="icon" onClick={() => router.push('/video-clips')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold truncate">{project.title}</h1>
          <p className="text-sm text-muted-foreground truncate">{project.sourceUrl}</p>
        </div>
        {project.status === 'created' && (
          <Button onClick={startAnalysis} disabled={analyzing}>
            {analyzing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
            Analisis Video (50 token)
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
            <div className="flex-1">
              <p className="font-medium text-red-900 dark:text-red-100">Analisis Gagal</p>
              <p className="text-sm text-red-700 dark:text-red-300">{project.error}</p>
            </div>
            <Button variant="outline" size="sm" onClick={startAnalysis}>Coba Lagi</Button>
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      {project.status === 'ready' && segments.length > 0 && currentSegment && (
        <>
          <SegmentTimeline
            duration={project.duration || 0}
            segments={segments}
            selectedIndex={selectedSegment}
            waveform={project.waveform || null}
            onSelectSegment={(i) => {
              setSelectedSegment(i)
              setTitleStyle((prev) => ({ ...prev, text: segments[i].hookTitle }))
            }}
            onAddSegment={(t) => addCustomSegment(t)}
          />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Segment list (3 cols) */}
            <div className="lg:col-span-3 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold flex items-center gap-2 text-sm">
                  <Scissors className="h-4 w-4" />
                  {segments.length} Clips
                </h2>
                <Button size="sm" variant="ghost" onClick={() => addCustomSegment()} className="h-7">
                  <Plus className="h-3.5 w-3.5 mr-1" /> Add
                </Button>
              </div>

              <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
                {segments.map((seg, i) => {
                  const isSelected = selectedSegment === i
                  const isInBatch = selectedExports.has(i)
                  return (
                    <Card
                      key={i}
                      className={`cursor-pointer transition-all ${isSelected ? 'ring-2 ring-blue-600 bg-blue-50/50' : 'hover:shadow-md'}`}
                      onClick={() => {
                        setSelectedSegment(i)
                        setTitleStyle((prev) => ({ ...prev, text: seg.hookTitle }))
                      }}
                    >
                      <CardContent className="p-2.5 space-y-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            <input
                              type="checkbox"
                              checked={isInBatch}
                              onClick={(e) => e.stopPropagation()}
                              onChange={(e) => {
                                const next = new Set(selectedExports)
                                if (e.target.checked) next.add(i)
                                else next.delete(i)
                                setSelectedExports(next)
                              }}
                              className="h-3 w-3 cursor-pointer"
                              title="Include in batch export"
                            />
                            {seg.viralScore > 0 ? (
                              <Badge variant="secondary" className="text-[9px] h-4 px-1">
                                <Zap className="h-2 w-2 mr-0.5" />{seg.viralScore}
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-[9px] h-4 px-1">Custom</Badge>
                            )}
                          </div>
                          <span className="text-[9px] font-mono text-muted-foreground">
                            {formatTime(seg.startTime)}–{formatTime(seg.endTime)}
                          </span>
                        </div>
                        <p className="text-xs font-semibold line-clamp-1 leading-tight">{seg.hookTitle}</p>
                        <div className="flex items-center gap-0.5">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-6 text-[9px] flex-1 gap-0.5 px-2"
                            onClick={(e) => { e.stopPropagation(); exportClip(i) }}
                            disabled={exporting === i}
                          >
                            {exporting === i ? <Loader2 className="h-2.5 w-2.5 animate-spin" /> : <Download className="h-2.5 w-2.5" />}
                            Export
                          </Button>
                          <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={(e) => { e.stopPropagation(); duplicateSegment(i) }} title="Duplicate">
                            <CopyIcon className="h-2.5 w-2.5" />
                          </Button>
                          <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={(e) => { e.stopPropagation(); setSplittingSegment(i); setSplitTime((seg.startTime + seg.endTime) / 2) }} title="Split">
                            <Split className="h-2.5 w-2.5" />
                          </Button>
                          <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-red-500 hover:text-red-600" onClick={(e) => { e.stopPropagation(); deleteSegment(i) }} title="Delete">
                            <Trash2 className="h-2.5 w-2.5" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>

              <Button
                size="sm"
                onClick={exportBatch}
                disabled={batchExporting}
                className="w-full bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700"
              >
                {batchExporting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
                {selectedExports.size > 0
                  ? `Export ${selectedExports.size} Selected (${selectedExports.size * 30} tokens)`
                  : `Export All (${segments.length * 30} tokens)`}
              </Button>
            </div>

            {/* Center: Preview only (5 cols) */}
            <div className="lg:col-span-5 space-y-4">
              <Card>
                <CardContent className="p-4 space-y-3">
                  {/* Aspect ratio + crop offset */}
                  <div className="flex flex-wrap items-center gap-2">
                    <Label className="text-xs">Aspect:</Label>
                    <Select value={aspectRatio} onValueChange={(v) => setAspectRatio(v as AspectRatio)}>
                      <SelectTrigger className="h-8 w-36 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ASPECT_RATIOS.map((r) => (
                          <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {aspectRatio !== '16:9' && aspectRatio !== '9:16-fit' && (
                      <div className="flex items-center gap-2 flex-1 min-w-[120px]">
                        <Label className="text-xs whitespace-nowrap">Crop X: {cropOffsetX.toFixed(2)}</Label>
                        <Slider value={[cropOffsetX]} min={-1} max={1} step={0.1} onValueChange={(v) => setCropOffsetX(v[0])} />
                      </div>
                    )}
                    {aspectRatio !== '16:9' && aspectRatio !== '9:16-fit' && (
                      <SmartCropButton
                        videoElement={previewRef.current?.getVideoElement() || null}
                        segmentStart={currentSegment.startTime}
                        segmentEnd={currentSegment.endTime}
                        onSuggest={(v) => setCropOffsetX(v)}
                      />
                    )}
                    <PresetMenu currentConfig={currentPresetConfig} onApply={applyPreset} />
                  </div>

                  <VideoPreview
                    ref={previewRef}
                    streamUrl={streamUrl}
                    segment={currentSegment}
                    words={words}
                    subtitleStyle={subtitleStyle}
                    titleStyle={titleStyle}
                    aspectRatio={aspectRatio}
                    cropOffsetX={cropOffsetX}
                    brollItems={(project.brollPlan || []).filter((b) => b.segmentIndex === selectedSegment)}
                  />
                </CardContent>
              </Card>

              <Button
                size="lg"
                className="w-full"
                onClick={() => exportClip(selectedSegment)}
                disabled={exporting !== null}
              >
                {exporting !== null ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
                Export Clip #{selectedSegment + 1} ({aspectRatio}) — 30 token
              </Button>
            </div>

            {/* Right: Editor + Style tabs + Exports (4 cols) */}
            <div className="lg:col-span-4 space-y-4">
              {/* Segment editor */}
              <Card>
                <CardHeader className="pb-2 pt-3 px-4">
                  <CardTitle className="text-sm flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Scissors className="h-3.5 w-3.5" />
                      Edit Clip #{selectedSegment + 1}
                    </span>
                    <Button size="sm" variant="outline" onClick={() => setHooksDialogOpen(true)} className="h-6 text-[9px] gap-1 px-2">
                      <Sparkles className="h-2.5 w-2.5" /> Hooks
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 px-4 pb-3">
                  <div>
                    <Label className="text-[10px]">Hook Title</Label>
                    <Input
                      value={currentSegment.hookTitle}
                      className="h-8 text-sm"
                      onChange={(e) => {
                        const newSegments = [...segments]
                        newSegments[selectedSegment] = { ...newSegments[selectedSegment], hookTitle: e.target.value }
                        setProject({ ...project, segments: newSegments })
                        setTitleStyle((prev) => ({ ...prev, text: e.target.value }))
                      }}
                      onBlur={(e) => updateSegment(selectedSegment, { hookTitle: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-[10px]">Start ({formatTime(currentSegment.startTime)})</Label>
                      <Slider
                        value={[currentSegment.startTime]}
                        max={project.duration || 100}
                        step={0.5}
                        onValueChange={(v) => {
                          const ns = [...segments]
                          ns[selectedSegment] = { ...ns[selectedSegment], startTime: v[0] }
                          setProject({ ...project, segments: ns })
                        }}
                        onValueCommit={(v) => updateSegment(selectedSegment, { startTime: v[0] })}
                      />
                    </div>
                    <div>
                      <Label className="text-[10px]">End ({formatTime(currentSegment.endTime)})</Label>
                      <Slider
                        value={[currentSegment.endTime]}
                        max={project.duration || 100}
                        step={0.5}
                        onValueChange={(v) => {
                          const ns = [...segments]
                          ns[selectedSegment] = { ...ns[selectedSegment], endTime: v[0] }
                          setProject({ ...project, segments: ns })
                        }}
                        onValueCommit={(v) => updateSegment(selectedSegment, { endTime: v[0] })}
                      />
                    </div>
                  </div>
                  <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Durasi: {formatTime(currentSegment.endTime - currentSegment.startTime)}
                  </p>
                </CardContent>
              </Card>

              {/* Style tabs */}
              <Tabs defaultValue="subtitle">
                <TabsList>
                  <TabsTrigger value="subtitle"><Type className="h-3.5 w-3.5 mr-1" />Subtitle</TabsTrigger>
                  <TabsTrigger value="title"><Palette className="h-3.5 w-3.5 mr-1" />Title</TabsTrigger>
                  <TabsTrigger value="broll">
                    <Layers className="h-3.5 w-3.5 mr-1" />
                    B-roll
                    {((project.brollPlan || []).filter((b) => b.segmentIndex === selectedSegment).length > 0) && (
                      <span className="ml-1 rounded-full bg-blue-600 px-1.5 text-[9px] font-bold text-white">
                        {(project.brollPlan || []).filter((b) => b.segmentIndex === selectedSegment).length}
                      </span>
                    )}
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="subtitle">
                  <Card>
                    <CardContent className="pt-4">
                      <SubtitleControls value={subtitleStyle} onChange={setSubtitleStyle} />
                    </CardContent>
                  </Card>
                </TabsContent>
                <TabsContent value="title">
                  <Card>
                    <CardContent className="pt-4">
                      <TitleControls value={titleStyle} onChange={setTitleStyle} />
                    </CardContent>
                  </Card>
                </TabsContent>
                <TabsContent value="broll">
                  <Card>
                    <CardContent className="pt-4">
                      <BrollPanel
                        projectId={id}
                        segmentIndex={selectedSegment}
                        segment={currentSegment}
                        brollItems={project.brollPlan || []}
                        currentTime={Math.max(0, (previewRef.current?.getVideoElement()?.currentTime || currentSegment.startTime) - currentSegment.startTime)}
                        onChange={(items) => setProject((p) => p ? { ...p, brollPlan: items } : p)}
                        onSeek={(t) => previewRef.current?.seekToSegmentTime(t)}
                      />
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>

              {/* Exports */}
              {project.exports && project.exports.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      Exported ({project.exports.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 max-h-[200px] overflow-y-auto">
                    {project.exports.map((exp, i) => (
                      <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-muted/50 text-sm">
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium">Clip #{exp.segmentIndex + 1} {exp.aspectRatio ? `· ${exp.aspectRatio}` : ''}</p>
                          <p className="text-[10px] text-muted-foreground">{new Date(exp.createdAt).toLocaleString('id-ID')}</p>
                        </div>
                        <Button size="sm" variant="outline" className="h-7" asChild>
                          <a href={`${API_BASE_URL}/video-clips/${id}/download/${exp.jobId}`} download>
                            <Download className="h-3 w-3" />
                          </a>
                        </Button>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </>
      )}

      {project.status === 'ready' && segments.length === 0 && (
        <Card>
          <CardContent className="text-center py-12 space-y-4">
            <p className="text-muted-foreground">AI tidak menemukan segment viral untuk video ini.</p>
            <Button onClick={() => addCustomSegment()}><Plus className="h-4 w-4 mr-2" />Buat Custom Segment</Button>
          </CardContent>
        </Card>
      )}

      {/* Hooks dialog */}
      {currentSegment && (
        <AlternateHooksDialog
          open={hooksDialogOpen}
          onOpenChange={setHooksDialogOpen}
          projectId={id}
          segmentIndex={selectedSegment}
          currentTitle={currentSegment.hookTitle}
          onSelect={(newTitle) => {
            updateSegment(selectedSegment, { hookTitle: newTitle })
            setTitleStyle((prev) => ({ ...prev, text: newTitle }))
          }}
        />
      )}

      {/* Split dialog (simple inline) */}
      {splittingSegment !== null && segments[splittingSegment] && (
        <Card className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-96 shadow-2xl border-2 border-blue-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Split Clip #{splittingSegment + 1}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Label>Split at: {formatTime(splitTime)}</Label>
            <Slider
              value={[splitTime]}
              min={segments[splittingSegment].startTime + 1}
              max={segments[splittingSegment].endTime - 1}
              step={0.5}
              onValueChange={(v) => setSplitTime(v[0])}
            />
            <div className="flex gap-2 justify-end">
              <Button size="sm" variant="outline" onClick={() => setSplittingSegment(null)}>Batal</Button>
              <Button size="sm" onClick={() => splitSegment(splittingSegment, splitTime)}>Split</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <ExportJobsTracker filterProjectId={id} onCompleted={() => fetchProject()} />
    </motion.div>
  )
}
