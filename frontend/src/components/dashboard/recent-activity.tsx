import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { FileText, Rss, Plug, CreditCard } from 'lucide-react'
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
}

const activityIcons = {
    article_published: FileText,
    feed_added: Rss,
    site_connected: Plug,
    tokens_purchased: CreditCard,
}

const activityColors = {
    article_published: 'bg-green-500/10 text-green-600',
    feed_added: 'bg-blue-500/10 text-blue-600',
    site_connected: 'bg-purple-500/10 text-purple-600',
    tokens_purchased: 'bg-amber-500/10 text-amber-600',
}

export function RecentActivity({ activities }: RecentActivityProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {activities.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                        No recent activity
                    </p>
                ) : (
                    activities.map((activity) => {
                        const Icon = activityIcons[activity.type]
                        const colorClass = activityColors[activity.type]

                        return (
                            <div key={activity.id} className="flex items-start gap-3">
                                <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${colorClass}`}>
                                    <Icon className="h-4 w-4" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">{activity.title}</p>
                                    <p className="text-xs text-muted-foreground">{activity.description}</p>
                                </div>
                                <Badge variant="secondary" className="text-xs shrink-0">
                                    {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
                                </Badge>
                            </div>
                        )
                    })
                )}
            </CardContent>
        </Card>
    )
}
