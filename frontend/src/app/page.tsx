import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Footer } from '@/components/layout'
import {
  Sparkles,
  Zap,
  Globe,
  Image,
  Rss,
  BarChart3,
  ArrowRight,
  Star
} from 'lucide-react'

const features = [
  {
    icon: Zap,
    title: 'AI-Powered Rewriting',
    description: 'Transform any URL into unique, SEO-optimized content using GPT-4 and Claude 3.5.',
  },
  {
    icon: Globe,
    title: 'WordPress Integration',
    description: 'One-click publishing to multiple WordPress sites with category mapping.',
  },
  {
    icon: Image,
    title: 'AI Image Generation',
    description: 'Generate unique, copyright-free featured images with DALL-E 3.',
  },
  {
    icon: Rss,
    title: 'RSS Auto-Fetching',
    description: 'Automatically pull and process content from your favorite RSS feeds.',
  },
  {
    icon: BarChart3,
    title: 'SEO Optimization',
    description: 'Auto-generate meta titles, descriptions, and slugs for maximum visibility.',
  },
  {
    icon: Sparkles,
    title: 'Token System',
    description: 'Pay only for what you use with our flexible token-based pricing.',
  },
]



const testimonials = [
  {
    name: 'Sarah Johnson',
    role: 'Content Manager at TechBlog',
    content: 'Camedia AI cut our content production time by 85%. We now publish 5x more articles with the same team.',
    avatar: 'SJ',
  },
  {
    name: 'Michael Chen',
    role: 'SEO Agency Owner',
    content: 'The WordPress integration is seamless. Our clients love the automated content pipeline.',
    avatar: 'MC',
  },
  {
    name: 'Emily Rodriguez',
    role: 'Freelance Writer',
    content: 'The AI rewriting quality is incredible. It maintains my voice while making content unique.',
    avatar: 'ER',
  },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-4 md:px-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-xl bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
              Camedia AI
            </span>
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <Link href="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Features
            </Link>
            <Link href="#contact" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Hubungi Kami
            </Link>
            <Link href="#testimonials" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Testimonials
            </Link>
          </nav>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link href="/register">
              <Button className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 md:py-32">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-50 via-white to-indigo-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950" />
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-30" />
        <div className="relative max-w-7xl mx-auto px-4 md:px-6 text-center">
          <Badge className="mb-6 bg-violet-100 text-violet-700 hover:bg-violet-100">
            <Sparkles className="h-3 w-3 mr-1" />
            Reduce content creation time by 85%
          </Badge>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6">
            Turn any URL into{' '}
            <span className="bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
              SEO-Optimized
            </span>
            <br />WordPress Posts
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Camedia AI transforms web content into unique, high-quality articles with AI-powered rewriting,
            image generation, and one-click WordPress publishing.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/register">
              <Button size="lg" className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-lg h-12 px-8">
                Start Free Trial
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </Link>
            <Link href="#features">
              <Button size="lg" variant="outline" className="text-lg h-12 px-8">
                See How It Works
              </Button>
            </Link>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            No credit card required • 10 free tokens • Cancel anytime
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 md:py-32 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="text-center mb-16">
            <Badge className="mb-4">Features</Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Everything you need for content automation
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              From scraping to publishing, Camedia AI handles the entire content pipeline so you can focus on strategy.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                  <CardHeader>
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600/20 to-indigo-600/20 mb-4">
                      <Icon className="h-6 w-6 text-violet-600" />
                    </div>
                    <CardTitle>{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base">{feature.description}</CardDescription>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* Hubungi Kami Section */}
      <section id="contact" className="py-20 md:py-32">
        <div className="max-w-4xl mx-auto px-4 md:px-6">
          <div className="text-center mb-12">
            <Badge className="mb-4">Hubungi Kami</Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Tertarik dengan Camedia AI?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Hubungi tim kami untuk mendiskusikan kebutuhan Anda dan dapatkan penawaran terbaik.
            </p>
          </div>
          <Card className="border-2 border-violet-600 shadow-xl">
            <CardContent className="p-8 md:p-12 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 mx-auto mb-6">
                <Sparkles className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Konsultasi Gratis</h3>
              <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
                Dapatkan konsultasi gratis untuk memahami bagaimana Camedia AI dapat membantu
                mengotomatisasi produksi konten Anda dan meningkatkan produktivitas tim.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <a href="mailto:hello@camedia.ai">
                  <Button size="lg" className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-lg h-12 px-8">
                    Hubungi via Email
                    <ArrowRight className="h-5 w-5 ml-2" />
                  </Button>
                </a>
                <a href="https://wa.me/6281234567890" target="_blank" rel="noopener noreferrer">
                  <Button size="lg" variant="outline" className="text-lg h-12 px-8">
                    Chat WhatsApp
                  </Button>
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 md:py-32 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="text-center mb-16">
            <Badge className="mb-4">Testimonials</Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Loved by content creators
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              See what our users have to say about Camedia AI.
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="border-0 shadow-lg">
                <CardContent className="pt-6">
                  <div className="flex gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="text-muted-foreground mb-6">&quot;{testimonial.content}&quot;</p>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 text-white font-medium">
                      {testimonial.avatar}
                    </div>
                    <div>
                      <p className="font-medium">{testimonial.name}</p>
                      <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 md:py-32">
        <div className="max-w-4xl mx-auto px-4 md:px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to automate your content?
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Join thousands of content creators who save hours every week with Camedia AI.
          </p>
          <Link href="/register">
            <Button size="lg" className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-lg h-12 px-8">
              Start Your Free Trial
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  )
}
