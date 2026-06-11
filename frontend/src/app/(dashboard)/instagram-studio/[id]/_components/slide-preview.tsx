'use client'

import Image from 'next/image'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import { Image as ImageIcon, Plus } from 'lucide-react'
import type { Slide } from './types'

interface SlidePreviewProps {
  currentSlide: Slide | undefined
  currentSlideIndex: number
  slides: Slide[]
  onDragEnd: (result: DropResult) => void
  onSlideSelect: (index: number) => void
  onAddSlide: () => void
}

export function SlidePreview({
  currentSlide,
  currentSlideIndex,
  slides,
  onDragEnd,
  onSlideSelect,
  onAddSlide,
}: SlidePreviewProps) {
  return (
    <div className="space-y-4">
      <Card className="glass border-2 border-white/60 dark:border-white/20 overflow-hidden hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-none transition-all duration-500 rounded-3xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Pratinjau</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative aspect-[4/5] rounded-lg overflow-hidden bg-slate-900 border border-slate-800 shadow-inner">
            {currentSlide?.imageUrl ? (
              currentSlide.imageUrl.startsWith('#') || currentSlide.imageUrl.startsWith('rgb') ? (
                <div className="absolute inset-0 w-full h-full" style={{ backgroundColor: currentSlide.imageUrl }} />
              ) : (
                <Image src={currentSlide.imageUrl} alt={`Slide ${currentSlideIndex + 1}`} fill sizes="400px" className="object-cover" unoptimized />
              )
            ) : (
              <div className="absolute inset-0 w-full h-full flex flex-col items-center justify-center p-6 text-slate-500">
                <ImageIcon className="h-16 w-16 mb-4 opacity-20" />
                <p className="opacity-50 text-sm">Gambar Tidak Tersedia</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="glass border-2 border-white/60 dark:border-white/20 overflow-hidden hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-none transition-all duration-500 rounded-3xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            Semua Slide
            <span className="text-xs font-normal text-slate-500">(Drag untuk urutkan)</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="slides" direction="horizontal">
              {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef} className="grid grid-cols-5 gap-2">
                  {slides.map((slide, index) => (
                    <Draggable key={slide.id} draggableId={slide.id} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className={`relative aspect-[4/5] rounded-lg overflow-hidden cursor-grab border-2 transition-all ${
                            index === currentSlideIndex ? 'border-pink-500' : snapshot.isDragging ? 'border-blue-500 shadow-lg scale-105 z-10' : 'border-transparent hover:border-slate-400'
                          }`}
                          onClick={() => onSlideSelect(index)}
                        >
                          <div className="absolute top-1 left-1 z-10 opacity-50">
                            <div className="w-4 h-4 bg-black/50 rounded flex items-center justify-center">
                              <span className="text-white text-[8px] font-bold">{index + 1}</span>
                            </div>
                          </div>
                          {slide.imageUrl ? (
                            slide.imageUrl.startsWith('#') || slide.imageUrl.startsWith('rgb') ? (
                              <div className="absolute inset-0 w-full h-full" style={{ backgroundColor: slide.imageUrl }} />
                            ) : (
                              <Image src={slide.imageUrl} alt={`Slide ${index + 1}`} fill sizes="120px" className="object-cover" unoptimized />
                            )
                          ) : (
                            <div className="absolute inset-0 w-full h-full bg-slate-800 flex items-center justify-center text-slate-500">
                              <span className="text-xl font-bold opacity-30">{index + 1}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                  <div
                    className="aspect-[4/5] rounded-lg border-2 border-dashed border-gray-300 hover:border-pink-400 hover:bg-pink-50/50 flex flex-col items-center justify-center cursor-pointer transition-colors text-muted-foreground hover:text-pink-600"
                    onClick={onAddSlide}
                  >
                    <Plus className="h-6 w-6 mb-1" />
                    <span className="text-xs font-medium">Tambah</span>
                  </div>
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </CardContent>
      </Card>
    </div>
  )
}
