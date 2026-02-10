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
    Edit,
    RefreshCw,
    CheckCircle2,
    XCircle,
    Clock
} from 'lucide-react'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { RssFeed, getFeeds, addFeed, removeFeed } from '@/lib/feeds-store'



export default function FeedsPage() {
    const [isAddOpen, setIsAddOpen] = useState(false)
    const [feeds, setFeeds] = useState<RssFeed[]>([])
    const [newFeedName, setNewFeedName] = useState('')
    const [newFeedUrl, setNewFeedUrl] = useState('')
    const [pollingInterval, setPollingInterval] = useState('15')

    useEffect(() => {
        const loadFeeds = async () => {
            const fetchedFeeds = await getFeeds()
            setFeeds(fetchedFeeds)
        }
        loadFeeds()
    }, [])

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

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'active':
                return <Badge className="bg-green-500/10 text-green-600 hover:bg-green-500/20"><CheckCircle2 className="h-3 w-3 mr-1" />Active</Badge>
            case 'paused':
                return <Badge variant="secondary"><Pause className="h-3 w-3 mr-1" />Paused</Badge>
            case 'error':
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
                        Manage your RSS feed sources.
                    </p>
                </div>
                <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-gradient-to-r from-blue-600 to-blue-700">
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
                                className="bg-gradient-to-r from-blue-600 to-blue-700"
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
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-blue-500/10">
                                <Rss className="h-6 w-6 text-blue-600" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-2xl font-bold truncate">{feeds.length}</p>
                                <p className="text-sm text-muted-foreground truncate" title="Total Feeds">Total Feeds</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-green-500/10">
                                <CheckCircle2 className="h-6 w-6 text-green-600" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-2xl font-bold truncate">{feeds.filter(f => f.status === 'active').length}</p>
                                <p className="text-sm text-muted-foreground truncate" title="Active">Active</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-blue-500/10">
                                <RefreshCw className="h-6 w-6 text-blue-600" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-2xl font-bold truncate">{feeds.reduce((acc, f) => acc + (f.itemsFetched || 0), 0)}</p>
                                <p className="text-sm text-muted-foreground truncate" title="Items Fetched">Items Fetched</p>
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
                                    <TableCell>{getStatusBadge(feed.status || 'active')}</TableCell>
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
                                                <DropdownMenuItem>
                                                    <RefreshCw className="h-4 w-4 mr-2" />
                                                    Poll Now
                                                </DropdownMenuItem>
                                                <DropdownMenuItem>
                                                    <Edit className="h-4 w-4 mr-2" />
                                                    Edit
                                                </DropdownMenuItem>
                                                {feed.status === 'active' ? (
                                                    <DropdownMenuItem>
                                                        <Pause className="h-4 w-4 mr-2" />
                                                        Pause
                                                    </DropdownMenuItem>
                                                ) : (
                                                    <DropdownMenuItem>
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


        </div>
    )
}
