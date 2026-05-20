'use client'

import { Button } from '@/components/ui/button'
import { AlertCircle } from 'lucide-react'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center p-8">
      <div className="p-4 bg-red-50 rounded-full">
        <AlertCircle className="h-10 w-10 text-red-500" />
      </div>
      <h2 className="text-xl font-bold">Terjadi Kesalahan</h2>
      <p className="text-sm text-muted-foreground max-w-md">
        {error.message || 'Halaman mengalami error. Silakan coba lagi.'}
      </p>
      <Button onClick={reset} variant="outline">
        Coba Lagi
      </Button>
    </div>
  )
}
