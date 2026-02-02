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
    Plus,
    Rss,
    MoreHorizontal,
    Play,
    Pause,
    Trash2,
    Edit as EditIcon,
    RefreshCw,
    CheckCircle2,
    XCircle,
    Clock,
    Loader2
} from 'lucide-react'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { RssFeed, getFeeds, addFeed, removeFeed } from '@/lib/feeds-store'

interface PendingItem {
    id: string
    title: string
    url: string
    publishedAt: Date | string | null
    fetchedAt: Date | string
    status: string
    feed: {
        name: string
    }
}

export default function FeedsPage() {
    const [isAddOpen, setIsAddOpen] = useState(false)
    const [isEditOpen, setIsEditOpen] = useState(false)
    const [editingFeed, setEditingFeed] = useState<RssFeed | null>(null)
    const [feeds, setFeeds] = useState<RssFeed[]>([])
    const [pendingItems, setPendingItems] = useState<PendingItem[]>([])
    const [isLoadingPending, setIsLoadingPending] = useState(false)
    const [processingItem, setProcessingItem] = useState<string | null>(null)
    const [newFeedName, setNewFeedName] = useState('')
    const [newFeedUrl, setNewFeedUrl] = useState('')
    const [pollingInterval, setPollingInterval] = useState('15')
    const [editFeedName, setEditFeedName] = useState('')
    const [editFeedUrl, setEditFeedUrl] = useState('')
    const [editPollingInterval, setEditPollingInterval] = useState('15')
    const [isPolling, setIsPolling] = useState<string | null>(null)

    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

    useEffect(() => {
        const loadFeeds = async () => {
            const fetchedFeeds = await getFeeds()
            setFeeds(fetchedFeeds)
        }
        loadFeeds()
    }, [])

    useEffect(() => {
        const loadPendingItems = async () => {
            try {
                setIsLoadingPending(true)
                const response = await fetch(`${API_BASE_URL}/feeds/pending-items`, {
                    credentials: 'include',
                    headers: { 'ngrok-skip-browser-warning': 'true' }
                })

                if (response.ok) {
                    const data = await response.json()
                    setPendingItems(data)
                }
            } catch (error) {
                console.error('Failed to load pending items:', error)
            } finally {
                setIsLoadingPending(false)
            }
        }

        loadPendingItems()
        const interval = setInterval(loadPendingItems, 15000)
        return () => clearInterval(interval)
    }, [API_BASE_URL])

    const handleAddFeed = async () => {
        if (!newFeedName || !newFeedUrl) return

        const newFeed: RssFeed = {
            id: Math.random().toString(36).substring(7),
            name: newFeedName,
            url: newFeedUrl,
            status: 'active',
            pollingInterval: parseInt(pollingInterval),
            itemsFetched: 0,
            lastSynced: new Date().toISOString()
        }

        try {
            await addFeed(newFeed)
            const updatedFeeds = await getFeeds()
            setFeeds(updatedFeeds)
            setNewFeedName('')
            setNewFeedUrl('')
            setIsAddOpen(false)
        } catch (error) {
            console.error('Failed to add feed:', error)
            alert('Failed to add feed. Please try again.')
        }
    }

    const handleEditFeed = (feed: RssFeed) => {
        setEditingFeed(feed)
        setEditFeedName(feed.name)
        setEditFeedUrl(feed.url)
        setEditPollingInterval((feed.pollingInterval || 15).toString())
        setIsEditOpen(true)
    }

    const handleUpdateFeed = async () => {
        if (!editingFeed || !editFeedName || !editFeedUrl) return

        try {
            const response = await fetch(`${API_BASE_URL}/feeds/${editingFeed.id}`, {
                method: 'PATCH',
                credentials: 'include',
                headers: { 'ngrok-skip-browser-warning': 'true', 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: editFeedName,
                    url: editFeedUrl,
                    pollingIntervalMinutes: parseInt(editPollingInterval),
                }),
            })

            if (response.ok) {
                const updatedFeeds = await getFeeds()
                setFeeds(updatedFeeds)
                setIsEditOpen(false)
                setEditingFeed(null)
            } else {
                alert('Failed to update feed. Please try again.')
            }
        } catch (error) {
            console.error('Failed to update feed:', error)
            alert('Failed to update feed. Please try again.')
        }
    }

    const handleRemoveFeed = async (id: string) => {
        try {
            await removeFeed(id)
            const updatedFeeds = await getFeeds()
            setFeeds(updatedFeeds)
        } catch (error) {
            console.error('Failed to remove feed:', error)
            alert('Failed to remove feed. Please try again.')
        }
    }

    const handlePollFeed = async (id: string) => {
        try {
            setIsPolling(id)
            const response = await fetch(`${API_BASE_URL}/feeds/${id}/poll`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'ngrok-skip-browser-warning': 'true' },
            })

            if (response.ok) {
                const updatedFeeds = await getFeeds()
                setFeeds(updatedFeeds)
                alert('Feed polling initiated successfully')
            } else {
                alert('Failed to poll feed. Please try again.')
            }
        } catch (error) {
            console.error('Failed to poll feed:', error)
            alert('Failed to poll feed. Please try again.')
        } finally {
            setIsPolling(null)
        }
    }

    const handlePauseFeed = async (id: string) => {
        try {
            const response = await fetch(`${API_BASE_URL}/feeds/${id}/status`, {
                method: 'PATCH',
                credentials: 'include',
                headers: { 'ngrok-skip-browser-warning': 'true', 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'PAUSED' }),
            })

            if (response.ok) {
                const updatedFeeds = await getFeeds()
                setFeeds(updatedFeeds)
            } else {
                alert('Failed to pause feed. Please try again.')
            }
        } catch (error) {
            console.error('Failed to pause feed:', error)
            alert('Failed to pause feed. Please try again.')
        }
    }

    const handleResumeFeed = async (id: string) => {
        try {
            const response = await fetch(`${API_BASE_URL}/feeds/${id}/status`, {
                method: 'PATCH',
                credentials: 'include',
                headers: { 'ngrok-skip-browser-warning': 'true', 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'ACTIVE' }),
            })

            if (response.ok) {
                const updatedFeeds = await getFeeds()
                setFeeds(updatedFeeds)
            } else {
                alert('Failed to resume feed. Please try again.')
            }
        } catch (error) {
            console.error('Failed to resume feed:', error)
            alert('Failed to resume feed. Please try again.')
        }
    }

    const handleProcessItem = async (itemId: string) => {
        try {
            setProcessingItem(itemId)
            const response = await fetch(`${API_BASE_URL}/feeds/pending-items/${itemId}/process`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'ngrok-skip-browser-warning': 'true' }
            })

            if (response.ok) {
                setPendingItems(prev => prev.filter(item => item.id !== itemId))
            } else {
                alert('Failed to process item. Please try again.')
            }
        } catch (error) {
            console.error('Failed to process item:', error)
            alert('Failed to process item. Please try again.')
        } finally {
            setProcessingItem(null)
        }
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'ACTIVE':
                return <Badge className="bg-green-500/10 text-green-600 hover:bg-green-500/20"><CheckCircle2 className="h-3 w-3 mr-1" />Active</Badge>
            case 'PAUSED':
                return <Badge variant="secondary"><Pause className="h-3 w-3 mr-1" />Paused</Badge>
            case 'ERROR':
                return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Error</Badge>
            default:
                return <Badge variant="outline">{status}</Badge>
        }
    }

    const formatTimeAgo = (dateStr?: string | Date) => {
        if (!dateStr) return 'Never'
        const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr
        const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
        if (seconds < 60) return `${seconds}s ago`
        const minutes = Math.floor(seconds / 60)
        if (minutes < 60) return `${minutes}m ago`
        const hours = Math.floor(minutes / 60)
        if (hours < 24) return `${hours}h ago`
        const days = Math.floor(hours / 24)
        return `${days}d ago`
    }

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">RSS Feeds</h1>
                    <p className="text-muted-foreground">
                        Manage your RSS feed sources and pending items.
                    </p>
                </div>
                <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-gradient-to-r from-violet-600 to-indigo-600">
                            <Plus className="h-4 w-4 mr-2" />
                            Add Feed
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add RSS Feed</DialogTitle>
                            <DialogDescription>
                                Add a new RSS feed to automatically fetch content.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Feed Name</Label>
                                <Input
                                    id="name"
                                    placeholder="e.g., TechCrunch"
                                    value={newFeedName}
                                    onChange={(e) => setNewFeedName(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="feedUrl">Feed URL</Label>
                                <Input
                                    id="feedUrl"
                                    placeholder="https://example.com/rss"
                                    value={newFeedUrl}
                                    onChange={(e) => setNewFeedUrl(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="interval">Polling Interval</Label>
                                <Select value={pollingInterval} onValueChange={setPollingInterval}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="5">Every 5 minutes</SelectItem>
                                        <SelectItem value="15">Every 15 minutes</SelectItem>
                                        <SelectItem value="30">Every 30 minutes</SelectItem>
                                        <SelectItem value="60">Every hour</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            {/* Target WordPress Site removed as per request */}
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                            <Button
                                className="bg-gradient-to-r from-violet-600 to-indigo-600"
                                onClick={handleAddFeed}
                                disabled={!newFeedName || !newFeedUrl}
                            >
                                Add Feed
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-violet-500/10">
                                <Rss className="h-6 w-6 text-violet-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{feeds.length}</p>
                                <p className="text-sm text-muted-foreground">Total Feeds</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-500/10">
                                <CheckCircle2 className="h-6 w-6 text-green-600" />
                            </div>
                             <div>
                                 <p className="text-2xl font-bold">{feeds.filter(f => f.status === 'ACTIVE').length}</p>
                                 <p className="text-sm text-muted-foreground">Active</p>
                             </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-amber-500/10">
                                <Clock className="h-6 w-6 text-amber-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{pendingItems.length}</p>
                                <p className="text-sm text-muted-foreground">Pending Items</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-500/10">
                                <RefreshCw className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{feeds.reduce((acc, f) => acc + (f.itemsFetched || 0), 0)}</p>
                                <p className="text-sm text-muted-foreground">Items Fetched</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Feeds Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Your Feeds</CardTitle>
                    <CardDescription>Manage your RSS feed sources</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Interval</TableHead>
                                <TableHead>Last Polled</TableHead>
                                <TableHead>Items</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {feeds.map((feed) => (
                                <TableRow key={feed.id}>
                                    <TableCell>
                                        <div>
                                            <p className="font-medium">{feed.name}</p>
                                            <p className="text-xs text-muted-foreground truncate max-w-[200px]">{feed.url}</p>
                                        </div>
                                    </TableCell>
                                     <TableCell>{getStatusBadge(feed.status || 'ACTIVE')}</TableCell>
                                    <TableCell>{feed.pollingInterval || 15}m</TableCell>
                                    <TableCell>{formatTimeAgo(feed.lastSynced)}</TableCell>
                                    <TableCell>{feed.itemsFetched || 0}</TableCell>
                                     <TableCell className="text-right">
                                         <DropdownMenu>
                                             <DropdownMenuTrigger asChild>
                                                 <Button variant="ghost" size="icon">
                                                     <MoreHorizontal className="h-4 w-4" />
                                                 </Button>
                                             </DropdownMenuTrigger>
                                             <DropdownMenuContent align="end">
                                                 <DropdownMenuItem onClick={() => handlePollFeed(feed.id)} disabled={isPolling === feed.id}>
                                                     {isPolling === feed.id ? (
                                                         <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                     ) : (
                                                         <RefreshCw className="h-4 w-4 mr-2" />
                                                     )}
                                                     Poll Now
                                                 </DropdownMenuItem>
                                                 <DropdownMenuItem onClick={() => handleEditFeed(feed)}>
                                                     <EditIcon className="h-4 w-4 mr-2" />
                                                     Edit
                                                 </DropdownMenuItem>
                                                 {feed.status === 'ACTIVE' ? (
                                                     <DropdownMenuItem onClick={() => handlePauseFeed(feed.id)}>
                                                         <Pause className="h-4 w-4 mr-2" />
                                                         Pause
                                                     </DropdownMenuItem>
                                                 ) : (
                                                     <DropdownMenuItem onClick={() => handleResumeFeed(feed.id)}>
                                                         <Play className="h-4 w-4 mr-2" />
                                                         Resume
                                                     </DropdownMenuItem>
                                                 )}
                                                 <DropdownMenuItem
                                                     className="text-red-600"
                                                     onClick={() => handleRemoveFeed(feed.id)}
                                                 >
                                                     <Trash2 className="h-4 w-4 mr-2" />
                                                     Delete
                                                 </DropdownMenuItem>
                                             </DropdownMenuContent>
                                         </DropdownMenu>
                                     </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Pending Items */}
            <Card>
                <CardHeader>
                    <CardTitle>Pending Items</CardTitle>
                    <CardDescription>Items fetched but not yet processed</CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoadingPending ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : pendingItems.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            No pending items found
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Title</TableHead>
                                    <TableHead>Source</TableHead>
                                    <TableHead>Published</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {pendingItems.map((item) => (
                                    <TableRow key={item.id}>
                                        <TableCell className="font-medium max-w-[400px] truncate">
                                            {item.title}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline">{item.feed.name}</Badge>
                                        </TableCell>
                                        <TableCell>{formatTimeAgo(item.publishedAt)}</TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                size="sm"
                                                className="bg-gradient-to-r from-violet-600 to-indigo-600"
                                                onClick={() => handleProcessItem(item.id)}
                                                disabled={processingItem === item.id}
                                            >
                                                {processingItem === item.id ? (
                                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                                ) : null}
                                                Process
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                     )}
                </CardContent>
            </Card>

            {/* Edit Feed Dialog */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit RSS Feed</DialogTitle>
                        <DialogDescription>
                            Update your RSS feed settings.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="editName">Feed Name</Label>
                            <Input
                                id="editName"
                                placeholder="e.g., TechCrunch"
                                value={editFeedName}
                                onChange={(e) => setEditFeedName(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="editFeedUrl">Feed URL</Label>
                            <Input
                                id="editFeedUrl"
                                placeholder="https://example.com/rss"
                                value={editFeedUrl}
                                onChange={(e) => setEditFeedUrl(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="editInterval">Polling Interval</Label>
                            <Select value={editPollingInterval} onValueChange={setEditPollingInterval}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="5">Every 5 minutes</SelectItem>
                                    <SelectItem value="15">Every 15 minutes</SelectItem>
                                    <SelectItem value="30">Every 30 minutes</SelectItem>
                                    <SelectItem value="60">Every hour</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
                        <Button
                            className="bg-gradient-to-r from-violet-600 to-indigo-600"
                            onClick={handleUpdateFeed}
                            disabled={!editFeedName || !editFeedUrl}
                        >
                            Save Changes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
