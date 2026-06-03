'use client'

import { useEffect } from 'react'
import { authClient } from '@/lib/auth-client'
import { useAuthStore } from '@/stores'
import { useRouter } from 'next/navigation'

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const { setUser, setLoading } = useAuthStore()
    const router = useRouter()

    useEffect(() => {
        const checkSession = async () => {
            try {
                setLoading(true)
                console.log('🔍 AuthProvider: Checking session...')
                const session = await authClient.getSession()
                console.log('📦 AuthProvider: Session data:', session)

                if (session?.data?.user) {
                    // Map Better Auth user to our User type
                    const userData = {
                        id: session.data.user.id,
                        email: session.data.user.email,
                        fullName: session.data.user.name || session.data.user.email.split('@')[0],
                        role: (session.data.user as any).role,
                        avatarUrl: session.data.user.image || undefined,
                    }
                    console.log('✅ AuthProvider: Setting user:', userData)
                    setUser(userData)
                } else {
                    console.log('❌ AuthProvider: No session found')
                    setUser(null)
                }
            } catch (error) {
                console.error('❌ Session check failed:', error)
                setUser(null)
            } finally {
                setLoading(false)
            }
        }

        checkSession()
    }, [setUser, setLoading])

    return <>{children}</>
}
