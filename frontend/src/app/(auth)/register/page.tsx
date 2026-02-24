'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { authClient } from '@/lib/auth-client'
import { useAuthStore } from '@/stores'

export default function RegisterPage() {
    const router = useRouter()
    const { setUser } = useAuthStore()
    const [showPassword, setShowPassword] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [isGoogleLoading, setIsGoogleLoading] = useState(false)
    const [error, setError] = useState('')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setError('')

        const formData = new FormData(e.target as HTMLFormElement)
        const name = formData.get('name') as string
        const email = formData.get('email') as string
        const password = formData.get('password') as string

        try {
            const { data, error } = await authClient.signUp.email({
                email,
                password,
                name,
            })

            if (error) {
                setError(error.message || 'Registration failed')
                return
            }

            if (data?.user) {
                setUser({
                    id: data.user.id,
                    email: data.user.email,
                    fullName: data.user.name || data.user.email.split('@')[0],
                    role: (data.user as any).role || 'user',
                    avatarUrl: data.user.image || undefined,
                })
                router.push('/dashboard')
            }
        } catch (err: any) {
            console.error('Registration error:', err)
            setError(err.message || 'An error occurred during registration')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen grid lg:grid-cols-2 bg-white dark:bg-gray-950">
            {/* Left Column: Branding / Marketing (Hidden on Mobile) */}
            <div className="hidden lg:flex flex-col relative overflow-hidden bg-gradient-to-br from-indigo-900 via-blue-900 to-cyan-900 dark:from-indigo-950 dark:via-blue-950 dark:to-cyan-950 p-12 text-white">
                {/* Decorative Elements */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
                    <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-blue-500/20 blur-3xl mix-blend-screen opacity-50 animate-blob"></div>
                    <div className="absolute top-40 -right-40 w-96 h-96 rounded-full bg-purple-500/20 blur-3xl mix-blend-screen opacity-50 animate-blob animation-delay-2000"></div>
                    <div className="absolute -bottom-40 left-40 w-96 h-96 rounded-full bg-cyan-500/20 blur-3xl mix-blend-screen opacity-50 animate-blob animation-delay-4000"></div>
                </div>

                <div className="relative z-10 flex flex-col h-full">
                    {/* Brand Logo inside Gradient */}
                    <div className="flex items-center gap-2 font-bold text-2xl tracking-tight mb-auto">
                        <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center">
                            <span className="text-blue-900 text-lg font-black">C</span>
                        </div>
                        <span className="text-white">Contenly</span>
                    </div>

                    <div className="mt-auto pb-12">
                        <h1 className="text-4xl lg:text-5xl font-extrabold tracking-tight mb-6 leading-tight">
                            Buat konten menarik <br />dalam skala besar.
                        </h1>
                        <p className="text-lg text-blue-100 max-w-md font-medium leading-relaxed">
                            Bergabunglah dengan ribuan kreator yang menggunakan alat AI canggih Contenly untuk mengotomatiskan artikel, media sosial, dan lainnya.
                        </p>
                    </div>

                    {/* Testimonial / Social Proof */}
                    <div className="space-y-4">
                        <div className="flex -space-x-3">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className="w-10 h-10 rounded-full border-2 border-blue-900 bg-blue-100 flex items-center justify-center overflow-hidden z-10">
                                    <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=${i + 15}`} alt="User" width={40} height={40} />
                                </div>
                            ))}
                            <div className="w-10 h-10 rounded-full border-2 border-blue-900 bg-gray-900 flex items-center justify-center text-xs font-bold text-white z-0">
                                +2k
                            </div>
                        </div>
                        <p className="text-sm font-medium text-blue-200">Dipercaya oleh lebih dari 2.000+ pembuat konten</p>
                    </div>
                </div>
            </div>

            {/* Right Column: Form */}
            <div className="flex items-center justify-center p-6 sm:p-12 relative overflow-y-auto w-full h-full max-h-screen">
                {/* Mobile Logo Only */}
                <div className="absolute top-8 left-8 lg:hidden">
                    <Link href="/" className="inline-flex items-center gap-2 font-bold text-xl tracking-tight">
                        <div className="w-8 h-8 rounded-md bg-blue-600 flex items-center justify-center">
                            <span className="text-white text-lg font-black">C</span>
                        </div>
                        <span className="text-gray-900 dark:text-white">Contenly</span>
                    </Link>
                </div>

                <div className="w-full max-w-[420px] animate-in fade-in slide-in-from-bottom-4 duration-500 my-auto py-12">
                    <div className="space-y-2 mb-8 text-center">
                        <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-50">Buat akun baru</h2>
                        <p className="text-gray-500 dark:text-gray-400">Bergabunglah dengan kami untuk mulai mengotomatiskan konten Anda segera.</p>
                    </div>

                    {error && (
                        <div className="flex items-center gap-3 bg-red-50/50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl text-sm mb-6 font-medium animate-in slide-in-from-top-2">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-alert-circle h-5 w-5"><circle cx="12" cy="12" r="10" /><line x1="12" x2="12" y1="8" y2="12" /><line x1="12" x2="12.01" y1="16" y2="16" /></svg>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-2">
                            <Label htmlFor="name" className="font-semibold text-gray-700 dark:text-gray-300">Nama Lengkap</Label>
                            <Input
                                id="name"
                                name="name"
                                type="text"
                                placeholder="John Doe"
                                required
                                disabled={isLoading}
                                className="h-12 bg-gray-50 border-gray-200 focus:bg-white focus:ring-2 focus:ring-blue-500/20 dark:bg-gray-900 dark:border-gray-800 dark:focus:bg-gray-900 rounded-xl transition-all"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email" className="font-semibold text-gray-700 dark:text-gray-300">Alamat Email</Label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                placeholder="name@example.com"
                                required
                                disabled={isLoading}
                                className="h-12 bg-gray-50 border-gray-200 focus:bg-white focus:ring-2 focus:ring-blue-500/20 dark:bg-gray-900 dark:border-gray-800 dark:focus:bg-gray-900 rounded-xl transition-all"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password" className="font-semibold text-gray-700 dark:text-gray-300">Kata Sandi</Label>
                            <div className="relative">
                                <Input
                                    id="password"
                                    name="password"
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="Buat kata sandi yang aman"
                                    required
                                    disabled={isLoading}
                                    minLength={8}
                                    className="h-12 bg-gray-50 border-gray-200 focus:bg-white focus:ring-2 focus:ring-blue-500/20 dark:bg-gray-900 dark:border-gray-800 dark:focus:bg-gray-900 rounded-xl transition-all pr-10"
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="absolute right-1 top-1 h-10 w-10 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </Button>
                            </div>
                        </div>

                        <Button
                            type="submit"
                            className="relative w-full h-14 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-semibold text-base shadow-lg shadow-blue-500/30 transition-all hover:-translate-y-1 flex items-center justify-center"
                            disabled={isLoading}
                        >
                            {isLoading && (
                                <div className="absolute left-6">
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                </div>
                            )}
                            <span>{isLoading ? 'Membuat akun...' : 'Buat Akun'}</span>
                        </Button>
                    </form>

                    <div className="mt-8">
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-gray-200 dark:border-gray-800" />
                            </div>
                            <div className="relative flex justify-center text-sm uppercase">
                                <span className="bg-white dark:bg-gray-950 px-3 flex items-center gap-2 text-gray-500 dark:text-gray-400 font-medium">
                                    atau lanjutkan dengan
                                </span>
                            </div>
                        </div>

                        <div className="mt-6">
                            <Button
                                variant="outline"
                                className="relative w-full h-14 rounded-xl border-2 border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 font-semibold text-gray-700 dark:text-gray-200 transition-all hover:-translate-y-1 shadow-sm flex items-center justify-center"
                                disabled={isGoogleLoading || isLoading}
                                onClick={async () => {
                                    setIsGoogleLoading(true)
                                    try {
                                        await authClient.signIn.social({
                                            provider: 'google',
                                            callbackURL: `${window.location.origin}/dashboard`
                                        })
                                    } catch (err) {
                                        console.error('Google login error:', err)
                                        setIsGoogleLoading(false)
                                    }
                                }}
                            >
                                <div className="absolute left-6">
                                    {isGoogleLoading ? (
                                        <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
                                    ) : (
                                        <svg viewBox="0 0 48 48" className="h-6 w-6">
                                            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                                            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                                            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                                            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                                            <path fill="none" d="M0 0h48v48H0z"></path>
                                        </svg>
                                    )}
                                </div>
                                <span>{isGoogleLoading ? 'Menghubungkan...' : 'Lanjutkan dengan Google'}</span>
                            </Button>
                        </div>
                    </div>

                    <p className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
                        Sudah punya akun?{' '}
                        <Link href="/login" className="font-semibold text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 transition-colors">
                            Masuk di sini
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    )
}
