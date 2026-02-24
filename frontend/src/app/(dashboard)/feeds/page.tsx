'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
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
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
    Plus,
    Rss,
    RefreshCw,
    CheckCircle2,
    Pause,
    Play,
    XCircle,
    MoreHorizontal,
    Edit,
    Trash2,
    Loader2
} from 'lucide-react'
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
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
        >
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <h1 className="text-4xl font-black tracking-tighter bg-gradient-to-r from-slate-900 to-slate-500 dark:from-white dark:to-slate-400 bg-clip-text text-transparent">
                        Sumber Web
                    </h1>
                    <p className="text-slate-500 font-medium">
                        Otomatiskan pengambilan konten dari RSS feed favorit Anda.
                    </p>
                </div>
                <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                    <DialogTrigger asChild>
                        <Button className="h-12 px-6 bg-slate-900 hover:bg-black text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-slate-200 dark:shadow-none transition-all hover:scale-[1.02] active:scale-[0.98]">
                            <Plus className="h-5 w-5 mr-2" />
                            Tambah Sumber
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>{editingFeedId ? 'Perbarui Sumber' : 'Hubungkan Sumber'}</DialogTitle>
                            <DialogDescription>
                                Atur RSS feed baru untuk penarikan konten otomatis (auto-scraping).
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Nama Sumber</Label>
                                <Input
                                    placeholder="cth., TechCrunch News"
                                    value={newFeedName}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewFeedName(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>URL Feed</Label>
                                <Input
                                    placeholder="https://example.com/feed"
                                    value={newFeedUrl}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewFeedUrl(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Frekuensi Penarikan</Label>
                                <Select value={pollingInterval} onValueChange={setPollingInterval}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="5">Turbo (5 menit)</SelectItem>
                                        <SelectItem value="15">Sering (15 menit)</SelectItem>
                                        <SelectItem value="30">Normal (30 menit)</SelectItem>
                                        <SelectItem value="60">Harian (1 jam)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => { setIsAddOpen(false); resetForm(); }}>Batal</Button>
                            <Button
                                onClick={handleAddFeed}
                                disabled={!newFeedName || !newFeedUrl}
                            >
                                {editingFeedId ? 'Perbarui' : 'Tambah Sumber'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                <motion.div
                    whileHover={{ y: -2 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                >
                    <Card className="glass border-2 border-white/60 dark:border-white/20 overflow-hidden hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-none transition-all duration-500 rounded-3xl p-6">
                        <div className="flex items-center gap-5">
                            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 shadow-inner">
                                <Rss className="h-7 w-7" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-3xl font-black tracking-tighter">{feeds.length}</p>
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Sumber</p>
                            </div>
                        </div>
                    </Card>
                </motion.div>
                <motion.div
                    whileHover={{ y: -2 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17, delay: 0.1 }}
                >
                    <Card className="glass border-2 border-white/60 dark:border-white/20 overflow-hidden hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-none transition-all duration-500 rounded-3xl p-6">
                        <div className="flex items-center gap-5">
                            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 shadow-inner">
                                <CheckCircle2 className="h-7 w-7" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-3xl font-black tracking-tighter">{feeds.filter(f => f.status?.toUpperCase() === 'ACTIVE').length}</p>
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Aktif</p>
                            </div>
                        </div>
                    </Card>
                </motion.div>
                <motion.div
                    whileHover={{ y: -2 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17, delay: 0.2 }}
                >
                    <Card className="glass border-2 border-white/60 dark:border-white/20 overflow-hidden hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-none transition-all duration-500 rounded-3xl p-6">
                        <div className="flex items-center gap-5">
                            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 shadow-inner">
                                <RefreshCw className="h-7 w-7" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-3xl font-black tracking-tighter">{feeds.reduce((acc, f) => acc + (f.itemsFetched || 0), 0)}</p>
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Artikel Ditarik</p>
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
                    <h2 className="text-xl font-black tracking-tight">Stream Aktif</h2>
                    <p className="text-slate-400 text-sm font-medium">Memantau sumber daya secara real-time</p>
                </div>

                <div className="rounded-[2.5rem] overflow-hidden border border-slate-100 dark:border-slate-800">
                    <Table>
                        <TableHeader className="bg-slate-50/50 dark:bg-slate-800/20">
                            <TableRow className="border-none hover:bg-transparent">
                                <TableHead className="h-16 font-black text-slate-400 uppercase tracking-widest text-[10px] px-8">Nama Sumber</TableHead>
                                <TableHead className="h-16 font-black text-slate-400 uppercase tracking-widest text-[10px]">Status</TableHead>
                                <TableHead className="h-16 font-black text-slate-400 uppercase tracking-widest text-[10px]">Frekuensi</TableHead>
                                <TableHead className="h-16 font-black text-slate-400 uppercase tracking-widest text-[10px]">Sinkronisasi Terakhir</TableHead>
                                <TableHead className="h-16 font-black text-slate-400 uppercase tracking-widest text-[10px]">Jumlah</TableHead>
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
                                        Tidak ada sumber web yang ditemukan
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
                                        <TableCell className="px-8">
                                            <div className="flex items-center gap-1.5 font-black text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg w-fit">
                                                <span className="text-xs">{feed.itemsFetched || 0}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right px-8">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-blue-50 hover:text-blue-600">
                                                        <MoreHorizontal className="h-5 w-5" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="min-w-[170px]">
                                                    <DropdownMenuItem
                                                        onClick={() => handlePollNow(feed.id)}
                                                        disabled={isPolling === feed.id}
                                                        className="cursor-pointer"
                                                    >
                                                        <RefreshCw className={`h-4 w-4 mr-2 ${isPolling === feed.id ? 'animate-spin' : ''}`} />
                                                        {isPolling === feed.id ? 'Menarik data...' : 'Sinkronisasi Manual'}
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleEditClick(feed)} className="cursor-pointer">
                                                        <Edit className="h-4 w-4 mr-2" />
                                                        Konfigurasi
                                                    </DropdownMenuItem>
                                                    {(feed.status || 'ACTIVE').toUpperCase() === 'ACTIVE' ? (
                                                        <DropdownMenuItem onClick={() => handleToggleStatus(feed)} className="text-amber-600 focus:bg-amber-100 cursor-pointer">
                                                            <Pause className="h-4 w-4 mr-2" />
                                                            Jeda Stream
                                                        </DropdownMenuItem>
                                                    ) : (
                                                        <DropdownMenuItem onClick={() => handleToggleStatus(feed)} className="text-emerald-600 focus:bg-emerald-100 cursor-pointer">
                                                            <Play className="h-4 w-4 mr-2" />
                                                            Lanjutkan Stream
                                                        </DropdownMenuItem>
                                                    )}
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem
                                                        className="text-destructive focus:bg-destructive/10 cursor-pointer"
                                                        onClick={() => handleRemoveFeed(feed.id)}
                                                    >
                                                        <Trash2 className="h-4 w-4 mr-2" />
                                                        Hapus Stream
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
            </motion.div>
        </motion.div>
    )
}
