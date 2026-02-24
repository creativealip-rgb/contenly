'use client'

import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import { useContentLabStore } from '@/stores/content-lab-store'

interface URLScrapeSectionProps {
    isScraping: boolean;
    onScrape: () => void;
}

export function URLScrapeSection({ isScraping, onScrape }: URLScrapeSectionProps) {
    const { scrapeUrl, setScrapeUrl } = useContentLabStore()

    return (
        <div className="space-y-4 m-0">
            <div className="space-y-3">
                <Label className="text-xs font-bold uppercase tracking-wider text-slate-400">URL Langsung</Label>
                <div className="flex flex-col gap-3">
                    <Input
                        placeholder="https://example.com/blog-post"
                        value={scrapeUrl}
                        onChange={(e) => setScrapeUrl(e.target.value)}
                        className="bg-white/50 backdrop-blur-sm border-slate-200 h-11 rounded-xl"
                    />
                    <Button
                        onClick={onScrape}
                        disabled={isScraping || !scrapeUrl}
                        className="w-full h-11 bg-blue-600 hover:bg-blue-700 rounded-xl shadow-lg shadow-blue-100 font-bold"
                    >
                        {isScraping ? <Loader2 className="h-5 w-5 animate-spin" /> : "Tarik Konten"}
                    </Button>
                </div>
            </div>
        </div>
    )
}
