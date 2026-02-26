'use client'

import { useState, useCallback } from 'react'
import { WordPressSite, getSites, getActiveSite } from '@/lib/sites-store'
import { useContentLabStore } from '@/stores/content-lab-store'
import { toast } from 'sonner'

export function useWordPress() {
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'

    const [sites, setSites] = useState<WordPressSite[]>([])
    const [wpCategories, setWpCategories] = useState<Array<{ id: number; name: string }>>([])
    const [selectedCategory, setSelectedCategory] = useState<number | null>(null)
    const [isFetchingCategories, setIsFetchingCategories] = useState(false)
    const [isPublishing, setIsPublishing] = useState(false)
    const [isScheduleOpen, setIsScheduleOpen] = useState(false)
    const [scheduleDate, setScheduleDate] = useState('')
    const [scheduleTime, setScheduleTime] = useState('')

    const {
        generatedContent,
        generatedTitle,
        selectedArticle,
        scrapeUrl,
        sourceContent,
        featuredImage,
        generatedArticleId,
        setPublishResult
    } = useContentLabStore()

    const loadSites = useCallback(async () => {
        try {
            const fetchedSites = await getSites()
            setSites(fetchedSites)
        } catch (error) {
            console.error('Failed to load sites:', error)
        }
    }, [])

    const fetchCategories = useCallback(async (siteId: string) => {
        setIsFetchingCategories(true)
        try {
            const response = await fetch(`${API_BASE_URL}/wordpress/sites/${siteId}/categories`, {
                credentials: 'include',
                headers: { 'ngrok-skip-browser-warning': 'true' }
            })
            if (response.ok) {
                const categories = await response.json()
                if (Array.isArray(categories)) {
                    setWpCategories(categories)
                }
            }
        } catch (error) {
            console.error('Failed to fetch categories:', error)
            toast.error('Gagal mengambil kategori WordPress')
        } finally {
            setIsFetchingCategories(false)
        }
    }, [API_BASE_URL])

    const handlePublishNow = useCallback(async (status: 'draft' | 'publish') => {
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
    }, [
        generatedContent,
        generatedTitle,
        selectedCategory,
        selectedArticle,
        scrapeUrl,
        sourceContent,
        featuredImage,
        generatedArticleId,
        setPublishResult,
        API_BASE_URL
    ])

    const handleSchedulePublish = useCallback(async () => {
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
    }, [
        generatedContent,
        generatedTitle,
        scheduleDate,
        scheduleTime,
        selectedCategory,
        selectedArticle,
        scrapeUrl,
        sourceContent,
        featuredImage,
        generatedArticleId,
        setPublishResult,
        API_BASE_URL
    ])

    return {
        sites,
        wpCategories,
        selectedCategory,
        isFetchingCategories,
        isPublishing,
        isScheduleOpen,
        scheduleDate,
        scheduleTime,
        setSelectedCategory,
        setIsScheduleOpen,
        setScheduleDate,
        setScheduleTime,
        loadSites,
        fetchCategories,
        handlePublishNow,
        handleSchedulePublish
    }
}
