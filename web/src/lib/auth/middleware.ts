/**
 * Authentication Middleware Logic
 * 
 * Core authentication, CSRF, and rate limiting logic for Next.js middleware.
 * This is the business logic that can be tested independently.
 * 
 * @security Implements server-side token validation, CSRF protection, and rate limiting
 */

import { NextRequest, NextResponse } from 'next/server'
import { validateToken, extractAccessToken } from './server'
import { verifyCSRFToken, getCSRFCookie } from './csrf'
import { checkRateLimit } from './rate-limiter'
import type { TokenValidationResult } from './types'

// Public routes that don't require authentication
const publicRoutes = [
  '/',
  '/auth/signin',
  '/auth/login',
  '/auth/signup',
  '/auth/register',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/auth/verify-email',
  '/auth/verify-2fa',
  '/about',
  '/blog',
  '/discover',
  '/travel',
]

// Protected routes that require authentication
const protectedRoutes: string[] = [
  '/dashboard',
  '/profile',
  '/settings',
]

// Auth endpoints that need rate limiting (backend endpoints)
const authEndpoints = [
  '/api/v1/users/login',
  '/api/v1/users/refresh',
  '/api/v1/users/password/reset/request',
  '/api/v1/users/password/change',
]

// State-changing methods that require CSRF protection
const CSRF_REQUIRED_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE']

/**
 * Checks if a route is public
 */
function isPublicRoute(pathname: string): boolean {
  return publicRoutes.some(
    (route) => pathname === route || pathname.startsWith(route + '/')
  )
}

/**
 * Checks if a route is protected
 */
function isProtectedRoute(pathname: string): boolean {
  return protectedRoutes.some((route) => pathname.startsWith(route))
}

/**
 * Checks if a route is an auth endpoint
 */
function isAuthEndpoint(pathname: string): boolean {
  return authEndpoints.some((endpoint) => pathname.startsWith(endpoint))
}

/**
 * Checks if a method requires CSRF protection
 */
function requiresCSRF(method: string): boolean {
  return CSRF_REQUIRED_METHODS.includes(method)
}

/**
 * Creates a response that clears auth cookies and redirects to login
 */
function createUnauthorizedResponse(
  request: NextRequest,
  reason: string = 'Unauthorized'
): NextResponse {
  const response = NextResponse.redirect(
    new URL('/auth/signin', request.url)
  )

  // Clear all auth cookies
  response.cookies.delete('access_token')
  response.cookies.delete('refresh_token')
  response.cookies.delete('csrf_token')

  return response
}

/**
 * Main authentication middleware logic
 * 
 * @param request - Next.js request object
 * @returns NextResponse or null (null means continue)
 * 
 * @security This is the core security gate - validates tokens, CSRF, and rate limits
 */
export async function authMiddleware(
  request: NextRequest
): Promise<NextResponse | null> {
  const { pathname } = request.nextUrl

  // 1. Rate limiting for auth endpoints
  if (isAuthEndpoint(pathname)) {
    const rateLimit = await checkRateLimit(pathname, request)
    if (rateLimit.limited) {
      return NextResponse.json(
        {
          error: 'Too many requests',
          retryAfter: rateLimit.retryAfter,
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(rateLimit.retryAfter || 60),
          },
        }
      )
    }
  }

  // 2. CSRF protection for state-changing requests
  if (requiresCSRF(request.method)) {
    // Skip CSRF for public routes (including public API routes like csrf-token)
    if (isPublicRoute(pathname)) {
      // Allow public routes without CSRF check
    } else if (!isProtectedRoute(pathname) && !pathname.startsWith('/api/')) {
      // Allow non-API public routes
    } else {
      // Verify CSRF token for protected routes and non-public API routes
      // In middleware, cookies are accessed via request.cookies
      const isValid = await verifyCSRFToken(request, request.cookies)
      if (!isValid) {
        return NextResponse.json(
          { error: 'Invalid CSRF token' },
          { status: 403 }
        )
      }
    }
  }

  // 3. Public routes - allow through
  if (isPublicRoute(pathname)) {
    return null // Continue
  }

  // 4. Protected routes - validate authentication
  if (isProtectedRoute(pathname)) {
    const accessToken = extractAccessToken(request)

    if (!accessToken) {
      // No token - redirect to login
      const signInUrl = new URL('/auth/signin', request.url)
      signInUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(signInUrl)
    }

    // Validate token (signature, expiry, blacklist)
    const validation = await validateToken(accessToken)
    if (!validation.valid) {
      // Invalid token - clear cookies and redirect
      return createUnauthorizedResponse(request, validation.error || 'Invalid token')
    }

    // Token is valid - continue
    return null
  }

  // 5. API routes - validate if they require auth
  if (pathname.startsWith('/api/')) {
    // Most API routes require auth (except public auth endpoints)
    if (!isPublicRoute(pathname)) {
      const accessToken = extractAccessToken(request)

      if (!accessToken) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        )
      }

      // Validate token
      const validation = await validateToken(accessToken)
      if (!validation.valid) {
        // Clear cookies
        const response = NextResponse.json(
          { error: 'Invalid or expired token' },
          { status: 401 }
        )
        response.cookies.delete('access_token')
        response.cookies.delete('refresh_token')
        return response
      }

      // Token is valid - continue
      return null
    }
  }

  // Default: allow through
  return null
}

