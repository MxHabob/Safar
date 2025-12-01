import { z } from 'zod'
import { cache } from 'react'
import { BaseApiClient } from './base'
import type { ClientResponse, RequestConfiguration } from './base'
import { defaultMiddleware } from './middleware'
import {
  HealthCheckHealthGetResponseSchema,
  ReadinessCheckHealthReadyGetResponseSchema,
  LivenessCheckHealthLiveGetResponseSchema,
  RootGetResponseSchema
} from '@/generated/schemas'

export class DefaultApiClient extends BaseApiClient {
  constructor() {
    super()
    
    // Add tag-specific middleware
    this.addMiddleware({
      name: 'default-context',
      onRequest: async (config) => {
        return {
          ...config,
          headers: {
            ...config.headers,
            'X-API-Context': 'default'
          }
        }
      }
    })
  }

  /**
   * Health Check
   * @param options - Request options
   * @returns Promise<ClientResponse<z.infer<typeof HealthCheckHealthGetResponseSchema>>>
   * @example
   * const result = await client.healthCheckHealthGet({
   *   config: { timeout: 5000 }
   * })
   */
  healthCheckHealthGet = cache(async (options?: { config?: RequestConfiguration }) => {
    return this.request<z.infer<typeof HealthCheckHealthGetResponseSchema>>(
      'GET',
      '/health',
      {
config: { ...options?.config, middleware: [...defaultMiddleware, ...(options?.config?.middleware || [])] },
responseSchema: HealthCheckHealthGetResponseSchema
      }
    )
  })

  /**
   * Readiness Check
   * @param options - Request options
   * @returns Promise<ClientResponse<z.infer<typeof ReadinessCheckHealthReadyGetResponseSchema>>>
   * @example
   * const result = await client.readinessCheckHealthReadyGet({
   *   config: { timeout: 5000 }
   * })
   */
  readinessCheckHealthReadyGet = cache(async (options?: { config?: RequestConfiguration }) => {
    return this.request<z.infer<typeof ReadinessCheckHealthReadyGetResponseSchema>>(
      'GET',
      '/health/ready',
      {
config: { ...options?.config, middleware: [...defaultMiddleware, ...(options?.config?.middleware || [])] },
responseSchema: ReadinessCheckHealthReadyGetResponseSchema
      }
    )
  })

  /**
   * Liveness Check
   * @param options - Request options
   * @returns Promise<ClientResponse<z.infer<typeof LivenessCheckHealthLiveGetResponseSchema>>>
   * @example
   * const result = await client.livenessCheckHealthLiveGet({
   *   config: { timeout: 5000 }
   * })
   */
  livenessCheckHealthLiveGet = cache(async (options?: { config?: RequestConfiguration }) => {
    return this.request<z.infer<typeof LivenessCheckHealthLiveGetResponseSchema>>(
      'GET',
      '/health/live',
      {
config: { ...options?.config, middleware: [...defaultMiddleware, ...(options?.config?.middleware || [])] },
responseSchema: LivenessCheckHealthLiveGetResponseSchema
      }
    )
  })

  /**
   * Root
   * @param options - Request options
   * @returns Promise<ClientResponse<z.infer<typeof RootGetResponseSchema>>>
   * @example
   * const result = await client.rootGet({
   *   config: { timeout: 5000 }
   * })
   */
  rootGet = cache(async (options?: { config?: RequestConfiguration }) => {
    return this.request<z.infer<typeof RootGetResponseSchema>>(
      'GET',
      '/',
      {
config: { ...options?.config, middleware: [...defaultMiddleware, ...(options?.config?.middleware || [])] },
responseSchema: RootGetResponseSchema
      }
    )
  })
}