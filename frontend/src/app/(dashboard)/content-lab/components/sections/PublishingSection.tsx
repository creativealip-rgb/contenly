'use client'

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
} from '@/components/ui/dialog'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Calendar, Check, Loader2, ExternalLink } from 'lucide-react'
import { useContentLabStore } from '@/stores/content-lab-store'

interface PublishingSectionProps {
    handlePublishNow: (status: 'draft' | 'publish') => void;
    isPublishing: boolean;
    isScheduleOpen: boolean;
    setIsScheduleOpen: (val: boolean) => void;
    scheduleDate: string;
    setScheduleDate: (val: string) => void;
    scheduleTime: string;
    setScheduleTime: (val: string) => void;
    handleSchedulePublish: () => void;
}

export function PublishingSection({
    handlePublishNow,
    isPublishing,
    isScheduleOpen,
    setIsScheduleOpen,
    scheduleDate,
    setScheduleDate,
    scheduleTime,
    setScheduleTime,
    handleSchedulePublish
}: PublishingSectionProps) {
    const { publishResult, generatedContent } = useContentLabStore()

    return (
        <div className="space-y-4 pt-2">
            <AnimatePresence>
                {publishResult && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className={`p-4 rounded-2xl text-xs flex flex-col gap-2 ${publishResult.success ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100'}`}
                    >
                        <div className="flex items-center gap-2">
                            {publishResult.success ? <Check className="h-4 w-4" /> : <Loader2 className="h-4 w-4 animate-spin font-bold" />}
                            <span className="font-bold">{publishResult.message}</span>
                        </div>
                        {publishResult.link && (
                            <a href={publishResult.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center font-black uppercase tracking-tighter underline hover:text-emerald-900 mt-1">
                                Lihat Postingan <ExternalLink className="h-3 w-3 ml-1" />
                            </a>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="grid grid-cols-2 gap-3">
                <Button
                    variant="outline"
                    className="w-full h-11 border-slate-200 hover:bg-slate-50 text-slate-600 font-bold rounded-xl"
                    onClick={() => handlePublishNow('draft')}
                    disabled={!generatedContent || isPublishing}
                >
                    {isPublishing ? <Loader2 className="h-4 w-4 animate-spin" /> : "Draft"}
                </Button>
                <Button
                    className="w-full h-11 bg-slate-900 hover:bg-black text-white font-black uppercase tracking-widest text-xs rounded-xl shadow-lg shadow-slate-200 dark:shadow-none"
                    onClick={() => handlePublishNow('publish')}
                    disabled={!generatedContent || isPublishing}
                >
                    {isPublishing ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Send className="h-3.5 w-3.5 mr-2" /> Publish</>}
                </Button>
            </div>

            <Button
                variant="ghost"
                className="w-full h-10 text-xs font-bold text-slate-400 hover:text-blue-600 rounded-xl"
                onClick={() => setIsScheduleOpen(true)}
            >
                <Calendar className="h-4 w-4 mr-2" /> Jadwalkan Postingan
            </Button>

            <Dialog open={isScheduleOpen} onOpenChange={setIsScheduleOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Jadwal Publikasi</DialogTitle>
                        <DialogDescription>Tentukan tanggal dan waktu untuk mempublikasikan artikel ini.</DialogDescription>
                    </DialogHeader>
                    <div className="grid grid-cols-2 gap-4 py-6">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Tanggal</Label>
                            <Input type="date" value={scheduleDate} onChange={(e) => setScheduleDate(e.target.value)} className="h-11 rounded-xl bg-white/50" />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Waktu</Label>
                            <Input type="time" value={scheduleTime} onChange={(e) => setScheduleTime(e.target.value)} className="h-11 rounded-xl bg-white/50" />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsScheduleOpen(false)}>Batal</Button>
                        <Button onClick={handleSchedulePublish} disabled={!scheduleDate || !scheduleTime || isPublishing} className="bg-blue-600 font-bold rounded-xl h-11 px-8">
                            Konfirmasi Jadwal
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
