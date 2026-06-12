'use client'

import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { RefreshCw } from 'lucide-react'
import { useContentLabStore } from '@/stores/content-lab-store'

interface SEOSectionProps {
    isRefreshingSEO: boolean;
    onRefreshSEO: () => void;
}

export function SEOSection({
    isRefreshingSEO,
    onRefreshSEO,
}: SEOSectionProps) {
    const {
        metaTitle, setMetaTitle,
        generatedTitle,
        generatedContent,
        slug, setSlug,
        metaDescription, setMetaDescription,
    } = useContentLabStore()

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <Label className="text-xs font-bold uppercase tracking-wider text-slate-400">SEO & Metadata</Label>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onRefreshSEO}
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
                    placeholder="Judul SEO"
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
                    placeholder="Deskripsi Meta..."
                    className="text-[11px] bg-white border-slate-100 rounded-lg focus:ring-1 focus:ring-blue-400 h-16 min-h-0 py-2 resize-none"
                />
            </div>

            <GooglePreviewMock title={metaTitle || generatedTitle || ''} description={metaDescription} slug={slug} />
            <SeoScoreIndicator title={metaTitle || generatedTitle || ''} description={metaDescription} slug={slug} />
        </div>
    )
}

function GooglePreviewMock({ title, description, slug }: { title: string; description: string; slug: string }) {
    if (!title && !description) return null
    const displayTitle = (title || 'Judul Artikel').slice(0, 60)
    const displayDesc = (description || 'Deskripsi meta akan muncul di sini...').slice(0, 160)
    const displaySlug = slug || 'artikel-slug'
    return (
        <div className="rounded-xl border border-slate-100 bg-white p-3 space-y-0.5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Google Preview</p>
            <p className="text-sm font-medium text-blue-700 leading-tight truncate">{displayTitle}</p>
            <p className="text-[11px] text-green-700 font-mono truncate">yoursite.com › {displaySlug}</p>
            <p className="text-[11px] text-slate-600 leading-snug line-clamp-2">{displayDesc}</p>
        </div>
    )
}

function SeoScoreIndicator({ title, description, slug }: { title: string; description: string; slug: string }) {
    const checks = [
        { label: 'Title 50-60 chars', pass: title.length >= 50 && title.length <= 60, info: `${title.length}/60` },
        { label: 'Meta desc 150-160', pass: description.length >= 150 && description.length <= 160, info: `${description.length}/160` },
        { label: 'Slug tersedia', pass: slug.length > 0 && /^[a-z0-9-]+$/.test(slug), info: slug ? '✓' : '✗' },
        { label: 'Title ada', pass: title.length > 0, info: title.length > 0 ? '✓' : '✗' },
    ]
    const score = Math.round((checks.filter((c) => c.pass).length / checks.length) * 100)
    const color = score >= 75 ? 'text-green-600 bg-green-50' : score >= 50 ? 'text-yellow-600 bg-yellow-50' : 'text-red-600 bg-red-50'

    if (!title && !description && !slug) return null

    return (
        <div className="rounded-xl border border-slate-100 p-3 space-y-2">
            <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">SEO Score</span>
                <span className={`text-xs font-black px-2 py-0.5 rounded-full ${color}`}>{score}%</span>
            </div>
            <div className="grid grid-cols-2 gap-1">
                {checks.map((c) => (
                    <div key={c.label} className="flex items-center gap-1">
                        <div className={`w-1.5 h-1.5 rounded-full ${c.pass ? 'bg-green-500' : 'bg-slate-300'}`} />
                        <span className="text-[9px] text-slate-500">{c.label}</span>
                        <span className="text-[9px] text-slate-400 ml-auto">{c.info}</span>
                    </div>
                ))}
            </div>
        </div>
    )
}
