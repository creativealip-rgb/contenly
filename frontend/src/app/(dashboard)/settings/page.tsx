'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    User,
    Shield,
    Key,
    Bell,
    Link2,
    Camera,
    Eye,
    EyeOff,
    Copy,
    Trash2,
    Plus,
    Loader2,
    RefreshCw
} from 'lucide-react'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import { useAuthStore } from '@/stores/auth-store'
import { authClient } from '@/lib/auth-client'
import { useConfirm } from '@/components/ui/confirm-dialog'

export default function SettingsPage() {
    const confirm = useConfirm()
    const { user, setUser } = useAuthStore()
    const [showCurrentPassword, setShowCurrentPassword] = useState(false)
    const [showNewPassword, setShowNewPassword] = useState(false)

    // Profile State
    const [isSavingProfile, setIsSavingProfile] = useState(false)
    const [profileData, setProfileData] = useState({
        name: user?.fullName || '',
        email: user?.email || '',
        bio: '',
        image: user?.avatarUrl || ''
    })

    const [apiKeys, setApiKeys] = useState<any[]>([])
    const [isLoadingKeys, setIsLoadingKeys] = useState(false)
    const [isGeneratingKey, setIsGeneratingKey] = useState(false)
    const [newKeyName, setNewKeyName] = useState('')
    const [isAddKeyOpen, setIsAddKeyOpen] = useState(false)

    // Security State
    const [isUpdatingPassword, setIsUpdatingPassword] = useState(false)
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    })

    // Notifications State
    const [preferences, setPreferences] = useState<Record<string, boolean>>({
        'article_published': true,
        'low_token': true,
        'rss_error': true,
        'weekly_digest': true
    })

    // Connections State
    const [accounts, setAccounts] = useState<any[]>([])
    const [isLoadingAccounts, setIsLoadingAccounts] = useState(false)
    const [isAvatarDialogOpen, setIsAvatarDialogOpen] = useState(false)
    const [avatarUrlInput, setAvatarUrlInput] = useState(user?.avatarUrl || '')

    // Instagram State
    const [instagramData, setInstagramData] = useState({
        connected: false,
        username: '',
        message: ''
    })
    const [isLoadingInstagram, setIsLoadingInstagram] = useState(false)
    const [isInstagramDialogOpen, setIsInstagramDialogOpen] = useState(false)
    const [instagramForm, setInstagramForm] = useState({
        accessToken: '',
        accountId: ''
    })

    useEffect(() => {
        fetchUserProfile()
        fetchApiKeys()
        fetchAccounts()
        fetchInstagramStatus()
    }, [])

    const fetchAccounts = async () => {
        setIsLoadingAccounts(true)
        try {
            const { data } = await authClient.listAccounts()
            setAccounts(data || [])
        } catch (error) {
            console.error('Failed to fetch accounts:', error)
        } finally {
            setIsLoadingAccounts(false)
        }
    }

    const fetchInstagramStatus = async () => {
        setIsLoadingInstagram(true)
        try {
            const response = await api.get<any>('/social/instagram/status')
            setInstagramData({
                connected: response.connected,
                username: response.username || '',
                message: response.message
            })
        } catch (error) {
            console.error('Failed to fetch Instagram status:', error)
        } finally {
            setIsLoadingInstagram(false)
        }
    }

    const handleConnectInstagram = async () => {
        if (!instagramForm.accessToken || !instagramForm.accountId) {
            toast.error('Mohon isi Access Token dan Account ID')
            return
        }

        setIsLoadingInstagram(true)
        try {
            const response = await api.post<any>('/social/instagram/connect', {
                accessToken: instagramForm.accessToken,
                accountId: instagramForm.accountId
            })

            if (response.success) {
                toast.success('Instagram berhasil terhubung!')
                setIsInstagramDialogOpen(false)
                setInstagramForm({ accessToken: '', accountId: '' })
                fetchInstagramStatus()
            } else {
                toast.error(response.message || 'Gagal menghubungkan Instagram')
            }
        } catch (error: any) {
            toast.error(error.message || 'Gagal menghubungkan Instagram')
        } finally {
            setIsLoadingInstagram(false)
        }
    }

    const handleDisconnectInstagram = async () => {
        const confirmed = await confirm({
            title: 'Putuskan Instagram',
            description: 'Apakah Anda yakin ingin memutuskan koneksi Instagram?',
            confirmText: 'Putuskan',
            cancelText: 'Batal',
            variant: 'destructive',
            onConfirm: async () => {
                setIsLoadingInstagram(true)
                try {
                    await api.delete<any>('/social/instagram/disconnect')
                    toast.success('Instagram berhasil diputuskan')
                    fetchInstagramStatus()
                } catch (error: any) {
                    toast.error(error.message || 'Gagal memutuskan Instagram')
                } finally {
                    setIsLoadingInstagram(false)
                }
            },
        })
    }

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

    const fetchApiKeys = async () => {
        setIsLoadingKeys(true)
        try {
            const data = await api.get<any[]>('/users/me/api-keys')
            setApiKeys(data)
        } catch (error) {
            console.error('Failed to fetch API keys:', error)
        } finally {
            setIsLoadingKeys(false)
        }
    }

    const handleSaveProfile = async () => {
        setIsSavingProfile(true)
        try {
            const updated = await api.patch<any>('/users/me', {
                name: profileData.name,
                bio: profileData.bio,
                image: profileData.image
            })

            // Update auth store
            if (user) {
                setUser({
                    ...user,
                    fullName: updated.name,
                    avatarUrl: updated.image
                })
            }

            toast.success('Profil berhasil diperbarui')
        } catch (error: any) {
            toast.error(error.message || 'Gagal memperbarui profil')
        } finally {
            setIsSavingProfile(false)
        }
    }

    const handleCreateApiKey = async () => {
        if (!newKeyName) return
        setIsGeneratingKey(true)
        try {
            const result = await api.post<any>('/users/me/api-keys', { name: newKeyName })
            toast.success('Kunci API baru berhasil dibuat', {
                description: `Kunci: ${result.key}\nSimpan kunci ini sekarang, Anda tidak akan bisa melihatnya lagi.`,
                duration: 10000,
            })
            setNewKeyName('')
            setIsAddKeyOpen(false)
            fetchApiKeys()
        } catch (error: any) {
            toast.error(error.message || 'Gagal membuat kunci API')
        } finally {
            setIsGeneratingKey(false)
        }
    }

    const handleRevokeApiKey = async (id: string) => {
        const confirmed = await confirm({
            title: 'Hapus Kunci API',
            description: 'Apakah Anda yakin ingin menghapus kunci API ini?',
            confirmText: 'Hapus',
            cancelText: 'Batal',
            variant: 'destructive',
            onConfirm: async () => {
                try {
                    await api.delete(`/users/me/api-keys/${id}`)
                    toast.success('Kunci API berhasil dihapus')
                    fetchApiKeys()
                } catch (error: any) {
                    toast.error(error.message || 'Gagal menghapus kunci API')
                }
            },
        })
    }

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text)
        toast.info('Teks berhasil disalin ke papan klip')
    }

    const handleChangePassword = async () => {
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            toast.error('Konfirmasi kata sandi tidak cocok')
            return
        }

        setIsUpdatingPassword(true)
        try {
            const { error } = await authClient.changePassword({
                newPassword: passwordData.newPassword,
                currentPassword: passwordData.currentPassword,
                revokeOtherSessions: true
            })

            if (error) throw error

            toast.success('Kata sandi berhasil diperbarui')
            setPasswordData({
                currentPassword: '',
                newPassword: '',
                confirmPassword: ''
            })
        } catch (error: any) {
            toast.error(error.message || 'Gagal memperbarui kata sandi')
        } finally {
            setIsUpdatingPassword(false)
        }
    }

    const handlePreferenceToggle = async (key: string) => {
        const newPrefs = { ...preferences, [key]: !preferences[key] }
        setPreferences(newPrefs)
        try {
            await api.patch('/users/me/preferences', newPrefs)
            toast.success('Preferensi disimpan')
        } catch (error) {
            toast.error('Gagal menyimpan preferensi')
        }
    }

    const handleLinkAccount = async (provider: 'google' | 'github') => {
        try {
            await authClient.signIn.social({
                provider,
                callbackURL: window.location.href
            })
        } catch (error: any) {
            toast.error(`Gagal menghubungkan ${provider}: ${error.message}`)
        }
    }

    const handleUnlinkAccount = async (id: string, providerId: string) => {
        const confirmed = await confirm({
            title: 'Putuskan Hubungan Akun',
            description: 'Apakah Anda yakin ingin memutuskan hubungan akun ini?',
            confirmText: 'Putuskan',
            cancelText: 'Batal',
            variant: 'destructive',
            onConfirm: async () => {
                try {
                    const { error } = await authClient.unlinkAccount({
                        accountId: id,
                        providerId: providerId
                    })
                    if (error) throw error
                    toast.success('Akun berhasil diputuskan')
                    fetchAccounts()
                } catch (error: any) {
                    toast.error(`Gagal memutuskan hubungan: ${error.message}`)
                }
            },
        })
    }

    const handleUpdateAvatar = async () => {
        setIsSavingProfile(true)
        try {
            const updated = await api.patch<any>('/users/me', {
                image: avatarUrlInput
            })

            if (user) {
                setUser({
                    ...user,
                    avatarUrl: updated.image
                })
            }

            setProfileData(prev => ({ ...prev, image: updated.image }))
            setIsAvatarDialogOpen(false)
            toast.success('Foto profil berhasil diperbarui')
        } catch (error: any) {
            toast.error(error.message || 'Gagal memperbarui foto profil')
        } finally {
            setIsSavingProfile(false)
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

                {/* Profile Tab */}
                <TabsContent value="profile">
                    <Card className="glass border-2 border-white/60 dark:border-white/20 overflow-hidden hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-none transition-all duration-500 rounded-3xl">
                        <CardHeader>
                            <CardTitle>Informasi Profil</CardTitle>
                            <CardDescription>
                                Perbarui informasi pribadi dan foto profil Anda.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Avatar */}
                            <div className="flex items-center gap-6">
                                <Avatar className="h-20 w-20">
                                    <AvatarImage src={profileData.image} />
                                    <AvatarFallback className="text-2xl bg-gradient-to-br from-blue-600 to-blue-700 text-white">
                                        {profileData.name?.substring(0, 2).toUpperCase() || 'JD'}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="space-y-2">
                                    <Dialog open={isAvatarDialogOpen} onOpenChange={setIsAvatarDialogOpen}>
                                        <DialogTrigger asChild>
                                            <Button variant="outline" size="sm">
                                                <Camera className="h-4 w-4 mr-2" />
                                                Ganti Foto
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent>
                                            <DialogHeader>
                                                <DialogTitle>Perbarui Foto Profil</DialogTitle>
                                                <DialogDescription>
                                                    Masukkan URL gambar untuk mengganti foto profil Anda.
                                                </DialogDescription>
                                            </DialogHeader>
                                            <div className="py-4 space-y-4">
                                                <div className="flex justify-center">
                                                    <Avatar className="h-24 w-24 border-4 border-blue-100 dark:border-blue-900 shadow-xl">
                                                        <AvatarImage src={avatarUrlInput} />
                                                        <AvatarFallback className="text-3xl bg-blue-600 text-white">
                                                            {profileData.name?.substring(0, 1).toUpperCase()}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="avatarUrl">URL Gambar</Label>
                                                    <Input
                                                        id="avatarUrl"
                                                        placeholder="https://example.com/photo.jpg"
                                                        value={avatarUrlInput}
                                                        onChange={(e) => setAvatarUrlInput(e.target.value)}
                                                    />
                                                </div>
                                            </div>
                                            <DialogFooter>
                                                <Button variant="outline" onClick={() => setIsAvatarDialogOpen(false)}>Batal</Button>
                                                <Button onClick={handleUpdateAvatar} disabled={isSavingProfile}>
                                                    {isSavingProfile && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                                    Simpan
                                                </Button>
                                            </DialogFooter>
                                        </DialogContent>
                                    </Dialog>
                                    <p className="text-xs text-muted-foreground">
                                        Gunakan URL gambar publik (HTTPS).
                                    </p>
                                </div>
                            </div>

                            <Separator />

                            {/* Form Fields */}
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="fullName">Nama Lengkap</Label>
                                    <Input
                                        id="fullName"
                                        placeholder="John Doe"
                                        value={profileData.name}
                                        onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="john@example.com"
                                        value={profileData.email}
                                        disabled
                                        className="bg-slate-50 opacity-70"
                                    />
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <Label htmlFor="bio">Bio</Label>
                                    <Textarea
                                        id="bio"
                                        placeholder="Ceritakan tentang diri Anda..."
                                        className="min-h-[100px]"
                                        value={profileData.bio}
                                        onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end">
                                <Button
                                    className="bg-gradient-to-r from-blue-600 to-blue-700"
                                    onClick={handleSaveProfile}
                                    disabled={isSavingProfile}
                                >
                                    {isSavingProfile && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Simpan Perubahan
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Security Tab */}
                <TabsContent value="security">
                    <Card className="glass border-2 border-white/60 dark:border-white/20 overflow-hidden hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-none transition-all duration-500 rounded-3xl">
                        <CardHeader>
                            <CardTitle>Sandi & Keamanan</CardTitle>
                            <CardDescription>
                                Jaga keamanan akun Anda dengan kata sandi yang kuat.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid gap-4 max-w-md">
                                <div className="space-y-2">
                                    <Label htmlFor="currentPassword">Kata Sandi Saat Ini</Label>
                                    <div className="relative">
                                        <Input
                                            id="currentPassword"
                                            type={showCurrentPassword ? 'text' : 'password'}
                                            placeholder="Masukkan kata sandi saat ini"
                                            value={passwordData.currentPassword}
                                            onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                        />
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="absolute right-0 top-0 h-full px-3"
                                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                        >
                                            {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </Button>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="newPassword">Kata Sandi Baru</Label>
                                    <div className="relative">
                                        <Input
                                            id="newPassword"
                                            type={showNewPassword ? 'text' : 'password'}
                                            placeholder="Masukkan kata sandi baru"
                                            value={passwordData.newPassword}
                                            onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                        />
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="absolute right-0 top-0 h-full px-3"
                                            onClick={() => setShowNewPassword(!showNewPassword)}
                                        >
                                            {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </Button>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="confirmPassword">Konfirmasi Kata Sandi Baru</Label>
                                    <Input
                                        id="confirmPassword"
                                        type="password"
                                        placeholder="Konfirmasi kata sandi baru"
                                        value={passwordData.confirmPassword}
                                        onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end">
                                <Button
                                    className="bg-gradient-to-r from-blue-600 to-blue-700"
                                    onClick={handleChangePassword}
                                    disabled={isUpdatingPassword || !passwordData.newPassword}
                                >
                                    {isUpdatingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Perbarui Kata Sandi
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* API Keys Tab */}
                <TabsContent value="api-keys">
                    <Card className="glass border-2 border-white/60 dark:border-white/20 overflow-hidden hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-none transition-all duration-500 rounded-3xl">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>Kunci API</CardTitle>
                                <CardDescription>
                                    Kelola kunci API untuk integrasi eksternal.
                                </CardDescription>
                            </div>
                            <Dialog open={isAddKeyOpen} onOpenChange={setIsAddKeyOpen}>
                                <DialogTrigger asChild>
                                    <Button className="bg-gradient-to-r from-blue-600 to-blue-700">
                                        <Plus className="h-4 w-4 mr-2" />
                                        Buat Kunci
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Buat Kunci API Baru</DialogTitle>
                                        <DialogDescription>
                                            Berikan nama untuk memudahkan Anda mengidentifikasi kunci ini.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="py-4">
                                        <Label htmlFor="keyName">Nama Kunci</Label>
                                        <Input
                                            id="keyName"
                                            placeholder="cth., Backend CMS"
                                            value={newKeyName}
                                            onChange={(e) => setNewKeyName(e.target.value)}
                                        />
                                    </div>
                                    <DialogFooter>
                                        <Button variant="outline" onClick={() => setIsAddKeyOpen(false)}>Batal</Button>
                                        <Button
                                            onClick={handleCreateApiKey}
                                            disabled={isGeneratingKey || !newKeyName}
                                        >
                                            {isGeneratingKey && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                            Generate
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {isLoadingKeys ? (
                                    <div className="py-12 flex flex-col items-center justify-center opacity-40">
                                        <RefreshCw className="h-8 w-8 animate-spin mb-4" />
                                        <p className="text-sm font-bold uppercase tracking-widest">Memuat Kunci API...</p>
                                    </div>
                                ) : apiKeys.length === 0 ? (
                                    <div className="py-12 text-center border-2 border-dashed rounded-2xl opacity-40">
                                        <Key className="h-8 w-8 mx-auto mb-2" />
                                        <p className="text-sm">Belum ada kunci API.</p>
                                    </div>
                                ) : (
                                    apiKeys.map((key) => (
                                        <div key={key.id} className="flex items-center justify-between p-4 rounded-xl border bg-slate-50/50">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-black tracking-tight">{key.name}</span>
                                                    <Badge variant="secondary" className="text-[10px] font-bold">AKTIF</Badge>
                                                </div>
                                                <code className="text-xs text-slate-500 font-mono bg-white px-2 py-0.5 rounded border">
                                                    {key.keyPrefix}********************
                                                </code>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                    Dibuat: {new Date(key.createdAt).toLocaleDateString()} • Digunakan: {key.lastUsedAt ? new Date(key.lastUsedAt).toLocaleDateString() : 'Belum pernah'}
                                                </p>
                                            </div>
                                            <div className="flex gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-9 w-9 rounded-xl hover:bg-blue-50 hover:text-blue-600"
                                                    onClick={() => handleCopy(key.keyPrefix)}
                                                >
                                                    <Copy className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-9 w-9 rounded-xl hover:bg-red-50 text-red-600"
                                                    onClick={() => handleRevokeApiKey(key.id)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Notifications Tab */}
                <TabsContent value="notifications">
                    <Card className="glass border-2 border-white/60 dark:border-white/20 overflow-hidden hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-none transition-all duration-500 rounded-3xl">
                        <CardHeader>
                            <CardTitle>Preferensi Notifikasi</CardTitle>
                            <CardDescription>
                                Pilih bagaimana Anda ingin diberi tahu.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-4">
                                {[
                                    { id: 'article_published', label: 'Artikel Diterbitkan', description: 'Ketika sebuah artikel berhasil diterbitkan ke WordPress' },
                                    { id: 'low_token', label: 'Saldo Token Rendah', description: 'Ketika saldo token Anda kurang dari 10' },
                                    { id: 'rss_error', label: 'Kesalahan Umpan RSS', description: 'Ketika terjadi masalah saat melakukan polling pada umpan Anda' },
                                    { id: 'weekly_digest', label: 'Ringkasan Mingguan', description: 'Laporan mingguan tentang performa konten Anda' },
                                ].map((item) => (
                                    <div key={item.id} className="flex items-center justify-between p-4 rounded-xl border bg-slate-50/30">
                                        <div>
                                            <p className="font-bold tracking-tight">{item.label}</p>
                                            <p className="text-xs text-slate-500">{item.description}</p>
                                        </div>
                                        <div className="flex gap-4">
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    className="sr-only peer"
                                                    checked={preferences[item.id] || false}
                                                    onChange={() => handlePreferenceToggle(item.id)}
                                                />
                                                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                            </label>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Connections Tab */}
                <TabsContent value="connections">
                    <Card className="glass border-2 border-white/60 dark:border-white/20 overflow-hidden hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-none transition-all duration-500 rounded-3xl">
                        <CardHeader>
                            <CardTitle>Akun Terhubung</CardTitle>
                            <CardDescription>
                                Kelola koneksi OAuth Anda.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {isLoadingAccounts ? (
                                <div className="py-8 flex justify-center">
                                    <Loader2 className="h-6 w-6 animate-spin opacity-40" />
                                </div>
                            ) : (
                                ['google', 'github'].map((providerName) => {
                                    const providerAccount = accounts.find(a => a.providerId === providerName)
                                    const isConnected = !!providerAccount

                                    return (
                                        <div key={providerName} className="flex items-center justify-between p-4 rounded-2xl border bg-slate-50/50 dark:bg-slate-800/20">
                                            <div className="flex items-center gap-4">
                                                <div className={`flex h-12 w-12 items-center justify-center rounded-xl font-black text-xl shadow-sm border ${providerName === 'google' ? 'bg-white text-blue-600 border-blue-50' : 'bg-slate-900 text-white border-slate-700'
                                                    }`}>
                                                    {providerName === 'google' ? 'G' : 'Git'}
                                                </div>
                                                <div>
                                                    <p className="font-black capitalize tracking-tight">{providerName}</p>
                                                    {isConnected ? (
                                                        <p className="text-xs font-medium text-blue-600 dark:text-blue-400">Terhubung</p>
                                                    ) : (
                                                        <p className="text-xs font-medium text-slate-400">Tidak terhubung</p>
                                                    )}
                                                </div>
                                            </div>
                                            {isConnected ? (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="rounded-xl border-red-100 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-900/30"
                                                    onClick={() => handleUnlinkAccount(providerAccount.id, providerAccount.providerId)}
                                                >
                                                    Putuskan
                                                </Button>
                                            ) : (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="rounded-xl border-blue-100 text-blue-600 hover:bg-blue-50 hover:text-blue-700 dark:border-blue-900/30"
                                                    onClick={() => handleLinkAccount(providerName as any)}
                                                >
                                                    Hubungkan
                                                </Button>
                                            )}
                                        </div>
                                    )
                                })
                            )}
                        </CardContent>
                    </Card>

                    {/* Instagram Connection */}
                    <Card className="glass border-2 border-white/60 dark:border-white/20 overflow-hidden hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-none transition-all duration-500 rounded-3xl mt-4">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Camera className="h-5 w-5" />
                                Instagram
                            </CardTitle>
                            <CardDescription>
                                Hubungkan akun Instagram untuk memposting carousel langsung ke Instagram.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {isLoadingInstagram ? (
                                <div className="py-8 flex justify-center">
                                    <Loader2 className="h-6 w-6 animate-spin opacity-40" />
                                </div>
                            ) : (
                                <div className="flex items-center justify-between p-4 rounded-2xl border bg-slate-50/50 dark:bg-slate-800/20">
                                    <div className="flex items-center gap-4">
                                        <div className="flex h-12 w-12 items-center justify-center rounded-xl font-black text-xl shadow-sm border bg-gradient-to-tr from-purple-500 via-pink-500 to-yellow-500 text-white">
                                            IG
                                        </div>
                                        <div>
                                            <p className="font-black capitalize tracking-tight">Instagram</p>
                                            {instagramData.connected ? (
                                                <p className="text-xs font-medium text-green-600 dark:text-green-400">
                                                    @{instagramData.username} - Terhubung
                                                </p>
                                            ) : (
                                                <p className="text-xs font-medium text-slate-400">
                                                    {instagramData.message || 'Tidak terhubung'}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    {instagramData.connected ? (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="rounded-xl border-red-100 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-900/30"
                                            onClick={handleDisconnectInstagram}
                                        >
                                            Putuskan
                                        </Button>
                                    ) : (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="rounded-xl border-pink-100 text-pink-600 hover:bg-pink-50 hover:text-pink-700 dark:border-pink-900/30"
                                            onClick={() => setIsInstagramDialogOpen(true)}
                                        >
                                            Hubungkan
                                        </Button>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Instagram Connect Dialog */}
                    <Dialog open={isInstagramDialogOpen} onOpenChange={setIsInstagramDialogOpen}>
                        <DialogContent className="sm:max-w-md">
                            <DialogHeader>
                                <DialogTitle>Hubungkan Instagram</DialogTitle>
                                <DialogDescription>
                                    Masukkan Access Token dan Account ID dari Instagram Basic Display API.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="accessToken">Access Token</Label>
                                    <Input
                                        id="accessToken"
                                        type="password"
                                        placeholder="EAAC..."
                                        value={instagramForm.accessToken}
                                        onChange={(e) => setInstagramForm(prev => ({ ...prev, accessToken: e.target.value }))}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="accountId">Account ID</Label>
                                    <Input
                                        id="accountId"
                                        placeholder="178414..."
                                        value={instagramForm.accountId}
                                        onChange={(e) => setInstagramForm(prev => ({ ...prev, accountId: e.target.value }))}
                                    />
                                </div>
                                <p className="text-xs text-slate-500">
                                    Untuk mendapatkan Access Token, gunakan{' '}
                                    <a 
                                        href="https://developers.facebook.com/docs/instagram-basic-display-api" 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:underline"
                                    >
                                        Instagram Basic Display API
                                    </a>
                                </p>

                                {/* Guide Accordion */}
                                <details className="mt-2">
                                    <summary className="text-sm font-medium text-slate-600 cursor-pointer hover:text-slate-900">
                                        📖 Panduan Mendapatkan Token
                                    </summary>
                                    <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg text-xs space-y-3">
                                        <div>
                                            <p className="font-semibold">Langkah 1: Buat App di Meta Developers</p>
                                            <ul className="list-disc list-inside text-slate-600 dark:text-slate-400 mt-1 space-y-1">
                                                <li>Kunjungi <a href="https://developers.facebook.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">developers.facebook.com</a></li>
                                                <li>Klik "My Apps" → "Create App"</li>
                                                <li>Pilih "Other" → "Consumer"</li>
                                                <li>Isi nama app dan email developer</li>
                                            </ul>
                                        </div>
                                        <div>
                                            <p className="font-semibold">Langkah 2: Tambahkan Instagram Basic Display</p>
                                            <ul className="list-disc list-inside text-slate-600 dark:text-slate-400 mt-1 space-y-1">
                                                <li>Di dashboard app, klik "Add product"</li>
                                                <li>Cari "Instagram Basic Display" → klik "Set Up"</li>
                                            </ul>
                                        </div>
                                        <div>
                                            <p className="font-semibold">Langkah 3: Tambahkan Test User Instagram</p>
                                            <ul className="list-disc list-inside text-slate-600 dark:text-slate-400 mt-1 space-y-1">
                                                <li>Pergi ke "Roles" → "Test Users"</li>
                                                <li>Klik "Add Test Users"</li>
                                                <li>Login dengan akun Instagram yang ingin diconnect</li>
                                            </ul>
                                        </div>
                                        <div>
                                            <p className="font-semibold">Langkah 4: Generate Access Token</p>
                                            <ul className="list-disc list-inside text-slate-600 dark:text-slate-400 mt-1 space-y-1">
                                                <li>Pergi ke <a href="https://developers.facebook.com/tools/explorer/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Graph API Explorer</a></li>
                                                <li>Pilih app yang sudah dibuat</li>
                                                <li>Klik "Get User Access Token"</li>
                                                <li>Pilih permissions: <code className="bg-slate-200 dark:bg-slate-700 px-1 rounded">instagram_basic</code>, <code className="bg-slate-200 dark:bg-slate-700 px-1 rounded">instagram_content_publish</code>, <code className="bg-slate-200 dark:bg-slate-700 px-1 rounded">pages_show_list</code></li>
                                                <li>Klik "Generate Access Token"</li>
                                            </ul>
                                        </div>
                                        <div>
                                            <p className="font-semibold">Langkah 5: Dapatkan Account ID</p>
                                            <ul className="list-disc list-inside text-slate-600 dark:text-slate-400 mt-1 space-y-1">
                                                <li>Gunakan token untuk request: <code className="bg-slate-200 dark:bg-slate-700 px-1 rounded">GET /me/accounts</code></li>
                                                <li>Atau cek di Instagram app → Settings → Account → Linked Accounts</li>
                                                <li>Account ID biasanya dimulai dengan <code className="bg-slate-200 dark:bg-slate-700 px-1 rounded">178414...</code></li>
                                            </ul>
                                        </div>
                                    </div>
                                </details>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsInstagramDialogOpen(false)}>
                                    Batal
                                </Button>
                                <Button 
                                    onClick={handleConnectInstagram}
                                    disabled={isLoadingInstagram || !instagramForm.accessToken || !instagramForm.accountId}
                                >
                                    {isLoadingInstagram && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Hubungkan
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </TabsContent>
            </Tabs>
        </div>
    )
}
