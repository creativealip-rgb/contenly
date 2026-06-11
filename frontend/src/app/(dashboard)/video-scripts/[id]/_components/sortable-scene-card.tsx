'use client'

import Image from 'next/image'
import { useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  ChevronDown,
  ChevronRight,
  CopyPlus,
  Eye,
  GripVertical,
  Loader2,
  PlayCircle,
  Plus,
  RefreshCw,
  Save,
  Sparkles,
  StickyNote,
  Trash2,
  Volume2,
  Wand2,
} from 'lucide-react'
import type { FootageItem, Scene } from './types'
import { FootageGallery } from './footage-gallery'

interface SortableSceneCardProps {
  scene: Scene
  index: number
  totalScenes: number
  defaultCollapsed?: boolean
  playingTtsSceneId: string | null
  regeneratingSceneId: string | null
  improvingVisualSceneId: string | null
  savingSceneId: string | null
  addingSceneAfter: number | null
  duplicatingSceneId: string | null
  deletingSceneId: string | null
  footageSearch?: { query: string; loading: boolean; results: FootageItem[] }
  suggestedKeywords?: string[]
  suggestingKeywordsSceneId?: string | null
  onTtsPreview: (id: string) => void
  onRegenerateVoiceover: (id: string) => void
  onImproveVisual: (id: string) => void
  onAddScene: (afterNum: number) => void
  onDuplicate: (id: string) => void
  onDelete: (id: string) => void
  onSave: (id: string) => void
  onUpdateDraft: (id: string, patch: Partial<Scene>) => void
  onFootageSearch: (id: string, query?: string) => void
  onFootageQueryChange: (id: string, query: string) => void
  onSelectFootage: (sceneId: string, item: FootageItem) => void
  onSuggestKeywords: (id: string) => void
}

