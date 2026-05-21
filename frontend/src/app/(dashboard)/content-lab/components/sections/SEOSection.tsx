'use client'

import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { RefreshCw, Image as ImageIcon, Trash2, Loader2, Sparkles } from 'lucide-react'
import { useContentLabStore } from '@/stores/content-lab-store'
import NextImage from 'next/image'

interface SEOSectionProps {
    isRefreshingSEO: boolean;
    onRefreshSEO: () => void;
    isGeneratingImage: boolean;
    onGenerateImage: () => void;
}

export function SEOSection({
    isRefreshingSEO,
    onRefreshSEO,
    isGeneratingImage,
    onGenerateImage
}: SEOSectionProps) {
    const {
        metaTitle, setMetaTitle,
        generatedTitle,
        generatedContent,
        slug, setSlug,
        metaDescription, setMetaDescription,
        featuredImage, setFeaturedImage
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

            {/* SEO Score */}
            <SeoScoreIndicator title={metaTitle || generatedTitle || ''} description={metaDescription} slug={slug} />

            <div className="relative group rounded-2xl overflow-hidden aspect-[16/9] border-2 border-dashed border-slate-100 dark:border-slate-800 bg-slate-50/50 flex items-center justify-center transition-all hover:bg-slate-50">
                {featuredImage ? (
                    <>
                        <NextImage src={featuredImage} alt="Featured" fill className="object-cover" unoptimized />
                        <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-sm">
                            <Button variant="secondary" size="sm" className="h-8 text-[10px] font-bold rounded-lg" onClick={() => document.getElementById('image-input')?.click()}>
                                Ganti
                            </Button>
                            <Button variant="destructive" size="sm" className="h-8 w-8 p-0 rounded-lg" onClick={() => setFeaturedImage('')}>
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col items-center gap-3">
                        <div className="text-center p-4 cursor-pointer" onClick={() => document.getElementById('image-input')?.click()}>
                            <div className="p-3 bg-white text-blue-600 rounded-full w-fit mx-auto mb-2 shadow-sm border border-slate-100">
                                <ImageIcon className="h-5 w-5" />
                            </div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-blue-600/60">Gambar Utama</p>
                        </div>

                        {generatedTitle && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 text-[10px] font-bold text-blue-600 bg-blue-50/50 hover:bg-blue-100 rounded-lg px-3"
                                onClick={(e) => { e.stopPropagation(); onGenerateImage(); }}
                                disabled={isGeneratingImage}
                            >
                                {isGeneratingImage ? (
                                    <Loader2 className="h-3 w-3 animate-spin mr-1" />
                                ) : (
                                    <Sparkles className="h-3 w-3 mr-1" />
                                )}
                                Buat via AI (2T)
                            </Button>
                        )}
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
