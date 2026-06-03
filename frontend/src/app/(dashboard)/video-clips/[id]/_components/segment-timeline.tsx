'use client'

import { useEffect, useMemo, useRef } from 'react'
import { Plus } from 'lucide-react'
import type { Segment } from './types'

interface SegmentTimelineProps {
  duration: number
  segments: Segment[]
  selectedIndex: number
  currentTime?: number
  waveform?: number[] | null
  onSelectSegment: (index: number) => void
  onSeek?: (time: number) => void
  onAddSegment?: (startTime: number) => void
}

const formatHM = (s: number) => {
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${String(sec).padStart(2, '0')}`
}

export function SegmentTimeline({
  duration,
  segments,
  selectedIndex,
  currentTime = 0,
  waveform,
  onSelectSegment,
  onSeek,
  onAddSegment,
}: SegmentTimelineProps) {
  const trackRef = useRef<HTMLDivElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  // Scroll selected segment into view
  useEffect(() => {
    const el = trackRef.current?.querySelector<HTMLElement>(`[data-segment-index="${selectedIndex}"]`)
    el?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
  }, [selectedIndex])

  // Draw waveform
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !waveform || waveform.length === 0) return
    const dpr = window.devicePixelRatio || 1
    const cssWidth = canvas.clientWidth
    const cssHeight = canvas.clientHeight
    canvas.width = cssWidth * dpr
    canvas.height = cssHeight * dpr
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.scale(dpr, dpr)
    ctx.clearRect(0, 0, cssWidth, cssHeight)
    ctx.fillStyle = 'rgba(99, 102, 241, 0.45)' // indigo-500 translucent
    const barWidth = cssWidth / waveform.length
    const center = cssHeight / 2
    for (let i = 0; i < waveform.length; i++) {
      const peak = Math.min(1, waveform[i])
      const half = peak * (cssHeight / 2 - 1)
      ctx.fillRect(i * barWidth, center - half, Math.max(0.5, barWidth - 0.5), half * 2)
    }
  }, [waveform])

  const minutes = useMemo(() => (duration > 0 ? Math.ceil(duration / 60) : 0), [duration])

  if (!duration || duration <= 0) return null

  const handleTrackClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!onSeek && !onAddSegment) return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const t = (x / rect.width) * duration
    if (e.shiftKey && onAddSegment) {
      onAddSegment(t)
    } else {
      onSeek?.(t)
    }
  }

  return (
    <div className="space-y-2 rounded-2xl border-2 border-slate-200 bg-white p-3 dark:bg-slate-900 dark:border-slate-700">
      <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
        <span>Timeline ({formatHM(duration)})</span>
        <span className="text-[10px] text-slate-400">Click: seek · Shift+Click: add segment</span>
      </div>
      <div
        ref={trackRef}
        onClick={handleTrackClick}
        className="relative h-20 w-full cursor-pointer overflow-hidden rounded-lg bg-slate-50 dark:bg-slate-800"
      >
        {/* Waveform layer */}
        {waveform && waveform.length > 0 && (
          <canvas
            ref={canvasRef}
            className="pointer-events-none absolute inset-0 h-full w-full"
          />
        )}

        {/* Tick marks */}
        {Array.from({ length: minutes + 1 }).map((_, i) => {
          const t = i * 60
          if (t > duration) return null
          const left = (t / duration) * 100
          return (
            <div
              key={`tick-${i}`}
              className="pointer-events-none absolute top-0 bottom-0 w-px bg-slate-300/40 dark:bg-slate-600/40"
              style={{ left: `${left}%` }}
            >
              <span className="absolute top-0.5 left-1 text-[9px] font-mono text-slate-400">{formatHM(t)}</span>
            </div>
          )
        })}

        {/* Segments */}
        {segments.map((seg, i) => {
          const left = (seg.startTime / duration) * 100
          const width = ((seg.endTime - seg.startTime) / duration) * 100
          const isSelected = i === selectedIndex
          const score = seg.viralScore || 0
          const intensity = Math.min(1, score / 10)
          const bg = score === 0
            ? 'bg-slate-400/70 dark:bg-slate-500/70'
            : intensity >= 0.8
              ? 'bg-pink-500/85'
              : intensity >= 0.6
                ? 'bg-orange-500/85'
                : intensity >= 0.4
                  ? 'bg-amber-500/85'
                  : 'bg-blue-400/85'
          return (
            <button
              key={i}
              data-segment-index={i}
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onSelectSegment(i)
              }}
              className={`absolute top-3 bottom-3 rounded-md transition-all overflow-hidden border ${bg} ${
                isSelected ? 'ring-2 ring-blue-600 ring-offset-1 z-10 shadow-lg border-white' : 'border-white/30 hover:opacity-100 opacity-90'
              }`}
              style={{ left: `${left}%`, width: `${Math.max(0.5, width)}%` }}
              title={`#${i + 1} · ${seg.hookTitle} · ${formatHM(seg.startTime)}–${formatHM(seg.endTime)}`}
            >
              <div className="px-1.5 pt-1 text-[9px] font-bold uppercase truncate text-white">
                #{i + 1} {score > 0 ? `· ${score}` : ''}
              </div>
              {width > 8 && (
                <div className="px-1.5 text-[9px] truncate text-white/95">{seg.hookTitle}</div>
              )}
            </button>
          )
        })}

        {/* Playhead */}
        {currentTime > 0 && (
          <div
            className="pointer-events-none absolute top-0 bottom-0 w-0.5 bg-red-500 z-20"
            style={{ left: `${(currentTime / duration) * 100}%` }}
          >
            <div className="absolute -top-1 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 bg-red-500" />
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] font-semibold text-slate-500">
        <LegendDot color="bg-pink-500" label="8-10 viral" />
        <LegendDot color="bg-orange-500" label="6-7" />
        <LegendDot color="bg-amber-500" label="4-5" />
        <LegendDot color="bg-blue-400" label="1-3" />
        <LegendDot color="bg-slate-400" label="custom" />
        {waveform && waveform.length > 0 && (
          <span className="inline-flex items-center gap-1">
            <span className="h-2 w-2 rounded-sm bg-indigo-500/60" />
            audio
          </span>
        )}
        {onAddSegment && (
          <span className="ml-auto text-[10px] font-semibold text-blue-600">
            <Plus className="inline h-3 w-3" /> Shift-click empty space
          </span>
        )}
      </div>
    </div>
  )
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1">
      <span className={`h-2 w-2 rounded-sm ${color}`} />
      {label}
    </span>
  )
}
