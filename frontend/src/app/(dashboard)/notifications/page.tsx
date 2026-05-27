'use client'

import { useEffect, useState } from 'react'
import { Bell, Check, CheckCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { motion } from 'framer-motion'

interface Notification {
  id: string
  title: string
  message: string
  type: string
  read: boolean
  createdAt: string
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications')
      if (res.ok) {
        const data = await res.json()
        setNotifications(data)
      }
    } catch {
      toast.error('Gagal memuat notifikasi')
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (id: string) => {
    await fetch(`/api/notifications/${id}/read`, { method: 'PATCH' })
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
  }

  const markAllRead = async () => {
    await fetch('/api/notifications/read-all', { method: 'PATCH' })
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    toast.success('Semua notifikasi ditandai dibaca')
  }

  useEffect(() => {
    fetchNotifications()
  }, [])

  const unreadCount = notifications.filter((n) => !n.read).length

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Notifikasi</h1>
          <p className="text-muted-foreground">
            {unreadCount > 0 ? `${unreadCount} belum dibaca` : 'Semua sudah dibaca'}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={markAllRead}>
            <CheckCheck className="h-4 w-4 mr-2" />
            Tandai Semua Dibaca
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <Card className="glass border-2 border-white/60 dark:border-white/20 overflow-hidden hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-slate-900/30 transition-all duration-300">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Bell className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">Belum ada notifikasi</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {notifications.map((notif) => (
            <Card
              key={notif.id}
              className={`cursor-pointer glass border-2 border-white/60 dark:border-white/20 overflow-hidden hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-slate-900/30 transition-all duration-300 ${!notif.read ? 'border-primary/30 bg-primary/5' : ''}`}
              onClick={() => !notif.read && markAsRead(notif.id)}
            >
              <CardContent className="flex items-start gap-4 py-4">
                <div className={`mt-1 h-2 w-2 rounded-full shrink-0 ${!notif.read ? 'bg-primary' : 'bg-transparent'}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm">{notif.title}</p>
                    <Badge variant="secondary" className="text-[10px]">{notif.type}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{notif.message}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {new Date(notif.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                {!notif.read && (
                  <Button variant="ghost" size="sm" className="shrink-0" onClick={(e) => { e.stopPropagation(); markAsRead(notif.id) }}>
                    <Check className="h-4 w-4" />
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </motion.div>
  )
}
