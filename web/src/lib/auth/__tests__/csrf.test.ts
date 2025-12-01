/**
 * CSRF Protection Tests
 * 
 * Tests for CSRF token generation and verification.
 */

import { describe, it, expect, beforeEach } from 'vitest'
import {
  generateCSRFToken,
  verifyCSRFToken,
  setCSRFCookie,
  getCSRFCookie,
} from '../csrf'

// Mock cookie store
class MockCookieStore {
  private cookies: Map<string, string> = new Map()

  get(name: string): { value: string } | undefined {
    const value = this.cookies.get(name)
    return value ? { value } : undefined
  }

  set(name: string, value: string, options?: any): void {
    this.cookies.set(name, value)
  }

  delete(name: string): void {
    this.cookies.delete(name)
  }
}

describe('CSRF Protection', () => {
  let cookieStore: MockCookieStore

  beforeEach(() => {
    cookieStore = new MockCookieStore()
  })

  describe('generateCSRFToken', () => {
    it('should generate a 64-character hex string', () => {
      const token = generateCSRFToken()
      expect(token).toHaveLength(64)
      expect(token).toMatch(/^[0-9a-f]{64}$/)
    })

    it('should generate unique tokens', () => {
      const token1 = generateCSRFToken()
      const token2 = generateCSRFToken()
      expect(token1).not.toBe(token2)
    })
  })

  describe('setCSRFCookie and getCSRFCookie', () => {
    it('should set and get CSRF token from cookie', () => {
      const token = generateCSRFToken()
      setCSRFCookie(token, cookieStore)
      
      const retrieved = getCSRFCookie(cookieStore)
      expect(retrieved).toBe(token)
    })
  })

  describe('verifyCSRFToken', () => {
    it('should verify matching tokens', async () => {
      const token = generateCSRFToken()
      setCSRFCookie(token, cookieStore)

      const request = new Request('http://localhost/api/test', {
        method: 'POST',
        headers: {
          'x-csrf-token': token,
        },
      })

      const isValid = await verifyCSRFToken(request, cookieStore)
      expect(isValid).toBe(true)
    })

    it('should reject mismatched tokens', async () => {
      const token = generateCSRFToken()
      setCSRFCookie(token, cookieStore)

      const request = new Request('http://localhost/api/test', {
        method: 'POST',
        headers: {
          'x-csrf-token': 'different-token',
        },
      })

      const isValid = await verifyCSRFToken(request, cookieStore)
      expect(isValid).toBe(false)
    })

    it('should reject request without CSRF header', async () => {
      const token = generateCSRFToken()
      setCSRFCookie(token, cookieStore)

      const request = new Request('http://localhost/api/test', {
        method: 'POST',
      })

      const isValid = await verifyCSRFToken(request, cookieStore)
      expect(isValid).toBe(false)
    })

    it('should reject request without CSRF cookie', async () => {
      const request = new Request('http://localhost/api/test', {
        method: 'POST',
        headers: {
          'x-csrf-token': 'some-token',
        },
      })

      const isValid = await verifyCSRFToken(request, cookieStore)
      expect(isValid).toBe(false)
    })
  })
})

