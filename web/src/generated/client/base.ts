/**
 * The HTTP client is automatically created by "mulink"
 * 
 * Next.js 16.0.1 Best Practices:
 * - Proper separation of client/server code
 * - Dynamic imports for server-only modules
 * - Works in both Server Components and Client Components
 * - Optimized bundle size by avoiding server-only code in client bundle
 */
import { z } from 'zod'
import { cache } from 'react'

/**
 * Server-only modules interface
 * Next.js 16.0.1: These modules are only available on the server
 * We use dynamic imports to avoid bundling them in the client
 */
type NextHeadersModule = typeof import('next/headers')
type NextReadonlyHeaders = Awaited<ReturnType<NextHeadersModule['headers']>>
type NextReadonlyCookies = Awaited<ReturnType<NextHeadersModule['cookies']>>

let serverOnlyModules: {
  cookies?: () => Promise<NextReadonlyCookies>
  headers?: () => Promise<Headers>
  after?: (fn: () => void | Promise<void>) => void
  updateTag?: (tag: string) => void
} | null = null

async function toMutableHeaders(source: NextReadonlyHeaders) {
  const mutableHeaders = new Headers()
  // In Next.js 16, headers() returns a Promise, so we need to await it
  const headers = await source
  if (headers && typeof headers.forEach === 'function') {
    headers.forEach((value, key) => {
      mutableHeaders.append(key, value)
    })
  }
  return mutableHeaders
}

/**
 * Lazy load server-only modules only when needed (server-side)
 * Next.js 16.0.1: This ensures server-only code is not bundled in the client
 * 
 * @returns Server-only modules or undefined if on client-side
 */
async function getServerModules() {
  if (serverOnlyModules !== null) return serverOnlyModules
  
  // Only attempt to import on server-side
  // Next.js 16.0.1: typeof window check ensures we're on the server
  if (typeof window === 'undefined') {
    try {
      const headersModule = await import('next/headers').catch(() => null)
      const serverModule = await import('next/server').catch(() => null)
      const cacheModule = await import('next/cache').catch(() => null)
      
      const getReadonlyHeaders = headersModule?.headers as (() => Promise<NextReadonlyHeaders>) | undefined
      const getReadonlyCookies = headersModule?.cookies as (() => Promise<NextReadonlyCookies>) | undefined
      serverOnlyModules = {
        cookies: getReadonlyCookies,
        headers: getReadonlyHeaders ? async () => {
          const headers = await getReadonlyHeaders()
          return toMutableHeaders(headers)
        } : undefined,
        after: serverModule?.after,
        updateTag: cacheModule?.updateTag,
      }
    } catch (error) {
      // Server modules not available (pages router or other contexts)
      // Silently fail and continue without server-only features
      if (process.env.NODE_ENV === 'development') {
        console.warn('[Mulink] Server modules not available:', error)
      }
      serverOnlyModules = {
        cookies: undefined,
        headers: undefined,
        after: undefined,
        updateTag: undefined,
      }
    }
  } else {
    // Client-side: server modules not available
    // This is expected behavior - server modules should not be used on client
    serverOnlyModules = {
      cookies: undefined,
      headers: undefined,
      after: undefined,
      updateTag: undefined,
    }
  }
  
  return serverOnlyModules
}

// Types and interfaces
export interface RequestConfiguration extends RequestInit {
  timeout?: number
  retries?: number
  retryDelay?: number
  retryCondition?: (error: Error, attempt: number) => boolean
  validateResponse?: boolean
  responseSchema?: z.ZodSchema<any>
  skipAuth?: boolean
  skipCache?: boolean
  cacheKey?: string
  cacheTags?: string[]
  revalidate?: number | false
  connection?: 'keep-alive' | 'close'
  updateTag?: (tag: string) => void
  middleware?: RequestMiddleware[]
  method?: string;
  url?: string;
  baseURL?: string;
  onUploadProgress?: (progress: ProgressEvent) => void
  onDownloadProgress?: (progress: ProgressEvent) => void
}

