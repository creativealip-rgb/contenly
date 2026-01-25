'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Footer } from '@/components/layout'

// Premium SVG Icons as components for a unique look
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

const IconImage = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7" stroke="currentColor" strokeWidth="1.5">
    <rect x="3" y="3" width="18" height="18" rx="3" />
    <circle cx="8.5" cy="8.5" r="1.5" />
    <path d="M21 15l-5-5L5 21" />
    <path d="M14 14l-3-3-8 8" strokeLinecap="round" />
  </svg>
)

const IconRSS = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7" stroke="currentColor" strokeWidth="1.5">
    <circle cx="6" cy="18" r="2" fill="currentColor" />
    <path d="M4 4a16 16 0 0116 16M4 10a10 10 0 0110 10" strokeLinecap="round" />
  </svg>
)

const IconSEO = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7" stroke="currentColor" strokeWidth="1.5">
    <path d="M3 3v18h18" strokeLinecap="round" />
    <path d="M18 9l-5 5-4-4-6 6" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="18" cy="9" r="2" fill="currentColor" />
  </svg>
)

const IconTokens = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7" stroke="currentColor" strokeWidth="1.5">
    <circle cx="12" cy="12" r="9" />
    <path d="M12 6v12M9 9l3-3 3 3M9 15l3 3 3-3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const features = [
  {
    icon: IconAI,
    title: 'AI-Powered Rewriting',
    description: 'Transform any URL into unique, SEO-optimized content using GPT-4 and Claude 3.5. Preserve facts, change everything else.',
    color: 'from-indigo-500 to-purple-500',
  },
  {
    icon: IconWordPress,
    title: 'WordPress Integration',
    description: 'One-click publishing directly to your WordPress sites. Map categories, set status, and sync seamlessly.',
    color: 'from-cyan-500 to-blue-500',
  },
  {
    icon: IconImage,
    title: 'AI Image Generation',
    description: 'Generate unique, copyright-free featured images with DALL-E 3. No more hunting for stock photos.',
    color: 'from-purple-500 to-pink-500',
  },
  {
    icon: IconRSS,
    title: 'RSS Auto-Fetching',
    description: 'Add RSS feeds once, get fresh content delivered to your queue automatically. Never miss a trending topic.',
    color: 'from-emerald-500 to-teal-500',
  },
  {
    icon: IconSEO,
    title: 'SEO Optimization',
    description: 'Auto-generate meta titles, descriptions, and slugs. Built-in SEO scoring keeps your content ranking high.',
    color: 'from-orange-500 to-amber-500',
  },
  {
    icon: IconTokens,
    title: 'Flexible Token System',
    description: 'Pay only for what you use. No monthly commitments, no hidden fees. Scale up or down as needed.',
    color: 'from-rose-500 to-red-500',
  },
]

const testimonials = [
  {
    name: 'Sarah Johnson',
    role: 'Content Director',
    company: 'TechBlog Media',
    content: 'We cut our content production time by 85%. What used to take our team a week now takes a day.',
    image: '/testimonial-1.jpg',
  },
  {
    name: 'Michael Chen',
    role: 'Founder',
    company: 'Growth Agency Co.',
    content: 'The WordPress integration is flawless. Our clients are amazed at how fast we deliver quality content.',
    image: '/testimonial-2.jpg',
  },
  {
    name: 'Emily Rodriguez',
    role: 'Freelance Writer',
    company: 'Self-employed',
    content: 'The AI rewriting quality is incredible. It maintains my voice while making the content completely unique.',
    image: '/testimonial-3.jpg',
  },
]

const stats = [
  { value: '85%', label: 'Time Saved' },
  { value: '10K+', label: 'Articles Created' },
  { value: '500+', label: 'Happy Users' },
  { value: '99.9%', label: 'Uptime' },
]

