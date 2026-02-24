'use client'

import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { RefreshCw, Image as ImageIcon, Trash2, Loader2, Sparkles } from 'lucide-react'
import { useContentLabStore } from '@/stores/content-lab-store'

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

            <div className="relative group rounded-2xl overflow-hidden aspect-[16/9] border-2 border-dashed border-slate-100 dark:border-slate-800 bg-slate-50/50 flex items-center justify-center transition-all hover:bg-slate-50">
                {featuredImage ? (
                    <>
                        <img src={featuredImage} alt="Featured" className="w-full h-full object-cover" />
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