export interface ClientResponse<TData = any> {
  data: TData
  status: number
  statusText: string
  headers: Headers
  cached?: boolean
  retryCount?: number
  responseTime?: number
  requestId?: string
  fromCache?: boolean
}

export interface RequestMiddleware {
  name: string
  onRequest?: (config: RequestConfiguration) => Promise<RequestConfiguration> | RequestConfiguration
  onResponse?: <T>(response: ClientResponse<T>) => Promise<ClientResponse<T>> | ClientResponse<T>
  onError?: (error: ApiError) => Promise<never> | never
}

export interface RequestMetrics {
  requestId: string
  method: string
  url: string
  startTime: number
  endTime?: number
  duration?: number
  status?: number
  cached?: boolean
  retryCount?: number
  error?: string
}

// Enhanced error classes
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly statusText: string,
    public readonly response?: Response,
    public readonly data?: any,
    public readonly requestId?: string
  ) {
    super(message)
    this.name = 'ApiError'
  }

  get isClientError(): boolean {
    return this.status >= 400 && this.status < 500
  }

  get isServerError(): boolean {
    return this.status >= 500
  }

  get isNetworkError(): boolean {
    return this.status === 0
  }

  get isRetryable(): boolean {
    return this.isServerError || this.isNetworkError || this.status === 429
  }
}

export class ValidationError extends Error {
  constructor(
    message: string,
    public readonly errors: z.ZodError,
    public readonly requestId?: string
  ) {
    super(message)
    this.name = 'ValidationError'
  }
}

export class TimeoutError extends Error {
  constructor(
    message: string,
    public readonly timeout: number,
    public readonly requestId?: string
  ) {
    super(message)
    this.name = 'TimeoutError'
  }
}

export class NetworkError extends Error {
  constructor(
    message: string,
    public readonly originalError: Error,
    public readonly requestId?: string
  ) {
    super(message)
    this.name = 'NetworkError'
  }
}

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS'

// Request deduplication cache
const requestCache = new Map<string, Promise<any>>()

// Metrics collection
const metricsCollector = {
  requests: new Map<string, RequestMetrics>(),
  
  startRequest(requestId: string, method: string, url: string): void {
    this.requests.set(requestId, {
      requestId,
      method,
      url,
      startTime: Date.now()
    })
  },
  
  async endRequest(requestId: string, status?: number, cached?: boolean, retryCount?: number, error?: string): Promise<void> {
    const metrics = this.requests.get(requestId)
    if (metrics) {
      metrics.endTime = Date.now()
      metrics.duration = metrics.endTime - metrics.startTime
      metrics.status = status
      metrics.cached = cached
      metrics.retryCount = retryCount
      metrics.error = error
      
      // Send metrics in background (server-side only)
      try {
        const serverModules = await getServerModules()
        if (serverModules?.after) {
          serverModules.after(async () => {
            await this.sendMetrics(metrics)
          })
        } else {
          // Client-side: send metrics immediately
          await this.sendMetrics(metrics)
        }
      } catch (error) {
        // Server modules not available, send metrics immediately
        await this.sendMetrics(metrics)
      }
    }
  },
  
  async sendMetrics(metrics: RequestMetrics): Promise<void> {
    if (process.env.NODE_ENV === 'development') {
      console.log('[API_METRICS]', metrics)
    }
    
    // In production, send to your analytics service
    // await analytics.track('api_request', metrics)
  }
}

export class BaseApiClient {
  private readonly baseUrl: string
  private readonly defaultTimeout: number
  private readonly defaultRetries: number
  private readonly defaultHeaders: Record<string, string>
  private readonly defaultUserAgent: string
  private readonly middleware: RequestMiddleware[] = []

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL || process.env.API_BASE_URL || 'https://safar.mulverse.com'
    this.defaultTimeout = 30000
    this.defaultRetries = 3
    this.defaultHeaders = {
      "User-Agent": "Safar-web/1.0.0",
      "Accept": "application/json",
      "Content-Type": "application/json"
}
    this.defaultUserAgent = 'Mulink-Client/3.4.5'
    
