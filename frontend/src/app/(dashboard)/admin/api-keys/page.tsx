'use client'

import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import { SuperAdminGuard } from '@/components/guards'

type ProviderStatus = {
  provider: string
  label: string
  status: string
  baseUrl: string
  textModel: string
  imageModel: string
}

type ModelItem = { id: string; name?: string; contextLength?: number | null }
type ModelConfig = { textModel: string; imageModel: string; textProvider: string; imageProvider: string }
type ModelTestResult = { ok: boolean; status: number; latencyMs: number; message?: string }
type SmokeLiteResult = {
  ok: boolean
  status: string
  startedAt: string
  finishedAt: string
  checks: Array<{ step: string; ok: boolean; message: string }>
  fullSmokeCommand: string
  imageSmokeCommand: string
}

const errorMessage = (error: unknown, fallback: string) => error instanceof Error ? error.message : fallback

export default function AdminApiKeysPage() {
  const [status, setStatus] = useState<ProviderStatus[]>([])
  const [models, setModels] = useState<ModelItem[]>([])
  const [config, setConfig] = useState<ModelConfig | null>(null)
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testingModel, setTestingModel] = useState<string | null>(null)
  const [testResult, setTestResult] = useState<string>('')
  const [smokeLoading, setSmokeLoading] = useState(false)
  const [smokeResult, setSmokeResult] = useState<SmokeLiteResult | null>(null)

  const filteredModels = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return models
    return models.filter((model) => model.id.toLowerCase().includes(q) || model.name?.toLowerCase().includes(q))
  }, [models, query])

  async function loadAll() {
    setLoading(true)
    try {
      const [providerStatus, modelConfig, modelList] = await Promise.all([
        api.get<ProviderStatus[]>('/admin/settings/providers/status'),
        api.get<ModelConfig>('/admin/settings/models/config'),
        api.get<{ models: ModelItem[] }>('/admin/settings/providers/9router/models'),
      ])
      setStatus(providerStatus)
      setConfig(modelConfig)
      setModels(modelList.models || [])
    } catch (error: unknown) {
      toast.error(errorMessage(error, 'Gagal memuat admin config'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadAll() }, [])

  async function saveConfig() {
    if (!config) return
    setSaving(true)
    try {
      const saved = await api.post<ModelConfig>('/admin/settings/models/config', {
        textModel: config.textModel,
        imageModel: config.imageModel,
      })
      setConfig(saved)
      toast.success('Model config tersimpan')
      loadAll()
    } catch (error: unknown) {
      toast.error(errorMessage(error, 'Gagal simpan model config'))
    } finally {
      setSaving(false)
    }
  }

  async function testModel(modelId?: string, type: 'text' | 'image' = 'text') {
    const model = modelId || (type === 'image' ? config?.imageModel : config?.textModel)
    if (!model) return
    setTestingModel(model)
    setTestResult('')
    try {
      const result = await api.post<ModelTestResult>('/admin/settings/providers/9router/test', { model, type })
      setTestResult(`${result.ok ? 'OK' : 'FAILED'} · HTTP ${result.status} · ${result.latencyMs}ms · ${result.message || ''}`)
      if (result.ok) toast.success(`Model ${model} OK`)
      else toast.error(result.message || `Model ${model} gagal`)
    } catch (error: unknown) {
      const message = errorMessage(error, 'Test gagal')
      setTestResult(message)
      toast.error(message)
    } finally {
      setTestingModel(null)
    }
  }

  async function runSmokeLite() {
    setSmokeLoading(true)
    setSmokeResult(null)
    try {
      const result = await api.post<SmokeLiteResult>('/admin/settings/smoke/lite')
      setSmokeResult(result)
      if (result.ok) toast.success('Smoke lite passed')
      else toast.error('Smoke lite failed')
    } catch (error: unknown) {
      const message = errorMessage(error, 'Smoke lite gagal')
      toast.error(message)
    } finally {
      setSmokeLoading(false)
    }
  }

  return (
    <SuperAdminGuard>
      <main className="min-h-screen bg-slate-50 p-4 md:p-8 dark:bg-slate-950">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-blue-600">Super Admin</p>
            <h1 className="text-3xl font-black tracking-tight">Provider & Model Config</h1>
            <p className="text-sm text-slate-500">Kelola provider aktif, model text/image, dan test koneksi 9Router.</p>
          </div>
          <Button onClick={loadAll} disabled={loading}>{loading ? 'Memuat...' : 'Refresh'}</Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Status Provider</CardTitle>
            <CardDescription>Provider live yang dipakai fitur AI Contenly.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {status.map((provider) => (
              <div key={provider.provider} className="rounded-2xl border bg-white p-4 dark:bg-slate-900">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="font-bold">{provider.label}</h2>
                      <Badge variant={provider.status === 'configured' ? 'default' : 'destructive'}>{provider.status}</Badge>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">{provider.baseUrl}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => testModel(provider.textModel, 'text')} disabled={!!testingModel}>
                      {testingModel === provider.textModel ? 'Testing...' : 'Test Text Model'}
                    </Button>
                    <Button variant="outline" onClick={() => testModel(provider.imageModel, 'image')} disabled={!!testingModel}>
                      {testingModel === provider.imageModel ? 'Testing...' : 'Test Image Model'}
                    </Button>
                  </div>
                </div>
                <div className="mt-3 grid gap-2 text-sm md:grid-cols-2">
                  <div><span className="text-slate-500">Text:</span> <code>{provider.textModel}</code></div>
                  <div><span className="text-slate-500">Image:</span> <code>{provider.imageModel}</code></div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Smoke Test</CardTitle>
            <CardDescription>Run regression smoke-lite dari dashboard. Full publish/image smoke tetap via command.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={runSmokeLite} disabled={smokeLoading}>{smokeLoading ? 'Running...' : 'Run Smoke Lite'}</Button>
            {smokeResult && (
              <div className="space-y-3 rounded-2xl border bg-white p-4 text-sm dark:bg-slate-900">
                <div className="flex items-center gap-2">
                  <Badge variant={smokeResult.ok ? 'default' : 'destructive'}>{smokeResult.status}</Badge>
                  <span className="text-slate-500">{smokeResult.finishedAt}</span>
                </div>
                <div className="grid gap-2 md:grid-cols-3">
                  {smokeResult.checks.map((check) => (
                    <div key={check.step} className="rounded-xl bg-slate-100 p-3 dark:bg-slate-800">
                      <p className="font-bold">{check.ok ? '✅' : '❌'} {check.step}</p>
                      <p className="text-slate-500">{check.message}</p>
                    </div>
                  ))}
                </div>
                <div className="space-y-2 rounded-xl bg-slate-100 p-3 font-mono text-xs dark:bg-slate-800">
                  <p>{smokeResult.fullSmokeCommand}</p>
                  <p>{smokeResult.imageSmokeCommand}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Model Config</CardTitle>
            <CardDescription>Simpan model default untuk text generation dan image generation.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Text Generation Model</Label>
                <Input value={config?.textModel || ''} onChange={(e) => setConfig((prev) => prev ? { ...prev, textModel: e.target.value } : prev)} placeholder="cx/gpt-5.5" />
              </div>
              <div className="space-y-2">
                <Label>Image Generation Model</Label>
                <Input value={config?.imageModel || ''} onChange={(e) => setConfig((prev) => prev ? { ...prev, imageModel: e.target.value } : prev)} placeholder="cx/gpt-5.4-image" />
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={saveConfig} disabled={saving || !config}>{saving ? 'Menyimpan...' : 'Simpan Config'}</Button>
              <Button variant="outline" onClick={() => testModel(undefined, 'text')} disabled={!!testingModel || !config?.textModel}>{testingModel ? 'Testing...' : 'Test Text'}</Button>
              <Button variant="outline" onClick={() => testModel(undefined, 'image')} disabled={!!testingModel || !config?.imageModel}>{testingModel ? 'Testing...' : 'Test Image'}</Button>
            </div>
            {testResult && <p className="rounded-xl bg-slate-100 p-3 text-sm dark:bg-slate-900">{testResult}</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Model List</CardTitle>
            <CardDescription>{models.length} model dari 9Router.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cari model..." />
            <div className="max-h-[460px] space-y-2 overflow-y-auto pr-1">
              {filteredModels.map((model) => {
                const isImage = model.id.toLowerCase().includes('image') || model.id.toLowerCase().includes('midjourney') || model.id.toLowerCase().includes('dall-e');
                return (
                  <div key={model.id} className="flex items-center justify-between gap-3 rounded-xl border bg-white p-3 dark:bg-slate-900">
                    <div className="min-w-0">
                      <p className="truncate font-mono text-sm font-bold">{model.id}</p>
                      {model.contextLength && <p className="text-xs text-slate-500">Context: {model.contextLength.toLocaleString()}</p>}
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <Button size="sm" variant="outline" onClick={() => setConfig((prev) => prev ? { ...prev, [isImage ? 'imageModel' : 'textModel']: model.id } : prev)}>
                        Use {isImage ? 'Image' : 'Text'}
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => testModel(model.id, isImage ? 'image' : 'text')} disabled={!!testingModel}>
                        {testingModel === model.id ? 'Testing...' : 'Test'}
                      </Button>
                    </div>
                  </div>
                );
              })}
              {!loading && filteredModels.length === 0 && <p className="py-8 text-center text-sm text-slate-500">Model tidak ditemukan.</p>}
            </div>
          </CardContent>
        </Card>
      </div>
      </main>
    </SuperAdminGuard>
  )
}
