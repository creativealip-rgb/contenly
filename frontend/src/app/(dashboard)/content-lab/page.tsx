'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import {
    Rss,
    Loader2,
    Sparkles,
    Image as ImageIcon,
    Send,
    RotateCcw,
    Copy,
    Check,
    Settings2,
    Calendar,
    Clock,
    ExternalLink,
    FileText
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

// Mock RSS Feeds data (akan diganti dengan data dari API)
const mockRssFeeds = [
    { id: '1', name: 'TechCrunch', url: 'https://techcrunch.com' },
    { id: '2', name: 'The Verge', url: 'https://theverge.com' },
    { id: '3', name: 'Hacker News', url: 'https://news.ycombinator.com' },
    { id: '4', name: 'Product Hunt', url: 'https://producthunt.com' },
]

// Mock articles per feed (akan diganti dengan data dari API)
const mockFeedArticles: Record<string, Array<{
    id: string
    title: string
    url: string
    publishedAt: Date
    excerpt: string
}>> = {
    '1': [
        { id: 'tc1', title: 'OpenAI Announces GPT-5 with Revolutionary Capabilities', url: 'https://techcrunch.com/article1', publishedAt: new Date(Date.now() - 1000 * 60 * 30), excerpt: 'OpenAI has unveiled its latest language model...' },
        { id: 'tc2', title: 'Startup Raises $100M to Build AI-Powered Developer Tools', url: 'https://techcrunch.com/article2', publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 2), excerpt: 'A new startup is taking on traditional IDEs...' },
        { id: 'tc3', title: 'Apple Vision Pro 2 Leaks Reveal Major Improvements', url: 'https://techcrunch.com/article3', publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 4), excerpt: 'The next generation of Apple\'s spatial computing...' },
        { id: 'tc4', title: 'Google Launches New Cloud AI Services for Enterprise', url: 'https://techcrunch.com/article4', publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 6), excerpt: 'Google Cloud expands its AI offerings...' },
        { id: 'tc5', title: 'Meta Reports Strong Q4 Results, AI Investments Pay Off', url: 'https://techcrunch.com/article5', publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 8), excerpt: 'Meta Platforms has reported better than expected...' },
        { id: 'tc6', title: 'Electric Vehicle Startup Unveils Affordable Long-Range Model', url: 'https://techcrunch.com/article6', publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 12), excerpt: 'A new player in the EV market promises...' },
        { id: 'tc7', title: 'Microsoft Integrates Copilot Deeper into Windows 12', url: 'https://techcrunch.com/article7', publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 18), excerpt: 'The upcoming Windows release will feature...' },
        { id: 'tc8', title: 'Cybersecurity Firm Discovers Critical Cloud Vulnerability', url: 'https://techcrunch.com/article8', publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 24), excerpt: 'Security researchers have identified a flaw...' },
        { id: 'tc9', title: 'Fintech Giant Expands Services to 20 New Countries', url: 'https://techcrunch.com/article9', publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 30), excerpt: 'The payment processing company continues...' },
        { id: 'tc10', title: 'Robotics Company Shows Off Advanced Humanoid Prototype', url: 'https://techcrunch.com/article10', publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 36), excerpt: 'The latest humanoid robot can perform...' },
    ],
    '2': [
        { id: 'tv1', title: 'Samsung Galaxy S26 Ultra: Everything We Know So Far', url: 'https://theverge.com/article1', publishedAt: new Date(Date.now() - 1000 * 60 * 45), excerpt: 'Samsung\'s next flagship is expected to...' },
        { id: 'tv2', title: 'Netflix Gaming Expands with 50 New Titles', url: 'https://theverge.com/article2', publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 3), excerpt: 'The streaming giant is doubling down on gaming...' },
        { id: 'tv3', title: 'Sony Announces PS5 Pro with 8K Support', url: 'https://theverge.com/article3', publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 5), excerpt: 'The upgraded PlayStation console brings...' },
        { id: 'tv4', title: 'Twitter/X Launches New Creator Monetization Features', url: 'https://theverge.com/article4', publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 7), excerpt: 'Content creators can now earn through...' },
        { id: 'tv5', title: 'Amazon Prime Video Gets Major UI Overhaul', url: 'https://theverge.com/article5', publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 10), excerpt: 'The streaming service introduces a cleaner...' },
        { id: 'tv6', title: 'Intel Announces Next-Gen Desktop Processors', url: 'https://theverge.com/article6', publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 14), excerpt: 'The new chip lineup promises significant...' },
        { id: 'tv7', title: 'Spotify Raises Premium Prices in More Markets', url: 'https://theverge.com/article7', publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 20), excerpt: 'Music streaming subscribers will see increases...' },
        { id: 'tv8', title: 'VR Headset Sales Surge as Prices Drop', url: 'https://theverge.com/article8', publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 26), excerpt: 'Virtual reality is becoming more accessible...' },
        { id: 'tv9', title: 'Google Maps Adds AI-Powered Navigation Features', url: 'https://theverge.com/article9', publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 32), excerpt: 'The mapping service now includes smarter...' },
        { id: 'tv10', title: 'TikTok Introduces Long-Form Video Support', url: 'https://theverge.com/article10', publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 40), excerpt: 'The short-form video platform is evolving...' },
    ],
    '3': [
        { id: 'hn1', title: 'Show HN: I Built an Open Source Alternative to Notion', url: 'https://news.ycombinator.com/item1', publishedAt: new Date(Date.now() - 1000 * 60 * 20), excerpt: 'After years of using Notion, I decided to build...' },
        { id: 'hn2', title: 'Why SQLite Is Perfect for Edge Computing', url: 'https://news.ycombinator.com/item2', publishedAt: new Date(Date.now() - 1000 * 60 * 60), excerpt: 'An exploration of SQLite\'s advantages in...' },
        { id: 'hn3', title: 'The State of Rust in 2026: A Comprehensive Review', url: 'https://news.ycombinator.com/item3', publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 3), excerpt: 'How Rust has evolved and where it\'s heading...' },
        { id: 'hn4', title: 'Building a Compiler from Scratch in Go', url: 'https://news.ycombinator.com/item4', publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 5), excerpt: 'A step-by-step guide to understanding compilers...' },
        { id: 'hn5', title: 'How We Reduced Our Cloud Costs by 80%', url: 'https://news.ycombinator.com/item5', publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 8), excerpt: 'Our journey from $50k to $10k monthly spend...' },
        { id: 'hn6', title: 'The Future of WebAssembly: Beyond the Browser', url: 'https://news.ycombinator.com/item6', publishedAt: new Date('2024-01-17T08:00:00Z'), excerpt: 'WASM is finding new homes in serverless...' },
        { id: 'hn7', title: 'Understanding Zero-Knowledge Proofs Simply', url: 'https://news.ycombinator.com/item7', publishedAt: new Date('2024-01-17T05:00:00Z'), excerpt: 'A beginner-friendly explanation of ZK proofs...' },
        { id: 'hn8', title: 'My Experience Running a Solo SaaS for 5 Years', url: 'https://news.ycombinator.com/item8', publishedAt: new Date('2024-01-16T22:00:00Z'), excerpt: 'Lessons learned from bootstrapping alone...' },
        { id: 'hn9', title: 'A Deep Dive into Linux Kernel Networking', url: 'https://news.ycombinator.com/item9', publishedAt: new Date('2024-01-16T18:00:00Z'), excerpt: 'Understanding how packets flow through the kernel...' },
        { id: 'hn10', title: 'Why I Switched from TypeScript Back to JavaScript', url: 'https://news.ycombinator.com/item10', publishedAt: new Date('2024-01-16T14:00:00Z'), excerpt: 'A controversial take on type systems in JS...' },
    ],
    '4': [
        { id: 'ph1', title: 'AI Resume Builder - Generate Perfect Resumes in Minutes', url: 'https://producthunt.com/posts/1', publishedAt: new Date('2024-01-18T09:45:00Z'), excerpt: 'Use AI to create tailored resumes for any job...' },
        { id: 'ph2', title: 'Focus Timer 3.0 - Pomodoro with AI Break Suggestions', url: 'https://producthunt.com/posts/2', publishedAt: new Date('2024-01-18T08:00:00Z'), excerpt: 'Stay productive with smart break recommendations...' },
        { id: 'ph3', title: 'Design System Kit - Complete UI Component Library', url: 'https://producthunt.com/posts/3', publishedAt: new Date('2024-01-18T06:00:00Z'), excerpt: 'Everything you need to build beautiful interfaces...' },
        { id: 'ph4', title: 'Email AI - Smart Email Responses in Seconds', url: 'https://producthunt.com/posts/4', publishedAt: new Date('2024-01-18T04:00:00Z'), excerpt: 'Never write a boring email again with AI...' },
        { id: 'ph5', title: 'Code Review Bot - Automated PR Reviews', url: 'https://producthunt.com/posts/5', publishedAt: new Date('2024-01-18T01:00:00Z'), excerpt: 'Get instant feedback on your pull requests...' },
        { id: 'ph6', title: 'Meeting Notes AI - Auto Transcribe & Summarize', url: 'https://producthunt.com/posts/6', publishedAt: new Date('2024-01-17T21:00:00Z'), excerpt: 'Turn meetings into actionable summaries...' },
        { id: 'ph7', title: 'SEO Analyzer Pro - Complete Website Audit Tool', url: 'https://producthunt.com/posts/7', publishedAt: new Date('2024-01-17T16:00:00Z'), excerpt: 'Find and fix SEO issues automatically...' },
        { id: 'ph8', title: 'Budget Tracker AI - Smart Financial Planning', url: 'https://producthunt.com/posts/8', publishedAt: new Date('2024-01-17T10:00:00Z'), excerpt: 'AI-powered insights for your spending habits...' },
        { id: 'ph9', title: 'Social Media Scheduler - Multi-Platform Publishing', url: 'https://producthunt.com/posts/9', publishedAt: new Date('2024-01-17T04:00:00Z'), excerpt: 'Schedule posts across all platforms at once...' },
        { id: 'ph10', title: 'Customer Support Bot - AI-Powered Help Desk', url: 'https://producthunt.com/posts/10', publishedAt: new Date('2024-01-16T20:00:00Z'), excerpt: 'Automate customer support with smart AI...' },
    ],
}

