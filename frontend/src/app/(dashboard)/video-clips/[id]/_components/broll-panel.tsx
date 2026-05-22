'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import {
  Camera,
  Film,
  Layers,
  Loader2,
  Play,
  Plus,
  Search,
  Sparkles,
  Trash2,
  Wand2,
  Volume2,
  VolumeX,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
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
import { Card, CardContent } from '@/components/ui/card'
import { api } from '@/lib/api'
import {
  API_BASE_URL,
  formatTime,
  type BrollItem,
  type BrollOverlayMode,
  type BrollTransition,
  type FootageItem,
  type FootageSearchResult,
  type Segment,
} from './types'

type FootageFilter = 'all' | 'photo' | 'video'

interface BrollPanelProps {
  projectId: string
  segmentIndex: number
  segment: Segment
  brollItems: BrollItem[]
  currentTime?: number // playback time in segment (seconds, 0 = clip start)
  onChange: (items: BrollItem[]) => void
  onSeek?: (time: number) => void
}

const isVideoSource = (item: FootageItem) => item.source === 'pexels-video'

export function BrollPanel({
  projectId,
  segmentIndex,
  segment,
  brollItems,
  currentTime = 0,
  onChange,
  onSeek,
}: BrollPanelProps) {
  const [query, setQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [results, setResults] = useState<FootageItem[]>([])
  const [filter, setFilter] = useState<FootageFilter>('all')
  const [suggesting, setSuggesting] = useState(false)
  const [suggestedKeywords, setSuggestedKeywords] = useState<string[]>([])
  const [previewing, setPreviewing] = useState<string | null>(null)
  const [autoCutting, setAutoCutting] = useState(false)
  const videoRefs = useRef<Record<string, HTMLVideoElement | null>>({})

  const segDuration = segment.endTime - segment.startTime

  // Filter b-roll items to this segment
  const segItems = useMemo(
    () => brollItems.filter((b) => b.segmentIndex === segmentIndex),
    [brollItems, segmentIndex],
  )

  const filteredResults = useMemo(() => {
    if (filter === 'all') return results
    if (filter === 'video') return results.filter(isVideoSource)
    return results.filter((it) => !isVideoSource(it))
  }, [results, filter])

  const counts = useMemo(() => {
    let photo = 0
    let video = 0
    for (const r of results) {
      if (isVideoSource(r)) video += 1
      else photo += 1
    }
    return { all: results.length, photo, video }
  }, [results])

  const handleSearch = async (q?: string) => {
    const searchQuery = (q ?? query).trim()
    if (!searchQuery) return
    setSearching(true)
    try {
      const data = await api.post<FootageSearchResult>(`/video-clips/${projectId}/broll/search`, {
        query: searchQuery,
        perSource: 8,
      })
      const all: FootageItem[] = [
        ...(data.pexelsVideos || []),
        ...(data.pexelsPhotos || []),
        ...(data.googleImages || []),
      ]
      setResults(all)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal search footage')
    } finally {
      setSearching(false)
    }
  }

  const handleSuggest = async () => {
    setSuggesting(true)
    try {
      const data = await api.post<{ keywords: string[] }>(
        `/video-clips/${projectId}/broll/suggest`,
        { segmentIndex, count: 6 },
      )
      setSuggestedKeywords(data.keywords || [])
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal suggest keywords')
    } finally {
      setSuggesting(false)
    }
  }

  const handleAutoCutaway = async () => {
    setAutoCutting(true)
    try {
      const data = await api.post<{ added: BrollItem[]; skipped: number }>(
        `/video-clips/${projectId}/broll/auto-cutaway`,
        { segmentIndex, maxOverlays: 5, preferVideo: true },
      )
      // Merge with current plan — backend already saved, but we need fresh state
      const fresh = await api.get<{ items: BrollItem[] }>(`/video-clips/${projectId}/broll`)
      onChange(fresh.items)
      const skippedSuffix = data.skipped > 0 ? ` (${data.skipped} skipped — no footage match)` : ''
      if (data.added.length > 0) {
        toast.success(`Auto-cutaway: ${data.added.length} b-roll ditambahkan${skippedSuffix}`)
      } else {
        toast.info('Auto-cutaway selesai tapi tidak ada b-roll yang cocok')
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal auto-cutaway')
    } finally {
      setAutoCutting(false)
    }
  }

  const addBroll = async (item: FootageItem) => {
    const start = Math.max(0, Math.min(currentTime, segDuration - 4))
    const end = Math.min(segDuration, start + Math.min(4, item.duration ?? 4))
    try {
      const data = await api.post<{ items: BrollItem[] }>(`/video-clips/${projectId}/broll`, {
        sourceUrl: item.previewUrl || item.downloadUrl || item.thumbnailUrl,
        type: isVideoSource(item) ? 'video' : 'image',
        thumbnailUrl: item.thumbnailUrl,
        segmentIndex,
        start,
        end,
        mode: 'pip',
        transition: 'fade',
        pipX: 0.5,
        pipY: 0.18,
        pipScale: 0.4,
        duckSourceAudio: false,
        duckLevel: 0.3,
        attribution: item.attribution?.author ? `${item.attribution.author} (Pexels)` : undefined,
      })
      onChange(data.items)
      toast.success('B-roll ditambahkan')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal tambah b-roll')
    }
  }

  const updateBroll = async (id: string, patch: Partial<BrollItem>) => {
    try {
      const data = await api.patch<{ items: BrollItem[] }>(
        `/video-clips/${projectId}/broll/${id}`,
        patch,
      )
      onChange(data.items)
    } catch {
      toast.error('Gagal update b-roll')
    }
  }

  const deleteBroll = async (id: string) => {
    try {
      const data = await api.delete<{ items: BrollItem[] }>(`/video-clips/${projectId}/broll/${id}`)
      onChange(data.items)
    } catch {
      toast.error('Gagal hapus b-roll')
    }
  }

  // Hover-to-play video previews
  const handleHoverIn = (key: string) => {
    setPreviewing(key)
    const v = videoRefs.current[key]
    if (v) {
      v.muted = true
      v.play().catch(() => {})
    }
  }
  const handleHoverOut = (key: string) => {
    setPreviewing((cur) => (cur === key ? null : cur))
    const v = videoRefs.current[key]
    if (v) {
      v.pause()
      v.currentTime = 0
    }
  }

  return (
    <div className="space-y-4">
      {/* Auto-Cutaway hero */}
      <div className="rounded-xl border border-violet-200 bg-gradient-to-r from-violet-50 to-pink-50 p-2.5 dark:from-violet-950/30 dark:to-pink-950/30 dark:border-violet-900">
        <div className="flex items-center gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-violet-700 dark:text-violet-300">
              <Sparkles className="inline h-3 w-3 mr-0.5" /> AI Auto-Cutaway
            </p>
            <p className="text-[9px] text-slate-500 dark:text-slate-400 line-clamp-1">
              Otomatis cari momen visual & populate b-roll
            </p>
          </div>
          <Button
            size="sm"
            onClick={handleAutoCutaway}
            disabled={autoCutting}
            className="h-7 text-[10px] bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white shrink-0"
          >
            {autoCutting ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <>
                <Wand2 className="h-3 w-3 mr-1" /> Auto (2t)
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Search bar */}
      <div className="space-y-1.5">
        <div className="flex gap-1.5">
          <Input
            placeholder="Cari footage Pexels..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="h-8 text-xs"
          />
          <Button variant="outline" onClick={() => handleSearch()} disabled={searching || !query.trim()} className="h-8 w-8 p-0 shrink-0">
            {searching ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
          </Button>
        </div>

        {/* AI suggested keywords */}
        <div className="flex flex-wrap items-center gap-1">
          <button
            type="button"
            onClick={handleSuggest}
            disabled={suggesting}
            className="inline-flex items-center gap-0.5 rounded-full border border-dashed border-violet-300 bg-violet-50 px-1.5 py-0.5 text-[9px] font-bold uppercase text-violet-700 hover:bg-violet-100 disabled:opacity-50"
          >
            {suggesting ? <Loader2 className="h-2.5 w-2.5 animate-spin" /> : <Sparkles className="h-2.5 w-2.5" />}
            Suggest (1t)
          </button>
          {suggestedKeywords.map((kw) => (
            <button
              key={kw}
              type="button"
              onClick={() => { setQuery(kw); handleSearch(kw) }}
              className="rounded-full bg-blue-50 px-1.5 py-0.5 text-[9px] font-semibold text-blue-700 hover:bg-blue-100"
            >
              {kw}
            </button>
          ))}
        </div>
      </div>

      {/* Filter chips */}
      {results.length > 0 && (
        <div className="flex items-center gap-1.5">
          {(
            [
              ['all', 'All', counts.all],
              ['video', 'Video', counts.video],
              ['photo', 'Photo', counts.photo],
            ] as Array<[FootageFilter, string, number]>
          ).map(([key, label, count]) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider transition-colors ${
                filter === key
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white text-slate-500 border border-slate-200 hover:text-slate-700'
              }`}
            >
              {key === 'video' && <Film className="h-3 w-3" />}
              {key === 'photo' && <Camera className="h-3 w-3" />}
              {label}
              <span className={filter === key ? 'text-white/70' : 'text-slate-400'}>({count})</span>
            </button>
          ))}
        </div>
      )}

      {/* Search results grid */}
      {filteredResults.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {filteredResults.map((item) => {
            const key = `${item.source}:${item.id ?? item.previewUrl ?? item.thumbnailUrl}`
            const video = isVideoSource(item)
            return (
              <div
                key={key}
                className="relative group"
                onMouseEnter={() => video && handleHoverIn(key)}
                onMouseLeave={() => video && handleHoverOut(key)}
              >
                <button
                  type="button"
                  onClick={() => addBroll(item)}
                  className="block w-full overflow-hidden rounded-lg border-2 border-transparent transition-all hover:border-blue-400 hover:shadow-lg"
                  title="Click to add as b-roll at current playhead"
                >
                  {video && previewing === key && item.previewUrl ? (
                    <video
                      ref={(el) => { videoRefs.current[key] = el }}
                      src={item.previewUrl}
                      poster={item.thumbnailUrl}
                      className="h-20 w-full object-cover"
                      muted
                      loop
                      playsInline
                    />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.thumbnailUrl} alt={item.title || ''} className="h-20 w-full object-cover" loading="lazy" />
                  )}
                </button>
                <span className="pointer-events-none absolute left-1 top-1 inline-flex items-center gap-0.5 rounded bg-black/70 px-1 py-px text-[8px] font-bold text-white">
                  {video ? <Play className="h-2 w-2 fill-white" /> : <Camera className="h-2 w-2" />}
                  {video && item.duration ? `${Math.round(item.duration)}s` : video ? 'video' : 'photo'}
                </span>
                <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent px-1 py-0.5 text-center text-[9px] font-bold text-white opacity-0 group-hover:opacity-100">
                  + Add at {formatTime(currentTime)}
                </span>
              </div>
            )
          })}
        </div>
      )}

      {/* Active b-roll items in this segment */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">
            <Layers className="inline h-3.5 w-3.5 mr-1" />
            B-roll Layer ({segItems.length})
          </Label>
          {segItems.length === 0 && (
            <span className="text-[10px] text-slate-400">Belum ada — search lalu klik footage</span>
          )}
        </div>

        {segItems.map((item) => (
          <BrollItemEditor
            key={item.id}
            item={item}
            segDuration={segDuration}
            onUpdate={(patch) => updateBroll(item.id, patch)}
            onDelete={() => deleteBroll(item.id)}
            onSeek={onSeek}
          />
        ))}
      </div>
    </div>
  )
}

interface BrollItemEditorProps {
  item: BrollItem
  segDuration: number
  onUpdate: (patch: Partial<BrollItem>) => void
  onDelete: () => void
  onSeek?: (time: number) => void
}

function BrollItemEditor({ item, segDuration, onUpdate, onDelete, onSeek }: BrollItemEditorProps) {
  const [draftStart, setDraftStart] = useState(item.start)
  const [draftEnd, setDraftEnd] = useState(item.end)

  useEffect(() => {
    setDraftStart(item.start)
    setDraftEnd(item.end)
  }, [item.start, item.end])

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-2.5 space-y-2">
        <div className="flex items-start gap-2">
          {item.thumbnailUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={item.thumbnailUrl} alt="" className="h-12 w-20 rounded object-cover flex-shrink-0" />
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              <span className={`inline-flex items-center gap-0.5 rounded ${item.type === 'video' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'} px-1`}>
                {item.type === 'video' ? <Film className="h-2.5 w-2.5" /> : <Camera className="h-2.5 w-2.5" />}
                {item.type}
              </span>
              <button
                type="button"
                onClick={() => onSeek?.(item.start)}
                className="font-mono text-slate-600 hover:text-blue-600"
                title="Jump to start"
              >
                {formatTime(item.start)}
              </button>
              <span>→</span>
              <button
                type="button"
                onClick={() => onSeek?.(item.end)}
                className="font-mono text-slate-600 hover:text-blue-600"
                title="Jump to end"
              >
                {formatTime(item.end)}
              </button>
            </div>
            {item.attribution && (
              <p className="text-[9px] text-slate-400 truncate">© {item.attribution}</p>
            )}
          </div>
          <Button size="sm" variant="ghost" onClick={onDelete} className="h-7 w-7 p-0 text-red-500 hover:text-red-600">
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>

        {/* Time range */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-[10px] uppercase">Start ({formatTime(draftStart)})</Label>
            <Slider
              value={[draftStart]}
              min={0}
              max={Math.max(0.5, segDuration - 0.5)}
              step={0.1}
              onValueChange={(v) => setDraftStart(v[0])}
              onValueCommit={(v) => onUpdate({ start: v[0], end: Math.max(v[0] + 0.5, draftEnd) })}
            />
          </div>
          <div>
            <Label className="text-[10px] uppercase">End ({formatTime(draftEnd)})</Label>
            <Slider
              value={[draftEnd]}
              min={draftStart + 0.5}
              max={segDuration}
              step={0.1}
              onValueChange={(v) => setDraftEnd(v[0])}
              onValueCommit={(v) => onUpdate({ end: v[0] })}
            />
          </div>
        </div>

        {/* Mode + transition */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-[10px] uppercase">Mode</Label>
            <Select
              value={item.mode || 'pip'}
              onValueChange={(v) => onUpdate({ mode: v as BrollOverlayMode })}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pip">Picture-in-Picture</SelectItem>
                <SelectItem value="full">Full Screen</SelectItem>
                <SelectItem value="side">Side</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-[10px] uppercase">Transition</Label>
            <Select
              value={item.transition || 'fade'}
              onValueChange={(v) => onUpdate({ transition: v as BrollTransition })}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cut">Cut</SelectItem>
                <SelectItem value="fade">Fade</SelectItem>
                <SelectItem value="slide">Slide</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* PIP positioning (only for pip mode) */}
        {(!item.mode || item.mode === 'pip' || item.mode === 'side') && (
          <div className="grid grid-cols-3 gap-2">
            <div>
              <Label className="text-[10px] uppercase">X ({((item.pipX ?? 0.5) * 100).toFixed(0)}%)</Label>
              <Slider
                value={[item.pipX ?? 0.5]}
                min={0}
                max={1}
                step={0.05}
                onValueChange={(v) => onUpdate({ pipX: v[0] })}
              />
            </div>
            <div>
              <Label className="text-[10px] uppercase">Y ({((item.pipY ?? 0.18) * 100).toFixed(0)}%)</Label>
              <Slider
                value={[item.pipY ?? 0.18]}
                min={0}
                max={1}
                step={0.05}
                onValueChange={(v) => onUpdate({ pipY: v[0] })}
              />
            </div>
            <div>
              <Label className="text-[10px] uppercase">Size ({((item.pipScale ?? 0.4) * 100).toFixed(0)}%)</Label>
              <Slider
                value={[item.pipScale ?? 0.4]}
                min={0.15}
                max={0.9}
                step={0.05}
                onValueChange={(v) => onUpdate({ pipScale: v[0] })}
              />
            </div>
          </div>
        )}

        {/* Audio ducking */}
        <div className="flex items-center gap-2 rounded-lg bg-slate-50 dark:bg-slate-900/40 px-2 py-1.5">
          <button
            type="button"
            onClick={() => onUpdate({ duckSourceAudio: !item.duckSourceAudio })}
            className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider"
            title="Duck source audio while overlay is active"
          >
            {item.duckSourceAudio ? (
              <VolumeX className="h-3 w-3 text-amber-600" />
            ) : (
              <Volume2 className="h-3 w-3 text-slate-400" />
            )}
            Audio Duck
          </button>
          {item.duckSourceAudio && (
            <div className="flex-1 flex items-center gap-2">
              <span className="text-[10px] text-slate-400">{((1 - (item.duckLevel ?? 0.3)) * 100).toFixed(0)}% reduce</span>
              <Slider
                value={[item.duckLevel ?? 0.3]}
                min={0}
                max={1}
                step={0.05}
                onValueChange={(v) => onUpdate({ duckLevel: v[0] })}
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