export default function LandingPage() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false)

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Navbar */}
      <header className="fixed top-0 left-0 right-0 z-50 glass">
        <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-4 md:px-6">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl overflow-hidden bg-indigo-50/50 shadow-sm border border-indigo-100">
              <Image src="/logo.png" alt="Contently Logo" width={32} height={32} className="object-contain" />
            </div>
            <span className="font-bold text-xl tracking-tight">
              Contently
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            <Link href="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Features
            </Link>
            <Link href="#testimonials" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Testimonials
            </Link>
            <Link href="#contact" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Contact
            </Link>
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" className="font-medium">Sign In</Button>
            </Link>
            <Link href="/register">
              <Button className="btn-premium text-sm py-2 px-5">
                Get Started
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Toggle */}
          <button className="md:hidden p-2 text-foreground" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            {isMobileMenuOpen ? (
              <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke="currentColor" strokeWidth="2">
                <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke="currentColor" strokeWidth="2">
                <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile Menu Overlay */}
        {isMobileMenuOpen && (
          <div className="absolute top-16 left-0 right-0 bg-background/95 backdrop-blur-xl border-b border-border p-4 md:hidden flex flex-col gap-4 shadow-2xl animate-in slide-in-from-top-5">
            <Link
              href="#features"
              className="px-4 py-3 text-sm font-medium hover:bg-accent rounded-lg transition-colors"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Features
            </Link>
            <Link
              href="#testimonials"
              className="px-4 py-3 text-sm font-medium hover:bg-accent rounded-lg transition-colors"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Testimonials
            </Link>
            <Link
              href="#contact"
              className="px-4 py-3 text-sm font-medium hover:bg-accent rounded-lg transition-colors"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Contact
            </Link>
            <div className="h-px bg-border my-2"></div>
            <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>
              <Button variant="ghost" className="w-full justify-start font-medium h-12">Sign In</Button>
            </Link>
            <Link href="/register" onClick={() => setIsMobileMenuOpen(false)}>
              <Button className="btn-premium w-full h-12">
                Get Started
              </Button>
            </Link>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-44 md:pb-32">
        {/* Background orbs */}
        <div className="hero-orb hero-orb-1 animate-pulse-glow"></div>
        <div className="hero-orb hero-orb-2 animate-pulse-glow" style={{ animationDelay: '1.5s' }}></div>

        <div className="relative max-w-7xl mx-auto px-4 md:px-6">
          <div className="text-center max-w-4xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-8 animate-fade-up">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              <span className="text-sm font-medium">Reduce content creation time by 85%</span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl md:text-7xl lg:text-8xl font-black tracking-tight mb-8 animate-fade-up stagger-1 leading-tight" style={{ opacity: 0 }}>
              Create <span className="text-gradient">Viral-Ready</span><br />
              Content Instantly
            </h1>

            {/* Subheadline */}
            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto mb-12 animate-fade-up stagger-2 leading-relaxed" style={{ opacity: 0 }}>
              Stop wasting hours on writing. Turn any URL into a high-ranking, SEO-optimized WordPress article with the power of advanced AI.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8 animate-fade-up stagger-3" style={{ opacity: 0 }}>
              <Link href="/register">
                <Button className="btn-premium text-base h-12 px-8 flex items-center gap-2">
                  Start Free Trial
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </Button>
              </Link>
              <Link href="#features">
                <Button variant="outline" className="h-12 px-8 rounded-full font-medium border-2 hover:bg-accent">
                  See How It Works
                </Button>
              </Link>
            </div>

            {/* Trust indicators */}
            <p className="text-sm text-muted-foreground animate-fade-up stagger-4" style={{ opacity: 0 }}>
              <span className="inline-flex items-center gap-1.5">
                <svg className="w-4 h-4 text-green-500" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                No credit card required
              </span>
              <span className="mx-3 text-border">•</span>
              <span className="inline-flex items-center gap-1.5">
                <svg className="w-4 h-4 text-green-500" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                10 free tokens
              </span>
              <span className="mx-3 text-border">•</span>
              <span className="inline-flex items-center gap-1.5">
                <svg className="w-4 h-4 text-green-500" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Cancel anytime
              </span>
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-20 max-w-3xl mx-auto animate-fade-up stagger-5" style={{ opacity: 0 }}>
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-gradient">{stat.value}</div>
                <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 md:py-32 relative">
        <div className="section-divider mb-20"></div>
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1.5 rounded-full bg-accent text-sm font-medium mb-4">
              Features
            </span>
            <h2 className="text-3xl md:text-5xl font-bold mb-6">
              Everything you need for<br />
              <span className="text-gradient">content automation</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              From scraping to publishing, we handle the entire content pipeline so you can focus on what matters most.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <Card key={index} className="card-premium group cursor-default">
                  <CardContent className="p-0">
                    <div className={`w-14 h-14 rounded-2xl mb-6 flex items-center justify-center bg-gradient-to-br ${feature.color} shadow-lg`}>
                      <div className="text-white">
                        <Icon />
                      </div>
                    </div>
                    <h3 className="text-xl font-semibold mb-3 group-hover:text-gradient transition-all duration-300">
                      {feature.title}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 md:py-32 bg-accent/30 relative">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1.5 rounded-full bg-background text-sm font-medium mb-4">
              Testimonials
            </span>
            <h2 className="text-3xl md:text-5xl font-bold mb-6">
              Loved by content creators
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Join hundreds of writers, agencies, and businesses who trust Contently.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="card-premium">
                <CardContent className="p-0">
                  {/* Stars */}
                  <div className="flex gap-1 mb-6">
                    {[...Array(5)].map((_, i) => (
                      <svg key={i} className="w-5 h-5 text-amber-400" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                      </svg>
                    ))}
                  </div>

                  {/* Quote */}
                  <p className="text-foreground text-lg mb-8 leading-relaxed">
                    &ldquo;{testimonial.content}&rdquo;
                  </p>

                  {/* Author */}
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-semibold">
                      {testimonial.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <p className="font-semibold">{testimonial.name}</p>
                      <p className="text-sm text-muted-foreground">{testimonial.role} at {testimonial.company}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 md:py-32">
        <div className="max-w-4xl mx-auto px-4 md:px-6">
          <Card className="relative overflow-hidden border-0 shadow-2xl">
            {/* Background gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 opacity-10"></div>
            <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full blur-3xl opacity-20 -translate-y-1/2 translate-x-1/2"></div>

            <CardContent className="relative p-8 md:p-16 text-center">
              <span className="inline-block px-4 py-1.5 rounded-full bg-accent text-sm font-medium mb-6">
                Hubungi Kami
              </span>

              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Tertarik dengan Contently?
              </h2>

              <p className="text-muted-foreground mb-10 max-w-lg mx-auto text-lg">
                Dapatkan konsultasi gratis untuk memahami bagaimana kami dapat membantu mengotomatisasi produksi konten Anda.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <a href="mailto:hello@contenly.ai">
                  <Button className="btn-premium text-base h-12 px-8 flex items-center gap-2">
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                      <path d="M22 6l-10 7L2 6" />
                    </svg>
                    Hubungi via Email
                  </Button>
                </a>
                <a href="https://wa.me/6281234567890" target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" className="h-12 px-8 rounded-full font-medium border-2 hover:bg-accent flex items-center gap-2">
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                    Chat WhatsApp
                  </Button>
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 md:py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-accent/50 to-transparent"></div>
        <div className="relative max-w-4xl mx-auto px-4 md:px-6 text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            Ready to automate your content?
          </h2>
          <p className="text-lg text-muted-foreground mb-10 max-w-2xl mx-auto">
            Join hundreds of content creators who save hours every week with Contently. Start your free trial today.
          </p>
          <Link href="/register">
            <Button className="btn-premium text-base h-12 px-10 flex items-center gap-2 mx-auto">
              Start Your Free Trial
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  )
}
