/**
 * Secure token storage utilities
 * 
 * Best practices:
 * - Access token: localStorage (short-lived, less critical)
 * - Refresh token: httpOnly cookie (more secure, set via API route)
 */

const ACCESS_TOKEN_KEY = 'access_token'
const TOKEN_EXPIRY_KEY = 'access_token_expiry'

export const tokenStorage = {
  /**
   * Get access token from localStorage
   */
  getAccessToken: (): string | null => {
    if (typeof window === 'undefined') return null
    
    const token = localStorage.getItem(ACCESS_TOKEN_KEY)
    const expiry = localStorage.getItem(TOKEN_EXPIRY_KEY)
    
    // Check if token is expired
    if (token && expiry) {
      const expiryTime = parseInt(expiry, 10)
      if (Date.now() >= expiryTime) {
        // Token expired, remove it
        tokenStorage.removeAccessToken()
        return null
      }
    }
    
    return token
  },

  /**
   * Set access token in localStorage with expiry
   */
  setAccessToken: (token: string, expiresIn: number = 1800): void => {
    if (typeof window === 'undefined') return
    
    localStorage.setItem(ACCESS_TOKEN_KEY, token)
    // Store expiry time (current time + expiresIn seconds)
    const expiryTime = Date.now() + expiresIn * 1000
    localStorage.setItem(TOKEN_EXPIRY_KEY, expiryTime.toString())
  },

  /**
   * Remove access token from localStorage
   */
  removeAccessToken: (): void => {
    if (typeof window === 'undefined') return
    
    localStorage.removeItem(ACCESS_TOKEN_KEY)
    localStorage.removeItem(TOKEN_EXPIRY_KEY)
  },

  /**
   * Check if access token exists and is valid
   */
  hasValidToken: (): boolean => {
    return tokenStorage.getAccessToken() !== null
  },

  /**
   * Get time until token expires (in milliseconds)
   */
  getTimeUntilExpiry: (): number | null => {
    if (typeof window === 'undefined') return null
    
    const expiry = localStorage.getItem(TOKEN_EXPIRY_KEY)
    if (!expiry) return null
    
    const expiryTime = parseInt(expiry, 10)
    const timeUntilExpiry = expiryTime - Date.now()
    
    return timeUntilExpiry > 0 ? timeUntilExpiry : null
  }
}

