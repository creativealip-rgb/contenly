'use client'

import { useMemo, useRef, useState } from 'react'
import { Camera, Check, ExternalLink, Film, Loader2, Play, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { FootageFilter, FootageItem } from './types'

interface FootageGalleryProps {
  query: string
  loading: boolean
  results: FootageItem[]
  selectedFootage?: FootageItem[] | null
  onQueryChange: (q: string) => void
  onSearch: () => void
  onSelectFootage: (item: FootageItem) => void
  onSuggestKeywords?: () => void
  suggesting?: boolean
  suggestedKeywords?: string[]
  onUseKeyword?: (kw: string) => void
}

const isVideo = (item: FootageItem) => item.source === 'pexels-video'
const itemKey = (item: FootageItem) => `${item.source}:${item.id ?? item.previewUrl ?? item.thumbnailUrl}`

export function FootageGallery({
  query,
  loading,
  results,
  selectedFootage,
  onQueryChange,
  onSearch,
  onSelectFootage,
  onSuggestKeywords,
  suggesting,
  suggestedKeywords,
  onUseKeyword,
}: FootageGalleryProps) {
  const [filter, setFilter] = useState<FootageFilter>('all')
  const [previewing, setPreviewing] = useState<string | null>(null)
  const videoRefs = useRef<Record<string, HTMLVideoElement | null>>({})

  const counts = useMemo(() => {
    let photo = 0
    let video = 0
    for (const item of results) {
      if (isVideo(item)) video += 1
      else photo += 1
    }
    return { photo, video, all: results.length }
  }, [results])

  const filtered = useMemo(() => {
    if (filter === 'all') return results
    if (filter === 'video') return results.filter(isVideo)
    return results.filter((it) => !isVideo(it))
  }, [results, filter])

  const selectedKeys = useMemo(() => {
    const keys = new Set<string>()
    for (const item of selectedFootage || []) keys.add(itemKey(item))
    return keys
  }, [selectedFootage])

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
    <div className="space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900/40">
      {/* Selected preview row */}
      {selectedFootage && selectedFootage.length > 0 && (
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          {selectedFootage.map((item, i) => (
            <div key={itemKey(item) + i} className="relative">
              <img
                src={item.thumbnailUrl}
                alt=""
                className="h-10 w-16 rounded border-2 border-emerald-400 object-cover"
              />
              {isVideo(item) && (
                <span className="absolute bottom-0 right-0 rounded-tl bg-black/70 px-1 py-px text-[8px] font-bold text-white">
                  🎬
                </span>
              )}
            </div>
          ))}
          <span className="text-[10px] font-semibold text-emerald-600">
            ✓ {selectedFootage.length} dipilih
          </span>
        </div>
      )}

      {/* Search row */}
      <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Search Footage</div>
      <div className="flex gap-2">
        <Input
          placeholder="Cari footage..."
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onSearch()}
          className="h-8 text-xs"
        />
        <Button size="sm" variant="outline" onClick={onSearch} disabled={loading} className="h-8 px-2">
          {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Search className="h-3 w-3" />}
        </Button>
      </div>

      {/* Suggested keywords */}
      {(onSuggestKeywords || (suggestedKeywords && suggestedKeywords.length > 0)) && (
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          {onSuggestKeywords && (
            <button
              type="button"
              onClick={onSuggestKeywords}
              disabled={suggesting}
              className="flex items-center gap-1 rounded-full border border-dashed border-slate-300 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-500 hover:bg-white"
            >
              {suggesting ? <Loader2 className="h-2.5 w-2.5 animate-spin" /> : '✨'} Suggest keywords
            </button>
          )}
          {suggestedKeywords?.map((kw) => (
            <button
              key={kw}
              type="button"
              onClick={() => onUseKeyword?.(kw)}
              className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700 hover:bg-blue-100"
            >
              {kw}
            </button>
          ))}
        </div>
      )}

      {/* Filter chips */}
      {results.length > 0 && (
        <div className="flex items-center gap-1.5 pt-1">
          <FilterChip active={filter === 'all'} onClick={() => setFilter('all')}>
            All <span className="ml-1 text-slate-400">({counts.all})</span>
          </FilterChip>
          <FilterChip active={filter === 'photo'} onClick={() => setFilter('photo')}>
            <Camera className="h-3 w-3" />
            Photo <span className="ml-1 text-slate-400">({counts.photo})</span>
          </FilterChip>
          <FilterChip active={filter === 'video'} onClick={() => setFilter('video')}>
            <Film className="h-3 w-3" />
            Video <span className="ml-1 text-slate-400">({counts.video})</span>
          </FilterChip>
        </div>
      )}

      {/* Grid */}
      {filtered.length > 0 && (
        <div className="grid grid-cols-4 gap-1.5 mt-2">
          {filtered.map((item) => {
            const key = itemKey(item)
            const selected = selectedKeys.has(key)
            const video = isVideo(item)
            return (
              <div
                key={key}
                className="relative"
                onMouseEnter={() => video && handleHoverIn(key)}
                onMouseLeave={() => video && handleHoverOut(key)}
              >
                <button
                  type="button"
                  onClick={() => onSelectFootage(item)}
                  className={`block w-full overflow-hidden rounded-md border-2 transition-all ${
                    selected
                      ? 'border-emerald-400 ring-2 ring-emerald-300'
                      : 'border-transparent hover:border-blue-400'
                  }`}
                  title={item.title || ''}
                >
                  {video && previewing === key && item.previewUrl ? (
                    <video
                      ref={(el) => {
                        videoRefs.current[key] = el
                      }}
                      src={item.previewUrl}
                      poster={item.thumbnailUrl}
                      className="h-16 w-full object-cover"
                      muted
                      loop
                      playsInline
                    />
                  ) : (
                    <img
                      src={item.thumbnailUrl}
                      alt={item.title || ''}
                      className="h-16 w-full object-cover"
                      loading="lazy"
                    />
                  )}
                </button>

                {/* Type badge */}
                <span
                  className={`pointer-events-none absolute left-1 top-1 inline-flex items-center gap-0.5 rounded bg-black/70 px-1 py-px text-[8px] font-bold text-white ${
                    video ? '' : ''
                  }`}
                >
                  {video ? <Play className="h-2 w-2 fill-white" /> : <Camera className="h-2 w-2" />}
                  {video && item.duration ? `${Math.round(item.duration)}s` : video ? 'video' : 'photo'}
                </span>

                {/* Selected check */}
                {selected && (
                  <span className="pointer-events-none absolute right-1 top-1 rounded-full bg-emerald-500 p-0.5 text-white">
                    <Check className="h-2.5 w-2.5" />
                  </span>
                )}

                {/* Attribution link */}
                {item.attribution?.sourceUrl && (
                  <a
                    href={item.attribution.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="pointer-events-auto absolute bottom-1 right-1 rounded bg-black/60 p-0.5 text-white opacity-0 hover:bg-black/80 group-hover:opacity-100"
                    title={`by ${item.attribution.author || 'unknown'}`}
                  >
                    <ExternalLink className="h-2.5 w-2.5" />
                  </a>
                )}
              </div>
            )
          })}
        </div>
      )}

      {filter !== 'all' && filtered.length === 0 && results.length > 0 && (
        <p className="pt-2 text-center text-[11px] text-slate-400">Tidak ada hasil untuk filter ini.</p>
      )}
    </div>
  )
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider transition-colors ${
        active
          ? 'bg-slate-900 text-white shadow-sm'
          : 'bg-white text-slate-500 hover:text-slate-700 border border-slate-200'
      }`}
    >
      {children}
    </button>
  )
}
