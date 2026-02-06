'use client'

import { useState, useEffect } from 'react'
import { FileText, Rss, Sparkles, Plug } from 'lucide-react'
import { KpiCard, RecentActivity, QuickActions } from '@/components/dashboard'
import { getFeeds } from '@/lib/feeds-store'
import { getSites } from '@/lib/sites-store'

// Mock data - replace with API calls
// Mock data deleted

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
                // Use relative path so it uses the proxy or full URL if env is set
                const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'
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
        <div className="space-y-6">
            {/* Page Header */}
            <div>
                <h1 className="text-3xl font-bold">Dashboard</h1>
                <p className="text-muted-foreground">
                    Welcome back! Here&apos;s an overview of your content automation.
                </p>
            </div>

            {/* KPI Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <KpiCard
                    title="Active RSS Feeds"
                    value={isLoading ? '...' : stats.activeFeeds}
                    icon={Rss}
                    description={`${stats.activeFeeds} feeds configured`}
                />
                <KpiCard
                    title="Tokens Remaining"
                    value={isLoading ? '...' : stats.tokenBalance}
                    icon={Sparkles}
                    description="Available tokens"
                />
                <KpiCard
                    title="Connected Sites"
                    value={isLoading ? '...' : stats.connectedSites}
                    icon={Plug}
                    description="WordPress sites"
                />
            </div>

            {/* Activity & Quick Actions */}
            <div className="grid gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2">
                    <RecentActivity activities={stats.recentActivity} />
                </div>
                <div>
                    <QuickActions />
                </div>
            </div>
        </div>
    )
}
