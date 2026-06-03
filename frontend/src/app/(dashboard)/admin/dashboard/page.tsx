'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { api } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { SuperAdminGuard } from '@/components/guards'
import {
    Users,
    CreditCard,
    TrendingUp,
    Activity,
    DollarSign,
    FileText,
    Image,
    Video
} from 'lucide-react'

interface DashboardStats {
    totalUsers: number
    activeUsers: number
    totalRevenue: number
    totalArticles: number
    totalImages: number
    totalVideos: number
    recentTransactions: any[]
    planDistribution: Record<string, number>
}

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
} as const

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 100 } }
} as const

export default function AdminDashboardPage() {
    const [stats, setStats] = useState<DashboardStats | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchStats = async () => {
            try {
                setLoading(true)
                const response = await api.get<any>('/analytics/admin/stats')
                setStats(response)
            } catch (error) {
                console.error('Failed to fetch dashboard stats:', error)
            } finally {
                setLoading(false)
            }
        }
        fetchStats()
    }, [])

    const statCards = [
        {
            title: 'Total Pengguna',
            value: stats?.totalUsers || 0,
            icon: Users,
            color: 'from-blue-500 to-cyan-500',
            description: `${stats?.activeUsers || 0} aktif bulan ini`
        },
        {
            title: 'Total Revenue',
            value: `Rp ${((stats?.totalRevenue || 0) / 1000000).toFixed(1)}jt`,
            icon: DollarSign,
            color: 'from-emerald-500 to-green-500',
            description: 'Bulan ini'
        },
        {
            title: 'Artikel Dibuat',
            value: stats?.totalArticles || 0,
            icon: FileText,
            color: 'from-purple-500 to-indigo-500',
            description: 'Total sepanjang waktu'
        },
        {
            title: 'Gambar AI',
            value: stats?.totalImages || 0,
            icon: Image,
            color: 'from-pink-500 to-rose-500',
            description: 'Total sepanjang waktu'
        },
    ]

    return (
        <SuperAdminGuard>
            <motion.div
                className="space-y-6"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                {/* Page Header */}
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <h1 className="text-4xl font-black tracking-tighter bg-gradient-to-r from-slate-900 to-slate-500 dark:from-white dark:to-slate-400 bg-clip-text text-transparent">
                            Admin Dashboard
                        </h1>
                        <p className="text-slate-500 font-medium">Overview dan statistik platform Contenly.</p>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {statCards.map((stat, index) => (
                        <motion.div key={index} variants={itemVariants}>
                            <Card className="relative overflow-hidden border-0 bg-white dark:bg-slate-900 shadow-lg">
                                <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${stat.color} opacity-10 rounded-bl-full`} />
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
                                        {stat.title}
                                    </CardTitle>
                                    <div className={`p-2 rounded-lg bg-gradient-to-br ${stat.color}`}>
                                        <stat.icon className="h-4 w-4 text-white" />
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-bold">
                                        {loading ? '...' : stat.value}
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {stat.description}
                                    </p>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                </div>

                {/* Plan Distribution */}
                <motion.div variants={itemVariants}>
                    <Card className="border-0 bg-white dark:bg-slate-900 shadow-lg">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <CreditCard className="h-5 w-5" />
                                Distribusi Paket
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {['FREE', 'STARTER', 'PRO', 'BUSINESS'].map((plan) => (
                                    <div key={plan} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800">
                                        <div className="text-2xl font-bold">
                                            {loading ? '...' : (stats?.planDistribution?.[plan] || 0)}
                                        </div>
                                        <div className="text-sm text-muted-foreground">{plan}</div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Recent Activity */}
                <motion.div variants={itemVariants}>
                    <Card className="border-0 bg-white dark:bg-slate-900 shadow-lg">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Activity className="h-5 w-5" />
                                Aktivitas Terbaru
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <p className="text-muted-foreground">Memuat...</p>
                            ) : stats?.recentTransactions?.length ? (
                                <div className="space-y-3">
                                    {stats.recentTransactions.slice(0, 5).map((tx: any, i: number) => (
                                        <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800">
                                            <div>
                                                <p className="font-medium">{tx.user?.name || 'User'}</p>
                                                <p className="text-sm text-muted-foreground">{tx.type}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-medium">{tx.tokens} token</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {new Date(tx.createdAt).toLocaleDateString('id-ID')}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-muted-foreground">Belum ada aktivitas</p>
                            )}
                        </CardContent>
                    </Card>
                </motion.div>
            </motion.div>
        </SuperAdminGuard>
    )
}
