import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { LucideIcon } from 'lucide-react'

interface KpiCardProps {
    title: string
    value: string | number
    description?: string
    icon: LucideIcon
    trend?: {
        value: number
        isPositive: boolean
    }
    className?: string
    delay?: number
}

export function KpiCard({ title, value, description, icon: Icon, trend, className, delay = 0 }: KpiCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ 
                duration: 0.5, 
                delay: delay * 0.1,
                type: "spring",
                stiffness: 100,
                damping: 15
            }}
        >
            <Card 
                variant="glass" 
                hover
                className={cn("overflow-hidden group", className)}
            >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        {title}
                    </CardTitle>
                    <motion.div 
                        className="icon-container !w-10 !h-10 !rounded-xl"
                        whileHover={{ rotate: 5, scale: 1.1 }}
                        transition={{ type: "spring", stiffness: 400, damping: 17 }}
                    >
                        <Icon className="h-5 w-5 text-[var(--brand-primary)]" />
                    </motion.div>
                </CardHeader>
                <CardContent>
                    <motion.div 
                        className="text-3xl font-bold tracking-tight tabular-nums"
                        initial={{ scale: 0.8 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: delay * 0.1 + 0.2, type: "spring" }}
                    >
                        {value}
                    </motion.div>
                    {(description || trend) && (
                        <div className="flex items-center gap-2 mt-2">
                            {trend && (
                                <span className={cn(
                                    "inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full",
                                    trend.isPositive
                                        ? "bg-emerald-500/10 text-emerald-600"
                                        : "bg-red-500/10 text-red-600"
                                )}>
                                    {trend.isPositive ? (
                                        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M7 17l5-5 5 5M7 7l5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    ) : (
                                        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M7 7l5 5 5-5M7 17l5-5 5 5" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    )}
                                    {trend.isPositive ? '+' : ''}{trend.value}%
                                </span>
                            )}
                            {description && (
                                <span className="text-xs text-muted-foreground">{description}</span>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>
        </motion.div>
    )
}
