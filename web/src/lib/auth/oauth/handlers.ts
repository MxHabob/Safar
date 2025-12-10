/**
 * OAuth Handlers
 * 
 * OAuth 2.0 with PKCE support
 */

'use server'

import { cookies } from 'next/headers'
import { randomBytes, createHash } from 'crypto'
import { redirect } from 'next/navigation'
import type { OauthLoginApiV1UsersOauthLoginPostRequest } from '@/generated/schemas'
import { apiClient } from '@/generated/client'
import { setTokens } from '../core/token-manager'
import { sessionStore } from '../core/session-store'

export type OAuthProvider = 'google' | 'apple' | 'facebook' | 'github'

const OAUTH_CONFIG = {
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    redirectUri: process.env.GOOGLE_REDIRECT_URI || `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/oauth/callback/google`,
  },
  apple: {
    clientId: process.env.APPLE_CLIENT_ID,
    clientSecret: process.env.APPLE_CLIENT_SECRET,
    redirectUri: process.env.APPLE_REDIRECT_URI || `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/oauth/callback/apple`,
  },
  facebook: {
    clientId: process.env.FACEBOOK_CLIENT_ID,
    clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
    redirectUri: process.env.FACEBOOK_REDIRECT_URI || `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/oauth/callback/facebook`,
  },
  github: {
    clientId: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    redirectUri: process.env.GITHUB_REDIRECT_URI || `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/oauth/callback/github`,
  },
} as const

/**
 * Generate PKCE code verifier and challenge
 */
function generatePKCE(): { codeVerifier: string; codeChallenge: string } {
  const codeVerifier = randomBytes(32).toString('base64url')
  const codeChallenge = createHash('sha256')
    .update(codeVerifier)
    .digest('base64url')
  
  return { codeVerifier, codeChallenge }
}

/**
 * Generate state parameter for CSRF protection
 */
function generateState(): string {
  return randomBytes(32).toString('base64url')
}

/**
 * Store OAuth state and PKCE
 */
async function storeOAuthState(
  state: string,
  codeVerifier: string,
  provider: OAuthProvider
): Promise<void> {
  const cookieStore = await cookies()
  
  cookieStore.set(`oauth-state-${provider}`, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 600, // 10 minutes
    path: '/',
  })
  
  cookieStore.set(`oauth-verifier-${provider}`, codeVerifier, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 600, // 10 minutes
    path: '/',
  })
}

/**
 * Get OAuth state
 */
async function getOAuthState(provider: OAuthProvider): Promise<string | null> {
  const cookieStore = await cookies()
  return cookieStore.get(`oauth-state-${provider}`)?.value ?? null
}

/**
 * Get OAuth code verifier
 */
async function getOAuthVerifier(provider: OAuthProvider): Promise<string | null> {
  const cookieStore = await cookies()
  return cookieStore.get(`oauth-verifier-${provider}`)?.value ?? null
}

/**
 * Clear OAuth state
 */
async function clearOAuthState(provider: OAuthProvider): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(`oauth-state-${provider}`)
  cookieStore.delete(`oauth-verifier-${provider}`)
}

/**
 * Initiate OAuth flow
 */
export async function initiateOAuth(provider: OAuthProvider, redirectTo?: string): Promise<string> {
  const config = OAUTH_CONFIG[provider]
  
  if (!config.clientId) {
    throw new Error(`${provider} OAuth not configured`)
  }

  const { codeVerifier, codeChallenge } = generatePKCE()
  const state = generateState()
  
  // Store state and verifier
  await storeOAuthState(state, codeVerifier, provider)
  
  // Build authorization URL
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: 'code',
    scope: getOAuthScopes(provider),
    state,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  })
  
  if (redirectTo) {
    params.set('redirect_to', redirectTo)
  }
  
  const authUrl = getOAuthAuthUrl(provider) + '?' + params.toString()
  return authUrl
}

/**
 * Exchange authorization code for ID token
 */
