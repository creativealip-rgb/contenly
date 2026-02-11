'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores'

export function AdminGuard({ children }: { children: React.ReactNode }) {
    const router = useRouter()
    const { user, isAuthenticated, isLoading } = useAuthStore()

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push('/login')
        }
    }, [isAuthenticated, isLoading, router])

    if (isLoading || !isAuthenticated) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        )
    }

    if (user?.role !== 'ADMIN' && user?.role !== 'SUPER_ADMIN') {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
                <div className="h-20 w-20 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                    <svg viewBox="0 0 24 24" fill="none" className="w-10 h-10" stroke="currentColor" strokeWidth="1.5">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M12 6v6l4 2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </div>
                <h1 className="text-2xl font-bold">Feature Coming Soon</h1>
                <p className="text-muted-foreground max-w-sm">
                    Fitur ini sedang dalam tahap pengembangan dan saat ini hanya dapat diakses oleh Admin.
                </p>
            </div>
        )
    }

    return <>{children}</>
}
