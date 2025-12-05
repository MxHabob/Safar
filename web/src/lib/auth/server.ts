/**
 * Server-Side Authentication Utilities
 * 
 * Provides server-side token validation and session management.
 * Works in Server Components, Route Handlers, and Middleware.
 * 
 * Security: Validates JWT signature, expiry, and blacklist status.
 */

import { jwtVerify, type JWTPayload as JoseJWTPayload } from 'jose'
import type { AuthUser, JWTPayload, TokenValidationResult, ServerSession } from './types'

// JWT secret from environment (must match backend)
const JWT_SECRET = process.env.JWT_SECRET || process.env.SECRET_KEY || ''
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || 'https://safar.mulverse.com'

if (!JWT_SECRET) {
  console.warn('⚠️  JWT_SECRET not set. Token validation will fail.')
}

/**
 * Validates JWT access token signature and expiry
 * 
 * @param token - JWT access token to validate
 * @returns Validation result with payload if valid
 * 
 * @example
 * ```ts
 * const result = await validateToken(token)
 * if (result.valid && result.payload) {
 *   // Token is valid, use payload
 * }
 * ```
 */
export async function validateToken(
  token: string
): Promise<TokenValidationResult> {
  try {
    if (!JWT_SECRET) {
      return { valid: false, error: 'invalid' }
    }

    // Verify token signature and expiry
    const secret = new TextEncoder().encode(JWT_SECRET)
    const { payload } = await jwtVerify(token, secret, {
      algorithms: ['HS256'],
    })

    const jwtPayload = payload as unknown as JWTPayload

    // Check if token is expired (jose already checks this, but double-check)
    if (jwtPayload.exp && jwtPayload.exp * 1000 < Date.now()) {
      return { valid: false, error: 'expired' }
    }

    // Check token type (should be access token)
    if (jwtPayload.type !== 'access') {
      return { valid: false, error: 'invalid' }
    }

    // Check if token is blacklisted (requires Redis check)
    const isBlacklisted = await checkTokenBlacklist(jwtPayload.jti)
    if (isBlacklisted) {
      return { valid: false, error: 'blacklisted' }
    }

    return {
      valid: true,
      payload: jwtPayload,
    }
  } catch (error: any) {
    // Handle specific JWT errors
    if (error.code === 'ERR_JWT_EXPIRED' || error.name === 'JWTExpired') {
      return { valid: false, error: 'expired' }
    }
    if (error.code === 'ERR_JWT_INVALID' || error.name === 'JWTInvalid') {
      return { valid: false, error: 'invalid' }
    }
    return { valid: false, error: 'malformed' }
  }
}

/**
 * Checks if a token JTI is in the blacklist
 * 
 * @param jti - JWT ID to check
 * @returns True if token is blacklisted
 * 
 * @security This prevents revoked tokens from being used
 */
async function checkTokenBlacklist(jti: string): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/users/token/check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jti }),
      cache: 'no-store',
    })

    if (!response.ok) {
      return false
    }

    const data = await response.json()
    return data.blacklisted === true
  } catch (error) {
    console.error('Blacklist check failed:', error)
    return false
  }
}

/**
 * Gets the current user session from request cookies
 * 
 * Works in Server Components, Route Handlers, and Middleware.
 * 
 * @param request - Optional Next.js request object (for middleware)
 * @returns Server session with user data, or null if not authenticated
 * 
 * @example
 * ```ts
 * // In Server Component
 * import { getServerSession } from '@/lib/auth/server'
 * 
 * export default async function Page() {
 *   const session = await getServerSession()
 *   if (!session) {
 *     redirect('/login')
 *   }
 *   return <div>Hello {session.user.email}</div>
 * }
 * ```
 * 
 * @example
 * ```ts
 * // In Route Handler
 * import { getServerSession } from '@/lib/auth/server'
 * 
 * export async function GET() {
 *   const session = await getServerSession()
 *   if (!session) {
 *     return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
 *   }
 *   // Use session.user
 * }
 * ```
 */
export async function getServerSession(
  request?: Request
): Promise<ServerSession | null> {
  try {
    let accessToken: string | null = null

    if (request) {
      accessToken = extractAccessToken(request)
    } else {
      const { cookies } = await import('next/headers')
      const cookieStore = await cookies()
      
      accessToken = cookieStore.get('access_token')?.value || null
    }

    if (!accessToken) {
      return null
    }

    const validation = await validateToken(accessToken)
    if (!validation.valid || !validation.payload) {
      return null
    }

    const user = await fetchUserData(accessToken, validation.payload.sub)
    if (!user) {
      return null
    }

    return {
      user,
      accessToken,
      expiresAt: validation.payload.exp * 1000,
    }
  } catch (error) {
    console.error('getServerSession error:', error)
    return null
  }
}

/**
 * Fetches user data from backend API
 * 
 * @param accessToken - Valid access token
 * @param userId - User ID from token payload
 * @returns User data or null
 */
async function fetchUserData(
  accessToken: string,
  userId: string
): Promise<AuthUser | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/users/me`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      cache: 'no-store',
    })

    if (!response.ok) {
      return null
    }

    const data = await response.json()
    return data as AuthUser
  } catch (error) {
    console.error('fetchUserData error:', error)
    return null
  }
}

/**
 * Extracts access token from request
 * 
 * @param request - Next.js request object
 * @returns Access token or null
 */
export function extractAccessToken(request: Request): string | null {
  const authHeader = request.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7)
  }

  const cookieHeader = request.headers.get('cookie')
  if (cookieHeader) {
    const cookies = parseCookies(cookieHeader)
    return cookies.get('access_token') || null
  }

  return null
}

/**
 * Parses cookie string into Map
 * 
 * @param cookieString - Cookie header value
 * @returns Map of cookie names to values
 */
function parseCookies(cookieString: string): Map<string, string> {
  const cookies = new Map<string, string>()
  cookieString.split(';').forEach((cookie) => {
    const [name, ...rest] = cookie.trim().split('=')
    if (name && rest.length > 0) {
      cookies.set(name, decodeURIComponent(rest.join('=')))
    }
  })
  return cookies
}