import { WordPressSite, getSites } from '@/lib/sites-store'

// ... (other imports)

export default function ContentLabPage() {
    const [selectedFeed, setSelectedFeed] = useState('')
    const [selectedArticle, setSelectedArticle] = useState<typeof mockFeedArticles['1'][0] | null>(null)
    const [isScanning, setIsScanning] = useState(false)
    const [isGenerating, setIsGenerating] = useState(false)
    const [sourceContent, setSourceContent] = useState('')
    const [generatedContent, setGeneratedContent] = useState('')
    const [generatedTitle, setGeneratedTitle] = useState('')
    const [tone, setTone] = useState('professional')
    const [generateImage, setGenerateImage] = useState(true)
    const [copied, setCopied] = useState(false)

    // Publishing state
    const [isPublishing, setIsPublishing] = useState(false)
    const [publishResult, setPublishResult] = useState<{ success: boolean; message: string; link?: string } | null>(null)

    // Scheduling state
    const [isScheduleOpen, setIsScheduleOpen] = useState(false)
    const [scheduleDate, setScheduleDate] = useState('')
    const [scheduleTime, setScheduleTime] = useState('')
    const [selectedSite, setSelectedSite] = useState('')
    const [postStatus, setPostStatus] = useState('draft')

    // Sites state
    const [sites, setSites] = useState<WordPressSite[]>([])

    useEffect(() => {
        setSites(getSites())
    }, [])

    // Derived credentials from selected site
    const getSelectedSiteCredentials = () => {
        // Use selected site or fallback to first available site
        const siteId = selectedSite || sites[0]?.id
        const site = sites.find(s => s.id === siteId)

        if (!site) return null

        return {
            wpUrl: site.url,
            username: site.username,
            appPassword: site.appPassword
        }
    }

    const feedArticles = selectedFeed ? mockFeedArticles[selectedFeed] || [] : []

    const handleSelectArticle = (article: typeof mockFeedArticles['1'][0]) => {
        setSelectedArticle(article)
        setIsScanning(true)
        // Simulate scraping the selected article
        setTimeout(() => {
            setSourceContent(`# ${article.title}

${article.excerpt}

This is the original content scraped from the selected RSS article. It contains the main article text that will be transformed by AI.

## Key Points

- Point one about the topic
- Another important detail
- Technical specifications and data

The article continues with more detailed information about the subject matter, including quotes, statistics, and relevant examples.

> "This is an example quote from the original article that adds credibility and context to the content."

## Conclusion

The article wraps up with a summary of the key takeaways and a call to action for readers.

Source: ${article.url}`)
            setIsScanning(false)
        }, 1500)
    }

    const handleGenerate = async () => {
        if (!sourceContent) return
        setIsGenerating(true)
        setPublishResult(null)
        // Simulate AI generation
        setTimeout(() => {
            const title = 'Transform Your Workflow: A Complete Guide'
            setGeneratedTitle(title)
            setGeneratedContent(`# ${title}

Discover how modern approaches are revolutionizing the way professionals work. This comprehensive guide explores cutting-edge strategies that deliver measurable results.

## Why This Matters

In today's fast-paced environment, staying ahead requires embracing innovation. Here's what you need to know:

- **Efficiency gains** of up to 85% reported by early adopters
- **Seamless integration** with existing workflows
- **Scalable solutions** that grow with your needs

## The Complete Breakdown

Understanding the fundamentals is crucial for success. Let's dive into the core concepts that drive these improvements.

### Getting Started

Begin by assessing your current processes. Identify bottlenecks and areas where automation could make the biggest impact.

### Implementation Best Practices

Follow these proven strategies:
1. Start small and iterate
2. Measure results consistently
3. Scale what works

## Key Takeaways

- Embrace change as an opportunity
- Focus on measurable outcomes
- Invest in the right tools

Ready to transform your workflow? Start implementing these strategies today.`)
            setIsGenerating(false)
        }, 3000)
    }

    const handleCopy = () => {
        navigator.clipboard.writeText(generatedContent)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    // Publish to WordPress
    const handlePublishNow = async (status: 'draft' | 'publish') => {
        if (!generatedContent || !generatedTitle) return

        const credentials = getSelectedSiteCredentials()
        if (!credentials) {
            setPublishResult({
                success: false,
                message: 'Silakan hubungkan akun WordPress di halaman Integrations terlebih dahulu.',
            })
            return
        }

        setIsPublishing(true)
        setPublishResult(null)

        try {
            const response = await fetch('/api/wordpress', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...credentials,
                    title: generatedTitle,
                    content: generatedContent,
                    status,
                }),
            })

            const data = await response.json()

            if (data.success) {
                setPublishResult({
                    success: true,
                    message: status === 'publish' ? 'Artikel berhasil dipublish!' : 'Draft berhasil disimpan!',
                    link: data.post.link,
                })
            } else {
                setPublishResult({
                    success: false,
                    message: data.error || 'Gagal mempublish artikel',
                })
            }
        } catch (error: any) {
            setPublishResult({
                success: false,
                message: error.message || 'Terjadi kesalahan',
            })
        } finally {
            setIsPublishing(false)
        }
    }

    // Schedule publish
    const handleSchedulePublish = async () => {
        if (!generatedContent || !generatedTitle || !scheduleDate || !scheduleTime) return

        const credentials = getSelectedSiteCredentials()
        if (!credentials) {
            setPublishResult({
                success: false,
                message: 'Silakan pilih situs WordPress.',
            })
            return
        }

        setIsPublishing(true)

        try {
            // Combine date and time for scheduled post
            const scheduledDateTime = new Date(`${scheduleDate}T${scheduleTime}:00`)

            const response = await fetch('/api/wordpress', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...credentials,
                    title: generatedTitle,
                    content: generatedContent,
                    status: 'future',
                    date: scheduledDateTime.toISOString(),
                }),
            })

            const data = await response.json()

            if (data.success) {
                setPublishResult({
                    success: true,
                    message: `Artikel dijadwalkan untuk ${scheduleDate} ${scheduleTime}`,
                    link: data.post.link,
                })
                setIsScheduleOpen(false)
            } else {
                setPublishResult({
                    success: false,
                    message: data.error || 'Gagal menjadwalkan artikel',
                })
            }
        } catch (error: any) {
            setPublishResult({
                success: false,
                message: error.message || 'Terjadi kesalahan',
            })
        } finally {
            setIsPublishing(false)
        }
    }

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div>
                <h1 className="text-3xl font-bold">Content Lab</h1>
                <p className="text-muted-foreground">
                    Transform RSS feed articles into unique, SEO-optimized content.
                </p>
            </div>

            {/* RSS Feed & Article Selector */}
            <Card>
                <CardContent className="pt-6">
                    <div className="space-y-4">
                        {/* Feed Selector */}
                        <div className="space-y-2">
                            <Label htmlFor="feed-select" className="text-sm font-medium">
                                Select RSS Feed Source
                            </Label>
                            <Select value={selectedFeed} onValueChange={(value) => {
                                setSelectedFeed(value)
                                setSelectedArticle(null)
                                setSourceContent('')
                                setGeneratedContent('')
                            }}>
                                <SelectTrigger className="w-full">
                                    <div className="flex items-center gap-2">
                                        <Rss className="h-4 w-4 text-muted-foreground shrink-0" />
                                        <SelectValue placeholder="Choose a feed source..." />
                                    </div>
                                </SelectTrigger>
                                <SelectContent
                                    position="popper"
                                    side="bottom"
                                    sideOffset={4}
                                    className="w-[var(--radix-select-trigger-width)]"
                                >
                                    {mockRssFeeds.map((feed) => (
                                        <SelectItem key={feed.id} value={feed.id}>
                                            <div className="flex flex-col items-start">
                                                <span className="font-medium">{feed.name}</span>
                                                <span className="text-xs text-muted-foreground">{feed.url}</span>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Articles Selector */}
                        {selectedFeed && (
                            <div className="space-y-2">
                                <Label className="text-sm font-medium">
                                    Select Article from {mockRssFeeds.find(f => f.id === selectedFeed)?.name}
                                </Label>
                                <Select
                                    value={selectedArticle?.id || ''}
                                    onValueChange={(value) => {
                                        const article = feedArticles.find(a => a.id === value)
                                        if (article) handleSelectArticle(article)
                                    }}
                                >
                                    <SelectTrigger className="w-full">
                                        <div className="flex items-center gap-2">
                                            <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                                            <SelectValue placeholder="Choose an article to transform..." />
                                        </div>
                                    </SelectTrigger>
                                    <SelectContent
                                        position="popper"
                                        side="bottom"
                                        sideOffset={4}
                                        className="w-[var(--radix-select-trigger-width)] max-h-[300px]"
                                    >
                                        {feedArticles.map((article) => (
                                            <SelectItem key={article.id} value={article.id}>
                                                <div className="flex flex-col items-start py-1">
                                                    <span className="font-medium line-clamp-1">{article.title}</span>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="text-xs text-muted-foreground">
                                                            {formatDistanceToNow(article.publishedAt, { addSuffix: true })}
                                                        </span>
                                                    </div>
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Split Screen Editor */}
            <div className="grid gap-6 lg:grid-cols-2">
                {/* Source Content (Left) */}
                <Card className="min-h-[500px]">
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-lg">Original Content</CardTitle>
                                <CardDescription>
                                    {selectedArticle ? selectedArticle.title : 'Select an article from RSS feed'}
                                </CardDescription>
                            </div>
                            <Badge variant="secondary">Read-only</Badge>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="bg-muted rounded-lg p-4 min-h-[400px] overflow-auto">
                            {isScanning ? (
                                <div className="flex items-center justify-center h-full">
                                    <div className="text-center">
                                        <Loader2 className="h-8 w-8 animate-spin mx-auto text-violet-600" />
                                        <p className="mt-2 text-sm text-muted-foreground">Fetching article content...</p>
                                    </div>
                                </div>
                            ) : sourceContent ? (
                                <pre className="whitespace-pre-wrap text-sm font-mono">{sourceContent}</pre>
                            ) : (
                                <div className="flex items-center justify-center h-full text-muted-foreground">
                                    <div className="text-center">
                                        <Rss className="h-12 w-12 mx-auto mb-3 opacity-50" />
                                        <p>Select an RSS feed and click on an article to load its content</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Generated Content (Right) */}
                <Card className="min-h-[500px]">
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-lg">AI Generated</CardTitle>
                                <CardDescription>Unique, rewritten content</CardDescription>
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleCopy}
                                    disabled={!generatedContent}
                                >
                                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleGenerate}
                                    disabled={!sourceContent || isGenerating}
                                >
                                    <RotateCcw className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Textarea
                            value={generatedContent}
                            onChange={(e) => setGeneratedContent(e.target.value)}
                            placeholder="AI-generated content will appear here..."
                            className="min-h-[400px] resize-none font-mono text-sm"
                        />
                    </CardContent>
                </Card>
            </div>

            {/* Configuration & Actions */}
            <div className="grid gap-6 lg:grid-cols-3">
                {/* Settings */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Settings2 className="h-5 w-5" />
                            Generation Settings
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Tone</Label>
                            <Select value={tone} onValueChange={setTone}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent position="popper" side="bottom" sideOffset={4}>
                                    <SelectItem value="professional">Professional</SelectItem>
                                    <SelectItem value="casual">Casual</SelectItem>
                                    <SelectItem value="academic">Academic</SelectItem>
                                    <SelectItem value="conversational">Conversational</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Keywords (comma separated)</Label>
                            <Input placeholder="SEO, content, automation" />
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>Generate AI Image</Label>
                                <p className="text-xs text-muted-foreground">Uses 2 tokens</p>
                            </div>
                            <Button
                                variant={generateImage ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setGenerateImage(!generateImage)}
                            >
                                <ImageIcon className="h-4 w-4 mr-1" />
                                {generateImage ? 'On' : 'Off'}
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* SEO Preview */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg">SEO Preview</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Meta Title</Label>
                            <Input defaultValue="Transform Your Workflow: A Complete Guide" />
                            <p className="text-xs text-muted-foreground">52 / 60 characters</p>
                        </div>
                        <div className="space-y-2">
                            <Label>Meta Description</Label>
                            <Textarea
                                defaultValue="Discover how modern approaches are revolutionizing the way professionals work. Learn cutting-edge strategies for measurable results."
                                className="resize-none"
                                rows={3}
                            />
                            <p className="text-xs text-muted-foreground">138 / 160 characters</p>
                        </div>
                        <div className="space-y-2">
                            <Label>Slug</Label>
                            <Input defaultValue="transform-workflow-complete-guide" />
                        </div>
                    </CardContent>
                </Card>

                {/* Actions */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg">Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Button
                            className="w-full bg-gradient-to-r from-violet-600 to-indigo-600"
                            onClick={handleGenerate}
                            disabled={!sourceContent || isGenerating}
                        >
                            {isGenerating ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Generating...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="h-4 w-4 mr-2" />
                                    Generate Content (1 Token)
                                </>
                            )}
                        </Button>

                        {/* Publish Now Button */}
                        <div className="space-y-2">
                            <Label>Publish Destination</Label>
                            <Select value={selectedSite} onValueChange={setSelectedSite}>
                                <SelectTrigger>
                                    <SelectValue placeholder={sites.length > 0 ? "Select site/account" : "No sites connected"} />
                                </SelectTrigger>
                                <SelectContent position="popper" side="bottom" sideOffset={4}>
                                    {sites.length > 0 ? (
                                        sites.map(site => (
                                            <SelectItem key={site.id} value={site.id}>{site.name}</SelectItem>
                                        ))
                                    ) : (
                                        <div className="p-2 text-center text-sm text-muted-foreground">
                                            <p className="mb-2">No connected sites</p>
                                            <a href="/integrations" className="text-violet-600 hover:underline block">Go to Integrations</a>
                                        </div>
                                    )}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Publish Status Feedback */}
                        {publishResult && (
                            <div className={`p-3 rounded-md text-sm ${publishResult.success ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                                <div className="flex items-center gap-2">
                                    {publishResult.success ? <Check className="h-4 w-4" /> : <Loader2 className="h-4 w-4 animate-spin hidden" />}
                                    <p>{publishResult.message}</p>
                                </div>
                                {publishResult.link && (
                                    <a href={publishResult.link} target="_blank" rel="noopener noreferrer" className="text-xs underline mt-1 block hover:text-green-800">
                                        View Post
                                    </a>
                                )}
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-2">
                            <Button
                                variant="outline"
                                className="w-full"
                                onClick={() => handlePublishNow('draft')}
                                disabled={!generatedContent || isPublishing}
                            >
                                {isPublishing ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Draft"}
                            </Button>

                            <Button
                                className="w-full bg-gradient-to-r from-violet-600 to-indigo-600"
                                onClick={() => handlePublishNow('publish')}
                                disabled={!generatedContent || isPublishing}
                            >
                                {isPublishing ? (
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                ) : (
                                    <Send className="h-4 w-4 mr-2" />
                                )}
                                Publish
                            </Button>
                        </div>

                        {/* Schedule Publish Button */}
                        <Dialog open={isScheduleOpen} onOpenChange={setIsScheduleOpen}>
                            <DialogTrigger asChild>
                                <Button
                                    variant="outline"
                                    className="w-full"
                                    disabled={!generatedContent || isPublishing}
                                >
                                    <Calendar className="h-4 w-4 mr-2" />
                                    Schedule Post
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Schedule Post</DialogTitle>
                                    <DialogDescription>
                                        Choose when to publish this article to your WordPress site.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                    <div className="space-y-2">
                                        <Label>WordPress Site</Label>
                                        <Select value={selectedSite} onValueChange={setSelectedSite}>
                                            <SelectTrigger>
                                                <SelectValue placeholder={sites.length > 0 ? "Select destination site" : "No sites connected"} />
                                            </SelectTrigger>
                                            <SelectContent position="popper" side="bottom" sideOffset={4}>
                                                {sites.length > 0 ? (
                                                    sites.map(site => (
                                                        <SelectItem key={site.id} value={site.id}>{site.name}</SelectItem>
                                                    ))
                                                ) : (
                                                    <div className="p-2 text-center text-sm text-muted-foreground">
                                                        <p className="mb-2">No connected sites</p>
                                                        <a href="/integrations" className="text-violet-600 hover:underline block">Go to Integrations</a>
                                                    </div>
                                                )}
                                            </SelectContent>
                                        </Select>
                                        {sites.length === 0 && (
                                            <p className="text-xs text-muted-foreground mt-1">
                                                You need to connect a site in the <a href="/integrations" className="underline hover:text-foreground">Integrations page</a> first.
                                            </p>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Date</Label>
                                            <div className="relative">
                                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                <Input
                                                    type="date"
                                                    className="pl-10"
                                                    value={scheduleDate}
                                                    onChange={(e) => setScheduleDate(e.target.value)}
                                                    min={new Date().toISOString().split('T')[0]}
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Time</Label>
                                            <div className="relative">
                                                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                <Input
                                                    type="time"
                                                    className="pl-10"
                                                    value={scheduleTime}
                                                    onChange={(e) => setScheduleTime(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Post Status</Label>
                                        <Select defaultValue="publish">
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent position="popper" side="bottom" sideOffset={4}>
                                                <SelectItem value="publish">Published</SelectItem>
                                                <SelectItem value="draft">Draft</SelectItem>
                                                <SelectItem value="private">Private</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button variant="outline" onClick={() => setIsScheduleOpen(false)}>
                                        Cancel
                                    </Button>
                                    <Button
                                        className="bg-gradient-to-r from-violet-600 to-indigo-600"
                                        onClick={handleSchedulePublish}
                                        disabled={!selectedSite || !scheduleDate || !scheduleTime || isPublishing}
                                    >
                                        <Calendar className="h-4 w-4 mr-2" />
                                        Schedule
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>

                        <Separator />
                        <div className="text-center text-sm text-muted-foreground">
                            <p>Token Cost: <span className="font-medium text-foreground">{generateImage ? 3 : 1}</span></p>
                            <p>Balance: <span className="font-medium text-amber-600">50 tokens</span></p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
