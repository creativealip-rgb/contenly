'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { toast } from 'sonner'
import { CheckCircle2, Download, Loader2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { API_BASE_URL, type ActiveExportJob } from './types'

const STORAGE_KEY = 'contenly:video-clip-export-jobs'

export function readActiveExports(): ActiveExportJob[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function writeActiveExports(jobs: ActiveExportJob[]) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(jobs))
  } catch {
    /* ignore */
  }
}

export function addActiveExport(job: ActiveExportJob) {
  const jobs = readActiveExports()
  jobs.push(job)
  writeActiveExports(jobs)
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('contenly:clip-exports-changed'))
}

export function removeActiveExport(jobId: string) {
  const jobs = readActiveExports().filter((j) => j.jobId !== jobId)
  writeActiveExports(jobs)
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('contenly:clip-exports-changed'))
}

interface ExportJobsTrackerProps {
  filterProjectId?: string
  onCompleted?: (jobId: string) => void
}

interface JobLocalState {
  status: 'pending' | 'completed' | 'failed'
  found: boolean
}

export function ExportJobsTracker({ filterProjectId, onCompleted }: ExportJobsTrackerProps) {
  const [jobs, setJobs] = useState<ActiveExportJob[]>([])
  const [localState, setLocalState] = useState<Record<string, JobLocalState>>({})
  const pollersRef = useRef<Record<string, NodeJS.Timeout>>({})

  const sync = useCallback(() => setJobs(readActiveExports()), [])

  useEffect(() => {
    sync()
    const handler = () => sync()
    window.addEventListener('contenly:clip-exports-changed', handler)
    window.addEventListener('storage', handler)
    return () => {
      window.removeEventListener('contenly:clip-exports-changed', handler)
      window.removeEventListener('storage', handler)
    }
  }, [sync])

  useEffect(() => {
    const visible = filterProjectId ? jobs.filter((j) => j.projectId === filterProjectId) : jobs
    for (const job of visible) {
      if (pollersRef.current[job.jobId]) continue
      pollersRef.current[job.jobId] = setInterval(async () => {
        try {
          const res = await fetch(`${API_BASE_URL}/video-clips/${job.projectId}`, { credentials: 'include' })
          if (!res.ok) return
          const project = await res.json()
          const exports = (project.exports || []) as Array<{ jobId: string }>
          const found = exports.some((e) => e.jobId === job.jobId)
          if (found) {
            clearInterval(pollersRef.current[job.jobId])
            delete pollersRef.current[job.jobId]
            setLocalState((prev) => ({ ...prev, [job.jobId]: { status: 'completed', found: true } }))
            toast.success(`Clip "${job.hookTitle}" siap di-download`, {
              duration: 10000,
              action: { label: 'Download', onClick: () => downloadJob(job) },
            })
            onCompleted?.(job.jobId)
            // Auto-remove after 30s so it doesn't pile up
            setTimeout(() => removeActiveExport(job.jobId), 30000)
          } else {
            // Try detect failed via project.error?
            // Job age timeout: 10 min
            if (Date.now() - job.startedAt > 10 * 60 * 1000) {
              clearInterval(pollersRef.current[job.jobId])
              delete pollersRef.current[job.jobId]
              setLocalState((prev) => ({ ...prev, [job.jobId]: { status: 'failed', found: false } }))
              toast.error(`Export "${job.hookTitle}" timeout`)
              removeActiveExport(job.jobId)
            }
          }
        } catch {
          /* retry */
        }
      }, 4000)
    }
  }, [jobs, filterProjectId, onCompleted])

  useEffect(() => {
    return () => {
      Object.values(pollersRef.current).forEach(clearInterval)
      pollersRef.current = {}
    }
  }, [])

  const downloadJob = async (job: ActiveExportJob) => {
    try {
      const res = await fetch(`${API_BASE_URL}/video-clips/${job.projectId}/download/${job.jobId}`, { credentials: 'include' })
      if (!res.ok) throw new Error('Gagal download')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${job.hookTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'clip'}.mp4`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch {
      toast.error('Gagal download clip')
    }
  }

  const handleCancel = (jobId: string) => {
    if (pollersRef.current[jobId]) clearInterval(pollersRef.current[jobId])
    delete pollersRef.current[jobId]
    removeActiveExport(jobId)
  }

  const visibleJobs = filterProjectId ? jobs.filter((j) => j.projectId === filterProjectId) : jobs
  if (visibleJobs.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80 space-y-2">
      {visibleJobs.map((job) => {
        const state = localState[job.jobId]
        const isCompleted = state?.status === 'completed'
        const elapsed = Math.floor((Date.now() - job.startedAt) / 1000)
        return (
          <div
            key={job.jobId}
            className="rounded-2xl border-2 border-white/60 bg-white/95 p-3 shadow-xl backdrop-blur dark:bg-slate-900/95 dark:border-white/10"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Export Clip</p>
                <p className="truncate text-sm font-bold text-slate-900 dark:text-white">{job.hookTitle}</p>
              </div>
              <button
                onClick={() => handleCancel(job.jobId)}
                className="text-slate-400 hover:text-red-500"
                title="Hapus dari tracking"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-2 flex items-center gap-2">
              {isCompleted ? (
                <Button size="sm" variant="outline" onClick={() => downloadJob(job)} className="h-7 px-2 text-xs gap-1">
                  <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                  <Download className="h-3 w-3" /> Download
                </Button>
              ) : (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-600" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Rendering... ({elapsed}s)
                  </span>
                </>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
