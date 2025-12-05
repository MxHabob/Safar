/**
 * Server-Side Session Provider Utilities
 * 
 * Utilities for handling server-side session initialization and validation.
 * Used in Server Components and Route Handlers.
 */

import { cookies } from 'next/headers'
import { getServerSession } from './server'
import type { ServerSession } from './types'

/**
 * Gets the current session on the server side
 * 
 * @returns Server session or null if not authenticated
 * 
 * @example
 * ```tsx
 * // In Server Component
 * import { getSession } from '@/lib/auth/session-provider'
 * 
 * export default async function Page() {
 *   const session = await getSession()
 *   if (!session) {
 *     redirect('/auth/login')
 *   }
 *   return <div>Hello {session.user.email}</div>
 * }
 * ```
 */
export async function getSession(): Promise<ServerSession | null> {
  return await getServerSession()
}

/**
 * Requires authentication - throws error if not authenticated
 * 
 * @returns Server session (never null)
 * @throws Error if not authenticated
 * 
 * @example
 * ```tsx
 * import { requireAuth } from '@/lib/auth/session-provider'
 * 
 * export default async function Page() {
 *   const session = await requireAuth()
 *   return <div>Hello {session.user.email}</div>
 * }
 * ```
 */
export async function requireAuth(): Promise<ServerSession> {
  const session = await getServerSession()
  if (!session) {
    throw new Error('Unauthorized')
  }
  return session
}

/**
 * Checks if user is authenticated on server side
 * 
 * @returns True if authenticated, false otherwise
 */
export async function isAuthenticated(): Promise<boolean> {
  const session = await getServerSession()
  return session !== null
}

