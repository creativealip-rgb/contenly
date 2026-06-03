export const ASPECT_RATIOS = [
  { value: '9:16', label: '9:16 (Vertical)', w: 9, h: 16 },
  { value: '9:16-fit', label: '9:16 Fit (Letterbox)', w: 9, h: 16 },
  { value: '1:1', label: '1:1 (Square)', w: 1, h: 1 },
  { value: '16:9', label: '16:9 (Landscape)', w: 16, h: 9 },
  { value: '4:5', label: '4:5 (Instagram)', w: 4, h: 5 },
] as const

export type AspectRatio = (typeof ASPECT_RATIOS)[number]['value']

export interface Segment {
  startTime: number
  endTime: number
  hookTitle: string
  reason: string
  viralScore: number
}

export interface TranscriptWord {
  word: string
  start: number
  end: number
}

export interface SubtitleStyle {
  fontFamily: string
  fontSize: number
  fontColor: string
  bgColor: string
  outlineColor: string
  outlineWidth: number
  shadow: boolean
  position: 'top' | 'center' | 'bottom'
  animation: 'none' | 'word-highlight' | 'karaoke' | 'fade-in'
  highlightColor: string
}

export interface TitleStyle {
  text: string
  fontFamily: string
  fontSize: number
  fontColor: string
  bgColor: string
  position: 'top' | 'center' | 'bottom'
}

export interface ClipExport {
  segmentIndex: number
  outputPath: string
  jobId: string
  aspectRatio?: string
  brollCount?: number
  createdAt: string
}

export type BrollOverlayMode = 'pip' | 'full' | 'side'
export type BrollTransition = 'cut' | 'fade' | 'slide'

export interface BrollItem {
  id: string
  sourceUrl: string
  type: 'image' | 'video'
  thumbnailUrl?: string
  segmentIndex: number
  start: number
  end: number
  mode?: BrollOverlayMode
  transition?: BrollTransition
  pipX?: number
  pipY?: number
  pipScale?: number
  duckSourceAudio?: boolean
  duckLevel?: number
  attribution?: string
}

export interface FootageItem {
  source: 'pexels-photo' | 'pexels-video' | 'google-image'
  id?: string
  thumbnailUrl: string
  previewUrl?: string
  downloadUrl?: string
  title?: string
  width?: number
  height?: number
  duration?: number
  attribution?: { author?: string; authorUrl?: string; sourceUrl?: string }
}

export interface FootageSearchResult {
  query: string
  pexelsPhotos: FootageItem[]
  pexelsVideos: FootageItem[]
  googleImages: FootageItem[]
  errors: { source: string; message: string }[]
}

export interface ProjectMetadata {
  title?: string
  duration?: number
  uploader?: string
  thumbnail?: string
  description?: string
}

export interface ClipProject {
  id: string
  title: string
  sourceUrl: string
  status: string
  duration?: number
  metadata?: ProjectMetadata
  thumbnailPath?: string | null
  waveform?: number[] | null
  brollPlan?: BrollItem[]
  transcript?: string
  words?: Array<{ word: string; start: number; end: number }>
  segments?: Segment[]
  exports?: ClipExport[]
  error?: string
  createdAt: string
  updatedAt?: string
}

export interface ActiveExportJob {
  jobId: string
  projectId: string
  segmentIndex: number
  hookTitle: string
  startedAt: number
}

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api/v1'

export const FONTS = ['Arial', 'Impact', 'Montserrat', 'Poppins', 'Roboto', 'Inter', 'Bebas Neue', 'Anton']

export const SUBTITLE_PRESETS: Array<{ id: string; name: string; style: Partial<SubtitleStyle> }> = [
  {
    id: 'classic-white',
    name: 'Classic White',
    style: { fontFamily: 'Arial', fontSize: 24, fontColor: '#ffffff', outlineColor: '#000000', outlineWidth: 2, shadow: true, position: 'bottom', animation: 'none' },
  },
  {
    id: 'karaoke-yellow',
    name: 'Karaoke Yellow',
    style: { fontFamily: 'Impact', fontSize: 28, fontColor: '#ffffff', outlineColor: '#000000', outlineWidth: 3, shadow: false, position: 'bottom', animation: 'karaoke', highlightColor: '#ffd400' },
  },
  {
    id: 'word-highlight-green',
    name: 'Word Highlight Green',
    style: { fontFamily: 'Montserrat', fontSize: 26, fontColor: '#ffffff', outlineColor: '#000000', outlineWidth: 2, shadow: true, position: 'bottom', animation: 'word-highlight', highlightColor: '#00ff88' },
  },
  {
    id: 'minimal-bottom',
    name: 'Minimal Bottom',
    style: { fontFamily: 'Inter', fontSize: 22, fontColor: '#ffffff', outlineColor: '#000000', outlineWidth: 0, shadow: true, position: 'bottom', animation: 'fade-in' },
  },
  {
    id: 'bold-impact',
    name: 'Bold Impact',
    style: { fontFamily: 'Anton', fontSize: 32, fontColor: '#ffd400', outlineColor: '#000000', outlineWidth: 4, shadow: false, position: 'center', animation: 'word-highlight', highlightColor: '#ff3b3b' },
  },
]

export const TITLE_PRESETS: Array<{ id: string; name: string; style: Partial<TitleStyle> }> = [
  {
    id: 'top-impact',
    name: 'Top Impact',
    style: { fontFamily: 'Impact', fontSize: 40, fontColor: '#ffffff', bgColor: '#000000', position: 'top' },
  },
  {
    id: 'center-bold',
    name: 'Center Bold',
    style: { fontFamily: 'Anton', fontSize: 48, fontColor: '#ffffff', bgColor: '#000000', position: 'center' },
  },
  {
    id: 'top-yellow',
    name: 'Yellow Bar',
    style: { fontFamily: 'Bebas Neue', fontSize: 38, fontColor: '#000000', bgColor: '#ffd400', position: 'top' },
  },
  {
    id: 'bottom-clean',
    name: 'Bottom Clean',
    style: { fontFamily: 'Montserrat', fontSize: 36, fontColor: '#ffffff', bgColor: '#000000cc', position: 'bottom' },
  },
]

export const formatTime = (s?: number) => {
  if (!s && s !== 0) return '-'
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${String(sec).padStart(2, '0')}`
}
