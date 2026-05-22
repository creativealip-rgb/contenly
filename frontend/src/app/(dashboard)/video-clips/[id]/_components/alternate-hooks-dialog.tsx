'use client'

import { useState } from 'react'
import { Loader2, Sparkles, Wand2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { API_BASE_URL } from './types'

interface AlternateHooksDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectId: string
  segmentIndex: number
  currentTitle: string
  onSelect: (newTitle: string) => void
}

export function AlternateHooksDialog({
  open,
  onOpenChange,
  projectId,
  segmentIndex,
  currentTitle,
  onSelect,
}: AlternateHooksDialogProps) {
  const [hooks, setHooks] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  const generate = async () => {
    setLoading(true)
    try {
      const res = await fetch(
        `${API_BASE_URL}/video-clips/${projectId}/segments/${segmentIndex}/alternate-hooks`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ count: 5 }),
        },
      )
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d.message || 'Gagal generate alternatif')
      }
      const data = await res.json()
      setHooks(data.hooks || [])
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal generate alternatif')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-pink-600" />
            Alternate Hook Titles
          </DialogTitle>
          <DialogDescription>
            AI suggest 5 variasi hook untuk clip ini. Cocok untuk A/B test.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <p className="text-xs text-slate-400">
            Hook saat ini: <span className="italic">&ldquo;{currentTitle}&rdquo;</span>
          </p>
          {hooks.length === 0 ? (
            <Button onClick={generate} disabled={loading} className="w-full">
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
              Generate 5 Alternatif (1 token)
            </Button>
          ) : (
            <div className="space-y-2">
              {hooks.map((h, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    onSelect(h)
                    onOpenChange(false)
                  }}
                  className="block w-full rounded-xl border border-slate-200 bg-white p-3 text-left text-sm font-semibold transition-all hover:border-blue-400 hover:bg-blue-50 hover:shadow-md"
                >
                  {h}
                </button>
              ))}
              <Button onClick={generate} disabled={loading} variant="outline" className="w-full" size="sm">
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
                Generate ulang
              </Button>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Tutup
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
