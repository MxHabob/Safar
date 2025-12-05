/**
 * Rate Limiter for Authentication Endpoints
 * 
 * Implements rate limiting using LRU cache (in-memory) or Redis.
 * Prevents brute force attacks on login, refresh, and password endpoints.
 * 
 * @security Protects against brute force and DoS attacks
 */

import { LRUCache } from 'lru-cache'

interface RateLimitOptions {
  interval: number // Time window in milliseconds
  uniqueTokenPerInterval: number // Max requests per interval
}

// Default rate limit configurations (backend endpoints)
const RATE_LIMITS: Record<string, RateLimitOptions> = {
  '/api/v1/users/login': {
    interval: 15 * 60 * 1000, // 15 minutes
    uniqueTokenPerInterval: 5, // 5 attempts per 15 minutes
  },
  '/api/v1/users/refresh': {
    interval: 60 * 1000, // 1 minute
    uniqueTokenPerInterval: 10, // 10 refreshes per minute
  },
  '/api/v1/users/password/reset/request': {
    interval: 60 * 60 * 1000, // 1 hour
    uniqueTokenPerInterval: 3, // 3 requests per hour
  },
  '/api/v1/users/password/change': {
    interval: 60 * 1000, // 1 minute
    uniqueTokenPerInterval: 5, // 5 attempts per minute
  },
}

// LRU cache for rate limiting (in-memory fallback)
// In production, consider using Redis for distributed rate limiting
const rateLimitCache = new LRUCache<string, number>({
  max: 10000, // Max 10k entries
  ttl: 60 * 60 * 1000, // 1 hour TTL
})

/**
 * Gets rate limit key for a request
 * 
 * @param pathname - Request pathname
 * @param identifier - Unique identifier (IP, user ID, etc.)
 * @returns Rate limit key
 */
function getRateLimitKey(pathname: string, identifier: string): string {
  return `rate_limit:${pathname}:${identifier}`
}

/**
 * Gets client identifier from request
 * 
 * @param request - Next.js request object
 * @returns Client identifier (IP address or user ID)
 */
function getClientIdentifier(request: Request): string {
  // Try to get IP from headers (set by proxy/load balancer)
  const forwarded = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const ip = forwarded?.split(',')[0] || realIp || 'unknown'

  return ip
}

/**
 * Checks if request should be rate limited
 * 
 * @param pathname - Request pathname
 * @param request - Next.js request object
 * @returns Rate limit result with remaining attempts
 * 
 * @example
 * ```ts
 * const result = await checkRateLimit('/api/auth/login', request)
 * if (result.limited) {
 *   return NextResponse.json(
 *     { error: 'Too many requests', retryAfter: result.retryAfter },
 *     { status: 429 }
 *   )
 * }
 * ```
 */
export async function checkRateLimit(
  pathname: string,
  request: Request
): Promise<{
  limited: boolean
  remaining: number
  retryAfter?: number
}> {
  // Get rate limit config for this path
  const config = RATE_LIMITS[pathname]
  if (!config) {
    // No rate limit for this path
    return { limited: false, remaining: Infinity }
  }

  // Get client identifier
  const identifier = getClientIdentifier(request)
  const key = getRateLimitKey(pathname, identifier)

  // Get current count
  const currentCount = rateLimitCache.get(key) || 0

  // Check if limit exceeded
  if (currentCount >= config.uniqueTokenPerInterval) {
    // Calculate retry after time
    const entry = rateLimitCache.peek(key)
    const retryAfter = entry
      ? Math.ceil((entry - Date.now() + config.interval) / 1000)
      : Math.ceil(config.interval / 1000)

    return {
      limited: true,
      remaining: 0,
      retryAfter,
    }
  }

  // Increment count
  const newCount = currentCount + 1
  rateLimitCache.set(key, newCount, {
    ttl: config.interval,
  })

  return {
    limited: false,
    remaining: config.uniqueTokenPerInterval - newCount,
  }
}

/**
 * Resets rate limit for a path and identifier
 * 
 * @param pathname - Request pathname
 * @param identifier - Client identifier
 */
export function resetRateLimit(pathname: string, identifier: string): void {
  const key = getRateLimitKey(pathname, identifier)
  rateLimitCache.delete(key)
}

/**
 * Gets rate limit configuration for a path
 * 
 * @param pathname - Request pathname
 * @returns Rate limit configuration or null
 */
export function getRateLimitConfig(pathname: string): RateLimitOptions | null {
  return RATE_LIMITS[pathname] || null
}

