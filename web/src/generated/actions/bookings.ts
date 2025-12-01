'use server'
import { z } from 'zod'
import { cache } from 'react'
import { updateTag } from 'next/cache'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { apiClient } from '@/generated/client'
import { actionClientWithMeta, authActionClient, ActionError } from '@/generated/lib/safe-action'
import {
  ListBookingsApiV1BookingsGetParamsSchema,
  ListBookingsApiV1BookingsGetResponseSchema,
  CreateBookingApiV1BookingsPostRequestSchema,
  CreateBookingApiV1BookingsPostResponseSchema,
  GetBookingApiV1BookingsBookingIdGetParamsSchema,
  GetBookingApiV1BookingsBookingIdGetResponseSchema,
  CancelBookingApiV1BookingsBookingIdCancelPostRequestSchema,
  CancelBookingApiV1BookingsBookingIdCancelPostParamsSchema,
  CancelBookingApiV1BookingsBookingIdCancelPostResponseSchema,
  ConfirmBookingApiV1BookingsBookingIdConfirmPostParamsSchema,
  ConfirmBookingApiV1BookingsBookingIdConfirmPostResponseSchema,
  ListHostBookingsApiV1BookingsHostListingsGetParamsSchema,
  ListHostBookingsApiV1BookingsHostListingsGetResponseSchema
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
 * List Bookings
 * @generated from GET /api/v1/bookings
 * Features: React cache, input validation, error handling
 */
export const listBookingsApiV1BookingsGet = cache(
  authActionClient
    .metadata({
      name: "list-bookings-api-v1-bookings-get",
      requiresAuth: true
    })
    .schema(ListBookingsApiV1BookingsGetParamsSchema)
    .action(async ({ parsedInput, ctx }: { parsedInput: z.infer<typeof ListBookingsApiV1BookingsGetParamsSchema>; ctx: { user?: any; ratelimit?: { remaining: number } } }) => {
      const startTime = Date.now()
      
      try {
      // Validate and sanitize parameters
      const validatedParams = await validateAndSanitizeInput(ListBookingsApiV1BookingsGetParamsSchema, parsedInput) as z.infer<typeof ListBookingsApiV1BookingsGetParamsSchema>

        // Execute API call with enhanced error handling
        const response = await apiClient.bookings.listBookingsApiV1BookingsGet({params: {
query: validatedParams.query,
    },
          config: {
            timeout: 30000,
            retries: 3,
            validateResponse: false,
            responseSchema: ListBookingsApiV1BookingsGetResponseSchema
          }
        })
        

        // Log successful execution
        const duration = Date.now() - startTime
        await logActionExecution('listBookingsApiV1BookingsGet', true, duration, {
          method: 'GET',
          path: '/api/v1/bookings'
        })
        
        return response.data
      } catch (error) {

        const duration = Date.now() - startTime

        // Enhanced error logging
        await logActionExecution('listBookingsApiV1BookingsGet', false, duration, {
          method: 'GET',
          path: '/api/v1/bookings',
          error: error instanceof Error ? error.message : 'Unknown error'
        })
        
        // Throw enhanced error with context
        throw new ActionExecutionError(
          error instanceof Error ? error.message : 'Unknown error occurred',
          {
            endpoint: '/api/v1/bookings',
            method: 'GET',
            timestamp: Date.now()
          },
          error
        )
      }
    })
)

/**
 * Create Booking
 * @generated from POST /api/v1/bookings
 * Features: Input validation, revalidation, error handling
 */
export const createBookingApiV1BookingsPost = authActionClient
  .metadata({
    name: "create-booking-api-v1-bookings-post",
    requiresAuth: true
  })
  .schema(CreateBookingApiV1BookingsPostRequestSchema)
  .action(async ({ parsedInput, ctx }: { parsedInput: z.infer<typeof CreateBookingApiV1BookingsPostRequestSchema>; ctx: { user?: any; ratelimit?: { remaining: number } } }) => {
    const startTime = Date.now()
    
    try {
      // Validate and sanitize request body
      const validatedBody = await validateAndSanitizeInput(CreateBookingApiV1BookingsPostRequestSchema, parsedInput)

      // Execute API call with enhanced configuration
      const response = await apiClient.bookings.createBookingApiV1BookingsPost({body: validatedBody,
        config: {
          timeout: 30000,
          retries: 3,
          validateResponse: false,
          responseSchema: CreateBookingApiV1BookingsPostResponseSchema
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
      updateTag('Bookings')
      console.log('Updated tag: Bookings')


      // Log successful execution
      const duration = Date.now() - startTime
      await logActionExecution('createBookingApiV1BookingsPost', true, duration, {
        method: 'POST',
        path: '/api/v1/bookings'
      })
      
      return response.data
    } catch (error) {

      const duration = Date.now() - startTime

      // Enhanced error logging
      await logActionExecution('createBookingApiV1BookingsPost', false, duration, {
        method: 'POST',
        path: '/api/v1/bookings',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      
      // Throw enhanced error with context
      throw new ActionExecutionError(
        error instanceof Error ? error.message : 'Unknown error occurred',
        {
          endpoint: '/api/v1/bookings',
          method: 'POST',
          timestamp: Date.now()
        },
        error
      )
    }
  })

/**
 * Get Booking
 * @generated from GET /api/v1/bookings/{booking_id}
 * Features: React cache, input validation, error handling
 */
export const getBookingApiV1BookingsBookingIdGet = cache(
  authActionClient
    .metadata({
      name: "get-booking-api-v1-bookings-booking-id-get",
      requiresAuth: true
    })
    .schema(GetBookingApiV1BookingsBookingIdGetParamsSchema)
    .action(async ({ parsedInput, ctx }: { parsedInput: z.infer<typeof GetBookingApiV1BookingsBookingIdGetParamsSchema>; ctx: { user?: any; ratelimit?: { remaining: number } } }) => {
      const startTime = Date.now()
      
      try {
      // Validate and sanitize parameters
      const validatedParams = await validateAndSanitizeInput(GetBookingApiV1BookingsBookingIdGetParamsSchema, parsedInput) as z.infer<typeof GetBookingApiV1BookingsBookingIdGetParamsSchema>

        // Execute API call with enhanced error handling
        const response = await apiClient.bookings.getBookingApiV1BookingsBookingIdGet({params: {
path: {
        booking_id: validatedParams.path.booking_id
      }
    },
          config: {
            timeout: 30000,
            retries: 3,
            validateResponse: false,
            responseSchema: GetBookingApiV1BookingsBookingIdGetResponseSchema
          }
        })
        

        // Log successful execution
        const duration = Date.now() - startTime
        await logActionExecution('getBookingApiV1BookingsBookingIdGet', true, duration, {
          method: 'GET',
          path: '/api/v1/bookings/{booking_id}'
        })
        
        return response.data
      } catch (error) {

        const duration = Date.now() - startTime

        // Enhanced error logging
        await logActionExecution('getBookingApiV1BookingsBookingIdGet', false, duration, {
          method: 'GET',
          path: '/api/v1/bookings/{booking_id}',
          error: error instanceof Error ? error.message : 'Unknown error'
        })
        
        // Throw enhanced error with context
        throw new ActionExecutionError(
          error instanceof Error ? error.message : 'Unknown error occurred',
          {
            endpoint: '/api/v1/bookings/{booking_id}',
            method: 'GET',
            timestamp: Date.now()
          },
          error
        )
      }
    })
)

/**
 * Cancel Booking
 * @generated from POST /api/v1/bookings/{booking_id}/cancel
 * Features: Input validation, revalidation, error handling
 */
const CancelBookingApiV1BookingsBookingIdCancelPostInputSchema = z.object({ body: CancelBookingApiV1BookingsBookingIdCancelPostRequestSchema, params: CancelBookingApiV1BookingsBookingIdCancelPostParamsSchema })

export const cancelBookingApiV1BookingsBookingIdCancelPost = authActionClient
  .metadata({
    name: "cancel-booking-api-v1-bookings-booking-id-cancel-post",
    requiresAuth: true
  })
  .schema(CancelBookingApiV1BookingsBookingIdCancelPostInputSchema)
  .action(async ({ parsedInput, ctx }: { parsedInput: z.infer<typeof CancelBookingApiV1BookingsBookingIdCancelPostInputSchema>; ctx: { user?: any; ratelimit?: { remaining: number } } }) => {
    const startTime = Date.now()
    
    try {
      // Validate and sanitize input payload
      const { body, params } = await validateAndSanitizeInput(z.object({
        body: CancelBookingApiV1BookingsBookingIdCancelPostRequestSchema,
        params: CancelBookingApiV1BookingsBookingIdCancelPostParamsSchema
      }), parsedInput)
      const validatedBody = body
      const validatedParams = params as z.infer<typeof CancelBookingApiV1BookingsBookingIdCancelPostParamsSchema>

      // Execute API call with enhanced configuration
      const response = await apiClient.bookings.cancelBookingApiV1BookingsBookingIdCancelPost({params: {
path: {
        booking_id: validatedParams.path.booking_id
      }
    },
body: validatedBody,
        config: {
          timeout: 30000,
          retries: 3,
          validateResponse: false,
          responseSchema: CancelBookingApiV1BookingsBookingIdCancelPostResponseSchema
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
      updateTag('Bookings')
      console.log('Updated tag: Bookings')


      // Log successful execution
      const duration = Date.now() - startTime
      await logActionExecution('cancelBookingApiV1BookingsBookingIdCancelPost', true, duration, {
        method: 'POST',
        path: '/api/v1/bookings/{booking_id}/cancel'
      })
      
      return response.data
    } catch (error) {

      const duration = Date.now() - startTime

      // Enhanced error logging
      await logActionExecution('cancelBookingApiV1BookingsBookingIdCancelPost', false, duration, {
        method: 'POST',
        path: '/api/v1/bookings/{booking_id}/cancel',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      
      // Throw enhanced error with context
      throw new ActionExecutionError(
        error instanceof Error ? error.message : 'Unknown error occurred',
        {
          endpoint: '/api/v1/bookings/{booking_id}/cancel',
          method: 'POST',
          timestamp: Date.now()
        },
        error
      )
    }
  })

/**
 * Confirm Booking
 * @generated from POST /api/v1/bookings/{booking_id}/confirm
 * Features: Input validation, revalidation, error handling
 */
export const confirmBookingApiV1BookingsBookingIdConfirmPost = authActionClient
  .metadata({
    name: "confirm-booking-api-v1-bookings-booking-id-confirm-post",
    requiresAuth: true
  })
  .schema(ConfirmBookingApiV1BookingsBookingIdConfirmPostParamsSchema)
  .action(async ({ parsedInput, ctx }: { parsedInput: z.infer<typeof ConfirmBookingApiV1BookingsBookingIdConfirmPostParamsSchema>; ctx: { user?: any; ratelimit?: { remaining: number } } }) => {
    const startTime = Date.now()
    
    try {
      // Validate and sanitize parameters
      const validatedParams = await validateAndSanitizeInput(ConfirmBookingApiV1BookingsBookingIdConfirmPostParamsSchema, parsedInput) as z.infer<typeof ConfirmBookingApiV1BookingsBookingIdConfirmPostParamsSchema>

      // Execute API call with enhanced configuration
      const response = await apiClient.bookings.confirmBookingApiV1BookingsBookingIdConfirmPost({params: {
path: {
        booking_id: validatedParams.path.booking_id
      }
    },
        config: {
          timeout: 30000,
          retries: 3,
          validateResponse: false,
          responseSchema: ConfirmBookingApiV1BookingsBookingIdConfirmPostResponseSchema
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
      updateTag('Bookings')
      console.log('Updated tag: Bookings')


      // Log successful execution
      const duration = Date.now() - startTime
      await logActionExecution('confirmBookingApiV1BookingsBookingIdConfirmPost', true, duration, {
        method: 'POST',
        path: '/api/v1/bookings/{booking_id}/confirm'
      })
      
      return response.data
    } catch (error) {

      const duration = Date.now() - startTime

      // Enhanced error logging
      await logActionExecution('confirmBookingApiV1BookingsBookingIdConfirmPost', false, duration, {
        method: 'POST',
        path: '/api/v1/bookings/{booking_id}/confirm',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      
      // Throw enhanced error with context
      throw new ActionExecutionError(
        error instanceof Error ? error.message : 'Unknown error occurred',
        {
          endpoint: '/api/v1/bookings/{booking_id}/confirm',
          method: 'POST',
          timestamp: Date.now()
        },
        error
      )
    }
  })

/**
 * List Host Bookings
 * @generated from GET /api/v1/bookings/host/listings
 * Features: React cache, input validation, error handling
 */
export const listHostBookingsApiV1BookingsHostListingsGet = cache(
  authActionClient
    .metadata({
      name: "list-host-bookings-api-v1-bookings-host-listings-get",
      requiresAuth: true
    })
    .schema(ListHostBookingsApiV1BookingsHostListingsGetParamsSchema)
    .action(async ({ parsedInput, ctx }: { parsedInput: z.infer<typeof ListHostBookingsApiV1BookingsHostListingsGetParamsSchema>; ctx: { user?: any; ratelimit?: { remaining: number } } }) => {
      const startTime = Date.now()
      
      try {
      // Validate and sanitize parameters
      const validatedParams = await validateAndSanitizeInput(ListHostBookingsApiV1BookingsHostListingsGetParamsSchema, parsedInput) as z.infer<typeof ListHostBookingsApiV1BookingsHostListingsGetParamsSchema>

        // Execute API call with enhanced error handling
        const response = await apiClient.bookings.listHostBookingsApiV1BookingsHostListingsGet({params: {
query: validatedParams.query,
    },
          config: {
            timeout: 30000,
            retries: 3,
            validateResponse: false,
            responseSchema: ListHostBookingsApiV1BookingsHostListingsGetResponseSchema
          }
        })
        

        // Log successful execution
        const duration = Date.now() - startTime
        await logActionExecution('listHostBookingsApiV1BookingsHostListingsGet', true, duration, {
          method: 'GET',
          path: '/api/v1/bookings/host/listings'
        })
        
        return response.data
      } catch (error) {

        const duration = Date.now() - startTime

        // Enhanced error logging
        await logActionExecution('listHostBookingsApiV1BookingsHostListingsGet', false, duration, {
          method: 'GET',
          path: '/api/v1/bookings/host/listings',
          error: error instanceof Error ? error.message : 'Unknown error'
        })
        
        // Throw enhanced error with context
        throw new ActionExecutionError(
          error instanceof Error ? error.message : 'Unknown error occurred',
          {
            endpoint: '/api/v1/bookings/host/listings',
            method: 'GET',
            timestamp: Date.now()
          },
          error
        )
      }
    })
)