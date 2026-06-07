'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, ChevronDown, ChevronUp, Settings, Send, Image as ImageIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ContentLabState, ContentLabHandlers } from '../types'
import { ContentEditor } from '../ContentEditor'
import { SEOSection } from '../sections/SEOSection'
import { PublishingSection } from '../sections/PublishingSection'
import { useContentLabStore } from '@/stores/content-lab-store'
import NextImage from 'next/image'
import { Loader2, Sparkles, Trash2 } from 'lucide-react'

interface Step4EditPublishProps {
    state: ContentLabState
    handlers: ContentLabHandlers
    isRefreshingSEO: boolean
    handleRefreshSEO: () => void
    handlePublishNow: (status: 'draft' | 'publish') => void
    isPublishing: boolean
    isScheduleOpen: boolean
    setIsScheduleOpen: (val: boolean) => void
    scheduleDate: string
    setScheduleDate: (val: string) => void
    scheduleTime: string
    setScheduleTime: (val: string) => void
    handleSchedulePublish: () => void
    isGeneratingImage: boolean
    handleGenerateImage: () => void
}

function SidebarPanel({ title, icon: Icon, children, defaultOpen = false }: {
    title: string
    icon: React.ElementType
    children: React.ReactNode
    defaultOpen?: boolean
}) {
    const [open, setOpen] = useState(defaultOpen)
    return (
        <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
            <button
                onClick={() => setOpen(!open)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors text-left"
            >
                <Icon className="w-4 h-4 text-slate-400" />
                <span className="text-sm font-semibold flex-1">{title}</span>
                {open ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </button>
            {open && (
                <div className="px-4 pb-4 border-t border-slate-100 dark:border-slate-800 pt-3">
                    {children}
                </div>
            )}
        </div>
    )
}

function ThumbnailPanel({ isGeneratingImage, handleGenerateImage }: { isGeneratingImage: boolean; handleGenerateImage: () => void }) {
    const { featuredImage, setFeaturedImage, generatedTitle } = useContentLabStore()

    return (
        <div className="space-y-3">
            <div className="relative group rounded-xl overflow-hidden aspect-[16/9] border-2 border-dashed border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center transition-all hover:border-slate-300">
                {featuredImage ? (
                    <>
                        <NextImage src={featuredImage} alt="Featured" fill className="object-cover" unoptimized />
                        <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-sm">
                            <Button variant="secondary" size="sm" className="h-8 text-[10px] font-bold rounded-lg" onClick={() => document.getElementById('image-input-step4')?.click()}>
                                Ganti
                            </Button>
                            <Button variant="destructive" size="sm" className="h-8 w-8 p-0 rounded-lg" onClick={() => setFeaturedImage('')}>
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col items-center gap-2 p-4">
                        <div className="p-3 bg-white dark:bg-slate-700 text-blue-600 rounded-full shadow-sm border border-slate-100 dark:border-slate-600">
                            <ImageIcon className="h-5 w-5" />
                        </div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Gambar Utama</p>
                        {generatedTitle && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 text-[10px] font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg px-3"
                                onClick={(e) => { e.stopPropagation(); handleGenerateImage(); }}
                                disabled={isGeneratingImage}
                            >
                                {isGeneratingImage ? (
                                    <Loader2 className="h-3 w-3 animate-spin mr-1" />
                                ) : (
                                    <Sparkles className="h-3 w-3 mr-1" />
                                )}
                                Generate AI (2T)
                            </Button>
                        )}
                    </div>
                )}
            </div>
            <input id="image-input-step4" type="file" className="hidden" accept="image/*" onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) {
                    const reader = new FileReader()
                    reader.onloadend = () => setFeaturedImage(reader.result as string)
                    reader.readAsDataURL(file)
                }
            }} />
            {featuredImage && (
                <p className="text-[10px] text-slate-400 text-center">Klik gambar untuk ganti atau hapus</p>
            )}
        </div>
    )
}

export function Step4EditPublish({
    state,
    handlers,
    isRefreshingSEO,
    handleRefreshSEO,
    handlePublishNow,
    isPublishing,
    isScheduleOpen,
    setIsScheduleOpen,
    scheduleDate,
    setScheduleDate,
    scheduleTime,
    setScheduleTime,
    handleSchedulePublish,
    isGeneratingImage,
    handleGenerateImage,
}: Step4EditPublishProps) {
    const { setCurrentStep } = useContentLabStore()
    const [copied, setCopied] = useState(false)

    const handleCopy = () => {
        const { generatedContent } = useContentLabStore.getState()
        navigator.clipboard.writeText(generatedContent)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex gap-6 h-full max-h-full"
        >
            {/* Main Editor - Left Side */}
            <div className="flex-1 min-w-0 flex flex-col min-h-0">
                <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
                    <ContentEditor state={state} handlers={handlers} copied={copied} handleCopy={handleCopy} />
                </div>

                {/* Bottom Nav */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800 mt-3 flex-shrink-0">
                    <Button variant="ghost" onClick={() => setCurrentStep(3)} className="gap-2 text-slate-500">
                        <ArrowLeft className="w-4 h-4" />
                        Kembali
                    </Button>
                </div>
            </div>

            {/* Right Sidebar */}
            <div className="w-72 xl:w-80 flex-shrink-0 flex flex-col gap-3 overflow-y-auto custom-scrollbar min-h-0">
                <SidebarPanel title="Thumbnail" icon={ImageIcon} defaultOpen={true}>
                    <ThumbnailPanel isGeneratingImage={isGeneratingImage} handleGenerateImage={handleGenerateImage} />
                </SidebarPanel>

                <SidebarPanel title="SEO Settings" icon={Settings} defaultOpen={false}>
                    <SEOSection
                        isRefreshingSEO={isRefreshingSEO}
                        onRefreshSEO={handleRefreshSEO}
                        isGeneratingImage={isGeneratingImage}
                        onGenerateImage={handleGenerateImage}
                    />
                </SidebarPanel>

                <SidebarPanel title="Publish" icon={Send} defaultOpen={true}>
                    <PublishingSection
                        handlePublishNow={handlePublishNow}
                        isPublishing={isPublishing}
                        isScheduleOpen={isScheduleOpen}
                        setIsScheduleOpen={setIsScheduleOpen}
                        scheduleDate={scheduleDate}
                        setScheduleDate={setScheduleDate}
                        scheduleTime={scheduleTime}
                        setScheduleTime={setScheduleTime}
                        handleSchedulePublish={handleSchedulePublish}
                    />
                </SidebarPanel>
            </div>
        </motion.div>
    )
}
