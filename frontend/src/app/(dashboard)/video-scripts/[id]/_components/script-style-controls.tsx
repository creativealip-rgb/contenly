'use client'

export type ScriptTone = 'casual' | 'professional' | 'edgy' | 'educational' | 'comedy'
export type HookStyle = 'question' | 'statistic' | 'bold-claim' | 'story'
export type ScriptLanguage = 'id' | 'en' | 'mix'
export type Audience = 'gen-z' | 'millennial' | 'professional' | 'general'
export type Pacing = 'fast' | 'standard' | 'slow'

export interface ScriptStyleOptions {
  tone: ScriptTone
  hookStyle: HookStyle
  language: ScriptLanguage
  audience: Audience
  pacing: Pacing
}

export const defaultStyleOptions: ScriptStyleOptions = {
  tone: 'casual',
  hookStyle: 'question',
  language: 'id',
  audience: 'gen-z',
  pacing: 'standard',
}

interface ScriptStyleControlsProps {
  value: ScriptStyleOptions
  onChange: (next: ScriptStyleOptions) => void
  compact?: boolean
}

const TONE_OPTIONS: Array<{ value: ScriptTone; label: string; emoji: string }> = [
  { value: 'casual', label: 'Casual', emoji: '😎' },
  { value: 'professional', label: 'Profesional', emoji: '💼' },
  { value: 'edgy', label: 'Edgy', emoji: '🔥' },
  { value: 'educational', label: 'Edukatif', emoji: '🎓' },
  { value: 'comedy', label: 'Komedi', emoji: '😂' },
]

const HOOK_OPTIONS: Array<{ value: HookStyle; label: string }> = [
  { value: 'question', label: 'Pertanyaan' },
  { value: 'statistic', label: 'Statistik' },
  { value: 'bold-claim', label: 'Klaim Berani' },
  { value: 'story', label: 'Cerita' },
]

const PACING_OPTIONS: Array<{ value: Pacing; label: string; hint: string }> = [
  { value: 'fast', label: 'Cepat', hint: '≤5s/scene' },
  { value: 'standard', label: 'Standar', hint: '6-10s/scene' },
  { value: 'slow', label: 'Lambat', hint: 'storytelling' },
]

const AUDIENCE_OPTIONS: Array<{ value: Audience; label: string }> = [
  { value: 'gen-z', label: 'Gen Z' },
  { value: 'millennial', label: 'Millennial' },
  { value: 'professional', label: 'Profesional' },
  { value: 'general', label: 'General' },
]

const LANGUAGE_OPTIONS: Array<{ value: ScriptLanguage; label: string }> = [
  { value: 'id', label: 'Indonesia' },
  { value: 'en', label: 'English' },
  { value: 'mix', label: 'Mix (Bahasa + English)' },
]

export function ScriptStyleControls({ value, onChange }: ScriptStyleControlsProps) {
  const update = <K extends keyof ScriptStyleOptions>(key: K, v: ScriptStyleOptions[K]) =>
    onChange({ ...value, [key]: v })

  return (
    <div className="space-y-4">
      <Section label="Tone">
        <div className="flex flex-wrap gap-1.5">
          {TONE_OPTIONS.map((opt) => (
            <Chip key={opt.value} active={value.tone === opt.value} onClick={() => update('tone', opt.value)}>
              <span>{opt.emoji}</span> {opt.label}
            </Chip>
          ))}
        </div>
      </Section>

      <Section label="Hook Style">
        <div className="flex flex-wrap gap-1.5">
          {HOOK_OPTIONS.map((opt) => (
            <Chip
              key={opt.value}
              active={value.hookStyle === opt.value}
              onClick={() => update('hookStyle', opt.value)}
            >
              {opt.label}
            </Chip>
          ))}
        </div>
      </Section>

      <Section label="Pacing">
        <div className="flex flex-wrap gap-1.5">
          {PACING_OPTIONS.map((opt) => (
            <Chip
              key={opt.value}
              active={value.pacing === opt.value}
              onClick={() => update('pacing', opt.value)}
            >
              {opt.label}
              <span className="ml-1 text-[9px] opacity-60">{opt.hint}</span>
            </Chip>
          ))}
        </div>
      </Section>

      <div className="grid grid-cols-2 gap-3">
        <Section label="Bahasa">
          <select
            value={value.language}
            onChange={(e) => update('language', e.target.value as ScriptLanguage)}
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            {LANGUAGE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </Section>

        <Section label="Target Audiens">
          <select
            value={value.audience}
            onChange={(e) => update('audience', e.target.value as Audience)}
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            {AUDIENCE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </Section>
      </div>
    </div>
  )
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</span>
      {children}
    </div>
  )
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
        active
          ? 'bg-slate-900 text-white shadow-sm'
          : 'border border-slate-200 bg-white text-slate-600 hover:border-slate-300'
      }`}
    >
      {children}
    </button>
  )
}
