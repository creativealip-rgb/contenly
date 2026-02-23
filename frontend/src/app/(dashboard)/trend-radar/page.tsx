'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Search,
    Sparkles,
    TrendingUp,
    ArrowRight,
    Loader2,
    Globe,
    Clock,
    Zap,
    ChevronRight,
    SearchX
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from '@/components/ui/sheet'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { useContentLabStore } from '@/stores/content-lab-store'

interface TrendItem {
    id: string;
    title: string;
    url: string;
    source: string;
    time: string;
    type: string;
}

interface TrendAnalysis {
    score: number;
    reason: string;
    hooks: string[];
    strategy: string;
    keywords: string[];
    sentiment: string;
    content: string;
}

export default function TrendRadarPage() {
    const router = useRouter()
    const { setScrapeUrl, setActiveTab } = useContentLabStore()

    const [query, setQuery] = useState('')
    const [isSearching, setIsSearching] = useState(false)
    const [results, setResults] = useState<TrendItem[]>([])
    const [selectedTrend, setSelectedTrend] = useState<TrendItem | null>(null)
    const [isAnalyzing, setIsAnalyzing] = useState(false)
    const [analysis, setAnalysis] = useState<TrendAnalysis | null>(null)
    const [isSheetOpen, setIsSheetOpen] = useState(false)

    const handleSearch = async (e?: React.FormEvent) => {
        if (e) e.preventDefault()
        if (!query.trim()) return

        setIsSearching(true)
        setResults([])

        try {
            const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'
            const response = await fetch(`${API_BASE_URL}/trend-radar/search?q=${encodeURIComponent(query)}`, {
                headers: { 'ngrok-skip-browser-warning': 'true' },
                credentials: 'include'
            })
            const data = await response.json()
            if (data.success) {
                setResults(data.data)
                if (data.data.length === 0) toast.info('No trends found for this query.')
            } else {
                toast.error(data.error || 'Failed to search trends')
            }
        } catch (error) {
            toast.error('Connection error. Please try again.')
        } finally {
            setIsSearching(false)
        }
    }

    const handleAnalyze = async (trend: TrendItem) => {
        setSelectedTrend(trend)
        setIsAnalyzing(true)
        setIsSheetOpen(true)
        setAnalysis(null)

        try {
            const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'
            const response = await fetch(`${API_BASE_URL}/trend-radar/analyze?url=${encodeURIComponent(trend.url)}`, {
                headers: { 'ngrok-skip-browser-warning': 'true' },
                credentials: 'include'
            })
            const data = await response.json()
            if (data.success) {
                setAnalysis({
                    ...data.data.analysis,
                    content: data.data.content
                })
            } else {
                toast.error('Failed to analyze trend content')
            }
        } catch (error) {
            toast.error('Analysis failed. Try another link.')
        } finally {
            setIsAnalyzing(false)
        }
    }

    const handleDraftInLab = () => {
        if (!selectedTrend) return

        setScrapeUrl(selectedTrend.url)
        setActiveTab('url')
        toast.success('Topic sent to Content Lab!')
        router.push('/content-lab')
    }

    return (
        <div className="max-w-[1400px] mx-auto space-y-10 pb-20">
            {/* Header / Search Hero */}
            <div className="relative overflow-hidden rounded-[3rem] bg-slate-900 px-8 py-16 md:px-16 md:py-24 text-center">
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-20">
                    <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-blue-500 rounded-full blur-[120px]" />
                    <div className="absolute top-[40%] -right-[10%] w-[30%] h-[30%] bg-purple-500 rounded-full blur-[100px]" />
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="relative z-10 space-y-6 max-w-3xl mx-auto"
                >
                    <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest mb-4">
                        <Sparkles className="h-3.5 w-3.5 mr-2" />
                        AI Discovery
                    </Badge>
                    <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter leading-[0.9]">
                        Trend Radar <span className="text-blue-500">.</span>
                    </h1>
                    <p className="text-slate-400 text-lg md:text-xl font-medium tracking-tight max-w-2xl mx-auto">
                        Research the most viral topics on the internet and transform them into high-performing articles instantly.
                    </p>

                    <form onSubmit={handleSearch} className="relative max-w-2xl mx-auto pt-6 group">
                        <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-[2rem] blur opacity-25 group-focus-within:opacity-100 transition duration-500" />
                        <div className="relative flex items-center bg-white dark:bg-slate-800 rounded-[2rem] p-2 pr-4 shadow-2xl">
                            <div className="pl-4 pr-3 text-slate-400">
                                <Search className="h-6 w-6" />
                            </div>
                            <Input
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="What's trending in 'Artificial Intelligence'..."
                                className="border-none bg-transparent focus-visible:ring-0 text-lg h-14 font-bold"
                            />
                            <Button
                                type="submit"
                                disabled={isSearching}
                                className="bg-blue-600 hover:bg-blue-700 text-white rounded-2xl h-12 px-8 font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-500/25"
                            >
                                {isSearching ? <Loader2 className="h-5 w-5 animate-spin" /> : "Discover"}
                            </Button>
                        </div>
                    </form>
                </motion.div>
            </div>

            {/* Results Grid */}
            <div className="px-4 md:px-0">
                <AnimatePresence mode="wait">
                    {isSearching ? (
                        <motion.div
                            key="searching"
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="flex flex-col items-center justify-center py-20 space-y-4"
                        >
                            <div className="relative">
                                <div className="h-20 w-20 rounded-full border-4 border-slate-100 border-t-blue-600 animate-spin" />
                                <TrendingUp className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-8 w-8 text-blue-600" />
                            </div>
                            <p className="font-black uppercase tracking-[0.2em] text-slate-400 text-xs text-center ml-2">Scanning Global Trends...</p>
                        </motion.div>
                    ) : results.length > 0 ? (
                        <motion.div
                            key="results"
                            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                        >
                            {results.map((trend, idx) => (
                                <motion.div
                                    key={trend.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                >
                                    <Card className="group relative h-full glass border-2 border-white/60 dark:border-white/20 overflow-hidden hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-none transition-all duration-500 rounded-[2.5rem]">
                                        <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <div className="bg-blue-600 text-white p-2 rounded-xl shadow-lg">
                                                <ArrowRight className="h-4 w-4" />
                                            </div>
                                        </div>

                                        <CardHeader className="pt-8 px-8">
                                            <div className="flex items-center gap-2 mb-3">
                                                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg dark:bg-blue-900/30 dark:text-blue-400">
                                                    <Globe className="h-4 w-4" />
                                                </div>
                                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{trend.source}</span>
                                            </div>
                                            <CardTitle className="text-xl font-black tracking-tighter leading-tight group-hover:text-blue-600 transition-colors">
                                                {trend.title}
                                            </CardTitle>
                                        </CardHeader>

                                        <CardContent className="px-8 pb-8 space-y-6">
                                            <div className="flex items-center gap-4 text-xs font-bold text-slate-400">
                                                <div className="flex items-center gap-1.5">
                                                    <Clock className="h-3.5 w-3.5" />
                                                    {trend.time}
                                                </div>
                                                <div className="flex items-center gap-1.5 text-emerald-500">
                                                    <Zap className="h-3.5 w-3.5" />
                                                    High Viral Potential
                                                </div>
                                            </div>

                                            <Button
                                                variant="secondary"
                                                className="w-full h-12 rounded-2xl font-black uppercase tracking-widest text-xs bg-slate-50 hover:bg-blue-50 hover:text-blue-600 transition-all border-none shadow-none"
                                                onClick={() => handleAnalyze(trend)}
                                            >
                                                AI Insight
                                            </Button>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            ))}
                        </motion.div>
                    ) : (
                        <motion.div
                            key="empty"
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                            className="flex flex-col items-center justify-center py-32 text-slate-400 space-y-6"
                        >
                            <div className="p-8 bg-slate-50 rounded-[3rem] dark:bg-slate-900/50">
                                <SearchX className="h-16 w-16 opacity-20" />
                            </div>
                            <div className="text-center space-y-2">
                                <h3 className="text-xl font-black text-slate-600 dark:text-slate-300">Ready to Discover?</h3>
                                <p className="text-sm font-bold opacity-60">Enter a keyword above to find viral content across the web.</p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Analysis Sheet */}
            <Sheet open={isSheetOpen} onOpenChange={(open) => {
                setIsSheetOpen(open);
                if (!open) setAnalysis(null);
            }}>
                <SheetContent side="right" className="w-full sm:max-w-xl glass border-l-white/40 dark:border-l-white/10 p-0 overflow-hidden">
                    <div className="h-full flex flex-col">
                        <div className="p-8 bg-slate-900 text-white">
                            <SheetHeader className="text-left space-y-4">
                                <div className="flex items-center justify-between">
                                    <Badge className="bg-blue-500 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border-none">
                                        Trend Analysis
                                    </Badge>
                                    {analysis && (
                                        <div className="flex items-center gap-2">
                                            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                                            <span className="text-[10px] font-black uppercase text-emerald-500">Viral Match: {analysis.score}%</span>
                                        </div>
                                    )}
                                </div>
                                <SheetTitle className="text-2xl font-black tracking-tighter text-white leading-tight">
                                    {selectedTrend?.title}
                                </SheetTitle>
                                <SheetDescription className="text-slate-400 font-bold">
                                    {selectedTrend?.source} • {selectedTrend?.time}
                                </SheetDescription>
                            </SheetHeader>
                        </div>

                        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-8">
                            {isAnalyzing ? (
                                <div className="space-y-6">
                                    <div className="space-y-3">
                                        <div className="h-4 w-1/4 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
                                        <div className="h-20 w-full bg-slate-100 dark:bg-slate-800 rounded-2xl animate-pulse" />
                                    </div>
                                    <div className="space-y-3">
                                        <div className="h-4 w-1/3 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
                                        <div className="grid grid-cols-1 gap-2">
                                            <div className="h-12 w-full bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
                                            <div className="h-12 w-full bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
                                        </div>
                                    </div>
                                </div>
                            ) : analysis ? (
                                <>
                                    {/* Score & Sentiment */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-[2rem] text-center border border-white/40">
                                            <p className="text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">Sentiment</p>
                                            <p className={`text-xl font-black capitalize ${analysis.sentiment === 'positive' ? 'text-emerald-500' : analysis.sentiment === 'negative' ? 'text-rose-500' : 'text-slate-500'}`}>
                                                {analysis.sentiment}
                                            </p>
                                        </div>
                                        <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-[2rem] text-center border border-blue-100/40">
                                            <p className="text-[10px] font-black uppercase text-blue-400 mb-2 tracking-widest">Viral Score</p>
                                            <p className="text-3xl font-black text-blue-600 leading-none">
                                                {analysis.score}<span className="text-xs">%</span>
                                            </p>
                                        </div>
                                    </div>

                                    {/* Hooks */}
                                    <div className="space-y-4">
                                        <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                            <Zap className="h-3 w-3 text-amber-500" /> AI Suggestions (Hooks)
                                        </h4>
                                        <div className="space-y-3">
                                            {analysis.hooks.map((hook, i) => (
                                                <div key={i} className="flex gap-4 p-4 bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-100 dark:border-white/5 shadow-sm group hover:border-blue-200 transition-colors">
                                                    <span className="flex-shrink-0 h-6 w-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[10px] font-black">
                                                        {i + 1}
                                                    </span>
                                                    <p className="text-sm font-bold leading-relaxed">{hook}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Strategy */}
                                    <div className="space-y-4">
                                        <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-400">Content Strategy</h4>
                                        <div className="p-6 bg-slate-950 text-slate-300 rounded-[2rem] border border-white/5 italic font-medium leading-relaxed">
                                            "{analysis.strategy}"
                                        </div>
                                    </div>

                                    {/* Keywords */}
                                    <div className="space-y-4">
                                        <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-400">Target Keywords</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {analysis.keywords.map((kw, i) => (
                                                <Badge key={i} variant="outline" className="rounded-xl px-4 py-2 border-slate-200 font-bold text-slate-600">
                                                    #{kw}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            ) : null}
                        </div>

                        <div className="p-8 border-t border-white/40 dark:border-white/10 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl">
                            <Button
                                onClick={handleDraftInLab}
                                className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-blue-500/20"
                                disabled={isAnalyzing}
                            >
                                <Zap className="h-4 w-4 mr-2" /> Ignite in Content Lab
                            </Button>
                        </div>
                    </div>
                </SheetContent>
            </Sheet>
        </div>
    )
}
