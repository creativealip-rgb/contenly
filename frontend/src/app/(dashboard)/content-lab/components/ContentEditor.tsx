'use client'

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
    Film,
    Loader2
} from 'lucide-react'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useContentLabStore } from '@/stores/content-lab-store'
import { ContentLabState, ContentLabHandlers } from './types'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'

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
    const router = useRouter()
    const [isConverting, setIsConverting] = useState(false)

    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api/v1'

    const handleConvertToVideoScript = async () => {
        if (!generatedContent) return
        setIsConverting(true)
        try {
            const res = await fetch(`${API_BASE_URL}/video-scripts/projects`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    title: generatedTitle || 'Video Script',
                    sourceUrl: selectedArticle?.url || '',
                    sourceContent: generatedContent,
                }),
            })
            if (!res.ok) throw new Error('Gagal membuat project')
            const project = await res.json()
            toast.success('Project video script dibuat! Redirecting...')
            router.push(`/video-scripts/${project.id}`)
        } catch (e: any) {
            toast.error(e.message || 'Gagal convert ke video script')
        } finally {
            setIsConverting(false)
        }
    }

    const wordCount = generatedContent ? generatedContent.trim().split(/\s+/).filter(Boolean).length : 0
    const readTime = Math.ceil(wordCount / 200)

    return (
        <div className="flex flex-col h-full">
            {/* Toolbar */}
            <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800 mb-3 flex-shrink-0">
                <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {wordCount > 0 && (
                        <>
                            <span>{wordCount} kata</span>
                            <span>·</span>
                            <span>~{readTime} min baca</span>
                        </>
                    )}
                </div>
                <div className="flex items-center gap-1.5">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" disabled={!generatedContent} className="h-8 px-3 text-purple-600 hover:bg-purple-50">
                                <Film className="h-3.5 w-3.5 mr-1" />
                                <span className="text-xs">Video Script</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={handleConvertToVideoScript} disabled={isConverting} className="cursor-pointer">
                                <Film className="h-4 w-4 mr-2" />
                                Video Script
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <Button variant="ghost" size="sm" onClick={handleCopy} disabled={!generatedContent} className="h-8 w-8 p-0">
                        {copied ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={handlers.handleAIRewrite} disabled={!sourceContent || state.isRewriting} className="h-8 w-8 p-0" title="Regenerate (~3 token)">
                        <RotateCcw className={`h-3.5 w-3.5 ${state.isRewriting ? 'animate-spin' : ''}`} />
                    </Button>
                </div>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="editor" className="flex-1 flex flex-col min-h-0">
                <TabsList className="w-fit bg-slate-100/50 dark:bg-slate-800/50 p-0.5 rounded-lg mb-3 flex-shrink-0">
                    <TabsTrigger value="editor" className="text-xs px-4 py-1.5 rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm font-semibold">Editor</TabsTrigger>
                    <TabsTrigger value="preview" className="text-xs px-4 py-1.5 rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm font-semibold">Preview</TabsTrigger>
                    <TabsTrigger value="source" className="text-xs px-4 py-1.5 rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm font-semibold">Referensi</TabsTrigger>
                </TabsList>

                {/* Editor Tab */}
                <TabsContent value="editor" className="flex-1 flex flex-col gap-3 mt-0 min-h-0">
                    <Input
                        value={generatedTitle}
                        onChange={(e) => setGeneratedTitle(e.target.value)}
                        placeholder="Judul artikel..."
                        className="text-xl font-black tracking-tight h-12 border-none bg-transparent px-0 focus-visible:ring-0"
                    />
                    <div className="flex-1 relative min-h-0">
                        <Textarea
                            value={generatedContent}
                            onChange={(e) => setGeneratedContent(e.target.value)}
                            placeholder="Tulis atau paste konten di sini..."
                            className="w-full h-full min-h-[300px] resize-none border-none bg-transparent px-0 text-[15px] leading-relaxed custom-scrollbar focus-visible:ring-0"
                        />
                        {state.isRewriting && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="absolute inset-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center space-y-4"
                            >
                                <div className="relative">
                                    <div className="h-16 w-16 rounded-full border-4 border-blue-100 animate-pulse" />
                                    <div className="absolute inset-0 h-16 w-16 rounded-full border-t-4 border-blue-600 animate-spin" />
                                    <Sparkles className="absolute inset-0 m-auto h-6 w-6 text-blue-600 animate-bounce" />
                                </div>
                                <div className="text-center space-y-1">
                                    <p className="text-sm font-bold text-slate-900">AI Sedang Menulis...</p>
                                    <p className="text-xs text-slate-400">Optimasi SEO sedang dikerjakan</p>
                                </div>
                            </motion.div>
                        )}
                    </div>
                </TabsContent>

                {/* Preview Tab */}
                <TabsContent value="preview" className="flex-1 mt-0 min-h-0 overflow-y-auto custom-scrollbar">
                    {generatedContent ? (
                        <div className="py-4">
                            {generatedTitle && <h1 className="text-2xl font-black mb-6 text-slate-900">{generatedTitle}</h1>}
                            <div
                                className="[&>h2]:text-xl [&>h2]:font-bold [&>h2]:mt-8 [&>h2]:mb-3 [&>h2]:text-slate-900 [&>h3]:text-lg [&>h3]:font-semibold [&>h3]:mt-6 [&>h3]:mb-2 [&>p]:mb-4 [&>p]:text-[15px] [&>p]:leading-relaxed [&>a]:text-blue-600 [&>a]:underline [&>strong]:font-bold [&>ul]:list-disc [&>ul]:pl-6 [&>ul]:mb-4 [&>ol]:list-decimal [&>ol]:pl-6 [&>ol]:mb-4 [&>li]:mb-1 [&>li]:text-[15px] [&>li]:leading-relaxed"
                                dangerouslySetInnerHTML={{ __html: generatedContent }}
                            />
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-slate-300">
                            <FileText className="h-12 w-12 mb-3" />
                            <p className="text-sm">Belum ada konten</p>
                        </div>
                    )}
                </TabsContent>

                {/* Source Tab */}
                <TabsContent value="source" className="flex-1 mt-0 min-h-0 overflow-y-auto custom-scrollbar">
                    {state.isScanning || state.isScraping ? (
                        <div className="flex flex-col items-center justify-center h-full space-y-3 py-20">
                            <Loader2 className="h-8 w-8 animate-spin text-slate-300" />
                            <p className="text-xs text-slate-400 font-medium">Memindai sumber...</p>
                        </div>
                    ) : sourceContent ? (
                        <div className="space-y-4 py-4">
                            <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-[10px]">Sumber</Badge>
                                <span className="text-xs font-mono text-slate-400 truncate">{selectedArticle?.url}</span>
                            </div>
                            <pre className="whitespace-pre-wrap text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                                {sourceContent}
                            </pre>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-slate-300 py-20">
                            <FileText className="h-10 w-10 mb-3" />
                            <p className="text-sm">Belum ada referensi</p>
                        </div>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    )
}
