'use client'

import { Sparkles } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { FONTS, SUBTITLE_PRESETS, TITLE_PRESETS, type SubtitleStyle, type TitleStyle } from './types'

interface SubtitleControlsProps {
  value: SubtitleStyle
  onChange: (next: SubtitleStyle) => void
}

export function SubtitleControls({ value, onChange }: SubtitleControlsProps) {
  const update = <K extends keyof SubtitleStyle>(k: K, v: SubtitleStyle[K]) => onChange({ ...value, [k]: v })
  const applyPreset = (id: string) => {
    const preset = SUBTITLE_PRESETS.find((p) => p.id === id)
    if (!preset) return
    onChange({ ...value, ...preset.style })
  }

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-[10px] uppercase tracking-wider text-slate-500">
          <Sparkles className="inline h-3 w-3 mr-1" /> Style Preset
        </Label>
        <div className="mt-1 flex flex-wrap gap-1.5">
          {SUBTITLE_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => applyPreset(preset.id)}
              className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold text-slate-600 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700"
            >
              {preset.name}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Font</Label>
          <Select value={value.fontFamily} onValueChange={(v) => update('fontFamily', v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FONTS.map((f) => (
                <SelectItem key={f} value={f}>
                  {f}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Size ({value.fontSize}px)</Label>
          <Slider value={[value.fontSize]} min={16} max={48} step={2} onValueChange={(v) => update('fontSize', v[0])} />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <Label>Text</Label>
          <Input type="color" value={value.fontColor} onChange={(e) => update('fontColor', e.target.value)} className="h-9 cursor-pointer" />
        </div>
        <div>
          <Label>Outline</Label>
          <Input type="color" value={value.outlineColor} onChange={(e) => update('outlineColor', e.target.value)} className="h-9 cursor-pointer" />
        </div>
        <div>
          <Label>Highlight</Label>
          <Input type="color" value={value.highlightColor} onChange={(e) => update('highlightColor', e.target.value)} className="h-9 cursor-pointer" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Outline Width ({value.outlineWidth}px)</Label>
          <Slider value={[value.outlineWidth]} min={0} max={6} step={1} onValueChange={(v) => update('outlineWidth', v[0])} />
        </div>
        <div className="flex items-end">
          <label className="flex items-center gap-2 mb-1.5 cursor-pointer text-sm">
            <input
              type="checkbox"
              checked={value.shadow}
              onChange={(e) => update('shadow', e.target.checked)}
              className="h-4 w-4 rounded border-slate-300"
            />
            Drop shadow
          </label>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Position</Label>
          <Select value={value.position} onValueChange={(v) => update('position', v as SubtitleStyle['position'])}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="top">Top</SelectItem>
              <SelectItem value="center">Center</SelectItem>
              <SelectItem value="bottom">Bottom</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Animation</Label>
          <Select value={value.animation} onValueChange={(v) => update('animation', v as SubtitleStyle['animation'])}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              <SelectItem value="word-highlight">Word Highlight</SelectItem>
              <SelectItem value="karaoke">Karaoke</SelectItem>
              <SelectItem value="fade-in">Fade In</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  )
}

interface TitleControlsProps {
  value: TitleStyle
  onChange: (next: TitleStyle) => void
}

export function TitleControls({ value, onChange }: TitleControlsProps) {
  const update = <K extends keyof TitleStyle>(k: K, v: TitleStyle[K]) => onChange({ ...value, [k]: v })
  const applyPreset = (id: string) => {
    const preset = TITLE_PRESETS.find((p) => p.id === id)
    if (!preset) return
    onChange({ ...value, ...preset.style })
  }

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-[10px] uppercase tracking-wider text-slate-500">
          <Sparkles className="inline h-3 w-3 mr-1" /> Style Preset
        </Label>
        <div className="mt-1 flex flex-wrap gap-1.5">
          {TITLE_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => applyPreset(preset.id)}
              className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold text-slate-600 hover:border-pink-400 hover:bg-pink-50 hover:text-pink-700"
            >
              {preset.name}
            </button>
          ))}
        </div>
      </div>

      <div>
        <Label>Title Text</Label>
        <Input value={value.text} onChange={(e) => update('text', e.target.value)} placeholder="Hook teks..." />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Font</Label>
          <Select value={value.fontFamily} onValueChange={(v) => update('fontFamily', v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FONTS.map((f) => (
                <SelectItem key={f} value={f}>
                  {f}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Size ({value.fontSize}px)</Label>
          <Slider value={[value.fontSize]} min={20} max={60} step={2} onValueChange={(v) => update('fontSize', v[0])} />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <Label>Text</Label>
          <Input type="color" value={value.fontColor} onChange={(e) => update('fontColor', e.target.value)} className="h-9 cursor-pointer" />
        </div>
        <div>
          <Label>Background</Label>
          <Input type="color" value={value.bgColor.slice(0, 7)} onChange={(e) => update('bgColor', e.target.value)} className="h-9 cursor-pointer" />
        </div>
        <div>
          <Label>Position</Label>
          <Select value={value.position} onValueChange={(v) => update('position', v as TitleStyle['position'])}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="top">Top</SelectItem>
              <SelectItem value="center">Center</SelectItem>
              <SelectItem value="bottom">Bottom</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  )
}
