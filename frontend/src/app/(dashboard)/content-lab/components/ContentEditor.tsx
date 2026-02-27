'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { motion } from 'framer-motion'
import {
    Copy,
    Check,
    RotateCcw,
    Sparkles,
    FileText,
    Loader2
} from 'lucide-react'
import { useContentLabStore } from '@/stores/content-lab-store'
import { ContentLabState, ContentLabHandlers } from './types'

interface ContentEditorProps {
    state: ContentLabState;
    handlers: ContentLabHandlers;
    copied: boolean;
    handleCopy: () => void;
}

export function ContentEditor({ state, handlers, copied, handleCopy }: ContentEditorProps) {
    const {
        generatedContent,
        setGeneratedContent,
        generatedTitle,
        setGeneratedTitle,
        sourceContent,
        selectedArticle,
    } = useContentLabStore()

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="h-full flex flex-col gap-4"
        >
            <div className="flex items-center justify-end gap-2">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopy}
                    disabled={!generatedContent}
                    className="h-10 px-4 rounded-xl border-slate-200 bg-white/50 backdrop-blur-sm hover:bg-white transition-all shadow-sm"
                >
                    {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handlers.handleAIRewrite}
                    disabled={!sourceContent || state.isRewriting}
                    className="h-10 px-4 rounded-xl border-slate-200 bg-white/50 backdrop-blur-sm hover:bg-white transition-all shadow-sm"
                >
                    <RotateCcw className={`h-4 w-4 ${state.isRewriting ? 'animate-spin' : ''}`} />
                </Button>
            </div>

            <div className="flex-1 flex flex-col min-h-0">
                <Tabs defaultValue="editor" className="flex-1 flex flex-col">
                    <TabsList className="w-fit bg-slate-100/50 dark:bg-slate-800/50 p-1 rounded-xl mb-4">
                        <TabsTrigger value="editor" className="text-xs px-6 py-2 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm font-bold">Editor</TabsTrigger>
                        <TabsTrigger value="source" className="text-xs px-6 py-2 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm font-bold">Referensi</TabsTrigger>
                    </TabsList>

                    <TabsContent value="editor" className="flex-1 flex flex-col gap-6 mt-0">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600/70 ml-1">Judul Artikel</Label>
                            <Input
                                value={generatedTitle}
                                onChange={(e) => setGeneratedTitle(e.target.value)}
                                placeholder="Klik buat untuk mendapatkan judul..."
                                className="text-2xl font-black tracking-tight h-16 border-none bg-white hover:bg-blue-50/10 focus-visible:bg-white transition-all shadow-xl shadow-slate-200/40 dark:shadow-none px-6 rounded-2xl"
                            />
                        </div>

                        <div className="flex-1 relative">
                            <Textarea
                                value={generatedContent}
                                onChange={(e) => setGeneratedContent(e.target.value)}
                                placeholder="Konten yang dibuat AI akan muncul di sini..."
                                className="absolute inset-0 w-full h-full min-h-[500px] resize-none border-none bg-white shadow-2xl shadow-slate-200/50 dark:shadow-none p-8 rounded-[32px] text-lg leading-relaxed custom-scrollbar focus-visible:ring-0"
                            />
                            {state.isRewriting && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="absolute inset-0 bg-white/80 backdrop-blur-md z-10 rounded-[32px] flex flex-col items-center justify-center space-y-6"
                                >
                                    <div className="relative">
                                        <div className="h-20 w-20 rounded-full border-4 border-blue-100 animate-pulse"></div>
                                        <div className="absolute inset-0 h-20 w-20 rounded-full border-t-4 border-blue-600 animate-spin"></div>
                                        <Sparkles className="absolute inset-0 m-auto h-8 w-8 text-blue-600 animate-bounce" />
                                    </div>
                                    <div className="text-center space-y-2">
                                        <p className="text-xl font-black text-slate-900 tracking-tight">AI Sedang Menulis...</p>
                                        <p className="text-sm text-slate-400 font-medium max-w-[200px]">Menulis artikel yang dioptimasi SEO Anda</p>
                                    </div>
                                </motion.div>
                            )}
                        </div>
                    </TabsContent>

                    <TabsContent value="source" className="flex-1 mt-0">
                        <div className="h-full bg-slate-50/50 dark:bg-slate-900/50 rounded-[32px] border-2 border-dashed border-slate-200 dark:border-slate-800 p-8 overflow-auto custom-scrollbar min-h-[500px]">
                            {state.isScanning || state.isScraping ? (
                                <div className="h-full flex flex-col items-center justify-center space-y-4 py-20">
                                    <Loader2 className="h-10 w-10 animate-spin text-slate-300" />
                                    <p className="text-sm text-slate-400 font-bold uppercase tracking-widest">Memindai sumber...</p>
                                </div>
                            ) : sourceContent ? (
                                <div className="space-y-6">
                                    <div className="flex items-center gap-3">
                                        <Badge variant="outline" className="bg-white px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-tighter">URL Sumber</Badge>
                                        <span className="text-xs font-mono text-slate-400 truncate">{selectedArticle?.url}</span>
                                    </div>
                                    <pre className="whitespace-pre-wrap text-sm font-medium text-slate-600 dark:text-slate-400 leading-loose">
                                        {sourceContent}
                                    </pre>
                                </div>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center space-y-6 py-20 opacity-30">
                                    <div className="p-6 bg-slate-100 rounded-full">
                                        <FileText className="h-12 w-12 text-slate-400" />
                                    </div>
                                    <div className="text-center space-y-1">
                                        <p className="text-sm font-black uppercase tracking-widest text-slate-500">Belum ada referensi</p>
                                        <p className="text-xs font-medium text-slate-400">Pilih artikel dari sidebar kiri</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </motion.div>
    )
}

function Label({ children, className }: { children: React.ReactNode, className?: string }) {
    return <p className={className}>{children}</p>
}
