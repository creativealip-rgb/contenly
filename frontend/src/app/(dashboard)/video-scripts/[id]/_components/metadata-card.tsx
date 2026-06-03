'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, RefreshCw } from 'lucide-react'

interface MetadataCardProps {
  title: string
  value: string
  onChange: (value: string) => void
  onRegenerate: () => void
  isRegenerating: boolean
}

export function MetadataCard({ title, value, onChange, onRegenerate, isRegenerating }: MetadataCardProps) {
  return (
    <Card className="glass rounded-3xl border-2 border-white/60 dark:border-white/20">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-base">{title}</CardTitle>
          <Button size="sm" variant="outline" onClick={onRegenerate} disabled={isRegenerating}>
            {isRegenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            Regenerate
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Textarea value={value} onChange={(e) => onChange(e.target.value)} className="min-h-[70px] resize-y" />
      </CardContent>
    </Card>
  )
}
