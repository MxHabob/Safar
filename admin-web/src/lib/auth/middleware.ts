import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { decodeJwt } from 'jose'

/**
 * Cookie names for authentication tokens
 */
const COOKIE_NAMES = {
  ACCESS_TOKEN: 'auth-token',
  REFRESH_TOKEN: 'refresh-token',
} as const

/**
 * Decoded JWT token structure
 */
interface DecodedToken {
  sub?: string
  exp?: number
  iat?: number
  [key: string]: unknown
}

/**
 * Validate JWT token in middleware
 * Lightweight validation without fetching user data
 */
function validateToken(token: string): DecodedToken | null {
  try {
    const decoded = decodeJwt<DecodedToken>(token)
    
    // Check if token is expired
    if (decoded.exp && decoded.exp * 1000 < Date.now()) {
      return null
    }
    
    return decoded
  } catch (error) {
    return null
  }
}

/**
 * Check if path requires authentication
 */
function isProtectedPath(pathname: string): boolean {
  const protectedPaths = [
    '/account',
    '/dashboard',
    '/admin',
  ]
  
  return protectedPaths.some(path => pathname.startsWith(path))
}

/**
 * Check if path is a public auth path
 */
function isAuthPath(pathname: string): boolean {
  const authPaths = [
    '/login',
    '/register',
    '/forgot-password',
    '/reset-password',
    '/verify-email',
    '/verify-2fa',
  ]
  
  return authPaths.some(path => pathname.startsWith(path))
}

/**
 * Check if path is an API route
 */
function isApiRoute(pathname: string): boolean {
  return pathname.startsWith('/api/')
}

/**
 * Check if path should be excluded from middleware
 */
function isExcludedPath(pathname: string): boolean {
  const excludedPaths = [
    '/_next',
    '/favicon.ico',
    '/public',
    '/static',
  ]
  
  return excludedPaths.some(path => pathname.startsWith(path))
}

/**
 * Authentication Middleware
 * Next.js 16: Lightweight token validation for route protection
 * 
 * Features:
 * - Validates JWT tokens from cookies
 * - Protects authenticated routes
 * - Redirects unauthenticated users to login
 * - Allows public auth routes
 * - Handles API routes separately
 */
export async function authMiddleware(request: NextRequest): Promise<NextResponse | null> {
  const { pathname } = request.nextUrl
  
  // Skip excluded paths
  if (isExcludedPath(pathname)) {
    return null
  }
  
  // Get access token from cookies
  const accessToken = request.cookies.get(COOKIE_NAMES.ACCESS_TOKEN)?.value
  
  // Check if user is authenticated
  const isAuthenticated = accessToken ? validateToken(accessToken) !== null : false
  
  // Handle protected paths
  if (isProtectedPath(pathname)) {
    if (!isAuthenticated) {
      // Redirect to login with return URL
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }
  
  // Handle auth paths - redirect authenticated users away
  if (isAuthPath(pathname) && isAuthenticated) {
    // Redirect authenticated users away from auth pages
    const redirectTo = request.nextUrl.searchParams.get('redirect') || '/'
    return NextResponse.redirect(new URL(redirectTo, request.url))
  }
  
  // Handle API routes - add auth headers if token exists
  if (isApiRoute(pathname)) {
    const response = NextResponse.next()
    
    // Add user info to headers for API routes (if authenticated)
    if (isAuthenticated && accessToken) {
      try {
        const decoded = validateToken(accessToken)
        if (decoded && decoded.sub) {
          response.headers.set('x-user-id', decoded.sub as string)
        }
      } catch (error) {
        // Silently fail - don't break the request
      }
    }
    
    return response
  }
  
  // For all other paths, continue normally
  return null
}

/**
 * Rate limiting middleware (simple in-memory implementation)
 * For production, use Redis or a dedicated service
 */
const rateLimitStore = new Map<string, { count: number; resetAt: number }>()

export function rateLimitMiddleware(
  request: NextRequest,
  limit: number = 100,
  windowMs: number = 60000 // 1 minute
): NextResponse | null {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 
             request.headers.get('x-real-ip') || 
             'unknown'
  
  const key = `rate-limit:${ip}`
  const now = Date.now()
  const record = rateLimitStore.get(key)
  
  // Clean up old records periodically
  if (Math.random() < 0.01) { // 1% chance to clean up
    for (const [k, v] of rateLimitStore.entries()) {
      if (v.resetAt < now) {
        rateLimitStore.delete(k)
      }
    }
  }
  
  if (!record || record.resetAt < now) {
    // New window
    rateLimitStore.set(key, { count: 1, resetAt: now + windowMs })
    return null
  }
  
  if (record.count >= limit) {
    // Rate limit exceeded
    return new NextResponse(
      JSON.stringify({ error: 'Too many requests', retryAfter: Math.ceil((record.resetAt - now) / 1000) }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': Math.ceil((record.resetAt - now) / 1000).toString(),
          'X-RateLimit-Limit': limit.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': record.resetAt.toString(),
        },
      }
    )
  }
  
  // Increment count
  record.count++
  rateLimitStore.set(key, record)
  
  // Add rate limit headers
  const response = NextResponse.next()
  response.headers.set('X-RateLimit-Limit', limit.toString())
  response.headers.set('X-RateLimit-Remaining', (limit - record.count).toString())
  response.headers.set('X-RateLimit-Reset', record.resetAt.toString())
  
  return null
}

/**
 * CSRF protection middleware
 * Validates CSRF tokens for state-changing operations
 */
export function csrfMiddleware(request: NextRequest): NextResponse | null {
  // Only check POST, PUT, PATCH, DELETE methods
  const method = request.method
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    return null
  }
  
  // Skip API routes that handle their own CSRF
  if (request.nextUrl.pathname.startsWith('/api/auth/')) {
    return null
  }
  
  // For server actions, Next.js handles CSRF automatically
  // This is just an additional layer for API routes
  const origin = request.headers.get('origin')
  const referer = request.headers.get('referer')
  const host = request.headers.get('host')
  
  // In production, validate origin/referer matches host
  if (process.env.NODE_ENV === 'production') {
    if (origin && !origin.includes(host || '')) {
      return new NextResponse(
        JSON.stringify({ error: 'Invalid origin' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      )
    }
  }
  
  return null
}

