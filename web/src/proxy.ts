/**
 * Next.js 16 Proxy
 * 
 * Main entry point for Next.js middleware.
 * Combines authentication, CSRF protection, and rate limiting.
 * 
 * @security This is the first line of defense - validates all requests
 * 
 * Next.js 16 Best Practices:
 * - Lightweight token validation (no database calls)
 * - Route protection based on path patterns
 * - Rate limiting for API protection
 * - CSRF protection for state-changing operations
 */

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { authMiddleware, rateLimitMiddleware, csrfMiddleware } from '@/lib/auth/middleware'

/**
 * Main proxy function
 * Executes in order: CSRF -> Rate Limit -> Auth
 */
export async function proxy(request: NextRequest) {
  // 1. CSRF protection (first line of defense)
  const csrfResponse = csrfMiddleware(request)
  if (csrfResponse) {
    return csrfResponse
  }

  // 2. Rate limiting (protect against abuse)
  const rateLimitResponse = rateLimitMiddleware(request, 100, 60000) // 100 requests per minute
  if (rateLimitResponse) {
    return rateLimitResponse
  }

  // 3. Authentication (route protection)
  const authResponse = await authMiddleware(request)
  if (authResponse) {
    return authResponse
  }

  // All checks passed, continue with request
  return NextResponse.next()
}

/**
 * Middleware configuration
 * Next.js 16: Matcher patterns for route filtering
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - static assets (images, fonts, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2|ttf|eot)$).*)',
  ],
}
