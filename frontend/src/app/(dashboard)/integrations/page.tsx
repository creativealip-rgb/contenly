'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
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
    Loader2,
    Zap
} from 'lucide-react'
import { WordPressSite } from '@/lib/sites-store'
import { authClient } from '@/lib/auth-client'
import { toast } from 'sonner'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
} as const

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 100 } }
} as const

async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
    const session = await authClient.getSession()
    const token = session.data?.session.token
    const headers = {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
        ...options.headers,
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    }
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
        credentials: 'include'
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
    const [isLoadingSites, setIsLoadingSites] = useState(true)
    const [isRefreshingCategories, setIsRefreshingCategories] = useState(false)
    const [categoryMappings, setCategoryMappings] = useState<Array<{ source: string; target: string; wpCategoryId?: number }>>([])
    const [isLoadingMappings, setIsLoadingMappings] = useState(true)
    const [formData, setFormData] = useState({ name: '', url: '', username: '', appPassword: '' })
    const [isTesting, setIsTesting] = useState(false)
    const [connectionError, setConnectionError] = useState('')

    useEffect(() => {
        fetchSites()
        loadCategoryMappings()
    }, [])

    const loadCategoryMappings = async () => {
        setIsLoadingMappings(true)
        try {
            const data = await fetchWithAuth('/category-mapping')
            if (Array.isArray(data)) {
                const mappings = data.map((m: any) => ({
                    source: m.sourceCategory,
                    target: m.targetCategoryName,
                    wpCategoryId: parseInt(m.targetCategoryId)
                }))
                setCategoryMappings(mappings)
            }
        } catch (error) {
            console.error('Failed to load category mappings:', error)
            toast.error('Failed to load category mappings')
        } finally {
            setIsLoadingMappings(false)
        }
    }

    const fetchSites = async () => {
        setIsLoadingSites(true)
        try {
            const data = await fetchWithAuth('/wordpress/sites')
            if (Array.isArray(data)) {
                setSites(data)
                const sitesForLocalStorage = data.map((site: any) => ({
                    id: site.id,
                    name: site.name,
                    url: site.url,
                    username: site.username,
                    appPassword: site.appPassword || '',
                    status: site.status,
                    lastSync: site.lastHealthCheck,
                    articlesPublished: 0
                }))
                if (sitesForLocalStorage.length > 0) {
                    localStorage.setItem('contently_wp_sites', JSON.stringify(sitesForLocalStorage))
                }
            }
        } catch (error) {
            console.error('Failed to fetch sites:', error)
            toast.error('Failed to fetch sites')
        } finally {
            setIsLoadingSites(false)
        }
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'connected':
            case 'CONNECTED':
                return <Badge className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-emerald-500/20"><CheckCircle2 className="h-3 w-3 mr-1" />Connected</Badge>
            case 'error':
            case 'ERROR':
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
        const targetSite = sites.find(s => s.status === 'CONNECTED' || s.status.toLowerCase() === 'connected')
        if (!targetSite) {
            alert('Please connect a WordPress site first')
            return
        }
        setIsRefreshingCategories(true)
        try {
            const data = await fetchWithAuth(`/wordpress/sites/${targetSite.id}/categories`)
            if (data && Array.isArray(data)) {
                const newMappings = data.map((cat: any) => ({
                    source: cat.slug || cat.name,
                    target: cat.name,
                    wpCategoryId: cat.id
                }))
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
            let wpUrl = formData.url
            if (!wpUrl.startsWith('http')) {
                wpUrl = `https://${wpUrl}`
            }
            await fetchWithAuth('/wordpress/sites', {
                method: 'POST',
                body: JSON.stringify({
                    name: formData.name,
                    url: wpUrl,
                    username: formData.username,
                    appPassword: formData.appPassword
                })
            })
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
            const response = await fetchWithAuth(`/wordpress/sites/${site.id}/test`, { method: 'POST' })
            if (response.connected) {
                alert(`Connection to ${site.name} is working perfectly!`)
                setSites(sites.map(s => s.id === site.id ? { ...s, status: 'CONNECTED' } : s))
            } else {
                alert(`Connection failed: ${response.message || 'Unknown error'}`)
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
            await fetchWithAuth(`/wordpress/sites/${id}`, { method: 'DELETE' })
            await fetchSites()
            alert('Site disconnected successfully')
        } catch (error: any) {
            alert(`Failed to disconnect: ${error.message}`)
        }
    }

    return (
        <motion.div 
            className="space-y-6"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            {/* Page Header */}
            <motion.div variants={itemVariants}>
                <Card className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-500 text-white border-0">
                    <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                    <CardContent className="relative z-10 py-6 px-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="flex items-center gap-2 text-blue-100 mb-2">
                                    <Plug className="w-4 h-4" />
                                    <span className="text-xs font-medium uppercase tracking-wider">Site Connections</span>
                                </div>
                                <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-1">Integrations</h1>
                                <p className="text-blue-100 text-sm">Connect and manage your WordPress sites.</p>
                            </div>
                            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                                <DialogTrigger asChild>
                                    <Button className="bg-white text-blue-600 hover:bg-white/90">
                                        <Plus className="h-4 w-4 mr-2" />
                                        Add Site
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Connect WordPress Site</DialogTitle>
                                        <DialogDescription>Add a new WordPress site to publish content to.</DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-4 py-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="siteName">Site Name</Label>
                                            <Input id="siteName" placeholder="e.g., My Blog" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="siteUrl">WordPress URL</Label>
                                            <Input id="siteUrl" placeholder="https://yourblog.com" value={formData.url} onChange={e => setFormData({ ...formData, url: e.target.value })} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="username">Username</Label>
                                            <Input id="username" placeholder="admin" value={formData.username} onChange={e => setFormData({ ...formData, username: e.target.value })} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="appPassword">Application Password</Label>
                                            <Input id="appPassword" type="password" placeholder="xxxx xxxx xxxx xxxx xxxx" value={formData.appPassword} onChange={e => setFormData({ ...formData, appPassword: e.target.value })} />
                                            <p className="text-xs text-muted-foreground">Generate this in WordPress Admin → Users → Application Passwords</p>
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
                                        <Button className="bg-gradient-to-r from-blue-600 to-cyan-500" onClick={handleAddSite} disabled={isTesting}>
                                            {isTesting ? (<><Loader2 className="h-4 w-4 mr-2 animate-spin" />Testing...</>) : ('Test & Connect')}
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Connected Sites */}
            <motion.div variants={itemVariants}>
                <Card variant="glass">
                    <CardHeader>
                        <CardTitle className="text-sm uppercase tracking-wider text-muted-foreground font-semibold">Connected Sites</CardTitle>
                        <CardDescription>Your WordPress integrations</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isLoadingSites ? (
                            <div className="flex justify-center py-12">
                                <Loader2 className="h-8 w-8 animate-spin text-[var(--brand-primary)]" />
                            </div>
                        ) : sites.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                <Plug className="h-12 w-12 mx-auto mb-3 opacity-20" />
                                <p>No sites connected yet. Click "Add Site" to start.</p>
                            </div>
                        ) : (
                            <div className="grid gap-4">
                                {sites.map((site) => (
                                    <motion.div
                                        key={site.id}
                                        className="flex items-center justify-between p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors"
                                        whileHover={{ scale: 1.01 }}
                                        transition={{ type: "spring", stiffness: 400, damping: 25 }}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 text-white">
                                                <Plug className="h-6 w-6" />
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
                                        <div className="flex items-center gap-4 shrink-0">
                                            <div className="text-right hidden sm:block">
                                                <p className="font-medium tabular-nums">{site.articlesPublished} articles</p>
                                                <p className="text-muted-foreground text-xs">Last sync: {formatTimeAgo(site.lastSync)}</p>
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
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </motion.div>

            {/* Category Mappings */}
            <motion.div variants={itemVariants}>
                <Card variant="glass">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-sm uppercase tracking-wider text-muted-foreground font-semibold">Category Mapping</CardTitle>
                            <CardDescription>Map source categories to your WordPress categories</CardDescription>
                        </div>
                        <Button variant="outline" size="sm" onClick={handleRefreshCategories} disabled={isRefreshingCategories || sites.length === 0}>
                            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshingCategories ? 'animate-spin' : ''}`} />
                            {isRefreshingCategories ? 'Refreshing...' : 'Refresh'}
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow className="hover:bg-transparent">
                                    <TableHead>Source Category</TableHead>
                                    <TableHead></TableHead>
                                    <TableHead>WordPress Category</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoadingMappings ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="py-12">
                                            <div className="flex justify-center">
                                                <Loader2 className="h-8 w-8 animate-spin text-[var(--brand-primary)]" />
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : categoryMappings.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                                            No category mappings found. Refresh categories to start.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    categoryMappings.map((mapping, index) => (
                                        <TableRow key={index}>
                                            <TableCell><Badge variant="outline">{mapping.source}</Badge></TableCell>
                                            <TableCell><ArrowRight className="h-4 w-4 text-muted-foreground" /></TableCell>
                                            <TableCell><Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20">{mapping.target}</Badge></TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="icon" className="text-red-600 hover:text-red-600">
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </motion.div>
        </motion.div>
    )
}
