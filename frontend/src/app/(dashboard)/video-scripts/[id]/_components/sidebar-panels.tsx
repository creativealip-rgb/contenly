'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Download,
  Film,
  Image,
  Loader2,
  Mic,
  Package,
  Upload,
  Volume2,
  Wand2,
} from 'lucide-react'
import type { ProjectFormState } from './types'

type VoiceOption = 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer'

interface SidebarPanelsProps {
  sidebarTab: 'setup' | 'export' | 'tools'
  setSidebarTab: (tab: 'setup' | 'export' | 'tools') => void
  projectForm: ProjectFormState
  setProjectField: (field: keyof ProjectFormState, value: string) => void
  hasScenes: boolean
  // Export
  exportingFormat: string | null
  onExport: (format: 'json' | 'txt' | 'srt' | 'caption') => void
  isExportingZip: boolean
  onExportZip: () => void
  selectedVoice: VoiceOption
  setSelectedVoice: (v: VoiceOption) => void
  isExportingAudio: boolean
  onExportAudio: () => void
  isComposing: boolean
  onComposeVideo: () => void
  // Tools
  isTranscribing: boolean
  onTranscribe: (e: React.ChangeEvent<HTMLInputElement>) => void
  transcription: { text: string; srt: string; vtt: string } | null
  isGeneratingThumbnail: boolean
  onGenerateThumbnail: () => void
  thumbnailUrl: string | null
  isBrollFilling: boolean
  onBrollAutoFill: () => void
  headlineAvailable: boolean
}

