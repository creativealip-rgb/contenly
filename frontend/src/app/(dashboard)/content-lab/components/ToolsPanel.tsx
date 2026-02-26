'use client'

import { Separator } from '@/components/ui/separator'
import { motion } from 'framer-motion'
import { ContentLabState, ContentLabHandlers } from './types'
import { AIConfigSection } from './sections/AIConfigSection'
import { SEOSection } from './sections/SEOSection'
import { PublishingSection } from './sections/PublishingSection'

interface ToolsPanelProps {
    state: ContentLabState;
    handlers: ContentLabHandlers;
    isRefreshingSEO: boolean;
    handleRefreshSEO: () => void;
    handlePublishNow: (status: 'draft' | 'publish') => void;
    isPublishing: boolean;
    isScheduleOpen: boolean;
    setIsScheduleOpen: (val: boolean) => void;
    scheduleDate: string;
    setScheduleDate: (val: string) => void;
    scheduleTime: string;
    setScheduleTime: (val: string) => void;
    handleSchedulePublish: () => void;
    isGeneratingImage: boolean;
    handleGenerateImage: () => void;
}

export function ToolsPanel({
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
    handleGenerateImage
}: ToolsPanelProps) {
    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-8"
        >
            <AIConfigSection
                wpCategories={state.wpCategories}
                selectedCategory={state.selectedCategory}
                setSelectedCategory={handlers.setSelectedCategory}
                isFetchingCategories={state.isFetchingCategories}
                isRewriting={state.isRewriting}
                onRewrite={handlers.handleAIRewrite}
            />

            <Separator className="opacity-50" />

            <SEOSection
                isRefreshingSEO={isRefreshingSEO}
                onRefreshSEO={handleRefreshSEO}
                isGeneratingImage={isGeneratingImage}
                onGenerateImage={handleGenerateImage}
            />

            <Separator className="opacity-50" />

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
        </motion.div>
    )
}
