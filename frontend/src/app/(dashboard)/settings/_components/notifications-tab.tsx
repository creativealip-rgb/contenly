'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { api } from '@/lib/api'
import { toast } from 'sonner'

interface NotificationsTabProps {
    preferences: Record<string, boolean>
    setPreferences: React.Dispatch<React.SetStateAction<Record<string, boolean>>>
}

export function NotificationsTab({ preferences, setPreferences }: NotificationsTabProps) {
    const handlePreferenceToggle = async (key: string) => {
        const newPrefs = { ...preferences, [key]: !preferences[key] }
        setPreferences(newPrefs)
        try {
            await api.patch('/users/me/preferences', newPrefs)
            toast.success('Preferensi disimpan')
        } catch {
            toast.error('Gagal menyimpan preferensi')
        }
    }

    const items = [
        { id: 'article_published', label: 'Artikel Diterbitkan', description: 'Ketika sebuah artikel berhasil diterbitkan ke WordPress' },
        { id: 'low_token', label: 'Saldo Token Rendah', description: 'Ketika saldo token Anda kurang dari 10' },
        { id: 'rss_error', label: 'Kesalahan Umpan RSS', description: 'Ketika terjadi masalah saat melakukan polling pada umpan Anda' },
        { id: 'weekly_digest', label: 'Ringkasan Mingguan', description: 'Laporan mingguan tentang performa konten Anda' },
    ]

    return (
        <Card className="glass border-2 border-white/60 dark:border-white/20 overflow-hidden hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-none transition-all duration-500 rounded-3xl">
            <CardHeader>
                <CardTitle>Preferensi Notifikasi</CardTitle>
                <CardDescription>
                    Pilih bagaimana Anda ingin diberi tahu.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-4">
                    {items.map((item) => (
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
    )
}
