'use client'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react'
import type { Slide } from './types'

interface PreviewModalProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  slides: Slide[]
  previewSlideIndex: number
  setPreviewSlideIndex: (index: number) => void
}

export function PreviewModal({ isOpen, onOpenChange, slides, previewSlideIndex, setPreviewSlideIndex }: PreviewModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Pratinjau Carousel - Slide {previewSlideIndex + 1} dari {slides.length}</DialogTitle>
        </DialogHeader>

        <div className="relative flex items-center justify-center">
          {previewSlideIndex > 0 && (
            <Button variant="ghost" size="icon" className="absolute left-0 z-10 h-12 w-12 rounded-full bg-black/50 hover:bg-black/70" onClick={() => setPreviewSlideIndex(previewSlideIndex - 1)}>
              <ChevronLeft className="h-6 w-6 text-white" />
            </Button>
          )}

          <div className="w-full max-w-[400px] aspect-[4/5] rounded-lg overflow-hidden bg-slate-900 border-4 border-slate-800 shadow-2xl">
            {slides[previewSlideIndex] ? (
              <>
                {slides[previewSlideIndex].imageUrl ? (
                  slides[previewSlideIndex].imageUrl.startsWith('#') || slides[previewSlideIndex].imageUrl.startsWith('rgb') ? (
                    <div className="absolute inset-0 w-full h-full" style={{ backgroundColor: slides[previewSlideIndex].imageUrl }} />
                  ) : (
                    <img src={slides[previewSlideIndex].imageUrl} alt={`Slide ${previewSlideIndex + 1}`} className="w-full h-full object-cover" />
                  )
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
                    <div className="text-center p-4">
                      <Sparkles className="h-12 w-12 text-slate-600 mx-auto mb-2" />
                      <p className="text-slate-500 text-sm">Belum ada gambar</p>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="w-full h-full bg-slate-900 flex items-center justify-center">
                <p className="text-slate-500">Tidak ada slide</p>
              </div>
            )}
          </div>

          {previewSlideIndex < slides.length - 1 && (
            <Button variant="ghost" size="icon" className="absolute right-0 z-10 h-12 w-12 rounded-full bg-black/50 hover:bg-black/70" onClick={() => setPreviewSlideIndex(previewSlideIndex + 1)}>
              <ChevronRight className="h-6 w-6 text-white" />
            </Button>
          )}
        </div>

        <div className="flex justify-center gap-2 py-4">
          {slides.map((_, index) => (
            <button key={index} onClick={() => setPreviewSlideIndex(index)} className={`w-3 h-3 rounded-full transition-all ${index === previewSlideIndex ? 'bg-pink-500 scale-110' : 'bg-slate-300 hover:bg-slate-400'}`} />
          ))}
        </div>

        <div className="text-center">
          <p className="font-medium text-sm text-slate-600 dark:text-slate-400">
            {slides[previewSlideIndex]?.textContent?.split('\n')[0] || 'Slide ' + (previewSlideIndex + 1)}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
