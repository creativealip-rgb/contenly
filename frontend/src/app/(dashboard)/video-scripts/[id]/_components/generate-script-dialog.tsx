'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, Wand2 } from 'lucide-react'
import { ScriptStyleControls, defaultStyleOptions, type ScriptStyleOptions } from './script-style-controls'

interface GenerateScriptDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialSourceContent: string
  initialDuration: string
  isGenerating: boolean
  hasExistingScenes: boolean
  onGenerate: (params: {
    sourceContent: string
    targetDurationSeconds: number
    style: ScriptStyleOptions
  }) => Promise<void> | void
}

const DURATION_OPTIONS = [
  { value: '30', label: '30 detik (Reels singkat)' },
  { value: '45', label: '45 detik' },
  { value: '60', label: '60 detik (Standard)' },
  { value: '90', label: '90 detik' },
  { value: '120', label: '2 menit (Long-form short)' },
]

export function GenerateScriptDialog({
  open,
  onOpenChange,
  initialSourceContent,
  initialDuration,
  isGenerating,
  hasExistingScenes,
  onGenerate,
}: GenerateScriptDialogProps) {
  const [sourceContent, setSourceContent] = useState(initialSourceContent)
  const [duration, setDuration] = useState(initialDuration)
  const [style, setStyle] = useState<ScriptStyleOptions>(defaultStyleOptions)

  // Sync internal state when dialog opens with new defaults
  const handleOpenChange = (next: boolean) => {
    if (next) {
      setSourceContent(initialSourceContent)
      setDuration(initialDuration)
    }
    onOpenChange(next)
  }

  const canGenerate = sourceContent.trim().length > 30 && !isGenerating

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wand2 className="h-5 w-5 text-blue-600" />
            {hasExistingScenes ? 'Generate Ulang Script' : 'Generate Script'}
          </DialogTitle>
          <DialogDescription>
            Tempel konten sumber, atur gaya & target durasi. AI akan membuat full script dengan hook, scenes, dan caption.
            {hasExistingScenes && (
              <span className="block mt-1 text-amber-600 font-semibold">
                ⚠️ Generate ulang akan menghapus scene yang sudah ada.
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Source content */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Konten Sumber <span className="text-red-500">*</span>
            </label>
            <Textarea
              value={sourceContent}
              onChange={(e) => setSourceContent(e.target.value)}
              placeholder="Tempel artikel, briefing, transcript, atau ringkasan topik di sini. Minimal 30 karakter."
              className="min-h-[160px] resize-y"
              disabled={isGenerating}
            />
            <p className="text-[10px] text-slate-400">
              {sourceContent.trim().length} karakter
              {sourceContent.trim().length < 30 && sourceContent.trim().length > 0 && (
                <span className="text-amber-600"> (minimal 30)</span>
              )}
            </p>
          </div>

          {/* Duration */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Target Durasi</label>
            <select
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              disabled={isGenerating}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              {DURATION_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Style controls */}
          <div className="space-y-2 rounded-2xl border bg-slate-50/40 p-4 dark:bg-slate-900/30">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-600">Gaya Script</div>
            <ScriptStyleControls value={style} onChange={setStyle} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isGenerating}>
            Batal
          </Button>
          <Button
            onClick={() =>
              onGenerate({
                sourceContent,
                targetDurationSeconds: Number(duration || 60),
                style,
              })
            }
            disabled={!canGenerate}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Wand2 className="mr-2 h-4 w-4" />
                {hasExistingScenes ? 'Generate Ulang' : 'Generate Script'}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
