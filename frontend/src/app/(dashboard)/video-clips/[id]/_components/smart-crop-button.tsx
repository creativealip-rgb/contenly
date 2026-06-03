'use client'

import { useCallback, useState } from 'react'
import { Loader2, ScanFace } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'

interface SmartCropButtonProps {
  videoElement: HTMLVideoElement | null
  segmentStart: number
  segmentEnd: number
  onSuggest: (cropOffsetX: number) => void
}

// Detect FaceDetector availability (Chrome/Edge native API)
const hasFaceDetector = typeof window !== 'undefined' && 'FaceDetector' in window

export function SmartCropButton({ videoElement, segmentStart, segmentEnd, onSuggest }: SmartCropButtonProps) {
  const [running, setRunning] = useState(false)

  const detect = useCallback(async () => {
    if (!videoElement) return
    if (!hasFaceDetector) {
      toast.error('Browser ini tidak support FaceDetector API. Pakai Chrome/Edge terbaru.')
      return
    }
    setRunning(true)
    try {
      // @ts-expect-error - FaceDetector is not in TS lib yet
      const detector = new window.FaceDetector({ fastMode: true, maxDetectedFaces: 5 })
      const sampleCount = 8
      const duration = segmentEnd - segmentStart
      const step = duration / sampleCount
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('Canvas context unavailable')

      const wasPaused = videoElement.paused
      videoElement.pause()
      const xPositions: number[] = []
      const sourceWidth = videoElement.videoWidth
      const sourceHeight = videoElement.videoHeight
      if (sourceWidth === 0 || sourceHeight === 0) {
        throw new Error('Video belum siap. Tunggu beberapa detik lalu coba lagi.')
      }
      canvas.width = sourceWidth
      canvas.height = sourceHeight

      for (let i = 0; i < sampleCount; i++) {
        const t = segmentStart + i * step
        videoElement.currentTime = t
        // Wait for seek to complete
        await new Promise<void>((resolve) => {
          const handler = () => { videoElement.removeEventListener('seeked', handler); resolve() }
          videoElement.addEventListener('seeked', handler)
          // Safety timeout
          setTimeout(() => { videoElement.removeEventListener('seeked', handler); resolve() }, 1500)
        })
        ctx.drawImage(videoElement, 0, 0, sourceWidth, sourceHeight)
        try {
          const faces = await detector.detect(canvas)
          if (faces && faces.length > 0) {
            // Use the largest face for stability
            const main = faces.reduce(
              (a: { boundingBox: DOMRectReadOnly }, b: { boundingBox: DOMRectReadOnly }) =>
                a.boundingBox.width * a.boundingBox.height > b.boundingBox.width * b.boundingBox.height ? a : b,
            )
            const centerX = main.boundingBox.x + main.boundingBox.width / 2
            // Normalize to -1..1 where 0 = horizontal center
            const offset = (centerX - sourceWidth / 2) / (sourceWidth / 2)
            xPositions.push(Math.max(-1, Math.min(1, offset)))
          }
        } catch {
          // ignore individual failures
        }
      }

      if (!wasPaused) videoElement.play().catch(() => {})

      if (xPositions.length === 0) {
        toast.info('Tidak terdeteksi wajah pada segmen ini. Tetap pakai center crop.')
        onSuggest(0)
        return
      }

      const avg = xPositions.reduce((a, b) => a + b, 0) / xPositions.length
      // Soften the value a bit to avoid extreme crops
      const suggested = Math.max(-0.8, Math.min(0.8, avg * 0.7))
      onSuggest(suggested)
      toast.success(
        `Smart crop: deteksi wajah di ${suggested >= 0 ? 'kanan' : 'kiri'} (${suggested.toFixed(2)}) dari ${xPositions.length} sample`,
      )
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal deteksi wajah')
    } finally {
      setRunning(false)
    }
  }, [videoElement, segmentStart, segmentEnd, onSuggest])

  if (!hasFaceDetector) return null

  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      onClick={detect}
      disabled={running || !videoElement}
      className="h-8 text-xs gap-1"
      title="Auto-detect face position untuk crop"
    >
      {running ? <Loader2 className="h-3 w-3 animate-spin" /> : <ScanFace className="h-3 w-3" />}
      Smart Crop
    </Button>
  )
}
