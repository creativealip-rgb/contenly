'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
    MessageCircle
} from 'lucide-react'

export default function BillingPage() {
    const [balance, setBalance] = useState<number | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchBalance = async () => {
            try {
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
                const res = await fetch(`${apiUrl}/billing/balance`, {
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    credentials: 'include', // Send cookies
                })

                if (res.ok) {
                    const data = await res.json()
                    // data might be { id, userId, balance, ... } or just { balance } depending on controller
                    // The service returns the full tokenBalance object.
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
        <div className="space-y-6">
            {/* Page Header */}
            <div>
                <h1 className="text-3xl font-bold">Billing & Tokens</h1>
                <p className="text-muted-foreground">
                    Manage your subscription and token balance.
                </p>
            </div>

            {/* Token Balance & Usage */}
            <div className="grid gap-6">
                <Card className="max-w-4xl">
                    <CardHeader>
                        <CardTitle>Token Balance</CardTitle>
                        <CardDescription>Your current token status</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col md:flex-row items-start md:items-center gap-8">
                            <div className="flex items-center gap-4">
                                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20">
                                    <Sparkles className="h-8 w-8 text-amber-600" />
                                </div>
                                <div>
                                    <p className="text-4xl font-bold">
                                        {loading ? '...' : (balance !== null ? balance : 0)}
                                    </p>
                                    <p className="text-muted-foreground">tokens remaining</p>
                                </div>
                            </div>
                            <div className="flex-1 w-full">
                                <div className="h-4 w-full rounded-full bg-muted overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all"
                                        style={{ width: loading ? '0%' : `${Math.min(((balance || 0) / 100) * 100, 100)}%` }}
                                    />
                                </div>
                                <p className="text-sm text-muted-foreground mt-2">
                                    {loading ? 'Calculate usage...' : `${balance || 0} tokens available`}
                                </p>
                            </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="mt-8 grid gap-4 sm:grid-cols-2 max-w-lg">
                            <WhatsAppActionModal
                                trigger={
                                    <Button className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 h-12 text-lg">
                                        <Plus className="h-5 w-5 mr-2" />
                                        Buy Extra Tokens
                                    </Button>
                                }
                            />

                            <WhatsAppActionModal
                                trigger={
                                    <Button variant="outline" className="w-full h-12 text-lg">
                                        <CreditCard className="h-5 w-5 mr-2" />
                                        Manage Payment
                                    </Button>
                                }
                            />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
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
                    <div className="p-4 bg-green-100 rounded-full">
                        <MessageCircle className="h-10 w-10 text-green-600" />
                    </div>
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
                        Chat via WhatsApp
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
