'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useSidebarStore, useAuthStore } from '@/stores'

// Custom SVG icons for a unique look
const icons = {
    dashboard: (
        <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth="1.5">
            <rect x="3" y="3" width="7" height="9" rx="2" />
            <rect x="14" y="3" width="7" height="5" rx="2" />
            <rect x="14" y="12" width="7" height="9" rx="2" />
            <rect x="3" y="16" width="7" height="5" rx="2" />
        </svg>
    ),
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
    articles: (
        <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth="1.5">
            <path d="M4 4h16v16H4z" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M8 8h8M8 12h8M8 16h4" strokeLinecap="round" />
        </svg>
    ),
    integrations: (
        <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth="1.5">
            <circle cx="6" cy="6" r="3" />
            <circle cx="18" cy="6" r="3" />
            <circle cx="6" cy="18" r="3" />
            <circle cx="18" cy="18" r="3" />
            <path d="M9 6h6M6 9v6M18 9v6M9 18h6" />
        </svg>
    ),
    billing: (
        <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth="1.5">
            <rect x="2" y="5" width="20" height="14" rx="2" />
            <path d="M2 10h20" />
            <path d="M6 15h4" />
        </svg>
    ),
    analytics: (
        <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth="1.5">
            <path d="M3 3v18h18" strokeLinecap="round" />
            <path d="M7 14l4-4 4 4 5-7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    ),
    settings: (
        <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth="1.5">
            <circle cx="12" cy="12" r="3" />
            <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" />
        </svg>
    ),
    chevronLeft: (
        <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth="2">
            <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    ),
    chevronRight: (
        <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth="2">
            <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    ),
}

const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: icons.dashboard },
    { href: '/content-lab', label: 'Content Lab', icon: icons.contentLab },
    { href: '/feeds', label: 'Web Sources', icon: icons.rss },
    { href: '/articles', label: 'Articles', icon: icons.articles },
    { href: '/view-boost', label: 'View Boost', icon: icons.analytics },
    { href: '/integrations', label: 'Integrations', icon: icons.integrations },
    { href: '/billing', label: 'Billing', icon: icons.billing },
    // Temporarily disabled
    // { href: '/analytics', label: 'Analytics', icon: icons.analytics },
    // { href: '/settings', label: 'Settings', icon: icons.settings },
]

export function Sidebar() {
    const pathname = usePathname()
    const { isCollapsed, setCollapsed, isOpen, setOpen } = useSidebarStore()
    const { user } = useAuthStore()

    // Handle mobile close on navigation
    const handleMobileLinkClick = () => {
        if (window.innerWidth < 768) {
            setOpen(false)
        }
    }

    return (
        <>
            {/* Mobile Overlay */}
            <div
                className={cn(
                    "fixed inset-0 z-30 bg-background/80 backdrop-blur-sm transition-all duration-200 md:hidden",
                    isOpen ? "opacity-100 visible" : "opacity-0 invisible"
                )}
                onClick={() => setOpen(false)}
            />

            <aside
                className={cn(
                    "fixed left-0 top-16 z-40 h-[calc(100vh-4rem)] border-r border-border bg-card/50 backdrop-blur-xl transition-all duration-300",
                    isCollapsed ? "md:w-[72px]" : "md:w-64",
                    // Mobile behavior: fixed width, slide in/out
                    "w-64",
                    isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
                )}
            >
                <div className="flex h-full flex-col">
                    {/* Navigation */}
                    <nav className="flex-1 space-y-1.5 p-4">
                        {navItems.map((item) => {
                            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')

                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={handleMobileLinkClick}
                                    className={cn(
                                        "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                                        isActive
                                            ? "bg-gradient-to-r from-indigo-500/10 to-purple-500/10 text-foreground border border-indigo-500/20"
                                            : "text-muted-foreground hover:bg-accent hover:text-foreground"
                                    )}
                                >
                                    <div className={cn(
                                        "shrink-0 transition-colors duration-200",
                                        isActive
                                            ? "text-indigo-500"
                                            : "text-muted-foreground group-hover:text-foreground"
                                    )}>
                                        {item.icon}
                                    </div>
                                    {/* Show label if:
                                        1. It's mobile (always w-64 when open)
                                        2. OR it's desktop AND not collapsed
                                    */}
                                    <span className={cn(
                                        "truncate transition-all duration-300",
                                        isCollapsed ? "md:w-0 md:opacity-0" : "md:w-auto md:opacity-100"
                                    )}>
                                        {item.label}
                                    </span>

                                    {isActive && (
                                        <div className={cn(
                                            "ml-auto h-1.5 w-1.5 rounded-full bg-indigo-500",
                                            isCollapsed ? "md:hidden" : "block"
                                        )} />
                                    )}
                                </Link>
                            )
                        })}
                    </nav>

                    <div className="mt-auto border-t border-border p-4">
                        {/* User Profile Removed per user request */}

                        {/* Collapse Toggle (Desktop Only) */}
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setCollapsed(!isCollapsed)}
                            className={cn(
                                "hidden md:flex w-full rounded-xl transition-all duration-200 text-muted-foreground hover:text-foreground hover:bg-accent/50",
                                isCollapsed ? "justify-center px-2" : "justify-start"
                            )}
                        >
                            {isCollapsed ? icons.chevronRight : icons.chevronLeft}
                            {!isCollapsed && <span className="ml-2">Collapse</span>}
                        </Button>
                    </div>
                </div>
            </aside>
        </>
    )
}
