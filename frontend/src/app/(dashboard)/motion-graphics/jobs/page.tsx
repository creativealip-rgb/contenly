'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loader2, Download, Clock, CheckCircle2, XCircle, RefreshCw, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api/v1'

type RenderJob = {
  id: string
  type: string
  status: 'queued' | 'processing' | 'completed' | 'failed' | 'timeout'
  input: any
  outputFormat: string | null
  tokensCost: number
  error: string | null
  progress: number
  createdAt: string
  startedAt: string | null
  completedAt: string | null
}

const statusConfig = {
  queued: { icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-100', label: 'Queued' },
  processing: { icon: Loader2, color: 'text-blue-600', bg: 'bg-blue-100', label: 'Processing' },
  completed: { icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-100', label: 'Completed' },
  failed: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-100', label: 'Failed' },
  timeout: { icon: XCircle, color: 'text-orange-600', bg: 'bg-orange-100', label: 'Timeout' },
}

export default function RenderJobsPage() {
  const [jobs, setJobs] = useState<RenderJob[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchJobs = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/motion-graphics/jobs`, { credentials: 'include' })
      if (res.ok) setJobs(await res.json())
    } catch { /* silent */ }
    finally { setIsLoading(false) }
  }

  useEffect(() => { fetchJobs() }, [])

  // Auto-refresh if any jobs are in progress
  useEffect(() => {
    const hasActive = jobs.some((j) => j.status === 'queued' || j.status === 'processing')
    if (!hasActive) return
    const interval = setInterval(fetchJobs, 4000)
    return () => clearInterval(interval)
  }, [jobs])

  const handleDownload = async (jobId: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/motion-graphics/jobs/${jobId}/download`, { credentials: 'include' })
      if (!res.ok) throw new Error('File expired')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `render-${jobId.slice(0, 8)}.mp4`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (e: any) {
      toast.error(e.message || 'Download gagal')
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-4xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/motion-graphics">
            <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Render Jobs</h1>
            <p className="text-sm text-slate-500">{jobs.length} total jobs</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={fetchJobs}>
          <RefreshCw className="h-3 w-3 mr-1" /> Refresh
        </Button>
      </div>

      {jobs.length === 0 ? (
        <div className="text-center py-16 text-slate-500">
          <p>Belum ada render jobs. Buat render dari Motion Graphics Studio.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {jobs.map((job) => {
            const cfg = statusConfig[job.status]
            const Icon = cfg.icon
            const duration = job.completedAt && job.startedAt
              ? Math.round((new Date(job.completedAt).getTime() - new Date(job.startedAt).getTime()) / 1000)
              : null
            return (
              <Card key={job.id}>
                <CardContent className="flex items-center justify-between py-4 px-5">
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-lg ${cfg.bg}`}>
                      <Icon className={`h-5 w-5 ${cfg.color} ${job.status === 'processing' ? 'animate-spin' : ''}`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm capitalize">{job.type} render</p>
                        <Badge variant="secondary" className="text-[10px]">{job.outputFormat || 'mp4'}</Badge>
                      </div>
                      <p className="text-xs text-slate-500">
                        {new Date(job.createdAt).toLocaleString('id-ID')}
                        {duration !== null && ` • ${duration}s`}
                        {' • '}{job.tokensCost} tokens
                      </p>
                      {job.error && <p className="text-xs text-red-500 mt-0.5">{job.error}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {job.status === 'completed' && (
                      <Button size="sm" onClick={() => handleDownload(job.id)}>
                        <Download className="h-3 w-3 mr-1" /> Download
                      </Button>
                    )}
                    {(job.status === 'queued' || job.status === 'processing') && (
                      <Badge className={cfg.bg + ' ' + cfg.color + ' border-0'}>{cfg.label}</Badge>
                    )}
                    {(job.status === 'failed' || job.status === 'timeout') && (
                      <Badge variant="destructive">{cfg.label}</Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
