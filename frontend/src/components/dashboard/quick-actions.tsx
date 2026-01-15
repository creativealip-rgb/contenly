import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FlaskConical, Rss, Plug, Plus } from 'lucide-react'

const quickActions = [
    {
        label: 'New Content',
        description: 'Generate AI content from URL',
        href: '/content-lab',
        icon: FlaskConical,
        color: 'from-violet-600 to-indigo-600',
    },
    {
        label: 'Add RSS Feed',
        description: 'Set up auto-fetching',
        href: '/feeds/new',
        icon: Rss,
        color: 'from-blue-600 to-cyan-600',
    },
    {
        label: 'Connect Site',
        description: 'Add WordPress site',
        href: '/integrations/new',
        icon: Plug,
        color: 'from-purple-600 to-pink-600',
    },
]

export function QuickActions() {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
                {quickActions.map((action) => {
                    const Icon = action.icon

                    return (
                        <Link key={action.href} href={action.href}>
                            <Button
                                variant="outline"
                                className="w-full h-auto p-4 justify-start gap-4 hover:bg-accent"
                            >
                                <div className={`flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br ${action.color}`}>
                                    <Icon className="h-5 w-5 text-white" />
                                </div>
                                <div className="text-left">
                                    <div className="font-medium">{action.label}</div>
                                    <div className="text-xs text-muted-foreground">{action.description}</div>
                                </div>
                            </Button>
                        </Link>
                    )
                })}
            </CardContent>
        </Card>
    )
}
