'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { motion } from 'framer-motion'
import { Key, Save, Trash2, Eye, EyeOff, Loader2, CheckCircle2, XCircle, ExternalLink, MessageSquare, ImageIcon, ShieldCheck, ShieldAlert, Cookie, RefreshCw, Info } from 'lucide-react'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import { containerVariants, itemVariants } from '@/lib/animations'

interface Provider {
    key: string
    label: string
    models: string[]
    link: string
    authType: 'apikey' | 'cookie'
    cookieInstructions?: string
}

const PROVIDERS: Provider[] = [
    { key: 'openai', label: 'OpenAI', models: ['gpt-4o', 'gpt-4o-mini', 'o3-mini', 'dall-e-3', 'gpt-image-1'], link: 'https://platform.openai.com/apikeys', authType: 'apikey' },
    { key: 'openrouter', label: 'OpenRouter', models: ['openai/gpt-4o', 'anthropic/claude-sonnet-4', 'google/gemini-2.5-flash'], link: 'https://openrouter.ai/keys', authType: 'apikey' },
    { key: 'gemini', label: 'Google Gemini', models: ['gemini-2.0-flash', 'gemini-2.5-flash', 'gemini-2.0-flash-exp'], link: 'https://aistudio.google.com/apikey', authType: 'apikey' },
    { key: 'groq', label: 'Groq', models: ['llama-3.3-70b-versatile', 'mixtral-8x7b-32768'], link: 'https://console.groq.com/keys', authType: 'apikey' },
    { key: 'deepseek', label: 'DeepSeek', models: ['deepseek-chat', 'deepseek-reasoner'], link: 'https://platform.deepseek.com/api_keys', authType: 'apikey' },
    { key: 'mistral', label: 'Mistral', models: ['mistral-large-latest', 'pixtral-large-latest'], link: 'https://console.mistral.ai/api-keys', authType: 'apikey' },
    { 
        key: 'codex', 
        label: 'Codex (OpenAI)', 
        models: ['gpt-4o', 'gpt-4', 'gpt-3.5-turbo'], 
        link: 'https://chatgpt.com', 
        authType: 'cookie',
        cookieInstructions: `**Cara dapat session data:**
1. Login ke ChatGPT (https://chatgpt.com)
2. Buka DevTools (F12) → Console
3. Paste kode berikut dan Enter:

\`\`\`javascript
JSON.stringify({...window.__NEXT_DATA__?.props?.pageProps?.session, ...{user: window.__NEXT_DATA__?.props?.pageProps?.user}})
\`\`\`

Atau cara alternatif:
1. Klik tab Network di DevTools
2. Refresh halaman
3. Cari request ke \`chatgpt.com\`
4. Klik kanan → Copy → Copy response
5. Paste hasilnya (format JSON)`
    },
    { 
        key: 'antigravity', 
        label: 'Antigravity (Google)', 
        models: ['gemini-3.1-pro-high', 'gemini-3-flash'], 
        link: 'https://antigravity.dev', 
        authType: 'cookie',
        cookieInstructions: `**Cara dapat cookies:**
1. Login ke Antigravity (https://antigravity.dev)
2. Buka DevTools (F12) → Application → Cookies
3. Klik domain antigravity.dev
4. Ctrl+A (select all) → Ctrl+C (copy)
5. Paste hasilnya

Atau cara lebih gampang:
1. Klik tab Console di DevTools
2. Ketik \`document.cookie\` → Enter
3. Copy hasilnya`
    },
]

