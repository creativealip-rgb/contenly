'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { authClient } from '@/lib/auth-client'

export function SecurityTab() {
    const [showCurrentPassword, setShowCurrentPassword] = useState(false)
    const [showNewPassword, setShowNewPassword] = useState(false)
    const [isUpdatingPassword, setIsUpdatingPassword] = useState(false)
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    })

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
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
        } catch (error: unknown) {
            toast.error(error instanceof Error ? error.message : 'Gagal memperbarui kata sandi')
        } finally {
            setIsUpdatingPassword(false)
        }
    }

    return (
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
    )
}
