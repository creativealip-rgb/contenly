'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, Filter, Instagram, Twitter, Linkedin, Globe, MoreHorizontal, Edit2, Trash2, CheckCircle2 } from 'lucide-react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek, isToday, parseISO } from 'date-fns'
import { id } from 'date-fns/locale'
import { motion, AnimatePresence } from 'framer-motion'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import {
    DndContext,
    DragOverlay,
    useDraggable,
    useDroppable,
    DragEndEvent,
    DragStartEvent,
    defaultDropAnimationSideEffects,
} from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface ScheduledContent {
    id: string
    title: string
    contentType: 'article' | 'carousel' | 'video_script'
    platform: 'wordpress' | 'instagram' | 'linkedin' | 'twitter'
    scheduledAt: string
    status: 'pending' | 'published' | 'failed'
    contentId?: string
    metadata?: Record<string, any>
}

interface CalendarStats {
    thisMonth: number
    lastMonth: number
    totalPublished: number
    totalPending: number
}

const platformIcons = {
    wordpress: Globe,
    instagram: Instagram,
    linkedin: Linkedin,
    twitter: Twitter,
}

const platformColors = {
    wordpress: 'bg-blue-500/10 text-blue-600 border-blue-200',
    instagram: 'bg-pink-500/10 text-pink-600 border-pink-200',
    linkedin: 'bg-sky-500/10 text-sky-600 border-sky-200',
    twitter: 'bg-slate-500/10 text-slate-600 border-slate-200',
}

const contentTypeLabels = {
    article: 'Artikel',
    carousel: 'Carousel',
    video_script: 'Video Script',
}

const statusColors = {
    pending: 'bg-amber-500',
    published: 'bg-green-500',
    failed: 'bg-red-500',
}

function DraggableEvent({ event, onEdit, onDelete, onPublish }: { 
    event: ScheduledContent
    onEdit: (event: ScheduledContent) => void
    onDelete: (id: string) => void
    onPublish: (id: string) => void
}) {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: event.id,
        data: event,
    })

    const style = transform ? {
        transform: CSS.Translate.toString(transform),
    } : undefined

    const PlatformIcon = platformIcons[event.platform]

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...listeners}
            {...attributes}
            className={`group relative p-2 mb-1 rounded-lg border cursor-move transition-all hover:shadow-md ${
                isDragging ? 'opacity-50' : 'opacity-100'
            } ${platformColors[event.platform]}`}
        >
            <div className="flex items-center gap-1.5">
                <div className={`w-1.5 h-1.5 rounded-full ${statusColors[event.status]}`} />
                <PlatformIcon className="w-3 h-3" />
                <span className="text-xs font-medium truncate flex-1">{event.title}</span>
            </div>
            <div className="text-[10px] text-muted-foreground mt-0.5">
                {contentTypeLabels[event.contentType]}
            </div>
            
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-0.5 right-0.5 h-5 w-5 opacity-0 group-hover:opacity-100"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <MoreHorizontal className="h-3 w-3" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEdit(event)}>
                        <Edit2 className="h-4 w-4 mr-2" />
                        Edit
                    </DropdownMenuItem>
                    {event.status === 'pending' && (
                        <DropdownMenuItem onClick={() => onPublish(event.id)}>
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                            Mark Published
                        </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={() => onDelete(event.id)} className="text-red-600">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    )
}

function DroppableDay({ date, children, isOver }: { date: Date; children: React.ReactNode; isOver: boolean }) {
    const { setNodeRef } = useDroppable({
        id: format(date, 'yyyy-MM-dd'),
        data: { date },
    })

    return (
        <div
            ref={setNodeRef}
            className={`min-h-[100px] p-2 transition-colors rounded-lg ${
                isOver ? 'bg-blue-50 dark:bg-blue-950/30 border-2 border-blue-400 border-dashed' : ''
            }`}
        >
            {children}
        </div>
    )
}

