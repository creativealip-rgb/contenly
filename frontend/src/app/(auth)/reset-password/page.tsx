'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Eye, EyeOff, ArrowLeft, CheckCircle } from 'lucide-react'
import Image from 'next/image'
import { api } from '@/lib/api'

function ResetPasswordForm() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const token = searchParams.get('token')

    const [showPassword, setShowPassword] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [isSuccess, setIsSuccess] = useState(false)
    const [error, setError] = useState('')

    useEffect(() => {
        if (!token) {
            setError('Invalid or missing reset token.')
        }
    }, [token])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!token) return

        setIsLoading(true)
        setError('')

        const formData = new FormData(e.target as HTMLFormElement)
        const password = formData.get('password') as string
        const confirmPassword = formData.get('confirmPassword') as string

        if (password !== confirmPassword) {
            setError('Passwords do not match')
            setIsLoading(false)
            return
        }

        try {
            await api.auth.resetPassword({ token, password })
            setIsSuccess(true)
            // Redirect after 2 seconds
            setTimeout(() => router.push('/login'), 3000)
        } catch (error: any) {
            console.error('Reset password error:', error)
            setError(error.message || 'Failed to reset password')
        } finally {
            setIsLoading(false)
        }
    }

    if (isSuccess) {
        return (
            <div className="text-center space-y-4">
                <div className="flex justify-center">
                    <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                        <CheckCircle className="h-6 w-6" />
                    </div>
                </div>
                <h3 className="text-lg font-semibold">Password Reset Successful!</h3>
                <p className="text-sm text-muted-foreground">
                    Your password has been updated. You will be redirected to login shortly.
                </p>
                <Button asChild className="w-full mt-4" variant="outline">
                    <Link href="/login">Go to Login</Link>
                </Button>
            </div>
        )
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
                <div className="p-3 rounded-md bg-red-50 text-red-500 text-sm font-medium border border-red-200">
                    {error}
                </div>
            )}

            <div className="space-y-2">
                <Label htmlFor="password">New Password</Label>
                <div className="relative">
                    <Input
                        id="password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Enter new password"
                        required
                        minLength={8}
                    />
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => setShowPassword(!showPassword)}
                    >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    placeholder="Confirm new password"
                    required
                    minLength={8}
                />
            </div>

            <Button
                type="submit"
                className="w-full btn-premium"
                disabled={isLoading || !token}
            >
                {isLoading ? 'Resetting...' : 'Reset Password'}
            </Button>
        </form>
    )
}

export default function ResetPasswordPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-cyan-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 p-4">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <Link href="/" className="inline-flex items-center">
                        <div className="flex items-center justify-center overflow-hidden">
                            <Image src="/logo-full.png" alt="Contently Logo" width={180} height={50} className="object-contain h-12 w-auto" />
                        </div>
                    </Link>
                </div>

                <Card className="border-0 shadow-xl">
                    <CardHeader className="space-y-1 text-center">
                        <CardTitle className="text-2xl font-bold">Set New Password</CardTitle>
                        <CardDescription>
                            Create a strong password for your account
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Suspense fallback={<div>Loading...</div>}>
                            <ResetPasswordForm />
                        </Suspense>

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
