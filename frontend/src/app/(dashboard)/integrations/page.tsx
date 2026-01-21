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
import { WordPressSite, getSites, addSite, removeSite } from '@/lib/sites-store'

const mockMappings = [
    { source: 'Technology', target: 'Tech News' },
    { source: 'Business', target: 'Business & Finance' },
    { source: 'Startups', target: 'Startup Stories' },
    { source: 'AI', target: 'Artificial Intelligence' },
]

export default function IntegrationsPage() {
    const [isAddOpen, setIsAddOpen] = useState(false)
    const [sites, setSites] = useState<WordPressSite[]>([])
    const [isRefreshingCategories, setIsRefreshingCategories] = useState(false)
    const [categoryMappings, setCategoryMappings] = useState(mockMappings)
    const [selectedSiteForCategories, setSelectedSiteForCategories] = useState<string>('all')

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
        setSites(getSites())
    }, [])

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
        // Find the selected site
        const targetSite = selectedSiteForCategories === 'all'
            ? sites.find(s => s.status === 'connected')
            : sites.find(s => s.id === selectedSiteForCategories)

        if (!targetSite) {
            alert('Please connect a WordPress site first')
            return
        }

        setIsRefreshingCategories(true)

        try {
            const params = new URLSearchParams({
                wpUrl: targetSite.url,
                username: targetSite.username,
                appPassword: targetSite.appPassword
            })

            const response = await fetch(`/api/wordpress/categories?${params.toString()}`)
            const data = await response.json()

            if (!response.ok || data.error) {
                throw new Error(data.error || 'Failed to fetch categories')
            }

            // Auto-create mappings from WordPress categories
            if (data.categories && Array.isArray(data.categories)) {
                const newMappings = data.categories.map((cat: any) => ({
                    source: cat.slug || cat.name,
                    target: cat.name,
                    wpCategoryId: cat.id
                }))

                setCategoryMappings(newMappings)
                alert(`Successfully fetched ${newMappings.length} categories from ${targetSite.name}`)
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

            const params = new URLSearchParams({
                wpUrl,
                username: formData.username,
                appPassword: formData.appPassword
            })

            const response = await fetch(`/api/wordpress?${params.toString()}`)
            const data = await response.json()

            if (!response.ok || data.error) {
                throw new Error(data.error || 'Connection failed')
            }

            // Success - Add to store
            const newSite: WordPressSite = {
                id: Date.now().toString(),
                name: formData.name,
                url: wpUrl,
                username: formData.username,
                appPassword: formData.appPassword,
                status: 'connected',
                lastSync: new Date().toISOString(),
                articlesPublished: 0
            }

            setSites(addSite(newSite))
            setIsAddOpen(false)
            setFormData({ name: '', url: '', username: '', appPassword: '' })
        } catch (error: any) {
            setConnectionError(error.message || 'Failed to connect to WordPress site')
        } finally {
            setIsTesting(false)
        }
    }

    const handleRemoveSite = (id: string) => {
        if (confirm('Are you sure you want to remove this site?')) {
            setSites(removeSite(id))
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
                                                <DropdownMenuItem onClick={() => { }}>
                                                    <RefreshCw className="h-4 w-4 mr-2" />
                                                    Test Connection
                                                </DropdownMenuItem>
                                                <DropdownMenuItem>
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
                                <TableHead>Site</TableHead>
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
                                    <TableCell>
                                        <Select
                                            defaultValue="all"
                                            value={selectedSiteForCategories}
                                            onValueChange={setSelectedSiteForCategories}
                                        >
                                            <SelectTrigger className="w-[140px]">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent position="popper" side="bottom" sideOffset={4}>
                                                <SelectItem value="all">All Sites</SelectItem>
                                                {sites.map(site => (
                                                    <SelectItem key={site.id} value={site.id}>{site.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
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
