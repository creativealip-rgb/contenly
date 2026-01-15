'use client'

import { useState } from 'react'
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
    ArrowRight
} from 'lucide-react'

const mockSites = [
    {
        id: '1',
        name: 'My Tech Blog',
        url: 'https://myblog.com',
        status: 'connected',
        lastSync: new Date(Date.now() - 1000 * 60 * 30),
        articlesPublished: 45,
    },
    {
        id: '2',
        name: 'TechSite WordPress',
        url: 'https://techsite.wordpress.com',
        status: 'connected',
        lastSync: new Date(Date.now() - 1000 * 60 * 60 * 2),
        articlesPublished: 82,
    },
    {
        id: '3',
        name: 'Portfolio Blog',
        url: 'https://portfolio.example.com',
        status: 'error',
        lastSync: new Date(Date.now() - 1000 * 60 * 60 * 24),
        articlesPublished: 12,
        error: 'Invalid application password',
    },
]

const mockMappings = [
    { source: 'Technology', target: 'Tech News' },
    { source: 'Business', target: 'Business & Finance' },
    { source: 'Startups', target: 'Startup Stories' },
    { source: 'AI', target: 'Artificial Intelligence' },
]

export default function IntegrationsPage() {
    const [isAddOpen, setIsAddOpen] = useState(false)

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

    const formatTimeAgo = (date: Date) => {
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
                                <Input id="siteName" placeholder="e.g., My Blog" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="siteUrl">WordPress URL</Label>
                                <Input id="siteUrl" placeholder="https://yourblog.com" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="username">Username</Label>
                                <Input id="username" placeholder="admin" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="appPassword">Application Password</Label>
                                <Input id="appPassword" type="password" placeholder="xxxx xxxx xxxx xxxx xxxx" />
                                <p className="text-xs text-muted-foreground">
                                    Generate this in your WordPress Admin → Users → Application Passwords
                                </p>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                            <Button className="bg-gradient-to-r from-violet-600 to-indigo-600">
                                Test & Connect
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
                    <div className="grid gap-4">
                        {mockSites.map((site) => (
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
                                    <div className="text-right text-sm">
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
                                            <DropdownMenuItem>
                                                <RefreshCw className="h-4 w-4 mr-2" />
                                                Test Connection
                                            </DropdownMenuItem>
                                            <DropdownMenuItem>
                                                <Settings className="h-4 w-4 mr-2" />
                                                Settings
                                            </DropdownMenuItem>
                                            <DropdownMenuItem className="text-red-600">
                                                <Trash2 className="h-4 w-4 mr-2" />
                                                Disconnect
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Category Mappings */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Category Mapping</CardTitle>
                        <CardDescription>Map source categories to your WordPress categories</CardDescription>
                    </div>
                    <Button variant="outline" size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Mapping
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
                            {mockMappings.map((mapping, index) => (
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
                                        <Select defaultValue="all">
                                            <SelectTrigger className="w-[140px]">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All Sites</SelectItem>
                                                <SelectItem value="myblog">myblog.com</SelectItem>
                                                <SelectItem value="techsite">techsite.com</SelectItem>
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
