'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
    XCircle,
    BarChart3,
    PieChart,
    Activity
} from 'lucide-react'

// Simple chart components using divs for demo
function BarChartSimple({ data }: { data: { label: string; value: number }[] }) {
    const max = Math.max(...data.map(d => d.value))
    return (
        <div className="flex items-end gap-2 h-[200px]">
            {data.map((item, index) => (
                <div key={index} className="flex-1 flex flex-col items-center gap-2">
                    <div
                        className="w-full bg-gradient-to-t from-violet-600 to-indigo-500 rounded-t-lg transition-all hover:opacity-80"
                        style={{ height: `${(item.value / max) * 100}%` }}
                    />
                    <span className="text-xs text-muted-foreground">{item.label}</span>
                </div>
            ))}
        </div>
    )
}

function DonutChart({ value, total, label }: { value: number; total: number; label: string }) {
    const percentage = (value / total) * 100
    const circumference = 2 * Math.PI * 40
    const strokeDashoffset = circumference - (percentage / 100) * circumference

    return (
        <div className="flex flex-col items-center">
            <div className="relative">
                <svg width="120" height="120" viewBox="0 0 100 100">
                    <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="10"
                        className="text-muted"
                    />
                    <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke="url(#gradient)"
                        strokeWidth="10"
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        transform="rotate(-90 50 50)"
                    />
                    <defs>
                        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#7c3aed" />
                            <stop offset="100%" stopColor="#4f46e5" />
                        </linearGradient>
                    </defs>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-bold">{percentage.toFixed(0)}%</span>
                </div>
            </div>
            <span className="mt-2 text-sm text-muted-foreground">{label}</span>
        </div>
    )
}

const weeklyData = [
    { label: 'Mon', value: 12 },
    { label: 'Tue', value: 18 },
    { label: 'Wed', value: 8 },
    { label: 'Thu', value: 24 },
    { label: 'Fri', value: 15 },
    { label: 'Sat', value: 6 },
    { label: 'Sun', value: 3 },
]

const monthlyData = [
    { label: 'W1', value: 45 },
    { label: 'W2', value: 62 },
    { label: 'W3', value: 38 },
    { label: 'W4', value: 55 },
]

export default function AnalyticsPage() {
    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Analytics</h1>
                    <p className="text-muted-foreground">
                        Track your content performance and usage.
                    </p>
                </div>
                <Select defaultValue="7d">
                    <SelectTrigger className="w-[150px]">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="7d">Last 7 days</SelectItem>
                        <SelectItem value="30d">Last 30 days</SelectItem>
                        <SelectItem value="90d">Last 90 days</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Stats Overview */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-violet-500/10">
                                <FileText className="h-6 w-6 text-violet-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">127</p>
                                <p className="text-sm text-muted-foreground">Articles Published</p>
                            </div>
                        </div>
                        <div className="mt-4 flex items-center gap-2 text-sm text-green-600">
                            <TrendingUp className="h-4 w-4" />
                            <span>+12% from last week</span>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-amber-500/10">
                                <Sparkles className="h-6 w-6 text-amber-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">186</p>
                                <p className="text-sm text-muted-foreground">Tokens Used</p>
                            </div>
                        </div>
                        <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                            <Activity className="h-4 w-4" />
                            <span>Avg 26/day</span>
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
                                <p className="text-2xl font-bold">94%</p>
                                <p className="text-sm text-muted-foreground">Success Rate</p>
                            </div>
                        </div>
                        <div className="mt-4 flex items-center gap-2 text-sm text-green-600">
                            <TrendingUp className="h-4 w-4" />
                            <span>+2% from last week</span>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-500/10">
                                <BarChart3 className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">3</p>
                                <p className="text-sm text-muted-foreground">Active Sites</p>
                            </div>
                        </div>
                        <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                            <span>2 sites synced today</span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Charts */}
            <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <BarChart3 className="h-5 w-5" />
                            Articles Published
                        </CardTitle>
                        <CardDescription>Daily article publishing trends</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <BarChartSimple data={weeklyData} />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Sparkles className="h-5 w-5" />
                            Token Usage
                        </CardTitle>
                        <CardDescription>Weekly token consumption</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <BarChartSimple data={monthlyData} />
                    </CardContent>
                </Card>
            </div>

            {/* Success Rate & Breakdown */}
            <div className="grid gap-6 lg:grid-cols-3">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <PieChart className="h-5 w-5" />
                            AI Generation Success
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex justify-center py-4">
                        <DonutChart value={94} total={100} label="Success Rate" />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>WordPress Sync Status</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between p-3 rounded-lg bg-green-500/10">
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="h-5 w-5 text-green-600" />
                                <span className="font-medium">Successful</span>
                            </div>
                            <Badge className="bg-green-500/20 text-green-600">118</Badge>
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-lg bg-amber-500/10">
                            <div className="flex items-center gap-2">
                                <Activity className="h-5 w-5 text-amber-600" />
                                <span className="font-medium">In Queue</span>
                            </div>
                            <Badge className="bg-amber-500/20 text-amber-600">7</Badge>
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-lg bg-red-500/10">
                            <div className="flex items-center gap-2">
                                <XCircle className="h-5 w-5 text-red-600" />
                                <span className="font-medium">Failed</span>
                            </div>
                            <Badge className="bg-red-500/20 text-red-600">2</Badge>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Token Breakdown</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span>Article Generation</span>
                                <span className="font-medium">127 tokens</span>
                            </div>
                            <div className="h-2 rounded-full bg-muted overflow-hidden">
                                <div className="h-full bg-violet-600" style={{ width: '68%' }} />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span>Image Generation</span>
                                <span className="font-medium">48 tokens</span>
                            </div>
                            <div className="h-2 rounded-full bg-muted overflow-hidden">
                                <div className="h-full bg-indigo-600" style={{ width: '26%' }} />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span>Plagiarism Check</span>
                                <span className="font-medium">11 tokens</span>
                            </div>
                            <div className="h-2 rounded-full bg-muted overflow-hidden">
                                <div className="h-full bg-blue-600" style={{ width: '6%' }} />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
