import { getServerSession } from './server'
import type { ServerSession } from './server'

/**
 * Get session in server components
 * This is a convenience wrapper around getServerSession
 */
export async function getSession(): Promise<ServerSession | null> {
  return getServerSession()
}

/**
 * Require session in server components
 * Redirects to login if not authenticated
 */
export async function requireSession(): Promise<ServerSession> {
  const session = await getServerSession()
  if (!session) {
    const { redirect } = await import('next/navigation')
    redirect('/auth/login')
  }
  return session as ServerSession
}

