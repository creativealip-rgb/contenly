'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export function CookieConsent() {
  const [show, setShow] = useState(() => {
    if (typeof window === 'undefined') return false
    return !localStorage.getItem('cookie-consent')
  })

  const accept = () => {
    localStorage.setItem('cookie-consent', 'accepted')
    setShow(false)
  }

  if (!show) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm z-50 bg-background border border-border rounded-xl p-4 shadow-lg animate-in slide-in-from-bottom-5">
      <p className="text-sm text-muted-foreground mb-3">
        Kami menggunakan cookies untuk meningkatkan pengalaman Anda.{' '}
        <Link href="/privacy" className="underline text-foreground">Pelajari lebih lanjut</Link>
      </p>
      <div className="flex gap-2">
        <Button size="sm" onClick={accept}>Terima</Button>
        <Button size="sm" variant="ghost" onClick={accept}>Tutup</Button>
      </div>
    </div>
  )
}
