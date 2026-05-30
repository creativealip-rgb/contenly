'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
  Loader2,
  MoveLeft,
  MoveRight,
  RefreshCw,
  Trash2,
} from 'lucide-react'
import type { Slide } from './types'

interface SlideEditorProps {
  currentSlide: Slide | undefined
  currentSlideIndex: number
  totalSlides: number
  editedContent: string
  setEditedContent: (v: string) => void
  hasUnsavedChanges: boolean
  setHasUnsavedChanges: (v: boolean) => void
  isGeneratingImage: string | null
  onUpdateSlide: (slideId: string, updates: Partial<Slide>) => void
  onGenerateImage: (slideId: string) => void
  onReorderSlide: (slideId: string, direction: 'left' | 'right') => void
  onDeleteSlide: (slideId: string) => void
  onNavigate: (index: number) => void
}

export function SlideEditor({
  currentSlide,
  currentSlideIndex,
  totalSlides,
  editedContent,
  setEditedContent,
  hasUnsavedChanges,
  setHasUnsavedChanges,
  isGeneratingImage,
  onUpdateSlide,
  onGenerateImage,
  onReorderSlide,
  onDeleteSlide,
  onNavigate,
}: SlideEditorProps) {
  return (
    <Card className="glass border-2 border-white/60 dark:border-white/20 overflow-hidden hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-none transition-all duration-500 rounded-3xl">
      <CardHeader className="pb-3 border-b mb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Slide {currentSlideIndex + 1} dari {totalSlides}</CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => onNavigate(Math.max(0, currentSlideIndex - 1))} disabled={currentSlideIndex === 0} title="Slide Sebelumnya">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={() => onNavigate(Math.min(totalSlides - 1, currentSlideIndex + 1))} disabled={currentSlideIndex === totalSlides - 1} title="Slide Berikutnya">
              <ChevronRight className="h-4 w-4" />
            </Button>
            <div className="w-px h-6 bg-border mx-1"></div>
            <Button variant="outline" size="icon" onClick={() => currentSlide && onReorderSlide(currentSlide.id, 'left')} disabled={currentSlideIndex === 0} title="Pindah Kiri">
              <MoveLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={() => currentSlide && onReorderSlide(currentSlide.id, 'right')} disabled={currentSlideIndex === totalSlides - 1} title="Pindah Kanan">
              <MoveRight className="h-4 w-4" />
            </Button>
            <Button variant="destructive" size="icon" onClick={() => currentSlide && onDeleteSlide(currentSlide.id)} disabled={totalSlides <= 1} title="Hapus Slide">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {currentSlide && (
          <>
            <div className="space-y-2">
              <Label>Teks Konten</Label>
              <Textarea
                value={editedContent}
                onChange={(e) => { setEditedContent(e.target.value); setHasUnsavedChanges(true) }}
                onBlur={() => { if (hasUnsavedChanges) onUpdateSlide(currentSlide.id, { textContent: editedContent }) }}
                className="min-h-[80px]"
              />
            </div>
            <div className="space-y-2">
              <Label>Prompt Visual</Label>
              <Textarea value={currentSlide.visualPrompt || ''} onChange={(e) => onUpdateSlide(currentSlide.id, { visualPrompt: e.target.value })} className="min-h-[60px]" />
            </div>
            <div className="space-y-4">
              <Label>Warna Latar Solid</Label>
              <div className="flex gap-2 items-center">
                <Input type="color" value={currentSlide.imageUrl?.startsWith('#') ? currentSlide.imageUrl : '#1a1a2e'} onChange={(e) => onUpdateSlide(currentSlide.id, { imageUrl: e.target.value })} className="h-10 w-20 cursor-pointer" />
                <p className="text-xs text-muted-foreground flex-1">Pilih warna untuk menggunakan latar belakang solid daripada gambar AI.</p>
              </div>
            </div>
            <div className="pt-4 border-t border-border mt-4">
              <Button onClick={() => onGenerateImage(currentSlide.id)} className="w-full" variant="outline">
                {isGeneratingImage === currentSlide.id ? (<><Loader2 className="h-4 w-4 mr-2 animate-spin" />Membuat Gambar...</>) : currentSlide.imageUrl ? (<><RefreshCw className="h-4 w-4 mr-2" />Buat Ulang Gambar (2 Token)</>) : (<><ImageIcon className="h-4 w-4 mr-2" />Buat Gambar Dasar (2 Token)</>)}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
// force rebuild Thu May 28 15:27:45 UTC 2026