export function SortableSceneCard({
  scene,
  index,
  totalScenes,
  defaultCollapsed = false,
  playingTtsSceneId,
  regeneratingSceneId,
  improvingVisualSceneId,
  savingSceneId,
  addingSceneAfter,
  duplicatingSceneId,
  deletingSceneId,
  footageSearch,
  suggestedKeywords,
  suggestingKeywordsSceneId,
  onTtsPreview,
  onRegenerateVoiceover,
  onImproveVisual,
  onAddScene,
  onDuplicate,
  onDelete,
  onSave,
  onUpdateDraft,
  onFootageSearch,
  onFootageQueryChange,
  onSelectFootage,
  onSuggestKeywords,
}: SortableSceneCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: scene.id })
  const [collapsed, setCollapsed] = useState(defaultCollapsed)
  const [showNotes, setShowNotes] = useState(!!scene.directorNotes)

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition || 'transform 200ms ease',
    opacity: isDragging ? 0.7 : 1,
    scale: isDragging ? '1.02' : '1',
    zIndex: isDragging ? 50 : 'auto',
    boxShadow: isDragging ? '0 10px 40px rgba(0,0,0,0.15)' : 'none',
  }

  const voPreview = (scene.voiceoverText || '').slice(0, 140)
  const wordCount = (scene.voiceoverText || '').trim().split(/\s+/).filter(Boolean).length
  const firstFootage = scene.selectedFootage?.[0]

  return (
    <div ref={setNodeRef} style={style}>
      <Card className="glass overflow-hidden rounded-3xl border-2 border-white/60 dark:border-white/20">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b bg-slate-950 px-5 py-3 text-white">
          <div className="flex items-center gap-2">
            <button {...attributes} {...listeners} className="cursor-grab touch-none text-slate-400 hover:text-white" title="Drag untuk reorder">
              <GripVertical className="h-4 w-4" />
            </button>
            <button
              onClick={() => setCollapsed((c) => !c)}
              className="flex items-center gap-1 text-slate-300 hover:text-white"
              title={collapsed ? 'Expand' : 'Collapse'}
            >
              {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
            <span className="text-sm font-bold uppercase tracking-wider">Scene {scene.sceneNumber}</span>
            {scene.emoji && <span className="text-base">{scene.emoji}</span>}
            {index === 0 && <Badge className="bg-pink-500/20 text-pink-100">Hook</Badge>}
            {index === totalScenes - 1 && <Badge className="bg-blue-500/20 text-blue-100">CTA</Badge>}
            {scene.estimatedDuration ? (
              <Badge variant="secondary" className="bg-white/10 text-white">{scene.estimatedDuration}s</Badge>
            ) : null}
            <Badge variant="secondary" className="bg-white/5 text-white/70 text-[10px]">{wordCount} kata</Badge>
            {firstFootage && (
              <span className="relative ml-1 block h-6 w-10 overflow-hidden rounded border border-white/20">
                <Image src={firstFootage.thumbnailUrl} alt="" fill sizes="40px" className="object-cover" unoptimized />
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5">
            <Button size="sm" variant="secondary" onClick={() => onTtsPreview(scene.id)} disabled={playingTtsSceneId !== null && playingTtsSceneId !== scene.id} title="Preview TTS">
              {playingTtsSceneId === scene.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Volume2 className="h-4 w-4" />}
            </Button>
            <Button size="sm" variant="secondary" onClick={() => onRegenerateVoiceover(scene.id)} disabled={regeneratingSceneId === scene.id} title="Regenerate VO">
              {regeneratingSceneId === scene.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            </Button>
            <Button size="sm" variant="secondary" onClick={() => onImproveVisual(scene.id)} disabled={improvingVisualSceneId === scene.id} title="Improve visual prompt">
              {improvingVisualSceneId === scene.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
            </Button>
            <Button size="sm" variant="secondary" onClick={() => onAddScene(scene.sceneNumber)} disabled={addingSceneAfter !== null} title="Tambah scene">
              <Plus className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="secondary" onClick={() => onDuplicate(scene.id)} disabled={duplicatingSceneId === scene.id} title="Duplikasi">
              {duplicatingSceneId === scene.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CopyPlus className="h-4 w-4" />}
            </Button>
            <Button size="sm" variant="destructive" onClick={() => onDelete(scene.id)} disabled={deletingSceneId === scene.id || totalScenes <= 1} title="Hapus">
              {deletingSceneId === scene.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            </Button>
            <Button size="sm" variant="secondary" onClick={() => onSave(scene.id)} disabled={savingSceneId === scene.id} title="Simpan">
              {savingSceneId === scene.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {collapsed ? (
          <div className="flex items-start gap-3 px-5 py-3 cursor-pointer hover:bg-slate-50/50" onClick={() => setCollapsed(false)}>
            {firstFootage ? (
              <div className="relative h-16 w-24 flex-shrink-0 overflow-hidden rounded-md border">
                <Image src={firstFootage.thumbnailUrl} alt="" fill sizes="96px" className="object-cover" unoptimized />
              </div>
            ) : (
              <div className="h-16 w-24 rounded-md border border-dashed bg-slate-50 flex items-center justify-center flex-shrink-0">
                <Eye className="h-5 w-5 text-slate-300" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm text-slate-700 line-clamp-2 italic">&ldquo;{voPreview || '(voiceover kosong)'}&rdquo;</p>
              <p className="text-xs text-slate-400 mt-1 line-clamp-1">{scene.visualContext || '(visual kosong)'}</p>
            </div>
          </div>
        ) : (
          <CardContent className="grid gap-6 p-5 md:grid-cols-2">
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <Eye className="h-3.5 w-3.5" />
                  Visual / Footage Direction
                </div>
                <button
                  type="button"
                  onClick={() => onImproveVisual(scene.id)}
                  disabled={improvingVisualSceneId === scene.id}
                  className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-bold uppercase text-violet-700 hover:bg-violet-100 disabled:opacity-50"
                >
                  {improvingVisualSceneId === scene.id ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Sparkles className="h-3 w-3" />
                  )}
                  AI Improve
                </button>
              </div>
              <Textarea
                value={scene.visualContext}
                onChange={(e) => onUpdateDraft(scene.id, { visualContext: e.target.value })}
                className="min-h-[150px]"
              />

              <FootageGallery
                query={footageSearch?.query || ''}
                loading={footageSearch?.loading || false}
                results={footageSearch?.results || []}
                selectedFootage={scene.selectedFootage || []}
                onQueryChange={(q) => onFootageQueryChange(scene.id, q)}
                onSearch={() => onFootageSearch(scene.id)}
                onSelectFootage={(item) => onSelectFootage(scene.id, item)}
                onSuggestKeywords={() => onSuggestKeywords(scene.id)}
                suggesting={suggestingKeywordsSceneId === scene.id}
                suggestedKeywords={suggestedKeywords}
                onUseKeyword={(kw) => {
                  onFootageQueryChange(scene.id, kw)
                  onFootageSearch(scene.id, kw)
                }}
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <PlayCircle className="h-3.5 w-3.5" />
                Voiceover
              </div>
              <Textarea
                value={scene.voiceoverText}
                onChange={(e) => onUpdateDraft(scene.id, { voiceoverText: e.target.value })}
                className="min-h-[150px]"
              />
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Durasi Estimasi</label>
                  <Input type="number" value={scene.estimatedDuration || ''} onChange={(e) => onUpdateDraft(scene.id, { estimatedDuration: e.target.value ? Number(e.target.value) : null })} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Emoji</label>
                  <Input value={scene.emoji || ''} onChange={(e) => onUpdateDraft(scene.id, { emoji: e.target.value })} />
                </div>
              </div>

              {/* Director notes */}
              <div className="space-y-2 rounded-lg border border-dashed border-amber-200 bg-amber-50/40 p-2">
                <button
                  type="button"
                  onClick={() => setShowNotes((s) => !s)}
                  className="flex w-full items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-700"
                >
                  <StickyNote className="h-3.5 w-3.5" />
                  Director Notes
                  <span className="ml-auto text-[10px] text-amber-600">{showNotes ? '−' : '+'}</span>
                </button>
                {showNotes && (
                  <Textarea
                    value={scene.directorNotes || ''}
                    onChange={(e) => onUpdateDraft(scene.id, { directorNotes: e.target.value })}
                    placeholder="Catatan untuk editor: SFX, transisi, motion, dll..."
                    className="min-h-[60px] text-xs"
                  />
                )}
              </div>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  )
}
