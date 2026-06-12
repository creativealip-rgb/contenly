import { create } from 'zustand'

export interface Article {
    id: string
    title: string
    url?: string
    content?: string
    excerpt?: string
    description?: string
    pubDate?: string
    sourceUrl?: string
    generatedContent?: string
    originalContent?: string
    metaTitle?: string
    metaDescription?: string
    slug?: string
    featuredImageUrl?: string
    status?: string
}

interface ContentLabState {
    // Content State
    generatedContent: string
    generatedTitle: string
    sourceContent: string
    selectedArticle: Article | null
    generatedArticleId: string | null
    featuredImage: string

    // SEO & Image State
    activeTab: string
    scrapeUrl: string
    articleIdea: string
    slug: string
    metaTitle: string
    metaDescription: string

    // AI Options
    aiTone: 'professional' | 'casual' | 'creative' | 'technical'
    aiStyle: 'blog' | 'news' | 'tutorial' | 'review'
    aiLength: 'shorter' | 'same' | 'longer'

    // Publish State
    publishResult: { success: boolean; message: string; link?: string } | null

    // Actions
    setGeneratedContent: (content: string) => void
    setGeneratedTitle: (title: string) => void
    setSourceContent: (content: string) => void
    setSelectedArticle: (article: Article | null) => void
    setGeneratedArticleId: (id: string | null) => void
    setFeaturedImage: (url: string) => void
    setActiveTab: (tab: string) => void
    setScrapeUrl: (url: string) => void
    setArticleIdea: (idea: string) => void
    setSlug: (slug: string) => void
    setMetaTitle: (title: string) => void
    setMetaDescription: (desc: string) => void
    setAiTone: (tone: 'professional' | 'casual' | 'creative' | 'technical') => void
    setAiStyle: (style: 'blog' | 'news' | 'tutorial' | 'review') => void
    setAiLength: (length: 'shorter' | 'same' | 'longer') => void
    setPublishResult: (result: { success: boolean; message: string; link?: string } | null) => void

    // Wizard State
    currentStep: number
    sourceType: 'feed' | 'url' | 'idea' | null
    maxReachedStep: number
    setCurrentStep: (step: number) => void
    setSourceType: (type: 'feed' | 'url' | 'idea') => void
    setMaxReachedStep: (step: number) => void

    // Reset
    reset: () => void
}

export const useContentLabStore = create<ContentLabState>((set) => ({
    // Initial State
    generatedContent: '',
    generatedTitle: '',
    sourceContent: '',
    selectedArticle: null,
    generatedArticleId: null,
    featuredImage: '',

    activeTab: 'rss',
    scrapeUrl: '',
    articleIdea: '',
    slug: '',
    metaTitle: '',
    metaDescription: '',

    aiTone: 'professional',
    aiStyle: 'blog',
    aiLength: 'same',

    publishResult: null,

    // Wizard State
    currentStep: 1,
    sourceType: null,
    maxReachedStep: 1,

    // Setters
    setGeneratedContent: (generatedContent) => set({ generatedContent }),
    setGeneratedTitle: (generatedTitle) => set({ generatedTitle }),
    setSourceContent: (sourceContent) => set({ sourceContent }),
    setSelectedArticle: (selectedArticle) => set({ selectedArticle }),
    setGeneratedArticleId: (generatedArticleId) => set({ generatedArticleId }),
    setFeaturedImage: (featuredImage) => set({ featuredImage }),
    setActiveTab: (activeTab) => set({ activeTab }),
    setScrapeUrl: (scrapeUrl) => set({ scrapeUrl }),
    setArticleIdea: (articleIdea) => set({ articleIdea }),
    setSlug: (slug) => set({ slug }),
    setMetaTitle: (metaTitle) => set({ metaTitle }),
    setMetaDescription: (metaDescription) => set({ metaDescription }),
    setAiTone: (aiTone) => set({ aiTone }),
    setAiStyle: (aiStyle) => set({ aiStyle }),
    setAiLength: (aiLength) => set({ aiLength }),
    setPublishResult: (publishResult) => set({ publishResult }),

    setCurrentStep: (currentStep) => set({ currentStep }),
    setSourceType: (sourceType) => set({
        sourceType,
        activeTab: sourceType === 'feed' ? 'rss' : sourceType === 'url' ? 'url' : 'idea',
        generatedContent: '',
        generatedTitle: '',
        sourceContent: '',
        selectedArticle: null,
        generatedArticleId: null,
        featuredImage: '',
        slug: '',
        metaTitle: '',
        metaDescription: '',
        publishResult: null,
    }),
    setMaxReachedStep: (maxReachedStep) => set({ maxReachedStep }),

    // Reset Action (Optional, if we needed manual reset)
    reset: () => set({
        generatedContent: '',
        generatedTitle: '',
        sourceContent: '',
        selectedArticle: null,
        generatedArticleId: null,
        featuredImage: '',
        activeTab: 'rss',
        scrapeUrl: '',
        articleIdea: '',
        slug: '',
        metaTitle: '',
        metaDescription: '',
        aiTone: 'professional',
        aiStyle: 'blog',
        aiLength: 'same',
        publishResult: null,
        currentStep: 1,
        sourceType: null,
        maxReachedStep: 1
    })
}))