    // Add default middleware
    this.addMiddleware({
      name: 'request-id',
      onRequest: this.addRequestId.bind(this)
    })
    
    this.addMiddleware({
      name: 'security-headers',
      onRequest: this.addSecurityHeaders.bind(this)
    })
  }

  // Middleware management
  addMiddleware(middleware: RequestMiddleware): void {
    this.middleware.push(middleware)
  }

  removeMiddleware(name: string): void {
    const index = this.middleware.findIndex(m => m.name === name)
    if (index > -1) {
      this.middleware.splice(index, 1)
    }
  }

  // Enhanced authentication
  private async getAuthHeaders(): Promise<Record<string, string>> {
    const getAuthHeaders: Record<string, string> = {}
    
    try {
      // Get server modules (only available server-side)
      const serverModules = await getServerModules()
      
      // Get auth token from various sources (server-side only)
      if (serverModules?.cookies && serverModules.headers) {
        try {
          const cookieStore = await serverModules.cookies()
          const headersList = await serverModules.headers()
          
          // Try cookie first
          const tokenFromCookie = cookieStore.get('auth-token')?.value
          if (tokenFromCookie) {
            getAuthHeaders.Authorization = `Bearer ${tokenFromCookie}`
            return getAuthHeaders
          }
          
          // Try header
          const tokenFromHeader = headersList.get('authorization')
          if (tokenFromHeader) {
            getAuthHeaders.Authorization = tokenFromHeader
            return getAuthHeaders
          }
        } catch (error) {
          // Server modules not available (client-side) or error accessing
        }
      }
      
      // Client-side: cookies are sent automatically with credentials: 'include'
      // No need to manually get token - the browser will send httpOnly cookies
      // The backend will extract the token from the Cookie header
      
      // Try external auth service
      // No external auth configured
    } catch (error) {
      console.warn('Failed to get auth token:', error)
    }
    
    // Fallback to API key from environment
    const secureApiKey = process.env.NEXT_SECURE_API_KEY
    if (secureApiKey) {
      getAuthHeaders["Authorization"] =  `Api-Key ${secureApiKey}`    }
    
    return getAuthHeaders
  }

  // Security headers middleware
  private async addSecurityHeaders(config: RequestConfiguration): Promise<RequestConfiguration> {
    const securityHeaders: Record<string, string> = {}
    
    try {
      // Get server modules (only available server-side)
      const serverModules = await getServerModules()
      
      if (serverModules?.headers) {
        try {
          const headersList = await serverModules.headers()
          
          // CSRF protection
          const csrfToken = headersList.get('x-csrf-token')
          if (csrfToken) {
            securityHeaders['X-CSRF-Token'] = csrfToken
          }
          
          // Request origin
          const origin = headersList.get('origin')
          if (origin) {
            securityHeaders['Origin'] = origin
          }
          
          // User agent
          const userAgent = headersList.get('user-agent')
          if (userAgent) {
            securityHeaders['User-Agent'] = userAgent
          }
        } catch (error) {
          // Server modules not available (client-side) or error accessing
        }
      }
    } catch (error) {
      // Headers not available
    }
    
    return {
      ...config,
      headers: {
        ...config.headers,
        ...securityHeaders
      }
    }
  }

  // Request ID middleware
  private async addRequestId(config: RequestConfiguration): Promise<RequestConfiguration> {
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    return {
      ...config,
      headers: {
        ...config.headers,
        'X-Request-ID': requestId
      }
    }
  }

  // Enhanced URL building with validation
  private buildUrl(
    path: string, 
    pathParameters: Record<string, string | number> = {}, 
    queryParameters: Record<string, unknown> = {}
  ): string {
    let url = path
    
    // Replace path parameters with validation and type conversion
    for (const [key, value] of Object.entries(pathParameters)) {
      if (!value && value !== 0) {
        throw new ValidationError(`Missing required path parameter: ${key}`, {} as z.ZodError)
      }
      // Convert to string for URL encoding
      const stringValue = typeof value === 'number' ? String(value) : String(value)
      url = url.replace(`{${key}}`, encodeURIComponent(stringValue))
    }
    
    // Validate no unreplaced parameters remain
    const unreplacedParams = url.match(/{[^}]+}/g)
    if (unreplacedParams) {
      throw new ValidationError(
        `Unreplaced path parameters: ${unreplacedParams.join(', ')}`,
        {} as z.ZodError
      )
    }
    
    // Add query parameters with proper encoding
    const searchParams = new URLSearchParams()
    for (const [key, value] of Object.entries(queryParameters)) {
      if (value !== undefined && value !== null && value !== '') {
        if (Array.isArray(value)) {
          value.forEach(v => searchParams.append(key, String(v)))
        } else if (typeof value === 'object') {
          searchParams.append(key, JSON.stringify(value))
        } else {
          searchParams.append(key, String(value))
        }
      }
    }
    
    const queryString = searchParams.toString()
    const fullUrl = `${this.baseUrl}${url}${queryString ? `?${queryString}` : ''}`
    
    // URL validation
    try {
      new URL(fullUrl)
    } catch {
      throw new ValidationError(`Invalid URL constructed: ${fullUrl}`, {} as z.ZodError)
    }
    
    return fullUrl
  }

  // Enhanced request execution with caching and deduplication
  private async executeRequest<TData>(
    method: HttpMethod,
    path: string,
    options: {
      pathParams?: Record<string, string | number>
      queryParams?: Record<string, unknown>
      body?: unknown
      headers?: Record<string, string>
      config?: RequestConfiguration
      responseSchema?: z.ZodSchema<TData>
    } = {}
  ): Promise<ClientResponse<TData>> {
    const {
      pathParams = {},
      queryParams = {},
      body,
      headers = {},
      config = {},
      responseSchema
    } = options

    const {
      timeout = this.defaultTimeout,
      retries = this.defaultRetries,
      retryDelay = 1000,
      retryCondition = (error: Error, attempt: number) => {
        if (error instanceof ApiError) {
          return error.isRetryable && attempt < retries
        }
        return attempt < retries
      },
      validateResponse = true,
      skipAuth = false,
      skipCache = false,
      cacheKey,
      cacheTags = [],
      revalidate = 300,
      connection,
      updateTag,
      middleware = [],
      ...fetchOptions
    } = config

    const url = this.buildUrl(path, pathParams, queryParams)
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    // Start metrics collection
    metricsCollector.startRequest(requestId, method, url)

    // Request deduplication for GET requests
    if (method === 'GET' && !skipCache) {
      const dedupeKey = cacheKey || `${method}:${url}`
      const existingRequest = requestCache.get(dedupeKey)
      
      if (existingRequest) {
        console.log(`[DEDUPE] Using existing request for ${dedupeKey}`)
        const result = await existingRequest
        await metricsCollector.endRequest(requestId, result.status, true)
        return { ...result, fromCache: true, requestId }
      }
      
      // Cache the promise
      const requestPromise = this.executeRequestInternal<TData>(
        method, url, body, headers, fetchOptions, timeout, retries, 
        retryDelay, retryCondition, validateResponse, skipAuth, 
        responseSchema, requestId, [...this.middleware, ...middleware],
        cacheTags, revalidate, connection, updateTag
      )
      
      requestCache.set(dedupeKey, requestPromise)
      
      // Clean up cache after request completes
      requestPromise.finally(() => {
        requestCache.delete(dedupeKey)
      })
      
      return requestPromise
    }

    return this.executeRequestInternal<TData>(
      method, url, body, headers, fetchOptions, timeout, retries,
      retryDelay, retryCondition, validateResponse, skipAuth,
      responseSchema, requestId, [...this.middleware, ...middleware],
      cacheTags, revalidate, connection, updateTag
    )
  }

  // Internal request execution with middleware support
  private async executeRequestInternal<TData>(
    method: HttpMethod,
    url: string,
    body: any,
    headers: Record<string, string>,
    fetchOptions: RequestInit,
    timeout: number,
    retries: number,
    retryDelay: number,
    retryCondition: (error: Error, attempt: number) => boolean,
    validateResponse: boolean,
    skipAuth: boolean,
    responseSchema?: z.ZodSchema<TData>,
    requestId?: string,
    middleware: RequestMiddleware[] = [],
    cacheTags: string[] = [],
    revalidate?: number | false,
    connection?: 'keep-alive' | 'close',
    updateTag?: (tag: string) => void
  ): Promise<ClientResponse<TData>> {
    const startTime = Date.now()

    // Build initial request configuration
    let requestConfig: RequestConfiguration = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': this.defaultUserAgent,
        ...this.defaultHeaders,
        ...(skipAuth ? {} : await this.getAuthHeaders()),
        ...headers
      },
      ...fetchOptions
    }

    // Apply request middleware
    for (const mw of middleware) {
      if (mw.onRequest) {
        requestConfig = await mw.onRequest(requestConfig)
      }
    }

    // Add body for non-GET requests
    if (body && method !== 'GET' && method !== 'HEAD') {
      if (body instanceof FormData || body instanceof URLSearchParams) {
        requestConfig.body = body
        // Remove content-type for FormData (browser sets it with boundary)
        if (body instanceof FormData) {
          delete (requestConfig.headers as Record<string, string>)['Content-Type']
        }
      } else {
        requestConfig.body = JSON.stringify(body)
      }
    }

    // Execute with retries and middleware
    let lastError: Error = new Error('Unknown error')
    let retryCount = 0
    
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => {
          controller.abort()
        }, timeout)
        
        // Next.js 16.0.1: Build fetch options with cache tags and connection
        // Only include next options if we're on the server (Next.js App Router)
        const fetchInit: RequestInit & { next?: { tags?: string[]; revalidate?: number | false; connection?: string } } = {
          ...requestConfig,
          signal: controller.signal,
          // Include credentials to send cookies with requests
          // This is necessary for cross-origin requests when CORS allows credentials
          credentials: 'include'
        }
        
        // Add Next.js-specific options only if we have cache tags, revalidate, or connection
        // Next.js 16.0.1: Enhanced cache tag support with updateTag
        if (cacheTags && cacheTags.length > 0 || revalidate !== undefined || connection) {
          fetchInit.next = {}
          
          if (cacheTags && cacheTags.length > 0) {
            fetchInit.next.tags = cacheTags
          }
          
          if (revalidate !== undefined) {
            fetchInit.next.revalidate = revalidate === false ? false : revalidate
          }
          
          // Next.js 16.0.1: Connection keep-alive for persistent connections
          if (connection) {
            fetchInit.next.connection = connection
          }
        }
        
        const response = await fetch(url, fetchInit)
        
        // Next.js 16.0.1: Update cache tags dynamically using updateTag from next/cache
        // This allows for granular cache invalidation
        if (cacheTags && cacheTags.length > 0) {
          try {
            // Dynamically import updateTag only on server-side
            const serverModules = await getServerModules()
            const tagUpdater = updateTag || serverModules?.updateTag
            
            if (tagUpdater && typeof window === 'undefined') {
              // Update cache tags on server-side only
              cacheTags.forEach((tag: string) => {
                try {
                  tagUpdater(tag)
                } catch (error) {
                  // Silently fail if updateTag is not available
                  if (process.env.NODE_ENV === 'development') {
                    console.warn(`[Mulink] Failed to update cache tag: ${tag}`, error)
                  }
                }
              })
            }
          } catch (error) {
            // Silently fail if updateTag is not available (client-side or error)
            if (process.env.NODE_ENV === 'development') {
              console.warn('[Mulink] Failed to update cache tags:', error)
            }
          }
        }
        
        clearTimeout(timeoutId)
        const responseTime = Date.now() - startTime

        // Handle HTTP errors
        if (!response.ok) {
          const errorData = await this.parseErrorResponse(response)
          const apiError = new ApiError(
            errorData.message || `HTTP ${response.status}: ${response.statusText}`,
            response.status,
            response.statusText,
            response,
            errorData,
            requestId
          )

          // Special handling for 401 errors: try token refresh before throwing
          // Use server action directly instead of API route
          if (response.status === 401 && !skipAuth) {
            // Skip refresh for auth endpoints
            if (!url.includes('/login') && !url.includes('/refresh') && !url.includes('/oauth')) {
              try {
                // Use server action to refresh token (works on both client and server)
                const { refreshTokenAction } = await import('@/lib/auth/actions')
                const refreshResult = await refreshTokenAction()
                
                if (refreshResult?.success && refreshResult?.data?.access_token) {
                  // Token was refreshed, retry the request with new token
                  const newToken = refreshResult.data.access_token
                  
                  // Build headers properly
                  const existingHeaders = requestConfig.headers || {}
                  const headersObj = existingHeaders instanceof Headers 
                    ? Object.fromEntries(existingHeaders.entries())
                    : typeof existingHeaders === 'object' 
                      ? existingHeaders 
                      : {}
                  
                  const retryConfig: RequestInit = {
                    ...requestConfig,
                    headers: {
                      ...headersObj,
                      Authorization: `Bearer ${newToken}`
                    } as HeadersInit
                  }
                  
                  // Apply request middleware again
                  let finalConfig: RequestConfiguration = retryConfig as RequestConfiguration
                  for (const mw of middleware) {
                    if (mw.onRequest) {
                      finalConfig = await mw.onRequest(finalConfig)
                    }
                  }
                  
                  // Retry the request
                  const retryResponse = await fetch(url, {
                    ...finalConfig,
                    signal: controller.signal,
                    credentials: 'include'
                  } as RequestInit)
                  
                  if (retryResponse.ok) {
                    // Retry succeeded, parse and return response
                    const retryData = await this.parseResponse<TData>(retryResponse, responseSchema, validateResponse)
                    const retryClientResponse: ClientResponse<TData> = {
                      data: retryData,
                      status: retryResponse.status,
                      statusText: retryResponse.statusText,
                      headers: retryResponse.headers,
                      retryCount: retryCount + 1,
                      responseTime: Date.now() - startTime,
                      requestId
                    }
                    
                    // Apply response middleware
                    let finalResponse = retryClientResponse
                    for (const mw of middleware) {
                      if (mw.onResponse) {
                        finalResponse = await mw.onResponse(finalResponse)
                      }
                    }
                    
                    await metricsCollector.endRequest(requestId!, retryResponse.status, false, retryCount + 1)
                    return finalResponse
                  }
                }
              } catch (refreshError) {
                // Refresh failed, continue to error handling
                if (process.env.NODE_ENV === 'development') {
                  console.warn('[API Client] Token refresh failed:', refreshError)
                }
              }
            }
          }

          // Apply error middleware
          for (const mw of middleware) {
            if (mw.onError) {
              await mw.onError(apiError)
            }
          }

          throw apiError
        }

        // Parse response
        const data = await this.parseResponse<TData>(response, responseSchema, validateResponse)

        let clientResponse: ClientResponse<TData> = {
          data,
          status: response.status,
          statusText: response.statusText,
          headers: response.headers,
          retryCount,
          responseTime,
          requestId
        }

        // Apply response middleware
        for (const mw of middleware) {
          if (mw.onResponse) {
            clientResponse = await mw.onResponse(clientResponse)
          }
        }

        // End metrics collection
        await metricsCollector.endRequest(requestId!, response.status, false, retryCount)

        return clientResponse
      } catch (error) {
        lastError = error as Error
        retryCount = attempt

        // Check if we should retry
        if (attempt < retries && retryCondition(lastError, attempt)) {
          // Exponential backoff with jitter
          const delay = retryDelay * Math.pow(2, attempt) + Math.random() * 1000
          await new Promise(resolve => setTimeout(resolve, delay))
          continue
        }

        break
      }
    }

    // End metrics collection with error
    await metricsCollector.endRequest(
      requestId!, 
      undefined, 
      false, 
      retryCount, 
      lastError.message
    )

    // Enhance error with context
    if (lastError instanceof Error && lastError.name === 'AbortError') {
      throw new TimeoutError(`Request timeout after ${timeout}ms`, timeout, requestId)
    }

    if (lastError instanceof TypeError && lastError.message.includes('fetch')) {
      throw new NetworkError('Network request failed', lastError, requestId)
    }

    throw lastError
  }

  // Enhanced response parsing with streaming support
  private async parseResponse<TData>(
    response: Response,
    schema?: z.ZodSchema<TData>,
    shouldValidate = true
  ): Promise<TData> {
    const contentType = response.headers.get('content-type') || ''
    let data: any

    // Handle different content types
    if (contentType.includes('application/json')) {
      data = await response.json()
    } else if (contentType.includes('text/')) {
      data = await response.text()
    } else if (contentType.includes('application/octet-stream') || contentType.includes('application/pdf')) {
      data = await response.blob()
    } else if (contentType.includes('multipart/form-data')) {
      data = await response.formData()
    } else {
      // Try JSON first, fallback to text
      try {
        data = await response.json()
      } catch {
        data = await response.text()
      }
    }

    // Validate response if schema provided
    if (shouldValidate && schema) {
      try {
        return await schema.parseAsync(data)
      } catch (error) {
        if (error instanceof z.ZodError) {
          throw new ValidationError('Response validation failed', error)
        }
        throw error
      }
    }

    return data
  }

  // Enhanced error response parsing
  private async parseErrorResponse(response: Response): Promise<any> {
    try {
      const contentType = response.headers.get('content-type') || ''
      
      if (contentType.includes('application/json')) {
        return await response.json()
      } else if (contentType.includes('text/')) {
        const text = await response.text()
        return { message: text }
      } else {
        return { message: response.statusText }
      }
    } catch {
      return { message: response.statusText || 'Unknown error' }
    }
  }

  // Public method for making requests with caching
  async request<TData>(
    method: HttpMethod,
    path: string,
    options?: {
      pathParams?: Record<string, string | number>
      queryParams?: Record<string, unknown>
      body?: unknown
      headers?: Record<string, string>
      config?: RequestConfiguration
      responseSchema?: z.ZodSchema<TData>
    }
  ): Promise<ClientResponse<TData>> {
    return this.executeRequest(method, path, options)
  }

  // Cached convenience methods
