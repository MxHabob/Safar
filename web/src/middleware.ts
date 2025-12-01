/**
 * Next.js Middleware
 * 
 * Main entry point for Next.js middleware.
 * Combines authentication, CSRF protection, and rate limiting.
 * 
 * @security This is the first line of defense - validates all requests
 */

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { authMiddleware } from './lib/auth/middleware'

export async function middleware(request: NextRequest) {
  // Run authentication middleware
  const response = await authMiddleware(request)

  // If middleware returns a response, use it (redirect, error, etc.)
  if (response) {
    return response
  }

  // Otherwise, continue with the request
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
