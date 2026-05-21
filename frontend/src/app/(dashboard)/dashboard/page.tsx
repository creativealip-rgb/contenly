'use client'

import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { FileText, Sparkles, Plug, Zap, TrendingUp, ArrowRight } from 'lucide-react'
import { KpiCard, RecentActivity, QuickActions } from '@/components/dashboard'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useDashboardStats, useTrends } from '@/hooks/use-dashboard'

export default function DashboardPage() {
    const router = useRouter()
    const { data: stats, isLoading } = useDashboardStats()
    const { data: trends } = useTrends()

    const s = stats ?? {
        totalArticles: 0,
        publishedArticles: 0,
        activeFeeds: 0,
        connectedSites: 0,
        tokenBalance: 0,
        currentTier: 'FREE',
        recentActivity: [],
    }

    const trendItems = trends && trends.length > 0
        ? trends.map((t) => ({ title: t.title, source: t.source || 'News' }))
        : [
            { title: 'Kecerdasan Buatan di 2026', source: 'Tech' },
            { title: 'Strategi Konten Viral TikTok', source: 'Marketing' },
            { title: 'Update Algoritma Google', source: 'SEO' },
            { title: 'Masa Depan Remote Work', source: 'Trends' },
        ]

    return (
        <div className="space-y-6 max-w-full overflow-hidden">
            {/* Hero Section */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, type: "spring", stiffness: 100 }}
            >
                <Card className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-500 text-white border-0">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-cyan-400/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

                    <CardContent className="relative z-10 py-8 px-6">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <div className="space-y-2">
                                <motion.div className="flex items-center gap-2 text-blue-100" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
                                    <Zap className="w-4 h-4" />
                                    <span className="text-xs font-medium uppercase tracking-wider">Ringkasan Dashboard</span>
                                </motion.div>
                                <motion.h1 className="text-2xl md:text-3xl font-bold tracking-tight" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                                    Selamat datang kembali!
                                </motion.h1>
                                <motion.p className="text-blue-100 text-sm max-w-md" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                                    Berikut ringkasan otomatisasi konten dan metrik performa Anda.
                                </motion.p>
                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="pt-2">
                                    {isLoading ? (
                                        <Skeleton className="h-6 w-24 bg-white/20 rounded-full" />
                                    ) : (
                                        <span className="inline-flex items-center px-3 py-1 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-[10px] font-black uppercase tracking-widest text-white shadow-xl">
                                            Plan: {s.currentTier}
                                        </span>
                                    )}
                                </motion.div>
                            </div>

                            <motion.div className="flex gap-4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}>
                                <div className="glass-subtle rounded-xl px-4 py-3 text-center">
                                    {isLoading ? <Skeleton className="h-8 w-10 bg-white/20 rounded" /> : <div className="text-2xl font-bold tabular-nums">{s.totalArticles}</div>}
                                    <div className="text-xs text-blue-100 uppercase tracking-wider">Artikel</div>
                                </div>
                                <div className="glass-subtle rounded-xl px-4 py-3 text-center">
                                    {isLoading ? <Skeleton className="h-8 w-10 bg-white/20 rounded" /> : <div className="text-2xl font-bold tabular-nums">{s.publishedArticles}</div>}
                                    <div className="text-xs text-blue-100 uppercase tracking-wider">Terbit</div>
                                </div>
                            </motion.div>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            {/* KPI Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {isLoading ? (
                    <>
                        <Skeleton className="h-32 rounded-2xl" />
                        <Skeleton className="h-32 rounded-2xl" />
                        <Skeleton className="h-32 rounded-2xl" />
                    </>
                ) : (
                    <>
                        <KpiCard title="Artikel Dibuat" value={s.totalArticles} icon={FileText} description="Total konten AI" delay={0} />
                        <KpiCard title="Sisa Kredit" value={s.tokenBalance} icon={Sparkles} description="Token tersedia" delay={1} />
                        <KpiCard title="WordPress Terhubung" value={s.connectedSites} icon={Plug} description="Situs aktif" delay={2} />
                    </>
                )}
            </div>

            {/* Trending & Activity */}
            <div className="grid gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2 space-y-6">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                        <Card variant="glass" className="overflow-hidden">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-2">
                                        <div className="p-2 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-lg">
                                            <TrendingUp className="w-4 h-4" />
                                        </div>
                                        <h3 className="font-bold tracking-tight">Topik Populer Hari Ini</h3>
                                    </div>
                                    <Link href="/trend-radar" className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1">
                                        Lihat Semua <ArrowRight className="w-3 h-3" />
                                    </Link>
                                </div>

                                <div className="grid gap-3 sm:grid-cols-2">
                                    {isLoading ? (
                                        <>
                                            <Skeleton className="h-20 rounded-2xl" />
                                            <Skeleton className="h-20 rounded-2xl" />
                                            <Skeleton className="h-20 rounded-2xl" />
                                            <Skeleton className="h-20 rounded-2xl" />
                                        </>
                                    ) : (
                                        trendItems.map((trend, i) => (
                                            <motion.div
                                                key={i}
                                                whileHover={{ x: 4 }}
                                                className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-white/5 cursor-pointer group"
                                                onClick={() => router.push(`/trend-radar?q=${encodeURIComponent(trend.title)}`)}
                                            >
                                                <h4 className="text-sm font-bold mb-2 group-hover:text-blue-600 transition-colors line-clamp-2">{trend.title}</h4>
                                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white dark:bg-slate-700 border border-slate-100 dark:border-white/10 font-medium">
                                                    {trend.source}
                                                </span>
                                            </motion.div>
                                        ))
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>

                    <RecentActivity activities={s.recentActivity} isLoading={isLoading} />
                </div>

                <div className="space-y-6">
                    <QuickActions isLoading={isLoading} />

                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6 }}>
                        <Card className="bg-gradient-to-br from-indigo-600 to-purple-700 text-white border-0 overflow-hidden rounded-[2.5rem]">
                            <CardContent className="p-6 relative">
                                <Sparkles className="absolute top-4 right-4 w-8 h-8 opacity-20" />
                                <h3 className="text-lg font-bold mb-2">Instagram Studio</h3>
                                <p className="text-indigo-100 text-xs mb-4">Ubah artikel jadi carousel viral dalam hitungan detik.</p>
                                <Button
                                    size="sm"
                                    className="bg-white text-indigo-600 hover:bg-indigo-50 w-full rounded-xl font-bold"
                                    onClick={() => router.push('/instagram-studio')}
                                >
                                    Coba Sekarang
                                </Button>
                            </CardContent>
                        </Card>
                    </motion.div>
                </div>
            </div>
        </div>
    )
}
