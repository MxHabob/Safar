import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { authMiddleware } from '@/lib/auth/middleware'

/**
 * Next.js Proxy (Middleware)
 * Runs on every request before the page is rendered
 * 
 * Security Features:
 * - Authentication checks (ALL pages protected by default)
 * - Authorization checks
 * - Security headers
 * - CSRF protection ready
 * - Rate limiting ready
 * 
 * Protection Model:
 * - Default: ALL routes require authentication
 * - Exceptions: Public auth pages (login, register, etc.)
 * - Exclusions: Static files, API routes, health checks
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 1. Authentication & Authorization
  // This will redirect unauthenticated users to /login
  // and allow authenticated users to access protected routes
  const authResponse = await authMiddleware(request)
  if (authResponse) {
    // authResponse is either:
    // - Redirect to /login (unauthenticated user)
    // - Redirect from auth page to dashboard (authenticated user on auth page)
    // Add security headers to redirect response
    authResponse.headers.set('X-DNS-Prefetch-Control', 'on')
    authResponse.headers.set('X-Frame-Options', 'SAMEORIGIN')
    authResponse.headers.set('X-Content-Type-Options', 'nosniff')
    authResponse.headers.set('X-XSS-Protection', '1; mode=block')
    authResponse.headers.set('Referrer-Policy', 'origin-when-cross-origin')
    return authResponse
  }

  // 2. Add security headers to successful responses
  const response = NextResponse.next()
  
  // Security headers
  response.headers.set('X-DNS-Prefetch-Control', 'on')
  response.headers.set('X-Frame-Options', 'SAMEORIGIN')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'origin-when-cross-origin')
  
  // Content Security Policy (adjust as needed)
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:;"
  )
  
  // HSTS (only in production)
  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=63072000; includeSubDomains; preload'
    )
  }

  return response
}

/**
 * Proxy matcher
 * Configure which routes should be processed by proxy
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

