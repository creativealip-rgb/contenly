'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Sparkles, CreditCard, Plus, MessageCircle, Loader2 } from 'lucide-react'

export default function BillingPage() {
    const [showContactModal, setShowContactModal] = useState(false)
    const [balance, setBalance] = useState<number | null>(null)
    const [totalPurchased, setTotalPurchased] = useState<number | null>(null)
    const [totalUsed, setTotalUsed] = useState<number | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const fetchBalance = async () => {
            try {
                const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'
                const response = await fetch(`${API_BASE_URL}/billing/balance`, {
                    credentials: 'include',
                    headers: { 'ngrok-skip-browser-warning': 'true' }
                })

                if (response.ok) {
                    const data = await response.json()
                    setBalance(data.balance || 0)
                    setTotalPurchased(data.totalPurchased || 0)
                    setTotalUsed(data.totalUsed || 0)
                } else {
                    throw new Error('Failed to fetch balance')
                }
            } catch (err) {
                console.error('Failed to fetch token balance:', err)
                setError('Failed to load token balance')
            } finally {
                setIsLoading(false)
            }
        }

        fetchBalance()

        const interval = setInterval(fetchBalance, 10000)
        return () => clearInterval(interval)
    }, [])

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div>
                <h1 className="text-3xl font-bold">Billing & Tokens</h1>
                <p className="text-muted-foreground">
                    Manage your token balance.
                </p>
            </div>

            {/* Token Balance & Usage */}
            <div className="grid gap-6 lg:grid-cols-3">
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Token Balance</CardTitle>
                        <CardDescription>Your current token status</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                            </div>
                        ) : error ? (
                            <div className="text-center py-12 text-muted-foreground">
                                {error}
                            </div>
                        ) : (
                            <>
                                <div className="flex items-center gap-8">
                                    <div className="flex items-center gap-4">
                                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20">
                                            <Sparkles className="h-8 w-8 text-amber-600" />
                                        </div>
                                        <div>
                                            <p className="text-4xl font-bold">{balance}</p>
                                            <p className="text-muted-foreground">tokens remaining</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="grid gap-4 mt-6 md:grid-cols-3">
                                    <div className="p-4 rounded-lg bg-muted/50">
                                        <p className="text-sm text-muted-foreground">Used This Month</p>
                                        <p className="text-2xl font-bold">{totalUsed}</p>
                                    </div>
                                    <div className="p-4 rounded-lg bg-muted/50">
                                        <p className="text-sm text-muted-foreground">Total Purchased</p>
                                        <p className="text-2xl font-bold">{totalPurchased}</p>
                                    </div>
                                    <div className="p-4 rounded-lg bg-muted/50">
                                        <p className="text-sm text-muted-foreground">Total Used</p>
                                        <p className="text-2xl font-bold">{totalUsed}</p>
                                    </div>
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Dialog open={showContactModal} onOpenChange={setShowContactModal}>
                            <DialogTrigger asChild>
                                <Button className="w-full bg-gradient-to-r from-violet-600 to-indigo-600">
                                    <Plus className="h-4 w-4 mr-2" />
                                    Buy Extra Tokens
                                </Button>
                            </DialogTrigger>
                        </Dialog>
                        <Dialog open={showContactModal} onOpenChange={setShowContactModal}>
                            <DialogTrigger asChild>
                                <Button variant="outline" className="w-full">
                                    <CreditCard className="h-4 w-4 mr-2" />
                                    Manage Payment
                                </Button>
                            </DialogTrigger>
                        </Dialog>
                    </CardContent>
                </Card>
            </div>

            {/* Contact Modal */}
            <Dialog open={showContactModal} onOpenChange={setShowContactModal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Contact Admin</DialogTitle>
                        <DialogDescription>
                            To purchase extra tokens or manage your payment, please contact our admin directly via WhatsApp
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                        <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-500/20">
                                <MessageCircle className="h-6 w-6 text-green-600" />
                            </div>
                            <div className="flex-1">
                                <p className="font-semibold">WhatsApp</p>
                                <p className="text-sm text-muted-foreground">089322348554</p>
                            </div>
                        </div>
                        <Button 
                            className="w-full bg-green-600 hover:bg-green-700"
                            onClick={() => window.open('https://wa.me/6289322348554', '_blank')}
                        >
                            <MessageCircle className="h-4 w-4 mr-2" />
                            Open WhatsApp
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
