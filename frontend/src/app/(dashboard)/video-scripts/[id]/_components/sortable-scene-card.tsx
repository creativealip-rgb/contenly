'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  CopyPlus,
  Eye,
  GripVertical,
  Loader2,
  PlayCircle,
  Plus,
  RefreshCw,
  Save,
  Search,
  Trash2,
  Volume2,
} from 'lucide-react'
import type { Scene } from './types'

interface SortableSceneCardProps {
  scene: Scene
  index: number
  totalScenes: number
  playingTtsSceneId: string | null
  regeneratingSceneId: string | null
  savingSceneId: string | null
  addingSceneAfter: number | null
  duplicatingSceneId: string | null
  deletingSceneId: string | null
  footageSearch?: { query: string; loading: boolean; results: any[] }
  onTtsPreview: (id: string) => void
  onRegenerateVoiceover: (id: string) => void
  onAddScene: (afterNum: number) => void
  onDuplicate: (id: string) => void
  onDelete: (id: string) => void
  onSave: (id: string) => void
  onUpdateDraft: (id: string, patch: Partial<Scene>) => void
  onFootageSearch: (id: string, query?: string) => void
  onFootageQueryChange: (id: string, query: string) => void
  onSelectFootage: (sceneId: string, item: any) => void
}

export function SortableSceneCard({
  scene,
  index,
  totalScenes,
  playingTtsSceneId,
  regeneratingSceneId,
  savingSceneId,
  addingSceneAfter,
  duplicatingSceneId,
  deletingSceneId,
  footageSearch,
  onTtsPreview,
  onRegenerateVoiceover,
  onAddScene,
  onDuplicate,
  onDelete,
  onSave,
  onUpdateDraft,
  onFootageSearch,
  onFootageQueryChange,
  onSelectFootage,
}: SortableSceneCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: scene.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition || 'transform 200ms ease',
    opacity: isDragging ? 0.7 : 1,
    scale: isDragging ? '1.02' : '1',
    zIndex: isDragging ? 50 : 'auto',
    boxShadow: isDragging ? '0 10px 40px rgba(0,0,0,0.15)' : 'none',
  }

  return (
    <div ref={setNodeRef} style={style}>
      <Card className="glass overflow-hidden rounded-3xl border-2 border-white/60 dark:border-white/20">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b bg-slate-950 px-5 py-3 text-white">
          <div className="flex items-center gap-2">
            <button {...attributes} {...listeners} className="cursor-grab touch-none text-slate-400 hover:text-white">
              <GripVertical className="h-4 w-4" />
            </button>
            <span className="text-sm font-bold uppercase tracking-wider">Scene {scene.sceneNumber}</span>
            {index === 0 && <Badge className="bg-pink-500/20 text-pink-100">Hook</Badge>}
            {index === totalScenes - 1 && <Badge className="bg-blue-500/20 text-blue-100">CTA</Badge>}
            {scene.estimatedDuration ? (
              <Badge variant="secondary" className="bg-white/10 text-white">{scene.estimatedDuration}s</Badge>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-1.5">
            <Button size="sm" variant="secondary" onClick={() => onTtsPreview(scene.id)} disabled={playingTtsSceneId !== null && playingTtsSceneId !== scene.id} title="Preview TTS">
              {playingTtsSceneId === scene.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Volume2 className="h-4 w-4" />}
            </Button>
            <Button size="sm" variant="secondary" onClick={() => onRegenerateVoiceover(scene.id)} disabled={regeneratingSceneId === scene.id} title="Regenerate VO">
              {regeneratingSceneId === scene.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
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

        <CardContent className="grid gap-6 p-5 md:grid-cols-2">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
              <Eye className="h-3.5 w-3.5" />
              Visual / Footage Direction
            </div>
            <Textarea
              value={scene.visualContext}
              onChange={(e) => onUpdateDraft(scene.id, { visualContext: e.target.value })}
              className="min-h-[150px]"
            />

            <div className="space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
              {scene.selectedFootage && scene.selectedFootage.length > 0 && (
                <div className="flex items-center gap-2 mb-2">
                  <img src={scene.selectedFootage[0].thumbnailUrl} alt="" className="h-10 w-16 object-cover rounded border-2 border-green-400" />
                  <span className="text-[10px] text-green-600 font-semibold">✓ Footage dipilih</span>
                </div>
              )}
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Search Footage</div>
              <div className="flex gap-2">
                <Input
                  placeholder="Cari footage..."
                  value={footageSearch?.query || ''}
                  onChange={(e) => onFootageQueryChange(scene.id, e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && onFootageSearch(scene.id)}
                  className="h-8 text-xs"
                />
                <Button size="sm" variant="outline" onClick={() => onFootageSearch(scene.id)} disabled={footageSearch?.loading} className="h-8 px-2">
                  {footageSearch?.loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Search className="h-3 w-3" />}
                </Button>
              </div>
              {footageSearch?.results && footageSearch.results.length > 0 && (
                <div className="grid grid-cols-4 gap-1.5 mt-2">
                  {footageSearch.results.map((item: any, i: number) => (
                    <button key={i} onClick={() => onSelectFootage(scene.id, item)} className="block overflow-hidden rounded-md border hover:ring-2 hover:ring-blue-400 focus:ring-2 focus:ring-blue-500" title="Klik untuk pilih footage ini">
                      <img src={item.thumbnailUrl} alt={item.title || ''} className="h-16 w-full object-cover" loading="lazy" />
                    </button>
                  ))}
                </div>
              )}
            </div>
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
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
