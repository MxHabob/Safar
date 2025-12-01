'use server'
import { z } from 'zod'
import { cache } from 'react'
import { headers } from 'next/headers'
import { apiClient } from '@/generated/client'
import { actionClientWithMeta, ActionError } from '@/generated/lib/safe-action'
import {
  HealthCheckHealthGetResponseSchema,
  ReadinessCheckHealthReadyGetResponseSchema,
  LivenessCheckHealthLiveGetResponseSchema,
  RootGetResponseSchema
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
 * Health Check
 * @generated from GET /health
 * Features: React cache, input validation, error handling
 */
export const healthCheckHealthGet = cache(
  actionClientWithMeta
    .metadata({
      name: "health-check-health-get",
      requiresAuth: false
    })
    .schema(z.void())
    .action(async ({ parsedInput, ctx }: { parsedInput: void; ctx?: any }) => {
      const startTime = Date.now()
      
      try {

        // Execute API call with enhanced error handling
        const response = await apiClient.default.healthCheckHealthGet({
          config: {
            timeout: 30000,
            retries: 3,
            validateResponse: false,
            responseSchema: HealthCheckHealthGetResponseSchema
          }
        })
        

        // Log successful execution
        const duration = Date.now() - startTime
        await logActionExecution('healthCheckHealthGet', true, duration, {
          method: 'GET',
          path: '/health'
        })
        
        return response.data
      } catch (error) {

        const duration = Date.now() - startTime

        // Enhanced error logging
        await logActionExecution('healthCheckHealthGet', false, duration, {
          method: 'GET',
          path: '/health',
          error: error instanceof Error ? error.message : 'Unknown error'
        })
        
        // Throw enhanced error with context
        throw new ActionExecutionError(
          error instanceof Error ? error.message : 'Unknown error occurred',
          {
            endpoint: '/health',
            method: 'GET',
            timestamp: Date.now()
          },
          error
        )
      }
    })
)

/**
 * Readiness Check
 * @generated from GET /health/ready
 * Features: React cache, input validation, error handling
 */
export const readinessCheckHealthReadyGet = cache(
  actionClientWithMeta
    .metadata({
      name: "readiness-check-health-ready-get",
      requiresAuth: false
    })
    .schema(z.void())
    .action(async ({ parsedInput, ctx }: { parsedInput: void; ctx?: any }) => {
      const startTime = Date.now()
      
      try {

        // Execute API call with enhanced error handling
        const response = await apiClient.default.readinessCheckHealthReadyGet({
          config: {
            timeout: 30000,
            retries: 3,
            validateResponse: false,
            responseSchema: ReadinessCheckHealthReadyGetResponseSchema
          }
        })
        

        // Log successful execution
        const duration = Date.now() - startTime
        await logActionExecution('readinessCheckHealthReadyGet', true, duration, {
          method: 'GET',
          path: '/health/ready'
        })
        
        return response.data
      } catch (error) {

        const duration = Date.now() - startTime

        // Enhanced error logging
        await logActionExecution('readinessCheckHealthReadyGet', false, duration, {
          method: 'GET',
          path: '/health/ready',
          error: error instanceof Error ? error.message : 'Unknown error'
        })
        
        // Throw enhanced error with context
        throw new ActionExecutionError(
          error instanceof Error ? error.message : 'Unknown error occurred',
          {
            endpoint: '/health/ready',
            method: 'GET',
            timestamp: Date.now()
          },
          error
        )
      }
    })
)

/**
 * Liveness Check
 * @generated from GET /health/live
 * Features: React cache, input validation, error handling
 */
export const livenessCheckHealthLiveGet = cache(
  actionClientWithMeta
    .metadata({
      name: "liveness-check-health-live-get",
      requiresAuth: false
    })
    .schema(z.void())
    .action(async ({ parsedInput, ctx }: { parsedInput: void; ctx?: any }) => {
      const startTime = Date.now()
      
      try {

        // Execute API call with enhanced error handling
        const response = await apiClient.default.livenessCheckHealthLiveGet({
          config: {
            timeout: 30000,
            retries: 3,
            validateResponse: false,
            responseSchema: LivenessCheckHealthLiveGetResponseSchema
          }
        })
        

        // Log successful execution
        const duration = Date.now() - startTime
        await logActionExecution('livenessCheckHealthLiveGet', true, duration, {
          method: 'GET',
          path: '/health/live'
        })
        
        return response.data
      } catch (error) {

        const duration = Date.now() - startTime

        // Enhanced error logging
        await logActionExecution('livenessCheckHealthLiveGet', false, duration, {
          method: 'GET',
          path: '/health/live',
          error: error instanceof Error ? error.message : 'Unknown error'
        })
        
        // Throw enhanced error with context
        throw new ActionExecutionError(
          error instanceof Error ? error.message : 'Unknown error occurred',
          {
            endpoint: '/health/live',
            method: 'GET',
            timestamp: Date.now()
          },
          error
        )
      }
    })
)

/**
 * Root
 * @generated from GET /
 * Features: React cache, input validation, error handling
 */
export const rootGet = cache(
  actionClientWithMeta
    .metadata({
      name: "root-get",
      requiresAuth: false
    })
    .schema(z.void())
    .action(async ({ parsedInput, ctx }: { parsedInput: void; ctx?: any }) => {
      const startTime = Date.now()
      
      try {

        // Execute API call with enhanced error handling
        const response = await apiClient.default.rootGet({
          config: {
            timeout: 30000,
            retries: 3,
            validateResponse: false,
            responseSchema: RootGetResponseSchema
          }
        })
        

        // Log successful execution
        const duration = Date.now() - startTime
        await logActionExecution('rootGet', true, duration, {
          method: 'GET',
          path: '/'
        })
        
        return response.data
      } catch (error) {

        const duration = Date.now() - startTime

        // Enhanced error logging
        await logActionExecution('rootGet', false, duration, {
          method: 'GET',
          path: '/',
          error: error instanceof Error ? error.message : 'Unknown error'
        })
        
        // Throw enhanced error with context
        throw new ActionExecutionError(
          error instanceof Error ? error.message : 'Unknown error occurred',
          {
            endpoint: '/',
            method: 'GET',
            timestamp: Date.now()
          },
          error
        )
      }
    })
)