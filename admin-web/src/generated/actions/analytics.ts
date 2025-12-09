'use server'
import { z } from 'zod'
import { cache } from 'react'
import { updateTag } from 'next/cache'
import { headers } from 'next/headers'
import { apiClient } from '@/generated/client'
import { actionClientWithMeta, authActionClient, ActionError } from '@/generated/lib/safe-action'
import {
  GetAuditLogsApiV1AnalyticsAuditLogsGetParamsSchema,
  GetAuditLogsApiV1AnalyticsAuditLogsGetResponseSchema,
  GetAuditLogApiV1AnalyticsAuditLogsLogIdGetParamsSchema,
  GetAuditLogApiV1AnalyticsAuditLogsLogIdGetResponseSchema,
  GetAuditLogsSummaryApiV1AnalyticsAuditLogsStatsSummaryGetParamsSchema,
  GetAuditLogsSummaryApiV1AnalyticsAuditLogsStatsSummaryGetResponseSchema
} from '@/generated/schemas'

// Utility functions for enhanced server actions

async function getClientInfo() {
  const headersList = await headers()
  const userAgent = headersList.get('user-agent') || 'unknown'
  const ip = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || 'unknown'
  
  return { userAgent, ip }
}

async function validateAndSanitizeInput<T>(schema: z.ZodSchema<T>, input: unknown): Promise<T> {
  try {
    return await schema.parseAsync(input)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.issues.map(issue => {
        const path = issue.path.length > 0 ? `${issue.path.join('.')}: ` : ''
        return `${path}${issue.message}`
      }).join(', ')
      throw new ActionError(`Input validation failed: ${errorMessages}`, 'VALIDATION_ERROR')
    }
    throw new ActionError('Invalid input format', 'VALIDATION_ERROR')
  }
}

// Enhanced error handling with context
class ActionExecutionError extends ActionError {
  constructor(
    message: string,
    public readonly context: {
      endpoint: string
      method: string
      timestamp: number
    },
    public readonly originalError?: unknown
  ) {
    super(message, 'EXECUTION_ERROR')
  }
}

