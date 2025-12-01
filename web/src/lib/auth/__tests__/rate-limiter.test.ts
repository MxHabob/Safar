/**
 * Rate Limiter Tests
 * 
 * Tests for rate limiting functionality.
 */

import { describe, it, expect, beforeEach } from 'vitest'
import {
  checkRateLimit,
  resetRateLimit,
  getRateLimitConfig,
} from '../rate-limiter'

describe('Rate Limiter', () => {
  beforeEach(() => {
    // Reset rate limit cache between tests
    // (In a real implementation, you'd clear the cache)
  })

  describe('checkRateLimit', () => {
    it('should allow requests within limit', async () => {
      const request = new Request('http://localhost/api/auth/login', {
        headers: {
          'x-forwarded-for': '192.168.1.1',
        },
      })

      // First request should be allowed
      const result1 = await checkRateLimit('/api/auth/login', request)
      expect(result1.limited).toBe(false)
      expect(result1.remaining).toBeGreaterThan(0)
    })

    it('should rate limit after exceeding threshold', async () => {
      const request = new Request('http://localhost/api/auth/login', {
        headers: {
          'x-forwarded-for': '192.168.1.2',
        },
      })

      // Make requests up to the limit
      const limit = getRateLimitConfig('/api/auth/login')
      if (limit) {
        for (let i = 0; i < limit.uniqueTokenPerInterval; i++) {
          await checkRateLimit('/api/auth/login', request)
        }

        // Next request should be rate limited
        const result = await checkRateLimit('/api/auth/login', request)
        expect(result.limited).toBe(true)
        expect(result.remaining).toBe(0)
        expect(result.retryAfter).toBeDefined()
      }
    })

    it('should return no limit for non-auth endpoints', async () => {
      const request = new Request('http://localhost/api/users', {
        headers: {
          'x-forwarded-for': '192.168.1.3',
        },
      })

      const result = await checkRateLimit('/api/users', request)
      expect(result.limited).toBe(false)
      expect(result.remaining).toBe(Infinity)
    })
  })

  describe('getRateLimitConfig', () => {
    it('should return config for auth endpoints', () => {
      const config = getRateLimitConfig('/api/auth/login')
      expect(config).toBeDefined()
      expect(config?.interval).toBeGreaterThan(0)
      expect(config?.uniqueTokenPerInterval).toBeGreaterThan(0)
    })

    it('should return null for non-auth endpoints', () => {
      const config = getRateLimitConfig('/api/users')
      expect(config).toBeNull()
    })
  })
})

