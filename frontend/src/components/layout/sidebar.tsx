'use client'

import { cn } from '@/lib/utils'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useSidebarStore, useAuthStore } from '@/stores'
import { motion } from 'framer-motion'
import { usePathname } from 'next/navigation'

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
    radar: (
        <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth="1.5">
            <circle cx="12" cy="12" r="9" />
            <circle cx="12" cy="12" r="6" />
            <circle cx="12" cy="12" r="3" />
            <path d="M12 3v9l4.5 4.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    ),
    video: (
        <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth="1.5">
            <path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h10a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    ),
    instagram: (
        <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth="1.5">
            <rect x="2" y="2" width="20" height="20" rx="5" />
            <circle cx="12" cy="12" r="4" />
            <circle cx="18" cy="6" r="1" fill="currentColor" />
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
            <path d="M12 15a3 3 0 100-6 3 3 0 000 6z" />
            <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
        </svg>
    ),
    userManagement: (
        <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth="1.5">
            <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 00-3-3.87" />
            <path d="M16 3.13a4 4 0 010 7.75" />
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
    { href: '/trend-radar', label: 'Radar Tren', icon: icons.radar },
    { href: '/content-lab', label: 'Content Lab', icon: icons.contentLab },
    { href: '/instagram-studio', label: 'Instagram Studio', icon: icons.instagram },
    { href: '/video-scripts', label: 'Video Scripts', icon: icons.video },
    { href: '/feeds', label: 'Sumber Web', icon: icons.rss },
    { href: '/articles', label: 'Artikel', icon: icons.articles },
    { href: '/view-boost', label: 'View Boost', icon: icons.analytics },
    { href: '/integrations', label: 'Integrasi', icon: icons.integrations },
    { href: '/billing', label: 'Tagihan', icon: icons.billing },
    { href: '/super-admin/users', label: 'Pengguna', icon: icons.userManagement, role: 'SUPER_ADMIN' },
    // Temporarily disabled
    // { href: '/analytics', label: 'Analitik', icon: icons.analytics },
    // { href: '/settings', label: 'Pengaturan', icon: icons.settings },
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
                    "fixed left-0 top-20 z-40 h-[calc(100vh-6rem)] transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]",
                    "mx-4 rounded-[2rem] border border-white/40 dark:border-white/10 glass shadow-2xl shadow-slate-200/50 dark:shadow-none",
                    isCollapsed ? "md:w-[80px]" : "md:w-72",
                    // Mobile behavior: slide in/out
                    "w-72",
                    isOpen ? "translate-x-0" : "-translate-x-[calc(100%+2rem)] md:translate-x-0"
                )}
            >
                <div className="flex h-full flex-col">
                    {/* Navigation */}
                    <nav className="flex-1 space-y-1.5 p-4">
                        {navItems.map((item: any) => {
                            // Only admins can see View Boost
                            if (item.href === '/view-boost' && user?.role !== 'ADMIN' && user?.role !== 'SUPER_ADMIN') {
                                // Keep this logic if needed, but the previous one was for "Soon" label
                            }

                            // Role restricted items
                            if (item.role === 'SUPER_ADMIN' && user?.role !== 'SUPER_ADMIN') {
                                return null
                            }

                            const isViewBoost = item.href === '/view-boost'
                            const isNonAdmin = user?.role !== 'ADMIN' && user?.role !== 'SUPER_ADMIN'
                            const isDisabled = isViewBoost && isNonAdmin
                            const isActive = !isDisabled && (pathname === item.href || pathname.startsWith(item.href + '/'))

                            return (
                                <motion.div
                                    key={item.href}
                                    whileHover={{ x: 4 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    <Link
                                        href={item.href}
                                        onClick={handleMobileLinkClick}
                                        className={cn(
                                            "group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold transition-all duration-300",
                                            isActive
                                                ? "bg-blue-600 text-white shadow-lg shadow-blue-200 dark:shadow-none"
                                                : "text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-white/80 dark:hover:bg-slate-800/80"
                                        )}
                                    >
                                        <div className={cn(
                                            "shrink-0 transition-colors duration-200",
                                            isActive ? "text-white" : "text-slate-400 group-hover:text-blue-600"
                                        )}>
                                            {item.icon}
                                        </div>
                                        <span className={cn(
                                            "truncate transition-all duration-500",
                                            isCollapsed ? "md:w-0 md:opacity-0" : "md:w-auto md:opacity-100"
                                        )}>
                                            {item.label}
                                        </span>

                                        {isActive && !isCollapsed && (
                                            <motion.div
                                                layoutId="active-pill"
                                                className="ml-auto h-1.5 w-1.5 rounded-full bg-white"
                                            />
                                        )}
                                    </Link>
                                </motion.div>
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
                            {!isCollapsed && <span className="ml-2">Kecilkan</span>}
                        </Button>
                    </div>
                </div>
            </aside>
        </>
    )
}
