'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import {
    Sparkles,
    CreditCard,
    Check,
    TrendingUp,
    TrendingDown,
    Download,
    Zap
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

const mockTransactions = [
    { id: '1', type: 'purchase', description: 'Pro Plan Subscription', amount: 100, date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2) },
    { id: '2', type: 'usage', description: 'Article Generation', amount: -1, date: new Date(Date.now() - 1000 * 60 * 60 * 2) },
    { id: '3', type: 'usage', description: 'AI Image Generation', amount: -2, date: new Date(Date.now() - 1000 * 60 * 60 * 4) },
    { id: '4', type: 'usage', description: 'Article Generation', amount: -1, date: new Date(Date.now() - 1000 * 60 * 60 * 24) },
    { id: '5', type: 'usage', description: 'Bulk Publish (10 articles)', amount: -8, date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3) },
]

const plans = [
    {
        name: 'Free Trial',
        price: '$0',
        period: '/7 days',
        tokens: 10,
        features: ['10 tokens', '1 WordPress site', 'Basic AI rewriting', 'Email support'],
        current: false,
    },
    {
        name: 'Pro',
        price: '$29',
        period: '/month',
        tokens: 100,
        features: ['100 tokens/month', '5 WordPress sites', 'Advanced AI + Image Gen', 'RSS Auto-fetch', 'Priority support'],
        current: true,
        popular: true,
    },
    {
        name: 'Enterprise',
        price: '$99',
        period: '/month',
        tokens: 500,
        features: ['500 tokens/month', 'Unlimited WordPress sites', 'API access', 'Bulk publishing', 'Dedicated support'],
        current: false,
    },
]

export default function BillingPage() {
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
            <div className="grid gap-6 lg:grid-cols-3">
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Token Balance</CardTitle>
                        <CardDescription>Your current token status</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-8">
                            <div className="flex items-center gap-4">
                                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20">
                                    <Sparkles className="h-8 w-8 text-amber-600" />
                                </div>
                                <div>
                                    <p className="text-4xl font-bold">50</p>
                                    <p className="text-muted-foreground">tokens remaining</p>
                                </div>
                            </div>
                            <div className="flex-1">
                                <div className="h-4 w-full rounded-full bg-muted overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all"
                                        style={{ width: '50%' }}
                                    />
                                </div>
                                <p className="text-sm text-muted-foreground mt-2">50 of 100 tokens used this month</p>
                            </div>
                        </div>
                        <div className="grid gap-4 mt-6 md:grid-cols-3">
                            <div className="p-4 rounded-lg bg-muted/50">
                                <p className="text-sm text-muted-foreground">Used This Month</p>
                                <p className="text-2xl font-bold">50</p>
                            </div>
                            <div className="p-4 rounded-lg bg-muted/50">
                                <p className="text-sm text-muted-foreground">Renewal Date</p>
                                <p className="text-2xl font-bold">Feb 1</p>
                            </div>
                            <div className="p-4 rounded-lg bg-muted/50">
                                <p className="text-sm text-muted-foreground">Current Plan</p>
                                <p className="text-2xl font-bold">Pro</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Button className="w-full bg-gradient-to-r from-violet-600 to-indigo-600">
                            <Zap className="h-4 w-4 mr-2" />
                            Buy Extra Tokens
                        </Button>
                        <Button variant="outline" className="w-full">
                            <CreditCard className="h-4 w-4 mr-2" />
                            Manage Payment
                        </Button>
                        <Button variant="outline" className="w-full">
                            <Download className="h-4 w-4 mr-2" />
                            Download Invoices
                        </Button>
                    </CardContent>
                </Card>
            </div>

            {/* Subscription Plans */}
            <Card>
                <CardHeader>
                    <CardTitle>Subscription Plans</CardTitle>
                    <CardDescription>Choose the plan that fits your needs</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-6 md:grid-cols-3">
                        {plans.map((plan, index) => (
                            <div
                                key={index}
                                className={`relative p-6 rounded-xl border-2 ${plan.current
                                        ? 'border-violet-600 bg-violet-600/5'
                                        : 'border-border'
                                    }`}
                            >
                                {plan.popular && (
                                    <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-violet-600 to-indigo-600">
                                        Current Plan
                                    </Badge>
                                )}
                                <div className="text-center mb-6">
                                    <h3 className="text-lg font-semibold">{plan.name}</h3>
                                    <div className="mt-2">
                                        <span className="text-3xl font-bold">{plan.price}</span>
                                        <span className="text-muted-foreground">{plan.period}</span>
                                    </div>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        {plan.tokens} tokens/month
                                    </p>
                                </div>
                                <ul className="space-y-2 mb-6">
                                    {plan.features.map((feature, i) => (
                                        <li key={i} className="flex items-center gap-2 text-sm">
                                            <Check className="h-4 w-4 text-green-600 shrink-0" />
                                            {feature}
                                        </li>
                                    ))}
                                </ul>
                                <Button
                                    className={`w-full ${plan.current ? '' : 'bg-gradient-to-r from-violet-600 to-indigo-600'}`}
                                    variant={plan.current ? 'outline' : 'default'}
                                    disabled={plan.current}
                                >
                                    {plan.current ? 'Current Plan' : 'Upgrade'}
                                </Button>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Transaction History */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Transaction History</CardTitle>
                        <CardDescription>Your recent token transactions</CardDescription>
                    </div>
                    <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Export
                    </Button>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Description</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Amount</TableHead>
                                <TableHead>Date</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {mockTransactions.map((tx) => (
                                <TableRow key={tx.id}>
                                    <TableCell className="font-medium">{tx.description}</TableCell>
                                    <TableCell>
                                        {tx.type === 'purchase' ? (
                                            <Badge className="bg-green-500/10 text-green-600">Purchase</Badge>
                                        ) : (
                                            <Badge variant="secondary">Usage</Badge>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <span className={`flex items-center gap-1 font-medium ${tx.amount > 0 ? 'text-green-600' : 'text-muted-foreground'
                                            }`}>
                                            {tx.amount > 0 ? (
                                                <TrendingUp className="h-4 w-4" />
                                            ) : (
                                                <TrendingDown className="h-4 w-4" />
                                            )}
                                            {tx.amount > 0 ? '+' : ''}{tx.amount}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {formatDistanceToNow(tx.date, { addSuffix: true })}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
