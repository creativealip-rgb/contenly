'use client'

import { useState, useCallback } from 'react'
import { useContentLabStore } from '@/stores/content-lab-store'
import { toast } from 'sonner'

export function useAIContent() {
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'

    const [isScraping, setIsScraping] = useState(false)
    const [isRewriting, setIsRewriting] = useState(false)
    const [isRefreshingSEO, setIsRefreshingSEO] = useState(false)
    const [isGeneratingImage, setIsGeneratingImage] = useState(false)
    const [isScanning, setIsScanning] = useState(false)

    const {
        sourceContent, setSourceContent,
        articleIdea,
        selectedArticle, setSelectedArticle,
        scrapeUrl, setScrapeUrl,
        aiTone,
        aiLength,
        setGeneratedContent,
        setGeneratedTitle,
        setGeneratedArticleId,
        setMetaDescription,
        setSlug,
        setMetaTitle,
        generatedContent,
        generatedTitle,
        setFeaturedImage,
        activeTab
    } = useContentLabStore()

    const handleSelectArticle = useCallback(async (article: any) => {
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
    }, [API_BASE_URL, setSelectedArticle, setSourceContent])

    const handleScrape = useCallback(async () => {
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
                toast.success('Konten berhasil ditarik')
            } else {
                toast.error(result.error || 'Gagal menarik konten')
            }
        } catch (error) {
            console.error("Scrape error:", error)
            toast.error('Gagal menarik konten')
        } finally {
            setIsScraping(false)
        }
    }, [scrapeUrl, API_BASE_URL, setSourceContent, setSelectedArticle, setGeneratedTitle])

    const handleAIRewrite = useCallback(async (selectedCategoryId: number | null) => {
        const hasSource = activeTab === 'idea' ? articleIdea.trim() : sourceContent.trim();
        if (!hasSource) {
            toast.error(activeTab === 'idea' ? 'Harap masukkan ide Anda terlebih dahulu' : 'Harap pilih artikel terlebih dahulu')
            return
        }
        if (!selectedCategoryId) {
            toast.error('Silakan pilih kategori terlebih dahulu.')
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
                    categoryId: selectedCategoryId,
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
                toast.success('Konten berhasil dibuat!')
            } else {
                toast.error(result.error || 'Gagal membuat konten')
            }
        } catch (error) {
            console.error('AI Rewrite error:', error)
            toast.error('Terjadi kesalahan saat memproses AI')
        } finally {
            setIsRewriting(false)
        }
    }, [
        activeTab,
        articleIdea,
        sourceContent,
        selectedArticle,
        scrapeUrl,
        aiTone,
        aiLength,
        API_BASE_URL,
        setGeneratedContent,
        setGeneratedTitle,
        setMetaDescription,
        setSlug,
        setMetaTitle
    ])

    const handleRefreshSEO = useCallback(async () => {
        if (!generatedContent || !generatedTitle) {
            toast.error('Harap buat konten terlebih dahulu')
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
            toast.success('SEO berhasil diperbarui!')
        } catch (error) {
            console.error('SEO Refresh error:', error)
            toast.error('Gagal memperbarui SEO')
        } finally {
            setIsRefreshingSEO(false)
        }
    }, [generatedContent, generatedTitle, API_BASE_URL, setMetaTitle, setMetaDescription, setSlug])

    const handleGenerateImage = useCallback(async () => {
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
                toast.success('Gambar berhasil dibuat!')
            } else if (data.imageUrl) {
                setFeaturedImage(data.imageUrl)
                toast.success('Gambar berhasil dibuat!')
            } else {
                toast.error('Gagal membuat gambar')
            }
        } catch (error) {
            console.error('Image Gen error:', error)
            toast.error('Terjadi kesalahan saat membuat gambar')
        } finally {
            setIsGeneratingImage(false)
        }
    }, [generatedTitle, API_BASE_URL, setFeaturedImage])

    return {
        isScraping,
        isRewriting,
        isRefreshingSEO,
        isGeneratingImage,
        isScanning,
        handleScrape,
        handleAIRewrite,
        handleRefreshSEO,
        handleGenerateImage,
        handleSelectArticle
    }
}
