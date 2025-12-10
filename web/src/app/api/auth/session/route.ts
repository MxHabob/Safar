/**
 * Session API Route
 * 
 * Returns current session data
 */

import { NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth/server/session'

export async function GET() {
  try {
    const session = await getServerSession()
    
    if (!session) {
      return NextResponse.json(
        { user: null },
        { status: 200 }
      )
    }

    return NextResponse.json({
      user: session.user,
      sessionId: session.sessionId,
      expiresAt: session.expiresAt,
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

