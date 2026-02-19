import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDistanceToNow } from 'date-fns'
import { FileText, Rss, Plug, CreditCard, Clock } from 'lucide-react'

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

const activityIcons = {
    article_published: FileText,
    feed_added: Rss,
    site_connected: Plug,
    tokens_purchased: CreditCard,
}

const activityStyles = {
    article_published: {
        bg: 'bg-emerald-500/10',
        text: 'text-emerald-600',
        border: 'border-emerald-500/20',
        icon: 'text-emerald-500',
    },
    feed_added: {
        bg: 'bg-blue-500/10',
        text: 'text-blue-600',
        border: 'border-blue-500/20',
        icon: 'text-blue-500',
    },
    site_connected: {
        bg: 'bg-cyan-500/10',
        text: 'text-cyan-600',
        border: 'border-cyan-500/20',
        icon: 'text-cyan-500',
    },
    tokens_purchased: {
        bg: 'bg-amber-500/10',
        text: 'text-amber-600',
        border: 'border-amber-500/20',
        icon: 'text-amber-500',
    },
}

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
            delayChildren: 0.2
        }
    }
} as const

const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { 
        opacity: 1, 
        x: 0,
        transition: {
            type: "spring" as const,
            stiffness: 100,
            damping: 15
        }
    }
} as const

export function RecentActivity({ activities, isLoading }: RecentActivityProps) {
    return (
        <Card variant="glass" className="h-full min-h-[360px] overflow-hidden">
            <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                        Recent Activity
                    </CardTitle>
                    <span className="text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded-full">
                        {isLoading ? 'Loading...' : `${activities.length} activities`}
                    </span>
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
                    <motion.div 
                        className="text-center py-12"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ type: "spring", stiffness: 200, damping: 20 }}
                    >
                        <motion.div 
                            className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 mx-auto mb-4"
                            animate={{ 
                                y: [0, -5, 0],
                            }}
                            transition={{ 
                                duration: 3,
                                repeat: Infinity,
                                ease: "easeInOut"
                            }}
                        >
                            <Clock className="w-6 h-6 text-muted-foreground" />
                        </motion.div>
                        <p className="text-sm text-muted-foreground font-medium">
                            No recent activity
                        </p>
                        <p className="text-xs text-muted-foreground/60 mt-1">
                            Your activity will appear here
                        </p>
                    </motion.div>
                ) : (
                    <div className="relative">
                        {/* Timeline line */}
                        <div className="absolute left-[15px] top-3 bottom-3 w-px bg-gradient-to-b from-border via-border to-transparent" />

                        <motion.div 
                            className="space-y-4"
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible"
                        >
                            {activities.map((activity, index) => {
                                const styles = activityStyles[activity.type] || activityStyles.article_published
                                const Icon = activityIcons[activity.type] || activityIcons.article_published

                                return (
                                    <motion.div
                                        key={activity.id}
                                        variants={itemVariants}
                                        className="relative flex items-start gap-3 md:gap-4 w-full overflow-hidden group"
                                    >
                                        {/* Icon */}
                                        <motion.div 
                                            className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${styles.bg} ${styles.icon} border ${styles.border} backdrop-blur-sm`}
                                            whileHover={{ scale: 1.1, rotate: 5 }}
                                            transition={{ type: "spring", stiffness: 400, damping: 17 }}
                                        >
                                            <Icon className="w-4 h-4" />
                                        </motion.div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0 grid grid-cols-[1fr_auto] gap-2 items-start group-hover:translate-x-1 transition-transform duration-200">
                                            <div className="min-w-0">
                                                <p className="text-sm font-medium truncate leading-tight pr-1" title={activity.title}>
                                                    {activity.title}
                                                </p>
                                                <p className="text-xs text-muted-foreground mt-1 truncate" title={activity.description}>
                                                    {activity.description}
                                                </p>
                                            </div>
                                            <span className="shrink-0 text-[10px] text-muted-foreground pt-1 whitespace-nowrap flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
                                            </span>
                                        </div>
                                    </motion.div>
                                )
                            })}
                        </motion.div>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
