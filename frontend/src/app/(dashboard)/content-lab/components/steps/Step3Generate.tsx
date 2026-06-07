'use client'

import { motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, Sparkles, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useContentLabStore } from '@/stores/content-lab-store'
import { ContentLabState, ContentLabHandlers } from '../types'
import { AIConfigSection } from '../sections/AIConfigSection'

interface Step3GenerateProps {
    state: ContentLabState
    handlers: ContentLabHandlers
}

export function Step3Generate({ state, handlers }: Step3GenerateProps) {
    const {
        currentStep,
        setCurrentStep,
        generatedContent,
        maxReachedStep,
        setMaxReachedStep,
    } = useContentLabStore()

    const hasGenerated = generatedContent.trim().length > 0

    const handleNext = () => {
        if (hasGenerated) {
            setCurrentStep(4)
            if (maxReachedStep < 4) setMaxReachedStep(4)
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
                <div className="max-w-2xl mx-auto">
                    <AIConfigSection
                        wpCategories={state.wpCategories}
                        selectedCategory={state.selectedCategory}
                        setSelectedCategory={handlers.setSelectedCategory}
                        isFetchingCategories={state.isFetchingCategories}
                        isRewriting={state.isRewriting}
                        onRewrite={handlers.handleAIRewrite}
                    />

                    {hasGenerated && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="mt-6 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-center"
                        >
                            <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400">
                                ✅ Konten berhasil di-generate! Klik "Lanjut" untuk edit.
                            </p>
                        </motion.div>
                    )}
                </div>
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800 mt-4">
                <Button
                    variant="ghost"
                    onClick={() => setCurrentStep(2)}
                    className="gap-2 text-slate-500"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Kembali
                </Button>
                <Button
                    onClick={handleNext}
                    disabled={!hasGenerated}
                    className="gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 rounded-xl px-8 font-bold"
                >
                    Lanjut
                    <ArrowRight className="w-4 h-4" />
                </Button>
            </div>
        </motion.div>
    )
}