export default function ApiKeysPage() {
    const searchParams = useSearchParams()
    const [keys, setKeys] = useState<Record<string, string>>({})
    const [showKeys, setShowKeys] = useState<Record<string, boolean>>({})
    const [saving, setSaving] = useState<string | null>(null)
    const [validating, setValidating] = useState<string | null>(null)
    const [keyStatus, setKeyStatus] = useState<Record<string, { valid: boolean; error?: string }>>({})
    const [cookieStatus, setCookieStatus] = useState<Record<string, { connected: boolean; savedAt?: string; hasAccessToken?: boolean; expiresAt?: string }>>({})
    const [cookieInput, setCookieInput] = useState<Record<string, string>>({})
    const [savingCookie, setSavingCookie] = useState<string | null>(null)
    const [testingCookie, setTestingCookie] = useState<string | null>(null)
    const [testing, setTesting] = useState<string | null>(null)
    const [testResult, setTestResult] = useState<any>(null)
    const [selectedModels, setSelectedModels] = useState<Record<string, string>>({})
    const [testPrompt, setTestPrompt] = useState('Hello, respond in one sentence.')
    const [imagePrompt, setImagePrompt] = useState('A cute cat wearing a hat')
    const [showInstructions, setShowInstructions] = useState<Record<string, boolean>>({})

    useEffect(() => {
        loadKeys()
        loadCookieStatuses()
    }, [])

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
        for (const p of PROVIDERS.filter(p => p.authType === 'cookie')) {
            try {
                const status: any = await api.get(`/admin/settings/cookie/${p.key}/status`)
                setCookieStatus(prev => ({ ...prev, [p.key]: status }))
            } catch (e) { /* ignore */ }
        }
    }

    async function saveCookies(provider: string) {
        const cookies = cookieInput[provider]
        if (!cookies) {
            toast.error('Please paste your cookies/session data first')
            return
        }

        setSavingCookie(provider)
        try {
            const result: any = await api.post(`/admin/settings/cookie/${provider}/save`, { cookies })
            toast.success(result.message || `${provider} saved!`)
            setCookieInput(prev => ({ ...prev, [provider]: '' }))
            loadCookieStatuses()
        } catch (e: any) {
            toast.error(e.message || 'Failed to save')
        } finally {
            setSavingCookie(null)
        }
    }

    async function testCookies(provider: string) {
        setTestingCookie(provider)
        try {
            const result: any = await api.post(`/admin/settings/cookie/${provider}/test`)
            if (result.valid) {
                toast.success(`${provider} valid! (${result.latency}ms) ${result.modelCount ? `- ${result.modelCount} models` : ''}`)
            } else {
                toast.error(`${provider} invalid: ${result.error}`)
            }
        } catch (e: any) {
            toast.error(e.message || 'Test failed')
        } finally {
            setTestingCookie(null)
        }
    }

    async function deleteCookies(provider: string) {
        try {
            await api.delete(`/admin/settings/cookie/${provider}`)
            setCookieStatus(prev => ({ ...prev, [provider]: { connected: false } }))
            toast.success(`${provider} removed`)
        } catch (e: any) {
            toast.error(e.message || 'Failed to delete')
        }
    }

    async function validateKey(provider: string, apiKey: string) {
        setValidating(provider)
        try {
            const result: any = await api.post('/admin/settings/validate', { provider, apiKey })
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
        } finally {
            setValidating(null)
        }
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
        } catch (e: any) { toast.error(e.message || 'Failed to save') }
        finally { setSaving(null) }
    }

    async function deleteKey(provider: string) {
        try {
            await api.delete(`/admin/settings/api_key_${provider}`)
            setKeyStatus(prev => { const n = { ...prev }; delete n[provider]; return n })
            toast.success(`${provider} key removed`)
            loadKeys()
        } catch (e: any) { toast.error(e.message || 'Failed to delete') }
    }

    async function testFeature(type: 'chat' | 'image', provider: string) {
        setTesting(`${type}-${provider}`)
        setTestResult(null)
        try {
            const model = selectedModels[provider] || PROVIDERS.find(p => p.key === provider)?.models[0] || ''
            const endpoint = type === 'chat' ? '/admin/settings/test/chat' : '/admin/settings/test/image'
            const result: any = await api.post(endpoint, {
                provider, model, prompt: type === 'chat' ? testPrompt : imagePrompt,
            })
            setTestResult({ type, provider, ...result, success: true })
            toast.success(`Test passed! ${result.latency}ms`)
        } catch (e: any) {
            setTestResult({ type, provider, error: e.message, success: false })
            toast.error(e.message || 'Test failed')
        } finally { setTesting(null) }
    }

    function isProviderReady(provider: string) {
        const p = PROVIDERS.find(pr => pr.key === provider)
        if (p?.authType === 'cookie') return cookieStatus[provider]?.connected
        return keyStatus[provider]?.valid
    }

    function getStatusBadge(provider: string) {
        const p = PROVIDERS.find(pr => pr.key === provider)

        if (p?.authType === 'cookie') {
            const cookie = cookieStatus[provider]
            if (!cookie?.connected) return <Badge variant="secondary">Belum terhubung</Badge>
            return (
                <Badge variant="default" className="bg-green-600 gap-1">
                    <Cookie className="w-3 h-3" /> 
                    Terhubung
                    {cookie.hasAccessToken && <span className="ml-1">✓ Token</span>}
                </Badge>
            )
        }

        const status = keyStatus[provider]
        if (!keys[provider]) return <Badge variant="secondary">Belum diatur</Badge>
        if (!status) return <Badge variant="secondary">Unknown</Badge>
        if (validating === provider) return <Badge variant="outline" className="gap-1"><Loader2 className="w-3 h-3 animate-spin" /> Validating</Badge>
        if (status.valid) return <Badge variant="default" className="bg-green-600 gap-1"><ShieldCheck className="w-3 h-3" /> Valid</Badge>
        return <Badge variant="destructive" className="gap-1"><ShieldAlert className="w-3 h-3" /> Invalid</Badge>
    }

    function renderCookieCard(provider: Provider) {
        const cookie = cookieStatus[provider.key]
        const isReady = isProviderReady(provider.key)
        const showInst = showInstructions[provider.key]

        return (
            <Card>
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-base flex items-center gap-2">
                                {provider.label}
                                <Badge variant="outline" className="text-xs gap-1"><Cookie className="w-3 h-3" /> Cookie</Badge>
                            </CardTitle>
                            <CardDescription>
                                <a href={provider.link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:underline">
                                    {provider.link} <ExternalLink className="w-3 h-3" />
                                </a>
                            </CardDescription>
                        </div>
                        {getStatusBadge(provider.key)}
                    </div>
                </CardHeader>
                <CardContent className="space-y-3">
                    {cookie?.connected ? (
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <CheckCircle2 className="w-4 h-4 text-green-500" />
                                <span>
                                    {cookie.hasAccessToken ? 'Session data with access token' : 'Cookies tersimpan'}
                                    {cookie.expiresAt && ` — expires ${new Date(cookie.expiresAt).toLocaleDateString('id-ID')}`}
                                </span>
                            </div>
                            <div className="flex gap-2">
                                <Button variant="outline" onClick={() => testCookies(provider.key)} disabled={testingCookie === provider.key}>
                                    {testingCookie === provider.key ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                                    <span className="ml-1">Test</span>
                                </Button>
                                <Button variant="destructive" onClick={() => deleteCookies(provider.key)}>
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                            <div className="space-y-2">
                                <p className="text-xs text-muted-foreground">Update data:</p>
                                <Textarea
                                    placeholder="Paste new cookies/session data here..."
                                    value={cookieInput[provider.key] || ''}
                                    onChange={(e) => setCookieInput({ ...cookieInput, [provider.key]: e.target.value })}
                                    className="font-mono text-xs"
                                    rows={3}
                                />
                                <Button onClick={() => saveCookies(provider.key)} disabled={savingCookie === provider.key || !cookieInput[provider.key]}>
                                    {savingCookie === provider.key ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                                    <span className="ml-1">Update</span>
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => setShowInstructions({ ...showInstructions, [provider.key]: !showInst })}
                                className="text-xs gap-1"
                            >
                                <Info className="w-3 h-3" />
                                {showInst ? 'Sembunyikan instruksi' : 'Cara dapat data'}
                            </Button>
                            
                            {showInst && provider.cookieInstructions && (
                                <div className="bg-muted p-3 rounded text-xs whitespace-pre-wrap">
                                    {provider.cookieInstructions}
                                </div>
                            )}
                            
                            <Textarea
                                placeholder="Paste cookies atau session data JSON di sini..."
                                value={cookieInput[provider.key] || ''}
                                onChange={(e) => setCookieInput({ ...cookieInput, [provider.key]: e.target.value })}
                                className="font-mono text-xs"
                                rows={5}
                            />
                            <Button onClick={() => saveCookies(provider.key)} disabled={savingCookie === provider.key || !cookieInput[provider.key]} className="w-full">
                                {savingCookie === provider.key ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                                Simpan {provider.label}
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        )
    }

    function renderApiKeyCard(provider: Provider) {
        return (
            <Card>
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-base">{provider.label}</CardTitle>
                            <CardDescription>
                                <a href={provider.link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:underline">
                                    Dapatkan API key <ExternalLink className="w-3 h-3" />
                                </a>
                            </CardDescription>
                        </div>
                        {getStatusBadge(provider.key)}
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="flex gap-2">
                        <div className="flex-1 relative">
                            <Input
                                type={showKeys[provider.key] ? 'text' : 'password'}
                                placeholder="sk-..."
                                value={keys[provider.key] || ''}
                                onChange={(e) => setKeys({ ...keys, [provider.key]: e.target.value })}
                            />
                            <Button variant="ghost" size="sm" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                                onClick={() => setShowKeys({ ...showKeys, [provider.key]: !showKeys[provider.key] })}>
                                {showKeys[provider.key] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </Button>
                        </div>
                        <Button onClick={() => saveKey(provider.key, keys[provider.key])}
                            disabled={saving === provider.key || !keys[provider.key] || keys[provider.key] === '\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022'}>
                            {saving === provider.key ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        </Button>
                        <Button variant="outline" onClick={() => validateKey(provider.key, keys[provider.key])}
                            disabled={validating === provider.key || !keys[provider.key] || keys[provider.key] === '\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022'}>
                            {validating === provider.key ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                        </Button>
                        {keys[provider.key] && (
                            <Button variant="destructive" onClick={() => deleteKey(provider.key)}>
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>
        )
    }

    const readyProviders = PROVIDERS.filter(p => isProviderReady(p.key))

    return (
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold flex items-center gap-2"><Key className="w-6 h-6" /> Kunci API</h1>
                <p className="text-muted-foreground">Kelola API key dan cookie/session authentication provider AI</p>
            </div>
            <Tabs defaultValue="keys">
                <TabsList>
                    <TabsTrigger value="keys">API Keys & Koneksi</TabsTrigger>
                    <TabsTrigger value="test">Test Fitur</TabsTrigger>
                </TabsList>
                <TabsContent value="keys" className="space-y-4">
                    {PROVIDERS.map((provider) => (
                        <motion.div key={provider.key} variants={itemVariants}>
                            {provider.authType === 'cookie' ? renderCookieCard(provider) : renderApiKeyCard(provider)}
                        </motion.div>
                    ))}
                </TabsContent>
                <TabsContent value="test" className="space-y-4">
                    <Card>
                        <CardHeader><CardTitle className="text-base">Test Chat Completion</CardTitle></CardHeader>
                        <CardContent className="space-y-3">
                            <Textarea value={testPrompt} onChange={(e) => setTestPrompt(e.target.value)} placeholder="Test prompt..." />
                            <div className="flex flex-wrap gap-2">
                                {readyProviders.map((provider) => (
                                    <div key={provider.key} className="flex gap-1">
                                        <Select value={selectedModels[provider.key]} onValueChange={(v) => setSelectedModels({ ...selectedModels, [provider.key]: v })}>
                                            <SelectTrigger className="w-[180px]"><SelectValue placeholder={provider.models[0]} /></SelectTrigger>
                                            <SelectContent>
                                                {provider.models.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                        <Button variant="outline" onClick={() => testFeature('chat', provider.key)} disabled={testing === `chat-${provider.key}`}>
                                            {testing === `chat-${provider.key}` ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageSquare className="w-4 h-4" />}
                                            <span className="ml-1">{provider.label}</span>
                                        </Button>
                                    </div>
                                ))}
                            </div>
                            {readyProviders.length === 0 && (
                                <p className="text-sm text-muted-foreground">Hubungkan atau validasi API key dulu sebelum test.</p>
                            )}
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader><CardTitle className="text-base">Test Image Generation</CardTitle></CardHeader>
                        <CardContent className="space-y-3">
                            <Input value={imagePrompt} onChange={(e) => setImagePrompt(e.target.value)} placeholder="Image prompt..." />
                            <div className="flex flex-wrap gap-2">
                                {readyProviders.map((provider) => (
                                    <Button key={provider.key} variant="outline" onClick={() => testFeature('image', provider.key)} disabled={testing === `image-${provider.key}`}>
                                        {testing === `image-${provider.key}` ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
                                        <span className="ml-1">{provider.label}</span>
                                    </Button>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                    {testResult && (
                        <Card className={testResult.success ? 'border-green-500' : 'border-red-500'}>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm flex items-center gap-2">
                                    {testResult.success ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <XCircle className="w-4 h-4 text-red-500" />}
                                    Hasil Test — {testResult.provider} ({testResult.type})
                                    {testResult.latency && <Badge variant="outline">{testResult.latency}ms</Badge>}
                                    {testResult.authType && <Badge variant="outline">{testResult.authType}</Badge>}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {testResult.success && testResult.response && <p className="text-sm bg-muted p-3 rounded">{testResult.response}</p>}
                                {testResult.success && testResult.imageUrl && <img src={testResult.imageUrl} alt="Generated" className="max-w-md rounded" />}
                                {!testResult.success && <p className="text-sm text-red-500">{testResult.error}</p>}
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>
            </Tabs>
        </motion.div>
    )
}
