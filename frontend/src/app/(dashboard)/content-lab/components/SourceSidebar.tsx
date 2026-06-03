'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { motion, AnimatePresence } from 'framer-motion'
import { Rss } from 'lucide-react'
import { useContentLabStore } from '@/stores/content-lab-store'
import { ContentLabState, ContentLabHandlers } from './types'
import { RSSFeedSection } from './sections/RSSFeedSection'
import { URLScrapeSection } from './sections/URLScrapeSection'
import { ArticleIdeaSection } from './sections/ArticleIdeaSection'

interface SourceSidebarProps {
    state: ContentLabState;
    handlers: ContentLabHandlers;
}

export function SourceSidebar({ state, handlers }: SourceSidebarProps) {
    const {
        activeTab,
        setActiveTab,
    } = useContentLabStore()

    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="h-full flex flex-col"
        >
            <div className="flex-1 space-y-4">
                <Tabs value={activeTab} onValueChange={(v) => {
                    setActiveTab(v);
                    handlers.setActiveTab(v);
                }} className="w-full">
                    <TabsList className="grid w-full grid-cols-3 bg-slate-100/50 dark:bg-slate-800/50 p-1 rounded-xl">
                        <TabsTrigger value="rss" className="text-xs py-2 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
                            Feed
                        </TabsTrigger>
                        <TabsTrigger value="url" className="text-xs py-2 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
                            URL
                        </TabsTrigger>
                        <TabsTrigger value="idea" className="text-xs py-2 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
                            Ide
                        </TabsTrigger>
                    </TabsList>

                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                            className="pt-4"
                        >
                            <TabsContent value="rss" className="m-0">
                                <RSSFeedSection state={state} handlers={handlers} />
                            </TabsContent>

                            <TabsContent value="url" className="m-0">
                                <URLScrapeSection isScraping={state.isScraping} onScrape={handlers.handleScrape} />
                            </TabsContent>

                            <TabsContent value="idea" className="m-0">
                                <ArticleIdeaSection />
                            </TabsContent>
                        </motion.div>
                    </AnimatePresence>
                </Tabs>
            </div>
        </motion.div>
    )
}
