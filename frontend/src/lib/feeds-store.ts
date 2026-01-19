export interface RssFeed {
    id: string
    name: string
    url: string
    lastSynced?: string
    status: 'active' | 'paused' | 'error'
    pollingInterval?: number
    itemsFetched?: number
    autoPublish?: boolean
    error?: string
}

const STORAGE_KEY = 'camedia_rss_feeds'

// Default feeds to get started
const DEFAULT_FEEDS: RssFeed[] = [
    {
        id: 'techcrunch',
        name: 'TechCrunch',
        url: 'https://techcrunch.com/feed/',
        status: 'active',
        pollingInterval: 15,
        itemsFetched: 124
    },
    {
        id: 'verge',
        name: 'The Verge',
        url: 'https://www.theverge.com/rss/index.xml',
        status: 'active',
        pollingInterval: 30,
        itemsFetched: 85
    }
]

export const getFeeds = (): RssFeed[] => {
    if (typeof window === 'undefined') return []
    const feeds = localStorage.getItem(STORAGE_KEY)
    if (!feeds) {
        // Initialize with default feeds if empty
        localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_FEEDS))
        return DEFAULT_FEEDS
    }
    return JSON.parse(feeds)
}

export const addFeed = (feed: RssFeed) => {
    const feeds = getFeeds()
    const newFeeds = [...feeds, feed]
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newFeeds))
    return newFeeds
}

export const removeFeed = (id: string) => {
    const feeds = getFeeds()
    const newFeeds = feeds.filter(feed => feed.id !== id)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newFeeds))
    return newFeeds
}