async get<TData>(
  path: string, 
  options?: Omit<Parameters<typeof this.request>[2], 'body'>
): Promise<ClientResponse<TData>> {
  return cache(async () => {
    return this.request<TData>('GET', path, options)
  })()
}

  async post<TData>(
    path: string, 
    body?: unknown, 
    options?: Omit<Parameters<typeof this.request>[2], 'body'>
  ): Promise<ClientResponse<TData>> {
    return this.request('POST', path, { ...options, body })
  }

  async put<TData>(
    path: string, 
    body?: unknown, 
    options?: Omit<Parameters<typeof this.request>[2], 'body'>
  ): Promise<ClientResponse<TData>> {
    return this.request('PUT', path, { ...options, body })
  }

  async patch<TData>(
    path: string, 
    body?: unknown, 
    options?: Omit<Parameters<typeof this.request>[2], 'body'>
  ): Promise<ClientResponse<TData>> {
    return this.request('PATCH', path, { ...options, body })
  }

  async delete<TData>(
    path: string, 
    options?: Omit<Parameters<typeof this.request>[2], 'body'>
  ): Promise<ClientResponse<TData>> {
    return this.request('DELETE', path, options)
  }

  // Utility methods
  clearCache(): void {
    requestCache.clear()
  }

  getMetrics(): Map<string, RequestMetrics> {
    return new Map(metricsCollector.requests)
  }
}