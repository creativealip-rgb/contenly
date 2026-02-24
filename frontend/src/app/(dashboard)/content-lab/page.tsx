'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { getActiveSite } from '@/lib/sites-store'
import { migrateLocalStorageFeeds } from '@/lib/migrate-feeds'
import { useContentLabStore } from '@/stores/content-lab-store'

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
        handleSelectArticle: ai.handleSelectArticle,
        handleScrape: ai.handleScrape,
        handleAIRewrite: () => ai.handleAIRewrite(wp.selectedCategory),
        handleGenerateImage: ai.handleGenerateImage
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
