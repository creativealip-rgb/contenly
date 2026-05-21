import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const protectedRoutes = [
  '/dashboard',
  '/articles',
  '/content-lab',
  '/feeds',
  '/integrations',
  '/settings',
  '/billing',
  '/analytics',
  '/super-admin',
  '/view-boost',
  '/instagram-studio',
  '/video-scripts',
  '/video-clips',
  '/trend-radar',
  '/prompt-generator',
  '/calendar',
  '/notifications',
  '/motion-graphics',
]

const authRoutes = ['/login', '/register', '/forgot-password', '/reset-password']

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route))
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route))

  const cookies = await request.cookies
  const sessionToken =
    cookies.get('better-auth.session_token')?.value ||
    cookies.get('__Secure-better-auth.session_token')?.value ||
    cookies.get('session_token')?.value

  if (isProtectedRoute && !sessionToken) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (isAuthRoute && sessionToken) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  const response = NextResponse.next()
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.png|manifest.json|og-image.png|logo.*|.*\\.svg$|api/).*)',
  ],
}
