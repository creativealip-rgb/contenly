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
        <div className="min-h-screen bg-background">
            <Navbar />
            <Sidebar />
            <main
                className={cn(
                    "min-h-[calc(100vh-4rem)] pt-4 transition-all duration-300",
                    isCollapsed ? "md:ml-16" : "md:ml-64"
                )}
            >
                <div className="container mx-auto px-4 pb-8 md:px-6">
                    {children}
                </div>
            </main>
        </div>
    )
}
