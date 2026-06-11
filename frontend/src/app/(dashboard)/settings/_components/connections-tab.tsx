'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Camera, Loader2 } from 'lucide-react'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import { authClient } from '@/lib/auth-client'
import { useConfirm } from '@/components/ui/confirm-dialog'

type OAuthProvider = 'google' | 'github'

interface LinkedAccount {
    id: string
    providerId: OAuthProvider
}

interface InstagramStatusResponse {
    connected: boolean
    username?: string
    message?: string
}

interface InstagramConnectResponse {
    success: boolean
    message?: string
}

const providers: OAuthProvider[] = ['google', 'github']
const getErrorMessage = (error: unknown, fallback: string) => error instanceof Error ? error.message : fallback

export function ConnectionsTab() {
    const confirm = useConfirm()
    const [accounts, setAccounts] = useState<LinkedAccount[]>([])
    const [isLoadingAccounts, setIsLoadingAccounts] = useState(false)

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
        fetchAccounts()
        fetchInstagramStatus()
    }, [])

    const fetchAccounts = async () => {
        setIsLoadingAccounts(true)
        try {
            const { data } = await authClient.listAccounts()
            setAccounts((data || [])
                .filter((account) => providers.includes(account.providerId as OAuthProvider))
                .map((account) => ({ id: account.id, providerId: account.providerId as OAuthProvider })))
        } catch (error) {
            console.error('Failed to fetch accounts:', error)
        } finally {
            setIsLoadingAccounts(false)
        }
    }

    const fetchInstagramStatus = async () => {
        setIsLoadingInstagram(true)
        try {
            const response = await api.get<InstagramStatusResponse>('/social/instagram/status')
            setInstagramData({
                connected: response.connected,
                username: response.username || '',
                message: response.message || ''
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
            const response = await api.post<InstagramConnectResponse>('/social/instagram/connect', {
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
        } catch (error: unknown) {
            toast.error(getErrorMessage(error, 'Gagal menghubungkan Instagram'))
        } finally {
            setIsLoadingInstagram(false)
        }
    }

    const handleDisconnectInstagram = async () => {
        await confirm({
            title: 'Putuskan Instagram',
            description: 'Apakah Anda yakin ingin memutuskan koneksi Instagram?',
            confirmText: 'Putuskan',
            cancelText: 'Batal',
            variant: 'destructive',
            onConfirm: async () => {
                setIsLoadingInstagram(true)
                try {
                    await api.delete<void>('/social/instagram/disconnect')
                    toast.success('Instagram berhasil diputuskan')
                    fetchInstagramStatus()
                } catch (error: unknown) {
                    toast.error(getErrorMessage(error, 'Gagal memutuskan Instagram'))
                } finally {
                    setIsLoadingInstagram(false)
                }
            },
        })
    }

    const handleLinkAccount = async (provider: 'google' | 'github') => {
        try {
            await authClient.signIn.social({
                provider,
                callbackURL: window.location.href
            })
        } catch (error: unknown) {
            toast.error(`Gagal menghubungkan ${provider}: ${getErrorMessage(error, 'Unknown error')}`)
        }
    }

    const handleUnlinkAccount = async (id: string, providerId: string) => {
        await confirm({
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
                } catch (error: unknown) {
                    toast.error(`Gagal memutuskan hubungan: ${getErrorMessage(error, 'Unknown error')}`)
                }
            },
        })
    }

    return (
        <>
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
                        providers.map((providerName) => {
                            const providerAccount = accounts.find(a => a.providerId === providerName)
                            const isConnected = !!providerAccount

                            return (
                                <div key={providerName} className="flex items-center justify-between p-4 rounded-2xl border bg-slate-50/50 dark:bg-slate-800/20">
                                    <div className="flex items-center gap-4">
                                        <div className={`flex h-12 w-12 items-center justify-center rounded-xl font-black text-xl shadow-sm border ${providerName === 'google' ? 'bg-white text-blue-600 border-blue-50' : 'bg-slate-900 text-white border-slate-700'}`}>
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
                                            onClick={() => handleLinkAccount(providerName)}
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
                                        <li>Klik &quot;My Apps&quot; → &quot;Create App&quot;</li>
                                        <li>Pilih &quot;Other&quot; → &quot;Consumer&quot;</li>
                                        <li>Isi nama app dan email developer</li>
                                    </ul>
                                </div>
                                <div>
                                    <p className="font-semibold">Langkah 2: Tambahkan Instagram Basic Display</p>
                                    <ul className="list-disc list-inside text-slate-600 dark:text-slate-400 mt-1 space-y-1">
                                        <li>Di dashboard app, klik &quot;Add product&quot;</li>
                                        <li>Cari &quot;Instagram Basic Display&quot; → klik &quot;Set Up&quot;</li>
                                    </ul>
                                </div>
                                <div>
                                    <p className="font-semibold">Langkah 3: Tambahkan Test User Instagram</p>
                                    <ul className="list-disc list-inside text-slate-600 dark:text-slate-400 mt-1 space-y-1">
                                        <li>Pergi ke &quot;Roles&quot; → &quot;Test Users&quot;</li>
                                        <li>Klik &quot;Add Test Users&quot;</li>
                                        <li>Login dengan akun Instagram yang ingin diconnect</li>
                                    </ul>
                                </div>
                                <div>
                                    <p className="font-semibold">Langkah 4: Generate Access Token</p>
                                    <ul className="list-disc list-inside text-slate-600 dark:text-slate-400 mt-1 space-y-1">
                                        <li>Pergi ke <a href="https://developers.facebook.com/tools/explorer/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Graph API Explorer</a></li>
                                        <li>Pilih app yang sudah dibuat</li>
                                        <li>Klik &quot;Get User Access Token&quot;</li>
                                        <li>Pilih permissions: <code className="bg-slate-200 dark:bg-slate-700 px-1 rounded">instagram_basic</code>, <code className="bg-slate-200 dark:bg-slate-700 px-1 rounded">instagram_content_publish</code>, <code className="bg-slate-200 dark:bg-slate-700 px-1 rounded">pages_show_list</code></li>
                                        <li>Klik &quot;Generate Access Token&quot;</li>
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
        </>
    )
}
