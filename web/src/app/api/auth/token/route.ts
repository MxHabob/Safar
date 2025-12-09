import { NextResponse } from 'next/server'
import { getAccessToken } from '@/lib/auth/server'

/**
 * GET /api/auth/token
 * Returns current access token for client-side API requests
 * This allows the API client to get the token when making requests from the browser
 */
export async function GET() {
  try {
    const token = await getAccessToken()
    
    if (!token) {
      return NextResponse.json({ token: null }, { status: 200 })
    }
    
    return NextResponse.json({ token })
  } catch (error) {
    console.error('Token error:', error)
    return NextResponse.json({ token: null }, { status: 200 })
  }
}

