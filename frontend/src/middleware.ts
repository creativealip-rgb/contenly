import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Protected routes that require authentication
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
]

// Auth routes that should redirect to dashboard if already logged in
const authRoutes = [
    '/login',
    '/register',
    '/forgot-password',
    '/reset-password',
]

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl

    // Check if the path is a protected route
    const isProtectedRoute = protectedRoutes.some(route => 
        pathname.startsWith(`/${route}`) || pathname === `/${route}`
    )

    // Check if the path is an auth route
    const isAuthRoute = authRoutes.some(route => 
        pathname.startsWith(`/${route}`) || pathname === `/${route}`
    )

    // Get session token from cookies
    // Better Auth uses 'better-auth.session_token' or similar cookie name
    const sessionToken = request.cookies.get('better-auth.session_token')?.value ||
                         request.cookies.get('session_token')?.value

    // If trying to access protected route without session, redirect to login
    if (isProtectedRoute && !sessionToken) {
        const loginUrl = new URL('/login', request.url)
        loginUrl.searchParams.set('callbackUrl', pathname)
        return NextResponse.redirect(loginUrl)
    }

    // If trying to access auth routes with valid session, redirect to dashboard
    if (isAuthRoute && sessionToken) {
        // Note: We can't fully validate the session here without calling the backend
        // But we can do a basic check and let the client-side guard handle full validation
        // For full security, you'd want to verify the session with the backend API
        return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    return NextResponse.next()
}

export const config = {
    matcher: [
        /*
         * Match all request paths except:
         * - api routes (handled separately)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public files (public folder)
         */
        '/((?!api|_next/static|_next/image|favicon.ico|public|.*\\..*).*)',
    ],
}