'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { FileText, Rss, Sparkles, Plug, Zap, TrendingUp } from 'lucide-react'
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
                    title="RSS Feed Aktif"
                    value={isLoading ? '...' : stats.activeFeeds}
                    icon={Rss}
                    description={`${stats.activeFeeds} feed terhubung`}
                    delay={0}
                />
                <KpiCard
                    title="Sisa Token"
                    value={isLoading ? '...' : stats.tokenBalance}
                    icon={Sparkles}
                    description="Token yang dapat digunakan"
                    trend={{ value: 12, isPositive: true }}
                    delay={1}
                />
                <KpiCard
                    title="Situs Terhubung"
                    value={isLoading ? '...' : stats.connectedSites}
                    icon={Plug}
                    description="Situs WordPress"
                    delay={2}
                />
            </div>

            {/* Activity & Quick Actions */}
            <div className="grid gap-6 lg:grid-cols-3">
                <motion.div
                    className="lg:col-span-2"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, type: "spring", stiffness: 100 }}
                >
                    <RecentActivity activities={stats.recentActivity} isLoading={isLoading} />
                </motion.div>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5, type: "spring", stiffness: 100 }}
                >
                    <QuickActions isLoading={isLoading} />
                </motion.div>
            </div>
        </div>
    )
}