async function exchangeCodeForToken(
  provider: OAuthProvider,
  code: string,
  codeVerifier: string | null | undefined
): Promise<string> {
  const config = OAUTH_CONFIG[provider]
  
  switch (provider) {
    case 'google': {
      const tokenUrl = 'https://oauth2.googleapis.com/token'
      const params = new URLSearchParams({
        client_id: config.clientId!,
        client_secret: config.clientSecret!,
        code,
        grant_type: 'authorization_code',
        redirect_uri: config.redirectUri,
      })
      if (codeVerifier) {
        params.append('code_verifier', codeVerifier)
      }
      
      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params,
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(`Google token exchange failed: ${error}`)
      }

      const data = await response.json()
      if (!data.id_token) {
        throw new Error('Google response missing id_token')
      }
      return data.id_token
    }
    
    case 'apple': {
      // Apple uses different token endpoint
      const tokenUrl = 'https://appleid.apple.com/auth/token'
      const params = new URLSearchParams({
        client_id: config.clientId!,
        client_secret: config.clientSecret!,
        code,
        grant_type: 'authorization_code',
        redirect_uri: config.redirectUri,
      })
      if (codeVerifier) {
        params.append('code_verifier', codeVerifier)
      }
      
      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params,
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(`Token exchange failed: ${error}`)
      }

      const data = await response.json()
      return data.id_token
    }
    
    case 'facebook': {
      // Facebook uses access_token as ID token
      // Note: Facebook doesn't use PKCE, so we don't send code_verifier
      const tokenUrl = 'https://graph.facebook.com/v18.0/oauth/access_token'
      const params = new URLSearchParams({
        client_id: config.clientId!,
        client_secret: config.clientSecret!,
        code,
        redirect_uri: config.redirectUri,
      })
      
      // Facebook uses GET with query params
      const urlWithParams = `${tokenUrl}?${params.toString()}`
      const response = await fetch(urlWithParams, {
        method: 'GET',
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(`Facebook token exchange failed: ${error}`)
      }

      const data = await response.json()
      if (!data.access_token) {
        throw new Error('Facebook response missing access_token')
      }
      return data.access_token
    }
    
    case 'github': {
      // GitHub uses access_token
      // Note: GitHub doesn't use PKCE by default, but we can include it
      const tokenUrl = 'https://github.com/login/oauth/access_token'
      const params = new URLSearchParams({
        client_id: config.clientId!,
        client_secret: config.clientSecret!,
        code,
        redirect_uri: config.redirectUri,
      })
      
      // GitHub supports PKCE but it's optional
      // We include code_verifier if available for better security
      if (codeVerifier) {
        params.append('code_verifier', codeVerifier)
      }
      
      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
        },
        body: params,
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(`GitHub token exchange failed: ${error}`)
      }

      const data = await response.json()
      if (!data.access_token) {
        throw new Error('GitHub response missing access_token')
      }
      return data.access_token
    }
    
    default:
      throw new Error(`Unsupported provider: ${provider}`)
  }
}

/**
 * Handle OAuth callback
 */
