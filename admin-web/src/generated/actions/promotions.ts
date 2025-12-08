'use server'
import { z } from 'zod'
import { cache } from 'react'
import { updateTag } from 'next/cache'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { apiClient } from '@/generated/client'
import { actionClientWithMeta, authActionClient, ActionError } from '@/generated/lib/safe-action'
import {
  ListCouponsApiV1PromotionsCouponsGetParamsSchema,
  ListCouponsApiV1PromotionsCouponsGetResponseSchema,
  CreateCouponApiV1PromotionsCouponsPostRequestSchema,
  CreateCouponApiV1PromotionsCouponsPostResponseSchema,
  ValidateCouponApiV1PromotionsCouponsCouponCodeValidateGetParamsSchema,
  ValidateCouponApiV1PromotionsCouponsCouponCodeValidateGetResponseSchema,
  GetApplicablePromotionsApiV1PromotionsApplicableGetParamsSchema,
  GetApplicablePromotionsApiV1PromotionsApplicableGetResponseSchema
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
 * List Coupons
 * @generated from GET /api/v1/promotions/coupons
 * Features: React cache, input validation, error handling
 */
export const listCouponsApiV1PromotionsCouponsGet = cache(
  authActionClient
    .metadata({
      name: "list-coupons-api-v1-promotions-coupons-get",
      requiresAuth: true
    })
    .schema(ListCouponsApiV1PromotionsCouponsGetParamsSchema)
    .action(async ({ parsedInput, ctx }: { parsedInput: z.infer<typeof ListCouponsApiV1PromotionsCouponsGetParamsSchema>; ctx: { user?: any; ratelimit?: { remaining: number } } }) => {
      const startTime = Date.now()
      
      try {
      // Validate and sanitize parameters
      const validatedParams = await validateAndSanitizeInput(ListCouponsApiV1PromotionsCouponsGetParamsSchema, parsedInput) as z.infer<typeof ListCouponsApiV1PromotionsCouponsGetParamsSchema>

        // Execute API call with enhanced error handling
        const response = await apiClient.promotions.listCouponsApiV1PromotionsCouponsGet({params: {
query: validatedParams.query,
    },
          config: {
            timeout: 30000,
            retries: 3,
            validateResponse: false,
            responseSchema: ListCouponsApiV1PromotionsCouponsGetResponseSchema
          }
        })
        

        // Log successful execution
        const duration = Date.now() - startTime
        await logActionExecution('listCouponsApiV1PromotionsCouponsGet', true, duration, {
          method: 'GET',
          path: '/api/v1/promotions/coupons'
        })
        
        return response.data
      } catch (error) {

        const duration = Date.now() - startTime

        // Enhanced error logging
        await logActionExecution('listCouponsApiV1PromotionsCouponsGet', false, duration, {
          method: 'GET',
          path: '/api/v1/promotions/coupons',
          error: error instanceof Error ? error.message : 'Unknown error'
        })
        
        // Throw enhanced error with context
        throw new ActionExecutionError(
          error instanceof Error ? error.message : 'Unknown error occurred',
          {
            endpoint: '/api/v1/promotions/coupons',
            method: 'GET',
            timestamp: Date.now()
          },
          error
        )
      }
    })
)

/**
 * Create Coupon
 * @generated from POST /api/v1/promotions/coupons
 * Features: Input validation, revalidation, error handling
 */
export const createCouponApiV1PromotionsCouponsPost = authActionClient
  .metadata({
    name: "create-coupon-api-v1-promotions-coupons-post",
    requiresAuth: true
  })
  .schema(CreateCouponApiV1PromotionsCouponsPostRequestSchema)
  .action(async ({ parsedInput, ctx }: { parsedInput: z.infer<typeof CreateCouponApiV1PromotionsCouponsPostRequestSchema>; ctx: { user?: any; ratelimit?: { remaining: number } } }) => {
    const startTime = Date.now()
    
    try {
      // Validate and sanitize request body
      const validatedBody = await validateAndSanitizeInput(CreateCouponApiV1PromotionsCouponsPostRequestSchema, parsedInput)

      // Execute API call with enhanced configuration
      const response = await apiClient.promotions.createCouponApiV1PromotionsCouponsPost({body: validatedBody,
        config: {
          timeout: 30000,
          retries: 3,
          validateResponse: false,
          responseSchema: CreateCouponApiV1PromotionsCouponsPostResponseSchema
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
      updateTag('Promotions')
      console.log('Updated tag: Promotions')


      // Log successful execution
      const duration = Date.now() - startTime
      await logActionExecution('createCouponApiV1PromotionsCouponsPost', true, duration, {
        method: 'POST',
        path: '/api/v1/promotions/coupons'
      })
      
      return response.data
    } catch (error) {

      const duration = Date.now() - startTime

      // Enhanced error logging
      await logActionExecution('createCouponApiV1PromotionsCouponsPost', false, duration, {
        method: 'POST',
        path: '/api/v1/promotions/coupons',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      
      // Throw enhanced error with context
      throw new ActionExecutionError(
        error instanceof Error ? error.message : 'Unknown error occurred',
        {
          endpoint: '/api/v1/promotions/coupons',
          method: 'POST',
          timestamp: Date.now()
        },
        error
      )
    }
  })

/**
 * Validate Coupon
 * @generated from GET /api/v1/promotions/coupons/{coupon_code}/validate
 * Features: React cache, input validation, error handling
 */
export const validateCouponApiV1PromotionsCouponsCouponCodeValidateGet = cache(
  authActionClient
    .metadata({
      name: "validate-coupon-api-v1-promotions-coupons-coupon-code-validate-get",
      requiresAuth: true
    })
    .schema(ValidateCouponApiV1PromotionsCouponsCouponCodeValidateGetParamsSchema)
    .action(async ({ parsedInput, ctx }: { parsedInput: z.infer<typeof ValidateCouponApiV1PromotionsCouponsCouponCodeValidateGetParamsSchema>; ctx: { user?: any; ratelimit?: { remaining: number } } }) => {
      const startTime = Date.now()
      
      try {
      // Validate and sanitize parameters
      const validatedParams = await validateAndSanitizeInput(ValidateCouponApiV1PromotionsCouponsCouponCodeValidateGetParamsSchema, parsedInput) as z.infer<typeof ValidateCouponApiV1PromotionsCouponsCouponCodeValidateGetParamsSchema>

        // Execute API call with enhanced error handling
        const response = await apiClient.promotions.validateCouponApiV1PromotionsCouponsCouponCodeValidateGet({params: {
path: {
        coupon_code: validatedParams.path.coupon_code
      },
query: validatedParams.query,
    },
          config: {
            timeout: 30000,
            retries: 3,
            validateResponse: false,
            responseSchema: ValidateCouponApiV1PromotionsCouponsCouponCodeValidateGetResponseSchema
          }
        })
        

        // Log successful execution
        const duration = Date.now() - startTime
        await logActionExecution('validateCouponApiV1PromotionsCouponsCouponCodeValidateGet', true, duration, {
          method: 'GET',
          path: '/api/v1/promotions/coupons/{coupon_code}/validate'
        })
        
        return response.data
      } catch (error) {

        const duration = Date.now() - startTime

        // Enhanced error logging
        await logActionExecution('validateCouponApiV1PromotionsCouponsCouponCodeValidateGet', false, duration, {
          method: 'GET',
          path: '/api/v1/promotions/coupons/{coupon_code}/validate',
          error: error instanceof Error ? error.message : 'Unknown error'
        })
        
        // Throw enhanced error with context
        throw new ActionExecutionError(
          error instanceof Error ? error.message : 'Unknown error occurred',
          {
            endpoint: '/api/v1/promotions/coupons/{coupon_code}/validate',
            method: 'GET',
            timestamp: Date.now()
          },
          error
        )
      }
    })
)

/**
 * Get Applicable Promotions
 * @generated from GET /api/v1/promotions/applicable
 * Features: React cache, input validation, error handling
 */
export const getApplicablePromotionsApiV1PromotionsApplicableGet = cache(
  actionClientWithMeta
    .metadata({
      name: "get-applicable-promotions-api-v1-promotions-applicable-get",
      requiresAuth: false
    })
    .schema(GetApplicablePromotionsApiV1PromotionsApplicableGetParamsSchema)
    .action(async ({ parsedInput, ctx }: { parsedInput: z.infer<typeof GetApplicablePromotionsApiV1PromotionsApplicableGetParamsSchema>; ctx?: any }) => {
      const startTime = Date.now()
      
      try {
      // Validate and sanitize parameters
      const validatedParams = await validateAndSanitizeInput(GetApplicablePromotionsApiV1PromotionsApplicableGetParamsSchema, parsedInput) as z.infer<typeof GetApplicablePromotionsApiV1PromotionsApplicableGetParamsSchema>

        // Execute API call with enhanced error handling
        const response = await apiClient.promotions.getApplicablePromotionsApiV1PromotionsApplicableGet({params: {
query: validatedParams.query,
    },
          config: {
            timeout: 30000,
            retries: 3,
            validateResponse: false,
            responseSchema: GetApplicablePromotionsApiV1PromotionsApplicableGetResponseSchema
          }
        })
        

        // Log successful execution
        const duration = Date.now() - startTime
        await logActionExecution('getApplicablePromotionsApiV1PromotionsApplicableGet', true, duration, {
          method: 'GET',
          path: '/api/v1/promotions/applicable'
        })
        
        return response.data
      } catch (error) {

        const duration = Date.now() - startTime

        // Enhanced error logging
        await logActionExecution('getApplicablePromotionsApiV1PromotionsApplicableGet', false, duration, {
          method: 'GET',
          path: '/api/v1/promotions/applicable',
          error: error instanceof Error ? error.message : 'Unknown error'
        })
        
        // Throw enhanced error with context
        throw new ActionExecutionError(
          error instanceof Error ? error.message : 'Unknown error occurred',
          {
            endpoint: '/api/v1/promotions/applicable',
            method: 'GET',
            timestamp: Date.now()
          },
          error
        )
      }
    })
)