'use client'

import { Label } from '@/components/ui/label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Settings2, Sparkles, Loader2 } from 'lucide-react'
import { useContentLabStore } from '@/stores/content-lab-store'

interface AIConfigSectionProps {
    wpCategories: Array<{ id: number; name: string }>;
    selectedCategory: number | null;
    setSelectedCategory: (id: number | null) => void;
    isFetchingCategories: boolean;
    isRewriting: boolean;
    onRewrite: () => void;
}

export function AIConfigSection({
    wpCategories,
    selectedCategory,
    setSelectedCategory,
    isFetchingCategories,
    isRewriting,
    onRewrite
}: AIConfigSectionProps) {
    const {
        aiTone, setAiTone,
        aiStyle, setAiStyle,
        aiLength, setAiLength,
        sourceContent,
        articleIdea,
        activeTab
    } = useContentLabStore()

    const canRewrite = activeTab === 'idea' ? articleIdea.trim().length > 0 : sourceContent.trim().length > 0;

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-100 text-blue-600 rounded-lg dark:bg-blue-900/30 dark:text-blue-400">
                    <Settings2 className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-bold tracking-tight">Pengaturan AI</h3>
            </div>

            <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                        <Label className="text-[10px] uppercase font-black text-slate-400 tracking-[0.15em] ml-1">Gaya Bahasa</Label>
                        <Select value={aiTone} onValueChange={(v: any) => setAiTone(v)}>
                            <SelectTrigger className="h-10 text-xs bg-white border-slate-200 rounded-xl font-bold shadow-sm">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="professional">Profesional</SelectItem>
                                <SelectItem value="casual">Santai</SelectItem>
                                <SelectItem value="creative">Kreatif</SelectItem>
                                <SelectItem value="technical">Teknis</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-[10px] uppercase font-black text-slate-400 tracking-[0.15em] ml-1">Gaya Penulisan</Label>
                        <Select value={aiStyle} onValueChange={(v: any) => setAiStyle(v)}>
                            <SelectTrigger className="h-10 text-xs bg-white border-slate-200 rounded-xl font-bold shadow-sm">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="blog">Artikel Blog</SelectItem>
                                <SelectItem value="news">Artikel Berita</SelectItem>
                                <SelectItem value="tutorial">Tutorial</SelectItem>
                                <SelectItem value="review">Ulasan</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="space-y-1.5">
                    <Label className="text-[10px] uppercase font-black text-slate-400 tracking-[0.15em] ml-1">Panjang</Label>
                    <Select value={aiLength} onValueChange={(v: any) => setAiLength(v)}>
                        <SelectTrigger className="h-10 text-xs bg-white border-slate-200 rounded-xl font-bold shadow-sm">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="shorter">Pendek (~600 kata)</SelectItem>
                            <SelectItem value="same">Sedang (~1200 kata)</SelectItem>
                            <SelectItem value="longer">Panjang (~2000 kata)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-1.5">
                    <Label className="text-[10px] uppercase font-black text-slate-400 tracking-[0.15em] ml-1">Kategori</Label>
                    <Select
                        value={selectedCategory?.toString() || ''}
                        onValueChange={(val) => setSelectedCategory(parseInt(val))}
                        disabled={isFetchingCategories}
                    >
                        <SelectTrigger className={`h-10 text-xs bg-white border-slate-200 rounded-xl font-bold shadow-sm ${!selectedCategory ? 'ring-2 ring-amber-400/20 border-amber-200' : ''}`}>
                            <SelectValue placeholder="Pilih kategori target" />
                        </SelectTrigger>
                        <SelectContent>
                            {wpCategories.map(cat => (
                                <SelectItem key={cat.id} value={cat.id.toString()}>{cat.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <Button
                    className="w-full h-12 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 rounded-xl shadow-lg shadow-blue-200 dark:shadow-none font-black text-sm uppercase tracking-widest"
                    onClick={onRewrite}
                    disabled={!canRewrite || isRewriting}
                >
                    {isRewriting ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                        <>
                            <Sparkles className="h-4 w-4 mr-2" />
                            Buat Konten
                        </>
                    )}
                </Button>
            </div>
        </div>
    )
}
