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
    Loader2
} from 'lucide-react'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { motion, AnimatePresence } from 'framer-motion'
import { RssFeed, getFeeds, addFeed, removeFeed, updateFeed, pollFeed } from '@/lib/feeds-store'
import { toast } from 'sonner'

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.1 }
    }
} as const

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 100 } }
} as const

export default function FeedsPage() {
    const [isAddOpen, setIsAddOpen] = useState(false)
    const [feeds, setFeeds] = useState<RssFeed[]>([])
    const [newFeedName, setNewFeedName] = useState('')
    const [newFeedUrl, setNewFeedUrl] = useState('')
    const [pollingInterval, setPollingInterval] = useState('15')
    const [editingFeedId, setEditingFeedId] = useState<string | null>(null)
    const [isPolling, setIsPolling] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const loadFeeds = async () => {
            setIsLoading(true)
            try {
                const fetchedFeeds = await getFeeds()
                setFeeds(fetchedFeeds)
            } catch (error) {
                console.error('Failed to load feeds:', error)
                toast.error('Failed to load feeds')
            } finally {
                setIsLoading(false)
            }
        }
        loadFeeds()
    }, [])

    const handleAddFeed = async () => {
        if (!newFeedName || !newFeedUrl) return
        try {
            if (editingFeedId) {
                await updateFeed(editingFeedId, {
                    name: newFeedName,
                    url: newFeedUrl,
                    pollingInterval: parseInt(pollingInterval)
                })
                toast.success('Feed updated successfully')
            } else {
                const newFeed: RssFeed = {
                    id: Math.random().toString(36).substring(7),
                    name: newFeedName,
                    url: newFeedUrl,
                    status: 'active',
                    pollingInterval: parseInt(pollingInterval),
                    itemsFetched: 0,
                    lastSynced: new Date().toISOString()
                }
                await addFeed(newFeed)
                toast.success('Feed added successfully')
            }
            const updatedFeeds = await getFeeds()
            setFeeds(updatedFeeds)
            resetForm()
            setIsAddOpen(false)
        } catch (error) {
            console.error('Failed to save feed:', error)
            toast.error('Failed to save feed')
        }
    }

    const resetForm = () => {
        setNewFeedName('')
        setNewFeedUrl('')
        setPollingInterval('15')
        setEditingFeedId(null)
    }

    const handleEditClick = (feed: RssFeed) => {
        setEditingFeedId(feed.id)
        setNewFeedName(feed.name)
        setNewFeedUrl(feed.url)
        setPollingInterval(feed.pollingInterval?.toString() || '15')
        setIsAddOpen(true)
    }

    const handlePollNow = async (id: string) => {
        setIsPolling(id)
        try {
            const result = await pollFeed(id)
            if (result) {
                toast.success(`Polling completed: ${result.newItems} new items found`)
            } else {
                toast.success('Polling completed')
            }
            const updatedFeeds = await getFeeds()
            setFeeds(updatedFeeds)
        } catch (error) {
            toast.error('Failed to start polling: ' + (error instanceof Error ? error.message : 'Unknown error'))
        } finally {
            setIsPolling(null)
        }
    }

    const handleToggleStatus = async (feed: RssFeed) => {
        const currentStatus = (feed.status || 'ACTIVE').toUpperCase()
        const newStatus = currentStatus === 'ACTIVE' ? 'PAUSED' : 'ACTIVE'
        try {
            await updateFeed(feed.id, { status: newStatus as any })
            const updatedFeeds = await getFeeds()
            setFeeds(updatedFeeds)
            toast.success(`Feed ${newStatus === 'ACTIVE' ? 'resumed' : 'paused'}`)
        } catch (error) {
            toast.error('Failed to update status')
        }
    }

    const handleRemoveFeed = async (id: string) => {
        try {
            await removeFeed(id)
            const updatedFeeds = await getFeeds()
            setFeeds(updatedFeeds)
            toast.success('Feed removed')
        } catch (error) {
            console.error('Failed to remove feed:', error)
            toast.error('Failed to remove feed')
        }
    }

    const getStatusBadge = (status: string) => {
        const s = status.toUpperCase()
        switch (s) {
            case 'ACTIVE':
                return <Badge className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-emerald-500/20"><CheckCircle2 className="h-3 w-3 mr-1" />Active</Badge>
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
<<<<<<< HEAD
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
                                    <Rss className="w-4 h-4" />
                                    <span className="text-xs font-medium uppercase tracking-wider">Content Sources</span>
                                </div>
                                <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-1">Web Sources</h1>
                                <p className="text-blue-100 text-sm">Manage your RSS feed sources for content aggregation.</p>
                            </div>
                            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                                <DialogTrigger asChild>
                                    <Button className="bg-white text-blue-600 hover:bg-white/90">
                                        <Plus className="h-4 w-4 mr-2" />
                                        Add Source
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>{editingFeedId ? 'Edit RSS Feed' : 'Add RSS Feed'}</DialogTitle>
                                        <DialogDescription>
                                            {editingFeedId ? 'Update your feed settings.' : 'Add a new RSS feed to automatically fetch content.'}
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
                                    </div>
                                    <DialogFooter>
                                        <Button variant="outline" onClick={() => { setIsAddOpen(false); resetForm(); }}>Cancel</Button>
                                        <Button
                                            className="bg-gradient-to-r from-blue-600 to-cyan-500"
                                            onClick={handleAddFeed}
                                            disabled={!newFeedName || !newFeedUrl}
                                        >
                                            {editingFeedId ? 'Update Feed' : 'Add Feed'}
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Stats */}
            <motion.div className="grid grid-cols-2 lg:grid-cols-3 gap-4" variants={itemVariants}>
                <Card variant="glass" hover>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 text-white">
                                <Rss className="h-6 w-6" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-2xl font-bold truncate tabular-nums">{feeds.length}</p>
                                <p className="text-xs text-muted-foreground uppercase tracking-wider truncate">Total Feeds</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card variant="glass" hover>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-400 text-white">
                                <CheckCircle2 className="h-6 w-6" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-2xl font-bold truncate tabular-nums">{feeds.filter(f => f.status?.toUpperCase() === 'ACTIVE').length}</p>
                                <p className="text-xs text-muted-foreground uppercase tracking-wider truncate">Active</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card variant="glass" hover>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 text-white">
                                <RefreshCw className="h-6 w-6" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-2xl font-bold truncate tabular-nums">{feeds.reduce((acc, f) => acc + (f.itemsFetched || 0), 0)}</p>
                                <p className="text-xs text-muted-foreground uppercase tracking-wider truncate">Items Fetched</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Feeds Table */}
            <motion.div variants={itemVariants}>
                <Card variant="glass">
                    <CardHeader>
                        <CardTitle className="text-sm uppercase tracking-wider text-muted-foreground font-semibold">Your Feeds</CardTitle>
                        <CardDescription>Manage your RSS feed sources</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow className="hover:bg-transparent">
                                    <TableHead>Name</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Interval</TableHead>
                                    <TableHead>Last Polled</TableHead>
                                    <TableHead>Items</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="py-12">
                                            <div className="flex justify-center">
                                                <Loader2 className="h-8 w-8 animate-spin text-[var(--brand-primary)]" />
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : feeds.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                            No feeds found. Add one to start fetching content!
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    feeds.map((feed) => (
                                        <TableRow key={feed.id}>
                                            <TableCell>
                                                <div>
                                                    <p className="font-medium">{feed.name}</p>
                                                    <p className="text-xs text-muted-foreground truncate max-w-[200px]">{feed.url}</p>
                                                </div>
                                            </TableCell>
                                            <TableCell>{getStatusBadge(feed.status || 'active')}</TableCell>
                                            <TableCell className="tabular-nums">{feed.pollingInterval || 15}m</TableCell>
                                            <TableCell className="text-sm">{formatTimeAgo(feed.lastSynced)}</TableCell>
                                            <TableCell className="tabular-nums">{feed.itemsFetched || 0}</TableCell>
                                            <TableCell className="text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem
                                                            onClick={() => handlePollNow(feed.id)}
                                                            disabled={isPolling === feed.id}
                                                        >
                                                            <RefreshCw className={`h-4 w-4 mr-2 ${isPolling === feed.id ? 'animate-spin' : ''}`} />
                                                            {isPolling === feed.id ? 'Polling...' : 'Poll Now'}
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleEditClick(feed)}>
                                                            <Edit className="h-4 w-4 mr-2" />
                                                            Edit
                                                        </DropdownMenuItem>
                                                        {(feed.status || 'ACTIVE').toUpperCase() === 'ACTIVE' ? (
                                                            <DropdownMenuItem onClick={() => handleToggleStatus(feed)}>
                                                                <Pause className="h-4 w-4 mr-2" />
                                                                Pause
                                                            </DropdownMenuItem>
                                                        ) : (
                                                            <DropdownMenuItem onClick={() => handleToggleStatus(feed)}>
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
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
=======
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
        >
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <h1 className="text-4xl font-black tracking-tighter bg-gradient-to-r from-slate-900 to-slate-500 dark:from-white dark:to-slate-400 bg-clip-text text-transparent">
                        Web Sources
                    </h1>
                    <p className="text-slate-500 font-medium">
                        Automate content fetching from your favorite RSS feeds.
                    </p>
                </div>
                <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                    <DialogTrigger asChild>
                        <Button className="h-12 px-6 bg-slate-900 hover:bg-black text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-slate-200 dark:shadow-none transition-all hover:scale-[1.02] active:scale-[0.98]">
                            <Plus className="h-5 w-5 mr-2" />
                            New Source
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="glass border-none max-w-md">
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-black tracking-tight">{editingFeedId ? 'Update Source' : 'Connect Source'}</DialogTitle>
                            <DialogDescription className="font-medium">
                                Configure a new RSS feed for auto-scraping.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-6">
                            <div className="space-y-2">
                                <Label className="text-[10px] uppercase font-black tracking-widest text-slate-400 ml-1">Source Name</Label>
                                <Input
                                    placeholder="e.g., TechCrunch News"
                                    className="h-12 rounded-xl bg-white/50 border-slate-200 focus:ring-blue-400 font-bold"
                                    value={newFeedName}
                                    onChange={(e) => setNewFeedName(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] uppercase font-black tracking-widest text-slate-400 ml-1">Feed URL</Label>
                                <Input
                                    placeholder="https://example.com/feed"
                                    className="h-12 rounded-xl bg-white/50 border-slate-200 focus:ring-blue-400 font-mono text-xs"
                                    value={newFeedUrl}
                                    onChange={(e) => setNewFeedUrl(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] uppercase font-black tracking-widest text-slate-400 ml-1">Polling Frequency</Label>
                                <Select value={pollingInterval} onValueChange={setPollingInterval}>
                                    <SelectTrigger className="h-12 rounded-xl bg-white/50 border-slate-200 font-bold">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="glass border-none">
                                        <SelectItem value="5">Turbo (5 min)</SelectItem>
                                        <SelectItem value="15">Frequent (15 min)</SelectItem>
                                        <SelectItem value="30">Normal (30 min)</SelectItem>
                                        <SelectItem value="60">Daily (1 hour)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <DialogFooter className="gap-2">
                            <Button variant="ghost" className="rounded-xl font-bold" onClick={() => { setIsAddOpen(false); resetForm(); }}>Cancel</Button>
                            <Button
                                className="h-12 px-8 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black uppercase tracking-widest shadow-lg shadow-blue-100"
                                onClick={handleAddFeed}
                                disabled={!newFeedName || !newFeedUrl}
                            >
                                {editingFeedId ? 'Update' : 'Add Source'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                <motion.div
                    whileHover={{ y: -5 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                >
                    <Card className="card-clean border-none p-6 shadow-sm">
                        <div className="flex items-center gap-5">
                            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 shadow-inner">
                                <Rss className="h-7 w-7" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-3xl font-black tracking-tighter">{feeds.length}</p>
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Sources</p>
                            </div>
                        </div>
                    </Card>
                </motion.div>
                <motion.div
                    whileHover={{ y: -5 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17, delay: 0.1 }}
                >
                    <Card className="card-clean border-none p-6 shadow-sm">
                        <div className="flex items-center gap-5">
                            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 shadow-inner">
                                <CheckCircle2 className="h-7 w-7" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-3xl font-black tracking-tighter">{feeds.filter(f => f.status?.toUpperCase() === 'ACTIVE').length}</p>
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Syncing</p>
                            </div>
                        </div>
                    </Card>
                </motion.div>
                <motion.div
                    whileHover={{ y: -5 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17, delay: 0.2 }}
                >
                    <Card className="card-clean border-none p-6 shadow-sm">
                        <div className="flex items-center gap-5">
                            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 shadow-inner">
                                <RefreshCw className="h-7 w-7" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-3xl font-black tracking-tighter">{feeds.reduce((acc, f) => acc + (f.itemsFetched || 0), 0)}</p>
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Articles Scraped</p>
                            </div>
                        </div>
                    </Card>
                </motion.div>
            </div>

            {/* Feeds Table */}
            <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                className="card-clean p-8"
            >
                <div className="mb-8">
                    <h2 className="text-xl font-black tracking-tight">Active Stream</h2>
                    <p className="text-slate-400 text-sm font-medium">Monitoring sources in real-time</p>
                </div>

                <div className="rounded-[2.5rem] overflow-hidden border border-slate-100 dark:border-slate-800">
                    <Table>
                        <TableHeader className="bg-slate-50/50 dark:bg-slate-800/20">
                            <TableRow className="border-none hover:bg-transparent">
                                <TableHead className="h-16 font-black text-slate-400 uppercase tracking-widest text-[10px] px-8">Source Name</TableHead>
                                <TableHead className="h-16 font-black text-slate-400 uppercase tracking-widest text-[10px]">Status</TableHead>
                                <TableHead className="h-16 font-black text-slate-400 uppercase tracking-widest text-[10px]">Freq</TableHead>
                                <TableHead className="h-16 font-black text-slate-400 uppercase tracking-widest text-[10px]">Last Synced</TableHead>
                                <TableHead className="h-16 font-black text-slate-400 uppercase tracking-widest text-[10px]">Count</TableHead>
                                <TableHead className="h-16 text-right px-8"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="py-20 text-center">
                                        <Loader2 className="h-10 w-10 animate-spin text-blue-600 opacity-20 mx-auto" />
                                    </TableCell>
                                </TableRow>
                            ) : feeds.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-20 text-slate-400 font-bold uppercase tracking-widest text-xs">
                                        No data streams found
                                    </TableCell>
                                </TableRow>
                            ) : (
                                feeds.map((feed) => (
                                    <TableRow key={feed.id} className="group border-slate-50 dark:border-slate-800 hover:bg-slate-50/50 transition-colors">
                                        <TableCell className="px-8 font-black text-slate-900 dark:text-white uppercase tracking-tighter">
                                            <div>
                                                <p className="text-sm">{feed.name}</p>
                                                <p className="text-[10px] text-slate-400 truncate max-w-[180px] font-mono">{feed.url}</p>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={`rounded-lg px-2 py-0.5 font-extrabold uppercase text-[9px] tracking-wider ${(feed.status || 'ACTIVE').toUpperCase() === 'ACTIVE'
                                                ? 'bg-emerald-100 text-emerald-700'
                                                : 'bg-rose-100 text-rose-700'
                                                }`}>
                                                {feed.status || 'active'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="font-bold text-slate-500 text-sm whitespace-nowrap">{feed.pollingInterval || 15}m</TableCell>
                                        <TableCell className="font-bold text-slate-500 text-sm whitespace-nowrap">{formatTimeAgo(feed.lastSynced)}</TableCell>
                                        <TableCell className="font-black text-blue-600 bg-blue-50/50 text-center rounded-lg h-7 w-12 p-0 inline-flex items-center justify-center my-4">{feed.itemsFetched || 0}</TableCell>
                                        <TableCell className="text-right px-8">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-blue-50 hover:text-blue-600">
                                                        <MoreHorizontal className="h-5 w-5" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="glass border-none min-w-[170px]">
                                                    <DropdownMenuItem
                                                        onClick={() => handlePollNow(feed.id)}
                                                        disabled={isPolling === feed.id}
                                                        className="font-bold py-2.5"
                                                    >
                                                        <RefreshCw className={`h-4 w-4 mr-2 ${isPolling === feed.id ? 'animate-spin' : ''}`} />
                                                        {isPolling === feed.id ? 'Fetching...' : 'Manual Sync'}
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleEditClick(feed)} className="font-bold py-2.5">
                                                        <Edit className="h-4 w-4 mr-2" />
                                                        Configurations
                                                    </DropdownMenuItem>
                                                    {(feed.status || 'ACTIVE').toUpperCase() === 'ACTIVE' ? (
                                                        <DropdownMenuItem onClick={() => handleToggleStatus(feed)} className="font-bold py-2.5 text-amber-600">
                                                            <Pause className="h-4 w-4 mr-2" />
                                                            Pause Stream
                                                        </DropdownMenuItem>
                                                    ) : (
                                                        <DropdownMenuItem onClick={() => handleToggleStatus(feed)} className="font-bold py-2.5 text-emerald-600">
                                                            <Play className="h-4 w-4 mr-2" />
                                                            Resume Stream
                                                        </DropdownMenuItem>
                                                    )}
                                                    <DropdownMenuSeparator className="opacity-50" />
                                                    <DropdownMenuItem
                                                        className="text-rose-600 font-extrabold py-2.5"
                                                        onClick={() => handleRemoveFeed(feed.id)}
                                                    >
                                                        <Trash2 className="h-4 w-4 mr-2" />
                                                        Kill Stream
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
>>>>>>> c1209c3 (feat: global styling refresh, layout fixes, and build error resolution)
            </motion.div>
        </motion.div>
    )
}
