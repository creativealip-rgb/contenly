'use client'

import { useSidebarStore } from '@/stores'
import { Navbar } from './navbar'
import { Sidebar } from './sidebar'
import { BottomNav } from './bottom-nav'
import { cn } from '@/lib/utils'

interface DashboardLayoutProps {
    children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
    const { isCollapsed } = useSidebarStore()

    return (
        <div className="min-h-screen bg-background overflow-x-hidden">
            <Navbar />
            <Sidebar />
            <main
                className={cn(
                    "min-h-[calc(100vh-4rem)] pt-4 transition-all duration-300 max-w-full overflow-x-hidden",
                    isCollapsed ? "md:ml-16" : "md:ml-64",
                    "pb-24 md:pb-8" // Add padding for bottom nav on mobile
                )}
            >
                <div className="container mx-auto px-4 md:px-6">
                    {children}
                </div>
            </main>
            <BottomNav />
        </div>
    )
}
