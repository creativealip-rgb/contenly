'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, ChevronDown, ChevronUp, Settings, Send, Image, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ContentLabState, ContentLabHandlers } from '../types'
import { ContentEditor } from '../ContentEditor'
import { SEOSection } from '../sections/SEOSection'
import { PublishingSection } from '../sections/PublishingSection'
import { useContentLabStore } from '@/stores/content-lab-store'

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
