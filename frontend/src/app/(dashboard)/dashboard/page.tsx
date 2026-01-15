import { FileText, Rss, Sparkles, Plug } from 'lucide-react'
import { KpiCard, RecentActivity, QuickActions } from '@/components/dashboard'

// Mock data - replace with API calls
const mockActivities = [
    {
        id: '1',
        type: 'article_published' as const,
        title: '10 Best Productivity Apps in 2026',
        description: 'Published to techblog.com',
        timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 mins ago
    },
    {
        id: '2',
        type: 'feed_added' as const,
        title: 'TechCrunch RSS Feed',
        description: 'Auto-polling every 15 minutes',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    },
    {
        id: '3',
        type: 'site_connected' as const,
        title: 'myblog.wordpress.com',
        description: 'WordPress site connected',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
    },
    {
        id: '4',
        type: 'tokens_purchased' as const,
        title: '100 Tokens purchased',
        description: 'Pro plan subscription',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2), // 2 days ago
    },
]

export default function DashboardPage() {
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
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <KpiCard
                    title="Articles Published"
                    value={127}
                    icon={FileText}
                    trend={{ value: 12, isPositive: true }}
                    description="this month"
                />
                <KpiCard
                    title="Active RSS Feeds"
                    value={8}
                    icon={Rss}
                    description="polling every 15min"
                />
                <KpiCard
                    title="Tokens Remaining"
                    value={50}
                    icon={Sparkles}
                    trend={{ value: -23, isPositive: false }}
                    description="of 100 monthly"
                />
                <KpiCard
                    title="Connected Sites"
                    value={3}
                    icon={Plug}
                    description="WordPress sites"
                />
            </div>

            {/* Activity & Quick Actions */}
            <div className="grid gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2">
                    <RecentActivity activities={mockActivities} />
                </div>
                <div>
                    <QuickActions />
                </div>
            </div>
        </div>
    )
}
