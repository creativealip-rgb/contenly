'use client'

import { useEffect, useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { User, Shield, Key, Bell, Link2 } from 'lucide-react'
import { api } from '@/lib/api'
import { useAuthStore } from '@/stores/auth-store'
import { ProfileTab } from './_components/profile-tab'
import { SecurityTab } from './_components/security-tab'
import { ApiKeysTab } from './_components/api-keys-tab'
import { NotificationsTab } from './_components/notifications-tab'
import { ConnectionsTab } from './_components/connections-tab'

export default function SettingsPage() {
    const { user } = useAuthStore()

    // Profile State (shared with ProfileTab)
    const [profileData, setProfileData] = useState({
        name: user?.fullName || '',
        email: user?.email || '',
        bio: '',
        image: user?.avatarUrl || ''
    })

    // Notifications State (shared with NotificationsTab)
    const [preferences, setPreferences] = useState<Record<string, boolean>>({
        'article_published': true,
        'low_token': true,
        'rss_error': true,
        'weekly_digest': true
    })

    useEffect(() => {
        fetchUserProfile()
    }, [])

    const fetchUserProfile = async () => {
        try {
            const data = await api.get<any>('/users/me')
            setProfileData({
                name: data.name,
                email: data.email,
                bio: data.bio || '',
                image: data.image || ''
            })
            if (data.preferences) {
                setPreferences(data.preferences)
            }
        } catch (error) {
            console.error('Failed to fetch profile:', error)
        }
    }

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="space-y-1">
                <h1 className="text-4xl font-black tracking-tighter bg-gradient-to-r from-slate-900 to-slate-500 dark:from-white dark:to-slate-400 bg-clip-text text-transparent">
                    Pengaturan
                </h1>
                <p className="text-slate-500 font-medium">
                    Kelola pengaturan akun dan preferensi Anda.
                </p>
            </div>

            <Tabs defaultValue="profile" className="space-y-6">
                <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-grid">
                    <TabsTrigger value="profile" className="gap-2">
                        <User className="h-4 w-4" />
                        <span className="hidden sm:inline">Profil</span>
                    </TabsTrigger>
                    <TabsTrigger value="security" className="gap-2">
                        <Shield className="h-4 w-4" />
                        <span className="hidden sm:inline">Keamanan</span>
                    </TabsTrigger>
                    <TabsTrigger value="api-keys" className="gap-2">
                        <Key className="h-4 w-4" />
                        <span className="hidden sm:inline">Kunci API</span>
                    </TabsTrigger>
                    <TabsTrigger value="notifications" className="gap-2">
                        <Bell className="h-4 w-4" />
                        <span className="hidden sm:inline">Notifikasi</span>
                    </TabsTrigger>
                    <TabsTrigger value="connections" className="gap-2">
                        <Link2 className="h-4 w-4" />
                        <span className="hidden sm:inline">Koneksi</span>
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="profile">
                    <ProfileTab profileData={profileData} setProfileData={setProfileData} />
                </TabsContent>

                <TabsContent value="security">
                    <SecurityTab />
                </TabsContent>

                <TabsContent value="api-keys">
                    <ApiKeysTab />
                </TabsContent>

                <TabsContent value="notifications">
                    <NotificationsTab preferences={preferences} setPreferences={setPreferences} />
                </TabsContent>

                <TabsContent value="connections">
                    <ConnectionsTab />
                </TabsContent>
            </Tabs>
        </div>
    )
}
