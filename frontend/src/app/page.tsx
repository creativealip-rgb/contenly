import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Footer } from '@/components/layout'
import { Check, Zap, Rss, ArrowRight } from 'lucide-react'
import { MobileMenuToggle } from '@/components/landing/mobile-menu'
import { FaqAccordion } from '@/components/landing/faq-accordion'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Contenly - Platform Otomasi Konten AI',
  description: 'Ubah sumber mana pun menjadi artikel SEO, naskah Reels, hingga carousel Instagram — semuanya otomatis.',
}

const features = [
  {
    title: 'Content Lab Utama',
    description: 'Transformasi URL atau RSS ke artikel SEO-optimized dalam hitungan detik. Kloning fakta, tulis ulang dengan gaya bahasa baru yang segar.',
    color: 'from-blue-600 to-cyan-500',
  },
  {
    title: 'Instagram Studio',
    description: 'Jangan cuma bikin teks. Ubah berita menjadi desain Carousel/Microblog lengkap dengan kustomisasi visual siap unduh.',
    color: 'from-pink-500 to-orange-400',
  },
  {
    title: 'Auto-Publish WordPress',
    description: 'Langsung kirim draft artikel ke puluhan web Anda dengan satu klik. Kategori tersetting otomatis.',
    color: 'from-blue-500 to-indigo-500',
  },
  {
    title: 'Video Script Studio',
    description: 'Generasi naskah Reels/TikTok super cepat lengkap dengan visual prompt untuk adegan (B-Roll) yang tepat sasaran.',
    color: 'from-purple-500 to-indigo-400',
  },
  {
    title: 'Trend Radar & RSS',
    description: 'Pantau apa yang sedang viral di seluruh dunia. Auto-draft artikel begitu berita baru masuk ke radar Anda.',
    color: 'from-emerald-400 to-teal-500',
  },
  {
    title: 'Paket Fleksibel',
    description: 'Pilih paket sesuai kebutuhan. Mulai gratis, upgrade kapan saja tanpa kontrak.',
    color: 'from-amber-400 to-orange-500',
  },
]

