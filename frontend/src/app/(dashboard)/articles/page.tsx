'use client'

import { useState } from 'react'
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
    Download
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

const mockArticles = [
    {
        id: '1',
        title: '10 Best Productivity Apps for Remote Workers in 2026',
        status: 'published',
        wordpressSite: 'myblog.com',
        wordpressPostId: 1234,
        tokensUsed: 3,
        source: 'TechCrunch',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
    },
    {
        id: '2',
        title: 'How AI is Transforming Content Marketing',
        status: 'published',
        wordpressSite: 'techsite.com',
        wordpressPostId: 5678,
        tokensUsed: 1,
        source: 'The Verge',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
    },
    {
        id: '3',
        title: 'The Complete Guide to SEO in 2026',
        status: 'draft',
        wordpressSite: null,
        wordpressPostId: null,
        tokensUsed: 1,
        source: 'Manual URL',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48),
    },
    {
        id: '4',
        title: 'Startup Funding Trends: What Investors Look For',
        status: 'scheduled',
        wordpressSite: 'myblog.com',
        wordpressPostId: null,
        tokensUsed: 1,
        source: 'Product Hunt',
        error: 'WordPress connection failed',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 72),
    },
    {
        id: '5',
        title: 'Building Scalable Microservices with Node.js',
        status: 'published',
        wordpressSite: 'techsite.com',
        wordpressPostId: 9012,
        tokensUsed: 3,
        source: 'Hacker News',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 96),
    },
]

export default function ArticlesPage() {
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'published':
                return <Badge className="bg-green-500/10 text-green-600 hover:bg-green-500/20"><CheckCircle2 className="h-3 w-3 mr-1" />Published</Badge>
            case 'draft':
                return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Draft</Badge>
            case 'scheduled':
                return <Badge className="bg-blue-500/10 text-blue-600 hover:bg-blue-500/20"><Clock className="h-3 w-3 mr-1" />Scheduled</Badge>
            default:
                return <Badge variant="outline">{status}</Badge>
        }
    }

    const filteredArticles = mockArticles.filter((article) => {
        const matchesSearch = article.title.toLowerCase().includes(search.toLowerCase())
        const matchesStatus = statusFilter === 'all' || article.status === statusFilter
        return matchesSearch && matchesStatus
    })

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
                <Button variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                </Button>
            </div>

            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-violet-500/10">
                                <FileText className="h-6 w-6 text-violet-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">127</p>
                                <p className="text-sm text-muted-foreground">Total Articles</p>
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
                                <p className="text-2xl font-bold">118</p>
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
                                <p className="text-2xl font-bold">7</p>
                                <p className="text-sm text-muted-foreground">Drafts</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-500/10">
                                <Clock className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">2</p>
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
                                    <SelectItem value="published">Published</SelectItem>
                                    <SelectItem value="draft">Draft</SelectItem>
                                    <SelectItem value="scheduled">Scheduled</SelectItem>
                                </SelectContent>
                            </Select>
                            <Select defaultValue="all">
                                <SelectTrigger className="w-[150px]">
                                    <SelectValue placeholder="Site" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Sites</SelectItem>
                                    <SelectItem value="myblog">myblog.com</SelectItem>
                                    <SelectItem value="techsite">techsite.com</SelectItem>
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
                        Showing {filteredArticles.length} of {mockArticles.length} articles
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[400px]">Title</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Site</TableHead>
                                <TableHead>Source</TableHead>
                                <TableHead>Tokens</TableHead>
                                <TableHead>Created</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredArticles.map((article) => (
                                <TableRow key={article.id}>
                                    <TableCell>
                                        <p className="font-medium truncate max-w-[400px]">{article.title}</p>
                                    </TableCell>
                                    <TableCell>{getStatusBadge(article.status)}</TableCell>
                                    <TableCell>
                                        {article.wordpressSite ? (
                                            <span className="text-sm">{article.wordpressSite}</span>
                                        ) : (
                                            <span className="text-sm text-muted-foreground">—</span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="text-xs">{article.source}</Badge>
                                    </TableCell>
                                    <TableCell className="text-sm">{article.tokensUsed}</TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                        {formatDistanceToNow(article.createdAt, { addSuffix: true })}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem>
                                                    <Eye className="h-4 w-4 mr-2" />
                                                    View
                                                </DropdownMenuItem>
                                                <DropdownMenuItem disabled className="opacity-50">
                                                    <Edit className="h-4 w-4 mr-2" />
                                                    Edit (Coming Soon)
                                                </DropdownMenuItem>
                                                {article.status === 'scheduled' && (
                                                    <DropdownMenuItem>
                                                        <RefreshCw className="h-4 w-4 mr-2" />
                                                        Retry
                                                    </DropdownMenuItem>
                                                )}
                                                {article.status === 'draft' && (
                                                    <DropdownMenuItem>
                                                        <CheckCircle2 className="h-4 w-4 mr-2" />
                                                        Publish
                                                    </DropdownMenuItem>
                                                )}
                                                <DropdownMenuItem className="text-red-600">
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
