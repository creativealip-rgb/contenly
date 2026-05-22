'use client'

import { Clock, FileText, Film, Mic, Image as ImageIcon } from 'lucide-react'
import type { Scene } from './types'

interface ScriptStatsBarProps {
  scenes: Scene[]
  targetDurationSeconds: number
}

const formatDuration = (seconds: number) => {
  if (!seconds || seconds <= 0) return '0:00'
  const m = Math.floor(seconds / 60)
  const s = Math.round(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

// Heuristic: 160 wpm → ~2.67 words per second when no estimatedDuration set
const estimateSceneSeconds = (scene: Scene) => {
  if (scene.estimatedDuration && scene.estimatedDuration > 0) return scene.estimatedDuration
  const words = (scene.voiceoverText || '').trim().split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.round((words / 160) * 60))
}

export function ScriptStatsBar({ scenes, targetDurationSeconds }: ScriptStatsBarProps) {
  if (!scenes.length) return null

  const totalSeconds = scenes.reduce((acc, s) => acc + estimateSceneSeconds(s), 0)
  const totalWords = scenes.reduce(
    (acc, s) => acc + (s.voiceoverText || '').trim().split(/\s+/).filter(Boolean).length,
    0,
  )
  const scenesWithFootage = scenes.filter((s) => s.selectedFootage && s.selectedFootage.length > 0).length

  const target = targetDurationSeconds || 60
  const percent = Math.min(200, Math.round((totalSeconds / target) * 100))
  const overTarget = totalSeconds > target * 1.1
  const underTarget = totalSeconds < target * 0.7

  let progressColor = 'bg-emerald-500'
  let textColor = 'text-emerald-700'
  let label = 'On target'
  if (overTarget) {
    progressColor = 'bg-red-500'
    textColor = 'text-red-700'
    label = 'Over target'
  } else if (underTarget) {
    progressColor = 'bg-amber-500'
    textColor = 'text-amber-700'
    label = 'Under target'
  }

  return (
    <div className="sticky top-2 z-30 mb-4 rounded-2xl border-2 border-white/60 bg-white/90 backdrop-blur-md px-5 py-3 shadow-lg shadow-slate-200/40 dark:bg-slate-900/80 dark:border-white/10">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
        {/* Duration */}
        <div className="flex items-center gap-2 min-w-[200px]">
          <Clock className={`h-4 w-4 ${textColor}`} />
          <div className="flex flex-col">
            <div className="flex items-baseline gap-1.5">
              <span className={`text-lg font-black tabular-nums ${textColor}`}>
                {formatDuration(totalSeconds)}
              </span>
              <span className="text-xs font-semibold text-slate-400">/ {formatDuration(target)}</span>
              <span className={`text-[10px] font-bold uppercase tracking-wider ${textColor}`}>
                {label}
              </span>
            </div>
            <div className="mt-1 h-1.5 w-40 overflow-hidden rounded-full bg-slate-100">
              <div
                className={`h-full ${progressColor} transition-all duration-500`}
                style={{ width: `${Math.min(100, percent)}%` }}
              />
            </div>
          </div>
        </div>

        <div className="h-8 w-px bg-slate-200" />

        {/* Scenes */}
        <Stat icon={<Film className="h-4 w-4 text-blue-600" />} value={scenes.length} label="Scenes" />

        {/* Words */}
        <Stat icon={<FileText className="h-4 w-4 text-violet-600" />} value={totalWords} label="Words" />

        {/* Footage */}
        <Stat
          icon={<ImageIcon className="h-4 w-4 text-emerald-600" />}
          value={`${scenesWithFootage}/${scenes.length}`}
          label="Footage"
        />

        {/* WPM hint */}
        <Stat
          icon={<Mic className="h-4 w-4 text-pink-600" />}
          value={totalSeconds > 0 ? Math.round((totalWords / totalSeconds) * 60) : 0}
          label="WPM"
        />
      </div>
    </div>
  )
}

function Stat({ icon, value, label }: { icon: React.ReactNode; value: string | number; label: string }) {
  return (
    <div className="flex items-center gap-2">
      {icon}
      <div className="flex flex-col leading-tight">
        <span className="text-base font-black tabular-nums text-slate-900 dark:text-white">{value}</span>
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</span>
      </div>
    </div>
  )
}
