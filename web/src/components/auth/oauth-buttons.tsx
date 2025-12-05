'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Alert, AlertTitle } from '@/components/ui/alert'
import { OctagonAlert } from 'lucide-react'
import type { OAuthProvider } from '@/lib/auth/oauth'

interface OAuthButtonsProps {
  onError?: (error: string) => void
}

export function OAuthButtons({ onError }: OAuthButtonsProps) {
  const router = useRouter()
  const [loading, setLoading] = useState<OAuthProvider | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleOAuth = (provider: OAuthProvider) => {
    setError(null)
    setLoading(provider)

    try {
      // Get current path for redirect after OAuth
      const redirectTo = window.location.pathname === '/auth/login' 
        ? '/' 
        : window.location.pathname

      // Build OAuth initiation URL
      const oauthUrl = `/api/auth/oauth/${provider}?redirect=${encodeURIComponent(redirectTo)}`
      
      // Use window.location for full page redirect
      // This is required for OAuth flows as they need to redirect to external providers
      // fetch() cannot follow cross-origin redirects due to CORS
      window.location.href = oauthUrl
      
      // Note: setLoading(null) won't be called because page will redirect
      // But we keep it for error cases
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : `Failed to sign in with ${provider}`
      setError(errorMessage)
      setLoading(null)
      if (onError) {
        onError(errorMessage)
      }
    }
  }

  const providers: Array<{ name: OAuthProvider; label: string; icon?: string }> = [
    { name: 'google', label: 'Continue with Google' },
    { name: 'github', label: 'Continue with GitHub' },
    { name: 'facebook', label: 'Continue with Facebook' },
    { name: 'apple', label: 'Continue with Apple' },
  ]

  return (
    <div className="space-y-3">
      {error && (
        <Alert className="bg-destructive/10 border-destructive/20 rounded-[18px]">
          <OctagonAlert className="h-4 w-4 text-destructive" />
          <AlertTitle className="text-sm">{error}</AlertTitle>
        </Alert>
      )}

      {providers.map((provider) => (
        <Button
          key={provider.name}
          type="button"
          variant="outline"
          className="w-full h-11 rounded-[18px] font-light"
          onClick={() => handleOAuth(provider.name)}
          disabled={loading !== null}
        >
          {loading === provider.name ? (
            <span>Connecting...</span>
          ) : (
            <span>{provider.label}</span>
          )}
        </Button>
      ))}
    </div>
  )
}

