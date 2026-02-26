'use client'

import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useContentLabStore } from '@/stores/content-lab-store'

export function ArticleIdeaSection() {
    const { articleIdea, setArticleIdea } = useContentLabStore()

    return (
        <div className="space-y-4 m-0">
            <div className="space-y-3">
                <Label className="text-xs font-bold uppercase tracking-wider text-slate-400">Deskripsikan Ide Anda</Label>
                <Textarea
                    placeholder="cth: 5 tips produktivitas pagi atau Masa depan web development..."
                    value={articleIdea}
                    onChange={(e) => setArticleIdea(e.target.value)}
                    className="min-h-[200px] bg-white/50 backdrop-blur-sm border-slate-200 rounded-2xl p-4 resize-none focus:ring-blue-500"
                />
            </div>
        </div>
    )
}
