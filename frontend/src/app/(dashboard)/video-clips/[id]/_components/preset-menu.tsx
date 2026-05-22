'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import {
  Bookmark,
  BookmarkCheck,
  Loader2,
  Save,
  Star,
  Trash2,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { api } from '@/lib/api'
import type { AspectRatio, SubtitleStyle, TitleStyle } from './types'

export interface ClipPresetConfig {
  subtitleStyle?: SubtitleStyle
  titleStyle?: TitleStyle
  aspectRatio?: AspectRatio
  cropOffsetX?: number
}

export interface ClipPreset {
  id: string
  name: string
  description?: string | null
  config: ClipPresetConfig
  isFavorite?: boolean | null
  createdAt: string
}

interface PresetMenuProps {
  currentConfig: ClipPresetConfig
  onApply: (preset: ClipPresetConfig) => void
}

export function PresetMenu({ currentConfig, onApply }: PresetMenuProps) {
  const [presets, setPresets] = useState<ClipPreset[]>([])
  const [loading, setLoading] = useState(false)
  const [saveOpen, setSaveOpen] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)

  const loadPresets = async () => {
    setLoading(true)
    try {
      const data = await api.get<ClipPreset[]>('/video-clips/presets')
      setPresets(data)
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadPresets() }, [])

  const savePreset = async () => {
    if (!name.trim()) { toast.error('Nama preset wajib diisi'); return }
    setSaving(true)
    try {
      await api.post('/video-clips/presets', {
        name: name.trim(),
        description: description.trim() || undefined,
        config: currentConfig,
      })
      toast.success(`Preset "${name}" disimpan`)
      setSaveOpen(false)
      setName('')
      setDescription('')
      loadPresets()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal simpan preset')
    } finally {
      setSaving(false)
    }
  }

  const toggleFavorite = async (preset: ClipPreset) => {
    try {
      await api.patch(`/video-clips/presets/${preset.id}`, { isFavorite: !preset.isFavorite })
      loadPresets()
    } catch {
      toast.error('Gagal update preset')
    }
  }

  const deletePreset = async (preset: ClipPreset) => {
    if (!confirm(`Hapus preset "${preset.name}"?`)) return
    try {
      await api.delete(`/video-clips/presets/${preset.id}`)
      toast.success('Preset dihapus')
      loadPresets()
    } catch {
      toast.error('Gagal hapus preset')
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="sm" variant="outline" className="h-8 text-xs gap-1">
            <Bookmark className="h-3 w-3" />
            Preset
            {presets.length > 0 && (
              <span className="rounded-full bg-slate-200 px-1.5 text-[9px] font-bold text-slate-600">
                {presets.length}
              </span>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-72">
          <DropdownMenuLabel className="flex items-center justify-between">
            <span>My Presets</span>
            <button
              type="button"
              onClick={() => setSaveOpen(true)}
              className="flex items-center gap-1 text-[10px] font-bold uppercase text-blue-600 hover:underline"
            >
              <Save className="h-3 w-3" /> Save current
            </button>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />

          {loading ? (
            <div className="flex justify-center py-3">
              <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
            </div>
          ) : presets.length === 0 ? (
            <div className="px-3 py-4 text-center text-xs text-slate-400">
              Belum ada preset.
              <br />
              Save dari config saat ini untuk reuse.
            </div>
          ) : (
            <div className="max-h-72 overflow-y-auto">
              {presets.map((preset) => (
                <div
                  key={preset.id}
                  className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); toggleFavorite(preset) }}
                    className="flex-shrink-0"
                    title={preset.isFavorite ? 'Unfavorite' : 'Favorite'}
                  >
                    <Star
                      className={`h-3.5 w-3.5 ${preset.isFavorite ? 'fill-yellow-400 text-yellow-400' : 'text-slate-300'}`}
                    />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onApply(preset.config)
                      toast.success(`Preset "${preset.name}" applied`)
                    }}
                    className="flex-1 min-w-0 text-left"
                  >
                    <p className="truncate font-semibold">{preset.name}</p>
                    {preset.description && (
                      <p className="truncate text-[10px] text-slate-400">{preset.description}</p>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => deletePreset(preset)}
                    className="flex-shrink-0 text-slate-300 hover:text-red-500"
                    title="Delete"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={saveOpen} onOpenChange={setSaveOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookmarkCheck className="h-5 w-5 text-blue-600" />
              Save Preset
            </DialogTitle>
            <DialogDescription>
              Simpan kombinasi subtitle style, title style, aspect ratio, dan crop offset saat ini.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Nama *</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="cth: Bold Karaoke 9:16" />
            </div>
            <div>
              <Label>Deskripsi (opsional)</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Cocok untuk talking head viral..."
                className="min-h-[60px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveOpen(false)}>Batal</Button>
            <Button onClick={savePreset} disabled={saving || !name.trim()}>
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
