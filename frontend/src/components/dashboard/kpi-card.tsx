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
}

export function KpiCard({ title, value, description, icon: Icon, trend, className }: KpiCardProps) {
    return (
        <Card className={cn("overflow-hidden", className)}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                    {title}
                </CardTitle>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600/20 to-indigo-600/20">
                    <Icon className="h-5 w-5 text-violet-600" />
                </div>
            </CardHeader>
            <CardContent>
                <div className="text-3xl font-bold">{value}</div>
                {(description || trend) && (
                    <div className="flex items-center gap-2 mt-1">
                        {trend && (
                            <span className={cn(
                                "text-xs font-medium",
                                trend.isPositive ? "text-green-600" : "text-red-600"
                            )}>
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
    )
}
