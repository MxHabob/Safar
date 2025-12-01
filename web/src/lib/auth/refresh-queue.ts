/**
 * Refresh Token Queue & Retry System
 * 
 * Prevents refresh token race conditions by ensuring only one refresh
 * happens at a time. All concurrent requests wait for the same refresh promise.
 * 
 * Also implements retry queue for failed requests during refresh.
 * 
 * @security Prevents token invalidation from concurrent refresh attempts
 */

/**
 * Global refresh promise - ensures only one refresh happens at a time
 */
let refreshPromise: Promise<{ accessToken: string; expiresIn: number } | null> | null = null

/**
 * Queue of failed requests to retry after refresh
 */
interface QueuedRequest {
  resolve: (value: Response) => void
  reject: (error: Error) => void
  request: Request
  options?: RequestInit
}

const retryQueue: QueuedRequest[] = []
let isProcessingQueue = false

/**
 * Executes token refresh and returns new access token
 * 
 * @param refreshFn - Function that performs the refresh
 * @returns New access token and expiry, or null if refresh failed
 * 
 * @security Ensures only one refresh happens at a time
 */
export async function queueRefresh(
  refreshFn: () => Promise<{ accessToken: string; expiresIn: number } | null>
): Promise<{ accessToken: string; expiresIn: number } | null> {
  // If refresh is already in progress, wait for it
  if (refreshPromise) {
    return refreshPromise
  }

  // Start new refresh
  refreshPromise = (async () => {
    try {
      const result = await refreshFn()
      
      // Process retry queue if refresh succeeded
      if (result) {
        await processRetryQueue(result.accessToken)
      }
      
      return result
    } finally {
      // Clear refresh promise so new refreshes can start
      refreshPromise = null
    }
  })()

  return refreshPromise
}

/**
 * Queues a failed request to retry after token refresh
 * 
 * @param request - Original request that failed
 * @param options - Original request options
 * @returns Promise that resolves when request is retried
 * 
 * @example
 * ```ts
 * try {
 *   const response = await fetch('/api/protected', { headers })
 *   return response
 * } catch (error) {
 *   if (error.status === 401) {
 *     // Queue for retry after refresh
 *     return queueRetry(new Request('/api/protected'), { headers })
 *   }
 *   throw error
 * }
 * ```
 */
export function queueRetry(
  request: Request,
  options?: RequestInit
): Promise<Response> {
  return new Promise((resolve, reject) => {
    retryQueue.push({
      resolve,
      reject,
      request,
      options,
    })

    // Start processing queue if not already processing
    if (!isProcessingQueue) {
      processRetryQueue().catch(console.error)
    }
  })
}

/**
 * Processes the retry queue with new access token
 * 
 * @param accessToken - New access token to use for retries
 */
async function processRetryQueue(accessToken?: string): Promise<void> {
  if (isProcessingQueue || retryQueue.length === 0) {
    return
  }

  isProcessingQueue = true

  try {
    // Process all queued requests
    const requests = [...retryQueue]
    retryQueue.length = 0 // Clear queue

    for (const queued of requests) {
      try {
        // Update Authorization header with new token
        const headers = new Headers(queued.options?.headers)
        headers.set('Authorization', `Bearer ${accessToken || ''}`)

        // Retry request
        const response = await fetch(queued.request, {
          ...queued.options,
          headers,
        })

        queued.resolve(response)
      } catch (error) {
        queued.reject(error as Error)
      }
    }
  } finally {
    isProcessingQueue = false

    // If more requests were queued while processing, process them
    if (retryQueue.length > 0) {
      await processRetryQueue(accessToken)
    }
  }
}

/**
 * Clears the retry queue (e.g., on logout)
 */
export function clearRetryQueue(): void {
  retryQueue.forEach((queued) => {
    queued.reject(new Error('Request cancelled: user logged out'))
  })
  retryQueue.length = 0
}

/**
 * Gets current refresh promise (for debugging)
 */
export function getCurrentRefreshPromise(): Promise<{ accessToken: string; expiresIn: number } | null> | null {
  return refreshPromise
}

