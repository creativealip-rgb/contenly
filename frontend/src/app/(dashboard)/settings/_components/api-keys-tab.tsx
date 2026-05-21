'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Key, Copy, Trash2, Plus, Loader2, RefreshCw } from 'lucide-react'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import { useConfirm } from '@/components/ui/confirm-dialog'

export function ApiKeysTab() {
    const confirm = useConfirm()
    const [apiKeys, setApiKeys] = useState<any[]>([])
    const [isLoadingKeys, setIsLoadingKeys] = useState(false)
    const [isGeneratingKey, setIsGeneratingKey] = useState(false)
    const [newKeyName, setNewKeyName] = useState('')
    const [isAddKeyOpen, setIsAddKeyOpen] = useState(false)

    useEffect(() => {
        fetchApiKeys()
    }, [])

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
        await confirm({
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

    return (
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
    )
}
