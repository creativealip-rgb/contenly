'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    TrendingUp,
    FileText,
    Sparkles,
    CheckCircle2,
    BarChart3,
    PieChart,
    Activity,
    Download,
    Instagram,
    Video,
    Globe,
    Eye,
    MousePointerClick,
    ThumbsUp,
    Calendar,
} from 'lucide-react'
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart as RePieChart,
    Pie,
    Cell,
    AreaChart,
    Area,
} from 'recharts'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import { format, subDays, eachDayOfInterval } from 'date-fns'

interface DashboardStats {
    totalArticles: number
    publishedArticles: number
    activeFeeds: number
    connectedSites: number
    totalCarousels: number
    totalVideoScripts: number
    totalViews: number
    totalEngagement: number
    tokenBalance: number
    currentTier: string
    recentActivity: Array<{
        id: string
        type: string
        title: string
        description: string
        timestamp: string
    }>
}

interface ContentPerformance {
    articlesByDate: Record<string, { created: number; published: number }>
    analytics: Array<{
        date: string
        views: number
        clicks: number
        engagement: number
    }>
}

interface PlatformBreakdown {
    platform: string
    views: number
    clicks: number
    engagement: number
}

const COLORS = ['#3b82f6', '#ec4899', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444']

const platformIcons: Record<string, React.ReactNode> = {
    wordpress: <Globe className="h-4 w-4" />,
    instagram: <Instagram className="h-4 w-4" />,
    linkedin: <LinkedinIcon />,
    twitter: <TwitterIcon />,
    unknown: <Globe className="h-4 w-4" />,
}

function LinkedinIcon() {
    return (
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
        </svg>
    )
}

function TwitterIcon() {
    return (
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
    )
}

export default function AnalyticsContent() {
    const [timeRange, setTimeRange] = useState('30')
    const [stats, setStats] = useState<DashboardStats | null>(null)
    const [performance, setPerformance] = useState<ContentPerformance | null>(null)
    const [platformData, setPlatformData] = useState<PlatformBreakdown[]>([])
    const [tokenUsage, setTokenUsage] = useState<Array<{ date: string; tokens: number }>>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchData()
    }, [timeRange])

    const fetchData = async () => {
        try {
            setLoading(true)
            const days = parseInt(timeRange)
            
            const [statsRes, perfRes, platformRes, tokenRes] = await Promise.all([
                api.get<DashboardStats>('/analytics/dashboard'),
                api.get<ContentPerformance>(`/analytics/content-performance?days=${days}`),
                api.get<PlatformBreakdown[]>('/analytics/platform-breakdown'),
                api.get<Array<{ date: string; tokens: number }>>(`/analytics/token-usage?days=${days}`),
            ])
            
            setStats(statsRes)
            setPerformance(perfRes)
            setPlatformData(platformRes)
            setTokenUsage(tokenRes || [])
        } catch (error) {
            toast.error('Failed to fetch analytics data')
        } finally {
            setLoading(false)
        }
    }

    const handleExport = async (exportFormat: 'csv' | 'json') => {
        try {
            const endDate = new Date()
            const startDate = subDays(endDate, parseInt(timeRange))
            
            const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api/v1'
            const response = await fetch(
                `${API_URL}/analytics/export?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}&format=${exportFormat}`,
                { credentials: 'include' }
            )
            
            if (!response.ok) throw new Error('Export failed')
            
            const blob = await response.blob()
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `analytics-${format(startDate, 'yyyy-MM-dd')}-to-${format(endDate, 'yyyy-MM-dd')}.${exportFormat}`
            a.click()
            window.URL.revokeObjectURL(url)
            
            toast.success(`Analytics exported as ${exportFormat.toUpperCase()}`)
        } catch (error) {
            toast.error('Failed to export analytics')
        }
    }

    const prepareTimeSeriesData = () => {
        if (!performance) return []
        
        const days = parseInt(timeRange)
        const endDate = new Date()
        const startDate = subDays(endDate, days)
        const dateRange = eachDayOfInterval({ start: startDate, end: endDate })
        
        return dateRange.map(date => {
            const dateKey = format(date, 'yyyy-MM-dd')
            const articleData = performance.articlesByDate[dateKey] || { created: 0, published: 0 }
            const analyticsData = performance.analytics.find(a => 
                format(new Date(a.date), 'yyyy-MM-dd') === dateKey
            ) || { views: 0, clicks: 0, engagement: 0 }
            
            return {
                date: format(date, 'dd MMM'),
                articlesCreated: articleData.created,
                articlesPublished: articleData.published,
                views: analyticsData.views,
                clicks: analyticsData.clicks,
                engagement: analyticsData.engagement,
            }
        })
    }

    const timeSeriesData = prepareTimeSeriesData()

    const totalPlatformViews = platformData.reduce((sum, p) => sum + p.views, 0) || 1
    const pieData = platformData.map(p => ({
        name: p.platform.charAt(0).toUpperCase() + p.platform.slice(1),
        value: p.views,
        percentage: ((p.views / totalPlatformViews) * 100).toFixed(1),
    }))

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-4xl font-black tracking-tighter bg-gradient-to-r from-slate-900 to-slate-500 dark:from-white dark:to-slate-400 bg-clip-text text-transparent">
                        Analitik
                    </h1>
                    <p className="text-slate-500 font-medium">Lacak performa dan penggunaan konten Anda.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Select value={timeRange} onValueChange={setTimeRange}>
                        <SelectTrigger className="w-[150px]">
                            <Calendar className="h-4 w-4 mr-2" />
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="7">7 hari terakhir</SelectItem>
                            <SelectItem value="30">30 hari terakhir</SelectItem>
                            <SelectItem value="90">90 hari terakhir</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button variant="outline" onClick={() => handleExport('csv')}>
                        <Download className="h-4 w-4 mr-2" />CSV
                    </Button>
                    <Button variant="outline" onClick={() => handleExport('json')}>JSON</Button>
                </div>
            </div>

            {stats && (
                <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
                    <Card className="glass border-2 border-white/60 dark:border-white/20 rounded-3xl">
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-4">
                                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-500/10">
                                    <FileText className="h-6 w-6 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">{stats.totalArticles}</p>
                                    <p className="text-sm text-muted-foreground">Total Artikel</p>
                                </div>
                            </div>
                            <div className="mt-4 flex items-center gap-2 text-sm text-green-600">
                                <CheckCircle2 className="h-4 w-4" />
                                <span>{stats.publishedArticles} diterbitkan</span>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="glass border-2 border-white/60 dark:border-white/20 rounded-3xl">
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-4">
                                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-pink-500/10">
                                    <Instagram className="h-6 w-6 text-pink-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">{stats.totalCarousels}</p>
                                    <p className="text-sm text-muted-foreground">Carousel</p>
                                </div>
                            </div>
                            <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                                <Video className="h-4 w-4" />
                                <span>{stats.totalVideoScripts} video scripts</span>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="glass border-2 border-white/60 dark:border-white/20 rounded-3xl">
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-4">
                                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-500/10">
                                    <Eye className="h-6 w-6 text-green-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">{stats.totalViews.toLocaleString()}</p>
                                    <p className="text-sm text-muted-foreground">Total Views</p>
                                </div>
                            </div>
                            <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                                <ThumbsUp className="h-4 w-4" />
                                <span>{stats.totalEngagement} engagements</span>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="glass border-2 border-white/60 dark:border-white/20 rounded-3xl">
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-4">
                                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-amber-500/10">
                                    <Sparkles className="h-6 w-6 text-amber-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">{stats.tokenBalance}</p>
                                    <p className="text-sm text-muted-foreground">Token Tersisa</p>
                                </div>
                            </div>
                            <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                                <Activity className="h-4 w-4" />
                                <span>Plan: {stats.currentTier}</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            <div className="grid gap-6 lg:grid-cols-2">
                <Card className="glass border-2 border-white/60 dark:border-white/20 rounded-3xl">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <BarChart3 className="h-5 w-5" />Performa Konten
                        </CardTitle>
                        <CardDescription>Views, clicks, dan engagement per hari</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={timeSeriesData}>
                                    <defs>
                                        <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                        </linearGradient>
                                        <linearGradient id="colorEngagement" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                                    <YAxis tick={{ fontSize: 12 }} />
                                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                                    <Area type="monotone" dataKey="views" stroke="#3b82f6" fillOpacity={1} fill="url(#colorViews)" name="Views" />
                                    <Area type="monotone" dataKey="engagement" stroke="#10b981" fillOpacity={1} fill="url(#colorEngagement)" name="Engagement" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                <Card className="glass border-2 border-white/60 dark:border-white/20 rounded-3xl">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileText className="h-5 w-5" />Produksi Artikel
                        </CardTitle>
                        <CardDescription>Artikel dibuat vs diterbitkan</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={timeSeriesData}>
                                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                                    <YAxis tick={{ fontSize: 12 }} />
                                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                                    <Bar dataKey="articlesCreated" fill="#3b82f6" name="Dibuat" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="articlesPublished" fill="#10b981" name="Diterbitkan" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card className="glass border-2 border-white/60 dark:border-white/20 rounded-3xl">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-amber-500" />Penggunaan Token
                    </CardTitle>
                    <CardDescription>Token yang digunakan per hari ({timeRange} hari terakhir)</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-[250px]">
                        {tokenUsage.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={tokenUsage.map(t => ({ date: format(new Date(t.date), 'dd MMM'), tokens: Math.abs(t.tokens) }))}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                                    <YAxis tick={{ fontSize: 11 }} />
                                    <Tooltip formatter={(value) => [`${value} tokens`, 'Digunakan']} />
                                    <Bar dataKey="tokens" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                                Belum ada data penggunaan token
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            <div className="grid gap-6 lg:grid-cols-3">
                <Card className="glass border-2 border-white/60 dark:border-white/20 rounded-3xl">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <PieChart className="h-5 w-5" />Distribusi Platform
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[250px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <RePieChart>
                                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                                        {pieData.map((_, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </RePieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="mt-4 space-y-2">
                            {pieData.map((entry, index) => (
                                <div key={entry.name} className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                                        <span className="text-sm">{entry.name}</span>
                                    </div>
                                    <span className="text-sm font-medium">{entry.percentage}%</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card className="glass border-2 border-white/60 dark:border-white/20 rounded-3xl lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="h-5 w-5" />Ringkasan Platform
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {platformData.map((platform) => (
                                <div key={platform.platform} className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                                        {platformIcons[platform.platform] || platformIcons.unknown}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="font-semibold capitalize">{platform.platform}</span>
                                            <Badge variant="secondary">{platform.views.toLocaleString()} views</Badge>
                                        </div>
                                        <div className="flex gap-4 text-sm text-muted-foreground">
                                            <span className="flex items-center gap-1">
                                                <MousePointerClick className="h-3 w-3" />{platform.clicks} clicks
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <ThumbsUp className="h-3 w-3" />{platform.engagement} engagements
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {platformData.length === 0 && (
                                <div className="text-center py-8 text-muted-foreground">Belum ada data platform</div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
