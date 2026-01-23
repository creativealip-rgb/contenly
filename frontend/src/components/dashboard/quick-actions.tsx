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
        gradient: 'from-indigo-500 to-purple-500',
    },
    {
        label: 'Add RSS Feed',
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
        gradient: 'from-purple-500 to-pink-500',
    },
]

export function QuickActions() {
    return (
        <Card className="border-border/50">
            <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
                {quickActions.map((action) => (
                    <Link key={action.href} href={action.href}>
                        <Button
                            variant="outline"
                            className="group w-full h-auto p-4 justify-between gap-4 hover:bg-accent hover:border-indigo-500/30 transition-all duration-200 rounded-xl"
                        >
                            <div className="flex items-center gap-4">
                                <div className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${action.gradient} text-white shadow-lg`}>
                                    {action.icon}
                                </div>
                                <div className="text-left">
                                    <div className="font-semibold">{action.label}</div>
                                    <div className="text-xs text-muted-foreground">{action.description}</div>
                                </div>
                            </div>
                            {icons.arrow}
                        </Button>
                    </Link>
                ))}
            </CardContent>
        </Card>
    )
}
