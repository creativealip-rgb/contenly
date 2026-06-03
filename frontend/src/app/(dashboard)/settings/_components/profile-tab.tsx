'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
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
import { Camera, Loader2 } from 'lucide-react'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import { useAuthStore } from '@/stores/auth-store'

interface ProfileData {
    name: string
    email: string
    bio: string
    image: string
}

interface ProfileTabProps {
    profileData: ProfileData
    setProfileData: React.Dispatch<React.SetStateAction<ProfileData>>
}

export function ProfileTab({ profileData, setProfileData }: ProfileTabProps) {
    const { user, setUser } = useAuthStore()
    const [isSavingProfile, setIsSavingProfile] = useState(false)
    const [isAvatarDialogOpen, setIsAvatarDialogOpen] = useState(false)
    const [avatarUrlInput, setAvatarUrlInput] = useState(user?.avatarUrl || '')

    const handleSaveProfile = async () => {
        setIsSavingProfile(true)
        try {
            const updated = await api.patch<any>('/users/me', {
                name: profileData.name,
                bio: profileData.bio,
                image: profileData.image
            })
            if (user) {
                setUser({ ...user, fullName: updated.name, avatarUrl: updated.image })
            }
            toast.success('Profil berhasil diperbarui')
        } catch (error: any) {
            toast.error(error.message || 'Gagal memperbarui profil')
        } finally {
            setIsSavingProfile(false)
        }
    }

    const handleUpdateAvatar = async () => {
        setIsSavingProfile(true)
        try {
            const updated = await api.patch<any>('/users/me', { image: avatarUrlInput })
            if (user) {
                setUser({ ...user, avatarUrl: updated.image })
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
    )
}
