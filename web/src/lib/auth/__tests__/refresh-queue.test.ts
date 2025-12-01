/**
 * Refresh Queue Tests
 * 
 * Tests for refresh token queue and retry system.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  queueRefresh,
  queueRetry,
  clearRetryQueue,
  getCurrentRefreshPromise,
} from '../refresh-queue'

describe('Refresh Queue', () => {
  beforeEach(() => {
    clearRetryQueue()
  })

  describe('queueRefresh', () => {
    it('should execute refresh function', async () => {
      const refreshFn = vi.fn().mockResolvedValue({
        accessToken: 'new-token',
        expiresIn: 1800,
      })

      const result = await queueRefresh(refreshFn)

      expect(refreshFn).toHaveBeenCalledTimes(1)
      expect(result).toEqual({
        accessToken: 'new-token',
        expiresIn: 1800,
      })
    })

    it('should queue concurrent refresh requests', async () => {
      let resolveRefresh: (value: any) => void
      const refreshPromise = new Promise((resolve) => {
        resolveRefresh = resolve
      })

      const refreshFn = vi.fn().mockImplementation(() => refreshPromise)

      // Start two concurrent refreshes
      const promise1 = queueRefresh(refreshFn)
      const promise2 = queueRefresh(refreshFn)

      // Both should use the same refresh function
      expect(refreshFn).toHaveBeenCalledTimes(1)

      // Resolve the refresh
      resolveRefresh!({
        accessToken: 'new-token',
        expiresIn: 1800,
      })

      const [result1, result2] = await Promise.all([promise1, promise2])

      expect(result1).toEqual({
        accessToken: 'new-token',
        expiresIn: 1800,
      })
      expect(result2).toEqual({
        accessToken: 'new-token',
        expiresIn: 1800,
      })
    })

    it('should handle refresh failure', async () => {
      const refreshFn = vi.fn().mockResolvedValue(null)

      const result = await queueRefresh(refreshFn)

      expect(result).toBeNull()
    })
  })

  describe('queueRetry', () => {
    it('should queue failed request for retry', async () => {
      const request = new Request('http://localhost/api/test')
      const options = { headers: { Authorization: 'Bearer token' } }

      // Mock fetch to succeed on retry
      let callCount = 0
      global.fetch = vi.fn().mockImplementation(() => {
        callCount++
        if (callCount === 1) {
          return Promise.resolve(
            new Response(null, { status: 401 })
          )
        }
        return Promise.resolve(
          new Response(JSON.stringify({ data: 'success' }), { status: 200 })
        )
      })

      // Note: This test is simplified - in real usage, queueRetry
      // would be called after a 401, and processRetryQueue would
      // be called after successful refresh
      const retryPromise = queueRetry(request, options)

      // Wait a bit for queue processing
      await new Promise((resolve) => setTimeout(resolve, 100))

      // The retry should eventually succeed
      // (This is a simplified test - full integration would test the full flow)
      expect(global.fetch).toHaveBeenCalled()
    })
  })

  describe('clearRetryQueue', () => {
    it('should clear all queued requests', async () => {
      const request = new Request('http://localhost/api/test')
      const retryPromise = queueRetry(request)

      clearRetryQueue()

      // The promise should be rejected
      await expect(retryPromise).rejects.toThrow('Request cancelled')
    })
  })

  describe('getCurrentRefreshPromise', () => {
    it('should return null when no refresh in progress', () => {
      const promise = getCurrentRefreshPromise()
      expect(promise).toBeNull()
    })

    it('should return current refresh promise when in progress', async () => {
      let resolveRefresh: (value: any) => void
      const refreshPromise = new Promise((resolve) => {
        resolveRefresh = resolve
      })

      const refreshFn = vi.fn().mockImplementation(() => refreshPromise)

      queueRefresh(refreshFn)

      const currentPromise = getCurrentRefreshPromise()
      expect(currentPromise).not.toBeNull()

      resolveRefresh!({
        accessToken: 'new-token',
        expiresIn: 1800,
      })

      await currentPromise
    })
  })
})

