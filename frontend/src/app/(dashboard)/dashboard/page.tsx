'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { FileText, Rss, Sparkles, Plug, Zap, TrendingUp, ArrowRight } from 'lucide-react'
import { KpiCard, RecentActivity, QuickActions } from '@/components/dashboard'
import { Card, CardContent } from '@/components/ui/card'

export default function DashboardPage() {
    const [stats, setStats] = useState({
        totalArticles: 0,
        publishedArticles: 0,
        activeFeeds: 0,
        connectedSites: 0,
        tokenBalance: 0,
        recentActivity: [] as any[]
    })
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const loadDashboardData = async () => {
            try {
                const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'
                const res = await fetch(`${API_BASE_URL}/analytics/dashboard`, {
                    credentials: 'include',
                    headers: { 'ngrok-skip-browser-warning': 'true' }
                })
                if (res.ok) {
                    const data = await res.json()
                    setStats(data)
                }
            } catch (error) {
                console.error('Failed to load dashboard data:', error)
            } finally {
                setIsLoading(false)
            }
        }
        loadDashboardData()
    }, [])

    return (
        <div className="space-y-6 max-w-full overflow-hidden">
            {/* Hero Section */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, type: "spring", stiffness: 100 }}
            >
                <Card className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-500 text-white border-0">
                    {/* Decorative elements */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-cyan-400/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

                    <CardContent className="relative z-10 py-8 px-6">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <div className="space-y-2">
                                <motion.div
                                    className="flex items-center gap-2 text-blue-100"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.2 }}
                                >
                                    <Zap className="w-4 h-4" />
                                    <span className="text-xs font-medium uppercase tracking-wider">Ringkasan Dashboard</span>
                                </motion.div>
                                <motion.h1
                                    className="text-2xl md:text-3xl font-bold tracking-tight"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3 }}
                                >
                                    Selamat datang kembali!
                                </motion.h1>
                                <motion.p
                                    className="text-blue-100 text-sm max-w-md"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.4 }}
                                >
                                    Berikut ringkasan otomatisasi konten dan metrik performa Anda.
                                </motion.p>
                            </div>

                            {/* Quick Stats */}
                            <motion.div
                                className="flex gap-4"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.5 }}
                            >
                                <div className="glass-subtle rounded-xl px-4 py-3 text-center">
                                    <div className="text-2xl font-bold tabular-nums">{isLoading ? '...' : stats.totalArticles}</div>
                                    <div className="text-xs text-blue-100 uppercase tracking-wider">Artikel</div>
                                </div>
                                <div className="glass-subtle rounded-xl px-4 py-3 text-center">
                                    <div className="text-2xl font-bold tabular-nums">{isLoading ? '...' : stats.publishedArticles}</div>
                                    <div className="text-xs text-blue-100 uppercase tracking-wider">Terbit</div>
                                </div>
                            </motion.div>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            {/* KPI Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <KpiCard
                    title="Artikel Dibuat"
                    value={isLoading ? '...' : stats.totalArticles}
                    icon={FileText}
                    description="Total konten AI"
                    delay={0}
                />
                <KpiCard
                    title="Sisa Kredit"
                    value={isLoading ? '...' : stats.tokenBalance}
                    icon={Sparkles}
                    description="Token tersedia"
                    trend={{ value: 12, isPositive: true }}
                    delay={1}
                />
                <KpiCard
                    title="WordPress Terhubung"
                    value={isLoading ? '...' : stats.connectedSites}
                    icon={Plug}
                    description="Situs aktif"
                    delay={2}
                />
            </div>

            {/* Feature Studios & Trending */}
            <div className="grid gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2 space-y-6">
                    {/* Trending Section */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                    >
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
                                    {[
                                        { title: 'Kecerdasan Buatan di 2026', tags: ['AI', 'Tech'], color: 'blue' },
                                        { title: 'Strategi Konten Viral TikTok', tags: ['Marketing', 'Viral'], color: 'purple' },
                                        { title: 'Update Algoritma Google', tags: ['SEO', 'Google'], color: 'emerald' },
                                        { title: 'Masa Depan Remote Work', tags: ['Work', 'Trends'], color: 'orange' },
                                    ].map((trend, i) => (
                                        <motion.div
                                            key={i}
                                            whileHover={{ x: 4 }}
                                            className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-white/5 cursor-pointer group"
                                            onClick={() => { window.location.href = `/trend-radar?q=${encodeURIComponent(trend.title)}` }}
                                        >
                                            <h4 className="text-sm font-bold mb-2 group-hover:text-blue-600 transition-colors line-clamp-1">{trend.title}</h4>
                                            <div className="flex gap-2">
                                                {trend.tags.map(tag => (
                                                    <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-white dark:bg-slate-700 border border-slate-100 dark:border-white/10 font-medium">#{tag}</span>
                                                ))}
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>

                    <RecentActivity activities={stats.recentActivity} isLoading={isLoading} />
                </div>

                <div className="space-y-6">
                    <QuickActions isLoading={isLoading} />

                    {/* Studio Promo */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.6 }}
                    >
                        <Card className="bg-gradient-to-br from-indigo-600 to-purple-700 text-white border-0 overflow-hidden rounded-[2.5rem]">
                            <CardContent className="p-6 relative">
                                <Sparkles className="absolute top-4 right-4 w-8 h-8 opacity-20" />
                                <h3 className="text-lg font-bold mb-2">Instagram Studio</h3>
                                <p className="text-indigo-100 text-xs mb-4">Ubah artikel jadi carousel viral dalam hitungan detik.</p>
                                <Button
                                    size="sm"
                                    className="bg-white text-indigo-600 hover:bg-indigo-50 w-full rounded-xl font-bold"
                                    onClick={() => window.location.href = '/instagram-studio'}
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
