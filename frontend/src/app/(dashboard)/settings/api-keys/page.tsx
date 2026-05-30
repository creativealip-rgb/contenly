'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { motion } from 'framer-motion'
import { Key, Save, Trash2, Eye, EyeOff, Loader2, CheckCircle2, XCircle, ExternalLink, MessageSquare, ImageIcon } from 'lucide-react'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import { containerVariants, itemVariants } from '@/lib/animations'

const PROVIDERS = [
    { key: 'openai', label: 'OpenAI', models: ['gpt-4o', 'gpt-4o-mini', 'o3-mini', 'dall-e-3', 'gpt-image-1'], link: 'https://platform.openai.com/apikeys' },
    { key: 'openrouter', label: 'OpenRouter', models: ['openai/gpt-4o', 'anthropic/claude-sonnet-4', 'google/gemini-2.5-flash'], link: 'https://openrouter.ai/keys' },
    { key: 'gemini', label: 'Google Gemini', models: ['gemini-2.0-flash', 'gemini-2.5-flash', 'gemini-2.0-flash-exp'], link: 'https://aistudio.google.com/apikey' },
    { key: 'groq', label: 'Groq', models: ['llama-3.3-70b-versatile', 'mixtral-8x7b-32768'], link: 'https://console.groq.com/keys' },
    { key: 'deepseek', label: 'DeepSeek', models: ['deepseek-chat', 'deepseek-reasoner'], link: 'https://platform.deepseek.com/api_keys' },
    { key: 'mistral', label: 'Mistral', models: ['mistral-large-latest', 'pixtral-large-latest'], link: 'https://console.mistral.ai/api-keys' },
]

export default function ApiKeysPage() {
    const [keys, setKeys] = useState<Record<string, string>>({})
    const [showKeys, setShowKeys] = useState<Record<string, boolean>>({})
    const [saving, setSaving] = useState<string | null>(null)
    const [testing, setTesting] = useState<string | null>(null)
    const [testResult, setTestResult] = useState<any>(null)
    const [selectedModels, setSelectedModels] = useState<Record<string, string>>({})
    const [testPrompt, setTestPrompt] = useState('Hello, respond in one sentence.')
    const [imagePrompt, setImagePrompt] = useState('A cute cat wearing a hat')

    useEffect(() => { loadKeys() }, [])

    async function loadKeys() {
        try {
            const settings: any[] = await api.get('/admin/settings?category=api-keys')
            const mapped: Record<string, string> = {}
            settings.forEach((s: any) => {
                const provider = s.key.replace('api_key_', '')
                mapped[provider] = s.value ? '••••••••' : ''
            })
            setKeys(mapped)
        } catch (e) { /* ignore */ }
    }

    async function saveKey(provider: string, value: string) {
        setSaving(provider)
        try {
            await api.post('/admin/settings', {
                key: `api_key_${provider}`, value, encrypted: true, category: 'api-keys', description: `${provider} API key`,
            })
            toast.success(`${provider} key saved`)
            loadKeys()
        } catch (e: any) { toast.error(e.message || 'Failed to save') }
        finally { setSaving(null) }
    }

    async function deleteKey(provider: string) {
        try {
            await api.delete(`/admin/settings/api_key_${provider}`)
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

    return (
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold flex items-center gap-2"><Key className="w-6 h-6" /> API Keys</h1>
                <p className="text-muted-foreground">Manage provider API keys and test features</p>
            </div>
            <Tabs defaultValue="keys">
                <TabsList>
                    <TabsTrigger value="keys">API Keys</TabsTrigger>
                    <TabsTrigger value="test">Test Features</TabsTrigger>
                </TabsList>
                <TabsContent value="keys" className="space-y-4">
                    {PROVIDERS.map((provider) => (
                        <motion.div key={provider.key} variants={itemVariants}>
                            <Card>
                                <CardHeader className="pb-3">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <CardTitle className="text-base">{provider.label}</CardTitle>
                                            <CardDescription>
                                                <a href={provider.link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:underline">
                                                    Get API key <ExternalLink className="w-3 h-3" />
                                                </a>
                                            </CardDescription>
                                        </div>
                                        <Badge variant={keys[provider.key] ? 'default' : 'secondary'}>
                                            {keys[provider.key] ? 'Configured' : 'Not set'}
                                        </Badge>
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
                                            disabled={saving === provider.key || !keys[provider.key] || keys[provider.key] === '••••••••'}>
                                            {saving === provider.key ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                        </Button>
                                        {keys[provider.key] && (
                                            <Button variant="destructive" onClick={() => deleteKey(provider.key)}>
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                </TabsContent>
                <TabsContent value="test" className="space-y-4">
                    <Card>
                        <CardHeader><CardTitle className="text-base">Test Chat Completion</CardTitle></CardHeader>
                        <CardContent className="space-y-3">
                            <Textarea value={testPrompt} onChange={(e) => setTestPrompt(e.target.value)} placeholder="Test prompt..." />
                            <div className="flex flex-wrap gap-2">
                                {PROVIDERS.filter(p => keys[p.key]).map((provider) => (
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
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader><CardTitle className="text-base">Test Image Generation</CardTitle></CardHeader>
                        <CardContent className="space-y-3">
                            <Input value={imagePrompt} onChange={(e) => setImagePrompt(e.target.value)} placeholder="Image prompt..." />
                            <div className="flex flex-wrap gap-2">
                                {PROVIDERS.filter(p => keys[p.key]).map((provider) => (
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
                                    Test Result — {testResult.provider} ({testResult.type})
                                    {testResult.latency && <Badge variant="outline">{testResult.latency}ms</Badge>}
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
