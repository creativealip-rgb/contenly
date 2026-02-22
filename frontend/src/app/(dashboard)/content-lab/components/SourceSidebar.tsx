'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Rss,
    Loader2,
    Sparkles,
    Globe,
    Plus,
} from 'lucide-react'
import { useContentLabStore } from '@/stores/content-lab-store'
import { ContentLabState, ContentLabHandlers } from './types'

interface SourceSidebarProps {
    state: ContentLabState;
    handlers: ContentLabHandlers;
}

export function SourceSidebar({ state, handlers }: SourceSidebarProps) {
    const {
        activeTab,
        setActiveTab,
        articleIdea,
        setArticleIdea,
        scrapeUrl,
        setScrapeUrl,
    } = useContentLabStore()

    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="h-full flex flex-col"
        >
            <div className="flex items-center gap-2 mb-6">
                <div className="p-2.5 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-200 dark:shadow-none">
                    <Rss className="h-5 w-5" />
                </div>
                <h2 className="text-xl font-bold tracking-tight">Sources</h2>
            </div>

            <div className="flex-1 space-y-6">
                <Tabs value={activeTab} onValueChange={(v) => {
                    setActiveTab(v);
                    handlers.setActiveTab(v);
                }} className="w-full">
                    <TabsList className="grid w-full grid-cols-3 bg-slate-100/50 dark:bg-slate-800/50 p-1 rounded-xl">
                        <TabsTrigger value="rss" className="text-xs py-2 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
                            Feeds
                        </TabsTrigger>
                        <TabsTrigger value="url" className="text-xs py-2 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
                            URL
                        </TabsTrigger>
                        <TabsTrigger value="idea" className="text-xs py-2 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
                            Idea
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
                            <TabsContent value="rss" className="space-y-4 m-0">
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-xs font-bold uppercase tracking-wider text-slate-400">Select Source</Label>
                                        <Dialog open={state.isAddFeedOpen} onOpenChange={handlers.setIsAddFeedOpen}>
                                            <DialogTrigger asChild>
                                                <Button variant="ghost" size="sm" className="h-7 text-blue-600 px-2 hover:bg-transparent hover:text-blue-700">
                                                    <Plus className="h-3.5 w-3.5 mr-1" /> Add
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent className="glass border-none">
                                                <DialogHeader>
                                                    <DialogTitle>Add New Web Source</DialogTitle>
                                                    <DialogDescription>
                                                        Enter the URL of the feed you want to follow.
                                                    </DialogDescription>
                                                </DialogHeader>
                                                <div className="space-y-4 py-4">
                                                    <div className="space-y-2">
                                                        <Label>Source Name</Label>
                                                        <Input
                                                            placeholder="e.g. TechCrunch"
                                                            value={state.newFeedName}
                                                            onChange={(e) => handlers.setNewFeedName(e.target.value)}
                                                            className="bg-white/50"
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label>Source URL</Label>
                                                        <Input
                                                            placeholder="https://example.com/feed"
                                                            value={state.newFeedUrl}
                                                            onChange={(e) => handlers.setNewFeedUrl(e.target.value)}
                                                            className="bg-white/50"
                                                        />
                                                    </div>
                                                </div>
                                                <DialogFooter>
                                                    <Button variant="outline" onClick={() => handlers.setIsAddFeedOpen(false)}>Cancel</Button>
                                                    <Button onClick={handlers.handleAddFeed} disabled={!state.newFeedName || !state.newFeedUrl} className="bg-blue-600">Add Source</Button>
                                                </DialogFooter>
                                            </DialogContent>
                                        </Dialog>
                                    </div>
                                    <Select value={state.selectedFeed || ''} onValueChange={(val) => {
                                        handlers.setSelectedFeed(val)
                                    }}>
                                        <SelectTrigger className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border-slate-200 dark:border-slate-700 h-11 rounded-xl">
                                            <SelectValue placeholder="Select a feed..." />
                                        </SelectTrigger>
                                        <SelectContent className="glass border-none">
                                            {state.feeds.map((feed) => (
                                                <SelectItem key={feed.id} value={feed.id}>
                                                    <div className="flex flex-col items-start text-left py-1">
                                                        <span className="font-semibold text-sm">{feed.name}</span>
                                                        <span className="text-[10px] text-muted-foreground truncate max-w-[180px]">{feed.url}</span>
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-3">
                                    <Label className="text-xs font-bold uppercase tracking-wider text-slate-400">Select Article</Label>
                                    <div className="space-y-2 max-h-[450px] overflow-y-auto pr-2 custom-scrollbar">
                                        {state.isFetchingRSS ? (
                                            <div className="flex flex-col items-center justify-center py-12 space-y-3 opacity-60">
                                                <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                                                <p className="text-xs font-medium">Fetching articles...</p>
                                            </div>
                                        ) : state.articles.length > 0 ? (
                                            state.articles.map((article, idx) => (
                                                <motion.button
                                                    key={article.id}
                                                    initial={{ opacity: 0, x: -10 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: idx * 0.05 }}
                                                    onClick={() => handlers.handleSelectArticle(article)}
                                                    className={`w-full text-left p-4 rounded-2xl text-sm transition-all border ${state.selectedArticle?.url === article.url
                                                        ? 'bg-blue-600 text-white border-transparent shadow-lg shadow-blue-200 dark:shadow-none translate-x-1'
                                                        : 'bg-white/80 dark:bg-slate-800/80 border-slate-100 dark:border-slate-700 hover:border-blue-200 hover:bg-white'
                                                        }`}
                                                >
                                                    <p className={`font-bold line-clamp-2 mb-1.5 ${state.selectedArticle?.url === article.url ? 'text-white' : 'text-slate-900 dark:text-slate-100'}`}>
                                                        {article.title}
                                                    </p>
                                                    <div className={`flex items-center gap-2 text-[10px] ${state.selectedArticle?.url === article.url ? 'text-blue-100' : 'text-slate-400'}`}>
                                                        <span>{new Date(article.pubDate || Date.now()).toLocaleDateString()}</span>
                                                    </div>
                                                </motion.button>
                                            ))
                                        ) : (
                                            <div className="p-8 text-center border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-3xl opacity-50">
                                                <Globe className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                                                <p className="text-xs font-medium">Select a source above</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="url" className="space-y-4 m-0">
                                <div className="space-y-3">
                                    <Label className="text-xs font-bold uppercase tracking-wider text-slate-400">Direct URL</Label>
                                    <div className="flex flex-col gap-3">
                                        <Input
                                            placeholder="https://example.com/blog-post"
                                            value={scrapeUrl}
                                            onChange={(e) => setScrapeUrl(e.target.value)}
                                            className="bg-white/50 backdrop-blur-sm border-slate-200 h-11 rounded-xl"
                                        />
                                        <Button
                                            onClick={handlers.handleScrape}
                                            disabled={state.isScraping || !scrapeUrl}
                                            className="w-full h-11 bg-blue-600 hover:bg-blue-700 rounded-xl shadow-lg shadow-blue-100 font-bold"
                                        >
                                            {state.isScraping ? <Loader2 className="h-5 w-5 animate-spin" /> : "Scrape Content"}
                                        </Button>
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="idea" className="space-y-4 m-0">
                                <div className="space-y-3">
                                    <Label className="text-xs font-bold uppercase tracking-wider text-slate-400">Describe your Idea</Label>
                                    <Textarea
                                        placeholder="e.g. 5 tips for morning productivity or The future of web development..."
                                        value={articleIdea}
                                        onChange={(e) => setArticleIdea(e.target.value)}
                                        className="min-h-[200px] bg-white/50 backdrop-blur-sm border-slate-200 rounded-2xl p-4 resize-none focus:ring-blue-500"
                                    />
                                </div>
                            </TabsContent>
                        </motion.div>
                    </AnimatePresence>
                </Tabs>
            </div>
        </motion.div>
    )
}
