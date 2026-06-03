'use client'

import { useState, useCallback } from 'react'
import { RssFeed, getFeeds, addFeed, removeFeed } from '@/lib/feeds-store'
import { toast } from 'sonner'

export function useRSS() {
    const [feeds, setFeeds] = useState<RssFeed[]>([])
    const [articles, setArticles] = useState<any[]>([])
    const [selectedFeed, setSelectedFeed] = useState('')
    const [isFetchingRSS, setIsFetchingRSS] = useState(false)
    const [isAddFeedOpen, setIsAddFeedOpen] = useState(false)
    const [newFeedUrl, setNewFeedUrl] = useState('')
    const [newFeedName, setNewFeedName] = useState('')

    const loadFeeds = useCallback(async () => {
        try {
            const fetchedFeeds = await getFeeds()
            setFeeds(fetchedFeeds)
        } catch (error) {
            console.error('Failed to load feeds:', error)
        }
    }, [])

    const handleFetchArticles = useCallback(async (feedUrl: string) => {
        setIsFetchingRSS(true)
        setArticles([])
        try {
            const response = await fetch('/api/rss', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: feedUrl }),
            })
            const data = await response.json()
            if (data.success) {
                setArticles(data.items)
            } else {
                toast.error('Gagal mengambil artikel dari feed')
            }
        } catch (error) {
            console.error('RSS Error:', error)
            toast.error('Terjadi kesalahan saat mengambil feed')
        } finally {
            setIsFetchingRSS(false)
        }
    }, [])

    const handleAddFeed = useCallback(async () => {
        if (!newFeedName || !newFeedUrl) return

        const newFeed: RssFeed = {
            id: Math.random().toString(36).substring(7),
            name: newFeedName,
            url: newFeedUrl,
            status: 'active',
            lastSynced: new Date().toISOString()
        }

        try {
            const added = await addFeed(newFeed)
            if (added) {
                await loadFeeds()
                setNewFeedName('')
                setNewFeedUrl('')
                setIsAddFeedOpen(false)
                setSelectedFeed(added.id)
                handleFetchArticles(added.url)
                toast.success('Sumber berhasil ditambahkan')
            }
        } catch (error) {
            console.error('Failed to add feed:', error)
            toast.error('Gagal menambahkan sumber')
        }
    }, [newFeedName, newFeedUrl, loadFeeds, handleFetchArticles])

    const handleRemoveFeed = useCallback(async (id: string) => {
        try {
            await removeFeed(id)
            await loadFeeds()
            if (selectedFeed === id) {
                setSelectedFeed('')
                setArticles([])
            }
            toast.success('Sumber berhasil dihapus')
        } catch (error) {
            console.error('Failed to remove feed:', error)
            toast.error('Gagal menghapus sumber')
        }
    }, [selectedFeed, loadFeeds])

    return {
        feeds,
        articles,
        selectedFeed,
        isFetchingRSS,
        isAddFeedOpen,
        newFeedUrl,
        newFeedName,
        setSelectedFeed,
        setIsFetchingRSS,
        setIsAddFeedOpen,
        setNewFeedUrl,
        setNewFeedName,
        loadFeeds,
        handleFetchArticles,
        handleAddFeed,
        handleRemoveFeed
    }
}
