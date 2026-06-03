'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Sparkles, Plug, FileText, Instagram, Video, ArrowRight, Check } from 'lucide-react'
import Link from 'next/link'

const ONBOARDING_KEY = 'contenly_onboarding_completed'

const steps = [
  {
    icon: Plug,
    title: 'Hubungkan WordPress',
    description: 'Integrasikan situs WordPress Anda untuk publish langsung dari dashboard.',
    link: '/integrations',
    linkText: 'Setup Integrasi',
    optional: true,
  },
  {
    icon: FileText,
    title: 'Buat Konten Pertama',
    description: 'Gunakan Content Lab untuk scrape, rewrite, dan publish artikel dengan AI.',
    link: '/content-lab',
    linkText: 'Buka Content Lab',
  },
  {
    icon: Instagram,
    title: 'Buat Carousel Instagram',
    description: 'Ubah artikel menjadi carousel visual siap posting.',
    link: '/instagram-studio',
    linkText: 'Buka Instagram Studio',
  },
  {
    icon: Video,
    title: 'Generate Video Script',
    description: 'Buat script video pendek lengkap dengan voiceover dan footage.',
    link: '/video-scripts',
    linkText: 'Buka Video Scripts',
  },
]

export function OnboardingModal() {
  const [open, setOpen] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)

  useEffect(() => {
    const completed = localStorage.getItem(ONBOARDING_KEY)
    if (!completed) {
      // Small delay so dashboard loads first
      const timer = setTimeout(() => setOpen(true), 1000)
      return () => clearTimeout(timer)
    }
  }, [])

  const handleComplete = () => {
    localStorage.setItem(ONBOARDING_KEY, 'true')
    setOpen(false)
  }

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      handleComplete()
    }
  }

  const step = steps[currentStep]
  const Icon = step.icon

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleComplete() }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-blue-600" />
            Selamat Datang di Contenly!
          </DialogTitle>
          <DialogDescription>
            Langkah {currentStep + 1} dari {steps.length} — Setup cepat untuk memulai.
          </DialogDescription>
        </DialogHeader>

        <div className="py-6 space-y-4">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
              <Icon className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <h3 className="font-semibold text-lg">
                {step.title}
                {step.optional && <span className="ml-2 text-xs text-slate-400">(opsional)</span>}
              </h3>
              <p className="text-sm text-slate-600">{step.description}</p>
            </div>
          </div>

          <Link href={step.link} onClick={handleComplete}>
            <Button variant="outline" className="w-full mt-2">
              {step.linkText} <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex gap-1.5">
            {steps.map((_, i) => (
              <div
                key={i}
                className={`h-2 w-2 rounded-full ${i <= currentStep ? 'bg-blue-600' : 'bg-slate-200'}`}
              />
            ))}
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={handleComplete}>
              Skip
            </Button>
            <Button size="sm" onClick={handleNext}>
              {currentStep < steps.length - 1 ? 'Lanjut' : 'Selesai'}
              {currentStep < steps.length - 1 ? (
                <ArrowRight className="ml-1 h-3 w-3" />
              ) : (
                <Check className="ml-1 h-3 w-3" />
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
