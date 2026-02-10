'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores'
import { authClient } from '@/lib/auth-client'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useSidebarStore } from '@/stores'

// Custom SVG icons
const icons = {
    menu: (
        <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth="2">
            <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
        </svg>
    ),
    tokens: (
        <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth="1.5">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 6v12M9 9l3-3 3 3M9 15l3 3 3-3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    ),
    bell: (
        <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth="1.5">
            <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    ),
    user: (
        <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth="1.5">
            <circle cx="12" cy="8" r="4" />
            <path d="M6 21v-2a4 4 0 014-4h4a4 4 0 014 4v2" strokeLinecap="round" />
        </svg>
    ),
    settings: (
        <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth="1.5">
            <circle cx="12" cy="12" r="3" />
            <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" />
        </svg>
    ),
    logout: (
        <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth="1.5">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    ),
}

export function Navbar() {
    const { user, logout } = useAuthStore()
    const { toggle } = useSidebarStore()
    const router = useRouter()
    const [tokenBalance, setTokenBalance] = useState<number | null>(null)

    // Fetch token balance on mount and periodically
    useEffect(() => {
        const fetchBalance = async () => {
            try {
                const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

                const response = await fetch(`${API_BASE_URL}/billing/balance`, {
                    credentials: 'include',
                    headers: { 'ngrok-skip-browser-warning': 'true' }
                })

                if (response.ok) {
                    const data = await response.json()
                    setTokenBalance(data.balance || 0)
                }
            } catch (error) {
                console.error('Failed to fetch token balance:', error)
            }
        }

        fetchBalance()

        // Refresh balance every 10 seconds to catch updates
        const interval = setInterval(fetchBalance, 10000)
        return () => clearInterval(interval)
    }, [])

    const handleLogout = async () => {
        try {
            // Sign out from Better Auth
            await authClient.signOut()
            // Clear local store
            logout()
            // Redirect to login
            router.push('/login')
            router.refresh()
        } catch (error) {
            console.error('Logout error:', error)
            // Still clear local state even if Better Auth fails
            logout()
            router.push('/login')
        }
    }

    return (
        <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-xl">
            <div className="flex h-16 items-center justify-between px-4 md:px-6">
                {/* Left: Menu Toggle && Logo (Desktop) */}
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="md:hidden rounded-xl"
                        onClick={toggle}
                    >
                        {icons.menu}
                    </Button>

                    {/* Desktop Logo - visible on md+, hidden on mobile */}
                    <Link href="/dashboard" className="hidden md:flex items-center gap-3">
                        <div className="flex items-center justify-center overflow-hidden">
                            <Image src="/logo-full.png" alt="Contently Logo" width={140} height={40} className="object-contain h-9 w-auto" />
                        </div>
                    </Link>
                </div>

                {/* Center: Logo (Mobile Only) */}
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 md:hidden flex items-center gap-3">
                    <Link href="/dashboard" className="flex items-center justify-center overflow-hidden">
                        <Image src="/logo-full.png" alt="Contently Logo" width={140} height={40} className="object-contain h-8 w-auto" />
                    </Link>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-3">
                    {/* Token Balance */}
                    <div className="hidden md:flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 px-4 py-2 text-sm font-medium text-amber-600">
                        {icons.tokens}
                        <span>{tokenBalance !== null ? `${tokenBalance} Tokens` : 'Loading...'}</span>
                    </div>



                    {/* User Menu */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="relative h-10 w-10 rounded-xl hover:bg-accent p-0">
                                <Avatar className="h-10 w-10 rounded-xl">
                                    <AvatarImage src={user?.avatarUrl} alt={user?.fullName || 'User'} />
                                    <AvatarFallback className="rounded-xl bg-gradient-to-br from-blue-600 to-cyan-600 text-white font-semibold">
                                        {user?.fullName?.charAt(0) || 'U'}
                                    </AvatarFallback>
                                </Avatar>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-56 rounded-xl p-2" align="end" forceMount>
                            <DropdownMenuLabel className="font-normal px-3 py-2">
                                <div className="flex flex-col space-y-1">
                                    <p className="text-sm font-semibold leading-none">{user?.fullName || 'User'}</p>
                                    <p className="text-xs leading-none text-muted-foreground">
                                        {user?.email || 'user@example.com'}
                                    </p>
                                </div>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator className="my-2" />
                            <DropdownMenuItem disabled className="rounded-lg opacity-50 cursor-not-allowed">
                                <div className="flex items-center gap-3 px-3 py-2">
                                    {icons.user}
                                    Profile (Soon)
                                </div>
                            </DropdownMenuItem>
                            <DropdownMenuItem disabled className="rounded-lg opacity-50 cursor-not-allowed">
                                <div className="flex items-center gap-3 px-3 py-2">
                                    {icons.settings}
                                    Settings (Soon)
                                </div>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="my-2" />
                            <DropdownMenuItem
                                onClick={handleLogout}
                                className="rounded-lg cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-500/10 px-3 py-2"
                            >
                                <span className="flex items-center gap-3">
                                    {icons.logout}
                                    Log out
                                </span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </header >
    )
}
