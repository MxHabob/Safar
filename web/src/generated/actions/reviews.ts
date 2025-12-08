'use server'
import { z } from 'zod'
import { cache } from 'react'
import { updateTag } from 'next/cache'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { apiClient } from '@/generated/client'
import { actionClientWithMeta, authActionClient, ActionError } from '@/generated/lib/safe-action'
import {
  CreateReviewApiV1ReviewsPostRequestSchema,
  CreateReviewApiV1ReviewsPostResponseSchema,
  GetListingReviewsApiV1ReviewsListingsListingIdGetParamsSchema,
  GetListingReviewsApiV1ReviewsListingsListingIdGetResponseSchema,
  GetReviewApiV1ReviewsReviewIdGetParamsSchema,
  GetReviewApiV1ReviewsReviewIdGetResponseSchema,
  CreateReviewResponseApiV1ReviewsReviewIdResponsePostRequestSchema,
  CreateReviewResponseApiV1ReviewsReviewIdResponsePostParamsSchema,
  CreateReviewResponseApiV1ReviewsReviewIdResponsePostResponseSchema,
  MarkReviewHelpfulApiV1ReviewsReviewIdHelpfulPostRequestSchema,
  MarkReviewHelpfulApiV1ReviewsReviewIdHelpfulPostParamsSchema,
  MarkReviewHelpfulApiV1ReviewsReviewIdHelpfulPostResponseSchema
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
 * Create Review
 * @generated from POST /api/v1/reviews
 * Features: Input validation, revalidation, error handling
 */
export const createReviewApiV1ReviewsPost = authActionClient
  .metadata({
    name: "create-review-api-v1-reviews-post",
    requiresAuth: true
  })
  .schema(CreateReviewApiV1ReviewsPostRequestSchema)
  .action(async ({ parsedInput, ctx }: { parsedInput: z.infer<typeof CreateReviewApiV1ReviewsPostRequestSchema>; ctx: { user?: any; ratelimit?: { remaining: number } } }) => {
    const startTime = Date.now()
    
    try {
      // Validate and sanitize request body
      const validatedBody = await validateAndSanitizeInput(CreateReviewApiV1ReviewsPostRequestSchema, parsedInput)

      // Execute API call with enhanced configuration
      const response = await apiClient.reviews.createReviewApiV1ReviewsPost({body: validatedBody,
        config: {
          timeout: 30000,
          retries: 3,
          validateResponse: false,
          responseSchema: CreateReviewApiV1ReviewsPostResponseSchema
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
      updateTag('Reviews')
      console.log('Updated tag: Reviews')


      // Log successful execution
      const duration = Date.now() - startTime
      await logActionExecution('createReviewApiV1ReviewsPost', true, duration, {
        method: 'POST',
        path: '/api/v1/reviews'
      })
      
      return response.data
    } catch (error) {

      const duration = Date.now() - startTime

      // Enhanced error logging
      await logActionExecution('createReviewApiV1ReviewsPost', false, duration, {
        method: 'POST',
        path: '/api/v1/reviews',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      
      // Throw enhanced error with context
      throw new ActionExecutionError(
        error instanceof Error ? error.message : 'Unknown error occurred',
        {
          endpoint: '/api/v1/reviews',
          method: 'POST',
          timestamp: Date.now()
        },
        error
      )
    }
  })

/**
 * Get Listing Reviews
 * @generated from GET /api/v1/reviews/listings/{listing_id}
 * Features: React cache, input validation, error handling
 */
export const getListingReviewsApiV1ReviewsListingsListingIdGet = cache(
  actionClientWithMeta
    .metadata({
      name: "get-listing-reviews-api-v1-reviews-listings-listing-id-get",
      requiresAuth: false
    })
    .schema(GetListingReviewsApiV1ReviewsListingsListingIdGetParamsSchema)
    .action(async ({ parsedInput, ctx }: { parsedInput: z.infer<typeof GetListingReviewsApiV1ReviewsListingsListingIdGetParamsSchema>; ctx?: any }) => {
      const startTime = Date.now()
      
      try {
      // Validate and sanitize parameters
      const validatedParams = await validateAndSanitizeInput(GetListingReviewsApiV1ReviewsListingsListingIdGetParamsSchema, parsedInput) as z.infer<typeof GetListingReviewsApiV1ReviewsListingsListingIdGetParamsSchema>

        // Execute API call with enhanced error handling
        const response = await apiClient.reviews.getListingReviewsApiV1ReviewsListingsListingIdGet({params: {
path: {
        listing_id: validatedParams.path.listing_id
      },
query: validatedParams.query,
    },
          config: {
            timeout: 30000,
            retries: 3,
            validateResponse: false,
            responseSchema: GetListingReviewsApiV1ReviewsListingsListingIdGetResponseSchema
          }
        })
        

        // Log successful execution
        const duration = Date.now() - startTime
        await logActionExecution('getListingReviewsApiV1ReviewsListingsListingIdGet', true, duration, {
          method: 'GET',
          path: '/api/v1/reviews/listings/{listing_id}'
        })
        
        return response.data
      } catch (error) {

        const duration = Date.now() - startTime

        // Enhanced error logging
        await logActionExecution('getListingReviewsApiV1ReviewsListingsListingIdGet', false, duration, {
          method: 'GET',
          path: '/api/v1/reviews/listings/{listing_id}',
          error: error instanceof Error ? error.message : 'Unknown error'
        })
        
        // Throw enhanced error with context
        throw new ActionExecutionError(
          error instanceof Error ? error.message : 'Unknown error occurred',
          {
            endpoint: '/api/v1/reviews/listings/{listing_id}',
            method: 'GET',
            timestamp: Date.now()
          },
          error
        )
      }
    })
)

/**
 * Get Review
 * @generated from GET /api/v1/reviews/{review_id}
 * Features: React cache, input validation, error handling
 */
export const getReviewApiV1ReviewsReviewIdGet = cache(
  actionClientWithMeta
    .metadata({
      name: "get-review-api-v1-reviews-review-id-get",
      requiresAuth: false
    })
    .schema(GetReviewApiV1ReviewsReviewIdGetParamsSchema)
    .action(async ({ parsedInput, ctx }: { parsedInput: z.infer<typeof GetReviewApiV1ReviewsReviewIdGetParamsSchema>; ctx?: any }) => {
      const startTime = Date.now()
      
      try {
      // Validate and sanitize parameters
      const validatedParams = await validateAndSanitizeInput(GetReviewApiV1ReviewsReviewIdGetParamsSchema, parsedInput) as z.infer<typeof GetReviewApiV1ReviewsReviewIdGetParamsSchema>

        // Execute API call with enhanced error handling
        const response = await apiClient.reviews.getReviewApiV1ReviewsReviewIdGet({params: {
path: {
        review_id: Number(validatedParams.path.review_id)
      }
    },
          config: {
            timeout: 30000,
            retries: 3,
            validateResponse: false,
            responseSchema: GetReviewApiV1ReviewsReviewIdGetResponseSchema
          }
        })
        

        // Log successful execution
        const duration = Date.now() - startTime
        await logActionExecution('getReviewApiV1ReviewsReviewIdGet', true, duration, {
          method: 'GET',
          path: '/api/v1/reviews/{review_id}'
        })
        
        return response.data
      } catch (error) {

        const duration = Date.now() - startTime

        // Enhanced error logging
        await logActionExecution('getReviewApiV1ReviewsReviewIdGet', false, duration, {
          method: 'GET',
          path: '/api/v1/reviews/{review_id}',
          error: error instanceof Error ? error.message : 'Unknown error'
        })
        
        // Throw enhanced error with context
        throw new ActionExecutionError(
          error instanceof Error ? error.message : 'Unknown error occurred',
          {
            endpoint: '/api/v1/reviews/{review_id}',
            method: 'GET',
            timestamp: Date.now()
          },
          error
        )
      }
    })
)

/**
 * Create Review Response
 * @generated from POST /api/v1/reviews/{review_id}/response
 * Features: Input validation, revalidation, error handling
 */
const CreateReviewResponseApiV1ReviewsReviewIdResponsePostInputSchema = z.object({ body: CreateReviewResponseApiV1ReviewsReviewIdResponsePostRequestSchema, params: CreateReviewResponseApiV1ReviewsReviewIdResponsePostParamsSchema })

export const createReviewResponseApiV1ReviewsReviewIdResponsePost = authActionClient
  .metadata({
    name: "create-review-response-api-v1-reviews-review-id-response-post",
    requiresAuth: true
  })
  .schema(CreateReviewResponseApiV1ReviewsReviewIdResponsePostInputSchema)
  .action(async ({ parsedInput, ctx }: { parsedInput: z.infer<typeof CreateReviewResponseApiV1ReviewsReviewIdResponsePostInputSchema>; ctx: { user?: any; ratelimit?: { remaining: number } } }) => {
    const startTime = Date.now()
    
    try {
      // Validate and sanitize input payload
      const { body, params } = await validateAndSanitizeInput(z.object({
        body: CreateReviewResponseApiV1ReviewsReviewIdResponsePostRequestSchema,
        params: CreateReviewResponseApiV1ReviewsReviewIdResponsePostParamsSchema
      }), parsedInput)
      const validatedBody = body
      const validatedParams = params as z.infer<typeof CreateReviewResponseApiV1ReviewsReviewIdResponsePostParamsSchema>

      // Execute API call with enhanced configuration
      const response = await apiClient.reviews.createReviewResponseApiV1ReviewsReviewIdResponsePost({params: {
path: {
        review_id: Number(validatedParams.path.review_id)
      }
    },
body: validatedBody,
        config: {
          timeout: 30000,
          retries: 3,
          validateResponse: false,
          responseSchema: CreateReviewResponseApiV1ReviewsReviewIdResponsePostResponseSchema
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
      updateTag('Reviews')
      console.log('Updated tag: Reviews')


      // Log successful execution
      const duration = Date.now() - startTime
      await logActionExecution('createReviewResponseApiV1ReviewsReviewIdResponsePost', true, duration, {
        method: 'POST',
        path: '/api/v1/reviews/{review_id}/response'
      })
      
      return response.data
    } catch (error) {

      const duration = Date.now() - startTime

      // Enhanced error logging
      await logActionExecution('createReviewResponseApiV1ReviewsReviewIdResponsePost', false, duration, {
        method: 'POST',
        path: '/api/v1/reviews/{review_id}/response',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      
      // Throw enhanced error with context
      throw new ActionExecutionError(
        error instanceof Error ? error.message : 'Unknown error occurred',
        {
          endpoint: '/api/v1/reviews/{review_id}/response',
          method: 'POST',
          timestamp: Date.now()
        },
        error
      )
    }
  })

/**
 * Mark Review Helpful
 * @generated from POST /api/v1/reviews/{review_id}/helpful
 * Features: Input validation, revalidation, error handling
 */
const MarkReviewHelpfulApiV1ReviewsReviewIdHelpfulPostInputSchema = z.object({ body: MarkReviewHelpfulApiV1ReviewsReviewIdHelpfulPostRequestSchema, params: MarkReviewHelpfulApiV1ReviewsReviewIdHelpfulPostParamsSchema })

export const markReviewHelpfulApiV1ReviewsReviewIdHelpfulPost = authActionClient
  .metadata({
    name: "mark-review-helpful-api-v1-reviews-review-id-helpful-post",
    requiresAuth: true
  })
  .schema(MarkReviewHelpfulApiV1ReviewsReviewIdHelpfulPostInputSchema)
  .action(async ({ parsedInput, ctx }: { parsedInput: z.infer<typeof MarkReviewHelpfulApiV1ReviewsReviewIdHelpfulPostInputSchema>; ctx: { user?: any; ratelimit?: { remaining: number } } }) => {
    const startTime = Date.now()
    
    try {
      // Validate and sanitize input payload
      const { body, params } = await validateAndSanitizeInput(z.object({
        body: MarkReviewHelpfulApiV1ReviewsReviewIdHelpfulPostRequestSchema,
        params: MarkReviewHelpfulApiV1ReviewsReviewIdHelpfulPostParamsSchema
      }), parsedInput)
      const validatedBody = body
      const validatedParams = params as z.infer<typeof MarkReviewHelpfulApiV1ReviewsReviewIdHelpfulPostParamsSchema>

      // Execute API call with enhanced configuration
      const response = await apiClient.reviews.markReviewHelpfulApiV1ReviewsReviewIdHelpfulPost({params: {
path: {
        review_id: Number(validatedParams.path.review_id)
      }
    },
body: validatedBody,
        config: {
          timeout: 30000,
          retries: 3,
          validateResponse: false,
          responseSchema: MarkReviewHelpfulApiV1ReviewsReviewIdHelpfulPostResponseSchema
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
      updateTag('Reviews')
      console.log('Updated tag: Reviews')


      // Log successful execution
      const duration = Date.now() - startTime
      await logActionExecution('markReviewHelpfulApiV1ReviewsReviewIdHelpfulPost', true, duration, {
        method: 'POST',
        path: '/api/v1/reviews/{review_id}/helpful'
      })
      
      return response.data
    } catch (error) {

      const duration = Date.now() - startTime

      // Enhanced error logging
      await logActionExecution('markReviewHelpfulApiV1ReviewsReviewIdHelpfulPost', false, duration, {
        method: 'POST',
        path: '/api/v1/reviews/{review_id}/helpful',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      
      // Throw enhanced error with context
      throw new ActionExecutionError(
        error instanceof Error ? error.message : 'Unknown error occurred',
        {
          endpoint: '/api/v1/reviews/{review_id}/helpful',
          method: 'POST',
          timestamp: Date.now()
        },
        error
      )
    }
  })