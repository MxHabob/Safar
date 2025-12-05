/**
 * Session Provider
 * 
 * Provides session management and authentication state initialization.
 * This is a lightweight wrapper that ensures auth state is properly initialized
 * and provides server-side session support.
 * 
 * @security Handles session initialization and token validation
 */

'use client'

import { useEffect } from 'react'
import { tokenStorage } from '@/lib/auth/token-storage'

/**
 * SessionProvider Component
 * 
 * Initializes authentication state and handles session restoration.
 * This provider ensures tokens are validated and sessions are properly managed.
 */
export function SessionProvider({ children }: { children: React.ReactNode }) {
  // Initialize session on mount
  useEffect(() => {
    // Validate existing token
    const token = tokenStorage.getAccessToken()
    if (token) {
      // Check if token is still valid
      if (!tokenStorage.hasValidToken()) {
        // Token expired, clear it
        tokenStorage.removeAccessToken()
      }
    }
  }, [])

  return <>{children}</>
}

