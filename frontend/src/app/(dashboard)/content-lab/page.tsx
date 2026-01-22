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
    FileText,
    Globe
} from 'lucide-react'


import { WordPressSite, getSites, getActiveSite } from '@/lib/sites-store'
import { RssFeed, getFeeds, addFeed, removeFeed } from '@/lib/feeds-store'
import { Plus, Trash2 } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// ... (other imports)

export default function ContentLabPage() {
    const [selectedFeed, setSelectedFeed] = useState('')
    const [selectedArticle, setSelectedArticle] = useState<any>(null)
    const [isScanning, setIsScanning] = useState(false)
    const [isGenerating, setIsGenerating] = useState(false)
    const [sourceContent, setSourceContent] = useState('')
    const [generatedContent, setGeneratedContent] = useState('')
    const [generatedTitle, setGeneratedTitle] = useState('')
    // Scraper state
    const [scrapeUrl, setScrapeUrl] = useState('')
    const [isScraping, setIsScraping] = useState(false)

    // AI Rewrite state
    const [aiTone, setAiTone] = useState<'professional' | 'casual' | 'creative' | 'technical'>('professional')
    const [aiStyle, setAiStyle] = useState<'blog' | 'news' | 'tutorial' | 'review'>('blog')
    const [aiLength, setAiLength] = useState<'shorter' | 'same' | 'longer'>('same')
    const [isRewriting, setIsRewriting] = useState(false)

    // SEO & Image state
    const [slug, setSlug] = useState('')
    const [featuredImage, setFeaturedImage] = useState('')
    const [isGeneratingImage, setIsGeneratingImage] = useState(false)

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
    const [postStatus, setPostStatus] = useState('draft')

    // WordPress categories
    const [wpCategories, setWpCategories] = useState<Array<{ id: number; name: string }>>([])
    const [selectedCategory, setSelectedCategory] = useState<number | null>(null)
    const [isFetchingCategories, setIsFetchingCategories] = useState(false)

    // Sites state
    const [sites, setSites] = useState<WordPressSite[]>([])

    // RSS Feeds state
    const [feeds, setFeeds] = useState<RssFeed[]>([])
    const [articles, setArticles] = useState<any[]>([])
    const [isFetchingRSS, setIsFetchingRSS] = useState(false)
    const [isAddFeedOpen, setIsAddFeedOpen] = useState(false)
    const [newFeedUrl, setNewFeedUrl] = useState('')
    const [newFeedName, setNewFeedName] = useState('')

    useEffect(() => {
        setSites(getSites())
        setFeeds(getFeeds())

        // Fetch WordPress categories from active site via backend
        const fetchCategories = async () => {
            const activeSite = getActiveSite()
            if (!activeSite) return

            setIsFetchingCategories(true)
            try {
                // Use backend endpoint which already has stored credentials
                const API_BASE_URL = typeof window === 'undefined'
                    ? (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api')
                    : '/api'

                const response = await fetch(`${API_BASE_URL}/wordpress/sites/${activeSite.id}/categories`, {
                    credentials: 'include', // Send session cookies
                })

                if (!response.ok) {
                    throw new Error('Failed to fetch categories')
                }

                const categories = await response.json()

                if (Array.isArray(categories)) {
                    setWpCategories(categories)
                }
            } catch (error) {
                console.error('Failed to fetch categories:', error)
            } finally {
                setIsFetchingCategories(false)
            }
        }

        fetchCategories()
    }, [])


    // Derived credentials from active site
    const getSelectedSiteCredentials = () => {
        const site = getActiveSite()
        if (!site) return null

        return {
            wpUrl: site.url,
            username: site.username,
            appPassword: site.appPassword
        }
    }

    // Fetch content from RSS
    const handleFetchArticles = async (feedId: string) => {
        const feed = feeds.find(f => f.id === feedId)
        if (!feed) return

        setIsFetchingRSS(true)
        setArticles([])
        setSelectedArticle(null)
        setSourceContent('')

        try {
            const response = await fetch('/api/rss', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: feed.url }),
            })

            const data = await response.json()
            if (data.success) {
                setArticles(data.items)
            } else {
                console.error('Failed to fetch RSS:', data.error)
                // Fallback or error notification
            }
        } catch (error) {
            console.error('RSS Error:', error)
        } finally {
            setIsFetchingRSS(false)
        }
    }

    const handleAddFeed = () => {
        if (!newFeedName || !newFeedUrl) return

        const newFeed: RssFeed = {
            id: Math.random().toString(36).substring(7),
            name: newFeedName,
            url: newFeedUrl,
            status: 'active',
            lastSynced: new Date().toISOString()
        }

        const updatedFeeds = addFeed(newFeed)
        setFeeds(updatedFeeds)
        setNewFeedName('')
        setNewFeedUrl('')
        setIsAddFeedOpen(false)

        // Auto select and fetch
        setSelectedFeed(newFeed.id)
        handleFetchArticles(newFeed.id)
    }

    const handleRemoveFeed = (e: React.MouseEvent, id: string) => {
        e.stopPropagation()
        const updatedFeeds = removeFeed(id)
        setFeeds(updatedFeeds)
        if (selectedFeed === id) {
            setSelectedFeed('')
            setArticles([])
        }
    }

    // Effect to fetch when selectedFeed changes
    useEffect(() => {
        if (selectedFeed) {
            handleFetchArticles(selectedFeed)
        }
    }, [selectedFeed])

    const handleSelectArticle = async (article: any) => {
        setSelectedArticle(article)
        setIsScanning(true)

        try {
            // Auto-scrape full article content from URL
            const response = await fetch('/api/scraper', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: article.url })
            })

            const result = await response.json()

            console.log('Scraper API Response:', {
                success: result.success,
                contentLength: result.data?.content?.length || 0,
                hasContent: !!result.data?.content,
                source: result.data?.source,
                tier: result.data?.extractionTier
            })

            if (result.success && result.data) {
                // Use scraped full content
                setSourceContent(result.data.content || '')
            } else {
                console.warn('Scraping failed, using RSS fallback')
                // Fallback to RSS excerpt if scraping fails
                setSourceContent(`# ${article.title}

${article.excerpt || article.description || ''}

Source: ${article.url}`)
            }
        } catch (error) {
            console.error('Scraping error:', error)
            // Fallback to RSS excerpt
            setSourceContent(`# ${article.title}

${article.excerpt || article.description || ''}

Source: ${article.url}`)
        } finally {
            setIsScanning(false)
        }
    }

    const handleAIRewrite = async () => {
        if (!sourceContent.trim()) {
            alert('Please select an article first')
            return
        }

        setIsRewriting(true)
        setGeneratedContent('')
        setGeneratedTitle('')

        try {
            const response = await fetch('/api/ai/rewrite', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content: sourceContent,
                    title: selectedArticle?.title,
                    tone: aiTone,
                    style: aiStyle,
                    targetLength: aiLength,
                    includeMetadata: true,
                }),
            })

            const result = await response.json()

            if (result.success && result.data) {
                setGeneratedContent(result.data.content)
                setGeneratedTitle(result.data.title)
            } else {
                alert(`AI Rewrite failed: ${result.error || 'Unknown error'}`)
            }
        } catch (error: any) {
            console.error('AI Rewrite error:', error)
            alert(`Failed to rewrite: ${error.message}`)
        } finally {
            setIsRewriting(false)
        }
    }



    const handleScrape = async () => {
        if (!scrapeUrl) return
        setIsScraping(true)
        setSourceContent('')
        setSelectedArticle(null)
        try {
            const response = await fetch('/api/scraper', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: scrapeUrl })
            })
            const result = await response.json()
            if (result.success) {
                const content = result.data.content || result.data.excerpt || ''
                setSourceContent(content)
                setSelectedArticle({
                    id: 'scraped-' + Date.now(),
                    title: result.data.title,
                    url: result.data.url,
                    excerpt: result.data.excerpt || content.substring(0, 150) + '...',
                    publishedAt: result.data.publishedAt
                })
                setGeneratedTitle(result.data.title)
            } else {
                console.error("Scrape failed:", result.error)
            }
        } catch (error) {
            console.error("Scrape error:", error)
        } finally {
            setIsScraping(false)
        }
    }

    const handleCopy = () => {
        navigator.clipboard.writeText(generatedContent)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    // Publish to WordPress
    const handlePublishNow = async (status: 'draft' | 'publish') => {
        if (!generatedContent || !generatedTitle) return

        setIsPublishing(true)
        setPublishResult(null)

        try {
            // Use relative path for client-side to leverage Next.js proxy
            const API_BASE_URL = typeof window === 'undefined'
                ? (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api')
                : '/api'

            const response = await fetch(`${API_BASE_URL}/wordpress/publish`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include', // Send session cookies
                body: JSON.stringify({
                    title: generatedTitle,
                    content: generatedContent,
                    status,
                    categories: selectedCategory ? [selectedCategory] : undefined,
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

        setIsPublishing(true)

        try {
            // Combine date and time into ISO string
            const scheduledDateTime = new Date(`${scheduleDate}T${scheduleTime}`).toISOString()

            // Use relative path for client-side to leverage Next.js proxy
            const API_BASE_URL = typeof window === 'undefined'
                ? (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api')
                : '/api'

            const response = await fetch(`${API_BASE_URL}/wordpress/publish`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    title: generatedTitle,
                    content: generatedContent,
                    status: 'future',
                    categories: selectedCategory ? [selectedCategory] : undefined,
                    date: scheduledDateTime,
                }),
            })

            const data = await response.json()

            if (data.success) {
                setPublishResult({
                    success: true,
                    message: `Artikel berhasil dijadwalkan untuk ${new Date(scheduledDateTime).toLocaleString('id-ID')}`,
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
                    Transform RSS feed articles or any web content into unique, SEO-optimized articles.
                </p>
            </div>

            {/* Source Selection Card */}
            <Card className="border-violet-100 dark:border-violet-900 shadow-sm">
                <CardHeader>
                    <CardTitle className="text-xl flex items-center gap-2">
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400">
                            1
                        </span>
                        Choose Source
                    </CardTitle>
                    <CardDescription>
                        Select content to transform from RSS feeds
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label>Select RSS Feed Source</Label>
                                <Dialog open={isAddFeedOpen} onOpenChange={setIsAddFeedOpen}>
                                    <DialogTrigger asChild>
                                        <Button variant="ghost" size="sm" className="text-violet-600 h-6 px-2 hover:bg-violet-50">
                                            <Plus className="h-4 w-4 mr-1" /> Add Feed
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>Add New RSS Feed</DialogTitle>
                                            <DialogDescription>
                                                Enter the URL of the RSS feed you want to follow.
                                            </DialogDescription>
                                        </DialogHeader>
                                        <div className="space-y-4 py-4">
                                            <div className="space-y-2">
                                                <Label>Feed Name</Label>
                                                <Input
                                                    placeholder="e.g. TechCrunch"
                                                    value={newFeedName}
                                                    onChange={(e) => setNewFeedName(e.target.value)}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Feed URL</Label>
                                                <Input
                                                    placeholder="https://example.com/feed"
                                                    value={newFeedUrl}
                                                    onChange={(e) => setNewFeedUrl(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                        <DialogFooter>
                                            <Button variant="outline" onClick={() => setIsAddFeedOpen(false)}>Cancel</Button>
                                            <Button onClick={handleAddFeed} disabled={!newFeedName || !newFeedUrl}>Add Feed</Button>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>
                            </div>
                            <Select value={selectedFeed || ''} onValueChange={(val) => {
                                setSelectedFeed(val)
                                setSelectedArticle(null)
                                setSourceContent('')
                            }}>
                                <SelectTrigger className="border-violet-200 focus:ring-violet-500">
                                    <SelectValue placeholder="Select a feed..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {feeds.map((feed) => (
                                        <SelectItem key={feed.id} value={feed.id}>
                                            <div className="flex flex-col items-start text-left">
                                                <span className="font-medium">{feed.name}</span>
                                                <span className="text-xs text-muted-foreground truncate max-w-[200px]">{feed.url}</span>
                                            </div>
                                        </SelectItem>
                                    ))}
                                    {feeds.length === 0 && (
                                        <div className="p-2 text-center text-sm text-muted-foreground">No feeds added</div>
                                    )}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Select Article</Label>
                            <Select value={selectedArticle?.id || ''} onValueChange={(val) => {
                                const article = articles.find(a => a.id === val)
                                if (article) handleSelectArticle(article)
                            }}>
                                <SelectTrigger disabled={!selectedFeed || isFetchingRSS} className="w-full">
                                    <SelectValue placeholder={isFetchingRSS ? "Fetching..." : "Choose an article..."} className="block truncate" />
                                </SelectTrigger>
                                <SelectContent position="popper" sideOffset={4} className="w-[--radix-select-trigger-width] max-w-full overflow-hidden">
                                    {articles.map((article) => (
                                        <SelectItem key={article.id} value={article.id} className="overflow-hidden">
                                            <div className="truncate min-w-0 flex-1 pr-8">{article.title}</div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* AI Configuration */}
            <Card className="border-violet-100 dark:border-violet-900 shadow-sm">
                <CardHeader>
                    <CardTitle className="text-xl flex items-center gap-2">
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400">
                            2
                        </span>
                        AI Configuration
                    </CardTitle>
                    <CardDescription>
                        Configure how AI will rewrite your content
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* First Row */}
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label className="text-sm font-medium">Tone</Label>
                            <Select value={aiTone} onValueChange={(v: any) => setAiTone(v)}>
                                <SelectTrigger className="h-10">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent position="popper" sideOffset={4}>
                                    <SelectItem value="professional">Professional</SelectItem>
                                    <SelectItem value="casual">Casual</SelectItem>
                                    <SelectItem value="creative">Creative</SelectItem>
                                    <SelectItem value="technical">Technical</SelectItem>
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground">Writing tone and personality</p>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-sm font-medium">Style</Label>
                            <Select value={aiStyle} onValueChange={(v: any) => setAiStyle(v)}>
                                <SelectTrigger className="h-10">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent position="popper" sideOffset={4}>
                                    <SelectItem value="blog">Blog Post</SelectItem>
                                    <SelectItem value="news">News Article</SelectItem>
                                    <SelectItem value="tutorial">Tutorial/Guide</SelectItem>
                                    <SelectItem value="review">Review</SelectItem>
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground">Article format and structure</p>
                        </div>
                    </div>

                    {/* Second Row */}
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label className="text-sm font-medium">Length</Label>
                            <Select value={aiLength} onValueChange={(v: any) => setAiLength(v)}>
                                <SelectTrigger className="h-10">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent position="popper" sideOffset={4}>
                                    <SelectItem value="shorter">Shorter (70%)</SelectItem>
                                    <SelectItem value="same">Same Length</SelectItem>
                                    <SelectItem value="longer">Longer (130%)</SelectItem>
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground">Target article length</p>
                        </div>

                        <div className="flex items-end">
                            <Button
                                className="w-full h-10 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700"
                                onClick={handleAIRewrite}
                                disabled={!sourceContent || isRewriting}
                            >
                                {isRewriting ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Rewriting...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="h-4 w-4 mr-2" />
                                        Rewrite with AI
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Split Screen Editor */}
            <div className="grid gap-6 lg:grid-cols-2">
                {/* Source Content */}
                <Card className="min-h-[500px]">
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-lg">Original Content</CardTitle>
                                <CardDescription>
                                    {selectedArticle ? selectedArticle.title : 'Select a source above'}
                                </CardDescription>
                            </div>
                            <Badge variant="secondary">Read-only</Badge>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="bg-muted rounded-lg p-4 min-h-[400px] max-h-[600px] overflow-auto">
                            {isScanning || isScraping ? (
                                <div className="flex items-center justify-center h-full">
                                    <div className="text-center">
                                        <Loader2 className="h-8 w-8 animate-spin mx-auto text-violet-600" />
                                        <p className="mt-2 text-sm text-muted-foreground">Fetching content...</p>
                                    </div>
                                </div>
                            ) : sourceContent ? (
                                <pre className="whitespace-pre-wrap text-sm font-mono">{sourceContent}</pre>
                            ) : (
                                <div className="flex items-center justify-center h-full text-muted-foreground">
                                    <div className="text-center">
                                        <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                                        <p>Content will appear here</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* AI Generated Content */}
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
                                    onClick={handleAIRewrite}
                                    disabled={!sourceContent || isRewriting}
                                >
                                    <RotateCcw className={`h-4 w-4 ${isRewriting ? 'animate-spin' : ''}`} />
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Textarea
                            value={generatedContent}
                            onChange={(e) => setGeneratedContent(e.target.value)}
                            placeholder="AI-generated content will appear here..."
                            className="min-h-[400px] max-h-[600px] resize-none font-mono text-sm"
                        />
                    </CardContent>
                </Card>
            </div>

            {/* Configuration & Actions */}
            <div className="grid gap-6 lg:grid-cols-2">

                {/* SEO Preview */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg">SEO Preview</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Meta Title</Label>
                            <Input value={generatedTitle || ""} onChange={(e) => setGeneratedTitle(e.target.value)} placeholder="Article Title" />
                            <p className="text-xs text-muted-foreground">Characters: {(generatedTitle || "").length}/60</p>
                        </div>

                        <div className="space-y-2">
                            <Label>Slug (URL)</Label>
                            <Input
                                value={slug}
                                onChange={(e) => setSlug(e.target.value)}
                                placeholder="article-slug-url"
                                className="font-mono text-sm"
                            />
                            <p className="text-xs text-muted-foreground">URL-friendly version of title</p>
                        </div>

                        <div className="space-y-2">
                            <Label>Meta Description</Label>
                            <Textarea
                                defaultValue="AI generated description..."
                                className="resize-none"
                                rows={3}
                            />
                            <p className="text-xs text-muted-foreground">Ideal: 150-160 characters</p>
                        </div>

                        <div className="space-y-2">
                            <Label>Featured Image</Label>
                            <div className="flex gap-2">
                                <Input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0]
                                        if (file) {
                                            setFeaturedImage(URL.createObjectURL(file))
                                        }
                                    }}
                                    className="flex-1"
                                />
                                <Button
                                    variant="outline"
                                    onClick={() => setIsGeneratingImage(true)}
                                    disabled={isGeneratingImage}
                                    className="shrink-0"
                                >
                                    {isGeneratingImage ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Generating...
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles className="h-4 w-4 mr-2" />
                                            AI Generate
                                        </>
                                    )}
                                </Button>
                            </div>
                            {featuredImage && (
                                <div className="mt-2 rounded-lg border overflow-hidden">
                                    <img src={featuredImage} alt="Featured" className="w-full h-32 object-cover" />
                                </div>
                            )}
                            <p className="text-xs text-muted-foreground">Upload from local or generate with AI - Recommended: 1200x630px</p>
                        </div>
                    </CardContent>
                </Card>

                {/* Actions */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg">Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">

                        <div className="space-y-2">
                            <Label>Category</Label>
                            <Select
                                value={selectedCategory?.toString() || ''}
                                onValueChange={(val) => setSelectedCategory(parseInt(val))}
                                disabled={isFetchingCategories || wpCategories.length === 0}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder={isFetchingCategories ? "Loading categories..." : wpCategories.length > 0 ? "Select category" : "No categories found"} />
                                </SelectTrigger>
                                <SelectContent>
                                    {wpCategories.map(category => (
                                        <SelectItem key={category.id} value={category.id.toString()}>
                                            {category.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground">Post will be published to selected category</p>
                        </div>

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
                                        disabled={!scheduleDate || !scheduleTime || isPublishing}
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
        </div >
    )
}
