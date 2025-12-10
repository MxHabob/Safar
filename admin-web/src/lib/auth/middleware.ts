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
 */
function isProtectedPath(pathname: string): boolean {
  const protectedPaths = [
    '/account',
    '/dashboard',
    '/admin',
    '/bookings',
    '/messages',
    '/notifications',
    '/payments',
    '/subscriptions',
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
 * Check if path should be excluded from middleware
 */
function isExcludedPath(pathname: string): boolean {
  const excludedPaths = [
    '/_next',
    '/api',
    '/favicon.ico',
    '/public',
    '/static',
    '/health',
  ]
  
  return excludedPaths.some(path => pathname.startsWith(path))
}

/**
 * Authentication Middleware
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
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }
  
  // Handle auth paths - redirect authenticated users away
  if (isAuthPath(pathname) && isAuthenticated) {
    const redirectTo = request.nextUrl.searchParams.get('redirect') || '/'
    return NextResponse.redirect(new URL(redirectTo, request.url))
  }
  
  return null
}

