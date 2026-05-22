'use client'

import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { Loader2, Download, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { API_BASE_URL } from './types'

const STORAGE_KEY = 'contenly:active-render-jobs'

export type ActiveRenderJob = {
  jobId: string
  projectId: string
  projectTitle: string
  startedAt: number
}

export function readActiveJobs(): ActiveRenderJob[] {
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

export function writeActiveJobs(jobs: ActiveRenderJob[]) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(jobs))
  } catch {
    /* ignore */
  }
}

export function addActiveJob(job: ActiveRenderJob) {
  const jobs = readActiveJobs()
  jobs.push(job)
  writeActiveJobs(jobs)
  window.dispatchEvent(new CustomEvent('contenly:render-jobs-changed'))
}

export function removeActiveJob(jobId: string) {
  const jobs = readActiveJobs().filter((j) => j.jobId !== jobId)
  writeActiveJobs(jobs)
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('contenly:render-jobs-changed'))
  }
}

interface RenderJobsTrackerProps {
  filterProjectId?: string
}

export function RenderJobsTracker({ filterProjectId }: RenderJobsTrackerProps) {
  const [jobs, setJobs] = useState<ActiveRenderJob[]>([])
  const [progressMap, setProgressMap] = useState<Record<string, { status: string; progress: number }>>({})
  const pollersRef = useRef<Record<string, NodeJS.Timeout>>({})

  // Load from storage + listen to changes
  useEffect(() => {
    const sync = () => setJobs(readActiveJobs())
    sync()
    const handler = () => sync()
    window.addEventListener('contenly:render-jobs-changed', handler)
    window.addEventListener('storage', handler)
    return () => {
      window.removeEventListener('contenly:render-jobs-changed', handler)
      window.removeEventListener('storage', handler)
    }
  }, [])

  // Start polling for each tracked job
  useEffect(() => {
    const visibleJobs = filterProjectId ? jobs.filter((j) => j.projectId === filterProjectId) : jobs
    for (const job of visibleJobs) {
      if (pollersRef.current[job.jobId]) continue
      pollersRef.current[job.jobId] = setInterval(async () => {
        try {
          const res = await fetch(`${API_BASE_URL}/motion-graphics/jobs/${job.jobId}`, { credentials: 'include' })
          if (!res.ok) {
            // 404 → job gone, drop
            if (res.status === 404) {
              clearInterval(pollersRef.current[job.jobId])
              delete pollersRef.current[job.jobId]
              removeActiveJob(job.jobId)
            }
            return
          }
          const data = await res.json()
          setProgressMap((prev) => ({ ...prev, [job.jobId]: { status: data.status, progress: data.progress || 0 } }))

          if (data.status === 'completed') {
            clearInterval(pollersRef.current[job.jobId])
            delete pollersRef.current[job.jobId]
            toast.success(`Render selesai: "${job.projectTitle}"`, {
              duration: 10000,
              action: {
                label: 'Download',
                onClick: () => downloadJob(job),
              },
            })
            removeActiveJob(job.jobId)
          } else if (data.status === 'failed' || data.status === 'timeout') {
            clearInterval(pollersRef.current[job.jobId])
            delete pollersRef.current[job.jobId]
            toast.error(`Render gagal: "${job.projectTitle}"`, { description: data.error || 'Unknown error' })
            removeActiveJob(job.jobId)
          }
        } catch {
          /* network error, retry */
        }
      }, 4000)
    }
    // Cleanup pollers when jobs disappear
    return () => {
      // intentionally no cleanup here; pollers are cleared on completion
    }
  }, [jobs, filterProjectId])

  // Cleanup all pollers on unmount
  useEffect(() => {
    return () => {
      Object.values(pollersRef.current).forEach(clearInterval)
      pollersRef.current = {}
    }
  }, [])

  const downloadJob = async (job: ActiveRenderJob) => {
    try {
      const res = await fetch(`${API_BASE_URL}/motion-graphics/jobs/${job.jobId}/download`, { credentials: 'include' })
      if (!res.ok) throw new Error('Gagal download')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${job.projectTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.mp4`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch {
      toast.error('Gagal download render output')
    }
  }

  const handleCancel = (jobId: string) => {
    if (pollersRef.current[jobId]) clearInterval(pollersRef.current[jobId])
    delete pollersRef.current[jobId]
    removeActiveJob(jobId)
  }

  const visibleJobs = filterProjectId ? jobs.filter((j) => j.projectId === filterProjectId) : jobs
  if (visibleJobs.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80 space-y-2">
      {visibleJobs.map((job) => {
        const prog = progressMap[job.jobId]
        const status = prog?.status || 'queued'
        const progress = prog?.progress || 0
        return (
          <div
            key={job.jobId}
            className="rounded-2xl border-2 border-white/60 bg-white/95 p-3 shadow-xl backdrop-blur dark:bg-slate-900/95 dark:border-white/10"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Render Video</p>
                <p className="truncate text-sm font-bold text-slate-900 dark:text-white">{job.projectTitle}</p>
              </div>
              <button
                onClick={() => handleCancel(job.jobId)}
                className="text-slate-400 hover:text-red-500"
                title="Hapus dari tracking (job tetap jalan di server)"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-2 flex items-center gap-2">
              {status === 'completed' ? (
                <Button size="sm" variant="outline" onClick={() => downloadJob(job)} className="h-7 px-2 text-xs">
                  <Download className="mr-1 h-3 w-3" /> Download
                </Button>
              ) : (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-600" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      <span>{status}</span>
                      <span>{progress}%</span>
                    </div>
                    <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full bg-gradient-to-r from-pink-500 to-purple-600 transition-all duration-500"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
