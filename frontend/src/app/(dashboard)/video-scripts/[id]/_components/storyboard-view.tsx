'use client'

import { Eye, Plus } from 'lucide-react'
import type { Scene } from './types'

interface StoryboardViewProps {
  scenes: Scene[]
  onSelectScene: (sceneId: string) => void
  onAddScene: () => void
}

export function StoryboardView({ scenes, onSelectScene, onAddScene }: StoryboardViewProps) {
  return (
    <div className="rounded-3xl border-2 border-white/60 bg-white/70 p-4 backdrop-blur-md dark:border-white/10 dark:bg-slate-900/60">
      <div className="overflow-x-auto">
        <div className="flex items-stretch gap-3 pb-2 min-w-max">
          {scenes.map((scene, idx) => {
            const firstFootage = scene.selectedFootage?.[0]
            const isHook = idx === 0
            const isCta = idx === scenes.length - 1
            const wordCount = (scene.voiceoverText || '').trim().split(/\s+/).filter(Boolean).length
            return (
              <button
                key={scene.id}
                type="button"
                onClick={() => onSelectScene(scene.id)}
                className="group relative flex w-48 flex-shrink-0 flex-col gap-1.5 rounded-xl border-2 border-slate-200 bg-white p-2 text-left transition-all hover:border-blue-400 hover:shadow-lg dark:border-slate-700 dark:bg-slate-800"
              >
                <div className="relative h-24 w-full overflow-hidden rounded-md bg-slate-100">
                  {firstFootage ? (
                    <img
                      src={firstFootage.thumbnailUrl}
                      alt=""
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
                      <Eye className="h-6 w-6 text-slate-300" />
                    </div>
                  )}
                  <span className="absolute left-1.5 top-1.5 rounded bg-black/70 px-1.5 py-0.5 text-[9px] font-bold uppercase text-white">
                    #{scene.sceneNumber}
                  </span>
                  {scene.estimatedDuration ? (
                    <span className="absolute bottom-1.5 right-1.5 rounded bg-black/70 px-1.5 py-0.5 text-[9px] font-bold text-white">
                      {scene.estimatedDuration}s
                    </span>
                  ) : null}
                  {isHook && (
                    <span className="absolute bottom-1.5 left-1.5 rounded bg-pink-500 px-1.5 py-0.5 text-[9px] font-bold text-white">
                      HOOK
                    </span>
                  )}
                  {isCta && (
                    <span className="absolute bottom-1.5 left-1.5 rounded bg-blue-500 px-1.5 py-0.5 text-[9px] font-bold text-white">
                      CTA
                    </span>
                  )}
                </div>
                <p className="line-clamp-3 text-[11px] leading-snug text-slate-700 dark:text-slate-200">
                  {scene.voiceoverText || <span className="text-slate-400 italic">Belum ada voiceover</span>}
                </p>
                <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-wider text-slate-400">
                  <span>{wordCount}w</span>
                  {scene.emoji ? <span>{scene.emoji}</span> : null}
                  {scene.selectedFootage && scene.selectedFootage.length > 0 ? (
                    <span className="text-emerald-600">✓ footage</span>
                  ) : (
                    <span className="text-slate-300">no footage</span>
                  )}
                </div>
              </button>
            )
          })}

          <button
            type="button"
            onClick={onAddScene}
            className="flex w-48 flex-shrink-0 flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50/40 p-2 text-slate-400 transition-all hover:border-blue-400 hover:bg-blue-50 hover:text-blue-600"
          >
            <Plus className="h-6 w-6" />
            <span className="text-xs font-bold uppercase tracking-wider">Tambah Scene</span>
          </button>
        </div>
      </div>
    </div>
  )
}
