import './globals.css'
import type { Metadata, Viewport } from 'next'
import { Plus_Jakarta_Sans } from 'next/font/google'
import { Toaster } from '@/components/ui/sonner'
import { AuthProvider, QueryProvider } from '@/components/providers'
import NextTopLoader from 'nextjs-toploader'
import { ConfirmDialogProvider } from '@/components/ui/confirm-dialog'

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-plus-jakarta',
})

export const viewport: Viewport = {
  themeColor: '#2563eb',
}

export const metadata: Metadata = {
  title: {
    default: 'Contenly - Platform Otomasi Konten AI',
    template: '%s | Contenly',
  },
  description: 'Platform otomasi konten berbasis AI. Ubah URL menjadi artikel SEO, naskah video, dan carousel Instagram — publish otomatis ke WordPress.',
  keywords: 'otomasi konten AI, WordPress automation, SEO, content generation, RSS feeds, carousel Instagram, video script',
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.png',
    apple: '/favicon.png',
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://contenly.app'),
  openGraph: {
    type: 'website',
    locale: 'id_ID',
    siteName: 'Contenly',
    title: 'Contenly - Platform Otomasi Konten AI',
    description: 'Ubah sumber mana pun menjadi artikel SEO, naskah Reels, hingga carousel Instagram — semuanya otomatis.',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'Contenly - Platform Otomasi Konten AI' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Contenly - Platform Otomasi Konten AI',
    description: 'Ubah sumber mana pun menjadi artikel SEO, naskah Reels, hingga carousel Instagram — semuanya otomatis.',
    images: ['/og-image.png'],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Contenly',
  },
}

import { ServiceWorkerRegistration } from '@/components/pwa/sw-register'
import { CookieConsent } from '@/components/cookie-consent'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id" className={plusJakarta.variable} suppressHydrationWarning>
      <body className="font-sans" suppressHydrationWarning>
        <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md">
          Langsung ke konten utama
        </a>
        <QueryProvider>
          <AuthProvider>
            <ConfirmDialogProvider>
              <NextTopLoader color="#2563eb" showSpinner={true} shadow="0 0 10px #2563eb,0 0 5px #2563eb" />
              {children}
            </ConfirmDialogProvider>
          </AuthProvider>
        </QueryProvider>
        <Toaster />
        <CookieConsent />
        <ServiceWorkerRegistration />
      </body>
    </html>
  )
}
