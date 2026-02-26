'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Loader2, Copy, Sparkles, Image, Video, Wand2, Check } from 'lucide-react'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

type PromptMode = 'image' | 'video'

interface ImagePrompt {
    subject: string
    style: string
    lighting: string
    composition: string
    colors: string
    mood: string
    additionalDetails: string
}

interface VideoPrompt {
    subject: string
    action: string
    scene: string
    cameraMovement: string
    duration: string
    style: string
    mood: string
    additionalDetails: string
}

export default function PromptGeneratorPage() {
    const [mode, setMode] = useState<PromptMode>('image')
    const [input, setInput] = useState('')
    const [output, setOutput] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [copied, setCopied] = useState(false)

    const generatePrompt = async () => {
        if (!input.trim()) {
            toast.error('Masukkan deskripsi terlebih dahulu')
            return
        }

        setIsLoading(true)
        try {
            const response = await fetch(`${API_BASE_URL}/ai/prompt-generator`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    text: input,
                    mode,
                }),
            })

            if (!response.ok) {
                throw new Error('Failed to generate prompt')
            }

            const data = await response.json()
            setOutput(data.prompt)
            toast.success('Prompt berhasil dihasilkan!')
        } catch (error) {
            console.error('Error generating prompt:', error)
            toast.error('Gagal生成 prompt. Silakan coba lagi.')
        } finally {
            setIsLoading(false)
        }
    }

    const copyToClipboard = async () => {
        if (!output) return
        
        await navigator.clipboard.writeText(output)
        setCopied(true)
        toast.success('Disalin ke papan klip!')
        setTimeout(() => setCopied(false), 2000)
    }

    const formatJson = (str: string) => {
        try {
            return JSON.stringify(JSON.parse(str), null, 2)
        } catch {
            return str
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-6 md:p-8">
            <div className="max-w-4xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                        Prompt Generator
                    </h1>
                    <p className="text-slate-600 dark:text-slate-400">
                        Ubah bahasa sehari-hari menjadi prompt JSON untuk image atau video generation
                    </p>
                </motion.div>

                <div className="grid gap-6">
                    <Card className="border-0 shadow-xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Wand2 className="w-5 h-5 text-blue-600" />
                                Input Deskripsi
                            </CardTitle>
                            <CardDescription>
                                Jelaskan dalam bahasa Indonesia tentang gambar atau video yang ingin Anda buat
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Tabs value={mode} onValueChange={(v) => setMode(v as PromptMode)}>
                                <TabsList className="grid w-full grid-cols-2">
                                    <TabsTrigger value="image" className="flex items-center gap-2">
                                        <Image className="w-4 h-4" />
                                        Image
                                    </TabsTrigger>
                                    <TabsTrigger value="video" className="flex items-center gap-2">
                                        <Video className="w-4 h-4" />
                                        Video
                                    </TabsTrigger>
                                </TabsList>
                            </Tabs>

                            <Textarea
                                placeholder={
                                    mode === 'image'
                                        ? 'Contoh: Seekor kucing oranye sedang duduk di atas tembok batu di bawah matahari terbenam, dengan latar belakang pegunungan hijau...'
                                        : 'Contoh: Seekor burung elang terbang melintasi langit biru cerah di atas pegunungan, kamera mengikuti dari bawah...'
                                }
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                className="min-h-[150px] resize-none text-base"
                            />
                        </CardContent>
                        <CardFooter>
                            <Button
                                onClick={generatePrompt}
                                disabled={isLoading || !input.trim()}
                                className="w-full bg-blue-600 hover:bg-blue-700"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Membuat Prompt...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="w-4 h-4 mr-2" />
                                        Generate Prompt
                                    </>
                                )}
                            </Button>
                        </CardFooter>
                    </Card>

                    <AnimatePresence>
                        {output && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                            >
                                <Card className="border-0 shadow-xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
                                    <CardHeader className="flex flex-row items-center justify-between">
                                        <div>
                                            <CardTitle className="flex items-center gap-2">
                                                {mode === 'image' ? (
                                                    <Image className="w-5 h-5 text-purple-600" />
                                                ) : (
                                                    <Video className="w-5 h-5 text-purple-600" />
                                                )}
                                                Output Prompt
                                            </CardTitle>
                                            <CardDescription>
                                                JSON siap pakai untuk AI image/video generation
                                            </CardDescription>
                                        </div>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={copyToClipboard}
                                            className="gap-2"
                                        >
                                            {copied ? (
                                                <Check className="w-4 h-4 text-green-500" />
                                            ) : (
                                                <Copy className="w-4 h-4" />
                                            )}
                                            {copied ? 'Tersalin' : 'Copy'}
                                        </Button>
                                    </CardHeader>
                                    <CardContent>
                                        <pre className="bg-slate-900 dark:bg-slate-950 text-slate-100 p-4 rounded-lg overflow-x-auto text-sm font-mono">
                                            {formatJson(output)}
                                        </pre>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    )
}
