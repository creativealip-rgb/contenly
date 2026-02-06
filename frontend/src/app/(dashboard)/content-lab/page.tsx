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
    RefreshCw,
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
import { migrateLocalStorageFeeds } from '@/lib/migrate-feeds'

// ... (other imports)

import { useContentLabStore } from '@/stores/content-lab-store'

// ... imports

export default function ContentLabPage() {
    // Global Store State
    const {
        generatedContent, setGeneratedContent,
        generatedTitle, setGeneratedTitle,
        sourceContent, setSourceContent,
        selectedArticle, setSelectedArticle,
        generatedArticleId, setGeneratedArticleId,
        featuredImage, setFeaturedImage,
        activeTab, setActiveTab,
        scrapeUrl, setScrapeUrl,
        articleIdea, setArticleIdea,
        aiTone, setAiTone,
        aiStyle, setAiStyle,
        aiLength, setAiLength,
        publishResult, setPublishResult,
        slug, setSlug,
        metaTitle, setMetaTitle,
        metaDescription, setMetaDescription,
    } = useContentLabStore()

    // Local UI State (Not persisted)
    const [selectedFeed, setSelectedFeed] = useState('')
    const [isScanning, setIsScanning] = useState(false)
    const [isGenerating, setIsGenerating] = useState(false)
    const [isScraping, setIsScraping] = useState(false)
    const [isRewriting, setIsRewriting] = useState(false)

    // SEO & Image state (Local for now, unless extended)
    const [isGeneratingImage, setIsGeneratingImage] = useState(false)
    /* const [tone, setTone] = useState('professional') */ // Unused duplicate?
    const [generateImage, setGenerateImage] = useState(true)
    const [copied, setCopied] = useState(false)

    // Publishing state
    const [isPublishing, setIsPublishing] = useState(false)
    const [isRefreshingSEO, setIsRefreshingSEO] = useState(false)

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
        // Load sites and feeds
        const loadData = async () => {
            const fetchedSites = await getSites()
            setSites(fetchedSites)

            // Migrate localStorage feeds to database (one-time)
            await migrateLocalStorageFeeds()

            const fetchedFeeds = await getFeeds()
            setFeeds(fetchedFeeds)

            // Fetch WordPress categories from active site via backend
            const activeSite = await getActiveSite()
            if (!activeSite) return

            setIsFetchingCategories(true)
            try {
                // Use backend endpoint which already has stored credentials
                const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

                const response = await fetch(`${API_BASE_URL}/wordpress/sites/${activeSite.id}/categories`, {
                    credentials: 'include', // Send session cookies
                    headers: { 'ngrok-skip-browser-warning': 'true' }
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

        loadData()
    }, [])


    // Derived credentials from active site
    const getSelectedSiteCredentials = async () => {
        const site = await getActiveSite()
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
                headers: {
                    'Content-Type': 'application/json'
                },
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

    const handleAddFeed = async () => {
        if (!newFeedName || !newFeedUrl) return

        const newFeed: RssFeed = {
            id: Math.random().toString(36).substring(7),
            name: newFeedName,
            url: newFeedUrl,
            status: 'active',
            lastSynced: new Date().toISOString()
        }

        try {
            const addedFeed = await addFeed(newFeed)
            if (addedFeed) {
                const updatedFeeds = await getFeeds()
                setFeeds(updatedFeeds)
                setNewFeedName('')
                setNewFeedUrl('')
                setIsAddFeedOpen(false)

                // Auto select and fetch
                setSelectedFeed(addedFeed.id)
                handleFetchArticles(addedFeed.id)
            }
        } catch (error) {
            console.error('Failed to add feed:', error)
            alert('Failed to add feed. Please try again.')
        }
    }

    const handleRemoveFeed = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation()

        try {
            await removeFeed(id)
            const updatedFeeds = await getFeeds()
            setFeeds(updatedFeeds)

            if (selectedFeed === id) {
                setSelectedFeed('')
                setArticles([])
            }
        } catch (error) {
            console.error('Failed to remove feed:', error)
            alert('Failed to remove feed. Please try again.')
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
            const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'
            // Auto-scrape full article content from backend URL
            const response = await fetch(`${API_BASE_URL}/scraper/scrape`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'ngrok-skip-browser-warning': 'true'
                },
                credentials: 'include',
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
        const hasSource = activeTab === 'idea' ? articleIdea.trim() : sourceContent.trim();

        if (!hasSource) {
            alert(activeTab === 'idea' ? 'Please enter your idea or keywords first' : 'Please select an article first')
            return
        }

        if (!selectedCategory) {
            alert('Silakan pilih kategori terlebih dahulu agar AI dapat menyisipkan internal link yang relevan.')
            return
        }

        setIsRewriting(true)
        setGeneratedContent('')
        setGeneratedTitle('')

        try {
            const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'
            const response = await fetch(`${API_BASE_URL}/ai/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'ngrok-skip-browser-warning': 'true'
                },
                credentials: 'include',
                body: JSON.stringify({
                    originalContent: activeTab === 'idea' ? articleIdea : sourceContent,
                    title: selectedArticle?.title || 'Rewritten Article',
                    sourceUrl: selectedArticle?.url || scrapeUrl || '',
                    feedItemId: selectedArticle?.id,
                    mode: activeTab === 'idea' ? 'idea' : 'rewrite',
                    categoryId: selectedCategory || undefined,
                    options: {
                        tone: aiTone,
                        length: aiLength === 'shorter' ? 'short' : aiLength === 'longer' ? 'long' : 'medium',
                    }
                }),
            })

            const result = await response.json()

            if (result.success && result.data) {
                setGeneratedContent(result.data.content)
                setGeneratedTitle(result.data.title)

                // Update SEO fields with AI generated values
                if (result.data.metaDescription) setMetaDescription(result.data.metaDescription)
                if (result.data.slug) setSlug(result.data.slug)
                if (result.data.title) setMetaTitle(result.data.title)

                if (result.data.articleId) {
                    setGeneratedArticleId(result.data.articleId)
                }
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
            const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'
            const response = await fetch(`${API_BASE_URL}/scraper/scrape`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'ngrok-skip-browser-warning': 'true'
                },
                credentials: 'include',
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
            const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

            const response = await fetch(`${API_BASE_URL}/wordpress/publish`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include', // Send session cookies
                body: JSON.stringify({
                    title: generatedTitle,
                    content: generatedContent,
                    status,
                    categories: selectedCategory ? [selectedCategory] : undefined,
                    sourceUrl: selectedArticle?.url || scrapeUrl || articleIdea || '',
                    originalContent: selectedArticle?.content || sourceContent || '',
                    feedItemId: selectedArticle?.id,
                    featuredImageUrl: featuredImage, // This can be a URL or a base64 from local upload
                    articleId: generatedArticleId,
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

    const handleGenerateImage = async () => {
        if (!generatedTitle) {
            alert('Please generate content first to provide context for the image')
            return
        }

        setIsGeneratingImage(true)
        try {
            // Check tokens (implicit in backend, but good to know)
            const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'
            const response = await fetch(`${API_BASE_URL}/ai/generate-image`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    prompt: `Professional featured image for a news article titled: "${generatedTitle}". Style: high quality, clean, related to the topic.`,
                }),
            })

            const result = await response.json()
            if (result.success && result.data?.imageUrl) {
                setFeaturedImage(result.data.imageUrl)
            } else {
                alert(`Image generation failed: ${result.error || 'Unknown error'}`)
            }
        } catch (error: any) {
            console.error('Image Gen error:', error)
            alert('Failed to generate image')
        } finally {
            setIsGeneratingImage(false)
        }
    }

    // SEO Helpers
    const slugify = (text: string) => {
        return text
            .toString()
            .toLowerCase()
            .trim()
            .replace(/\s+/g, '-')
            .replace(/[^\w\-]+/g, '')
            .replace(/\-\-+/g, '-')
    }

    const handleRefreshSEO = async () => {
        if (!generatedContent || !generatedTitle) {
            alert('Please generate content first')
            return
        }

        setIsRefreshingSEO(true)
        try {
            const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'
            const response = await fetch(`${API_BASE_URL}/ai/generate-seo`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    title: generatedTitle,
                    content: generatedContent,
                }),
            })

            const result = await response.json()
            if (result.metaTitle) setMetaTitle(result.metaTitle)
            if (result.metaDescription) setMetaDescription(result.metaDescription)
            if (result.slug) setSlug(result.slug)
        } catch (error) {
            console.error('SEO Refresh error:', error)
            // Fallback to local if AI fails
            setMetaTitle(generatedTitle)
            setSlug(slugify(generatedTitle))
            let desc = generatedContent.substring(0, 160)
            const lastSpace = desc.lastIndexOf(' ')
            if (lastSpace > 0) desc = desc.substring(0, lastSpace)
            setMetaDescription(desc + '...')
        } finally {
            setIsRefreshingSEO(false)
        }
    }

    // Auto-update SEO fields when content generates (only if empty)
    useEffect(() => {
        if (generatedTitle && !metaTitle) {
            setMetaTitle(generatedTitle)
        }
        if (generatedTitle && !slug) {
            setSlug(slugify(generatedTitle))
        }
    }, [generatedTitle, metaTitle, slug, setMetaTitle, setSlug])

    useEffect(() => {
        if (generatedContent && !metaDescription) {
            let desc = generatedContent.substring(0, 160)
            const lastSpace = desc.lastIndexOf(' ')
            if (lastSpace > 0) desc = desc.substring(0, lastSpace)
            setMetaDescription(desc + '...')
        }
    }, [generatedContent, metaDescription, setMetaDescription])

    // Schedule publish
    const handleSchedulePublish = async () => {
        if (!generatedContent || !generatedTitle || !scheduleDate || !scheduleTime) return

        setIsPublishing(true)

        try {
            // Combine date and time into ISO string
            const scheduledDateTime = new Date(`${scheduleDate}T${scheduleTime}`).toISOString()

            // Use relative path for client-side to leverage Next.js proxy
            const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

            const response = await fetch(`${API_BASE_URL}/wordpress/publish`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    title: generatedTitle,
                    content: generatedContent,
                    status: 'future',
                    categories: selectedCategory ? [selectedCategory] : undefined,
                    sourceUrl: selectedArticle?.url || scrapeUrl || articleIdea || '',
                    originalContent: selectedArticle?.content || sourceContent || '',
                    feedItemId: selectedArticle?.id,
                    featuredImageUrl: featuredImage,
                    articleId: generatedArticleId,
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
                        Select content to transform from Web Sources
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className="grid w-full grid-cols-3 mb-6">
                            <TabsTrigger value="rss" className="flex items-center gap-2">
                                <Rss className="h-4 w-4" />
                                Web Source
                            </TabsTrigger>
                            <TabsTrigger value="url" className="flex items-center gap-2">
                                <Globe className="h-4 w-4" />
                                Direct URL
                            </TabsTrigger>
                            <TabsTrigger value="idea" className="flex items-center gap-2">
                                <Sparkles className="h-4 w-4" />
                                Idea
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="rss" className="space-y-4">
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label>Select Source</Label>
                                    <Dialog open={isAddFeedOpen} onOpenChange={setIsAddFeedOpen}>
                                        <DialogTrigger asChild>
                                            <Button variant="ghost" size="sm" className="text-violet-600 h-6 px-2 hover:bg-violet-50">
                                                <Plus className="h-4 w-4 mr-1" /> Add Source
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent>
                                            <DialogHeader>
                                                <DialogTitle>Add New Web Source</DialogTitle>
                                                <DialogDescription>
                                                    Enter the URL of the feed you want to follow.
                                                </DialogDescription>
                                            </DialogHeader>
                                            <div className="space-y-4 py-4">
                                                <div className="space-y-2">
                                                    <Label>Source Name</Label>
                                                    <Input
                                                        placeholder="e.g. TechCrunch"
                                                        value={newFeedName}
                                                        onChange={(e) => setNewFeedName(e.target.value)}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Source URL</Label>
                                                    <Input
                                                        placeholder="https://example.com/feed"
                                                        value={newFeedUrl}
                                                        onChange={(e) => setNewFeedUrl(e.target.value)}
                                                    />
                                                </div>
                                            </div>
                                            <DialogFooter>
                                                <Button variant="outline" onClick={() => setIsAddFeedOpen(false)}>Cancel</Button>
                                                <Button onClick={handleAddFeed} disabled={!newFeedName || !newFeedUrl}>Add Source</Button>
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
                                        <SelectValue placeholder={isFetchingRSS ? "Fetching articles..." : "Choose an article..."} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {articles.map((article) => (
                                            <SelectItem key={article.id} value={article.id}>
                                                {article.title}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </TabsContent>

                        <TabsContent value="url" className="space-y-4">
                            <div className="space-y-2">
                                <Label>Article URL</Label>
                                <div className="flex gap-2">
                                    <Input
                                        placeholder="https://example.com/blog-post"
                                        value={scrapeUrl}
                                        onChange={(e) => setScrapeUrl(e.target.value)}
                                        className="flex-1"
                                    />
                                    <Button
                                        onClick={handleScrape}
                                        disabled={isScraping || !scrapeUrl}
                                        className="bg-violet-600 hover:bg-violet-700"
                                    >
                                        {isScraping ? <Loader2 className="h-4 w-4 animate-spin" /> : "Scrape"}
                                    </Button>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Enter a full article URL to scrape its content.
                                </p>
                            </div>
                        </TabsContent>

                        <TabsContent value="idea" className="space-y-4">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label>What should the article be about?</Label>
                                    <Textarea
                                        placeholder="e.g. 5 tips for morning productivity or The future of web development in 2024"
                                        value={articleIdea}
                                        onChange={(e) => setArticleIdea(e.target.value)}
                                        className="min-h-[100px]"
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Write down your keywords, topics, or a brief outline. AI will generate a fresh article based on this.
                                    </p>
                                </div>
                        </TabsContent>
                    </Tabs>
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

                        {/* Category (Moved for internal links) */}
                        <div className="space-y-2">
                            <Label className="text-sm font-medium flex items-center gap-1">
                                Category <span className="text-red-500">*</span>
                            </Label>
                            <Select
                                value={selectedCategory?.toString() || ''}
                                onValueChange={(val) => setSelectedCategory(parseInt(val))}
                                disabled={isFetchingCategories || wpCategories.length === 0}
                            >
                                <SelectTrigger className={`h-10 ${!selectedCategory ? 'border-amber-200 bg-amber-50/10' : ''}`}>
                                    <SelectValue placeholder={isFetchingCategories ? "Loading categories..." : wpCategories.length > 0 ? "Select category" : "No categories found"} />
                                </SelectTrigger>
                                <SelectContent position="popper" sideOffset={4}>
                                    {wpCategories.map(category => (
                                        <SelectItem key={category.id} value={category.id.toString()}>
                                            {category.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <p className="text-[10px] text-muted-foreground leading-tight">Wajib dipilih agar AI bisa menyisipkan internal link "Baca Juga" yang relevan.</p>
                        </div>
                    </div>

                    <div className="flex items-end">
                        <Button
                            className="w-full h-10 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700"
                            onClick={handleAIRewrite}
                            disabled={(activeTab === 'idea' ? !articleIdea.trim() : !sourceContent) || isRewriting}
                        >
                            {isRewriting ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Generating...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="h-4 w-4 mr-2" />
                                    Generate Article
                                </>
                            )}
                        </Button>
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
                        <div className="relative bg-muted rounded-lg p-4 min-h-[400px] max-h-[600px] overflow-auto flex flex-col">
                            {isScanning || isScraping ? (
                                <div className="flex-1 flex flex-col items-center justify-center py-12">
                                    <div className="relative">
                                        <div className="h-12 w-12 rounded-full border-4 border-violet-100 dark:border-violet-900/30"></div>
                                        <div className="absolute top-0 left-0 h-12 w-12 rounded-full border-4 border-violet-600 border-t-transparent animate-spin"></div>
                                    </div>
                                    <p className="mt-4 text-sm font-medium text-muted-foreground animate-pulse">Fetching content...</p>
                                </div>
                            ) : sourceContent ? (
                                <pre className="whitespace-pre-wrap text-sm font-mono">{sourceContent}</pre>
                            ) : (
                                <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
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
                    <CardHeader className="pb-3 flex flex-row items-center justify-between">
                        <CardTitle className="text-lg">SEO Preview</CardTitle>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleRefreshSEO}
                            disabled={isRefreshingSEO || !generatedContent}
                            title="Regenerate SEO with AI"
                        >
                            <RefreshCw className={`h-4 w-4 ${isRefreshingSEO ? 'animate-spin' : ''}`} />
                        </Button>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Meta Title</Label>
                            <Input
                                value={metaTitle || generatedTitle || ""}
                                onChange={(e) => setMetaTitle(e.target.value)}
                                placeholder="Article Title"
                            />
                            <p className="text-xs text-muted-foreground">Characters: {(metaTitle || generatedTitle || "").length}/60</p>
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
                                value={metaDescription}
                                onChange={(e) => setMetaDescription(e.target.value)}
                                placeholder="AI generated description..."
                                className="resize-none"
                                rows={3}
                            />
                            <p className="text-xs text-muted-foreground">Ideal: 150-160 characters</p>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <Label className="text-sm font-medium">Featured Image (Gambar Utama)</Label>
                                {featuredImage && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setFeaturedImage('')}
                                        className="h-7 text-xs text-red-500 hover:text-red-600 hover:bg-red-50"
                                    >
                                        <Trash2 className="h-3 w-3 mr-1" /> Remove
                                    </Button>
                                )}
                            </div>

                            {!featuredImage ? (
                                <div className="grid grid-cols-1 gap-3">
                                    <div className="relative">
                                        <Button
                                            variant="outline"
                                            className="w-full h-32 flex flex-col items-center justify-center gap-3 border-dashed border-2 hover:bg-violet-50 hover:border-violet-200 transition-all"
                                            onClick={() => document.getElementById('featured-image-upload')?.click()}
                                        >
                                            <div className="p-3 bg-violet-100 rounded-full text-violet-600">
                                                <ImageIcon className="h-6 w-6" />
                                            </div>
                                            <div className="text-center">
                                                <span className="text-sm font-medium block">Click to upload image</span>
                                                <span className="text-xs text-muted-foreground">SVG, PNG, JPG or GIF (max. 800x400px)</span>
                                            </div>
                                        </Button>
                                        <input
                                            id="featured-image-upload"
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0]
                                                if (file) {
                                                    const reader = new FileReader();
                                                    reader.onloadend = () => {
                                                        setFeaturedImage(reader.result as string);
                                                    };
                                                    reader.readAsDataURL(file);
                                                }
                                            }}
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div className="relative rounded-lg border-2 border-violet-100 overflow-hidden group aspect-video">
                                    <img src={featuredImage} alt="Featured" className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            onClick={() => document.getElementById('featured-image-upload-change')?.click()}
                                        >
                                            Ganti Gambar
                                        </Button>
                                        <input
                                            id="featured-image-upload-change"
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0]
                                                if (file) {
                                                    const reader = new FileReader();
                                                    reader.onloadend = () => {
                                                        setFeaturedImage(reader.result as string);
                                                    };
                                                    reader.readAsDataURL(file);
                                                }
                                            }}
                                        />
                                    </div>
                                </div>
                            )}
                            <p className="text-[10px] text-center text-muted-foreground uppercase tracking-wider font-semibold">
                                Recommended: 1200x630px · JPG, PNG, or WEBP
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Actions */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg">Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">

                        {/* Category moved to AI Config */}

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


                    </CardContent>
                </Card>
            </div>
        </div >
    )
}
