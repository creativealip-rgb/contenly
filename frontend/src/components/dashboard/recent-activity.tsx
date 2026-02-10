import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDistanceToNow } from 'date-fns'

interface Activity {
    id: string
    type: 'article_published' | 'feed_added' | 'site_connected' | 'tokens_purchased'
    title: string
    description: string
    timestamp: Date
}

interface RecentActivityProps {
    activities: Activity[]
    isLoading?: boolean
}

// Custom SVG icons for activities
const activityIcons = {
    article_published: (
        <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth="1.5">
            <path d="M4 4h16v16H4z" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M8 8h8M8 12h8M8 16h4" strokeLinecap="round" />
        </svg>
    ),
    feed_added: (
        <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth="1.5">
            <circle cx="6" cy="18" r="2" fill="currentColor" />
            <path d="M4 4a16 16 0 0116 16M4 10a10 10 0 0110 10" strokeLinecap="round" />
        </svg>
    ),
    site_connected: (
        <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth="1.5">
            <circle cx="6" cy="6" r="3" />
            <circle cx="18" cy="6" r="3" />
            <circle cx="6" cy="18" r="3" />
            <circle cx="18" cy="18" r="3" />
            <path d="M9 6h6M6 9v6M18 9v6M9 18h6" />
        </svg>
    ),
    tokens_purchased: (
        <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth="1.5">
            <rect x="2" y="5" width="20" height="14" rx="2" />
            <path d="M2 10h20" />
            <path d="M6 15h4" />
        </svg>
    ),
}

const activityStyles = {
    article_published: {
        bg: 'bg-emerald-500/10',
        text: 'text-emerald-600',
        border: 'border-emerald-500/20',
    },
    feed_added: {
        bg: 'bg-blue-500/10',
        text: 'text-blue-600',
        border: 'border-blue-500/20',
    },
    site_connected: {
        bg: 'bg-blue-500/10',
        text: 'text-blue-600',
        border: 'border-blue-500/20',
    },
    tokens_purchased: {
        bg: 'bg-amber-500/10',
        text: 'text-amber-600',
        border: 'border-amber-500/20',
    },
}

export function RecentActivity({ activities, isLoading }: RecentActivityProps) {
    return (
        <Card className="border-border/50 h-full min-h-[360px] overflow-hidden">
            <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-semibold">Recent Activity</CardTitle>
                    <span className="text-xs text-muted-foreground">{isLoading ? 'Loading...' : `${activities.length} activities`}</span>
                </div>
            </CardHeader>
            <CardContent className="space-y-4 px-3 sm:px-6">
                {isLoading ? (
                    <div className="space-y-6">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="flex items-start gap-3 animate-pulse">
                                <div className="h-8 w-8 rounded-xl bg-muted shrink-0" />
                                <div className="flex-1 space-y-2 py-1">
                                    <div className="h-3 w-3/4 rounded bg-muted" />
                                    <div className="h-2 w-1/2 rounded bg-muted" />
                                </div>
                                <div className="h-2 w-12 rounded bg-muted shrink-0 pt-1" />
                            </div>
                        ))}
                    </div>
                ) : activities.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted mx-auto mb-4 animate-float">
                            <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6 text-muted-foreground" stroke="currentColor" strokeWidth="1.5">
                                <circle cx="12" cy="12" r="10" />
                                <path d="M12 6v6l4 2" strokeLinecap="round" />
                            </svg>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            No recent activity
                        </p>
                        <p className="text-xs text-muted-foreground/60 mt-1">
                            Your activity will appear here
                        </p>
                    </div>
                ) : (
                    <div className="relative">
                        {/* Timeline line */}
                        <div className="absolute left-[15px] top-3 bottom-3 w-px bg-border/50" />

                        <div className="space-y-4">
                            {activities.map((activity, index) => {
                                const styles = activityStyles[activity.type] || activityStyles.article_published
                                const icon = activityIcons[activity.type] || activityIcons.article_published

                                return (
                                    <div
                                        key={activity.id}
                                        className="relative flex items-start gap-3 md:gap-4 animate-fade-up w-full overflow-hidden"
                                        style={{ animationDelay: `${index * 0.1}s`, opacity: 0 }}
                                    >
                                        {/* Icon */}
                                        <div className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${styles.bg} ${styles.text} border ${styles.border}`}>
                                            {icon}
                                        </div>

                                        {/* Content - Using Grid for reliable truncation next to shrinking time */}
                                        <div className="flex-1 min-w-0 grid grid-cols-[1fr_auto] gap-2 items-start">
                                            <div className="min-w-0">
                                                <p className="text-sm font-medium truncate leading-tight pr-1" title={activity.title}>
                                                    {activity.title}
                                                </p>
                                                <p className="text-xs text-muted-foreground mt-1 truncate" title={activity.description}>
                                                    {activity.description}
                                                </p>
                                            </div>
                                            <span className="shrink-0 text-[10px] text-muted-foreground pt-1 whitespace-nowrap">
                                                {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
                                            </span>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
