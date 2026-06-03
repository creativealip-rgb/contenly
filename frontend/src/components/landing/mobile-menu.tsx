'use client'

import React from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export function MobileMenuToggle() {
  const [isOpen, setIsOpen] = React.useState(false)

  return (
    <>
      <button className="md:hidden p-2 text-foreground" onClick={() => setIsOpen(!isOpen)} aria-label="Toggle menu">
        {isOpen ? (
          <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke="currentColor" strokeWidth="2"><path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" /></svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke="currentColor" strokeWidth="2"><path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" strokeLinejoin="round" /></svg>
        )}
      </button>

      {isOpen && (
        <div className="absolute top-16 left-0 right-0 bg-background/95 backdrop-blur-xl border-b border-border p-4 md:hidden flex flex-col gap-4 shadow-2xl animate-in slide-in-from-top-5">
          <Link href="#features" className="px-4 py-3 text-sm font-medium hover:bg-accent rounded-lg" onClick={() => setIsOpen(false)}>Fitur Utama</Link>
          <Link href="#pricing" className="px-4 py-3 text-sm font-medium hover:bg-accent rounded-lg" onClick={() => setIsOpen(false)}>Harga</Link>
          <Link href="#testimonials" className="px-4 py-3 text-sm font-medium hover:bg-accent rounded-lg" onClick={() => setIsOpen(false)}>Testimoni</Link>
          <Link href="#faq" className="px-4 py-3 text-sm font-medium hover:bg-accent rounded-lg" onClick={() => setIsOpen(false)}>FAQ</Link>
          <div className="h-px bg-border my-2"></div>
          <Link href="/login" className="px-4 py-3 text-sm font-medium text-center" onClick={() => setIsOpen(false)}>Sign In</Link>
          <Link href="/register" onClick={() => setIsOpen(false)}>
            <Button className="w-full bg-blue-600">Coba Gratis</Button>
          </Link>
        </div>
      )}
    </>
  )
}
