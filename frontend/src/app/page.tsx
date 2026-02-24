'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Footer } from '@/components/layout'
import { Check, Sparkles, Zap, Shield, Wand2, Rss, ArrowRight } from 'lucide-react'

// Premium SVG Icons as components
const IconAI = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7" stroke="currentColor" strokeWidth="1.5">
    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="12" cy="12" r="2" fill="currentColor" />
  </svg>
)

const IconWordPress = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7" stroke="currentColor" strokeWidth="1.5">
    <circle cx="12" cy="12" r="10" />
    <path d="M3 12h18M12 3c-2.5 3-4 6-4 9s1.5 6 4 9c2.5-3 4-6 4-9s-1.5-6-4-9z" strokeLinecap="round" />
    <path d="M8 8l4 8 4-8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const IconInstagram = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7" stroke="currentColor" strokeWidth="1.5">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37a4 4 0 11-4-4 4 4 0 014 4z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
)

const IconVideo = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7" stroke="currentColor" strokeWidth="1.5">
    <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18" />
    <line x1="7" y1="2" x2="7" y2="22" />
    <line x1="17" y1="2" x2="17" y2="22" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <line x1="2" y1="7" x2="7" y2="7" />
    <line x1="2" y1="17" x2="7" y2="17" />
    <line x1="17" y1="17" x2="22" y2="17" />
    <line x1="17" y1="7" x2="22" y2="7" />
  </svg>
)

const features = [
  {
    icon: IconAI,
    title: 'Content Lab Utama',
    description: 'Transformasi URL atau RSS ke artikel SEO-optimized dalam hitungan detik. Kloning fakta, tulis ulang dengan gaya bahasa baru yang segar.',
    color: 'from-blue-600 to-cyan-500',
  },
  {
    icon: IconInstagram,
    title: 'Instagram Studio',
    description: 'Jangan cuma bikin teks. Ubah berita menjadi desain Carousel/Microblog lengkap dengan kustomisasi visual siap unduh.',
    color: 'from-pink-500 to-orange-400',
  },
  {
    icon: IconWordPress,
    title: 'Auto-Publish WordPress',
    description: 'Langsung kirim draft artikel ke puluhan web Anda dengan satu klik. Kategori tersetting otomatis.',
    color: 'from-blue-500 to-indigo-500',
  },
  {
    icon: IconVideo,
    title: 'Video Script Studio',
    description: 'Generasi naskah Reels/TikTok super cepat lengkap dengan visual prompt untuk adegan (B-Roll) yang tepat sasaran.',
    color: 'from-purple-500 to-indigo-400',
  },
  {
    icon: Rss,
    title: 'Trend Radar & RSS',
    description: 'Pantau apa yang sedang viral di seluruh dunia. Auto-draft artikel begitu berita baru masuk ke radar Anda.',
    color: 'from-emerald-400 to-teal-500',
  },
  {
    icon: Zap,
    title: 'Pay-As-You-Go System',
    description: 'Tidak ada biaya langganan bulanan yang mencekik. Beli token sesuai pemakaian aktual AI Anda.',
    color: 'from-amber-400 to-orange-500',
  },
]

const testimonials = [
  {
    name: 'Sarah J.',
    role: 'Pimred Media Berita',
    content: 'Tim kami nggak perlu lagi nulis berita dari nol. Semua berita trending luar di-rewrite dalam Bahasa Indonesia dengan sempurna. Menghemat berjam-jam kerja kami.',
    image: '16',
  },
  {
    name: 'Budi Kurniawan',
    role: 'Agensi SEO',
    content: 'Auto-publish ke WordPress sangat mengubah hidup. Saya mengelola 15 blog PBN dan semuanya terisi penuh dengan artikel SEO berkualitas otomatis setiap harinya.',
    image: '17',
  },
  {
    name: 'Dina Afriliani',
    role: 'Tiktok Creator',
    content: 'Biasa pusing bikin naskah Reels, sekarang tinggal masukin link berita yang lagi viral dan skripnya langsung jadi plus ide gambarnya.',
    image: '18',
  },
]

