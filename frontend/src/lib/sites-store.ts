export interface WordPressSite {
    id: string
    name: string
    url: string
    username: string
    appPassword?: string // Only used when creating
    status: 'PENDING' | 'CONNECTED' | 'ERROR' | 'DISCONNECTED'
    lastSync?: string
    lastHealthCheck?: string
    articlesPublished?: number
    error?: string
    categoriesCache?: any[]
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'

// Get all sites from backend
export const getSites = async (): Promise<WordPressSite[]> => {
    try {
        const response = await fetch(`${API_BASE}/integrations/sites`, {
            credentials: 'include', // Send auth cookies
            headers: { 'ngrok-skip-browser-warning': 'true' }
        })

        if (!response.ok) {
            console.error('Failed to fetch sites:', response.statusText)
            return []
        }

        return await response.json()
    } catch (error) {
        console.error('Error fetching sites:', error)
        return []
    }
}

// Add a new site
export const addSite = async (site: Omit<WordPressSite, 'id'>): Promise<WordPressSite | null> => {
    try {
        const response = await fetch(`${API_BASE}/integrations/sites`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'ngrok-skip-browser-warning': 'true'
            },
            credentials: 'include',
            body: JSON.stringify({
                name: site.name,
                url: site.url,
                username: site.username,
                appPassword: site.appPassword,
            }),
        })

        if (!response.ok) {
            const error = await response.json()
            throw new Error(error.message || 'Failed to add site')
        }

        return await response.json()
    } catch (error) {
        console.error('Error adding site:', error)
        throw error
    }
}

// Get active site (first connected site)
export const getActiveSite = async (): Promise<WordPressSite | null> => {
    const sites = await getSites()
    return sites.find(s => s.status === 'CONNECTED') || sites[0] || null
}

// Remove a site
export const removeSite = async (id: string): Promise<void> => {
    try {
        const response = await fetch(`${API_BASE}/integrations/sites/${id}`, {
            method: 'DELETE',
            credentials: 'include',
            headers: { 'ngrok-skip-browser-warning': 'true' }
        })

        if (!response.ok) {
            const error = await response.json()
            throw new Error(error.message || 'Failed to remove site')
        }
    } catch (error) {
        console.error('Error removing site:', error)
        throw error
    }
}

// Update a site
export const updateSite = async (id: string, updates: Partial<WordPressSite>): Promise<WordPressSite | null> => {
    try {
        const response = await fetch(`${API_BASE}/integrations/sites/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'ngrok-skip-browser-warning': 'true'
            },
            credentials: 'include',
            body: JSON.stringify(updates),
        })

        if (!response.ok) {
            const error = await response.json()
            throw new Error(error.message || 'Failed to update site')
        }

        return await response.json()
    } catch (error) {
        console.error('Error updating site:', error)
        throw error
    }
}

// Test site connection
export const testSiteConnection = async (id: string): Promise<{ success: boolean; message: string }> => {
    try {
        const response = await fetch(`${API_BASE}/integrations/sites/${id}/test`, {
            method: 'POST',
            credentials: 'include',
            headers: { 'ngrok-skip-browser-warning': 'true' }
        })

        if (!response.ok) {
            const error = await response.json()
            throw new Error(error.message || 'Connection test failed')
        }

        return await response.json()
    } catch (error) {
        console.error('Error testing connection:', error)
        throw error
    }
}

// Refresh categories from WordPress
export const refreshCategories = async (siteId: string): Promise<any> => {
    try {
        const response = await fetch(`${API_BASE}/integrations/sites/${siteId}/categories/refresh`, {
            method: 'POST',
            credentials: 'include',
            headers: { 'ngrok-skip-browser-warning': 'true' }
        })

        if (!response.ok) {
            const error = await response.json()
            throw new Error(error.message || 'Failed to refresh categories')
        }

        return await response.json()
    } catch (error) {
        console.error('Error refreshing categories:', error)
        throw error
    }
}

// Get category mappings
export const getCategoryMappings = async (siteId: string): Promise<any[]> => {
    try {
        const response = await fetch(`${API_BASE}/integrations/sites/${siteId}/categories`, {
            credentials: 'include',
            headers: { 'ngrok-skip-browser-warning': 'true' }
        })

        if (!response.ok) {
            console.error('Failed to fetch categories')
            return []
        }

        return await response.json()
    } catch (error) {
        console.error('Error fetching categories:', error)
        return []
    }
}