export function SidebarPanels({
  sidebarTab,
  setSidebarTab,
  projectForm,
  setProjectField,
  hasScenes,
  exportingFormat,
  onExport,
  isExportingZip,
  onExportZip,
  selectedVoice,
  setSelectedVoice,
  isExportingAudio,
  onExportAudio,
  isComposing,
  onComposeVideo,
  isTranscribing,
  onTranscribe,
  transcription,
  isGeneratingThumbnail,
  onGenerateThumbnail,
  thumbnailUrl,
  isBrollFilling,
  onBrollAutoFill,
  headlineAvailable,
}: SidebarPanelsProps) {
  return (
    <>
      <div className="flex rounded-lg border bg-slate-100 p-1 gap-1">
        {([['setup', 'Setup'], ['export', 'Export'], ['tools', 'AI Tools']] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setSidebarTab(key)}
            className={`flex-1 rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${sidebarTab === key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {sidebarTab === 'setup' && (
        <Card className="glass rounded-3xl border-2 border-white/60 dark:border-white/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Film className="h-5 w-5 text-blue-600" />
              Project Setup
            </CardTitle>
            <CardDescription>Kontrol sumber artikel, judul project, dan target durasi script.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold">Judul Project</label>
              <Input value={projectForm.title} onChange={(e) => setProjectField('title', e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold">Target Durasi</label>
              <select
                value={projectForm.targetDurationSeconds}
                onChange={(e) => setProjectField('targetDurationSeconds', e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="30">30 detik</option>
                <option value="45">45 detik</option>
                <option value="60">60 detik</option>
                <option value="90">90 detik</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold">Konten Sumber</label>
              <Textarea
                value={projectForm.sourceContent}
                onChange={(e) => setProjectField('sourceContent', e.target.value)}
                className="min-h-[360px] resize-y"
                placeholder="Tempel artikel, briefing, atau ringkasan sumber di sini."
              />
            </div>
          </CardContent>
        </Card>
      )}

      {sidebarTab === 'export' && (
        <Card className="glass rounded-3xl border-2 border-white/60 dark:border-white/20">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Download className="h-5 w-5 text-indigo-600" />
              Export
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-4 gap-2">
              {(['json', 'txt', 'srt', 'caption'] as const).map((format) => (
                <Button
                  key={format}
                  variant="outline"
                  size="sm"
                  disabled={!hasScenes || exportingFormat === format}
                  onClick={() => onExport(format)}
                  className="uppercase text-xs px-2"
                >
                  {exportingFormat === format ? <Loader2 className="h-3 w-3 animate-spin" /> : format}
                </Button>
              ))}
            </div>

            <Button
              variant="outline"
              size="sm"
              disabled={!hasScenes || isExportingZip}
              onClick={onExportZip}
              className="w-full"
            >
              {isExportingZip ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : <Package className="mr-2 h-3 w-3" />}
              Export Semua (ZIP)
            </Button>

            <div className="border-t pt-3 space-y-2">
              <label className="text-xs font-semibold text-slate-500">Voice</label>
              <select
                value={selectedVoice}
                onChange={(e) => setSelectedVoice(e.target.value as VoiceOption)}
                className="flex h-8 w-full rounded-md border border-input bg-background px-3 text-xs"
              >
                <option value="nova">Nova (Female, warm)</option>
                <option value="alloy">Alloy (Male, neutral)</option>
                <option value="echo">Echo (Female, soft)</option>
                <option value="onyx">Onyx (Male, deep)</option>
                <option value="fable">Fable (Female, expressive)</option>
                <option value="shimmer">Shimmer (Female, clear)</option>
              </select>
              <Button
                variant="outline"
                size="sm"
                disabled={!hasScenes || isExportingAudio}
                onClick={onExportAudio}
                className="w-full"
              >
                {isExportingAudio ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : <Volume2 className="mr-2 h-3 w-3" />}
                Download Voiceover MP3
              </Button>
            </div>

            <div className="border-t pt-3">
              <Button
                disabled={!hasScenes || isComposing}
                onClick={onComposeVideo}
                className="w-full bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white"
                size="sm"
              >
                {isComposing ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Film className="mr-2 h-4 w-4" />
                )}
                {isComposing ? 'Composing...' : 'Compose Video → MP4'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {sidebarTab === 'tools' && (
        <Card className="glass rounded-3xl border-2 border-white/60 dark:border-white/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wand2 className="h-5 w-5 text-purple-600" />
              AI Tools
            </CardTitle>
            <CardDescription>Transcribe audio, generate thumbnail, dan auto-fill B-Roll.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <label className="text-sm font-semibold">Transcribe Audio → Teks</label>
              <div className="flex gap-2">
                <label className="flex-1 cursor-pointer">
                  <input
                    type="file"
                    accept="audio/*,video/*"
                    className="hidden"
                    onChange={onTranscribe}
                    disabled={isTranscribing}
                  />
                  <div className="flex h-10 w-full items-center justify-center rounded-md border border-dashed border-slate-300 text-sm text-slate-600 hover:border-purple-400 hover:bg-purple-50">
                    {isTranscribing ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Transcribing...</>
                    ) : (
                      <><Upload className="mr-2 h-4 w-4" /> Upload Audio/Video (max 25MB)</>
                    )}
                  </div>
                </label>
              </div>
              {transcription && (
                <div className="space-y-2 rounded-lg border bg-slate-50 p-3">
                  <p className="text-xs font-semibold text-slate-500">Hasil Transcription:</p>
                  <p className="text-sm text-slate-700 line-clamp-4">{transcription.text}</p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setProjectField('sourceContent', transcription.text)
                      }}
                    >
                      <Mic className="mr-1 h-3 w-3" /> Pakai sebagai Source
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        navigator.clipboard.writeText(transcription.srt)
                      }}
                    >
                      Copy SRT
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold">Generate Thumbnail (9:16 Reels)</label>
              <Button
                variant="outline"
                className="w-full"
                disabled={isGeneratingThumbnail || !headlineAvailable}
                onClick={onGenerateThumbnail}
              >
                {isGeneratingThumbnail ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Image className="mr-2 h-4 w-4" />
                )}
                Generate Thumbnail
              </Button>
              {thumbnailUrl && (
                <div className="space-y-2">
                  <div className="relative mx-auto max-w-[200px] overflow-hidden rounded-lg" style={{ aspectRatio: '9/16' }}>
                    <img src={thumbnailUrl} alt="Generated thumbnail" className="h-full w-full object-cover" />
                  </div>
                  <a
                    href={thumbnailUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-center text-xs text-blue-600 hover:underline"
                  >
                    Buka full-size ↗
                  </a>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold">B-Roll Auto-Fill</label>
              <Button
                variant="outline"
                className="w-full"
                disabled={isBrollFilling || !hasScenes}
                onClick={onBrollAutoFill}
              >
                {isBrollFilling ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Film className="mr-2 h-4 w-4" />
                )}
                Auto-Search Footage Semua Scene
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  )
}