const testimonials = [
  {
    name: 'Sarah J.',
    role: 'Pimred Media Berita',
    content: 'Tim kami nggak perlu lagi nulis berita dari nol. Semua berita trending luar di-rewrite dalam Bahasa Indonesia dengan sempurna. Menghemat berjam-jam kerja kami.',
    image: '16',
    metric: '40+ artikel/bulan',
  },
  {
    name: 'Budi Kurniawan',
    role: 'Agensi SEO',
    content: 'Auto-publish ke WordPress sangat mengubah hidup. Saya mengelola 15 blog PBN dan semuanya terisi penuh dengan artikel SEO berkualitas otomatis setiap harinya.',
    image: '17',
    metric: '15 blog terkelola',
  },
  {
    name: 'Dina Afriliani',
    role: 'Tiktok Creator',
    content: 'Biasa pusing bikin naskah Reels, sekarang tinggal masukin link berita yang lagi viral dan skripnya langsung jadi plus ide gambarnya.',
    image: '18',
    metric: '3x lipat engagement',
  },
]

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Contenly',
  url: 'https://contenly.app',
  description: 'Platform otomasi konten berbasis AI. Ubah URL menjadi artikel SEO, naskah video, dan carousel Instagram.',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  offers: {
    '@type': 'AggregateOffer',
    lowPrice: '0',
    highPrice: '999000',
    priceCurrency: 'IDR',
    offerCount: 4,
  },
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '4.8',
    ratingCount: '500',
    bestRating: '5',
  },
}

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'Bagaimana sistem token bekerja?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Setiap operasi AI menggunakan token. Artikel menggunakan 17 token, gambar AI menggunakan 85 token. Token tidak hangus dan bisa digunakan kapan saja.',
      },
    },
    {
      '@type': 'Question',
      name: 'Apakah ada batasan bulanan?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Ya, setiap paket memiliki batasan bulanan. Free: 5 artikel/bulan, Starter: 40 artikel/bulan, Pro: 150 artikel/bulan, Business: 400 artikel/bulan.',
      },
    },
    {
      '@type': 'Question',
      name: 'Bisakah upgrade atau downgrade paket?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Tentu! Anda bisa upgrade kapan saja. Token dari paket lama akan tetap tersisa. Downgrade akan berlaku di periode berikutnya.',
      },
    },
    {
      '@type': 'Question',
      name: 'Apakah konten yang dihasilkan unik?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Ya, semua konten dihasilkan oleh AI dan 100% unik. Anda juga bisa mengatur gaya penulisan sesuai brand Anda.',
      },
    },
    {
      '@type': 'Question',
      name: 'Bagaimana dengan auto-publish ke WordPress?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Anda bisa menghubungkan hingga 10 situs WordPress (tergantung paket). Artikel akan langsung terpublish sebagai draft yang bisa Anda review sebelum publish.',
      },
    },
    {
      '@type': 'Question',
      name: 'Apakah ada garansi uang kembali?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Kami menawarkan garansi 7 hari uang kembali untuk paket Starter dan Pro. Jika tidak puas, hubungi kami untuk refund penuh.',
      },
    },
  ],
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background overflow-hidden relative">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      {/* Navbar */}
      <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/40">
        <div className="max-w-7xl mx-auto flex h-16 items-center px-4 md:px-6">
          <div className="flex-1">
            <Link href="/" className="flex items-center gap-3">
              <Image src="/logo-full.png" alt="Contenly Logo" width={140} height={40} className="object-contain h-9 w-auto" priority />
            </Link>
          </div>

          <nav className="hidden md:flex absolute left-1/2 -translate-x-1/2 items-center gap-10">
            <Link href="#features" className="text-sm font-semibold text-muted-foreground hover:text-brand-primary transition-all">Fitur Utama</Link>
            <Link href="#pricing" className="text-sm font-semibold text-muted-foreground hover:text-brand-primary transition-all">Harga</Link>
            <Link href="#testimonials" className="text-sm font-semibold text-muted-foreground hover:text-brand-primary transition-all">Kisah Sukses</Link>
            <Link href="#faq" className="text-sm font-semibold text-muted-foreground hover:text-brand-primary transition-all">FAQ</Link>
          </nav>

          <div className="hidden md:flex flex-1 justify-end items-center gap-4">
            <Link href="/login" className="text-sm font-semibold text-foreground hover:text-brand-primary transition-all">Sign In</Link>
            <Link href="/register">
              <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl shadow-lg shadow-blue-500/30 transition-all hover:-translate-y-0.5">
                Coba Gratis Sekarang
              </Button>
            </Link>
          </div>

          <MobileMenuToggle />
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-24 pb-14 sm:pt-32 sm:pb-20 md:pt-48 md:pb-32 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
          <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-blue-600/10 blur-[120px] mix-blend-screen opacity-70 animate-blob"></div>
          <div className="absolute top-[30%] -right-[10%] w-[40%] h-[50%] rounded-full bg-indigo-600/10 blur-[120px] mix-blend-screen opacity-70 animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-[20%] left-[20%] w-[60%] h-[40%] rounded-full bg-cyan-500/10 blur-[120px] mix-blend-screen opacity-70 animate-blob animation-delay-4000"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 md:px-6 z-10 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-blue-200/50 dark:border-blue-800/50 mb-8 animate-in slide-in-from-bottom-5 fade-in duration-700">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
            <span className="text-sm font-semibold text-blue-900 dark:text-blue-100">Lebih santai, konten selesai lebih cepat</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter mb-6 sm:mb-8 animate-in slide-in-from-bottom-5 fade-in duration-700 delay-100 leading-[1.1]">
            Mesin Otomatisasi<br />
            <span className="bg-gradient-to-r from-blue-600 via-indigo-500 to-cyan-500 bg-clip-text text-transparent">Konten Tanpa Repot.</span>
          </h1>

          <p className="text-lg sm:text-xl md:text-2xl text-muted-foreground/90 max-w-3xl mx-auto mb-8 sm:mb-12 animate-in slide-in-from-bottom-5 fade-in duration-700 delay-200 leading-relaxed font-medium">
            Berhenti membuang waktu 4 jam sehari hanya demi riset dan menulis. Ubah sumber mana pun menjadi artikel SEO, naskah Reels, hingga carousel Instagram—semuanya otomatis.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-in slide-in-from-bottom-5 fade-in duration-700 delay-300">
            <Link href="/register">
              <Button className="w-full sm:w-auto text-lg h-14 px-10 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-xl shadow-blue-500/25 transition-all hover:-translate-y-1 group">
                Mulai Otomatisasi Sekarang
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <p className="text-sm text-muted-foreground sm:ml-4 font-medium flex items-center gap-2">
              <Check className="w-5 h-5 text-green-500" />
              Daftar sekarang, dapatkan saldo gratis
            </p>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-8 sm:py-10 border-y border-border/40 bg-muted/20">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <p className="text-3xl font-bold text-primary">10x</p>
              <p className="text-sm text-muted-foreground mt-1">Lebih Cepat Produksi</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-primary">18+</p>
              <p className="text-sm text-muted-foreground mt-1">Fitur AI Terintegrasi</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-primary">5+</p>
              <p className="text-sm text-muted-foreground mt-1">Format Output</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-primary">1-Click</p>
              <p className="text-sm text-muted-foreground mt-1">Publish ke WordPress</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 sm:py-24 relative bg-white dark:bg-gray-950">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="text-center mb-10 sm:mb-20">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-6">Pabrik Konten Pribadi Anda</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Contenly dirancang untuk menyelesaikan masalah penulisan repetitif dari Hulu ke Hilir. Riset, Generasi, hingga Publikasi.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => (
              <Card key={index} className="group overflow-hidden border-2 border-slate-100 dark:border-slate-800/50 hover:border-blue-500/30 dark:hover:border-blue-500/30 shadow-lg shadow-slate-200/40 dark:shadow-none hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-500 bg-white dark:bg-slate-900/50 rounded-3xl">
                <CardContent className="p-5 sm:p-8">
                  <div className={`w-10 h-10 sm:w-14 sm:h-14 rounded-2xl mb-4 sm:mb-8 flex items-center justify-center bg-gradient-to-br ${feature.color} text-white shadow-lg`}>
                    <Zap className="w-7 h-7" />
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed font-medium">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing / Token Section */}
      <section id="pricing" className="py-16 sm:py-24 relative bg-slate-50 dark:bg-slate-900/40 border-y border-border/40">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="text-center mb-10 sm:mb-16">
            <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 mb-6">
              <Zap className="w-8 h-8" />
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-6">Paket Bulanan Hemat</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Pilih paket sesuai kebutuhan Anda. Semua fitur AI termasuk, tanpa biaya tersembunyi.
            </p>
          </div>

          {/* Feature highlights — responsive grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-12 max-w-5xl mx-auto">
            {[
              { title: 'Generasi Artikel Penuh', desc: 'Artikel 1000+ kata dari URL, siap publish ke WordPress.', icon: 'M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z' },
              { title: 'Generasi Gambar DALL-E 3', desc: 'Gambar unik bebas hak cipta untuk konten Anda.', icon: 'M21 15l-3.086-3.086a2 2 0 0 0-2.828 0L6 21' },
              { title: 'Analisis & Optimasi SEO', desc: 'Optimasi SEO otomatis untuk ranking lebih baik.', icon: 'M12 20h9' },
              { title: 'Artikel SEO Otomatis', desc: 'Dari URL/RSS jadi artikel 1000+ kata, siap publish.', icon: 'M14.5 2H6a2 2 0 0 0-2 2v16' },
              { title: 'Carousel Instagram AI', desc: 'Auto-desain carousel dari konten artikel Anda.', icon: 'M21 15l-3.086-3.086' },
              { title: 'Script Video Reels/TikTok', desc: 'Naskah video + visual prompt untuk B-Roll.', icon: 'M23 7l-7 5 7 5V7z' },
              { title: 'Auto-Publish WordPress', desc: 'Kirim artikel langsung ke website Anda.', icon: 'M22 11.08V12a10 10 0 1 1-5.93-9.14' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-xl shadow-sm border border-border/50">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 12 2 2 4-4"/><circle cx="12" cy="12" r="10"/></svg>
                </div>
                <div>
                  <p className="font-bold text-sm sm:text-base">{item.title}</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Pricing cards — centered, single column on mobile */}
          <div className="max-w-md mx-auto space-y-4">
              {/* Starter */}
              <Card className="relative overflow-hidden border-2 border-slate-200 dark:border-slate-700 bg-gradient-to-b from-white to-slate-50 dark:from-slate-900 dark:to-slate-800 rounded-2xl">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-xl font-bold">Starter</CardTitle>
                      <CardDescription className="text-sm mt-1">Untuk kreator individu</CardDescription>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl sm:text-3xl font-bold">Rp 99K</div>
                      <div className="text-sm text-muted-foreground">/bulan</div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pb-4">
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-xl">
                      <div className="text-2xl font-bold text-blue-600">50</div>
                      <div className="text-xs text-muted-foreground">Artikel</div>
                    </div>
                    <div className="bg-pink-50 dark:bg-pink-900/20 p-3 rounded-xl">
                      <div className="text-2xl font-bold text-pink-600">10</div>
                      <div className="text-xs text-muted-foreground">Gambar AI</div>
                    </div>
                    <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-xl">
                      <div className="text-2xl font-bold text-purple-600">20</div>
                      <div className="text-xs text-muted-foreground">Video Script</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Pro */}
              <Card className="relative overflow-hidden border-2 border-blue-500 shadow-2xl shadow-blue-500/20 bg-gradient-to-b from-white to-blue-50 dark:from-slate-900 dark:to-slate-800 rounded-2xl">
                <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-blue-500 to-cyan-500" />
                <div className="absolute top-4 right-4">
                  <span className="bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 text-xs font-bold uppercase tracking-wider py-1 px-3 rounded-full">Populer</span>
                </div>
                <CardHeader className="pb-4 pt-8">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-xl font-bold">Pro</CardTitle>
                      <CardDescription className="text-sm mt-1">Untuk agensi & tim kecil</CardDescription>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl sm:text-3xl font-bold">Rp 399K</div>
                      <div className="text-sm text-muted-foreground">/bulan</div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pb-4">
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-xl">
                      <div className="text-2xl font-bold text-blue-600">200</div>
                      <div className="text-xs text-muted-foreground">Artikel</div>
                    </div>
                    <div className="bg-pink-50 dark:bg-pink-900/20 p-3 rounded-xl">
                      <div className="text-2xl font-bold text-pink-600">50</div>
                      <div className="text-xs text-muted-foreground">Gambar AI</div>
                    </div>
                    <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-xl">
                      <div className="text-2xl font-bold text-purple-600">50</div>
                      <div className="text-xs text-muted-foreground">Video Script</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Business */}
              <Card className="relative overflow-hidden border-2 border-slate-200 dark:border-slate-700 bg-gradient-to-b from-white to-slate-50 dark:from-slate-900 dark:to-slate-800 rounded-2xl">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-xl font-bold">Business</CardTitle>
                      <CardDescription className="text-sm mt-1">Untuk publisher & agensi besar</CardDescription>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl sm:text-3xl font-bold">Rp 999K</div>
                      <div className="text-sm text-muted-foreground">/bulan</div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pb-4">
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-xl">
                      <div className="text-2xl font-bold text-blue-600">500</div>
                      <div className="text-xs text-muted-foreground">Artikel</div>
                    </div>
                    <div className="bg-pink-50 dark:bg-pink-900/20 p-3 rounded-xl">
                      <div className="text-2xl font-bold text-pink-600">200</div>
                      <div className="text-xs text-muted-foreground">Gambar AI</div>
                    </div>
                    <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-xl">
                      <div className="text-2xl font-bold text-purple-600">150</div>
                      <div className="text-xs text-muted-foreground">Video Script</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* CTA */}
              <div className="text-center pt-4">
                <Link href="/register">
                  <Button className="w-full h-14 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200 text-lg font-bold">
                    Mulai Gratis - 5 Artikel/bulan
                  </Button>
                </Link>
                <p className="text-sm text-muted-foreground mt-3">Tanpa kartu kredit. Upgrade kapan saja.</p>
              </div>
            </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-16 sm:py-24 relative bg-white dark:bg-gray-950">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="text-center mb-10 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6 tracking-tight">Dicintai oleh Kreator dan Agensi</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">Berhenti kerja berlebihan. Biarkan mesin yang menulis untuk Anda.</p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="group border border-slate-200/80 dark:border-slate-800/60 hover:border-blue-300 dark:hover:border-blue-700/50 shadow-lg shadow-slate-100/50 dark:shadow-none hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-500 bg-white dark:bg-slate-900/50 rounded-2xl overflow-hidden">
                <CardContent className="p-7 flex flex-col h-full">
                  {/* Quote icon */}
                  <span className="text-5xl font-serif text-blue-500/15 dark:text-blue-400/10 leading-none mb-3 select-none">“</span>
                  <p className="text-foreground/90 text-[15px] mb-7 leading-relaxed flex-1">&ldquo;{testimonial.content}&rdquo;</p>
                  <div className="flex items-center justify-between pt-5 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                      <Image src={`https://api.dicebear.com/7.x/notionists/svg?seed=${testimonial.image}`} alt={testimonial.name} width={40} height={40} className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800" unoptimized />
                      <div>
                        <p className="font-semibold text-sm text-slate-900 dark:text-white">{testimonial.name}</p>
                        <p className="text-xs text-muted-foreground">{testimonial.role}</p>
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2.5 py-1 rounded-full">{testimonial.metric}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-16 sm:py-24 relative bg-slate-50 dark:bg-slate-900/50">
        <div className="max-w-4xl mx-auto px-4 md:px-6">
          <div className="text-center mb-10 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-6 tracking-tight">Pertanyaan yang Sering Diajukan</h2>
            <p className="text-lg sm:text-xl text-muted-foreground">Jawaban untuk pertanyaan umum tentang Contenly.</p>
          </div>

          <FaqAccordion faqs={[
            {
              question: "Bagaimana sistem token bekerja?",
              answer: "Setiap operasi AI menggunakan token. Artikel menggunakan 17 token, gambar AI menggunakan 85 token. Token tidak hangus dan bisa digunakan kapan saja."
            },
            {
              question: "Apakah ada batasan bulanan?",
              answer: "Ya, setiap paket memiliki batasan bulanan untuk mencegah penyalahgunaan. Free: 5 artikel/bulan, Starter: 40 artikel/bulan, Pro: 150 artikel/bulan, Business: 400 artikel/bulan."
            },
            {
              question: "Bisakah upgrade atau downgrade paket?",
              answer: "Tentu! Anda bisa upgrade kapan saja. Token dari paket lama akan tetap tersisa. Downgrade akan berlaku di periode berikutnya."
            },
            {
              question: "Apakah konten yang dihasilkan unik?",
              answer: "Ya, semua konten dihasilkan oleh AI dan 100% unik. Anda juga bisa mengatur gaya penulisan sesuai brand Anda."
            },
            {
              question: "Bagaimana dengan auto-publish ke WordPress?",
              answer: "Anda bisa menghubungkan hingga 10 situs WordPress (tergantung paket). Artikel akan langsung terpublish sebagai draft yang bisa Anda review sebelum publish."
            },
            {
              question: "Apakah ada garansi uang kembali?",
              answer: "Kami menawarkan garansi 7 hari uang kembali untuk paket Starter dan Pro. Jika tidak puas, hubungi kami untuk refund penuh."
            }
          ]} />
        </div>
      </section>

      {/* Social Proof Stats */}
      <section className="py-16 bg-white dark:bg-gray-950 border-y border-slate-100 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl sm:text-5xl font-bold text-blue-600 mb-2">500+</div>
              <div className="text-sm text-muted-foreground">Pengguna Aktif</div>
            </div>
            <div>
              <div className="text-4xl sm:text-5xl font-bold text-emerald-600 mb-2">50K+</div>
              <div className="text-sm text-muted-foreground">Artikel Dibuat</div>
            </div>
            <div>
              <div className="text-4xl sm:text-5xl font-bold text-purple-600 mb-2">98%</div>
              <div className="text-sm text-muted-foreground">Tingkat Kepuasan</div>
            </div>
            <div>
              <div className="text-4xl sm:text-5xl font-bold text-amber-600 mb-2">4 jam</div>
              <div className="text-sm text-muted-foreground">Hemat Per Hari</div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 sm:py-24 relative overflow-hidden bg-blue-900 text-white border-b-8 border-cyan-400">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 opacity-90"></div>
        <div className="absolute top-0 left-1/2 w-full h-[300px] bg-gradient-to-b from-blue-400/30 to-transparent -translate-x-1/2 rounded-full blur-3xl mix-blend-screen opacity-50"></div>

        <div className="relative max-w-4xl mx-auto px-4 md:px-6 text-center z-10">
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black mb-8 leading-tight">
            Saatnya Anda Beralih ke<br />Mode Penulisan <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-blue-300">Auto-Pilot</span>.
          </h2>
          <p className="text-lg sm:text-xl text-blue-100/90 mb-8 sm:mb-12 max-w-2xl mx-auto font-medium">
            Gabung bersama ratusan pembuat konten lainnya yang hemat kerja hingga 4 jam sehari. Paket mulai Rp 99rb/bulan, tanpa kontrak.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/register">
              <Button className="w-full sm:w-auto h-14 px-10 rounded-2xl bg-white text-blue-900 hover:bg-slate-100 text-lg font-bold shadow-2xl shadow-black/20 transition-all hover:-translate-y-1">
                Mulai Buat Akun Gratis
              </Button>
            </Link>
            <a href="https://wa.me/62895322348554" target="_blank" rel="noopener noreferrer">
              <Button variant="outline" className="w-full sm:w-auto h-14 px-10 rounded-2xl border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white text-lg font-bold shadow-xl">
                Tanya via WhatsApp
              </Button>
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
