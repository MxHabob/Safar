'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { randomBytes, createHash } from 'crypto'
import type { OauthLoginApiV1UsersOauthLoginPostRequest } from '@/generated/schemas'
import { apiClient } from '@/generated/client'
import { setAuthTokens } from './server'

/**
 * OAuth Provider types
 */
export type OAuthProvider = 'google' | 'apple' | 'facebook' | 'github'

/**
 * OAuth configuration
 */
const OAUTH_CONFIG = {
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    redirectUri: process.env.GOOGLE_REDIRECT_URI || `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/oauth/callback/google`,
  },
  apple: {
    clientId: process.env.APPLE_CLIENT_ID,
    redirectUri: process.env.APPLE_REDIRECT_URI || `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/oauth/callback/apple`,
  },
  facebook: {
    clientId: process.env.FACEBOOK_CLIENT_ID,
    redirectUri: process.env.FACEBOOK_REDIRECT_URI || `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/oauth/callback/facebook`,
  },
  github: {
    clientId: process.env.GITHUB_CLIENT_ID,
    redirectUri: process.env.GITHUB_REDIRECT_URI || `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/oauth/callback/github`,
  },
} as const

/**
 * Generate PKCE code verifier and challenge
 * OAuth 2.0 Security Best Current Practice (RFC 8252)
 */
function generatePKCE(): { codeVerifier: string; codeChallenge: string } {
  // Generate random code verifier (43-128 characters)
  const codeVerifier = randomBytes(32).toString('base64url')
  
  // Generate code challenge using SHA256
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
 * Store OAuth state and PKCE in secure cookies
 */
async function storeOAuthState(
  state: string,
  codeVerifier: string,
  provider: OAuthProvider
): Promise<void> {
  const cookieStore = await cookies()
  const expiresAt = Date.now() + 10 * 60 * 1000 // 10 minutes
  
  // Store state (for CSRF protection)
  cookieStore.set(`oauth-state-${provider}`, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 600, // 10 minutes
    path: '/',
  })
  
  // Store code verifier (for PKCE)
  cookieStore.set(`oauth-verifier-${provider}`, codeVerifier, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 600, // 10 minutes
    path: '/',
  })
}

/**
 * Get and validate OAuth state
 */
async function getOAuthState(provider: OAuthProvider): Promise<string | null> {
  const cookieStore = await cookies()
  return cookieStore.get(`oauth-state-${provider}`)?.value ?? null
}

/**
 * Get code verifier for PKCE
 */
async function getCodeVerifier(provider: OAuthProvider): Promise<string | null> {
  const cookieStore = await cookies()
  return cookieStore.get(`oauth-verifier-${provider}`)?.value ?? null
}

/**
 * Clear OAuth state cookies
 */
async function clearOAuthState(provider: OAuthProvider): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(`oauth-state-${provider}`)
  cookieStore.delete(`oauth-verifier-${provider}`)
}

/**
 * Initiate OAuth flow
 * Generates PKCE and state, then redirects to provider
 * 
 * Note: This function is used in Route Handlers, so it returns a redirect URL
 * instead of using Next.js redirect() which only works in Server Components
 */
export async function initiateOAuth(provider: OAuthProvider, redirectTo?: string): Promise<string> {
  const config = OAUTH_CONFIG[provider]
  
  if (!config.clientId) {
    throw new Error(`${provider} OAuth is not configured`)
  }
  
  // Generate PKCE and state
  const { codeVerifier, codeChallenge } = generatePKCE()
  const state = generateState()
  
  // Store state and verifier in secure cookies
  await storeOAuthState(state, codeVerifier, provider)
  
  // Store redirect URL if provided
  if (redirectTo) {
    const cookieStore = await cookies()
    cookieStore.set(`oauth-redirect-${provider}`, redirectTo, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600,
      path: '/',
    })
  }
  
  // Build OAuth authorization URL
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: 'code',
    scope: getOAuthScopes(provider),
    state,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  })
  
  const authUrl = getOAuthAuthUrl(provider) + '?' + params.toString()
  
  return authUrl
}

/**
 * Handle OAuth callback
 * Validates state, exchanges code for tokens using PKCE
 * 
 * Note: This function is used in Route Handlers, so it returns a redirect URL
 * instead of using Next.js redirect() which only works in Server Components
 */
