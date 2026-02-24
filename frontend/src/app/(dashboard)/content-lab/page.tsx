'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
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
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from '@/components/ui/tabs'
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
    Globe,
    Plus,
    Trash2
} from 'lucide-react'
import { toast } from 'sonner'
import { WordPressSite, getSites, getActiveSite } from '@/lib/sites-store'
import { RssFeed, getFeeds, addFeed, removeFeed } from '@/lib/feeds-store'
import { migrateLocalStorageFeeds } from '@/lib/migrate-feeds'
import { useContentLabStore } from '@/stores/content-lab-store'

// New Components
import { SourceSidebar } from './components/SourceSidebar'
import { ContentEditor } from './components/ContentEditor'
import { ToolsPanel } from './components/ToolsPanel'
import { ContentLabState, ContentLabHandlers } from './components/types'

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

    // Local UI State
    const [selectedFeed, setSelectedFeed] = useState('')
    const [isScanning, setIsScanning] = useState(false)
    const [isScraping, setIsScraping] = useState(false)
    const [isRewriting, setIsRewriting] = useState(false)
    const [copied, setCopied] = useState(false)
    const [isPublishing, setIsPublishing] = useState(false)
    const [isRefreshingSEO, setIsRefreshingSEO] = useState(false)
    const [isGeneratingImage, setIsGeneratingImage] = useState(false)
    const [isScheduleOpen, setIsScheduleOpen] = useState(false)
    const [scheduleDate, setScheduleDate] = useState('')
    const [scheduleTime, setScheduleTime] = useState('')
    const [wpCategories, setWpCategories] = useState<Array<{ id: number; name: string }>>([])
    const [selectedCategory, setSelectedCategory] = useState<number | null>(null)
    const [isFetchingCategories, setIsFetchingCategories] = useState(false)
    const [sites, setSites] = useState<WordPressSite[]>([])
    const [feeds, setFeeds] = useState<RssFeed[]>([])
    const [articles, setArticles] = useState<any[]>([])
    const [isFetchingRSS, setIsFetchingRSS] = useState(false)
    const [isAddFeedOpen, setIsAddFeedOpen] = useState(false)
    const [newFeedUrl, setNewFeedUrl] = useState('')
    const [newFeedName, setNewFeedName] = useState('')

    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'

    // Initial Load
    useEffect(() => {
        const loadData = async () => {
            const fetchedSites = await getSites()
            setSites(fetchedSites)
            await migrateLocalStorageFeeds()
            const fetchedFeeds = await getFeeds()
            setFeeds(fetchedFeeds)

            const activeSite = await getActiveSite()
            if (!activeSite) return

            setIsFetchingCategories(true)
            try {
                const response = await fetch(`${API_BASE_URL}/wordpress/sites/${activeSite.id}/categories`, {
                    credentials: 'include',
                    headers: { 'ngrok-skip-browser-warning': 'true' }
                })
                if (response.ok) {
                    const categories = await response.json()
                    if (Array.isArray(categories)) setWpCategories(categories)
                }
            } catch (error) {
                console.error('Failed to fetch categories:', error)
            } finally {
                setIsFetchingCategories(false)
            }
        }
        loadData()
    }, [])

    useEffect(() => {
        if (selectedFeed) handleFetchArticles(selectedFeed)
    }, [selectedFeed])

    // Logic Handlers
    const handleFetchArticles = async (feedId: string) => {
        const feed = feeds.find(f => f.id === feedId)
        if (!feed) return
        setIsFetchingRSS(true)
        setArticles([])
        try {
            const response = await fetch('/api/rss', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: feed.url }),
            })
            const data = await response.json()
            if (data.success) setArticles(data.items)
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
                setSelectedFeed(addedFeed.id)
                handleFetchArticles(addedFeed.id)
            }
        } catch (error) {
            console.error('Failed to add feed:', error)
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
        }
    }

    const handleSelectArticle = async (article: any) => {
        setSelectedArticle(article)
        setIsScanning(true)
        try {
            const response = await fetch(`${API_BASE_URL}/scraper/scrape`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' },
                credentials: 'include',
                body: JSON.stringify({ url: article.url })
            })
            const result = await response.json()
            if (result.success && result.data) {
                setSourceContent(result.data.content || '')
            } else {
                setSourceContent(`# ${article.title}\n\n${article.excerpt || article.description || ''}\n\nSource: ${article.url}`)
            }
        } catch (error) {
            setSourceContent(`# ${article.title}\n\n${article.excerpt || article.description || ''}\n\nSource: ${article.url}`)
        } finally {
            setIsScanning(false)
        }
    }

    const handleAIRewrite = async () => {
        const hasSource = activeTab === 'idea' ? articleIdea.trim() : sourceContent.trim();
        if (!hasSource) {
            alert(activeTab === 'idea' ? 'Harap masukkan ide Anda terlebih dahulu' : 'Harap pilih artikel terlebih dahulu')
            return
        }
        if (!selectedCategory) {
            alert('Silakan pilih kategori terlebih dahulu.')
            return
        }
        setIsRewriting(true)
        setGeneratedContent('')
        setGeneratedTitle('')
        try {
            const response = await fetch(`${API_BASE_URL}/ai/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' },
                credentials: 'include',
                body: JSON.stringify({
                    originalContent: activeTab === 'idea' ? articleIdea : sourceContent,
                    title: selectedArticle?.title || 'Rewritten Article',
                    sourceUrl: selectedArticle?.url || scrapeUrl || '',
                    mode: activeTab === 'idea' ? 'idea' : 'rewrite',
                    categoryId: selectedCategory,
                    options: {
                        tone: aiTone,
                        length: aiLength === 'shorter' ? 'short' : aiLength === 'longer' ? 'long' : 'medium'
                    }
                }),
            })
            const result = await response.json()
            if (result.success && result.data) {
                setGeneratedContent(result.data.content)
                setGeneratedTitle(result.data.title)
                if (result.data.metaDescription) setMetaDescription(result.data.metaDescription)
                if (result.data.slug) setSlug(result.data.slug)
                if (result.data.title) setMetaTitle(result.data.title)
            }
        } catch (error) {
            console.error('AI Rewrite error:', error)
        } finally {
            setIsRewriting(false)
        }
    }

    const handleScrape = async () => {
        if (!scrapeUrl) return
        setIsScraping(true)
        setSourceContent('')
        try {
            const response = await fetch(`${API_BASE_URL}/scraper/scrape`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' },
                credentials: 'include',
                body: JSON.stringify({ url: scrapeUrl })
            })
            const result = await response.json()
            if (result.success) {
                const content = result.data.content || result.data.excerpt || ''
                setSourceContent(content)
                setSelectedArticle({ id: 'scraped-' + Date.now(), title: result.data.title, url: result.data.url })
                setGeneratedTitle(result.data.title)
            }
        } catch (error) {
            console.error("Scrape error:", error)
        } finally {
            setIsScraping(false)
        }
    }

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
            alert('Harap buat konten terlebih dahulu')
            return
        }

        setIsRefreshingSEO(true)
        try {
            const response = await fetch(`${API_BASE_URL}/ai/generate-seo`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' },
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

    const handlePublishNow = async (status: 'draft' | 'publish') => {
        if (!generatedContent || !generatedTitle) return

        setIsPublishing(true)
        setPublishResult(null)

        try {
            const response = await fetch(`${API_BASE_URL}/wordpress/publish`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    title: generatedTitle,
                    content: generatedContent,
                    status,
                    categories: selectedCategory ? [selectedCategory] : undefined,
                    sourceUrl: selectedArticle?.url || scrapeUrl || '',
                    originalContent: selectedArticle?.content || sourceContent || '',
                    feedItemId: selectedArticle?.id,
                    featuredImageUrl: featuredImage,
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
                toast.success(status === 'publish' ? 'Berhasil dipublish!' : 'Draft tersimpan!')
            } else {
                setPublishResult({
                    success: false,
                    message: data.error || 'Gagal mempublish artikel',
                })
                toast.error('Gagal mempublish')
            }
        } catch (error: any) {
            setPublishResult({
                success: false,
                message: error.message || 'Terjadi kesalahan',
            })
            toast.error('Terjadi kesalahan')
        } finally {
            setIsPublishing(false)
        }
    }

    const handleSchedulePublish = async () => {
        if (!generatedContent || !generatedTitle || !scheduleDate || !scheduleTime) return

        setIsPublishing(true)

        try {
            const scheduledDateTime = new Date(`${scheduleDate}T${scheduleTime}`).toISOString()

            const response = await fetch(`${API_BASE_URL}/wordpress/publish`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    title: generatedTitle,
                    content: generatedContent,
                    status: 'future',
                    categories: selectedCategory ? [selectedCategory] : undefined,
                    sourceUrl: selectedArticle?.url || scrapeUrl || '',
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
                toast.success('Berhasil dijadwalkan!')
            } else {
                setPublishResult({
                    success: false,
                    message: data.error || 'Gagal menjadwalkan artikel',
                })
                toast.error('Gagal menjadwalkan')
            }
        } catch (error: any) {
            setPublishResult({
                success: false,
                message: error.message || 'Terjadi kesalahan',
            })
            toast.error('Terjadi kesalahan')
        } finally {
            setIsPublishing(false)
        }
    }

    const handleGenerateImage = async () => {
        if (!generatedTitle) {
            toast.error('Harap buat konten terlebih dahulu')
            return
        }

        setIsGeneratingImage(true)
        try {
            const response = await fetch(`${API_BASE_URL}/ai/generate-image`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' },
                credentials: 'include',
                body: JSON.stringify({
                    prompt: `Professional featured image for a blog post titled: ${generatedTitle}. High quality, cinematic, photorealistic, no text.`
                })
            })
            const data = await response.json()
            if (data.success && data.data?.imageUrl) {
                setFeaturedImage(data.data.imageUrl)
                toast.success('Berhasil membuat gambar utama!')
            } else if (data.imageUrl) { // Support both API formats found in conflicts
                setFeaturedImage(data.imageUrl)
                toast.success('Berhasil membuat gambar utama!')
            } else {
                toast.error('Gagal membuat gambar')
            }
        } catch (error) {
            console.error('Image Gen error:', error)
            toast.error('Gagal membuat gambar')
        } finally {
            setIsGeneratingImage(false)
        }
    }

    const handleCopy = () => {
        navigator.clipboard.writeText(generatedContent)
        setCopied(true)
        toast.success('Disalin ke papan klip!')
        setTimeout(() => setCopied(false), 2000)
    }

    const state: ContentLabState = {
        wpCategories, selectedCategory, isFetchingCategories, sites,
        feeds, articles, selectedArticle, selectedFeed, isFetchingRSS, isAddFeedOpen,
        newFeedUrl, newFeedName, isScanning, isScraping, isRewriting, activeTab,
        isRefreshingSEO, isPublishing, isGeneratingImage
    }

    const handlers: ContentLabHandlers = {
        setFeeds, setArticles, setSelectedFeed, setIsFetchingRSS, setIsAddFeedOpen,
        setNewFeedUrl, setNewFeedName, setIsScanning, setIsScraping, setIsRewriting, setActiveTab, setSelectedCategory,
        handleFetchArticles, handleAddFeed, handleRemoveFeed, handleSelectArticle, handleScrape, handleAIRewrite, handleGenerateImage
    }

    return (
        <div className="h-[calc(100vh-180px)] min-h-[600px] px-4 md:px-0">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] h-full gap-4 lg:gap-8">
                {/* Left Panel: Main Editor */}
                <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-2xl border border-white/60 dark:border-slate-800/60 rounded-[40px] p-6 lg:p-10 overflow-y-auto custom-scrollbar shadow-2xl shadow-slate-200/50 dark:shadow-none border-t-white/40 relative order-2 lg:order-1">
                    <ContentEditor state={state} handlers={handlers} copied={copied} handleCopy={handleCopy} />
                </div>

                {/* Right Panel: Consolidated Tabbed Sidebar */}
                <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border border-white/40 dark:border-slate-800/60 rounded-[32px] overflow-hidden flex flex-col shadow-inner order-1 lg:order-2">
                    <Tabs defaultValue="sources" className="flex flex-col h-full">
                        <div className="px-6 pt-6 pb-2">
                            <TabsList className="grid w-full grid-cols-2 rounded-2xl bg-white/50 dark:bg-slate-800/50 p-1.5 h-12">
                                <TabsTrigger
                                    value="sources"
                                    className="rounded-xl font-bold data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm transition-all"
                                >
                                    Sumber Daya
                                </TabsTrigger>
                                <TabsTrigger
                                    value="tools"
                                    className="rounded-xl font-bold data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm transition-all"
                                >
                                    Alat AI
                                </TabsTrigger>
                            </TabsList>
                        </div>

                        <div className="flex-1 overflow-y-auto px-6 pb-6 custom-scrollbar">
                            <TabsContent value="sources" className="mt-0 h-full">
                                <SourceSidebar state={state} handlers={handlers} />
                            </TabsContent>
                            <TabsContent value="tools" className="mt-0 space-y-6">
                                <ToolsPanel
                                    state={state}
                                    handlers={handlers}
                                    isRefreshingSEO={isRefreshingSEO}
                                    handleRefreshSEO={handleRefreshSEO}
                                    handlePublishNow={handlePublishNow}
                                    isPublishing={isPublishing}
                                    isScheduleOpen={isScheduleOpen}
                                    setIsScheduleOpen={setIsScheduleOpen}
                                    scheduleDate={scheduleDate}
                                    setScheduleDate={setScheduleDate}
                                    scheduleTime={scheduleTime}
                                    setScheduleTime={setScheduleTime}
                                    handleSchedulePublish={handleSchedulePublish}
                                    isGeneratingImage={isGeneratingImage}
                                    handleGenerateImage={handleGenerateImage}
                                />
                            </TabsContent>
                        </div>
                    </Tabs>
                </div>
            </div>
        </div>
    )
}
