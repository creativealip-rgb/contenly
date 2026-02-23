'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Sparkles,
    CreditCard,
    Plus,
    MessageCircle,
    Zap,
    TrendingUp
} from 'lucide-react'

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.1 }
    }
} as const

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 100 } }
} as const

export default function BillingPage() {
    const [balance, setBalance] = useState<number | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchBalance = async () => {
            try {
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
                const res = await fetch(`${apiUrl}/billing/balance`, {
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    credentials: 'include',
                })

                if (res.ok) {
                    const data = await res.json()
                    setBalance(data.balance)
                }
            } catch (error) {
                console.error('Failed to fetch token balance:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchBalance()
    }, [])

    return (
        <motion.div
            className="space-y-6"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <h1 className="text-4xl font-black tracking-tighter bg-gradient-to-r from-slate-900 to-slate-500 dark:from-white dark:to-slate-400 bg-clip-text text-transparent">
                        Billing
                    </h1>
                    <p className="text-slate-500 font-medium">Manage your tokens and usage.</p>
                </div>
            </div>

            {/* Token Balance Card */}
            <motion.div variants={itemVariants}>
                <Card className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-500 text-white border-0">
                    {/* Decorative elements */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-cyan-400/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
                    <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />

                    <CardContent className="relative z-10 py-10 px-6">
                        <div className="flex items-center gap-2 text-blue-100 mb-4">
                            <Zap className="w-4 h-4" />
                            <span className="text-xs font-medium uppercase tracking-wider">Token Balance</span>
                        </div>

                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
                            <div>
                                <motion.div
                                    className="text-5xl md:text-6xl font-bold tracking-tight tabular-nums"
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                                >
                                    {loading ? '...' : (balance !== null ? balance.toLocaleString() : 0)}
                                </motion.div>
                                <p className="text-blue-100 mt-2 text-lg">tokens remaining</p>

                                {/* Usage indicator */}
                                <div className="mt-4 flex items-center gap-3">
                                    <div className="h-2 w-32 rounded-full bg-white/20 overflow-hidden">
                                        <motion.div
                                            className="h-full bg-white rounded-full"
                                            initial={{ width: 0 }}
                                            animate={{ width: loading ? '0%' : `${Math.min(((balance || 0) / 100) * 100, 100)}%` }}
                                            transition={{ delay: 0.5, duration: 1, ease: "easeOut" }}
                                        />
                                    </div>
                                    <span className="text-xs text-blue-100">{balance || 0} available</span>
                                </div>
                            </div>

                            {/* Glass card for stats */}
                            <div className="glass-subtle rounded-2xl p-4 flex gap-6">
                                <div className="text-center px-4 border-r border-white/20">
                                    <div className="flex items-center justify-center gap-1 text-blue-100 mb-1">
                                        <TrendingUp className="w-3 h-3" />
                                        <span className="text-xs uppercase tracking-wider">Usage</span>
                                    </div>
                                    <div className="text-2xl font-bold tabular-nums">--</div>
                                </div>
                                <div className="text-center px-4">
                                    <div className="flex items-center justify-center gap-1 text-blue-100 mb-1">
                                        <Sparkles className="w-3 h-3" />
                                        <span className="text-xs uppercase tracking-wider">Plan</span>
                                    </div>
                                    <div className="text-2xl font-bold">Starter</div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Actions */}
            <motion.div className="grid gap-4 md:grid-cols-2" variants={itemVariants}>
                <Card className="glass border-2 border-white/60 dark:border-white/20 overflow-hidden hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-none transition-all duration-500 rounded-3xl">
                    <CardContent className="pt-6">
                        <div className="flex items-start gap-4">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 text-white">
                                <Plus className="h-6 w-6" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-semibold mb-1">Buy Extra Tokens</h3>
                                <p className="text-sm text-muted-foreground mb-4">
                                    Purchase additional tokens to continue generating content.
                                </p>
                                <WhatsAppActionModal
                                    trigger={
                                        <Button className="bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600">
                                            <Plus className="h-4 w-4 mr-2" />
                                            Buy Tokens
                                        </Button>
                                    }
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="glass border-2 border-white/60 dark:border-white/20 overflow-hidden hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-none transition-all duration-500 rounded-3xl">
                    <CardContent className="pt-6">
                        <div className="flex items-start gap-4">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-400 text-white">
                                <CreditCard className="h-6 w-6" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-semibold mb-1">Manage Payment</h3>
                                <p className="text-sm text-muted-foreground mb-4">
                                    Update your payment method or view billing history.
                                </p>
                                <WhatsAppActionModal
                                    trigger={
                                        <Button variant="outline" className="border-blue-500/20 hover:bg-blue-500/10">
                                            <CreditCard className="h-4 w-4 mr-2" />
                                            Manage Payment
                                        </Button>
                                    }
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Info Card */}
            <motion.div variants={itemVariants}>
                <Card className="glass border-2 border-white/60 dark:border-white/20 overflow-hidden hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-none transition-all duration-500 rounded-3xl">
                    <CardHeader>
                        <CardTitle className="text-sm uppercase tracking-wider text-muted-foreground font-semibold">About Tokens</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-3">
                            <div className="p-4 rounded-xl bg-muted/50">
                                <div className="flex items-center gap-2 mb-2">
                                    <Sparkles className="h-4 w-4 text-[var(--brand-primary)]" />
                                    <span className="font-medium text-sm">Content Generation</span>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Each article generation uses approximately 1,000 tokens depending on length.
                                </p>
                            </div>
                            <div className="p-4 rounded-xl bg-muted/50">
                                <div className="flex items-center gap-2 mb-2">
                                    <Zap className="h-4 w-4 text-[var(--brand-primary)]" />
                                    <span className="font-medium text-sm">Image Generation</span>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    AI image generation uses 500 tokens per image.
                                </p>
                            </div>
                            <div className="p-4 rounded-xl bg-muted/50">
                                <div className="flex items-center gap-2 mb-2">
                                    <TrendingUp className="h-4 w-4 text-[var(--brand-primary)]" />
                                    <span className="font-medium text-sm">SEO Analysis</span>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    SEO meta generation costs 200 tokens per request.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
        </motion.div>
    )
}

function WhatsAppActionModal({ trigger }: { trigger: React.ReactNode }) {
    return (
        <Dialog>
            <DialogTrigger asChild>
                {trigger}
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Hubungi Admin</DialogTitle>
                    <DialogDescription>
                        Untuk pembelian token tambahan atau pengaturan pembayaran, silakan hubungi admin kami secara langsung.
                    </DialogDescription>
                </DialogHeader>
                <div className="flex flex-col items-center justify-center p-6 space-y-4 text-center">
                    <motion.div
                        className="p-4 bg-gradient-to-br from-green-500 to-green-400 rounded-full"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    >
                        <MessageCircle className="h-10 w-10 text-white" />
                    </motion.div>
                    <div>
                        <p className="font-semibold text-lg">WhatsApp Admin</p>
                        <p className="text-muted-foreground text-sm selection:bg-green-100 selection:text-green-900">
                            0895322348554
                        </p>
                    </div>
                    <Button
                        className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white"
                        onClick={() => window.open('https://wa.me/62895322348554', '_blank')}
                    >
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Chat via WhatsApp
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
