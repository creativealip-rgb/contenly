'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
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
    Calendar,
    Download,
    Loader2,
    Send,
    ExternalLink
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

export default function ArticlesPage() {
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')
    const [articles, setArticles] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [stats, setStats] = useState({
        total: 0,
        generated: 0,
        published: 0,
        draft: 0,
        scheduled: 0
    })
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [articleToDelete, setArticleToDelete] = useState<any>(null)
    const [isDeleting, setIsDeleting] = useState(false)
    const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
    const [isPublishing, setIsPublishing] = useState(false)

    const fetchArticles = async () => {
        setIsLoading(true)
        try {
            // Build query params
            const params = new URLSearchParams()
            if (search) params.append('search', search)
            if (statusFilter !== 'all') params.append('status', statusFilter.toUpperCase())

            // Use relative path to leverage Next.js proxy
            const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

            const response = await fetch(`${API_BASE_URL}/articles?${params.toString()}`, {
                credentials: 'include'
            })

            if (response.ok) {
                const data = await response.json()
                setArticles(data.data || [])

                // Calculate stats from data (simplified for now, ideally backend provides this)
                const allItems = data.data || []
                setStats({
                    total: data.meta?.total || allItems.length,
                    generated: allItems.filter((a: any) => a.status === 'GENERATED').length,
                    published: allItems.filter((a: any) => a.status === 'PUBLISHED').length,
                    draft: allItems.filter((a: any) => a.status === 'DRAFT').length,
                    scheduled: allItems.filter((a: any) => a.status === 'SCHEDULED').length
                })
            }
        } catch (error) {
            console.error('Failed to fetch articles:', error)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchArticles()
    }, [search, statusFilter])

    const handleDeleteClick = (article: any) => {
        setArticleToDelete(article)
        setDeleteDialogOpen(true)
    }

    const handleDeleteConfirm = async () => {
        if (!articleToDelete) return

        setIsDeleting(true)
        try {
            const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'
            const response = await fetch(`${API_BASE_URL}/articles/${articleToDelete.id}`, {
                method: 'DELETE',
                credentials: 'include'
            })

            if (response.ok) {
                setAlert({ type: 'success', message: 'Article deleted successfully' })
                setDeleteDialogOpen(false)
                setArticleToDelete(null)
                await fetchArticles()
            } else {
                const data = await response.json()
                setAlert({ type: 'error', message: data.message || 'Failed to delete article' })
            }
        } catch (error) {
            console.error('Failed to delete article:', error)
            setAlert({ type: 'error', message: 'Failed to delete article' })
        } finally {
            setIsDeleting(false)
        }
    }

    const handlePublishClick = async (article: any) => {
        if (article.status === 'PUBLISHED') {
            setAlert({ type: 'error', message: 'Article is already published' })
            return
        }

        setIsPublishing(true)
        try {
            const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'
            const response = await fetch(`${API_BASE_URL}/articles/${article.id}/publish`, {
                method: 'PATCH',
                credentials: 'include'
            })

            if (response.ok) {
                setAlert({ type: 'success', message: 'Article published successfully' })
                await fetchArticles()
            } else {
                const data = await response.json()
                setAlert({ type: 'error', message: data.message || 'Failed to publish article' })
            }
        } catch (error) {
            console.error('Failed to publish article:', error)
            setAlert({ type: 'error', message: 'Failed to publish article' })
        } finally {
            setIsPublishing(false)
        }
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'GENERATED':
                return <Badge className="bg-purple-500/10 text-purple-600 hover:bg-purple-500/20"><FileText className="h-3 w-3 mr-1" />Generated</Badge>
            case 'PUBLISHED':
                return <Badge className="bg-green-500/10 text-green-600 hover:bg-green-500/20"><CheckCircle2 className="h-3 w-3 mr-1" />Published</Badge>
            case 'DRAFT':
                return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Draft</Badge>
            case 'SCHEDULED':
                return <Badge className="bg-blue-500/10 text-blue-600 hover:bg-blue-500/20"><Calendar className="h-3 w-3 mr-1" />Scheduled</Badge>
            default:
                return <Badge variant="outline">{status}</Badge>
        }
    }

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Articles</h1>
                    <p className="text-muted-foreground">
                        View and manage all your generated articles.
                    </p>
                </div>
                <Button variant="outline" onClick={fetchArticles}>
                    <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                    Refresh
                </Button>
            </div>

            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-violet-500/10">
                                <FileText className="h-6 w-6 text-violet-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{stats.total}</p>
                                <p className="text-sm text-muted-foreground">Total Articles</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-500/10">
                                <FileText className="h-6 w-6 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{stats.generated}</p>
                                <p className="text-sm text-muted-foreground">Generated</p>
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
                                <p className="text-2xl font-bold">{stats.published}</p>
                                <p className="text-sm text-muted-foreground">Published</p>
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
                                <p className="text-2xl font-bold">{stats.draft}</p>
                                <p className="text-sm text-muted-foreground">Drafts</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-500/10">
                                <Calendar className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{stats.scheduled}</p>
                                <p className="text-sm text-muted-foreground">Scheduled</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <Card>
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
                                    <SelectItem value="generated">Generated</SelectItem>
                                    <SelectItem value="draft">Draft</SelectItem>
                                    <SelectItem value="scheduled">Scheduled</SelectItem>
                                    <SelectItem value="published">Published</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Articles Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Article History</CardTitle>
                    <CardDescription>
                        Showing {articles.length} articles
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : articles.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            No articles found. Generate one in Content Lab!
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
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
                                        <TableCell className="text-sm">{article.tokensUsed}</TableCell>
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
                                                    <DropdownMenuItem disabled className="opacity-50">
                                                        <Eye className="h-4 w-4 mr-2" />
                                                        View
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem disabled className="opacity-50">
                                                        <Edit className="h-4 w-4 mr-2" />
                                                        Edit
                                                    </DropdownMenuItem>
                                                    {(article.status === 'GENERATED' || article.status === 'DRAFT') && (
                                                        <DropdownMenuItem onClick={() => handlePublishClick(article)} disabled={isPublishing}>
                                                            <Send className="h-4 w-4 mr-2" />
                                                            {isPublishing ? 'Publishing...' : 'Publish'}
                                                        </DropdownMenuItem>
                                                    )}
                                                    {article.status === 'PUBLISHED' && article.wpPostUrl && (
                                                        <DropdownMenuItem onClick={() => window.open(article.wpPostUrl, '_blank')}>
                                                            <ExternalLink className="h-4 w-4 mr-2" />
                                                            View on WordPress
                                                        </DropdownMenuItem>
                                                    )}
                                                    <DropdownMenuItem className="text-red-600" onClick={() => handleDeleteClick(article)}>
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

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Article</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete "{articleToDelete?.title}"? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={isDeleting}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleDeleteConfirm} disabled={isDeleting}>
                            {isDeleting ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Deleting...
                                </>
                            ) : (
                                'Delete'
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Alert Toast */}
            {alert && (
                <div className={`fixed bottom-4 right-4 p-4 rounded-md shadow-lg ${alert.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'} animate-in slide-in-from-right duration-300`}>
                    <div className="flex items-center gap-2">
                        {alert.type === 'success' ? <CheckCircle2 className="h-5 w-5" /> : <Trash2 className="h-5 w-5" />}
                        <p>{alert.message}</p>
                    </div>
                </div>
            )}
        </div>
    )
}
