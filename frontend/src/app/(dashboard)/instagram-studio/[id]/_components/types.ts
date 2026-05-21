export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'

export interface Project {
  id: string
  title: string
  sourceUrl: string
  sourceContent: string
  globalStyle: string
  fontFamily: string
  totalSlides: number
  status: string
  createdAt: string
  slides: Slide[]
}

export interface Slide {
  id: string
  slideNumber: number
  textContent: string
  visualPrompt: string
  imageUrl: string
  layoutPosition: string
  fontSize: number
  fontColor: string
}
