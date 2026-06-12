/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { getActiveSite } from '@/lib/sites-store'
import { migrateLocalStorageFeeds } from '@/lib/migrate-feeds'
import { useContentLabStore } from '@/stores/content-lab-store'
import { Badge } from '@/components/ui/badge'
import { Loader2 } from 'lucide-react'

// New Wizard Components
import { WizardStepper } from './components/WizardStepper'
import { Step1Source } from './components/steps/Step1Source'
import { Step2Article } from './components/steps/Step2Article'
import { Step3Generate } from './components/steps/Step3Generate'
import { Step4EditPublish } from './components/steps/Step4EditPublish'

// Hooks
import { ContentLabState, ContentLabHandlers } from './components/types'
import { useRSS } from './hooks/useRSS'
import { useWordPress } from './hooks/useWordPress'
import { useAIContent } from './hooks/useAIContent'
import { useAutoSaveDraft } from './hooks/useAutoSaveDraft'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'

export default function ContentLabPage() {
    // Global Store
    const { generatedContent, currentStep, setCurrentStep, maxReachedStep, setMaxReachedStep } = useContentLabStore()
    const searchParams = useSearchParams()
    const loadArticleId = searchParams.get('id')

    // Custom Hooks
    const rss = useRSS()
    const wp = useWordPress()
    const ai = useAIContent()
    const { isSaving } = useAutoSaveDraft()

    // Local UI State
    const [copied, setCopied] = useState(false)

    // Load existing article from ?id= param → skip to step 4
    useEffect(() => {
        if (!loadArticleId) return
        const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api/v1'
        const load = async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/articles/${loadArticleId}`, { credentials: 'include' })
                if (!res.ok) return
                const article = await res.json()
                const store = useContentLabStore.getState()
                store.setGeneratedContent(article.generatedContent || '')
                store.setGeneratedTitle(article.title || '')
                store.setSourceContent(article.originalContent || '')
                store.setMetaTitle(article.metaTitle || '')
                store.setMetaDescription(article.metaDescription || '')
                store.setSlug(article.slug || '')
                store.setGeneratedArticleId(article.id)
                store.setFeaturedImage(article.featuredImageUrl || '')
                store.setSelectedArticle(article.sourceUrl ? { id: article.id, title: article.title, url: article.sourceUrl } : null)
                // Skip to step 4
                setCurrentStep(4)
                setMaxReachedStep(4)
            } catch { /* ignore */ }
        }
        load()
    }, [loadArticleId])

    // Initial Load
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

    // Prepare state and handlers
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
        selectedArticle: useContentLabStore.getState().selectedArticle,
        sourceType: useContentLabStore.getState().sourceType
    }

    const handlers: ContentLabHandlers = {
        setFeeds: () => { },
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
        },
        handleScrape: async () => {
            await ai.handleScrape()
        },
        handleAIRewrite: () => ai.handleAIRewrite(wp.selectedCategory),
        handleGenerateImage: ai.handleGenerateImage
    }

    // Keyboard shortcuts
    useKeyboardShortcuts({
        onRegenerate: () => handlers.handleAIRewrite(),
        onCopy: () => {
            navigator.clipboard.writeText(generatedContent)
            toast.success('Disalin ke papan klip!')
        },
    })

    return (
        <div className="h-[calc(100vh-180px)] min-h-[600px] px-4 md:px-0 flex flex-col">
            {/* Header */}
            <div className="mb-4 flex items-center justify-between flex-wrap gap-3 flex-shrink-0">
                <div className="space-y-1">
                    <h1 className="text-2xl md:text-4xl font-black tracking-tighter bg-gradient-to-r from-slate-900 to-slate-500 dark:from-white dark:to-slate-400 bg-clip-text text-transparent">
                        Content Lab
                    </h1>
                    <p className="text-sm font-medium text-slate-500">Tulis dan sempurnakan konten unik Anda</p>
                </div>
                <div className="flex items-center gap-3">
                    {isSaving && (
                        <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-200 gap-1 text-[10px]">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            Menyimpan...
                        </Badge>
                    )}
                    {(state.isRewriting || state.isScraping || state.isPublishing || state.isGeneratingImage || state.isRefreshingSEO) && (
                        <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200 gap-1" role="status">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            Memproses...
                        </Badge>
                    )}
                </div>
            </div>

            {/* Wizard Stepper */}
            <WizardStepper
                currentStep={currentStep}
                maxReachedStep={maxReachedStep}
                onStepClick={setCurrentStep}
            />

            {/* Step Content */}
            <div className="flex-1 min-h-0">
                {currentStep === 1 && <Step1Source />}
                {currentStep === 2 && <Step2Article state={state} handlers={handlers} />}
                {currentStep === 3 && <Step3Generate state={state} handlers={handlers} />}
                {currentStep === 4 && (
                    <Step4EditPublish
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
                )}
            </div>
        </div>
    )
}
