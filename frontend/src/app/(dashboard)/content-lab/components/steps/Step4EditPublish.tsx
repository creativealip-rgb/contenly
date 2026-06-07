'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, ChevronDown, ChevronUp } from 'lucide-react'
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
    const [seoOpen, setSeoOpen] = useState(false)
    const [publishOpen, setPublishOpen] = useState(false)

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
            className="flex flex-col h-full"
        >
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {/* Full-width editor */}
                <div className="glass border-2 border-white/60 dark:border-white/20 rounded-3xl p-6 lg:p-8 mb-4 shadow-xl">
                    <ContentEditor state={state} handlers={handlers} copied={copied} handleCopy={handleCopy} />
                </div>

                {/* SEO Collapsible */}
                <div className="glass border-2 border-white/60 dark:border-white/20 rounded-2xl mb-4 overflow-hidden">
                    <button
                        onClick={() => setSeoOpen(!seoOpen)}
                        className="w-full flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                    >
                        <span className="font-bold text-sm">🔧 SEO Settings</span>
                        {seoOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                    {seoOpen && (
                        <div className="px-4 pb-4 border-t border-slate-100 dark:border-slate-800">
                            <SEOSection
                                isRefreshingSEO={isRefreshingSEO}
                                onRefreshSEO={handleRefreshSEO}
                                isGeneratingImage={isGeneratingImage}
                                onGenerateImage={handleGenerateImage}
                            />
                        </div>
                    )}
                </div>

                {/* Publish Collapsible */}
                <div className="glass border-2 border-white/60 dark:border-white/20 rounded-2xl overflow-hidden">
                    <button
                        onClick={() => setPublishOpen(!publishOpen)}
                        className="w-full flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                    >
                        <span className="font-bold text-sm">🚀 Publish</span>
                        {publishOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                    {publishOpen && (
                        <div className="px-4 pb-4 border-t border-slate-100 dark:border-slate-800">
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
                        </div>
                    )}
                </div>
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800 mt-4 flex-shrink-0">
                <Button
                    variant="ghost"
                    onClick={() => setCurrentStep(3)}
                    className="gap-2 text-slate-500"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Kembali
                </Button>
                <div />
            </div>
        </motion.div>
    )
}