export default function LandingPage() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false)

  return (
    <div className="min-h-screen bg-background overflow-hidden relative">
      {/* Navbar */}
      <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/40">
        <div className="max-w-7xl mx-auto flex h-16 items-center px-4 md:px-6">
          <div className="flex-1">
            <Link href="/" className="flex items-center gap-3">
              <div className="flex items-center justify-center overflow-hidden">
                <Image src="/logo-full.png" alt="Contently Logo" width={140} height={40} className="object-contain h-9 w-auto" />
              </div>
            </Link>
          </div>

          <nav className="hidden md:flex absolute left-1/2 -translate-x-1/2 items-center gap-10">
            <Link href="#features" className="text-sm font-semibold text-muted-foreground hover:text-brand-primary transition-all">
              Fitur Utama
            </Link>
            <Link href="#pricing" className="text-sm font-semibold text-muted-foreground hover:text-brand-primary transition-all">
              Harga
            </Link>
            <Link href="#testimonials" className="text-sm font-semibold text-muted-foreground hover:text-brand-primary transition-all">
              Kisah Sukses
            </Link>
          </nav>

          <div className="hidden md:flex flex-1 justify-end items-center gap-4">
            <Link href="/login" className="text-sm font-semibold text-foreground hover:text-brand-primary transition-all">
              Sign In
            </Link>
            <Link href="/register">
              <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl shadow-lg shadow-blue-500/30 transition-all hover:-translate-y-0.5">
                Coba Gratis Sekarang
              </Button>
            </Link>
          </div>

          <button className="md:hidden p-2 text-foreground" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            {isMobileMenuOpen ? (
              <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke="currentColor" strokeWidth="2"><path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" /></svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke="currentColor" strokeWidth="2"><path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" strokeLinejoin="round" /></svg>
            )}
          </button>
        </div>

        {isMobileMenuOpen && (
          <div className="absolute top-16 left-0 right-0 bg-background/95 backdrop-blur-xl border-b border-border p-4 md:hidden flex flex-col gap-4 shadow-2xl animate-in slide-in-from-top-5">
            <Link href="#features" className="px-4 py-3 text-sm font-medium hover:bg-accent rounded-lg" onClick={() => setIsMobileMenuOpen(false)}>Fitur Utama</Link>
            <Link href="#pricing" className="px-4 py-3 text-sm font-medium hover:bg-accent rounded-lg" onClick={() => setIsMobileMenuOpen(false)}>Harga</Link>
            <Link href="#testimonials" className="px-4 py-3 text-sm font-medium hover:bg-accent rounded-lg" onClick={() => setIsMobileMenuOpen(false)}>Testimoni</Link>
            <div className="h-px bg-border my-2"></div>
            <Link href="/login" className="px-4 py-3 text-sm font-medium text-center" onClick={() => setIsMobileMenuOpen(false)}>Sign In</Link>
            <Link href="/register" onClick={() => setIsMobileMenuOpen(false)}>
              <Button className="w-full bg-blue-600">Coba Gratis</Button>
            </Link>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden">
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

          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter mb-8 animate-in slide-in-from-bottom-5 fade-in duration-700 delay-100 leading-[1.1]">
            Mesin Otomatisasi<br />
            <span className="bg-gradient-to-r from-blue-600 via-indigo-500 to-cyan-500 bg-clip-text text-transparent">Konten Tanpa Batas.</span>
          </h1>

          <p className="text-xl md:text-2xl text-muted-foreground/90 max-w-3xl mx-auto mb-12 animate-in slide-in-from-bottom-5 fade-in duration-700 delay-200 leading-relaxed font-medium">
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

      {/* Trust Section */}
      <section className="py-10 border-y border-border/40 bg-muted/20">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <p className="text-center text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-6">
            Dipercaya oleh kreator, agensi, dan media modern
          </p>
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
            {/* Dummy logos for social proof */}
            <div className="text-2xl font-black font-sans tracking-tight">KONTENTREACH</div>
            <div className="text-2xl font-bold font-serif italic">The Daily Scroll</div>
            <div className="text-2xl font-black font-mono tracking-tighter">SEO<span className="text-blue-500">NINJA</span></div>
            <div className="text-2xl font-extrabold uppercase tracking-widest text-slate-400">TrendCast</div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 relative bg-white dark:bg-gray-950">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
              Pabrik Konten Pribadi Anda
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Contenly dirancang untuk menyelesaikan masalah penulisan repetitif dari Hulu ke Hilir. Riset, Generasi, hingga Publikasi.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <Card key={index} className="group overflow-hidden border-2 border-slate-100 dark:border-slate-800/50 hover:border-blue-500/30 dark:hover:border-blue-500/30 shadow-lg shadow-slate-200/40 dark:shadow-none hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-500 bg-white dark:bg-slate-900/50 rounded-3xl">
                  <CardContent className="p-8">
                    <div className={`w-14 h-14 rounded-2xl mb-8 flex items-center justify-center bg-gradient-to-br ${feature.color} text-white shadow-lg`}>
                      <Icon />
                    </div>
                    <h3 className="text-xl font-bold mb-3 text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {feature.title}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed font-medium">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* Pricing / Token Section */}
      <section id="pricing" className="py-24 relative bg-slate-50 dark:bg-slate-900/40 border-y border-border/40">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="text-center mb-16">
            <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 mb-6">
              <Zap className="w-8 h-8" />
            </div>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
              Bayar Hanya Sesuai Pemakaian
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Tinggalkan langganan bulanan mahal yang fiturnya tidak Anda pakai penuh. Sistem Token Contenly transparan, fleksibel, dan jauh lebih hemat.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 max-w-5xl mx-auto items-center">
            <div className="space-y-8">
              <h3 className="text-2xl font-bold">Harga per Tindakan AI</h3>
              <ul className="space-y-4">
                <li className="flex items-center gap-4 bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-border/50">
                  <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold shrink-0">~1k</div>
                  <div>
                    <p className="font-bold">Generasi Artikel Penuh</p>
                    <p className="text-sm text-muted-foreground">Menghasilkan artikel ~1.000 kata kualitas tinggi.</p>
                  </div>
                </li>
                <li className="flex items-center gap-4 bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-border/50">
                  <div className="w-10 h-10 rounded-full bg-pink-100 dark:bg-pink-900/50 flex items-center justify-center text-pink-600 dark:text-pink-400 font-bold shrink-0">500</div>
                  <div>
                    <p className="font-bold">Generasi Gambar DALL-E 3</p>
                    <p className="text-sm text-muted-foreground">Gambar ilustrasi unik bebas hak cipta.</p>
                  </div>
                </li>
                <li className="flex items-center gap-4 bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-border/50">
                  <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold shrink-0">200</div>
                  <div>
                    <p className="font-bold">Analisis & Optimasi SEO</p>
                    <p className="text-sm text-muted-foreground">Generasi Meta Title, Description, dan Keyword Tags.</p>
                  </div>
                </li>
              </ul>
            </div>

            <Card className="relative overflow-hidden border-2 border-blue-500 shadow-2xl shadow-blue-500/20 bg-gradient-to-b from-white to-blue-50 dark:from-slate-900 dark:to-slate-800 rounded-[2rem]">
              <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-blue-500 to-cyan-500" />
              <div className="absolute top-4 right-4">
                <span className="bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 text-xs font-bold uppercase tracking-wider py-1 px-3 rounded-full">
                  Populer
                </span>
              </div>
              <CardHeader className="pt-10 text-center">
                <CardTitle className="text-2xl font-bold">Paket Top-up Token</CardTitle>
                <CardDescription className="text-base mt-2">Token tidak punya masa hangus. Top-up lebih banyak, lebih hemat.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 pb-10">
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                    <span className="font-bold text-lg">100.000 Token</span>
                    <span className="font-bold text-xl text-blue-600">Rp 150.000</span>
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-500/25 transform scale-105 border-2 border-white dark:border-slate-800 relative z-10">
                    <span className="font-bold text-lg">500.000 Token</span>
                    <span className="font-bold text-xl">Rp 500.000</span>
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                    <span className="font-bold text-lg">1.500.000 Token</span>
                    <span className="font-bold text-xl text-blue-600">Rp 1.000.000</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="bg-slate-100 dark:bg-slate-900/50 mt-auto p-6 flex flex-col items-center">
                <p className="text-sm font-medium text-slate-500 mb-4 text-center">Dapatkan token bonus untuk pendaftaran pertama.</p>
                <Link href="/register" className="w-full">
                  <Button className="w-full h-14 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200 text-lg font-bold">
                    Daftar & Klaim Saldo
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-24 relative bg-white dark:bg-gray-950">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Dicintai oleh Kreator dan Agensi
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Berhenti kerja berlebihan. Biarkan mesin yang menulis untuk Anda.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="border-none shadow-xl shadow-slate-200/50 dark:shadow-none bg-slate-50/50 dark:bg-slate-900/50 rounded-3xl p-2 relative">
                <CardContent className="p-8">
                  {/* Stars */}
                  <div className="flex gap-1 mb-6">
                    {[...Array(5)].map((_, i) => (
                      <svg key={i} className="w-5 h-5 text-amber-400" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                      </svg>
                    ))}
                  </div>

                  <p className="text-foreground text-lg mb-8 leading-relaxed font-medium">
                    &ldquo;{testimonial.content}&rdquo;
                  </p>

                  <div className="flex items-center gap-4 mt-auto">
                    <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=${testimonial.image}`} alt={testimonial.name} className="w-12 h-12 rounded-full border-2 border-white shadow-sm bg-white" />
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white">{testimonial.name}</p>
                      <p className="text-sm font-medium text-slate-500">{testimonial.role}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 relative overflow-hidden bg-blue-900 text-white border-b-8 border-cyan-400">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 opacity-90"></div>
        <div className="absolute top-0 left-1/2 w-full h-[300px] bg-gradient-to-b from-blue-400/30 to-transparent -translate-x-1/2 rounded-full blur-3xl mix-blend-screen opacity-50"></div>

        <div className="relative max-w-4xl mx-auto px-4 md:px-6 text-center z-10">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-black mb-8 leading-tight">
            Saatnya Anda Beralih ke<br />Mode Penulisan <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-blue-300">Auto-Pilot</span>.
          </h2>
          <p className="text-xl text-blue-100/90 mb-12 max-w-2xl mx-auto font-medium">
            Gabung bersama ratusan pembuat konten lainnya yang hemat kerja hingga 40 jam per minggu. 100% tanpa tekanan bulanan berkat harga per-token yang adil.
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
