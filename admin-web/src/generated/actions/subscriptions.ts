'use server'
import { z } from 'zod'
import { cache } from 'react'
import { updateTag } from 'next/cache'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { apiClient } from '@/generated/client'
import { actionClientWithMeta, authActionClient, ActionError } from '@/generated/lib/safe-action'
import {
  GetSubscriptionPlansApiV1SubscriptionsPlansGetParamsSchema,
  GetSubscriptionPlansApiV1SubscriptionsPlansGetResponseSchema,
  GetMySubscriptionApiV1SubscriptionsMySubscriptionGetParamsSchema,
  GetMySubscriptionApiV1SubscriptionsMySubscriptionGetResponseSchema,
  SubscribeApiV1SubscriptionsSubscribePostParamsSchema,
  SubscribeApiV1SubscriptionsSubscribePostResponseSchema,
  CancelSubscriptionApiV1SubscriptionsSubscriptionIdCancelPostParamsSchema,
  CancelSubscriptionApiV1SubscriptionsSubscriptionIdCancelPostResponseSchema,
  CheckUsageApiV1SubscriptionsUsageLimitTypeGetParamsSchema,
  CheckUsageApiV1SubscriptionsUsageLimitTypeGetResponseSchema
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
 * Get Subscription Plans
 * @generated from GET /api/v1/subscriptions/plans
 * Features: React cache, input validation, error handling
 */
export const getSubscriptionPlansApiV1SubscriptionsPlansGet = cache(
  actionClientWithMeta
    .metadata({
      name: "get-subscription-plans-api-v1-subscriptions-plans-get",
      requiresAuth: false
    })
    .schema(GetSubscriptionPlansApiV1SubscriptionsPlansGetParamsSchema)
    .action(async ({ parsedInput, ctx }: { parsedInput: z.infer<typeof GetSubscriptionPlansApiV1SubscriptionsPlansGetParamsSchema>; ctx?: any }) => {
      const startTime = Date.now()
      
      try {
      // Validate and sanitize parameters
      const validatedParams = await validateAndSanitizeInput(GetSubscriptionPlansApiV1SubscriptionsPlansGetParamsSchema, parsedInput) as z.infer<typeof GetSubscriptionPlansApiV1SubscriptionsPlansGetParamsSchema>

        // Execute API call with enhanced error handling
        const response = await apiClient.subscriptions.getSubscriptionPlansApiV1SubscriptionsPlansGet({params: {
query: validatedParams.query,
    },
          config: {
            timeout: 30000,
            retries: 3,
            validateResponse: false,
            responseSchema: GetSubscriptionPlansApiV1SubscriptionsPlansGetResponseSchema
          }
        })
        

        // Log successful execution
        const duration = Date.now() - startTime
        await logActionExecution('getSubscriptionPlansApiV1SubscriptionsPlansGet', true, duration, {
          method: 'GET',
          path: '/api/v1/subscriptions/plans'
        })
        
        return response.data
      } catch (error) {

        const duration = Date.now() - startTime

        // Enhanced error logging
        await logActionExecution('getSubscriptionPlansApiV1SubscriptionsPlansGet', false, duration, {
          method: 'GET',
          path: '/api/v1/subscriptions/plans',
          error: error instanceof Error ? error.message : 'Unknown error'
        })
        
        // Throw enhanced error with context
        throw new ActionExecutionError(
          error instanceof Error ? error.message : 'Unknown error occurred',
          {
            endpoint: '/api/v1/subscriptions/plans',
            method: 'GET',
            timestamp: Date.now()
          },
          error
        )
      }
    })
)

/**
 * Get My Subscription
 * @generated from GET /api/v1/subscriptions/my-subscription
 * Features: React cache, input validation, error handling
 */
export const getMySubscriptionApiV1SubscriptionsMySubscriptionGet = cache(
  authActionClient
    .metadata({
      name: "get-my-subscription-api-v1-subscriptions-my-subscription-get",
      requiresAuth: true
    })
    .schema(GetMySubscriptionApiV1SubscriptionsMySubscriptionGetParamsSchema)
    .action(async ({ parsedInput, ctx }: { parsedInput: z.infer<typeof GetMySubscriptionApiV1SubscriptionsMySubscriptionGetParamsSchema>; ctx: { user?: any; ratelimit?: { remaining: number } } }) => {
      const startTime = Date.now()
      
      try {
      // Validate and sanitize parameters
      const validatedParams = await validateAndSanitizeInput(GetMySubscriptionApiV1SubscriptionsMySubscriptionGetParamsSchema, parsedInput) as z.infer<typeof GetMySubscriptionApiV1SubscriptionsMySubscriptionGetParamsSchema>

        // Execute API call with enhanced error handling
        const response = await apiClient.subscriptions.getMySubscriptionApiV1SubscriptionsMySubscriptionGet({params: {
query: validatedParams.query,
    },
          config: {
            timeout: 30000,
            retries: 3,
            validateResponse: false,
            responseSchema: GetMySubscriptionApiV1SubscriptionsMySubscriptionGetResponseSchema
          }
        })
        

        // Log successful execution
        const duration = Date.now() - startTime
        await logActionExecution('getMySubscriptionApiV1SubscriptionsMySubscriptionGet', true, duration, {
          method: 'GET',
          path: '/api/v1/subscriptions/my-subscription'
        })
        
        return response.data
      } catch (error) {

        const duration = Date.now() - startTime

        // Enhanced error logging
        await logActionExecution('getMySubscriptionApiV1SubscriptionsMySubscriptionGet', false, duration, {
          method: 'GET',
          path: '/api/v1/subscriptions/my-subscription',
          error: error instanceof Error ? error.message : 'Unknown error'
        })
        
        // Throw enhanced error with context
        throw new ActionExecutionError(
          error instanceof Error ? error.message : 'Unknown error occurred',
          {
            endpoint: '/api/v1/subscriptions/my-subscription',
            method: 'GET',
            timestamp: Date.now()
          },
          error
        )
      }
    })
)

/**
 * Subscribe
 * @generated from POST /api/v1/subscriptions/subscribe
 * Features: Input validation, revalidation, error handling
 */
export const subscribeApiV1SubscriptionsSubscribePost = authActionClient
  .metadata({
    name: "subscribe-api-v1-subscriptions-subscribe-post",
    requiresAuth: true
  })
  .schema(SubscribeApiV1SubscriptionsSubscribePostParamsSchema)
  .action(async ({ parsedInput, ctx }: { parsedInput: z.infer<typeof SubscribeApiV1SubscriptionsSubscribePostParamsSchema>; ctx: { user?: any; ratelimit?: { remaining: number } } }) => {
    const startTime = Date.now()
    
    try {
      // Validate and sanitize parameters
      const validatedParams = await validateAndSanitizeInput(SubscribeApiV1SubscriptionsSubscribePostParamsSchema, parsedInput) as z.infer<typeof SubscribeApiV1SubscriptionsSubscribePostParamsSchema>

      // Execute API call with enhanced configuration
      const response = await apiClient.subscriptions.subscribeApiV1SubscriptionsSubscribePost({params: {
query: validatedParams.query,
    },
        config: {
          timeout: 30000,
          retries: 3,
          validateResponse: false,
          responseSchema: SubscribeApiV1SubscriptionsSubscribePostResponseSchema
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
      updateTag('Subscriptions')
      console.log('Updated tag: Subscriptions')


      // Log successful execution
      const duration = Date.now() - startTime
      await logActionExecution('subscribeApiV1SubscriptionsSubscribePost', true, duration, {
        method: 'POST',
        path: '/api/v1/subscriptions/subscribe'
      })
      
      return response.data
    } catch (error) {

      const duration = Date.now() - startTime

      // Enhanced error logging
      await logActionExecution('subscribeApiV1SubscriptionsSubscribePost', false, duration, {
        method: 'POST',
        path: '/api/v1/subscriptions/subscribe',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      
      // Throw enhanced error with context
      throw new ActionExecutionError(
        error instanceof Error ? error.message : 'Unknown error occurred',
        {
          endpoint: '/api/v1/subscriptions/subscribe',
          method: 'POST',
          timestamp: Date.now()
        },
        error
      )
    }
  })

/**
 * Cancel Subscription
 * @generated from POST /api/v1/subscriptions/{subscription_id}/cancel
 * Features: Input validation, revalidation, error handling
 */
export const cancelSubscriptionApiV1SubscriptionsSubscriptionIdCancelPost = authActionClient
  .metadata({
    name: "cancel-subscription-api-v1-subscriptions-subscription-id-cancel-post",
    requiresAuth: true
  })
  .schema(CancelSubscriptionApiV1SubscriptionsSubscriptionIdCancelPostParamsSchema)
  .action(async ({ parsedInput, ctx }: { parsedInput: z.infer<typeof CancelSubscriptionApiV1SubscriptionsSubscriptionIdCancelPostParamsSchema>; ctx: { user?: any; ratelimit?: { remaining: number } } }) => {
    const startTime = Date.now()
    
    try {
      // Validate and sanitize parameters
      const validatedParams = await validateAndSanitizeInput(CancelSubscriptionApiV1SubscriptionsSubscriptionIdCancelPostParamsSchema, parsedInput) as z.infer<typeof CancelSubscriptionApiV1SubscriptionsSubscriptionIdCancelPostParamsSchema>

      // Execute API call with enhanced configuration
      const response = await apiClient.subscriptions.cancelSubscriptionApiV1SubscriptionsSubscriptionIdCancelPost({params: {
path: {
        subscription_id: validatedParams.path.subscription_id
      },
query: validatedParams.query,
    },
        config: {
          timeout: 30000,
          retries: 3,
          validateResponse: false,
          responseSchema: CancelSubscriptionApiV1SubscriptionsSubscriptionIdCancelPostResponseSchema
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
      updateTag('Subscriptions')
      console.log('Updated tag: Subscriptions')


      // Log successful execution
      const duration = Date.now() - startTime
      await logActionExecution('cancelSubscriptionApiV1SubscriptionsSubscriptionIdCancelPost', true, duration, {
        method: 'POST',
        path: '/api/v1/subscriptions/{subscription_id}/cancel'
      })
      
      return response.data
    } catch (error) {

      const duration = Date.now() - startTime

      // Enhanced error logging
      await logActionExecution('cancelSubscriptionApiV1SubscriptionsSubscriptionIdCancelPost', false, duration, {
        method: 'POST',
        path: '/api/v1/subscriptions/{subscription_id}/cancel',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      
      // Throw enhanced error with context
      throw new ActionExecutionError(
        error instanceof Error ? error.message : 'Unknown error occurred',
        {
          endpoint: '/api/v1/subscriptions/{subscription_id}/cancel',
          method: 'POST',
          timestamp: Date.now()
        },
        error
      )
    }
  })

/**
 * Check Usage
 * @generated from GET /api/v1/subscriptions/usage/{limit_type}
 * Features: React cache, input validation, error handling
 */
export const checkUsageApiV1SubscriptionsUsageLimitTypeGet = cache(
  authActionClient
    .metadata({
      name: "check-usage-api-v1-subscriptions-usage-limit-type-get",
      requiresAuth: true
    })
    .schema(CheckUsageApiV1SubscriptionsUsageLimitTypeGetParamsSchema)
    .action(async ({ parsedInput, ctx }: { parsedInput: z.infer<typeof CheckUsageApiV1SubscriptionsUsageLimitTypeGetParamsSchema>; ctx: { user?: any; ratelimit?: { remaining: number } } }) => {
      const startTime = Date.now()
      
      try {
      // Validate and sanitize parameters
      const validatedParams = await validateAndSanitizeInput(CheckUsageApiV1SubscriptionsUsageLimitTypeGetParamsSchema, parsedInput) as z.infer<typeof CheckUsageApiV1SubscriptionsUsageLimitTypeGetParamsSchema>

        // Execute API call with enhanced error handling
        const response = await apiClient.subscriptions.checkUsageApiV1SubscriptionsUsageLimitTypeGet({params: {
path: {
        limit_type: validatedParams.path.limit_type
      },
query: validatedParams.query,
    },
          config: {
            timeout: 30000,
            retries: 3,
            validateResponse: false,
            responseSchema: CheckUsageApiV1SubscriptionsUsageLimitTypeGetResponseSchema
          }
        })
        

        // Log successful execution
        const duration = Date.now() - startTime
        await logActionExecution('checkUsageApiV1SubscriptionsUsageLimitTypeGet', true, duration, {
          method: 'GET',
          path: '/api/v1/subscriptions/usage/{limit_type}'
        })
        
        return response.data
      } catch (error) {

        const duration = Date.now() - startTime

        // Enhanced error logging
        await logActionExecution('checkUsageApiV1SubscriptionsUsageLimitTypeGet', false, duration, {
          method: 'GET',
          path: '/api/v1/subscriptions/usage/{limit_type}',
          error: error instanceof Error ? error.message : 'Unknown error'
        })
        
        // Throw enhanced error with context
        throw new ActionExecutionError(
          error instanceof Error ? error.message : 'Unknown error occurred',
          {
            endpoint: '/api/v1/subscriptions/usage/{limit_type}',
            method: 'GET',
            timestamp: Date.now()
          },
          error
        )
      }
    })
)