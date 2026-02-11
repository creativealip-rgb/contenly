import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

// Custom SVG icons matching the design system
const icons = {
    contentLab: (
        <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth="1.5">
            <path d="M9 3h6v4H9zM5 7h14v4H5zM7 11h10v10H7z" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M10 15h4M10 18h2" strokeLinecap="round" />
        </svg>
    ),
    rss: (
        <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth="1.5">
            <circle cx="6" cy="18" r="2" fill="currentColor" />
            <path d="M4 4a16 16 0 0116 16M4 10a10 10 0 0110 10" strokeLinecap="round" />
        </svg>
    ),
    plug: (
        <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth="1.5">
            <circle cx="6" cy="6" r="3" />
            <circle cx="18" cy="6" r="3" />
            <circle cx="6" cy="18" r="3" />
            <circle cx="18" cy="18" r="3" />
            <path d="M9 6h6M6 9v6M18 9v6M9 18h6" />
        </svg>
    ),
    arrow: (
        <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 group-hover:translate-x-1 transition-transform" stroke="currentColor" strokeWidth="2">
            <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    ),
}

const quickActions = [
    {
        label: 'New Content',
        description: 'Generate AI content from URL',
        href: '/content-lab',
        icon: icons.contentLab,
        gradient: 'from-blue-600 to-blue-400',
    },
    {
        label: 'Add Source',
        description: 'Set up auto-fetching',
        href: '/feeds',  // Fixed: changed from /feeds/new to /feeds
        icon: icons.rss,
        gradient: 'from-cyan-500 to-blue-500',
    },
    {
        label: 'Connect Site',
        description: 'Add WordPress site',
        href: '/integrations',  // Fixed: changed from /integrations/new to /integrations
        icon: icons.plug,
        gradient: 'from-blue-500 to-cyan-500',
    },
]

interface QuickActionsProps {
    isLoading?: boolean
}

export function QuickActions({ isLoading }: QuickActionsProps) {
    return (
        <Card className="border-border/50">
            <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 px-3 sm:px-6 pb-6">
                {isLoading ? (
                    [1, 2, 3].map((i) => (
                        <div key={i} className="flex items-center gap-3 p-3 border rounded-xl animate-pulse bg-muted/5">
                            <div className="h-9 w-9 md:h-10 md:w-10 rounded-lg bg-muted shrink-0" />
                            <div className="flex-1 space-y-2">
                                <div className="h-3 w-1/3 rounded bg-muted" />
                                <div className="h-2 w-2/3 rounded bg-muted" />
                            </div>
                            <div className="h-4 w-4 rounded bg-muted shrink-0" />
                        </div>
                    ))
                ) : (
                    quickActions.map((action) => (
                        <Link key={action.href} href={action.href} className="block min-w-0">
                            <Button
                                variant="outline"
                                className="group w-full h-auto p-3 hover:bg-accent hover:border-blue-500/30 transition-all duration-200 rounded-xl overflow-hidden"
                            >
                                <div className="flex items-center gap-3 w-full min-w-0">
                                    <div className={`flex-shrink-0 flex h-9 w-9 md:h-10 md:w-10 items-center justify-center rounded-lg bg-gradient-to-br ${action.gradient} text-white shadow-md`}>
                                        {action.icon}
                                    </div>
                                    <div className="min-w-0 flex-1 grid grid-cols-[1fr_auto] items-center gap-2">
                                        <div className="text-left min-w-0">
                                            <div className="font-semibold truncate text-xs md:text-sm">{action.label}</div>
                                            <div className="text-[10px] md:text-xs text-muted-foreground truncate opacity-80">{action.description}</div>
                                        </div>
                                        <div className="flex-shrink-0 text-muted-foreground/50 group-hover:text-foreground transition-colors">
                                            {icons.arrow}
                                        </div>
                                    </div>
                                </div>
                            </Button>
                        </Link>
                    ))
                )}
            </CardContent>
        </Card>
    )
}
