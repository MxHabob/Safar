/**
 * Authentication Middleware
 * 
 * Next.js 16.0.7 Middleware for route protection
 * Lightweight token validation without API calls
 */

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { decodeJwt } from 'jose'

const COOKIE_NAMES = {
  ACCESS_TOKEN: 'auth-token',
  REFRESH_TOKEN: 'refresh-token',
} as const

interface DecodedToken {
  sub?: string
  exp?: number
  iat?: number
  [key: string]: unknown
}

/**
 * Validate JWT token (lightweight, no API call)
 */
function validateToken(token: string): DecodedToken | null {
  try {
    const decoded = decodeJwt<DecodedToken>(token)
    
    if (decoded.exp && decoded.exp * 1000 < Date.now()) {
      return null
    }
    
    return decoded
  } catch {
    return null
  }
}

/**
 * Check if path requires authentication
 * By default, ALL paths require authentication except public paths
 */
function isProtectedPath(pathname: string): boolean {
  // All paths are protected by default
  // Only public paths are excluded (handled in isAuthPath)
  return true
}

/**
 * Check if path is a public auth path (accessible without authentication)
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
  
  // Exact match or starts with auth path
  return authPaths.some(path => pathname === path || pathname.startsWith(path + '/'))
}

/**
 * Check if path should be excluded from middleware
 * These paths are skipped entirely (no auth check)
 */
function isExcludedPath(pathname: string): boolean {
  const excludedPaths = [
    '/_next',
    '/api',
    '/favicon.ico',
    '/public',
    '/static',
    '/health',
    '/robots.txt',
    '/sitemap.xml',
  ]
  
  // Also exclude static file extensions
  const staticExtensions = ['.ico', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.css', '.js', '.woff', '.woff2', '.ttf', '.eot']
  const hasStaticExtension = staticExtensions.some(ext => pathname.endsWith(ext))
  
  return excludedPaths.some(path => pathname.startsWith(path)) || hasStaticExtension
}

/**
 * Authentication Middleware
 * 
 * Security Model:
 * - ALL paths are protected by default
 * - Only public auth paths (login, register, etc.) are accessible without auth
 * - Excluded paths (static files, API, etc.) are skipped
 * - Authenticated users are redirected away from auth pages
 */
export async function authMiddleware(request: NextRequest): Promise<NextResponse | null> {
  const { pathname } = request.nextUrl
  
  // Skip excluded paths (static files, API routes, etc.)
  if (isExcludedPath(pathname)) {
    return null
  }
  
  // Get access token from cookies
  const accessToken = request.cookies.get(COOKIE_NAMES.ACCESS_TOKEN)?.value
  
  // Check if user is authenticated
  const isAuthenticated = accessToken ? validateToken(accessToken) !== null : false
  
  // Handle public auth paths (login, register, etc.)
  if (isAuthPath(pathname)) {
    // If user is already authenticated, redirect to dashboard
    if (isAuthenticated) {
      const redirectTo = request.nextUrl.searchParams.get('redirect') || '/'
      return NextResponse.redirect(new URL(redirectTo, request.url))
    }
    // Allow access to auth pages for unauthenticated users
    return null
  }
  
  // ALL other paths require authentication
  // This is the default behavior - protect everything except auth pages
  if (!isAuthenticated) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }
  
  // User is authenticated and accessing protected path - allow access
  return null
}

