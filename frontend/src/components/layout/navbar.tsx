'use client'

import Link from 'next/link'
import { useAuthStore } from '@/stores'
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
import { Sparkles, Bell, Settings, LogOut, User, Menu } from 'lucide-react'
import { useSidebarStore } from '@/stores'

export function Navbar() {
    const { user, logout } = useAuthStore()
    const { toggle } = useSidebarStore()

    return (
        <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex h-16 items-center justify-between px-4 md:px-6">
                {/* Left: Logo & Menu Toggle */}
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="md:hidden"
                        onClick={toggle}
                    >
                        <Menu className="h-5 w-5" />
                    </Button>

                    <Link href="/dashboard" className="flex items-center gap-2">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600">
                            <Sparkles className="h-5 w-5 text-white" />
                        </div>
                        <span className="hidden font-bold text-xl bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent md:block">
                            Camedia AI
                        </span>
                    </Link>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2">
                    {/* Token Balance */}
                    <div className="hidden md:flex items-center gap-2 rounded-full bg-amber-500/10 px-3 py-1.5 text-sm font-medium text-amber-600">
                        <Sparkles className="h-4 w-4" />
                        <span>50 Tokens</span>
                    </div>

                    {/* Notifications */}
                    <Button variant="ghost" size="icon" className="relative">
                        <Bell className="h-5 w-5" />
                        <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-medium text-white">
                            3
                        </span>
                    </Button>

                    {/* User Menu */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                                <Avatar className="h-9 w-9">
                                    <AvatarImage src={user?.avatarUrl} alt={user?.fullName || 'User'} />
                                    <AvatarFallback className="bg-gradient-to-br from-violet-600 to-indigo-600 text-white">
                                        {user?.fullName?.charAt(0) || 'U'}
                                    </AvatarFallback>
                                </Avatar>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-56" align="end" forceMount>
                            <DropdownMenuLabel className="font-normal">
                                <div className="flex flex-col space-y-1">
                                    <p className="text-sm font-medium leading-none">{user?.fullName || 'User'}</p>
                                    <p className="text-xs leading-none text-muted-foreground">
                                        {user?.email || 'user@example.com'}
                                    </p>
                                </div>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                                <Link href="/settings" className="cursor-pointer">
                                    <User className="mr-2 h-4 w-4" />
                                    Profile
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                                <Link href="/settings" className="cursor-pointer">
                                    <Settings className="mr-2 h-4 w-4" />
                                    Settings
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                onClick={() => logout()}
                                className="cursor-pointer text-red-600 focus:text-red-600"
                            >
                                <LogOut className="mr-2 h-4 w-4" />
                                Log out
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </header>
    )
}