export async function handleOAuthCallback(
  provider: OAuthProvider,
  code: string,
  state: string
): Promise<void> {
  // Validate state
  const storedState = await getOAuthState(provider)
  if (!storedState || storedState !== state) {
    throw new Error('Invalid OAuth state')
  }

  // Get code verifier (optional for some providers)
  const codeVerifier = await getOAuthVerifier(provider)
  
  // PKCE is required for Google and Apple, optional for others
  if ((provider === 'google' || provider === 'apple') && !codeVerifier) {
    throw new Error('OAuth verifier not found')
  }

  // Clear OAuth state
  await clearOAuthState(provider)

  try {
    // Exchange authorization code for ID token
    const idToken = await exchangeCodeForToken(provider, code, codeVerifier || undefined)
    
    if (!idToken) {
      throw new Error('Failed to exchange authorization code for token')
    }
    
    // Send ID token to backend
    const request: OauthLoginApiV1UsersOauthLoginPostRequest = {
      provider,
      token: idToken,
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('[OAuth] Sending request to backend:', {
        provider,
        tokenLength: idToken.length,
      })
    }

    // Call backend OAuth login using API client directly
    // (Not using safe action because updateTag doesn't work in Route Handlers)
    let response: any
    try {
      response = await apiClient.users.oauthLoginApiV1UsersOauthLoginPost({
        body: request,
        config: {
          timeout: 30000,
          retries: 3,
        },
      })
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') {
        console.error('[OAuth] Backend call error:', {
          message: error?.message,
          statusCode: error?.statusCode,
          status: error?.status,
          error,
        })
      }
      throw new Error(`OAuth login failed: ${error?.message || 'Unknown error'}`)
    }
    
    // Note: Cache revalidation is handled by the API client
    // In Route Handlers, we can't use updateTag, but the API client handles caching
    
    // Extract data from API client response
    // API client returns { data, status, headers, ... }
    const authResponse = response.data
    
    // Debug logging in development
    if (process.env.NODE_ENV === 'development') {
      console.log('[OAuth] Backend response:', {
        status: response.status,
        hasData: !!response.data,
        dataKeys: response.data && typeof response.data === 'object' ? Object.keys(response.data) : [],
        hasAccessToken: response.data && typeof response.data === 'object' && 'access_token' in response.data,
        hasUser: response.data && typeof response.data === 'object' && 'user' in response.data,
        hasRefreshToken: response.data && typeof response.data === 'object' && 'refresh_token' in response.data,
      })
    }
    
    // Validate response
    if (!authResponse || typeof authResponse !== 'object') {
      throw new Error('Invalid OAuth response: response.data is not an object')
    }
    
    if (!authResponse.access_token) {
      const errorMsg = `Invalid OAuth response: missing access_token. Response keys: ${Object.keys(authResponse).join(', ')}`
      if (process.env.NODE_ENV === 'development') {
        console.error('[OAuth]', errorMsg)
        console.error('[OAuth] Full response:', JSON.stringify(authResponse, null, 2))
      }
      throw new Error(errorMsg)
    }
    
    if (!authResponse.refresh_token) {
      const errorMsg = `Invalid OAuth response: missing refresh_token. Response keys: ${Object.keys(authResponse).join(', ')}`
      if (process.env.NODE_ENV === 'development') {
        console.error('[OAuth]', errorMsg)
        console.error('[OAuth] Full response:', JSON.stringify(authResponse, null, 2))
      }
      throw new Error(errorMsg)
    }
    
    if (!authResponse.user) {
      const errorMsg = `Invalid OAuth response: missing user. Response keys: ${Object.keys(authResponse).join(', ')}`
      if (process.env.NODE_ENV === 'development') {
        console.error('[OAuth]', errorMsg)
        console.error('[OAuth] Full response:', JSON.stringify(authResponse, null, 2))
      }
      throw new Error(errorMsg)
    }

    // Store session
    const sessionId = authResponse.session_id || crypto.randomUUID()
    const expiresAt = Date.now() + (authResponse.expires_in * 1000)

    sessionStore.create({
      sessionId,
      userId: authResponse.user.id,
      user: authResponse.user,
      accessToken: authResponse.access_token,
      refreshToken: authResponse.refresh_token,
      expiresAt,
    })

    // Set tokens
    await setTokens(
      {
        accessToken: authResponse.access_token,
        refreshToken: authResponse.refresh_token,
        expiresIn: authResponse.expires_in,
      },
      sessionId
    )

  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('OAuth callback error:', error)
    }
    throw error
  }
}

/**
 * Get OAuth scopes
 */
function getOAuthScopes(provider: OAuthProvider): string {
  switch (provider) {
    case 'google':
      return 'openid email profile'
    case 'apple':
      return 'email name'
    case 'facebook':
      return 'email public_profile'
    case 'github':
      return 'user:email'
    default:
      return 'email'
  }
}

/**
 * Get OAuth authorization URL
 */
function getOAuthAuthUrl(provider: OAuthProvider): string {
  switch (provider) {
    case 'google':
      return 'https://accounts.google.com/o/oauth2/v2/auth'
    case 'apple':
      return 'https://appleid.apple.com/auth/authorize'
    case 'facebook':
      return 'https://www.facebook.com/v18.0/dialog/oauth'
    case 'github':
      return 'https://github.com/login/oauth/authorize'
    default:
      throw new Error(`Unknown OAuth provider: ${provider}`)
  }
}

