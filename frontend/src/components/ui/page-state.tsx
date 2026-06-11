'use client'

import type { ReactNode } from 'react'
import { AlertTriangle, Inbox, Loader2, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

interface PageStateProps {
  title: string
  description?: string
  action?: ReactNode
  icon?: ReactNode
  className?: string
}

export function EmptyState({ title, description, action, icon, className }: PageStateProps) {
  return (
    <Card className={className}>
      <CardContent className="flex flex-col items-center justify-center gap-3 py-12 text-center">
        <div className="rounded-full bg-slate-100 p-3 text-slate-500 dark:bg-slate-800 dark:text-slate-300">
          {icon ?? <Inbox className="h-6 w-6" />}
        </div>
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">{title}</h3>
          {description && <p className="max-w-md text-sm text-slate-500 dark:text-slate-400">{description}</p>}
        </div>
        {action}
      </CardContent>
    </Card>
  )
}

interface ErrorStateProps extends PageStateProps {
  onRetry?: () => void
  retryLabel?: string
}

export function ErrorState({
  title,
  description,
  action,
  icon,
  onRetry,
  retryLabel = 'Coba lagi',
  className,
}: ErrorStateProps) {
  return (
    <Card className={className}>
      <CardContent className="flex flex-col items-center justify-center gap-3 py-12 text-center">
        <div className="rounded-full bg-red-100 p-3 text-red-600 dark:bg-red-950/40 dark:text-red-300">
          {icon ?? <AlertTriangle className="h-6 w-6" />}
        </div>
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">{title}</h3>
          {description && <p className="max-w-md text-sm text-slate-500 dark:text-slate-400">{description}</p>}
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          {onRetry && (
            <Button size="sm" variant="outline" onClick={onRetry} className="rounded-xl">
              <RefreshCw className="mr-2 h-4 w-4" />
              {retryLabel}
            </Button>
          )}
          {action}
        </div>
      </CardContent>
    </Card>
  )
}

export function InlineLoadingState({ label = 'Memuat data...' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-12 text-sm text-slate-500">
      <Loader2 className="h-5 w-5 animate-spin" />
      {label}
    </div>
  )
}

export function TableSkeleton({ rows = 5, columns = 5 }: { rows?: number; columns?: number }) {
  return (
    <div className="space-y-3 py-2">
      {Array.from({ length: rows }).map((_, row) => (
        <div key={row} className="grid gap-3" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
          {Array.from({ length: columns }).map((__, column) => (
            <Skeleton key={column} className="h-8 rounded-xl" />
          ))}
        </div>
      ))}
    </div>
  )
}
