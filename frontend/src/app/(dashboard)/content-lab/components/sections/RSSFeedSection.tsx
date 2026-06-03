'use client'

import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import { motion } from 'framer-motion'
import { Plus, Loader2, Globe } from 'lucide-react'
import { ContentLabState, ContentLabHandlers } from '../types'

interface RSSFeedSectionProps {
    state: ContentLabState;
    handlers: ContentLabHandlers;
}

export function RSSFeedSection({ state, handlers }: RSSFeedSectionProps) {
    return (
        <div className="space-y-4 m-0">
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold uppercase tracking-wider text-slate-400">Pilih Sumber</Label>
                    <Dialog open={state.isAddFeedOpen} onOpenChange={handlers.setIsAddFeedOpen}>
                        <DialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-7 text-blue-600 px-2 hover:bg-transparent hover:text-blue-700">
                                <Plus className="h-3.5 w-3.5 mr-1" /> Tambah
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md">
                            <DialogHeader>
                                <DialogTitle>Tambah Sumber Web Baru</DialogTitle>
                                <DialogDescription>
                                    Masukkan URL feed yang ingin Anda ikuti.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label>Nama Sumber</Label>
                                    <Input
                                        placeholder="cth: Detikcom"
                                        value={state.newFeedName}
                                        onChange={(e) => handlers.setNewFeedName(e.target.value)}
                                        className="bg-white/50"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>URL Sumber</Label>
                                    <Input
                                        placeholder="https://example.com/feed"
                                        value={state.newFeedUrl}
                                        onChange={(e) => handlers.setNewFeedUrl(e.target.value)}
                                        className="bg-white/50"
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => handlers.setIsAddFeedOpen(false)}>Batal</Button>
                                <Button onClick={handlers.handleAddFeed} disabled={!state.newFeedName || !state.newFeedUrl} className="bg-blue-600">Tambah Sumber</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
                <Select value={state.selectedFeed || ''} onValueChange={(val) => {
                    handlers.setSelectedFeed(val)
                    const feed = state.feeds.find(f => f.id === val)
                    if (feed) handlers.handleFetchArticles(feed.url)
                }}>
                    <SelectTrigger className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border-slate-200 dark:border-slate-700 h-11 rounded-xl">
                        <SelectValue placeholder="Pilih feed..." />
                    </SelectTrigger>
                    <SelectContent>
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
                <Label className="text-xs font-bold uppercase tracking-wider text-slate-400">Pilih Artikel</Label>
                <div className="space-y-2 max-h-[450px] overflow-y-auto pr-2 custom-scrollbar">
                    {state.isFetchingRSS ? (
                        <div className="flex flex-col items-center justify-center py-12 space-y-3 opacity-60">
                            <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                            <p className="text-xs font-medium">Mengambil artikel...</p>
                        </div>
                    ) : state.articles.length > 0 ? (
                        state.articles.map((article, idx) => (
                            <motion.button
                                key={article.id || idx}
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
                            <p className="text-xs font-medium">Pilih sumber di atas</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
