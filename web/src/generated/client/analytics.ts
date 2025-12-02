import { z } from 'zod'
import { cache } from 'react'
import { BaseApiClient } from './base'
import type { ClientResponse, RequestConfiguration } from './base'
import { defaultMiddleware } from './middleware'
import {
  GetAuditLogsApiV1AnalyticsAuditLogsGetResponseSchema,
  GetAuditLogsApiV1AnalyticsAuditLogsGetParamsSchema,
  GetAuditLogApiV1AnalyticsAuditLogsLogIdGetResponseSchema,
  GetAuditLogApiV1AnalyticsAuditLogsLogIdGetParamsSchema,
  GetAuditLogsSummaryApiV1AnalyticsAuditLogsStatsSummaryGetResponseSchema,
  GetAuditLogsSummaryApiV1AnalyticsAuditLogsStatsSummaryGetParamsSchema
} from '@/generated/schemas'

export class AnalyticsApiClient extends BaseApiClient {
  constructor() {
    super()
    
    // Add tag-specific middleware
    this.addMiddleware({
      name: 'analytics-context',
      onRequest: async (config) => {
        return {
          ...config,
          headers: {
            ...config.headers,
            'X-API-Context': 'analytics'
          }
        }
      }
    })
  }

  /**
   * Get Audit Logs
   * Get audit logs with filtering options.
Only accessible to admins.
   * @param options - Request options
   * @returns Promise<ClientResponse<z.infer<typeof GetAuditLogsApiV1AnalyticsAuditLogsGetResponseSchema>>>
   * @example
   * const result = await client.getAuditLogsApiV1AnalyticsAuditLogsGet({
   *   config: { timeout: 5000 }
   * })
   */
  getAuditLogsApiV1AnalyticsAuditLogsGet = cache(async (options: {
    params: z.infer<typeof GetAuditLogsApiV1AnalyticsAuditLogsGetParamsSchema>
    config?: RequestConfiguration
  }) => {
// Validate and extract parameters
const validatedParams = await GetAuditLogsApiV1AnalyticsAuditLogsGetParamsSchema.parseAsync(options.params)

    return this.request<z.infer<typeof GetAuditLogsApiV1AnalyticsAuditLogsGetResponseSchema>>(
      'GET',
      '/api/v1/analytics/audit-logs',
      {
queryParams: validatedParams.query,
config: { ...options?.config, middleware: [...defaultMiddleware, ...(options?.config?.middleware || [])] },
responseSchema: GetAuditLogsApiV1AnalyticsAuditLogsGetResponseSchema
      }
    )
  })

  /**
   * Get Audit Log
   * Get a specific audit log entry. Only accessible to admins.
   * @param options - Request options
   * @returns Promise<ClientResponse<z.infer<typeof GetAuditLogApiV1AnalyticsAuditLogsLogIdGetResponseSchema>>>
   * @example
   * const result = await client.getAuditLogApiV1AnalyticsAuditLogsLogIdGet({
   *   config: { timeout: 5000 }
   * })
   */
  getAuditLogApiV1AnalyticsAuditLogsLogIdGet = cache(async (options: {
    params: z.infer<typeof GetAuditLogApiV1AnalyticsAuditLogsLogIdGetParamsSchema>
    config?: RequestConfiguration
  }) => {
// Validate and extract parameters
const validatedParams = await GetAuditLogApiV1AnalyticsAuditLogsLogIdGetParamsSchema.parseAsync(options.params)

    return this.request<z.infer<typeof GetAuditLogApiV1AnalyticsAuditLogsLogIdGetResponseSchema>>(
      'GET',
      '/api/v1/analytics/audit-logs/{log_id}',
      {
        pathParams: validatedParams.path,
config: { ...options?.config, middleware: [...defaultMiddleware, ...(options?.config?.middleware || [])] },
responseSchema: GetAuditLogApiV1AnalyticsAuditLogsLogIdGetResponseSchema
      }
    )
  })

  /**
   * Get Audit Logs Summary
   * Get audit logs summary statistics.
Only accessible to admins.
   * @param options - Request options
   * @returns Promise<ClientResponse<z.infer<typeof GetAuditLogsSummaryApiV1AnalyticsAuditLogsStatsSummaryGetResponseSchema>>>
   * @example
   * const result = await client.getAuditLogsSummaryApiV1AnalyticsAuditLogsStatsSummaryGet({
   *   config: { timeout: 5000 }
   * })
   */
  getAuditLogsSummaryApiV1AnalyticsAuditLogsStatsSummaryGet = cache(async (options: {
    params: z.infer<typeof GetAuditLogsSummaryApiV1AnalyticsAuditLogsStatsSummaryGetParamsSchema>
    config?: RequestConfiguration
  }) => {
// Validate and extract parameters
const validatedParams = await GetAuditLogsSummaryApiV1AnalyticsAuditLogsStatsSummaryGetParamsSchema.parseAsync(options.params)

    return this.request<z.infer<typeof GetAuditLogsSummaryApiV1AnalyticsAuditLogsStatsSummaryGetResponseSchema>>(
      'GET',
      '/api/v1/analytics/audit-logs/stats/summary',
      {
queryParams: validatedParams.query,
config: { ...options?.config, middleware: [...defaultMiddleware, ...(options?.config?.middleware || [])] },
responseSchema: GetAuditLogsSummaryApiV1AnalyticsAuditLogsStatsSummaryGetResponseSchema
      }
    )
  })
}