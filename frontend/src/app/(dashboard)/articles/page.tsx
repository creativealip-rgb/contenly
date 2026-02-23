'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import {
    Search,
    Filter,
    MoreHorizontal,
    Eye,
    Edit,
    Trash2,
    RefreshCw,
    FileText,
    CheckCircle2,
    Clock,
    XCircle,
    Loader2
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
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

export default function ArticlesPage() {
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')
    const [articles, setArticles] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [stats, setStats] = useState({
        total: 0,
        published: 0,
        draft: 0,
        scheduled: 0
    })

    const fetchArticles = async () => {
        setIsLoading(true)
        try {
            const params = new URLSearchParams()
            if (search) params.append('search', search)
            if (statusFilter !== 'all') params.append('status', statusFilter.toUpperCase())
            const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'
            const response = await fetch(`${API_BASE_URL}/articles?${params.toString()}`, {
                credentials: 'include'
            })
            if (response.ok) {
                const data = await response.json()
                setArticles(data.data || [])
                const allItems = data.data || []
                setStats({
                    total: data.meta?.total || allItems.length,
                    published: allItems.filter((a: any) => a.status === 'PUBLISHED').length,
                    draft: allItems.filter((a: any) => a.status === 'DRAFT').length,
                    scheduled: allItems.filter((a: any) => a.status === 'FUTURE' || a.status === 'SCHEDULED').length
                })
            }
        } catch (error) {
            console.error('Failed to fetch articles:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this article?')) return
        try {
            const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'
            const response = await fetch(`${API_BASE_URL}/articles/${id}`, {
                method: 'DELETE',
                credentials: 'include'
            })
            if (response.ok) {
                toast.success('Article deleted')
                fetchArticles()
            } else {
                toast.error('Failed to delete article')
            }
        } catch (error) {
            toast.error('Error deleting article')
        }
    }

    const handleView = (article: any) => {
        if (article.wpPostUrl) {
            window.open(article.wpPostUrl, '_blank')
        } else if (article.sourceUrl) {
            window.open(article.sourceUrl, '_blank')
        } else {
            toast.info('No URL available for this article')
        }
    }

    const handleEdit = (article: any) => {
        if (article.wpSite?.url && article.wpPostId) {
            const editUrl = `${article.wpSite.url}/wp-admin/post.php?post=${article.wpPostId}&action=edit`
            window.open(editUrl, '_blank')
        } else {
            toast.info('This article is not yet published to WordPress.')
        }
    }

    const handleSyncStatus = async () => {
        setIsLoading(true)
        try {
            const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'
            const response = await fetch(`${API_BASE_URL}/wordpress/sync-scheduled`, {
                method: 'POST',
                credentials: 'include'
            })
            if (response.ok) {
                toast.success('Status synchronization completed')
                fetchArticles()
            } else {
                toast.error('Failed to sync statuses')
            }
        } catch (error) {
            toast.error('Error during synchronization')
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchArticles()
    }, [search, statusFilter])

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'PUBLISHED':
                return <Badge className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-emerald-500/20"><CheckCircle2 className="h-3 w-3 mr-1" />Published</Badge>
            case 'DRAFT':
                return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Draft</Badge>
            case 'FUTURE':
            case 'SCHEDULED':
                return <Badge className="bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 border-blue-500/20"><Clock className="h-3 w-3 mr-1" />Scheduled</Badge>
            case 'FAILED':
                return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Failed</Badge>
            default:
                return <Badge variant="outline">{status}</Badge>
        }
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
                        Article Lab
                    </h1>
                    <p className="text-slate-500 font-medium">
                        Archive and management of your AI-generated assets.
                    </p>
                </div>
                <div className="flex gap-4">
                    <Button
                        variant="ghost"
                        onClick={handleSyncStatus}
                        disabled={isLoading}
                        className="h-12 px-6 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-white/40 glass border-none transition-all active:scale-95"
                    >
                        <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                        Sync WP
                    </Button>
                    <Button
                        className="h-12 px-6 bg-slate-900 hover:bg-black text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-slate-200 transition-all hover:scale-[1.02] active:scale-[0.98]"
                        onClick={fetchArticles}
                        disabled={isLoading}
                    >
                        <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                <motion.div whileHover={{ y: -2 }} className="glass border-2 border-white/60 dark:border-white/20 overflow-hidden hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-none transition-all duration-500 rounded-3xl p-6">
                    <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                            <FileText className="h-6 w-6" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-2xl font-black tracking-tighter">{stats.total}</p>
                            <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Total Assets</p>
                        </div>
                    </div>
                </motion.div>
                <motion.div whileHover={{ y: -2 }} transition={{ delay: 0.05 }} className="glass border-2 border-white/60 dark:border-white/20 overflow-hidden hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-none transition-all duration-500 rounded-3xl p-6">
                    <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                            <CheckCircle2 className="h-6 w-6" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-2xl font-black tracking-tighter">{stats.published}</p>
                            <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Live</p>
                        </div>
                    </div>
                </motion.div>
                <motion.div whileHover={{ y: -2 }} transition={{ delay: 0.1 }} className="glass border-2 border-white/60 dark:border-white/20 overflow-hidden hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-none transition-all duration-500 rounded-3xl p-6">
                    <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
                            <Clock className="h-6 w-6" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-2xl font-black tracking-tighter">{stats.draft}</p>
                            <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Drafts</p>
                        </div>
                    </div>
                </motion.div>
                <motion.div whileHover={{ y: -2 }} transition={{ delay: 0.15 }} className="glass border-2 border-white/60 dark:border-white/20 overflow-hidden hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-none transition-all duration-500 rounded-3xl p-6">
                    <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                            <Clock className="h-6 w-6" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-2xl font-black tracking-tighter">{stats.scheduled}</p>
                            <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Queued</p>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Filters */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
                <div className="flex flex-col gap-6 md:flex-row md:items-center glass p-6 rounded-[2rem] border-none shadow-sm">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                        <Input
                            placeholder="Filter by title or keyword..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="h-12 pl-12 rounded-2xl bg-white/40 border-none focus-visible:ring-blue-400 font-bold dark:bg-slate-800/40"
                        />
                    </div>
                    <div className="flex gap-4">
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="h-12 w-[180px] rounded-2xl bg-white/40 border-none font-bold glass dark:bg-slate-800/40">
                                <div className="flex items-center gap-2">
                                    <Filter className="h-4 w-4 text-slate-400" />
                                    <SelectValue placeholder="Status" />
                                </div>
                            </SelectTrigger>
                            <SelectContent className="glass border-none">
                                <SelectItem value="all">All Content</SelectItem>
                                <SelectItem value="published">Published</SelectItem>
                                <SelectItem value="draft">Drafts Only</SelectItem>
                                <SelectItem value="scheduled">Scheduled</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </motion.div>

            {/* Articles Table */}
            <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                className="glass border-2 border-white/60 dark:border-white/20 overflow-hidden hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-none transition-all duration-500 rounded-3xl p-8"
            >
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h2 className="text-xl font-black tracking-tight">Recent Activity</h2>
                        <p className="text-slate-400 text-sm font-medium">Timeline of generated narratives</p>
                    </div>
                    <Badge variant="outline" className="h-8 px-4 border-slate-100 dark:border-slate-800 rounded-xl font-bold uppercase text-[10px] tracking-widest text-slate-400">
                        {articles.length} Items
                    </Badge>
                </div>

                <div className="rounded-[2.5rem] overflow-hidden border border-slate-50 dark:border-slate-800">
                    <Table>
                        <TableHeader className="bg-slate-50/50 dark:bg-slate-800/20">
                            <TableRow className="border-none hover:bg-transparent">
                                <TableHead className="h-16 font-black text-slate-400 uppercase tracking-widest text-[10px] px-8">NARRATIVE TITLE</TableHead>
                                <TableHead className="h-16 font-black text-slate-400 uppercase tracking-widest text-[10px]">Status</TableHead>
                                <TableHead className="h-16 font-black text-slate-400 uppercase tracking-widest text-[10px]">DESTINATION site</TableHead>
                                <TableHead className="h-16 font-black text-slate-400 uppercase tracking-widest text-[10px]">CREDITS</TableHead>
                                <TableHead className="h-16 font-black text-slate-400 uppercase tracking-widest text-[10px]">Timestamp</TableHead>
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
                            ) : articles.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-20 text-slate-400 font-bold uppercase tracking-widest text-xs">
                                        Archive is empty
                                    </TableCell>
                                </TableRow>
                            ) : (
                                articles.map((article, idx) => (
                                    <motion.tr
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.4 + idx * 0.02 }}
                                        key={article.id}
                                        className="group border-slate-50 dark:border-slate-800 hover:bg-slate-50/50 transition-colors"
                                    >
                                        <TableCell className="px-8 py-5">
                                            <p className="font-extrabold text-slate-900 dark:text-white truncate max-w-[320px] text-sm uppercase tracking-tight">{article.title}</p>
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={`rounded-lg px-2 py-0.5 font-extrabold uppercase text-[9px] tracking-wider ${article.status === 'PUBLISHED'
                                                ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                                                : article.status === 'DRAFT'
                                                    ? 'bg-amber-100 text-amber-700 border border-amber-200'
                                                    : 'bg-blue-100 text-blue-700 border border-blue-200'
                                                }`}>
                                                {article.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-slate-600">{article.wpSite?.name || 'Local Storage'}</span>
                                                <span className="text-[10px] text-slate-400 font-mono">{article.wpSite?.url?.replace('https://', '') || '—'}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1.5 font-black text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg w-fit">
                                                <span className="text-xs">{article.tokensUsed}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-xs font-bold text-slate-400 whitespace-nowrap">
                                            {formatDistanceToNow(new Date(article.createdAt), { addSuffix: true })}
                                        </TableCell>
                                        <TableCell className="text-right px-8">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-blue-50 hover:text-blue-600">
                                                        <MoreHorizontal className="h-5 w-5" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="glass border-none min-w-[170px]">
                                                    <DropdownMenuItem onClick={() => handleView(article)} className="font-bold py-2.5">
                                                        <Eye className="h-4 w-4 mr-2" />
                                                        View Asset
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={() => handleEdit(article)}
                                                        disabled={!article.wpPostId}
                                                        className="font-bold py-2.5"
                                                    >
                                                        <Edit className="h-4 w-4 mr-2" />
                                                        Edit in WP
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator className="opacity-50" />
                                                    <DropdownMenuItem
                                                        className="text-rose-600 font-extrabold py-2.5"
                                                        onClick={() => handleDelete(article.id)}
                                                    >
                                                        <Trash2 className="h-4 w-4 mr-2" />
                                                        Purge Asset
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </motion.tr>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </motion.div>
        </motion.div>
    )
}
