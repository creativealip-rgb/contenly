'use client'

import { motion } from 'framer-motion'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useContentLabStore } from '@/stores/content-lab-store'
import { ContentLabState, ContentLabHandlers } from '../types'
import { RSSFeedSection } from '../sections/RSSFeedSection'
import { URLScrapeSection } from '../sections/URLScrapeSection'
import { ArticleIdeaSection } from '../sections/ArticleIdeaSection'

interface Step2ArticleProps {
    state: ContentLabState
    handlers: ContentLabHandlers
}

export function Step2Article({ state, handlers }: Step2ArticleProps) {
    const {
        sourceType,
        currentStep,
        setCurrentStep,
        selectedArticle,
        sourceContent,
        articleIdea,
        maxReachedStep,
        setMaxReachedStep,
    } = useContentLabStore()

    const canProceed = sourceType === 'feed'
        ? selectedArticle !== null
        : sourceType === 'url'
        ? sourceContent.trim().length > 0
        : articleIdea.trim().length > 0

    const handleNext = () => {
        if (canProceed) {
            setCurrentStep(3)
            if (maxReachedStep < 3) setMaxReachedStep(3)
        }
    }

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex flex-col h-full"
        >
            <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
                {sourceType === 'feed' && (
                    <RSSFeedSection state={state} handlers={handlers} />
                )}
                {sourceType === 'url' && (
                    <URLScrapeSection isScraping={state.isScraping} onScrape={handlers.handleScrape} />
                )}
                {sourceType === 'idea' && (
                    <ArticleIdeaSection />
                )}
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800 mt-4">
                <Button
                    variant="ghost"
                    onClick={() => setCurrentStep(1)}
                    className="gap-2 text-slate-500"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Kembali
                </Button>
                <Button
                    onClick={handleNext}
                    disabled={!canProceed}
                    className="gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 rounded-xl px-8 font-bold"
                >
                    Lanjut
                    <ArrowRight className="w-4 h-4" />
                </Button>
            </div>
        </motion.div>
    )
}
