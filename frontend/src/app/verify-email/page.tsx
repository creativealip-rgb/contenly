'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import Link from 'next/link'

function VerifyEmailContent() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setMessage('Token verifikasi tidak ditemukan')
      return
    }

    const verifyEmail = async () => {
      try {
        const response = await fetch('/api/v1/auth/verify-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        })

        const data = await response.json()

        if (response.ok) {
          setStatus('success')
          setMessage(data.message || 'Email berhasil diverifikasi')
        } else {
          setStatus('error')
          setMessage(data.message || 'Token verifikasi tidak valid atau sudah kedaluwarsa')
        }
      } catch (error) {
        setStatus('error')
        setMessage('Terjadi kesalahan saat memverifikasi email')
      }
    }

    verifyEmail()
  }, [token])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Verifikasi Email</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col items-center gap-4">
            {status === 'loading' && (
              <>
                <Loader2 className="w-16 h-16 text-blue-500 animate-spin" />
                <p className="text-slate-600 dark:text-slate-400">Memverifikasi email Anda...</p>
              </>
            )}

            {status === 'success' && (
              <>
                <CheckCircle2 className="w-16 h-16 text-emerald-500" />
                <div className="text-center">
                  <p className="text-lg font-semibold text-emerald-600 dark:text-emerald-400">
                    {message}
                  </p>
                  <p className="text-sm text-slate-500 mt-2">
                    Anda sekarang dapat menggunakan semua fitur Contenly.
                  </p>
                </div>
                <Link href="/dashboard">
                  <Button className="w-full bg-gradient-to-r from-blue-600 to-indigo-600">
                    Ke Dashboard
                  </Button>
                </Link>
              </>
            )}

            {status === 'error' && (
              <>
                <XCircle className="w-16 h-16 text-red-500" />
                <div className="text-center">
                  <p className="text-lg font-semibold text-red-600 dark:text-red-400">
                    {message}
                  </p>
                  <p className="text-sm text-slate-500 mt-2">
                    Silakan minta link verifikasi baru.
                  </p>
                </div>
                <div className="flex gap-3">
                  <Link href="/login">
                    <Button variant="outline">Login</Button>
                  </Link>
                  <Link href="/register">
                    <Button>Daftar Ulang</Button>
                  </Link>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-16 h-16 text-blue-500 animate-spin" />
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  )
}
