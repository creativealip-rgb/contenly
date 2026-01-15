'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
    LayoutDashboard,
    FlaskConical,
    Rss,
    FileText,
    Plug,
    CreditCard,
    BarChart3,
    Settings,
    ChevronLeft,
    ChevronRight
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useSidebarStore } from '@/stores'

const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/content-lab', label: 'Content Lab', icon: FlaskConical },
    { href: '/feeds', label: 'RSS Feeds', icon: Rss },
    { href: '/articles', label: 'Articles', icon: FileText },
    { href: '/integrations', label: 'Integrations', icon: Plug },
    { href: '/billing', label: 'Billing', icon: CreditCard },
    { href: '/analytics', label: 'Analytics', icon: BarChart3 },
    { href: '/settings', label: 'Settings', icon: Settings },
]

export function Sidebar() {
    const pathname = usePathname()
    const { isCollapsed, setCollapsed } = useSidebarStore()

    return (
        <aside
            className={cn(
                "fixed left-0 top-16 z-40 h-[calc(100vh-4rem)] border-r border-border bg-card transition-all duration-300",
                isCollapsed ? "w-16" : "w-64"
            )}
        >
            <div className="flex h-full flex-col">
                {/* Navigation */}
                <nav className="flex-1 space-y-1 p-3">
                    {navItems.map((item) => {
                        const Icon = item.icon
                        const isActive = pathname === item.href || pathname.startsWith(item.href + '/')

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                                    isActive
                                        ? "bg-primary text-primary-foreground"
                                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                                )}
                            >
                                <Icon className="h-5 w-5 shrink-0" />
                                {!isCollapsed && <span>{item.label}</span>}
                            </Link>
                        )
                    })}
                </nav>

                {/* Collapse Toggle */}
                <div className="border-t border-border p-3">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setCollapsed(!isCollapsed)}
                        className="w-full justify-center"
                    >
                        {isCollapsed ? (
                            <ChevronRight className="h-4 w-4" />
                        ) : (
                            <>
                                <ChevronLeft className="h-4 w-4 mr-2" />
                                <span>Collapse</span>
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </aside>
    )
}