// Logging utility for server actions
async function logActionExecution(
  action: string,
  success: boolean,
  duration: number,
  context?: Record<string, any>
) {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[ACTION] ${action} - ${success ? 'SUCCESS' : 'FAILED'} (${duration}ms)`, context)
  }
  
  // In production, send to your logging service
  // await analytics.track('server_action_executed', { action, success, duration, ...context })
}

/**
 * Get Audit Logs
 * @generated from GET /api/v1/analytics/audit-logs
 * Features: React cache, input validation, error handling
 */
export const getAuditLogsApiV1AnalyticsAuditLogsGet = cache(
  authActionClient
    .metadata({
      name: "get-audit-logs-api-v1-analytics-audit-logs-get",
      requiresAuth: true
    })
    .schema(GetAuditLogsApiV1AnalyticsAuditLogsGetParamsSchema)
    .action(async ({ parsedInput, ctx }: { parsedInput: z.infer<typeof GetAuditLogsApiV1AnalyticsAuditLogsGetParamsSchema>; ctx: { user?: any; ratelimit?: { remaining: number } } }) => {
      const startTime = Date.now()
      
      try {
      // Validate and sanitize parameters
      const validatedParams = await validateAndSanitizeInput(GetAuditLogsApiV1AnalyticsAuditLogsGetParamsSchema, parsedInput) as z.infer<typeof GetAuditLogsApiV1AnalyticsAuditLogsGetParamsSchema>

        // Execute API call with enhanced error handling
        const response = await apiClient.analytics.getAuditLogsApiV1AnalyticsAuditLogsGet({params: {
query: validatedParams.query,
    },
          config: {
            timeout: 30000,
            retries: 3,
            validateResponse: false,
            responseSchema: GetAuditLogsApiV1AnalyticsAuditLogsGetResponseSchema
          }
        })
        

        // Log successful execution
        const duration = Date.now() - startTime
        await logActionExecution('getAuditLogsApiV1AnalyticsAuditLogsGet', true, duration, {
          method: 'GET',
          path: '/api/v1/analytics/audit-logs'
        })
        
        return response.data
      } catch (error) {

        const duration = Date.now() - startTime

        // Enhanced error logging
        await logActionExecution('getAuditLogsApiV1AnalyticsAuditLogsGet', false, duration, {
          method: 'GET',
          path: '/api/v1/analytics/audit-logs',
          error: error instanceof Error ? error.message : 'Unknown error'
        })
        
        // Throw enhanced error with context
        throw new ActionExecutionError(
          error instanceof Error ? error.message : 'Unknown error occurred',
          {
            endpoint: '/api/v1/analytics/audit-logs',
            method: 'GET',
            timestamp: Date.now()
          },
          error
        )
      }
    })
)

/**
 * Get Audit Log
 * @generated from GET /api/v1/analytics/audit-logs/{log_id}
 * Features: React cache, input validation, error handling
 */
export const getAuditLogApiV1AnalyticsAuditLogsLogIdGet = cache(
  authActionClient
    .metadata({
      name: "get-audit-log-api-v1-analytics-audit-logs-log-id-get",
      requiresAuth: true
    })
    .schema(GetAuditLogApiV1AnalyticsAuditLogsLogIdGetParamsSchema)
    .action(async ({ parsedInput, ctx }: { parsedInput: z.infer<typeof GetAuditLogApiV1AnalyticsAuditLogsLogIdGetParamsSchema>; ctx: { user?: any; ratelimit?: { remaining: number } } }) => {
      const startTime = Date.now()
      
      try {
      // Validate and sanitize parameters
      const validatedParams = await validateAndSanitizeInput(GetAuditLogApiV1AnalyticsAuditLogsLogIdGetParamsSchema, parsedInput) as z.infer<typeof GetAuditLogApiV1AnalyticsAuditLogsLogIdGetParamsSchema>

        // Execute API call with enhanced error handling
        const response = await apiClient.analytics.getAuditLogApiV1AnalyticsAuditLogsLogIdGet({params: {
path: {
        log_id: validatedParams.path.log_id
      }
    },
          config: {
            timeout: 30000,
            retries: 3,
            validateResponse: false,
            responseSchema: GetAuditLogApiV1AnalyticsAuditLogsLogIdGetResponseSchema
          }
        })
        

        // Log successful execution
        const duration = Date.now() - startTime
        await logActionExecution('getAuditLogApiV1AnalyticsAuditLogsLogIdGet', true, duration, {
          method: 'GET',
          path: '/api/v1/analytics/audit-logs/{log_id}'
        })
        
        return response.data
      } catch (error) {

        const duration = Date.now() - startTime

        // Enhanced error logging
        await logActionExecution('getAuditLogApiV1AnalyticsAuditLogsLogIdGet', false, duration, {
          method: 'GET',
          path: '/api/v1/analytics/audit-logs/{log_id}',
          error: error instanceof Error ? error.message : 'Unknown error'
        })
        
        // Throw enhanced error with context
        throw new ActionExecutionError(
          error instanceof Error ? error.message : 'Unknown error occurred',
          {
            endpoint: '/api/v1/analytics/audit-logs/{log_id}',
            method: 'GET',
            timestamp: Date.now()
          },
          error
        )
      }
    })
)

/**
 * Get Audit Logs Summary
 * @generated from GET /api/v1/analytics/audit-logs/stats/summary
 * Features: React cache, input validation, error handling
 */
export const getAuditLogsSummaryApiV1AnalyticsAuditLogsStatsSummaryGet = cache(
  authActionClient
    .metadata({
      name: "get-audit-logs-summary-api-v1-analytics-audit-logs-stats-summary-get",
      requiresAuth: true
    })
    .schema(GetAuditLogsSummaryApiV1AnalyticsAuditLogsStatsSummaryGetParamsSchema)
    .action(async ({ parsedInput, ctx }: { parsedInput: z.infer<typeof GetAuditLogsSummaryApiV1AnalyticsAuditLogsStatsSummaryGetParamsSchema>; ctx: { user?: any; ratelimit?: { remaining: number } } }) => {
      const startTime = Date.now()
      
      try {
      // Validate and sanitize parameters
      const validatedParams = await validateAndSanitizeInput(GetAuditLogsSummaryApiV1AnalyticsAuditLogsStatsSummaryGetParamsSchema, parsedInput) as z.infer<typeof GetAuditLogsSummaryApiV1AnalyticsAuditLogsStatsSummaryGetParamsSchema>

        // Execute API call with enhanced error handling
        const response = await apiClient.analytics.getAuditLogsSummaryApiV1AnalyticsAuditLogsStatsSummaryGet({params: {
query: validatedParams.query,
    },
          config: {
            timeout: 30000,
            retries: 3,
            validateResponse: false,
            responseSchema: GetAuditLogsSummaryApiV1AnalyticsAuditLogsStatsSummaryGetResponseSchema
          }
        })
        

        // Log successful execution
        const duration = Date.now() - startTime
        await logActionExecution('getAuditLogsSummaryApiV1AnalyticsAuditLogsStatsSummaryGet', true, duration, {
          method: 'GET',
          path: '/api/v1/analytics/audit-logs/stats/summary'
        })
        
        return response.data
      } catch (error) {

        const duration = Date.now() - startTime

        // Enhanced error logging
        await logActionExecution('getAuditLogsSummaryApiV1AnalyticsAuditLogsStatsSummaryGet', false, duration, {
          method: 'GET',
          path: '/api/v1/analytics/audit-logs/stats/summary',
          error: error instanceof Error ? error.message : 'Unknown error'
        })
        
        // Throw enhanced error with context
        throw new ActionExecutionError(
          error instanceof Error ? error.message : 'Unknown error occurred',
          {
            endpoint: '/api/v1/analytics/audit-logs/stats/summary',
            method: 'GET',
            timestamp: Date.now()
          },
          error
        )
      }
    })
)