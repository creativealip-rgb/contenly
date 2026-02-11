'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores'

export function SuperAdminGuard({ children }: { children: React.ReactNode }) {
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

    if (user?.role !== 'SUPER_ADMIN') {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
                <div className="h-20 w-20 rounded-full bg-red-50 flex items-center justify-center text-red-600">
                    <svg viewBox="0 0 24 24" fill="none" className="w-10 h-10" stroke="currentColor" strokeWidth="1.5">
                        <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </div>
                <h1 className="text-2xl font-bold">Access Denied</h1>
                <p className="text-muted-foreground max-w-sm">
                    Halaman ini hanya dapat diakses oleh Super Admin.
                </p>
                <button
                    onClick={() => router.push('/dashboard')}
                    className="text-blue-600 hover:underline font-medium"
                >
                    Kembali ke Dashboard
                </button>
            </div>
        )
    }

    return <>{children}</>
}
