'use client'

import { motion } from 'framer-motion'
import { Rss, Link, Lightbulb } from 'lucide-react'
import { useContentLabStore } from '@/stores/content-lab-store'

const sources = [
    {
        type: 'feed' as const,
        icon: Rss,
        title: 'RSS Feed',
        desc: 'Pilih dari feed RSS yang sudah terhubung',
        color: 'from-orange-500 to-amber-500',
        bg: 'bg-orange-50 dark:bg-orange-900/20',
        iconBg: 'bg-orange-100 text-orange-600 dark:bg-orange-900/40 dark:text-orange-400',
    },
    {
        type: 'url' as const,
        icon: Link,
        title: 'URL Website',
        desc: 'Scrape konten dari halaman web',
        color: 'from-blue-500 to-cyan-500',
        bg: 'bg-blue-50 dark:bg-blue-900/20',
        iconBg: 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400',
    },
    {
        type: 'idea' as const,
        icon: Lightbulb,
        title: 'Tulis Ide',
        desc: 'Mulai dari ide atau topik sendiri',
        color: 'from-purple-500 to-pink-500',
        bg: 'bg-purple-50 dark:bg-purple-900/20',
        iconBg: 'bg-purple-100 text-purple-600 dark:bg-purple-900/40 dark:text-purple-400',
    },
]

export function Step1Source() {
    const { sourceType, setSourceType, setCurrentStep, maxReachedStep, setMaxReachedStep } = useContentLabStore()

    const handleSelect = (type: 'feed' | 'url' | 'idea') => {
        setSourceType(type)
        setCurrentStep(2)
        if (maxReachedStep < 2) setMaxReachedStep(2)
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center h-full gap-6"
        >
            <div className="text-center mb-4">
                <h2 className="text-2xl font-black tracking-tight">Pilih Sumber Konten</h2>
                <p className="text-sm text-slate-500 mt-1">Dari mana kamu mau ambil inspirasi?</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-3xl">
                {sources.map((src) => {
                    const Icon = src.icon
                    const isSelected = sourceType === src.type
                    return (
                        <motion.button
                            key={src.type}
                            whileHover={{ scale: 1.02, y: -2 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleSelect(src.type)}
                            className={`p-8 rounded-3xl border-2 transition-all text-left ${
                                isSelected
                                    ? 'border-blue-500 shadow-lg shadow-blue-200 dark:shadow-none bg-blue-50/50 dark:bg-blue-900/20'
                                    : 'border-white/60 dark:border-white/20 hover:border-slate-300 dark:hover:border-slate-600'
                            }`}
                        >
                            <div className={`w-14 h-14 rounded-2xl ${src.iconBg} flex items-center justify-center mb-4`}>
                                <Icon className="w-7 h-7" />
                            </div>
                            <h3 className="font-black text-lg mb-1">{src.title}</h3>
                            <p className="text-sm text-slate-500">{src.desc}</p>
                        </motion.button>
                    )
                })}
            </div>
        </motion.div>
    )
}
