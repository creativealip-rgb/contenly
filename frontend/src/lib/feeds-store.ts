export interface RssFeed {
    id: string
    name: string
    url: string
    lastSynced?: string
    status: 'active' | 'paused' | 'error'
    pollingInterval?: number
    pollingIntervalMinutes?: number  // Backend uses this field
    itemsFetched?: number
    autoPublish?: boolean
    error?: string
    userId?: string
    createdAt?: string
    updatedAt?: string
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

// Get all feeds from backend
export const getFeeds = async (): Promise<RssFeed[]> => {
    try {
        const response = await fetch(`${API_BASE}/feeds`, {
            credentials: 'include', // Send auth cookies
        })

        if (!response.ok) {
            console.error('Failed to fetch feeds:', response.statusText)
            return []
        }

        const feeds = await response.json()

        // Transform backend format to match frontend interface
        return feeds.map((feed: any) => ({
            ...feed,
            pollingInterval: feed.pollingIntervalMinutes, // Map backend field
            status: feed.status || 'active',
        }))
    } catch (error) {
        console.error('Error fetching feeds:', error)
        return []
    }
}

// Add a new feed
export const addFeed = async (feed: Omit<RssFeed, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<RssFeed | null> => {
    try {
        const response = await fetch(`${API_BASE}/feeds`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({
                name: feed.name,
                url: feed.url,
                pollingIntervalMinutes: feed.pollingInterval || feed.pollingIntervalMinutes || 15,
            }),
        })

        if (!response.ok) {
            const error = await response.json()
            throw new Error(error.message || 'Failed to add feed')
        }

        const newFeed = await response.json()
        return {
            ...newFeed,
            pollingInterval: newFeed.pollingIntervalMinutes,
            status: newFeed.status || 'active',
        }
    } catch (error) {
        console.error('Error adding feed:', error)
        throw error
    }
}

// Remove a feed
export const removeFeed = async (id: string): Promise<void> => {
    try {
        const response = await fetch(`${API_BASE}/feeds/${id}`, {
            method: 'DELETE',
            credentials: 'include',
        })

        if (!response.ok) {
            const error = await response.json()
            throw new Error(error.message || 'Failed to remove feed')
        }
    } catch (error) {
        console.error('Error removing feed:', error)
        throw error
    }
}

