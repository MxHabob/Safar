import { NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth/server'

/**
 * GET /api/auth/session
 * Returns current session for client-side use
 */
export async function GET() {
  try {
    const session = await getServerSession()
    
    if (!session) {
      return NextResponse.json({ user: null }, { status: 200 })
    }
    
    return NextResponse.json({
      user: session.user,
      expiresAt: session.expiresAt,
    })
  } catch (error) {
    console.error('Session error:', error)
    return NextResponse.json({ user: null }, { status: 200 })
  }
}

