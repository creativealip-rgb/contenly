'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { getActiveSite } from '@/lib/sites-store'
import { migrateLocalStorageFeeds } from '@/lib/migrate-feeds'
import { useContentLabStore } from '@/stores/content-lab-store'
import { Badge } from '@/components/ui/badge'
import { Loader2 } from 'lucide-react'

// New Components & Hooks
import { SourceSidebar } from './components/SourceSidebar'
import { ContentEditor } from './components/ContentEditor'
import { ToolsPanel } from './components/ToolsPanel'
import { ContentLabState, ContentLabHandlers } from './components/types'
import { useRSS } from './hooks/useRSS'
import { useWordPress } from './hooks/useWordPress'
import { useAIContent } from './hooks/useAIContent'

export default function ContentLabPage() {
    // Global Store State
    const { generatedContent } = useContentLabStore()

    // Custom Hooks
    const rss = useRSS()
    const wp = useWordPress()
    const ai = useAIContent()

    // Local UI State (Remaining)
    const [copied, setCopied] = useState(false)
    const [rightPanelTab, setRightPanelTab] = useState<'sources' | 'tools'>('sources')

    // Initial Load & Orchestration
    useEffect(() => {
        const init = async () => {
            await wp.loadSites()
            await migrateLocalStorageFeeds()
            await rss.loadFeeds()

            const activeSite = await getActiveSite()
            if (activeSite) {
                await wp.fetchCategories(activeSite.id)
            }
        }
        init()
    }, [wp.loadSites, rss.loadFeeds, wp.fetchCategories])

    // UI Handlers
    const handleCopy = () => {
        navigator.clipboard.writeText(generatedContent)
        setCopied(true)
        toast.success('Disalin ke papan klip!')
        setTimeout(() => setCopied(false), 2000)
    }

    // Prepare state and handlers for sub-components (Backward Compatibility)
    const state: ContentLabState = {
        wpCategories: wp.wpCategories,
        selectedCategory: wp.selectedCategory,
        isFetchingCategories: wp.isFetchingCategories,
        sites: wp.sites,
        feeds: rss.feeds,
        articles: rss.articles,
        selectedFeed: rss.selectedFeed,
        isFetchingRSS: rss.isFetchingRSS,
        isAddFeedOpen: rss.isAddFeedOpen,
        newFeedUrl: rss.newFeedUrl,
        newFeedName: rss.newFeedName,
        isScanning: ai.isScanning,
        isScraping: ai.isScraping,
        isRewriting: ai.isRewriting,
        activeTab: useContentLabStore.getState().activeTab,
        isRefreshingSEO: ai.isRefreshingSEO,
        isPublishing: wp.isPublishing,
        isGeneratingImage: ai.isGeneratingImage,
        selectedArticle: useContentLabStore.getState().selectedArticle
    }

    const handlers: ContentLabHandlers = {
        setFeeds: () => { }, // No longer needed as handled by hook
        setArticles: () => { },
        setSelectedFeed: rss.setSelectedFeed,
        setIsFetchingRSS: rss.setIsFetchingRSS,
        setIsAddFeedOpen: rss.setIsAddFeedOpen,
        setNewFeedUrl: rss.setNewFeedUrl,
        setNewFeedName: rss.setNewFeedName,
        setIsScanning: () => { },
        setIsScraping: () => { },
        setIsRewriting: () => { },
        setActiveTab: useContentLabStore.getState().setActiveTab,
        setSelectedCategory: wp.setSelectedCategory,
        handleFetchArticles: rss.handleFetchArticles,
        handleAddFeed: rss.handleAddFeed,
        handleRemoveFeed: async (e, id) => { e.stopPropagation(); await rss.handleRemoveFeed(id); },
        handleSelectArticle: async (article: any) => {
            await ai.handleSelectArticle(article)
            setRightPanelTab('tools')
        },
        handleScrape: async () => {
            await ai.handleScrape()
            setRightPanelTab('tools')
        },
        handleAIRewrite: () => ai.handleAIRewrite(wp.selectedCategory),
        handleGenerateImage: ai.handleGenerateImage
    }

    return (
        <div className="h-[calc(100vh-180px)] min-h-[600px] px-4 md:px-0 flex flex-col">
            {/* Header with Status */}
            <div className="mb-6 flex items-center justify-between flex-shrink-0">
                <div className="space-y-1">
                    <h1 className="text-4xl font-black tracking-tighter bg-gradient-to-r from-slate-900 to-slate-500 dark:from-white dark:to-slate-400 bg-clip-text text-transparent">
                        Content Lab
                    </h1>
                    <p className="text-sm font-medium text-slate-500">Tulis dan sempurnakan konten unik Anda</p>
                </div>
                <div className="flex items-center gap-3">
                    {(state.isRewriting || state.isScraping || state.isPublishing || state.isGeneratingImage || state.isRefreshingSEO) && (
                        <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200 gap-1">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            Memproses...
                        </Badge>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-4 flex-1 min-h-0">
                {/* Left Panel: Editor (Wider) */}
                <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-2xl border border-white/60 dark:border-slate-800/60 rounded-[40px] p-6 lg:p-10 overflow-y-auto shadow-2xl shadow-slate-200/50 dark:shadow-none flex-1 min-h-0">
                    <ContentEditor state={state} handlers={handlers} copied={copied} handleCopy={handleCopy} />
                </div>

                {/* Right Panel: Tabbed Sidebar (Sources & Tools) */}
                <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border border-white/40 dark:border-slate-800/60 rounded-3xl overflow-hidden flex flex-col shadow-xl order-1 lg:order-2">
                    <Tabs value={rightPanelTab} onValueChange={(v) => setRightPanelTab(v as 'sources' | 'tools')} className="flex flex-col h-full">
                        <div className="px-4 pt-4 pb-2">
                            <TabsList className="grid w-full grid-cols-2 rounded-xl bg-white/50 dark:bg-slate-800/50 p-1 h-10">
                                <TabsTrigger
                                    value="sources"
                                    className="rounded-lg font-bold text-xs data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm transition-all"
                                >
                                    Sumber Daya
                                </TabsTrigger>
                                <TabsTrigger
                                    value="tools"
                                    className="rounded-lg font-bold text-xs data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm transition-all"
                                >
                                    Alat AI
                                </TabsTrigger>
                            </TabsList>
                        </div>

                        <div className="flex-1 overflow-y-auto px-4 pb-4 custom-scrollbar">
                            <TabsContent value="sources" className="mt-0 h-full">
                                <SourceSidebar state={state} handlers={handlers} />
                            </TabsContent>
                            <TabsContent value="tools" className="mt-0 space-y-4">
                                <ToolsPanel
                                    state={state}
                                    handlers={handlers}
                                    isRefreshingSEO={ai.isRefreshingSEO}
                                    handleRefreshSEO={ai.handleRefreshSEO}
                                    handlePublishNow={wp.handlePublishNow}
                                    isPublishing={wp.isPublishing}
                                    isScheduleOpen={wp.isScheduleOpen}
                                    setIsScheduleOpen={wp.setIsScheduleOpen}
                                    scheduleDate={wp.scheduleDate}
                                    setScheduleDate={wp.setScheduleDate}
                                    scheduleTime={wp.scheduleTime}
                                    setScheduleTime={wp.setScheduleTime}
                                    handleSchedulePublish={wp.handleSchedulePublish}
                                    isGeneratingImage={ai.isGeneratingImage}
                                    handleGenerateImage={ai.handleGenerateImage}
                                />
                            </TabsContent>
                        </div>
                    </Tabs>
                </div>
            </div>
        </div>
    )
}
