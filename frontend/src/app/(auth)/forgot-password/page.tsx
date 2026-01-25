'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { ArrowLeft, Mail } from 'lucide-react'
import Image from 'next/image'
import { api } from '@/lib/api'

export default function ForgotPasswordPage() {
    const [isLoading, setIsLoading] = useState(false)
    const [isSubmitted, setIsSubmitted] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        const formData = new FormData(e.target as HTMLFormElement)
        const email = formData.get('email') as string

        try {
            await api.auth.forgotPassword({ email })
            setIsSubmitted(true)
        } catch (error: any) {
            console.error('Forgot password error:', error)
            alert(error.message || 'Failed to process request')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-50 via-white to-indigo-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 p-4">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <Link href="/" className="inline-flex items-center gap-2">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl overflow-hidden bg-white shadow-lg border">
                            <Image src="/logo.png" alt="Contently Logo" width={48} height={48} className="object-cover" />
                        </div>
                        <span className="font-bold text-2xl bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
                            Contently
                        </span>
                    </Link>
                </div>

                <Card className="border-0 shadow-xl">
                    <CardHeader className="space-y-1 text-center">
                        <CardTitle className="text-2xl font-bold">Reset Password</CardTitle>
                        <CardDescription>
                            Enter your email to receive reset instructions
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {isSubmitted ? (
                            <div className="text-center space-y-4">
                                <div className="flex justify-center">
                                    <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                                        <Mail className="h-6 w-6" />
                                    </div>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    If an account exists with that email, we've sent instructions to reset your password.
                                </p>
                                <Button asChild className="w-full mt-4" variant="outline">
                                    <Link href="/login">Return to Login</Link>
                                </Button>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        id="email"
                                        name="email"
                                        type="email"
                                        placeholder="john@example.com"
                                        required
                                    />
                                </div>

                                <Button
                                    type="submit"
                                    className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700"
                                    disabled={isLoading}
                                >
                                    {isLoading ? 'Sending...' : 'Send Reset Link'}
                                </Button>
                            </form>
                        )}

                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <Separator className="w-full" />
                            </div>
                        </div>

                        <div className="text-center">
                            <Link href="/login" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to Login
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
