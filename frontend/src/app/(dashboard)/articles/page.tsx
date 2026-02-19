'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
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
                                    <FileText className="w-4 h-4" />
                                    <span className="text-xs font-medium uppercase tracking-wider">Content Management</span>
                                </div>
                                <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-1">Articles</h1>
                                <p className="text-blue-100 text-sm">View and manage all your generated articles.</p>
                            </div>
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm" onClick={handleSyncStatus} disabled={isLoading} className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                                    <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                                    Sync
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Stats */}
            <motion.div className="grid grid-cols-2 gap-4 lg:grid-cols-4" variants={itemVariants}>
                <Card variant="glass" hover>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 text-white">
                                <FileText className="h-6 w-6" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-2xl font-bold truncate tabular-nums">{stats.total}</p>
                                <p className="text-xs text-muted-foreground uppercase tracking-wider truncate">Total Articles</p>
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
                                <p className="text-2xl font-bold truncate tabular-nums">{stats.published}</p>
                                <p className="text-xs text-muted-foreground uppercase tracking-wider truncate">Published</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card variant="glass" hover>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-amber-400 text-white">
                                <Clock className="h-6 w-6" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-2xl font-bold truncate tabular-nums">{stats.draft}</p>
                                <p className="text-xs text-muted-foreground uppercase tracking-wider truncate">Drafts</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card variant="glass" hover>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 text-white">
                                <Clock className="h-6 w-6" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-2xl font-bold truncate tabular-nums">{stats.scheduled}</p>
                                <p className="text-xs text-muted-foreground uppercase tracking-wider truncate">Scheduled</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Filters */}
            <motion.div variants={itemVariants}>
                <Card variant="glass">
                    <CardContent className="pt-6">
                        <div className="flex flex-col gap-4 md:flex-row md:items-center">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search articles..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                            <div className="flex gap-4">
                                <Select value={statusFilter} onValueChange={setStatusFilter}>
                                    <SelectTrigger className="w-[150px]">
                                        <Filter className="h-4 w-4 mr-2" />
                                        <SelectValue placeholder="Status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Status</SelectItem>
                                        <SelectItem value="published">Published</SelectItem>
                                        <SelectItem value="draft">Draft</SelectItem>
                                        <SelectItem value="scheduled">Scheduled</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Articles Table */}
            <motion.div variants={itemVariants}>
                <Card variant="glass">
                    <CardHeader>
                        <CardTitle className="text-sm uppercase tracking-wider text-muted-foreground font-semibold">Article History</CardTitle>
                        <CardDescription>
                            Showing {articles.length} articles
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="flex justify-center py-8">
                                <Loader2 className="h-8 w-8 animate-spin text-[var(--brand-primary)]" />
                            </div>
                        ) : articles.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                No articles found. Generate one in Content Lab!
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow className="hover:bg-transparent">
                                        <TableHead className="w-[400px]">Title</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Site</TableHead>
                                        <TableHead>Tokens</TableHead>
                                        <TableHead>Created</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {articles.map((article) => (
                                        <TableRow key={article.id}>
                                            <TableCell>
                                                <p className="font-medium truncate max-w-[400px]">{article.title}</p>
                                            </TableCell>
                                            <TableCell>{getStatusBadge(article.status)}</TableCell>
                                            <TableCell>
                                                {article.wpSite ? (
                                                    <span className="text-sm">{article.wpSite.name}</span>
                                                ) : (
                                                    <span className="text-sm text-muted-foreground">—</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-sm tabular-nums">{article.tokensUsed}</TableCell>
                                            <TableCell className="text-sm text-muted-foreground">
                                                {formatDistanceToNow(new Date(article.createdAt), { addSuffix: true })}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={() => handleView(article)}>
                                                            <Eye className="h-4 w-4 mr-2" />
                                                            View
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={() => handleEdit(article)}
                                                            disabled={!article.wpPostId}
                                                        >
                                                            <Edit className="h-4 w-4 mr-2" />
                                                            Edit
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            className="text-red-600"
                                                            onClick={() => handleDelete(article.id)}
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
                        )}
                    </CardContent>
                </Card>
            </motion.div>
        </motion.div>
    )
}
