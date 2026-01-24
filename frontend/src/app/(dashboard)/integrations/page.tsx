'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
    Plus,
    Plug,
    MoreHorizontal,
    Settings,
    Trash2,
    RefreshCw,
    CheckCircle2,
    XCircle,
    ExternalLink,
    ArrowRight,
    Loader2
} from 'lucide-react'
import { WordPressSite } from '@/lib/sites-store'
import { authClient } from '@/lib/auth-client'

// Use relative path on client to leverage Next.js Proxy (cookies)
// Server-side fetch (if any) would need absolute
const API_BASE_URL = typeof window === 'undefined'
    ? (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api')
    : '/api'

async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
    const session = await authClient.getSession()
    const token = session.data?.session.token // Adjust based on actual session structure

    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
        credentials: 'include' // Important: Send cookies (httpOnly session token)
    })

    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Request failed' }))
        throw new Error(error.message || `Error ${response.status}`)
    }

    return response.json()
}

export default function IntegrationsPage() {
    const [isAddOpen, setIsAddOpen] = useState(false)
    const [sites, setSites] = useState<WordPressSite[]>([])
    const [isRefreshingCategories, setIsRefreshingCategories] = useState(false)
    const [categoryMappings, setCategoryMappings] = useState<Array<{ source: string; target: string; wpCategoryId?: number }>>([])

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        url: '',
        username: '',
        appPassword: ''
    })
    const [isTesting, setIsTesting] = useState(false)
    const [connectionError, setConnectionError] = useState('')

    // Load sites on mount
    useEffect(() => {
        fetchSites()
        loadCategoryMappings()
    }, [])

    const loadCategoryMappings = async () => {
        try {
            console.log('[loadCategoryMappings] Fetching from backend...')
            const data = await fetchWithAuth('/category-mapping')
            console.log('[loadCategoryMappings] Backend response:', data)

            if (Array.isArray(data)) {
                // Transform backend format to UI format
                const mappings = data.map((m: any) => ({
                    source: m.sourceCategory,
                    target: m.targetCategoryName,
                    wpCategoryId: parseInt(m.targetCategoryId)
                }))
                console.log('[loadCategoryMappings] Transformed mappings:', mappings)
                setCategoryMappings(mappings)
            } else {
                console.warn('[loadCategoryMappings] Data is not an array:', data)
            }
        } catch (error) {
            console.error('Failed to load category mappings:', error)
        }
    }

    const fetchSites = async () => {
        try {
            const data = await fetchWithAuth('/wordpress/sites')
            if (Array.isArray(data)) {
                setSites(data)

                // Sync to localStorage for Content Lab to access
                const sitesForLocalStorage = data.map((site: any) => ({
                    id: site.id,
                    name: site.name,
                    url: site.url,
                    username: site.username,
                    appPassword: site.appPassword || '', // Backend might not return password for security
                    status: site.status,
                    lastSync: site.lastHealthCheck,
                    articlesPublished: 0 // Not tracked in backend yet
                }))

                // Save to localStorage (sites-store uses 'contently_wp_sites' key)
                if (sitesForLocalStorage.length > 0) {
                    localStorage.setItem('contently_wp_sites', JSON.stringify(sitesForLocalStorage))
                }
            }
        } catch (error) {
            console.error('Failed to fetch sites:', error)
        }
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'connected':
                return <Badge className="bg-green-500/10 text-green-600 hover:bg-green-500/20"><CheckCircle2 className="h-3 w-3 mr-1" />Connected</Badge>
            case 'error':
                return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Error</Badge>
            default:
                return <Badge variant="outline">{status}</Badge>
        }
    }

    const formatTimeAgo = (dateStr?: string) => {
        if (!dateStr) return 'Never'
        const date = new Date(dateStr)
        const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
        if (seconds < 60) return `${seconds}s ago`
        const minutes = Math.floor(seconds / 60)
        if (minutes < 60) return `${minutes}m ago`
        const hours = Math.floor(minutes / 60)
        if (hours < 24) return `${hours}h ago`
        const days = Math.floor(hours / 24)
        return `${days}d ago`
    }

    const handleRefreshCategories = async () => {
        console.log('[handleRefreshCategories] Starting...')
        console.log('[handleRefreshCategories] Sites:', sites)
        console.log('[handleRefreshCategories] Sites statuses:', sites.map(s => ({ name: s.name, status: s.status, statusType: typeof s.status })))

        // Get first connected site (single-site model)
        const targetSite = sites.find(s => s.status === 'CONNECTED' || s.status.toLowerCase() === 'connected')

        console.log('[handleRefreshCategories] Target site found:', targetSite)

        if (!targetSite) {
            alert('Please connect a WordPress site first')
            return
        }

        setIsRefreshingCategories(true)

        try {
            // Use backend endpoint to sync categories
            const data = await fetchWithAuth(`/wordpress/sites/${targetSite.id}/categories`)

            if (data && Array.isArray(data)) {
                const newMappings = data.map((cat: any) => ({
                    source: cat.slug || cat.name,
                    target: cat.name,
                    wpCategoryId: cat.id
                }))

                // Save mappings to backend
                const mappingsToSave = newMappings.map(m => ({
                    source: m.source,
                    targetId: m.wpCategoryId.toString(),
                    targetName: m.target
                }))

                await fetchWithAuth('/category-mapping', {
                    method: 'POST',
                    body: JSON.stringify({ mappings: mappingsToSave })
                })

                setCategoryMappings(newMappings)
                alert(`Successfully fetched and saved categories from ${targetSite.name}`)
            }
        } catch (error: any) {
            console.error('Refresh categories error:', error)
            alert(error.message || 'Failed to refresh categories')
        } finally {
            setIsRefreshingCategories(false)
        }
    }

    const handleAddSite = async () => {
        if (!formData.name || !formData.url || !formData.username || !formData.appPassword) {
            setConnectionError('Please fill in all fields')
            return
        }

        setIsTesting(true)
        setConnectionError('')

        try {
            // Ensure URL has protocol
            let wpUrl = formData.url
            if (!wpUrl.startsWith('http')) {
                wpUrl = `https://${wpUrl}`
            }

            // Add site via backend API
            await fetchWithAuth('/wordpress/sites', {
                method: 'POST',
                body: JSON.stringify({
                    name: formData.name,
                    url: wpUrl,
                    username: formData.username,
                    appPassword: formData.appPassword
                })
            })

            // Success - Refresh list
            await fetchSites()
            setIsAddOpen(false)
            setFormData({ name: '', url: '', username: '', appPassword: '' })
            alert('Site connected successfully!')
        } catch (error: any) {
            setConnectionError(error.message || 'Failed to connect to WordPress site')
        } finally {
            setIsTesting(false)
        }
    }



    const handleTestConnection = async (site: WordPressSite) => {
        try {
            // Call backend to verify connection using stored credentials
            const response = await fetchWithAuth(`/wordpress/sites/${site.id}/test`, {
                method: 'POST'
            })

            console.log('[handleTestConnection] Response:', response)

            if (response.connected) {
                alert(`Connection to ${site.name} is working perfectly!`)

                // Update local status too
                setSites(sites.map(s => s.id === site.id ? { ...s, status: 'CONNECTED' } : s))
            } else {
                alert(`Connection failed: ${response.message || 'Unknown error'}`)
                // Update local status
                setSites(sites.map(s => s.id === site.id ? { ...s, status: 'ERROR', error: response.message } : s))
            }
        } catch (error: any) {
            console.error('[handleTestConnection] Error:', error)
            alert(`Network error: ${error.message}`)
        }
    }

    const handleRemoveSite = async (id: string) => {
        if (!confirm('Are you sure you want to disconnect this site?')) return

        try {
            await fetchWithAuth(`/wordpress/sites/${id}`, {
                method: 'DELETE'
            })

            // Refresh sites list
            await fetchSites()
            alert('Site disconnected successfully')
        } catch (error: any) {
            alert(`Failed to disconnect: ${error.message}`)
        }
    }

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Integrations</h1>
                    <p className="text-muted-foreground">
                        Connect and manage your WordPress sites.
                    </p>
                </div>
                <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-gradient-to-r from-violet-600 to-indigo-600">
                            <Plus className="h-4 w-4 mr-2" />
                            Add Site
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Connect WordPress Site</DialogTitle>
                            <DialogDescription>
                                Add a new WordPress site to publish content to.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="siteName">Site Name</Label>
                                <Input
                                    id="siteName"
                                    placeholder="e.g., My Blog"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="siteUrl">WordPress URL</Label>
                                <Input
                                    id="siteUrl"
                                    placeholder="https://yourblog.com"
                                    value={formData.url}
                                    onChange={e => setFormData({ ...formData, url: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="username">Username</Label>
                                <Input
                                    id="username"
                                    placeholder="admin"
                                    value={formData.username}
                                    onChange={e => setFormData({ ...formData, username: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="appPassword">Application Password</Label>
                                <Input
                                    id="appPassword"
                                    type="password"
                                    placeholder="xxxx xxxx xxxx xxxx xxxx"
                                    value={formData.appPassword}
                                    onChange={e => setFormData({ ...formData, appPassword: e.target.value })}
                                />
                                <p className="text-xs text-muted-foreground">
                                    Generate this in your WordPress Admin → Users → Application Passwords
                                </p>
                            </div>
                            {connectionError && (
                                <div className="text-xs text-red-600 bg-red-50 p-2 rounded flex items-center gap-2 border border-red-200">
                                    <XCircle className="h-3 w-3" />
                                    {connectionError}
                                </div>
                            )}
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsAddOpen(false)} disabled={isTesting}>Cancel</Button>
                            <Button
                                className="bg-gradient-to-r from-violet-600 to-indigo-600"
                                onClick={handleAddSite}
                                disabled={isTesting}
                            >
                                {isTesting ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Testing...
                                    </>
                                ) : (
                                    'Test & Connect'
                                )}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Connected Sites */}
            <Card>
                <CardHeader>
                    <CardTitle>Connected Sites</CardTitle>
                    <CardDescription>Your WordPress integrations</CardDescription>
                </CardHeader>
                <CardContent>
                    {sites.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <Plug className="h-12 w-12 mx-auto mb-3 opacity-20" />
                            <p>No sites connected yet. Click "Add Site" to start.</p>
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {sites.map((site) => (
                                <div
                                    key={site.id}
                                    className="flex items-center justify-between p-4 rounded-lg border"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600/20 to-cyan-600/20">
                                            <Plug className="h-6 w-6 text-blue-600" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <p className="font-medium">{site.name}</p>
                                                {getStatusBadge(site.status)}
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <span>{site.url}</span>
                                                <a href={site.url} target="_blank" rel="noopener noreferrer">
                                                    <ExternalLink className="h-3 w-3" />
                                                </a>
                                            </div>
                                            {site.error && (
                                                <p className="text-xs text-red-600 mt-1">{site.error}</p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="text-right text- sm">
                                            <p className="font-medium">{site.articlesPublished} articles</p>
                                            <p className="text-muted-foreground">Last sync: {formatTimeAgo(site.lastSync)}</p>
                                        </div>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => handleTestConnection(site)}>
                                                    <RefreshCw className="h-4 w-4 mr-2" />
                                                    Test Connection
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => alert('Settings feature coming soon')}>
                                                    <Settings className="h-4 w-4 mr-2" />
                                                    Settings
                                                </DropdownMenuItem>
                                                <DropdownMenuItem className="text-red-600" onClick={() => handleRemoveSite(site.id)}>
                                                    <Trash2 className="h-4 w-4 mr-2" />
                                                    Disconnect
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Category Mappings */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Category Mapping</CardTitle>
                        <CardDescription>Map source categories to your WordPress categories</CardDescription>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRefreshCategories}
                        disabled={isRefreshingCategories || sites.length === 0}
                    >
                        <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshingCategories ? 'animate-spin' : ''}`} />
                        {isRefreshingCategories ? 'Refreshing...' : 'Refresh Categories'}
                    </Button>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Source Category</TableHead>
                                <TableHead></TableHead>
                                <TableHead>WordPress Category</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {categoryMappings.map((mapping, index) => (
                                <TableRow key={index}>
                                    <TableCell>
                                        <Badge variant="outline">{mapping.source}</Badge>
                                    </TableCell>
                                    <TableCell>
                                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                                    </TableCell>
                                    <TableCell>
                                        <Badge className="bg-violet-500/10 text-violet-600">{mapping.target}</Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon" className="text-red-600 hover:text-red-600">
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
