'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores'
import { authClient } from '@/lib/auth-client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { motion } from 'framer-motion'
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
        // Only fetch balance if user is logged in
        if (!user) {
            setTokenBalance(null)
            return
        }

        const fetchBalance = async () => {
            try {
                const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'

                const response = await fetch(`${API_BASE_URL}/billing/balance`, {
                    credentials: 'include',
                    headers: { 'ngrok-skip-browser-warning': 'true' }
                })

                if (response.ok) {
                    const data = await response.json()
                    setTokenBalance(data.balance || 0)
                } else if (response.status === 401) {
                    // User not authenticated, clear balance
                    setTokenBalance(null)
                }
            } catch (error) {
                console.error('Failed to fetch token balance:', error)
                setTokenBalance(null)
            }
        }

        fetchBalance()

        // Refresh balance every 10 seconds to catch updates
        const interval = setInterval(fetchBalance, 10000)
        return () => clearInterval(interval)
    }, [user])

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
        <header className="fixed top-0 z-50 w-full bg-white/60 dark:bg-slate-900/60 backdrop-blur-2xl border-b border-white/20 dark:border-slate-800/40">
            <div className="flex h-20 items-center justify-between px-6 md:px-10">
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
                    <Link href="/dashboard" className="hidden md:flex items-center gap-3 group">
                        <div className="relative flex items-center justify-center overflow-hidden">
                            <div className="absolute -inset-4 bg-gradient-to-r from-blue-600/10 to-transparent blur-2xl opacity-0 group-hover:opacity-100 transition-all duration-700" />
                            <Image src="/logo-full.png" alt="Contently Logo" width={140} height={40} className="relative object-contain h-9 w-auto transform transition-transform duration-500 group-hover:scale-[1.02]" />
                        </div>
                    </Link>
                </div>

                {/* Center: Logo (Mobile Only) */}
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 md:hidden flex items-center gap-3">
                    <Link href="/dashboard" className="flex items-center justify-center overflow-hidden">
                        <div className="relative group">
                            <div className="absolute -inset-2 bg-gradient-to-r from-blue-600/20 to-cyan-500/20 blur-xl opacity-0 group-hover:opacity-100 transition-all duration-500" />
                            <Image src="/logo-full.png" alt="Contently Logo" width={140} height={40} className="relative object-contain h-8 w-auto transform transition-transform duration-500 group-hover:scale-105" />
                        </div>
                    </Link>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-6">
                    {/* Token Balance */}
                    <motion.div
                        whileHover={{ scale: 1.05 }}
                        className="hidden md:flex items-center gap-2.5 rounded-2xl bg-gradient-to-br from-amber-400/10 to-orange-500/10 border border-amber-200/50 dark:border-amber-900/30 px-5 py-2.5 text-sm font-black text-amber-600 shadow-sm"
                    >
                        <div className="p-1.5 bg-amber-400 text-white rounded-lg shadow-inner">
                            {icons.tokens}
                        </div>
                        <div className="flex flex-col leading-tight">
                            <span className="text-[10px] uppercase tracking-widest text-amber-500/60 font-black">Saldo</span>
                            <span>{tokenBalance !== null ? tokenBalance.toLocaleString() : '---'}</span>
                        </div>
                    </motion.div>



                    {/* User Menu */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="relative h-12 w-12 rounded-2xl hover:bg-white/40 dark:hover:bg-slate-800/40 p-1 group transition-all">
                                <Avatar className="h-full w-full rounded-xl border-2 border-transparent group-hover:border-blue-400 transition-all">
                                    <AvatarImage src={user?.avatarUrl} alt={user?.fullName || 'User'} />
                                    <AvatarFallback className="rounded-xl bg-gradient-to-br from-blue-600 to-cyan-600 text-white font-black text-sm uppercase">
                                        {user?.fullName?.split(' ').map(n => n[0]).join('') || 'U'}
                                    </AvatarFallback>
                                </Avatar>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                            className="w-72 rounded-[2.5rem] p-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur-3xl border-2 border-white/60 dark:border-slate-800/80 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2)]"
                            align="end"
                            forceMount
                        >
                            <DropdownMenuLabel className="font-normal px-4 py-6 mb-3 rounded-[1.8rem] bg-gradient-to-br from-blue-50/50 to-cyan-50/30 dark:from-blue-900/20 dark:to-cyan-900/10 border border-white/40 dark:border-white/5">
                                <div className="flex flex-col space-y-3">
                                    <div className="flex items-center gap-4">
                                        <div className="relative">
                                            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-2xl blur-md opacity-20" />
                                            <div className="relative h-14 w-14 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center text-white font-black text-xl shadow-xl">
                                                {user?.fullName?.substring(0, 1).toUpperCase() || 'U'}
                                            </div>
                                        </div>
                                        <div className="flex flex-col">
                                            <p className="text-base font-black tracking-tight leading-none text-slate-900 dark:text-white">
                                                {user?.fullName || 'User Account'}
                                            </p>
                                            <Badge variant="secondary" className="mt-2 text-[10px] font-black uppercase tracking-widest h-5 bg-blue-600 text-white border-none shadow-md shadow-blue-500/20">
                                                Premium
                                            </Badge>
                                        </div>
                                    </div>
                                    <div className="px-3 py-2 rounded-xl bg-white/60 dark:bg-slate-900/40 border border-white/40 dark:border-white/5">
                                        <p className="text-xs font-bold leading-none text-slate-500 dark:text-slate-400 truncate">
                                            {user?.email || 'user@example.com'}
                                        </p>
                                    </div>
                                </div>
                            </DropdownMenuLabel>

                            <div className="space-y-2 px-1">
                                <DropdownMenuItem asChild className="rounded-2xl cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all duration-300 p-1">
                                    <Link href="/settings" className="flex items-center gap-4 px-4 py-3">
                                        <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 shadow-sm border border-blue-100/50 dark:border-blue-500/20">
                                            {icons.user}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="font-black text-sm tracking-tight text-slate-900 dark:text-slate-100">Profil Saya</span>
                                            <span className="text-[10px] text-slate-400 font-medium tracking-tight">Kelola informasi publik</span>
                                        </div>
                                    </Link>
                                </DropdownMenuItem>

                                <DropdownMenuItem asChild className="rounded-2xl cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all duration-300 p-1">
                                    <Link href="/settings" className="flex items-center gap-4 px-4 py-3">
                                        <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-500/10 text-amber-600 shadow-sm border border-amber-100/50 dark:border-amber-500/20">
                                            {icons.settings}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="font-black text-sm tracking-tight text-slate-900 dark:text-slate-100">Pengaturan</span>
                                            <span className="text-[10px] text-slate-400 font-medium tracking-tight">Kunci API & Keamanan</span>
                                        </div>
                                    </Link>
                                </DropdownMenuItem>
                            </div>

                            <DropdownMenuSeparator className="my-4 mx-4 bg-slate-100/50 dark:bg-slate-800/50" />

                            <div className="px-1 pb-1">
                                <DropdownMenuItem
                                    onClick={handleLogout}
                                    className="rounded-2xl cursor-pointer text-red-600 focus:text-white focus:bg-red-600 px-4 py-3.5 transition-all duration-300 group"
                                >
                                    <span className="flex items-center gap-4 w-full">
                                        <div className="p-2.5 rounded-xl bg-red-50 dark:bg-red-500/10 text-red-600 group-focus:text-white border border-red-100/50 dark:border-red-500/20">
                                            {icons.logout}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="font-black text-sm tracking-tight">Keluar Sesi</span>
                                            <span className="text-[10px] opacity-70 font-medium tracking-tight">Sampai jumpa lagi</span>
                                        </div>
                                    </span>
                                </DropdownMenuItem>
                            </div>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </header >
    )
}
