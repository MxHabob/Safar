'use server'
import { z } from 'zod'
import { cache } from 'react'
import { updateTag } from 'next/cache'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { apiClient } from '@/generated/client'
import { actionClientWithMeta, authActionClient, ActionError } from '@/generated/lib/safe-action'
import {
  GetLoyaltyStatusApiV1LoyaltyStatusGetResponseSchema,
  RedeemPointsApiV1LoyaltyRedeemPostRequestSchema,
  RedeemPointsApiV1LoyaltyRedeemPostResponseSchema,
  GetRedemptionOptionsApiV1LoyaltyRedemptionOptionsGetResponseSchema,
  GetLoyaltyHistoryApiV1LoyaltyHistoryGetParamsSchema,
  GetLoyaltyHistoryApiV1LoyaltyHistoryGetResponseSchema
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
 * Get Loyalty Status
 * @generated from GET /api/v1/loyalty/status
 * Features: React cache, input validation, error handling
 */
export const getLoyaltyStatusApiV1LoyaltyStatusGet = cache(
  authActionClient
    .metadata({
      name: "get-loyalty-status-api-v1-loyalty-status-get",
      requiresAuth: true
    })
    .schema(z.void())
    .action(async ({ parsedInput, ctx }: { parsedInput: void; ctx: { user?: any; ratelimit?: { remaining: number } } }) => {
      const startTime = Date.now()
      
      try {

        // Execute API call with enhanced error handling
        const response = await apiClient.loyalty.getLoyaltyStatusApiV1LoyaltyStatusGet({
          config: {
            timeout: 30000,
            retries: 3,
            validateResponse: false,
            responseSchema: GetLoyaltyStatusApiV1LoyaltyStatusGetResponseSchema
          }
        })
        

        // Log successful execution
        const duration = Date.now() - startTime
        await logActionExecution('getLoyaltyStatusApiV1LoyaltyStatusGet', true, duration, {
          method: 'GET',
          path: '/api/v1/loyalty/status'
        })
        
        return response.data
      } catch (error) {

        const duration = Date.now() - startTime

        // Enhanced error logging
        await logActionExecution('getLoyaltyStatusApiV1LoyaltyStatusGet', false, duration, {
          method: 'GET',
          path: '/api/v1/loyalty/status',
          error: error instanceof Error ? error.message : 'Unknown error'
        })
        
        // Throw enhanced error with context
        throw new ActionExecutionError(
          error instanceof Error ? error.message : 'Unknown error occurred',
          {
            endpoint: '/api/v1/loyalty/status',
            method: 'GET',
            timestamp: Date.now()
          },
          error
        )
      }
    })
)

/**
 * Redeem Points
 * @generated from POST /api/v1/loyalty/redeem
 * Features: Input validation, revalidation, error handling
 */
export const redeemPointsApiV1LoyaltyRedeemPost = authActionClient
  .metadata({
    name: "redeem-points-api-v1-loyalty-redeem-post",
    requiresAuth: true
  })
  .schema(RedeemPointsApiV1LoyaltyRedeemPostRequestSchema)
  .action(async ({ parsedInput, ctx }: { parsedInput: z.infer<typeof RedeemPointsApiV1LoyaltyRedeemPostRequestSchema>; ctx: { user?: any; ratelimit?: { remaining: number } } }) => {
    const startTime = Date.now()
    
    try {
      // Validate and sanitize request body
      const validatedBody = await validateAndSanitizeInput(RedeemPointsApiV1LoyaltyRedeemPostRequestSchema, parsedInput)

      // Execute API call with enhanced configuration
      const response = await apiClient.loyalty.redeemPointsApiV1LoyaltyRedeemPost({body: validatedBody,
        config: {
          timeout: 30000,
          retries: 3,
          validateResponse: false,
          responseSchema: RedeemPointsApiV1LoyaltyRedeemPostResponseSchema
        }
      })
        // Handle streaming responses
        if (response.headers.get('content-type')?.includes('text/stream')) {
          // Process streaming response
          return response.data
        }
        // Handle potential redirects based on response
        if (response.status === 201 && response.headers.get('location')) {
          const location = response.headers.get('location')!
          redirect(location)
        }

            // Revalidate cache after successful mutation
      updateTag('Loyalty')
      console.log('Updated tag: Loyalty')


      // Log successful execution
      const duration = Date.now() - startTime
      await logActionExecution('redeemPointsApiV1LoyaltyRedeemPost', true, duration, {
        method: 'POST',
        path: '/api/v1/loyalty/redeem'
      })
      
      return response.data
    } catch (error) {

      const duration = Date.now() - startTime

      // Enhanced error logging
      await logActionExecution('redeemPointsApiV1LoyaltyRedeemPost', false, duration, {
        method: 'POST',
        path: '/api/v1/loyalty/redeem',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      
      // Throw enhanced error with context
      throw new ActionExecutionError(
        error instanceof Error ? error.message : 'Unknown error occurred',
        {
          endpoint: '/api/v1/loyalty/redeem',
          method: 'POST',
          timestamp: Date.now()
        },
        error
      )
    }
  })

/**
 * Get Redemption Options
 * @generated from GET /api/v1/loyalty/redemption-options
 * Features: React cache, input validation, error handling
 */
export const getRedemptionOptionsApiV1LoyaltyRedemptionOptionsGet = cache(
  authActionClient
    .metadata({
      name: "get-redemption-options-api-v1-loyalty-redemption-options-get",
      requiresAuth: true
    })
    .schema(z.void())
    .action(async ({ parsedInput, ctx }: { parsedInput: void; ctx: { user?: any; ratelimit?: { remaining: number } } }) => {
      const startTime = Date.now()
      
      try {

        // Execute API call with enhanced error handling
        const response = await apiClient.loyalty.getRedemptionOptionsApiV1LoyaltyRedemptionOptionsGet({
          config: {
            timeout: 30000,
            retries: 3,
            validateResponse: false,
            responseSchema: GetRedemptionOptionsApiV1LoyaltyRedemptionOptionsGetResponseSchema
          }
        })
        

        // Log successful execution
        const duration = Date.now() - startTime
        await logActionExecution('getRedemptionOptionsApiV1LoyaltyRedemptionOptionsGet', true, duration, {
          method: 'GET',
          path: '/api/v1/loyalty/redemption-options'
        })
        
        return response.data
      } catch (error) {

        const duration = Date.now() - startTime

        // Enhanced error logging
        await logActionExecution('getRedemptionOptionsApiV1LoyaltyRedemptionOptionsGet', false, duration, {
          method: 'GET',
          path: '/api/v1/loyalty/redemption-options',
          error: error instanceof Error ? error.message : 'Unknown error'
        })
        
        // Throw enhanced error with context
        throw new ActionExecutionError(
          error instanceof Error ? error.message : 'Unknown error occurred',
          {
            endpoint: '/api/v1/loyalty/redemption-options',
            method: 'GET',
            timestamp: Date.now()
          },
          error
        )
      }
    })
)

/**
 * Get Loyalty History
 * @generated from GET /api/v1/loyalty/history
 * Features: React cache, input validation, error handling
 */
export const getLoyaltyHistoryApiV1LoyaltyHistoryGet = cache(
  authActionClient
    .metadata({
      name: "get-loyalty-history-api-v1-loyalty-history-get",
      requiresAuth: true
    })
    .schema(GetLoyaltyHistoryApiV1LoyaltyHistoryGetParamsSchema)
    .action(async ({ parsedInput, ctx }: { parsedInput: z.infer<typeof GetLoyaltyHistoryApiV1LoyaltyHistoryGetParamsSchema>; ctx: { user?: any; ratelimit?: { remaining: number } } }) => {
      const startTime = Date.now()
      
      try {
      // Validate and sanitize parameters
      const validatedParams = await validateAndSanitizeInput(GetLoyaltyHistoryApiV1LoyaltyHistoryGetParamsSchema, parsedInput) as z.infer<typeof GetLoyaltyHistoryApiV1LoyaltyHistoryGetParamsSchema>

        // Execute API call with enhanced error handling
        const response = await apiClient.loyalty.getLoyaltyHistoryApiV1LoyaltyHistoryGet({params: {
query: validatedParams.query,
    },
          config: {
            timeout: 30000,
            retries: 3,
            validateResponse: false,
            responseSchema: GetLoyaltyHistoryApiV1LoyaltyHistoryGetResponseSchema
          }
        })
        

        // Log successful execution
        const duration = Date.now() - startTime
        await logActionExecution('getLoyaltyHistoryApiV1LoyaltyHistoryGet', true, duration, {
          method: 'GET',
          path: '/api/v1/loyalty/history'
        })
        
        return response.data
      } catch (error) {

        const duration = Date.now() - startTime

        // Enhanced error logging
        await logActionExecution('getLoyaltyHistoryApiV1LoyaltyHistoryGet', false, duration, {
          method: 'GET',
          path: '/api/v1/loyalty/history',
          error: error instanceof Error ? error.message : 'Unknown error'
        })
        
        // Throw enhanced error with context
        throw new ActionExecutionError(
          error instanceof Error ? error.message : 'Unknown error occurred',
          {
            endpoint: '/api/v1/loyalty/history',
            method: 'GET',
            timestamp: Date.now()
          },
          error
        )
      }
    })
)