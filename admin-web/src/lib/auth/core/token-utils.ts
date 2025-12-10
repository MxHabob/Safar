/**
 * Token utilities that can run on both client and server.
 * Avoids importing server-only APIs like cookies.
 */
import { decodeJwt } from 'jose'

/**
 * Validate JWT token
 */
export function validateToken(token: string): {
  valid: boolean
  payload?: {
    sub?: string
    email?: string
    role?: string
    session_id?: string
    mfa_verified?: boolean
    exp?: number
    iat?: number
  }
} {
  try {
    const decoded = decodeJwt(token)
    
    // Check expiration
    if (decoded.exp && decoded.exp * 1000 < Date.now()) {
      return { valid: false }
    }

    return {
      valid: true,
      payload: decoded as any,
    }
  } catch {
    return { valid: false }
  }
}

/**
 * Check if token is expired or will expire soon
 */
export function isTokenExpiringSoon(token: string, bufferMinutes: number = 5): boolean {
  try {
    const decoded = decodeJwt(token)
    if (!decoded.exp) return true

    const expiresAt = decoded.exp * 1000
    const buffer = bufferMinutes * 60 * 1000
    return expiresAt - Date.now() < buffer
  } catch {
    return true
  }
}

