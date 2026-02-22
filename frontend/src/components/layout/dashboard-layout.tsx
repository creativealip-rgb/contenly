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
<<<<<<< HEAD
                    "min-h-[calc(100vh-4rem)] pt-4 transition-all duration-300 max-w-full overflow-x-hidden",
                    isCollapsed ? "md:ml-16" : "md:ml-64",
                    "pb-24 md:pb-8" // Add padding for bottom nav on mobile
                )}
            >
                <div className="container mx-auto px-4 md:px-6">
=======
                    "min-h-[calc(100vh-5rem)] pt-20 transition-all duration-300 max-w-full overflow-x-hidden",
                    isCollapsed ? "md:ml-[112px]" : "md:ml-[320px]"
                )}
            >
                <div className="w-full px-4 pb-8 md:px-10">
>>>>>>> c1209c3 (feat: global styling refresh, layout fixes, and build error resolution)
                    {children}
                </div>
            </main>
            <BottomNav />
        </div>
    )
}