export async function handleOAuthCallback(
  provider: OAuthProvider,
  code: string,
  state: string
): Promise<string> {
  // Validate state (CSRF protection)
  const storedState = await getOAuthState(provider)
  if (!storedState || storedState !== state) {
    clearOAuthState(provider)
    throw new Error('Invalid OAuth state. Possible CSRF attack.')
  }
  
  // Get code verifier for PKCE
  const codeVerifier = await getCodeVerifier(provider)
  if (!codeVerifier) {
    clearOAuthState(provider)
    throw new Error('OAuth code verifier not found. Session may have expired.')
  }
  
  // Get redirect URL if stored
  const cookieStore = await cookies()
  const redirectTo = cookieStore.get(`oauth-redirect-${provider}`)?.value || '/'
  cookieStore.delete(`oauth-redirect-${provider}`)
  
  try {
    // Exchange code for access token from OAuth provider first
    // Then send that token to our backend
    const accessToken = await exchangeCodeForToken(provider, code, codeVerifier, OAUTH_CONFIG[provider].redirectUri)
    
    if (!accessToken) {
      throw new Error('Failed to exchange OAuth code for token')
    }
    
    // Send OAuth token to our backend using API client directly (not Server Action)
    // This avoids the updateTag error when called from Route Handlers
    const request: OauthLoginApiV1UsersOauthLoginPostRequest = {
      provider,
      token: accessToken,
    }
    
    try {
      const response = await apiClient.users.oauthLoginApiV1UsersOauthLoginPost({
        body: request,
        config: {
          timeout: 30000,
          retries: 3,
          validateResponse: false,
        }
      })
      
      // Extract data from API response
      const data = response.data
      
      // Validate response
      if (!data || typeof data !== 'object') {
        console.error('[OAuth] Invalid response type:', typeof data, data)
        throw new Error(`Invalid OAuth response: Expected object, got ${typeof data}`)
      }
      
      if (!('access_token' in data)) {
        console.error('[OAuth] Missing access_token in response:', Object.keys(data || {}), data)
        throw new Error(`Invalid OAuth response: Missing access_token in response. Got keys: ${Object.keys(data || {}).join(', ')}`)
      }
      
      // Set tokens in cookies
      await setAuthTokens(data as any)
    } catch (error) {
      // Handle API errors
      if (error && typeof error === 'object' && 'message' in error) {
        const errorMessage = typeof error.message === 'string' ? error.message : 'OAuth login failed'
        console.error('[OAuth] API error:', error)
        throw new Error(errorMessage)
      }
      throw error
    }
    
    // Clear OAuth state
    await clearOAuthState(provider)
    
    // Return redirect URL (will be handled by Route Handler)
    return redirectTo
  } catch (error) {
    // Clear OAuth state on error
    await clearOAuthState(provider)
    throw error
  }
}

/**
 * Get OAuth authorization URL for provider
 */
function getOAuthAuthUrl(provider: OAuthProvider): string {
  const urls = {
    google: 'https://accounts.google.com/o/oauth2/v2/auth',
    apple: 'https://appleid.apple.com/auth/authorize',
    facebook: 'https://www.facebook.com/v18.0/dialog/oauth',
    github: 'https://github.com/login/oauth/authorize',
  }
  return urls[provider]
}

/**
 * Get OAuth scopes for provider
 */
function getOAuthScopes(provider: OAuthProvider): string {
  const scopes = {
    google: 'openid email profile',
    apple: 'email name',
    facebook: 'email public_profile',
    github: 'user:email',
  }
  return scopes[provider]
}

/**
 * Exchange OAuth authorization code for access token
 * Implements OAuth 2.0 Authorization Code Flow with PKCE (RFC 7636)
 */
async function exchangeCodeForToken(
  provider: OAuthProvider,
  code: string,
  codeVerifier: string,
  redirectUri: string
): Promise<string | null> {
  const config = OAUTH_CONFIG[provider]
  const clientSecret = getOAuthClientSecret(provider)
  
  if (!clientSecret) {
    throw new Error(`${provider} OAuth client secret not configured`)
  }
  
  const tokenUrl = getOAuthTokenUrl(provider)
  
  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
    client_id: config.clientId!,
    code_verifier: codeVerifier, // PKCE: code verifier
  })
  
  // Add client_secret for providers that require it
  if (provider !== 'github') {
    params.append('client_secret', clientSecret)
  }
  
  try {
    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
      },
      body: params.toString(),
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`OAuth token exchange failed: ${errorText}`)
    }
    
    const data = await response.json()
    
    // For Google and Apple OAuth with OpenID Connect, we need the id_token (not access_token)
    // The backend uses tokeninfo/verification endpoints which validate ID tokens (JWT)
    // For Facebook and GitHub, we use the access_token
    if (provider === 'google' || provider === 'apple') {
      return data.id_token || null
    }
    
    // For Facebook and GitHub, use access_token
    return data.access_token || null
  } catch (error) {
    console.error(`[OAuth] Token exchange error for ${provider}:`, error)
    throw error
  }
}

/**
 * Get OAuth token URL for provider
 */
function getOAuthTokenUrl(provider: OAuthProvider): string {
  const urls = {
    google: 'https://oauth2.googleapis.com/token',
    apple: 'https://appleid.apple.com/auth/token',
    facebook: 'https://graph.facebook.com/v18.0/oauth/access_token',
    github: 'https://github.com/login/oauth/access_token',
  }
  return urls[provider]
}

/**
 * Get OAuth client secret for provider
 */
function getOAuthClientSecret(provider: OAuthProvider): string | null {
  const secrets = {
    google: process.env.GOOGLE_CLIENT_SECRET,
    apple: process.env.APPLE_CLIENT_SECRET,
    facebook: process.env.FACEBOOK_CLIENT_SECRET,
    github: process.env.GITHUB_CLIENT_SECRET,
  }
  return secrets[provider] || null
}

