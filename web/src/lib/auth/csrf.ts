/**
 * CSRF Protection (Double Submit Cookie Pattern)
 * 
 * Implements CSRF protection using the Double Submit Cookie pattern:
 * 1. Generate CSRF token on login/refresh
 * 2. Store in httpOnly cookie (server-side)
 * 3. Return same token in response body (client-side)
 * 4. Client sends token in X-CSRF-Token header on state-changing requests
 * 5. Server verifies cookie and header match
 * 
 * @security Prevents Cross-Site Request Forgery attacks
 */

import { randomBytes } from 'crypto'

const CSRF_TOKEN_LENGTH = 32 // 256 bits
const CSRF_COOKIE_NAME = 'csrf_token'
const CSRF_HEADER_NAME = 'x-csrf-token'

/**
 * Generates a cryptographically secure CSRF token
 * 
 * @returns 64-character hex string (256 bits)
 */
export function generateCSRFToken(): string {
  return randomBytes(CSRF_TOKEN_LENGTH).toString('hex')
}

/**
 * Sets CSRF token in httpOnly cookie
 * 
 * @param token - CSRF token to set
 * @param cookieStore - Next.js cookie store
 * @param maxAge - Cookie max age in seconds (default: 7 days)
 * 
 * @security Cookie is httpOnly, secure, and SameSite=Strict
 */
export function setCSRFCookie(
  token: string,
  cookieStore: any,
  maxAge: number = 60 * 60 * 24 * 7 // 7 days
): void {
  cookieStore.set(CSRF_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge,
  })
}

/**
 * Gets CSRF token from cookie
 * 
 * @param cookieStore - Next.js cookie store
 * @returns CSRF token or null
 */
export function getCSRFCookie(cookieStore: any): string | null {
  return cookieStore.get(CSRF_COOKIE_NAME)?.value || null
}

/**
 * Verifies CSRF token from header matches cookie
 * 
 * @param request - Next.js request object
 * @param cookieStore - Next.js cookie store (can be request.cookies in middleware or cookies() in route handlers)
 * @returns True if tokens match, false otherwise
 * 
 * @security This is the core CSRF protection - verifies request authenticity
 * 
 * @example
 * ```ts
 * // In middleware or route handler
 * const isValid = await verifyCSRFToken(request, cookieStore)
 * if (!isValid) {
 *   return NextResponse.json({ error: 'Invalid CSRF token' }, { status: 403 })
 * }
 * ```
 */
export async function verifyCSRFToken(
  request: Request,
  cookieStore: any
): Promise<boolean> {
  // Get token from cookie
  // Handle both middleware (request.cookies) and route handlers (cookies())
  let cookieToken: string | null = null
  
  if (cookieStore.get) {
    // Next.js cookies() API
    cookieToken = cookieStore.get(CSRF_COOKIE_NAME)?.value || null
  } else if (cookieStore.has) {
    // Next.js middleware request.cookies API
    cookieToken = cookieStore.get(CSRF_COOKIE_NAME)?.value || null
  }
  
  if (!cookieToken) {
    return false
  }

  // Get token from header
  const headerToken = request.headers.get(CSRF_HEADER_NAME)
  if (!headerToken) {
    return false
  }

  // Compare tokens (constant-time comparison to prevent timing attacks)
  return constantTimeEqual(cookieToken, headerToken)
}

/**
 * Constant-time string comparison to prevent timing attacks
 * 
 * @param a - First string
 * @param b - Second string
 * @returns True if strings are equal
 * 
 * @security Prevents timing-based attacks on token comparison
 */
function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false
  }

  let result = 0
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return result === 0
}

/**
 * Clears CSRF token cookie
 * 
 * @param cookieStore - Next.js cookie store
 */
export function clearCSRFCookie(cookieStore: any): void {
  cookieStore.delete(CSRF_COOKIE_NAME)
}

/**
 * CSRF header name constant for client-side use
 */
export const CSRF_HEADER = CSRF_HEADER_NAME

