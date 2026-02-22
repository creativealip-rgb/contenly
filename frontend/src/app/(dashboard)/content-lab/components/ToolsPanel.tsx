'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
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
    Settings2,
    RefreshCw,
    Image as ImageIcon,
    Trash2,
    Loader2,
    Check,
    Send,
    Calendar,
    Clock,
    Sparkles,
    ExternalLink
} from 'lucide-react'
import { useContentLabStore } from '@/stores/content-lab-store'
import { ContentLabState, ContentLabHandlers } from './types'

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
    handleSchedulePublish
}: ToolsPanelProps) {
    const {
        aiTone, setAiTone,
        aiStyle, setAiStyle,
        aiLength, setAiLength,
        metaTitle, setMetaTitle,
        generatedTitle,
        generatedContent,
        slug, setSlug,
        metaDescription, setMetaDescription,
        featuredImage, setFeaturedImage,
        publishResult,
        sourceContent,
        articleIdea,
        activeTab
    } = useContentLabStore()

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-8"
        >
            {/* AI Configuration */}
            <div className="space-y-6">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-blue-100 text-blue-600 rounded-lg dark:bg-blue-900/30 dark:text-blue-400">
                        <Settings2 className="h-5 w-5" />
                    </div>
                    <h3 className="text-lg font-bold tracking-tight">AI Settings</h3>
                </div>

                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <Label className="text-[10px] uppercase font-black text-slate-400 tracking-[0.15em] ml-1">Tone</Label>
                            <Select value={aiTone} onValueChange={(v: any) => setAiTone(v)}>
                                <SelectTrigger className="h-10 text-xs bg-white border-slate-200 rounded-xl font-bold shadow-sm">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="glass border-none">
                                    <SelectItem value="professional">Professional</SelectItem>
                                    <SelectItem value="casual">Casual</SelectItem>
                                    <SelectItem value="creative">Creative</SelectItem>
                                    <SelectItem value="technical">Technical</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-[10px] uppercase font-black text-slate-400 tracking-[0.15em] ml-1">Style</Label>
                            <Select value={aiStyle} onValueChange={(v: any) => setAiStyle(v)}>
                                <SelectTrigger className="h-10 text-xs bg-white border-slate-200 rounded-xl font-bold shadow-sm">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="glass border-none">
                                    <SelectItem value="blog">Blog Post</SelectItem>
                                    <SelectItem value="news">News Article</SelectItem>
                                    <SelectItem value="tutorial">Tutorial</SelectItem>
                                    <SelectItem value="review">Review</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-[10px] uppercase font-black text-slate-400 tracking-[0.15em] ml-1">Length</Label>
                        <Select value={aiLength} onValueChange={(v: any) => setAiLength(v)}>
                            <SelectTrigger className="h-10 text-xs bg-white border-slate-200 rounded-xl font-bold shadow-sm">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="glass border-none">
                                <SelectItem value="shorter">Short (~600 words)</SelectItem>
                                <SelectItem value="same">Medium (~1200 words)</SelectItem>
                                <SelectItem value="longer">Long (~2000 words)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-[10px] uppercase font-black text-slate-400 tracking-[0.15em] ml-1">Category</Label>
                        <Select
                            value={state.selectedCategory?.toString() || ''}
                            onValueChange={(val) => handlers.setSelectedCategory(parseInt(val))}
                            disabled={state.isFetchingCategories}
                        >
                            <SelectTrigger className={`h-10 text-xs bg-white border-slate-200 rounded-xl font-bold shadow-sm ${!state.selectedCategory ? 'ring-2 ring-amber-400/20 border-amber-200' : ''}`}>
                                <SelectValue placeholder="Select target category" />
                            </SelectTrigger>
                            <SelectContent className="glass border-none">
                                {state.wpCategories.map(cat => (
                                    <SelectItem key={cat.id} value={cat.id.toString()}>{cat.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <Button
                        className="w-full h-12 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 rounded-xl shadow-lg shadow-blue-200 dark:shadow-none font-black text-sm uppercase tracking-widest"
                        onClick={handlers.handleAIRewrite}
                        disabled={(activeTab === 'idea' ? !articleIdea.trim() : !sourceContent) || state.isRewriting}
                    >
                        {state.isRewriting ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                            <>
                                <Sparkles className="h-4 w-4 mr-2" />
                                Generate
                            </>
                        )}
                    </Button>
                </div>
            </div>

            <Separator className="opacity-50" />

            {/* SEO & Image */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold uppercase tracking-wider text-slate-400">SEO & Metadata</Label>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleRefreshSEO}
                        disabled={isRefreshingSEO || !generatedContent}
                        className="h-8 w-8 p-0 rounded-full hover:bg-blue-50"
                    >
                        <RefreshCw className={`h-4 w-4 ${isRefreshingSEO ? 'animate-spin text-blue-600' : 'text-slate-400'}`} />
                    </Button>
                </div>

                <div className="space-y-3">
                    <Input
                        value={metaTitle || generatedTitle || ""}
                        onChange={(e) => setMetaTitle(e.target.value)}
                        placeholder="SEO Title"
                        className="h-9 text-[11px] bg-white border-slate-100 rounded-lg focus:ring-1 focus:ring-blue-400"
                    />
                    <Input
                        value={slug}
                        onChange={(e) => setSlug(e.target.value)}
                        placeholder="slug-url"
                        className="h-9 text-[11px] font-mono bg-white border-slate-100 rounded-lg focus:ring-1 focus:ring-blue-400"
                    />
                    <Textarea
                        value={metaDescription}
                        onChange={(e) => setMetaDescription(e.target.value)}
                        placeholder="Meta description..."
                        className="text-[11px] bg-white border-slate-100 rounded-lg focus:ring-1 focus:ring-blue-400 h-16 min-h-0 py-2 resize-none"
                    />
                </div>

                <div className="relative group rounded-2xl overflow-hidden aspect-[16/9] border-2 border-dashed border-slate-100 dark:border-slate-800 bg-slate-50/50 flex items-center justify-center transition-all hover:bg-slate-50">
                    {featuredImage ? (
                        <>
                            <img src={featuredImage} alt="Featured" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-sm">
                                <Button variant="secondary" size="sm" className="h-8 text-[10px] font-bold rounded-lg" onClick={() => document.getElementById('image-input')?.click()}>
                                    Replace
                                </Button>
                                <Button variant="destructive" size="sm" className="h-8 w-8 p-0 rounded-lg" onClick={() => setFeaturedImage('')}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </>
                    ) : (
                        <div className="text-center p-4 cursor-pointer" onClick={() => document.getElementById('image-input')?.click()}>
                            <div className="p-3 bg-white text-blue-600 rounded-full w-fit mx-auto mb-2 shadow-sm border border-slate-100">
                                <ImageIcon className="h-5 w-5" />
                            </div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-blue-600/60">Featured Image</p>
                        </div>
                    )}
                    <input id="image-input" type="file" className="hidden" accept="image/*" onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => setFeaturedImage(reader.result as string);
                            reader.readAsDataURL(file);
                        }
                    }} />
                </div>
            </div>

            <Separator className="opacity-50" />

            {/* Publishing */}
            <div className="space-y-4 pt-2">
                <AnimatePresence>
                    {publishResult && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className={`p-4 rounded-2xl text-xs flex flex-col gap-2 ${publishResult.success ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100'}`}
                        >
                            <div className="flex items-center gap-2">
                                {publishResult.success ? <Check className="h-4 w-4" /> : <Loader2 className="h-4 w-4 animate-spin font-bold" />}
                                <span className="font-bold">{publishResult.message}</span>
                            </div>
                            {publishResult.link && (
                                <a href={publishResult.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center font-black uppercase tracking-tighter underline hover:text-emerald-900 mt-1">
                                    View Post <ExternalLink className="h-3 w-3 ml-1" />
                                </a>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="grid grid-cols-2 gap-3">
                    <Button
                        variant="outline"
                        className="w-full h-11 border-slate-200 hover:bg-slate-50 text-slate-600 font-bold rounded-xl"
                        onClick={() => handlePublishNow('draft')}
                        disabled={!generatedContent || isPublishing}
                    >
                        {isPublishing ? <Loader2 className="h-4 w-4 animate-spin" /> : "Draft"}
                    </Button>
                    <Button
                        className="w-full h-11 bg-slate-900 hover:bg-black text-white font-black uppercase tracking-widest text-xs rounded-xl shadow-lg shadow-slate-200 dark:shadow-none"
                        onClick={() => handlePublishNow('publish')}
                        disabled={!generatedContent || isPublishing}
                    >
                        {isPublishing ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Send className="h-3.5 w-3.5 mr-2" /> Publish</>}
                    </Button>
                </div>

                <Button
                    variant="ghost"
                    className="w-full h-10 text-xs font-bold text-slate-400 hover:text-blue-600 rounded-xl"
                    onClick={() => setIsScheduleOpen(true)}
                >
                    <Calendar className="h-4 w-4 mr-2" /> Schedule Post
                </Button>

                <Dialog open={isScheduleOpen} onOpenChange={setIsScheduleOpen}>
                    <DialogContent className="glass border-none">
                        <DialogHeader>
                            <DialogTitle>Schedule Publication</DialogTitle>
                            <DialogDescription>Set a future date and time for this article.</DialogDescription>
                        </DialogHeader>
                        <div className="grid grid-cols-2 gap-4 py-6">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Date</Label>
                                <Input type="date" value={scheduleDate} onChange={(e) => setScheduleDate(e.target.value)} className="h-11 rounded-xl bg-white/50" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Time</Label>
                                <Input type="time" value={scheduleTime} onChange={(e) => setScheduleTime(e.target.value)} className="h-11 rounded-xl bg-white/50" />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsScheduleOpen(false)}>Cancel</Button>
                            <Button onClick={handleSchedulePublish} disabled={!scheduleDate || !scheduleTime || isPublishing} className="bg-blue-600 font-bold rounded-xl h-11 px-8">
                                Confirm Schedule
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </motion.div>
    )
}
