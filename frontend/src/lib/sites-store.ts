
export interface WordPressSite {
    id: string
    name: string
    url: string
    username: string
    appPassword: string
    status: 'connected' | 'error'
    lastSync?: string
    articlesPublished: number
    error?: string
}

const STORAGE_KEY = 'camedia_wp_sites'

export const getSites = (): WordPressSite[] => {
    if (typeof window === 'undefined') return []
    const sites = localStorage.getItem(STORAGE_KEY)
    return sites ? JSON.parse(sites) : []
}

export const addSite = (site: WordPressSite) => {
    const sites = getSites()
    const newSites = [...sites, site]
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newSites))
    return newSites
}

export const removeSite = (id: string) => {
    const sites = getSites()
    const newSites = sites.filter(s => s.id !== id)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newSites))
    return newSites
}

export const updateSite = (id: string, updates: Partial<WordPressSite>) => {
    const sites = getSites()
    const newSites = sites.map(s => s.id === id ? { ...s, ...updates } : s)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newSites))
    return newSites
}
