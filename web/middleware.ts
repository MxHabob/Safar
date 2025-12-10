/**
 * Next.js Middleware
 * 
 * Handles authentication and route protection
 */

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { authMiddleware } from './src/lib/auth/middleware'

export async function middleware(request: NextRequest) {
  // Run authentication middleware
  const response = await authMiddleware(request)
  
  if (response) {
    return response
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}

