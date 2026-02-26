'use client'

import { useSidebarStore } from '@/stores'
import { Navbar } from './navbar'
import { Sidebar } from './sidebar'
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
                    "min-h-screen pt-20 transition-all duration-300 max-w-full overflow-x-hidden",
                    isCollapsed ? "md:ml-[112px]" : "md:ml-[320px]"
                )}
            >
                <div className="w-full px-4 pb-8 md:px-10">
                    {children}
                </div>
            </main>
        </div>
    )
}