export default function CalendarPage() {
    const [currentDate, setCurrentDate] = useState(new Date())
    const [events, setEvents] = useState<ScheduledContent[]>([])
    const [stats, setStats] = useState<CalendarStats | null>(null)
    const [loading, setLoading] = useState(true)
    const [activeDragEvent, setActiveDragEvent] = useState<ScheduledContent | null>(null)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingEvent, setEditingEvent] = useState<ScheduledContent | null>(null)
    const [platformFilter, setPlatformFilter] = useState<string>('all')
    const [isOver, setIsOver] = useState<string | null>(null)

    const [formData, setFormData] = useState<{
        title: string
        contentType: 'article' | 'carousel' | 'video_script'
        platform: 'wordpress' | 'instagram' | 'linkedin' | 'twitter'
        scheduledAt: string
    }>({
        title: '',
        contentType: 'article',
        platform: 'wordpress',
        scheduledAt: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    })

    const monthStart = startOfMonth(currentDate)
    const monthEnd = endOfMonth(currentDate)
    const calendarStart = startOfWeek(monthStart)
    const calendarEnd = endOfWeek(monthEnd)
    const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd })

    const filteredEvents = useMemo(() => {
        if (platformFilter === 'all') return events
        return events.filter(e => e.platform === platformFilter)
    }, [events, platformFilter])

    const eventsByDate = useMemo(() => {
        const grouped: Record<string, ScheduledContent[]> = {}
        filteredEvents.forEach(event => {
            const dateKey = format(parseISO(event.scheduledAt), 'yyyy-MM-dd')
            if (!grouped[dateKey]) grouped[dateKey] = []
            grouped[dateKey].push(event)
        })
        return grouped
    }, [filteredEvents])

    useEffect(() => {
        fetchData()
    }, [currentDate])

    const fetchData = async () => {
        try {
            setLoading(true)
            const year = currentDate.getFullYear()
            const month = currentDate.getMonth() + 1
            
            const [eventsData, statsData] = await Promise.all([
                api.get<ScheduledContent[]>(`/calendar/month/${year}/${month}`),
                api.get<CalendarStats>('/calendar/stats'),
            ])
            
            setEvents(eventsData)
            setStats(statsData)
        } catch (error) {
            toast.error('Failed to fetch calendar data')
        } finally {
            setLoading(false)
        }
    }

    const handlePrevMonth = () => setCurrentDate(subMonths(currentDate, 1))
    const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1))
    const handleToday = () => setCurrentDate(new Date())

    const handleDragStart = (event: DragStartEvent) => {
        setActiveDragEvent(event.active.data.current as ScheduledContent)
    }

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event
        setActiveDragEvent(null)
        setIsOver(null)

        if (!over) return

        const draggedEvent = active.data.current as ScheduledContent
        const newDate = over.data.current?.date as Date

        if (!newDate || !draggedEvent) return

        const newScheduledAt = new Date(newDate)
        const oldDate = parseISO(draggedEvent.scheduledAt)
        newScheduledAt.setHours(oldDate.getHours(), oldDate.getMinutes())

        try {
            await api.patch(`/calendar/${draggedEvent.id}`, {
                scheduledAt: newScheduledAt.toISOString(),
            })
            toast.success('Content rescheduled')
            fetchData()
        } catch (error) {
            toast.error('Failed to reschedule content')
        }
    }

    const handleCreate = async () => {
        try {
            await api.post('/calendar', {
                ...formData,
                scheduledAt: new Date(formData.scheduledAt).toISOString(),
            })
            toast.success('Content scheduled')
            setIsModalOpen(false)
            resetForm()
            fetchData()
        } catch (error) {
            toast.error('Failed to schedule content')
        }
    }

    const handleUpdate = async () => {
        if (!editingEvent) return
        
        try {
            await api.patch(`/calendar/${editingEvent.id}`, {
                ...formData,
                scheduledAt: new Date(formData.scheduledAt).toISOString(),
            })
            toast.success('Content updated')
            setIsModalOpen(false)
            setEditingEvent(null)
            resetForm()
            fetchData()
        } catch (error) {
            toast.error('Failed to update content')
        }
    }

    const handleDelete = async (id: string) => {
        try {
            await api.delete(`/calendar/${id}`)
            toast.success('Content deleted')
            fetchData()
        } catch (error) {
            toast.error('Failed to delete content')
        }
    }

    const handlePublish = async (id: string) => {
        try {
            await api.post(`/calendar/${id}/publish`)
            toast.success('Content marked as published')
            fetchData()
        } catch (error) {
            toast.error('Failed to update status')
        }
    }

    const openCreateModal = (date?: Date) => {
        setEditingEvent(null)
        setFormData({
            title: '',
            contentType: 'article',
            platform: 'wordpress',
            scheduledAt: date 
                ? format(date, "yyyy-MM-dd'T'HH:mm")
                : format(new Date(), "yyyy-MM-dd'T'HH:mm"),
        })
        setIsModalOpen(true)
    }

    const openEditModal = (event: ScheduledContent) => {
        setEditingEvent(event)
        setFormData({
            title: event.title,
            contentType: event.contentType,
            platform: event.platform,
            scheduledAt: format(parseISO(event.scheduledAt), "yyyy-MM-dd'T'HH:mm"),
        })
        setIsModalOpen(true)
    }

    const resetForm = () => {
        setFormData({
            title: '',
            contentType: 'article',
            platform: 'wordpress',
            scheduledAt: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
        })
    }

    const weekDays = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']

    return (
        <DndContext
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragOver={(e) => setIsOver(e.over?.id as string)}
        >
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                        <h1 className="text-4xl font-black tracking-tighter bg-gradient-to-r from-slate-900 to-slate-500 dark:from-white dark:to-slate-400 bg-clip-text text-transparent">
                            Kalender Konten
                        </h1>
                        <p className="text-slate-500 font-medium">
                            Jadwalkan dan kelola konten Anda.
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" onClick={handleToday}>
                            Hari Ini
                        </Button>
                        <div className="flex items-center gap-1 border rounded-lg p-1">
                            <Button variant="ghost" size="icon" onClick={handlePrevMonth}>
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <span className="px-4 font-semibold min-w-[140px] text-center">
                                {format(currentDate, 'MMMM yyyy', { locale: id })}
                            </span>
                            <Button variant="ghost" size="icon" onClick={handleNextMonth}>
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                        <Button onClick={() => openCreateModal()}>
                            <Plus className="h-4 w-4 mr-2" />
                            Jadwalkan
                        </Button>
                    </div>
                </div>

                {/* Stats */}
                {stats && (
                    <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
                        <Card className="glass border-2 border-white/60 dark:border-white/20 overflow-hidden hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-none transition-all duration-500 rounded-3xl">
                            <CardContent className="pt-6">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                                        <CalendarIcon className="h-5 w-5 text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold">{stats.thisMonth}</p>
                                        <p className="text-xs text-muted-foreground">Bulan Ini</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="glass border-2 border-white/60 dark:border-white/20 overflow-hidden hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-none transition-all duration-500 rounded-3xl">
                            <CardContent className="pt-6">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
                                        <CheckCircle2 className="h-5 w-5 text-amber-600" />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold">{stats.totalPending}</p>
                                        <p className="text-xs text-muted-foreground">Menunggu</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="glass border-2 border-white/60 dark:border-white/20 overflow-hidden hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-none transition-all duration-500 rounded-3xl">
                            <CardContent className="pt-6">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
                                        <Globe className="h-5 w-5 text-green-600" />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold">{stats.totalPublished}</p>
                                        <p className="text-xs text-muted-foreground">Dipublikasikan</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="glass border-2 border-white/60 dark:border-white/20 overflow-hidden hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-none transition-all duration-500 rounded-3xl">
                            <CardContent className="pt-6">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10">
                                        <Filter className="h-5 w-5 text-purple-600" />
                                    </div>
                                    <Select value={platformFilter} onValueChange={setPlatformFilter}>
                                        <SelectTrigger className="w-[120px] border-0 bg-transparent p-0 h-auto focus:ring-0">
                                            <SelectValue placeholder="Filter" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Semua</SelectItem>
                                            <SelectItem value="wordpress">WordPress</SelectItem>
                                            <SelectItem value="instagram">Instagram</SelectItem>
                                            <SelectItem value="linkedin">LinkedIn</SelectItem>
                                            <SelectItem value="twitter">Twitter</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Calendar */}
                <Card className="glass border-2 border-white/60 dark:border-white/20 overflow-hidden rounded-3xl">
                    <CardContent className="p-0">
                        {/* Week Days Header */}
                        <div className="grid grid-cols-7 border-b">
                            {weekDays.map(day => (
                                <div key={day} className="py-3 text-center text-sm font-semibold text-muted-foreground">
                                    {day}
                                </div>
                            ))}
                        </div>

                        {/* Calendar Grid */}
                        <div className="grid grid-cols-7">
                            {days.map((day, index) => {
                                const dateKey = format(day, 'yyyy-MM-dd')
                                const dayEvents = eventsByDate[dateKey] || []
                                const isCurrentMonth = isSameMonth(day, currentDate)
                                const isTodayDate = isToday(day)
                                const isDropOver = isOver === dateKey

                                return (
                                    <DroppableDay key={dateKey} date={day} isOver={isDropOver}>
                                        <div
                                            className={`h-full min-h-[80px] sm:min-h-[120px] border-b border-r p-1.5 sm:p-2 transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-800/50 cursor-pointer ${
                                                !isCurrentMonth ? 'bg-slate-50/30 dark:bg-slate-900/30' : ''
                                            }`}
                                            onClick={() => openCreateModal(day)}
                                        >
                                            <div className="flex items-center justify-between mb-2">
                                                <span
                                                    className={`text-xs sm:text-sm font-medium w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center rounded-full ${
                                                        isTodayDate
                                                            ? 'bg-blue-600 text-white'
                                                            : isCurrentMonth
                                                            ? 'text-slate-700 dark:text-slate-200'
                                                            : 'text-slate-400'
                                                    }`}
                                                >
                                                    {format(day, 'd')}
                                                </span>
                                                {dayEvents.length > 0 && (
                                                    <Badge variant="secondary" className="text-xs">
                                                        {dayEvents.length}
                                                    </Badge>
                                                )}
                                            </div>
                                            <AnimatePresence>
                                                {dayEvents.map(event => (
                                                    <motion.div
                                                        key={event.id}
                                                        initial={{ opacity: 0, y: -10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        exit={{ opacity: 0, scale: 0.9 }}
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        <DraggableEvent
                                                            event={event}
                                                            onEdit={openEditModal}
                                                            onDelete={handleDelete}
                                                            onPublish={handlePublish}
                                                        />
                                                    </motion.div>
                                                ))}
                                            </AnimatePresence>
                                        </div>
                                    </DroppableDay>
                                )
                            })}
                        </div>
                    </CardContent>
                </Card>

                {/* Create/Edit Modal */}
                <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                    <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                            <DialogTitle>
                                {editingEvent ? 'Edit Jadwal' : 'Jadwalkan Konten'}
                            </DialogTitle>
                            <DialogDescription>
                                {editingEvent 
                                    ? 'Perbarui detail konten yang dijadwalkan.' 
                                    : 'Tambahkan konten baru ke kalender.'}
                            </DialogDescription>
                        </DialogHeader>
                        
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="title">Judul</Label>
                                <Input
                                    id="title"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    placeholder="Masukkan judul konten"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="contentType">Tipe Konten</Label>
                                    <Select
                                        value={formData.contentType}
                                        onValueChange={(v) => setFormData({ ...formData, contentType: v as any })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="article">Artikel</SelectItem>
                                            <SelectItem value="carousel">Carousel</SelectItem>
                                            <SelectItem value="video_script">Video Script</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="platform">Platform</Label>
                                    <Select
                                        value={formData.platform}
                                        onValueChange={(v) => setFormData({ ...formData, platform: v as any })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="wordpress">WordPress</SelectItem>
                                            <SelectItem value="instagram">Instagram</SelectItem>
                                            <SelectItem value="linkedin">LinkedIn</SelectItem>
                                            <SelectItem value="twitter">Twitter</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="scheduledAt">Waktu Publish</Label>
                                <Input
                                    id="scheduledAt"
                                    type="datetime-local"
                                    value={formData.scheduledAt}
                                    onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
                                />
                            </div>
                        </div>

                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                                Batal
                            </Button>
                            <Button onClick={editingEvent ? handleUpdate : handleCreate}>
                                {editingEvent ? 'Simpan Perubahan' : 'Jadwalkan'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Drag Overlay */}
                <DragOverlay dropAnimation={{
                    sideEffects: defaultDropAnimationSideEffects({
                        styles: {
                            active: {
                                opacity: '0.5',
                            },
                        },
                    }),
                }}>
                    {activeDragEvent ? (
                        <div className={`p-2 rounded-lg border shadow-lg ${platformColors[activeDragEvent.platform]}`}>
                            <div className="flex items-center gap-1.5">
                                {(() => {
                                    const PlatformIcon = platformIcons[activeDragEvent.platform]
                                    return <PlatformIcon className="w-3 h-3" />
                                })()}
                                <span className="text-xs font-medium">{activeDragEvent.title}</span>
                            </div>
                        </div>
                    ) : null}
                </DragOverlay>
            </div>
        </DndContext>
    )
}
