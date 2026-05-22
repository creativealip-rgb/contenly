'use client'

import { useMemo } from 'react'
import { Play } from 'lucide-react'
import type { TranscriptWord } from './types'

interface InteractiveTranscriptProps {
  words: TranscriptWord[]
  currentTime?: number
  highlightRange?: { start: number; end: number }
  onSeek?: (time: number) => void
  onSelectRange?: (start: number, end: number) => void
}

// Word-level interactive transcript that:
// - highlights the current word during playback
// - lets user click any word to seek
// - supports shift-click to mark range and create custom segment
export function InteractiveTranscript({
  words,
  currentTime = 0,
  highlightRange,
  onSeek,
  onSelectRange,
}: InteractiveTranscriptProps) {
  const grouped = useMemo(() => {
    // Group into pseudo-paragraphs by gap > 2s for readability
    const paragraphs: TranscriptWord[][] = []
    let current: TranscriptWord[] = []
    for (let i = 0; i < words.length; i++) {
      const w = words[i]
      if (current.length === 0) current.push(w)
      else {
        const prev = current[current.length - 1]
        if (w.start - prev.end > 2.0) {
          paragraphs.push(current)
          current = [w]
        } else {
          current.push(w)
        }
      }
    }
    if (current.length) paragraphs.push(current)
    return paragraphs
  }, [words])

  // Track shift-click range start
  let pendingStart: number | null = null

  const handleClick = (e: React.MouseEvent, w: TranscriptWord) => {
    if (e.shiftKey && onSelectRange) {
      // Find a previous click to define range — for simplicity treat shift-click as set end from current playhead start
      const start = pendingStart ?? Math.max(0, currentTime || w.start - 5)
      onSelectRange(Math.min(start, w.end), Math.max(start, w.end))
      pendingStart = null
    } else {
      pendingStart = w.start
      onSeek?.(w.start)
    }
  }

  if (!words.length) {
    return <p className="text-sm text-muted-foreground">Belum ada transcript.</p>
  }

  return (
    <div className="space-y-3 max-h-[400px] overflow-y-auto rounded-lg bg-slate-50 p-3 dark:bg-slate-900/40">
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
        <Play className="inline h-3 w-3" /> Click word to seek · Shift+click to mark segment
      </p>
      {grouped.map((para, pi) => (
        <p key={pi} className="text-sm leading-relaxed text-slate-700 dark:text-slate-200">
          {para.map((w, wi) => {
            const isActive = currentTime >= w.start - 0.05 && currentTime <= w.end + 0.05
            const inRange =
              highlightRange &&
              w.start >= highlightRange.start &&
              w.end <= highlightRange.end
            return (
              <span
                key={`${pi}-${wi}`}
                onClick={(e) => handleClick(e, w)}
                className={`cursor-pointer transition-colors rounded px-0.5 ${
                  isActive
                    ? 'bg-blue-500 text-white font-semibold'
                    : inRange
                      ? 'bg-blue-100 text-blue-900'
                      : 'hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
                title={`${w.start.toFixed(2)}s`}
              >
                {w.word}
                {wi < para.length - 1 ? ' ' : ''}
              </span>
            )
          })}
        </p>
      ))}
    </div>
  )
}
