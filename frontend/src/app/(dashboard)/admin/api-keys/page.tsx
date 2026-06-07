'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { motion } from 'framer-motion'
import { Key, Save, Trash2, Eye, EyeOff, Loader2, CheckCircle2, XCircle, ExternalLink, ShieldCheck, Cookie, RefreshCw, Info, Zap, Server, Globe, Wifi, WifiOff, Clock, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import { containerVariants, itemVariants } from '@/lib/animations'

export default function ApiKeysPage() {
    const searchParams = useSearchParams()
    const initialTab = searchParams.get('tab') || 'status'
    const [customProviders, setCustomProviders] = useState<any[]>([])
    const [keys, setKeys] = useState<Record<string, string>>({})
    const [showKeys, setShowKeys] = useState<Record<string, boolean>>({})
    const [saving, setSaving] = useState<string | null>(null)
    const [validating, setValidating] = useState<string | null>(null)
    const [keyStatus, setKeyStatus] = useState<Record<string, { valid: boolean; error?: string }>>({})

    const [cookieStatus, setCookieStatus] = useState<Record<string, any>>({})
    const [cookieInput, setCookieInput] = useState<Record<string, string>>({})
    const [savingCookie, setSavingCookie] = useState<string | null>(null)
    const [testingCookie, setTestingCookie] = useState<string | null>(null)
    const [showInstructions, setShowInstructions] = useState<Record<string, boolean>>({})

    const [providerStatuses, setProviderStatuses] = useState<any[]>([])
    const [testingProvider, setTestingProvider] = useState<string | null>(null)
    const [testingAll, setTestingAll] = useState(false)
    const [connectionResults, setConnectionResults] = useState<Record<string, any>>({})
    const [availableModels, setAvailableModels] = useState<Record<string, string[]>>({})
    const [loadingModels, setLoadingModels] = useState<Record<string, boolean>>({})
    const [modelTestResults, setModelTestResults] = useState<Record<string, { ok?: boolean; status: string; latency?: number; latencyMs?: number; error?: string }>>({})
    const [testingModel, setTestingModel] = useState<string | null>(null)
    const [modelSearch, setModelSearch] = useState('')

    const [showAddForm, setShowAddForm] = useState(false)
    const [savingCustom, setSavingCustom] = useState(false)
    const [newProvider, setNewProvider] = useState({ label: '', baseUrl: '', models: '', apiKey: '' })

    // Model config state
    const [modelConfig, setModelConfig] = useState<any>({})
    const [savingModelConfig, setSavingModelConfig] = useState(false)
    const [modelSearchConfig, setModelSearchConfig] = useState('')

    useEffect(() => {
        loadKeys()
        loadCookieStatuses()
        loadCustomProviders()
        loadProviderStatuses()
        loadModelConfig()
    }, [])

    async function loadModelConfig() {
        try {
            const data: any = await api.get('/admin/settings/models/config')
            setModelConfig(data)
        } catch (e) { /* ignore */ }
    }

    async function saveModelConfig() {
        setSavingModelConfig(true)
        try {
            await api.post('/admin/settings/models/config', {
                textModel: modelConfig.textModel,
                imageModel: modelConfig.imageModel,
            })
            toast.success('Model configuration saved!')
        } catch (e: any) {
            toast.error(e.message || 'Failed to save model config')
        } finally { setSavingModelConfig(false) }
    }

    useEffect(() => {
        providerStatuses.forEach(p => {
            if (p.status === 'configured' && !availableModels[p.provider] && !loadingModels[p.provider]) {
                loadModels(p.provider)
            }
        })
    }, [providerStatuses])

    async function loadCustomProviders() {
        try {
            const rows: any[] = await api.get('/admin/settings/custom-providers')
            setCustomProviders(rows || [])
        } catch (e) { /* ignore */ }
    }

    async function loadKeys() {
        try {
            const settings: any[] = await api.get('/admin/settings?category=api-keys')
            const mapped: Record<string, string> = {}
            const statuses: Record<string, { valid: boolean }> = {}
            settings.forEach((s: any) => {
                const provider = s.key.replace('api_key_', '')
                if (s.value) {
                    mapped[provider] = '\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022'
                    statuses[provider] = { valid: true }
                }
            })
            setKeys(mapped)
            setKeyStatus(statuses)
        } catch (e) { /* ignore */ }
    }

    async function loadCookieStatuses() {
        try {
            const status: any = await api.get('/admin/settings/cookie/youtube/status')
            setCookieStatus({ youtube: status })
        } catch (e) { /* ignore */ }
    }

    async function loadProviderStatuses() {
        try {
            const data: any[] = await api.get('/admin/settings/providers/status')
            setProviderStatuses(data)
        } catch (e) { /* ignore */ }
    }

    async function loadModels(provider: string) {
        setLoadingModels(prev => ({ ...prev, [provider]: true }))
        try {
            const result: any = await api.get(`/admin/settings/providers/${provider}/models`)
            if (result.models?.length) {
                setAvailableModels(prev => ({ ...prev, [provider]: result.models.map((m: any) => m.id || m) }))
            }
        } catch (e) { /* ignore */ }
        finally { setLoadingModels(prev => ({ ...prev, [provider]: false })) }
    }

    async function testConnection(provider: string) {
        setTestingProvider(provider)
        try {
            const result: any = await api.post(`/admin/settings/providers/${provider}/test`)
            setConnectionResults(prev => ({ ...prev, [provider]: result }))
            if (result.ok) {
                toast.success(`${provider}: OK (${result.latencyMs}ms, ${result.model})`)
                loadModels(provider)
            } else {
                toast.error(`${provider}: ${result.message || result.error || 'Failed'}`)
            }
        } catch (e: any) {
            toast.error(`${provider}: ${e.message}`)
        } finally { setTestingProvider(null) }
    }

    async function testAllProviders() {
        setTestingAll(true)
        const configured = providerStatuses.filter(p => p.status === 'configured')
        for (const p of configured) {
            await testConnection(p.provider)
        }
        setTestingAll(false)
    }

    async function testSingleModel(provider: string, model: string) {
        const key = `${provider}:${model}`
        setTestingModel(key)
        try {
            const result: any = await api.post(`/admin/settings/providers/${provider}/test`, { model })
            setModelTestResults(prev => ({ ...prev, [key]: result }))
            if (result.ok) {
                toast.success(`${model}: OK (${result.latencyMs}ms)`)
            } else {
                toast.error(`${model}: ${result.message || 'Failed'}`)
            }
        } catch (e: any) {
            setModelTestResults(prev => ({ ...prev, [key]: { status: 'error', error: e.message } }))
            toast.error(`${model}: ${e.message}`)
        } finally { setTestingModel(null) }
    }

    async function testAllModels(provider: string) {
        const models = availableModels[provider] || []
        if (!models.length) { toast.error('No models loaded'); return }
        setTestingAll(true)
        let ok = 0, fail = 0
        for (const model of models) {
            const key = `${provider}:${model}`
            setTestingModel(key)
            try {
                const result: any = await api.post(`/admin/settings/providers/${provider}/test`, { model })
                setModelTestResults(prev => ({ ...prev, [key]: result }))
                if (result.status === 'ok') ok++; else fail++
            } catch (e: any) {
                setModelTestResults(prev => ({ ...prev, [key]: { status: 'error', error: e.message } }))
                fail++
            }
        }
        setTestingModel(null)
        setTestingAll(false)
        toast.success(`Selesai: ${ok} OK, ${fail} gagal dari ${models.length} model`)
    }

    async function validateKey(provider: string, apiKey: string) {
        setValidating(provider)
        try {
            const cp = customProviders.find((p: any) => p.key.replace('custom_provider_', '') === provider)
            let baseUrl: string | undefined
            if (cp?.value) { try { baseUrl = JSON.parse(cp.value).baseUrl } catch {} }
            const result: any = await api.post('/admin/settings/validate', { provider, apiKey, baseUrl })
            setKeyStatus(prev => ({ ...prev, [provider]: result }))
            if (result.valid) {
                toast.success(`${provider} key valid! ${result.modelCount} models available`)
            } else {
                toast.error(`${provider} key invalid: ${result.error}`)
            }
            return result.valid
        } catch (e: any) {
            setKeyStatus(prev => ({ ...prev, [provider]: { valid: false, error: e.message } }))
            toast.error(e.message || 'Validation failed')
            return false
        } finally { setValidating(null) }
    }

    async function saveKey(provider: string, value: string) {
        setSaving(provider)
        try {
            const isValid = await validateKey(provider, value)
            if (!isValid) { setSaving(null); return }
            await api.post('/admin/settings', {
                key: `api_key_${provider}`, value, encrypted: true, category: 'api-keys', description: `${provider} API key`,
            })
            toast.success(`${provider} key saved & validated`)
            loadKeys()
            loadProviderStatuses()
        } catch (e: any) { toast.error(e.message || 'Failed to save') }
        finally { setSaving(null) }
    }

    async function deleteCustomProvider(id: string) {
        try {
            await api.delete(`/admin/settings/custom-provider/${id}`)
            setCustomProviders(prev => prev.filter((p: any) => p.key !== id))
            toast.success('Provider dihapus')
            loadProviderStatuses()
        } catch (e: any) { toast.error(e.message || 'Gagal menghapus') }
    }

    async function saveCookies() {
        const cookies = cookieInput['youtube']
        if (!cookies) { toast.error('Paste YouTube cookies dulu'); return }
        setSavingCookie('youtube')
        try {
            const result: any = await api.post('/admin/settings/cookie/youtube/save', { cookies })
            toast.success(result.message || 'YouTube cookies saved!')
            setCookieInput(prev => ({ ...prev, youtube: '' }))
            loadCookieStatuses()
        } catch (e: any) { toast.error(e.message || 'Failed to save') }
        finally { setSavingCookie(null) }
    }

    async function testCookies() {
        setTestingCookie('youtube')
        try {
            const result: any = await api.post('/admin/settings/cookie/youtube/test')
            if (result.valid) {
                toast.success(`YouTube cookies valid! (${result.latency}ms)`)
            } else {
                toast.error(`YouTube cookies invalid: ${result.error}`)
            }
        } catch (e: any) { toast.error(e.message || 'Test failed') }
        finally { setTestingCookie(null) }
    }

    async function deleteCookies() {
        try {
            await api.delete('/admin/settings/cookie/youtube')
            setCookieStatus(prev => ({ ...prev, youtube: { connected: false } }))
            toast.success('YouTube cookies removed')
        } catch (e: any) { toast.error(e.message || 'Failed to delete') }
    }

    async function saveCustomProvider() {
        const { label, baseUrl, models, apiKey } = newProvider
        if (!label.trim() || !baseUrl.trim()) {
            toast.error('Nama dan Base URL wajib diisi')
            return
        }
        setSavingCustom(true)
        try {
            await api.post('/admin/settings/custom-provider', {
                label: label.trim(),
                baseUrl: baseUrl.trim(),
                models: models.split(',').map(m => m.trim()).filter(Boolean),
                apiKey: apiKey.trim() || undefined,
            })
            toast.success(`Provider "${label}" ditambahkan`)
            setNewProvider({ label: '', baseUrl: '', models: '', apiKey: '' })
            setShowAddForm(false)
            await loadCustomProviders()
            await loadKeys()
            await loadProviderStatuses()
        } catch (e: any) { toast.error(e.message || 'Gagal menyimpan provider') }
        finally { setSavingCustom(false) }
    }

    function getModelTestBadge(provider: string, model: string) {
        const key = `${provider}:${model}`
        const result = modelTestResults[key]
        if (testingModel === key) return <Badge variant="outline" className="text-xs gap-1"><Loader2 className="w-3 h-3 animate-spin" /> Testing</Badge>
        if (!result) return null
        if (result.ok) return <Badge className="bg-green-600 text-xs gap-1"><CheckCircle2 className="w-3 h-3" /> {result.latencyMs || result.latency}ms</Badge>
        return <Badge variant="destructive" className="text-xs gap-1"><XCircle className="w-3 h-3" /> Error</Badge>
    }

    const filteredModels = (provider: string) => {
        const models = availableModels[provider] || []
        if (!modelSearch) return models
        return models.filter(m => m.toLowerCase().includes(modelSearch.toLowerCase()))
    }

    const configuredProviders = providerStatuses.filter(p => p.status === 'configured' && p.provider !== 'youtube')
    const totalModels = Object.values(availableModels).reduce((sum, m) => sum + m.length, 0)

    return (
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold flex items-center gap-2"><Key className="w-6 h-6" /> Kunci API</h1>
                <p className="text-muted-foreground">Kelola provider AI dan YouTube cookies</p>
            </div>

            <Tabs value={initialTab} onValueChange={(v) => { const url = new URL(window.location.href); url.searchParams.set("tab", v); window.history.replaceState({}, "", url); }}>
                <TabsList>
                    <TabsTrigger value="status">Status &amp; Models</TabsTrigger>
                    <TabsTrigger value="keys">Provider</TabsTrigger>
                    <TabsTrigger value="models">Model Config</TabsTrigger>
                    <TabsTrigger value="youtube">YouTube Cookies</TabsTrigger>
                </TabsList>

                {/* ===== STATUS & MODELS TAB ===== */}
                <TabsContent value="status" className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <Card>
                            <CardContent className="p-4 flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                                    <Server className="w-5 h-5 text-green-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">{configuredProviders.length}</p>
                                    <p className="text-xs text-muted-foreground">Provider Aktif</p>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-4 flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                                    <Zap className="w-5 h-5 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">{totalModels}</p>
                                    <p className="text-xs text-muted-foreground">Total Models</p>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-4 flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                                    <Clock className="w-5 h-5 text-purple-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">
                                        {connectionResults[configuredProviders[0]?.provider]?.latency || '\u2014'}ms
                                    </p>
                                    <p className="text-xs text-muted-foreground">Latency</p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="flex gap-2">
                        <Button onClick={testAllProviders} disabled={testingAll} className="gap-2">
                            {testingAll ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wifi className="w-4 h-4" />}
                            Test Semua Koneksi
                        </Button>
                        {configuredProviders.length > 0 && (
                            <Button variant="outline" onClick={() => configuredProviders.forEach(p => testAllModels(p.provider))} disabled={testingAll} className="gap-2">
                                {testingAll ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                                Test Semua Model
                            </Button>
                        )}
                    </div>

                    {configuredProviders.map((p) => {
                        const result = connectionResults[p.provider]
                        const models = filteredModels(p.provider)
                        const isLoading = loadingModels[p.provider]
                        return (
                            <Card key={p.provider}>
                                <CardHeader className="pb-3">
                                    <div className="flex items-center justify-between flex-wrap gap-2">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-3 h-3 rounded-full ${result?.status === 'ok' ? 'bg-green-500' : result?.status === 'error' ? 'bg-red-500' : 'bg-yellow-500'}`} />
                                            <div>
                                                <CardTitle className="text-base flex items-center gap-2">
                                                    {p.label}
                                                    {p.custom && <Badge variant="outline" className="text-xs"><Server className="w-3 h-3 mr-1" /> Custom</Badge>}
                                                </CardTitle>
                                                <CardDescription className="flex items-center gap-2">
                                                    {p.baseUrl && <span className="font-mono text-xs">{p.baseUrl}</span>}
                                                    {result?.status === 'ok' && (
                                                        <span className="text-green-600 text-xs flex items-center gap-1">
                                                            <Wifi className="w-3 h-3" /> {result.latency}ms · {result.modelCount} models
                                                        </span>
                                                    )}
                                                </CardDescription>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button size="sm" variant="outline" onClick={() => testConnection(p.provider)} disabled={testingProvider === p.provider} className="gap-1">
                                                {testingProvider === p.provider ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wifi className="w-3 h-3" />}
                                                Test Koneksi
                                            </Button>
                                            <Button size="sm" variant="outline" onClick={() => testAllModels(p.provider)} disabled={testingAll} className="gap-1">
                                                <Zap className="w-3 h-3" /> Test Semua
                                            </Button>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    {models.length > 10 && (
                                        <div className="mb-3">
                                            <Input
                                                placeholder="Cari model..."
                                                value={modelSearch}
                                                onChange={(e) => setModelSearch(e.target.value)}
                                                className="h-8 text-sm"
                                            />
                                        </div>
                                    )}
                                    {isLoading ? (
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground py-8 justify-center">
                                            <Loader2 className="w-4 h-4 animate-spin" /> Loading models...
                                        </div>
                                    ) : models.length > 0 ? (
                                        <div className="space-y-0.5 max-h-[500px] overflow-y-auto">
                                            {models.map((model: string) => {
                                                const key = `${p.provider}:${model}`
                                                return (
                                                    <div key={model} className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-muted/50 group">
                                                        <div className="flex items-center gap-2 min-w-0">
                                                            <code className="text-xs font-mono truncate">{model}</code>
                                                            {getModelTestBadge(p.provider, model)}
                                                        </div>
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            className="h-6 px-2 opacity-0 group-hover:opacity-100 transition-opacity gap-1 text-xs shrink-0"
                                                            onClick={() => testSingleModel(p.provider, model)}
                                                            disabled={testingModel === key}
                                                        >
                                                            {testingModel === key ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
                                                            Test
                                                        </Button>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-muted-foreground text-center py-4">
                                            {result?.status === 'ok' ? 'Tidak ada model' : 'Klik "Test Koneksi" untuk memuat model'}
                                        </p>
                                    )}
                                    {result?.status === 'error' && (
                                        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-600">
                                            <XCircle className="w-4 h-4 inline mr-1" /> {result.error}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )
                    })}

                    {configuredProviders.length === 0 && (
                        <Card>
                            <CardContent className="py-8 text-center text-muted-foreground">
                                <WifiOff className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                <p>Belum ada provider yang dikonfigurasi</p>
                                <p className="text-xs mt-1">Tambahkan provider di tab "Provider"</p>
                            </CardContent>
                        </Card>
                    )}

                    {providerStatuses.filter(p => p.status !== 'configured' && p.provider !== 'youtube').length > 0 && (
                        <div className="pt-2">
                            <p className="text-xs text-muted-foreground mb-2">Belum dikonfigurasi:</p>
                            <div className="flex flex-wrap gap-2">
                                {providerStatuses.filter(p => p.status !== 'configured' && p.provider !== 'youtube').map(p => (
                                    <Badge key={p.provider} variant="secondary" className="gap-1">
                                        <WifiOff className="w-3 h-3" /> {p.label}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    )}
                </TabsContent>

                {/* ===== PROVIDER TAB ===== */}
                <TabsContent value="keys" className="space-y-4">
                    {/* Built-in providers */}
                    {providerStatuses.filter(p => p.provider !== 'youtube').map((p) => (
                        <Card key={p.provider}>
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle className="text-base flex items-center gap-2">
                                            {p.label}
                                            <Badge variant="outline" className="text-xs gap-1"><Zap className="w-3 h-3" /> Built-in</Badge>
                                        </CardTitle>
                                        <CardDescription className="font-mono text-xs flex items-center gap-1">
                                            <Globe className="w-3 h-3" /> {p.baseUrl}
                                        </CardDescription>
                                    </div>
                                    <Badge className={p.status === 'configured' ? 'bg-green-600 gap-1' : 'bg-yellow-500 gap-1'}>
                                        {p.status === 'configured' ? <><ShieldCheck className="w-3 h-3" /> Terhubung</> : <><WifiOff className="w-3 h-3" /> Belum diatur</>}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="flex gap-2">
                                    <div className="flex-1 relative">
                                        <Input
                                            type={showKeys[p.provider] ? 'text' : 'password'}
                                            placeholder="sk-..."
                                            value={keys[p.provider] || ''}
                                            onChange={(e) => setKeys({ ...keys, [p.provider]: e.target.value })}
                                        />
                                        <Button variant="ghost" size="sm" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                                            onClick={() => setShowKeys({ ...showKeys, [p.provider]: !showKeys[p.provider] })}>
                                            {showKeys[p.provider] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </Button>
                                    </div>
                                    <Button onClick={() => saveKey(p.provider, keys[p.provider])}
                                        disabled={saving === p.provider || !keys[p.provider] || keys[p.provider] === '••••••••'}>
                                        {saving === p.provider ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                    </Button>
                                    <Button variant="outline" onClick={() => validateKey(p.provider, keys[p.provider])}
                                        disabled={validating === p.provider || !keys[p.provider] || keys[p.provider] === '••••••••'}>
                                        {validating === p.provider ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                                    </Button>
                                </div>
                                {p.textModel && <p className="text-xs text-muted-foreground mt-2">Text: <code>{p.textModel}</code> · Image: <code>{p.imageModel}</code></p>}
                            </CardContent>
                        </Card>
                    ))}

                    {/* Custom providers */}
                    {customProviders.map((cp: any) => {
                        let cfg: any = {}
                        try { cfg = JSON.parse(cp.value || '{}') } catch {}
                        const id = cp.key.replace('custom_provider_', '')
                        return (
                            <Card key={cp.key}>
                                <CardHeader className="pb-3">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <CardTitle className="text-base flex items-center gap-2">
                                                {cfg.label || id}
                                                <Badge variant="outline" className="text-xs gap-1"><Server className="w-3 h-3" /> Custom</Badge>
                                            </CardTitle>
                                            <CardDescription className="font-mono text-xs flex items-center gap-1">
                                                <Globe className="w-3 h-3" /> {cfg.baseUrl}
                                            </CardDescription>
                                        </div>
                                        {keyStatus[id]?.valid ? (
                                            <Badge className="bg-green-600 gap-1"><ShieldCheck className="w-3 h-3" /> Valid</Badge>
                                        ) : keys[id] ? (
                                            <Badge className="bg-green-600 gap-1"><ShieldCheck className="w-3 h-3" /> Terhubung</Badge>
                                        ) : (
                                            <Badge variant="secondary">Belum diatur</Badge>
                                        )}
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex gap-2">
                                        <div className="flex-1 relative">
                                            <Input
                                                type={showKeys[id] ? 'text' : 'password'}
                                                placeholder="sk-..."
                                                value={keys[id] || ''}
                                                onChange={(e) => setKeys({ ...keys, [id]: e.target.value })}
                                            />
                                            <Button variant="ghost" size="sm" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                                                onClick={() => setShowKeys({ ...showKeys, [id]: !showKeys[id] })}>
                                                {showKeys[id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </Button>
                                        </div>
                                        <Button onClick={() => saveKey(id, keys[id])}
                                            disabled={saving === id || !keys[id] || keys[id] === '\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022'}>
                                            {saving === id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                        </Button>
                                        <Button variant="outline" onClick={() => validateKey(id, keys[id])}
                                            disabled={validating === id || !keys[id] || keys[id] === '\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022'}>
                                            {validating === id ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                                        </Button>
                                        <Button variant="destructive" onClick={() => deleteCustomProvider(cp.key)}>
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                    {cfg.models?.length > 0 && (
                                        <div className="mt-2 flex flex-wrap gap-1">
                                            {cfg.models.map((m: string) => <Badge key={m} variant="secondary" className="text-xs font-mono">{m}</Badge>)}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )
                    })}

                    {showAddForm ? (
                        <Card className="border-dashed">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base flex items-center gap-2">
                                    <Globe className="w-4 h-4" /> Tambah Provider Custom
                                </CardTitle>
                                <CardDescription>Endpoint OpenAI-compatible (mis. 9Router, LiteLLM, atau server sendiri).</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="space-y-1">
                                    <label className="text-xs text-muted-foreground">Nama / Label</label>
                                    <Input placeholder="mis. 9Router VPS" value={newProvider.label} onChange={(e) => setNewProvider({ ...newProvider, label: e.target.value })} />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs text-muted-foreground">Base URL / Endpoint</label>
                                    <Input placeholder="https://9router-xxx.sslip.io (tanpa /v1)" value={newProvider.baseUrl} onChange={(e) => setNewProvider({ ...newProvider, baseUrl: e.target.value })} />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs text-muted-foreground">Models (opsional, pisah koma)</label>
                                    <Input placeholder="ag/claude-opus-4-6-thinking, cx/gpt-5" value={newProvider.models} onChange={(e) => setNewProvider({ ...newProvider, models: e.target.value })} />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs text-muted-foreground">API Key</label>
                                    <Input type="password" placeholder="sk-..." value={newProvider.apiKey} onChange={(e) => setNewProvider({ ...newProvider, apiKey: e.target.value })} />
                                </div>
                                <div className="flex gap-2">
                                    <Button onClick={saveCustomProvider} disabled={savingCustom}>
                                        {savingCustom ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                                        Simpan
                                    </Button>
                                    <Button variant="ghost" onClick={() => { setShowAddForm(false); setNewProvider({ label: '', baseUrl: '', models: '', apiKey: '' }) }}>Batal</Button>
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        <Button variant="outline" className="w-full border-dashed" onClick={() => setShowAddForm(true)}>
                            <Plus className="w-4 h-4 mr-2" /> Tambah Provider Custom
                        </Button>
                    )}
                </TabsContent>

                {/* ===== MODEL CONFIG TAB ===== */}
                <TabsContent value="models" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Zap className="w-5 h-5" /> Konfigurasi Model AI
                            </CardTitle>
                            <CardDescription>
                                Pilih model AI yang digunakan untuk generate konten dan gambar di Contently.
                                Model yang dipilih di sini akan dipakai oleh semua fitur AI.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Text Generation Model */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Model untuk Generate Teks</label>
                                <p className="text-xs text-muted-foreground">
                                    Dipakai untuk: Artikel, Video Script, Instagram Carousel, Content Lab, dll.
                                </p>
                                <div className="flex gap-2">
                                    <div className="flex-1 relative">
                                        <Input
                                            placeholder="Pilih atau ketik model..."
                                            value={modelConfig.textModel || ''}
                                            onChange={(e) => setModelConfig({ ...modelConfig, textModel: e.target.value })}
                                            className="font-mono text-sm"
                                        />
                                    </div>
                                </div>
                                {modelConfig.availableModels?.length > 0 && (
                                    <div className="border rounded-lg p-2 max-h-48 overflow-y-auto">
                                        <Input
                                            placeholder="Cari model..."
                                            value={modelSearchConfig}
                                            onChange={(e) => setModelSearchConfig(e.target.value)}
                                            className="h-7 text-xs mb-2"
                                        />
                                        {modelConfig.availableModels
                                            .filter((m: string) => !modelSearchConfig || m.toLowerCase().includes(modelSearchConfig.toLowerCase()))
                                            .map((model: string) => (
                                                <div
                                                    key={model}
                                                    className={`flex items-center justify-between py-1 px-2 rounded cursor-pointer hover:bg-muted/50 text-xs ${
                                                        modelConfig.textModel === model ? 'bg-primary/10 text-primary font-medium' : ''
                                                    }`}
                                                    onClick={() => setModelConfig({ ...modelConfig, textModel: model })}
                                                >
                                                    <code className="font-mono">{model}</code>
                                                    {modelConfig.textModel === model && <CheckCircle2 className="w-3 h-3 text-primary" />}
                                                </div>
                                            ))
                                        }
                                    </div>
                                )}
                                {modelConfig.defaults?.textModel && (
                                    <p className="text-xs text-muted-foreground">
                                        Default: <code className="font-mono">{modelConfig.defaults.textModel}</code>
                                    </p>
                                )}
                            </div>

                            {/* Image Generation Model */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Model untuk Generate Gambar</label>
                                <p className="text-xs text-muted-foreground">
                                    Dipakai untuk: Generate gambar AI, thumbnail, dan fitur image generation lainnya.
                                </p>
                                <div className="flex gap-2">
                                    <div className="flex-1 relative">
                                        <Input
                                            placeholder="Pilih atau ketik model..."
                                            value={modelConfig.imageModel || ''}
                                            onChange={(e) => setModelConfig({ ...modelConfig, imageModel: e.target.value })}
                                            className="font-mono text-sm"
                                        />
                                    </div>
                                </div>
                                {modelConfig.availableModels?.length > 0 && (
                                    <div className="border rounded-lg p-2 max-h-48 overflow-y-auto">
                                        <Input
                                            placeholder="Cari model..."
                                            value={modelSearchConfig}
                                            onChange={(e) => setModelSearchConfig(e.target.value)}
                                            className="h-7 text-xs mb-2"
                                        />
                                        {modelConfig.availableModels
                                            .filter((m: string) => !modelSearchConfig || m.toLowerCase().includes(modelSearchConfig.toLowerCase()))
                                            .map((model: string) => (
                                                <div
                                                    key={model}
                                                    className={`flex items-center justify-between py-1 px-2 rounded cursor-pointer hover:bg-muted/50 text-xs ${
                                                        modelConfig.imageModel === model ? 'bg-primary/10 text-primary font-medium' : ''
                                                    }`}
                                                    onClick={() => setModelConfig({ ...modelConfig, imageModel: model })}
                                                >
                                                    <code className="font-mono">{model}</code>
                                                    {modelConfig.imageModel === model && <CheckCircle2 className="w-3 h-3 text-primary" />}
                                                </div>
                                            ))
                                        }
                                    </div>
                                )}
                                {modelConfig.defaults?.imageModel && (
                                    <p className="text-xs text-muted-foreground">
                                        Default: <code className="font-mono">{modelConfig.defaults.imageModel}</code>
                                    </p>
                                )}
                            </div>

                            {/* Save button */}
                            <div className="flex gap-2 pt-2">
                                <Button onClick={saveModelConfig} disabled={savingModelConfig}>
                                    {savingModelConfig ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                                    Simpan Konfigurasi
                                </Button>
                                <Button variant="outline" onClick={loadModelConfig}>
                                    <RefreshCw className="w-4 h-4 mr-2" />
                                    Reset
                                </Button>
                            </div>

                            {/* Info */}
                            <div className="bg-muted p-4 rounded-lg text-sm space-y-2">
                                <p className="font-medium flex items-center gap-2">
                                    <Info className="w-4 h-4" /> Tips Memilih Model
                                </p>
                                <ul className="list-disc list-inside text-muted-foreground space-y-1 text-xs">
                                    <li><strong>Model Teks:</strong> Pilih model yang bagus untuk writing (misal: claude-sonnet-4-6, gpt-5.4)</li>
                                    <li><strong>Model Gambar:</strong> Pilih model yang support image generation (misal: cx/gpt-5.5, dall-e-3)</li>
                                    <li>Model dengan prefix <code>cx/</code> = Codex, <code>ag/</code> = Aggregator, <code>kr/</code> = Krea</li>
                                    <li>Klik model di daftar untuk memilih, atau ketik manual di input field</li>
                                </ul>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* ===== YOUTUBE COOKIES TAB ===== */}
                <TabsContent value="youtube" className="space-y-4">
                    <Card>
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-base flex items-center gap-2">
                                        YouTube (Video Clips)
                                        <Badge variant="outline" className="text-xs gap-1"><Cookie className="w-3 h-3" /> Cookie</Badge>
                                    </CardTitle>
                                    <CardDescription>
                                        <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:underline">
                                            youtube.com <ExternalLink className="w-3 h-3" />
                                        </a>
                                    </CardDescription>
                                </div>
                                {cookieStatus.youtube?.connected ? (
                                    <Badge className="bg-green-600 gap-1"><Cookie className="w-3 h-3" /> Terhubung</Badge>
                                ) : (
                                    <Badge variant="secondary">Belum terhubung</Badge>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {cookieStatus.youtube?.connected ? (
                                <>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                                        <span>Cookies tersimpan{cookieStatus.youtube.expiresAt && ` \u2014 expires ${new Date(cookieStatus.youtube.expiresAt).toLocaleDateString('id-ID')}`}</span>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button variant="outline" onClick={testCookies} disabled={testingCookie === 'youtube'}>
                                            {testingCookie === 'youtube' ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                                            <span className="ml-1">Test</span>
                                        </Button>
                                        <Button variant="destructive" onClick={deleteCookies}><Trash2 className="w-4 h-4" /></Button>
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-xs text-muted-foreground">Update cookies:</p>
                                        <Textarea placeholder="Paste new cookies here..." value={cookieInput.youtube || ''} onChange={(e) => setCookieInput({ ...cookieInput, youtube: e.target.value })} className="font-mono text-xs" rows={3} />
                                        <Button onClick={saveCookies} disabled={savingCookie === 'youtube' || !cookieInput.youtube}>
                                            {savingCookie === 'youtube' ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                                            <span className="ml-1">Update</span>
                                        </Button>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <Button variant="ghost" size="sm" onClick={() => setShowInstructions({ ...showInstructions, youtube: !showInstructions.youtube })} className="text-xs gap-1">
                                        <Info className="w-3 h-3" />
                                        {showInstructions.youtube ? 'Sembunyikan instruksi' : 'Cara dapat cookies'}
                                    </Button>
                                    {showInstructions.youtube && (
                                        <div className="bg-muted p-3 rounded text-xs whitespace-pre-wrap">
{`Cara dapat YouTube cookies (Netscape format):
1. Install extension "Get cookies.txt LOCALLY" di Chrome
2. Login ke YouTube (https://youtube.com)
3. Klik extension icon → "Export" → Copy semua isi file
4. Paste hasilnya di sini

Format: Netscape cookies.txt (bukan JSON)
Expired: Biasanya 1-2 minggu, update kalau download gagal`}
                                        </div>
                                    )}
                                    <Textarea placeholder="Paste YouTube cookies (Netscape format) di sini..." value={cookieInput.youtube || ''} onChange={(e) => setCookieInput({ ...cookieInput, youtube: e.target.value })} className="font-mono text-xs" rows={5} />
                                    <Button onClick={saveCookies} disabled={savingCookie === 'youtube' || !cookieInput.youtube} className="w-full">
                                        {savingCookie === 'youtube' ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                                        Simpan YouTube Cookies
                                    </Button>
                                </>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </motion.div>
    )
}
