'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Sparkles, ArrowLeft, CheckCircle2 } from 'lucide-react'

export default function ForgotPasswordPage() {
    const [isLoading, setIsLoading] = useState(false)
    const [isSubmitted, setIsSubmitted] = useState(false)
    const [email, setEmail] = useState('')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        // Simulate API call
        setTimeout(() => {
            setIsLoading(false)
            setIsSubmitted(true)
        }, 1500)
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-50 via-white to-indigo-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 p-4">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <Link href="/" className="inline-flex items-center gap-2">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 shadow-lg">
                            <Sparkles className="h-6 w-6 text-white" />
                        </div>
                        <span className="font-bold text-2xl bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
                            Camedia AI
                        </span>
                    </Link>
                </div>

                <Card className="border-0 shadow-xl">
                    {isSubmitted ? (
                        <>
                            <CardHeader className="space-y-1 text-center">
                                <div className="flex justify-center mb-4">
                                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                                        <CheckCircle2 className="h-8 w-8 text-green-600" />
                                    </div>
                                </div>
                                <CardTitle className="text-2xl font-bold">Check your email</CardTitle>
                                <CardDescription>
                                    We&apos;ve sent a password reset link to<br />
                                    <span className="font-medium text-foreground">{email}</span>
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <p className="text-sm text-center text-muted-foreground">
                                    Didn&apos;t receive the email? Check your spam folder or{' '}
                                    <button
                                        onClick={() => setIsSubmitted(false)}
                                        className="text-violet-600 hover:underline"
                                    >
                                        try another email address
                                    </button>
                                </p>
                                <Link href="/login">
                                    <Button variant="outline" className="w-full">
                                        <ArrowLeft className="h-4 w-4 mr-2" />
                                        Back to sign in
                                    </Button>
                                </Link>
                            </CardContent>
                        </>
                    ) : (
                        <>
                            <CardHeader className="space-y-1 text-center">
                                <CardTitle className="text-2xl font-bold">Forgot password?</CardTitle>
                                <CardDescription>
                                    No worries, we&apos;ll send you reset instructions.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="email">Email</Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            placeholder="Enter your email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <Button
                                        type="submit"
                                        className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700"
                                        disabled={isLoading}
                                    >
                                        {isLoading ? 'Sending...' : 'Reset Password'}
                                    </Button>
                                </form>

                                <Link href="/login">
                                    <Button variant="ghost" className="w-full">
                                        <ArrowLeft className="h-4 w-4 mr-2" />
                                        Back to sign in
                                    </Button>
                                </Link>
                            </CardContent>
                        </>
                    )}
                </Card>
            </div>
        </div>
    )
}
