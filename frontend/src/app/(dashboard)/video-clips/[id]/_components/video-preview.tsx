'use client'

import { forwardRef, useEffect, useImperativeHandle, useRef, useState, useCallback } from 'react'
import { Pause, Play, RotateCcw, Volume2, VolumeX } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ASPECT_RATIOS, type AspectRatio, type BrollItem, type Segment, type SubtitleStyle, type TitleStyle, formatTime } from './types'

interface VideoPreviewProps {
  streamUrl: string
  segment: Segment
  words: Array<{ word: string; start: number; end: number }>
  subtitleStyle: SubtitleStyle
  titleStyle: TitleStyle
  aspectRatio: AspectRatio
  cropOffsetX: number
  brollItems?: BrollItem[]
}

export interface VideoPreviewHandle {
  getVideoElement: () => HTMLVideoElement | null
  seekToSegmentTime: (t: number) => void
}

export const VideoPreview = forwardRef<VideoPreviewHandle, VideoPreviewProps>(function VideoPreview(
  { streamUrl, segment, words, subtitleStyle, titleStyle, aspectRatio, cropOffsetX, brollItems = [] },
  ref,
) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [currentTime, setCurrentTime] = useState(segment.startTime)
  const [loop, setLoop] = useState(true)

  useImperativeHandle(ref, () => ({
    getVideoElement: () => videoRef.current,
    seekToSegmentTime: (t: number) => {
      const video = videoRef.current
      if (!video) return
      const target = segment.startTime + Math.max(0, Math.min(t, segment.endTime - segment.startTime))
      video.currentTime = target
    },
  }))

  const ratio = ASPECT_RATIOS.find((r) => r.value === aspectRatio) || ASPECT_RATIOS[0]
  const aspectStyle = { aspectRatio: `${ratio.w} / ${ratio.h}` }

  // Seek to start when segment changes
  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    const onLoaded = () => {
      video.currentTime = segment.startTime
    }
    if (video.readyState >= 1) {
      video.currentTime = segment.startTime
    } else {
      video.addEventListener('loadedmetadata', onLoaded, { once: true })
    }
    setIsPlaying(false)
  }, [segment.startTime, segment.endTime, streamUrl])

  // Time update + loop logic
  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    const onTime = () => {
      setCurrentTime(video.currentTime)
      if (video.currentTime >= segment.endTime) {
        if (loop) {
          video.currentTime = segment.startTime
          video.play().catch(() => {})
        } else {
          video.pause()
          setIsPlaying(false)
        }
      }
    }
    video.addEventListener('timeupdate', onTime)
    return () => video.removeEventListener('timeupdate', onTime)
  }, [segment.startTime, segment.endTime, loop])

  const togglePlay = useCallback(() => {
    const video = videoRef.current
    if (!video) return
    if (video.paused) {
      if (video.currentTime < segment.startTime || video.currentTime >= segment.endTime) {
        video.currentTime = segment.startTime
      }
      video.play().catch(() => {})
      setIsPlaying(true)
    } else {
      video.pause()
      setIsPlaying(false)
    }
  }, [segment.startTime, segment.endTime])

  const restart = useCallback(() => {
    const video = videoRef.current
    if (!video) return
    video.currentTime = segment.startTime
    video.play().catch(() => {})
    setIsPlaying(true)
  }, [segment.startTime])

  const toggleMute = useCallback(() => {
    const video = videoRef.current
    if (!video) return
    video.muted = !video.muted
    setIsMuted(video.muted)
  }, [])

  // Visible words inside the segment for live subtitle line grouping
  const visibleWords = words.filter((w) => w.start >= segment.startTime && w.end <= segment.endTime)

  const segmentDuration = segment.endTime - segment.startTime
  const segmentProgress = segmentDuration > 0
    ? Math.max(0, Math.min(1, (currentTime - segment.startTime) / segmentDuration))
    : 0
  const segmentElapsed = Math.max(0, currentTime - segment.startTime)

  // Live subtitle: build line of words within ±2.5s window (matches backend grouping heuristic)
  const subtitleLine = (() => {
    if (!visibleWords.length) return null
    // Find the line that includes the current word
    const lines: Array<{ words: typeof visibleWords; start: number; end: number }> = []
    let cur: typeof visibleWords = []
    for (const w of visibleWords) {
      cur.push(w)
      const start = cur[0].start
      const end = cur[cur.length - 1].end
      if (cur.length >= 6 || end - start >= 2.5) {
        lines.push({ words: cur, start, end })
        cur = []
      }
    }
    if (cur.length) lines.push({ words: cur, start: cur[0].start, end: cur[cur.length - 1].end })
    return lines.find((l) => currentTime >= l.start - 0.05 && currentTime <= l.end + 0.05) || null
  })()

  const subBottomClass =
    subtitleStyle.position === 'top'
      ? 'top-[8%]'
      : subtitleStyle.position === 'center'
        ? 'top-1/2 -translate-y-1/2'
        : 'bottom-[8%]'

  const titleBottomClass =
    titleStyle.position === 'top'
      ? 'top-[5%]'
      : titleStyle.position === 'center'
        ? 'top-1/2 -translate-y-1/2'
        : 'bottom-[10%]'

  // Title visible only first 4 seconds of segment
  const showTitle = !!titleStyle.text && segmentElapsed >= 0 && segmentElapsed <= 4

  // Crop calculation: video object-cover + transform translate to mimic crop offset
  const cropTransform = (() => {
    // The video is shown as object-cover inside the aspect frame.
    // We approximate cropOffsetX (-1..1) by horizontal translation when source is wider than target.
    if (ratio.w / ratio.h >= 16 / 9) return 'none'
    const pct = cropOffsetX * 25 // up to ±25% horizontal pan visual hint
    return `translateX(${pct}%)`
  })()

  return (
    <div className="space-y-2">
      <div
        className="relative mx-auto w-full max-w-md overflow-hidden rounded-2xl bg-black shadow-xl"
        style={aspectStyle}
      >
        <video
          ref={videoRef}
          src={streamUrl}
          className={`h-full w-full ${aspectRatio === '9:16-fit' ? 'object-contain bg-black' : 'object-cover'}`}
          style={{ transform: aspectRatio === '9:16-fit' ? 'none' : cropTransform }}
          playsInline
          preload="metadata"
          crossOrigin="use-credentials"
        />

        {/* B-roll overlay layer */}
        {brollItems
          .filter((b) => {
            const t = currentTime - segment.startTime
            return t >= b.start && t <= b.end
          })
          .map((b) => {
            const fadeDur = b.transition === 'fade' ? 0.3 : 0
            const t = currentTime - segment.startTime
            let opacity = 1
            if (fadeDur > 0) {
              if (t - b.start < fadeDur) opacity = (t - b.start) / fadeDur
              else if (b.end - t < fadeDur) opacity = Math.max(0, (b.end - t) / fadeDur)
            }
            const mode = b.mode || 'pip'
            if (mode === 'full') {
              return (
                <div key={b.id} className="absolute inset-0 pointer-events-none" style={{ opacity }}>
                  {b.type === 'video' ? (
                    <video src={b.sourceUrl} className="h-full w-full object-cover" muted autoPlay loop playsInline />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={b.thumbnailUrl || b.sourceUrl} alt="" className="h-full w-full object-cover" />
                  )}
                </div>
              )
            }
            // PIP / side
            const scale = b.pipScale ?? 0.4
            const x = (b.pipX ?? 0.5) * 100
            const y = (b.pipY ?? 0.18) * 100
            const sizeStyle: React.CSSProperties = {
              left: `${x}%`,
              top: `${y}%`,
              width: `${scale * 100}%`,
              transform: 'translate(-50%, -50%)',
              opacity,
            }
            return (
              <div
                key={b.id}
                className="absolute pointer-events-none rounded-md overflow-hidden border-2 border-white/40 shadow-2xl"
                style={sizeStyle}
              >
                <div style={{ aspectRatio: '16 / 9' }}>
                  {b.type === 'video' ? (
                    <video src={b.sourceUrl} className="h-full w-full object-cover" muted autoPlay loop playsInline />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={b.thumbnailUrl || b.sourceUrl} alt="" className="h-full w-full object-cover" />
                  )}
                </div>
              </div>
            )
          })}

        {/* Title overlay */}
        {showTitle && (
          <div className={`absolute left-0 right-0 ${titleBottomClass} flex justify-center pointer-events-none px-4`}>
            <span
              className="rounded-md text-center font-black uppercase leading-tight"
              style={{
                fontFamily: titleStyle.fontFamily,
                fontSize: `${Math.max(14, Math.min(32, titleStyle.fontSize * 0.5))}px`,
                color: titleStyle.fontColor,
                backgroundColor: titleStyle.bgColor,
                padding: '6px 12px',
                maxWidth: '90%',
                textShadow: '0 2px 8px rgba(0,0,0,0.3)',
              }}
            >
              {titleStyle.text}
            </span>
          </div>
        )}

        {/* Subtitle overlay */}
        {subtitleLine && (
          <div className={`absolute left-0 right-0 ${subBottomClass} flex justify-center pointer-events-none px-3`}>
            <span
              className="rounded text-center font-bold leading-tight"
              style={{
                fontFamily: subtitleStyle.fontFamily,
                fontSize: `${Math.max(11, Math.min(28, subtitleStyle.fontSize * 0.5))}px`,
                color: subtitleStyle.fontColor,
                backgroundColor: subtitleStyle.bgColor || 'transparent',
                padding: subtitleStyle.bgColor ? '4px 8px' : 0,
                textShadow:
                  subtitleStyle.outlineWidth > 0
                    ? `${subtitleStyle.outlineColor} 1px 0px 0, ${subtitleStyle.outlineColor} -1px 0px 0, ${subtitleStyle.outlineColor} 0px 1px 0, ${subtitleStyle.outlineColor} 0px -1px 0`
                    : subtitleStyle.shadow
                      ? '0 2px 6px rgba(0,0,0,0.6)'
                      : 'none',
                maxWidth: '92%',
              }}
            >
              {subtitleLine.words.map((w, i) => {
                const isActive =
                  currentTime >= w.start - 0.02 && currentTime <= w.end + 0.05
                const useHighlight =
                  isActive &&
                  (subtitleStyle.animation === 'word-highlight' || subtitleStyle.animation === 'karaoke')
                return (
                  <span
                    key={i}
                    style={{
                      color: useHighlight ? subtitleStyle.highlightColor : subtitleStyle.fontColor,
                      transition: 'color 80ms linear',
                    }}
                  >
                    {w.word}
                    {i < subtitleLine.words.length - 1 ? ' ' : ''}
                  </span>
                )
              })}
            </span>
          </div>
        )}

        {/* Play overlay button */}
        {!isPlaying && (
          <button
            onClick={togglePlay}
            className="absolute inset-0 flex items-center justify-center bg-black/30 transition-opacity hover:bg-black/40"
            type="button"
          >
            <div className="rounded-full bg-white/90 p-4 shadow-lg">
              <Play className="h-6 w-6 text-slate-900" fill="currentColor" />
            </div>
          </button>
        )}

        {/* Progress bar */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/30">
          <div
            className="h-full bg-white/90 transition-[width] duration-150"
            style={{ width: `${segmentProgress * 100}%` }}
          />
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-1.5">
        <Button size="sm" variant="outline" onClick={togglePlay} className="h-8">
          {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
        </Button>
        <Button size="sm" variant="outline" onClick={restart} className="h-8">
          <RotateCcw className="h-3.5 w-3.5" />
        </Button>
        <Button size="sm" variant="outline" onClick={toggleMute} className="h-8">
          {isMuted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
        </Button>
        <Button
          size="sm"
          variant={loop ? 'default' : 'outline'}
          onClick={() => setLoop((l) => !l)}
          className="h-8 text-[10px] uppercase"
        >
          Loop
        </Button>
        <span className="ml-2 text-xs font-mono tabular-nums text-slate-500">
          {formatTime(segmentElapsed)} / {formatTime(segmentDuration)}
        </span>
      </div>
    </div>
  )
})
