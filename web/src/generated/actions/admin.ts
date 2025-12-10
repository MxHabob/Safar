'use server'
import { z } from 'zod'
import { cache } from 'react'
import { updateTag } from 'next/cache'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { apiClient } from '@/generated/client'
import { actionClientWithMeta, authActionClient, ActionError } from '@/generated/lib/safe-action'
import {
  ListUsersApiV1AdminUsersGetParamsSchema,
  ListUsersApiV1AdminUsersGetResponseSchema,
  GetUserApiV1AdminUsersUserIdGetParamsSchema,
  GetUserApiV1AdminUsersUserIdGetResponseSchema,
  UpdateUserApiV1AdminUsersUserIdPutRequestSchema,
  UpdateUserApiV1AdminUsersUserIdPutParamsSchema,
  UpdateUserApiV1AdminUsersUserIdPutResponseSchema,
  SuspendUserApiV1AdminUsersUserIdSuspendPostParamsSchema,
  SuspendUserApiV1AdminUsersUserIdSuspendPostResponseSchema,
  ActivateUserApiV1AdminUsersUserIdActivatePostParamsSchema,
  ActivateUserApiV1AdminUsersUserIdActivatePostResponseSchema,
  GetUserStatsApiV1AdminUsersStatsGetResponseSchema,
  GetDashboardMetricsApiV1AdminDashboardMetricsGetParamsSchema,
  GetDashboardMetricsApiV1AdminDashboardMetricsGetResponseSchema,
  GetBookingTrendsApiV1AdminDashboardBookingTrendsGetParamsSchema,
  GetBookingTrendsApiV1AdminDashboardBookingTrendsGetResponseSchema,
  GetPopularDestinationsApiV1AdminDashboardPopularDestinationsGetParamsSchema,
  GetPopularDestinationsApiV1AdminDashboardPopularDestinationsGetResponseSchema,
  ListListingsApiV1AdminListingsGetParamsSchema,
  ListListingsApiV1AdminListingsGetResponseSchema,
  GetListingApiV1AdminListingsListingIdGetParamsSchema,
  GetListingApiV1AdminListingsListingIdGetResponseSchema,
  GetListingStatsApiV1AdminListingsStatsGetResponseSchema,
  ListBookingsApiV1AdminBookingsGetParamsSchema,
  ListBookingsApiV1AdminBookingsGetResponseSchema,
  GetBookingApiV1AdminBookingsBookingIdGetParamsSchema,
  GetBookingApiV1AdminBookingsBookingIdGetResponseSchema,
  GetBookingStatsApiV1AdminBookingsStatsGetResponseSchema,
  ListPaymentsApiV1AdminPaymentsGetParamsSchema,
  ListPaymentsApiV1AdminPaymentsGetResponseSchema,
  GetPaymentApiV1AdminPaymentsPaymentIdGetParamsSchema,
  GetPaymentApiV1AdminPaymentsPaymentIdGetResponseSchema,
  GetPaymentStatsApiV1AdminPaymentsStatsGetResponseSchema
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
 * List Users
 * @generated from GET /api/v1/admin/users
 * Features: React cache, input validation, error handling
 */
export const listUsersApiV1AdminUsersGet = cache(
  authActionClient
    .metadata({
      name: "list-users-api-v1-admin-users-get",
      requiresAuth: true
    })
    .schema(ListUsersApiV1AdminUsersGetParamsSchema)
    .action(async ({ parsedInput, ctx }: { parsedInput: z.infer<typeof ListUsersApiV1AdminUsersGetParamsSchema>; ctx: { user?: any; ratelimit?: { remaining: number } } }) => {
      const startTime = Date.now()
      
      try {
      // Validate and sanitize parameters
      const validatedParams = await validateAndSanitizeInput(ListUsersApiV1AdminUsersGetParamsSchema, parsedInput) as z.infer<typeof ListUsersApiV1AdminUsersGetParamsSchema>

        // Execute API call with enhanced error handling
        const response = await apiClient.admin.listUsersApiV1AdminUsersGet({params: {
query: validatedParams.query,
    },
          config: {
            timeout: 30000,
            retries: 3,
            validateResponse: false,
            responseSchema: ListUsersApiV1AdminUsersGetResponseSchema
          }
        })
        

        // Log successful execution
        const duration = Date.now() - startTime
        await logActionExecution('listUsersApiV1AdminUsersGet', true, duration, {
          method: 'GET',
          path: '/api/v1/admin/users'
        })
        
        return response.data
      } catch (error) {

        const duration = Date.now() - startTime

        // Enhanced error logging
        await logActionExecution('listUsersApiV1AdminUsersGet', false, duration, {
          method: 'GET',
          path: '/api/v1/admin/users',
          error: error instanceof Error ? error.message : 'Unknown error'
        })
        
        // Throw enhanced error with context
        throw new ActionExecutionError(
          error instanceof Error ? error.message : 'Unknown error occurred',
          {
            endpoint: '/api/v1/admin/users',
            method: 'GET',
            timestamp: Date.now()
          },
          error
        )
      }
    })
)

/**
 * Get User
 * @generated from GET /api/v1/admin/users/{user_id}
 * Features: React cache, input validation, error handling
 */
export const getUserApiV1AdminUsersUserIdGet = cache(
  authActionClient
    .metadata({
      name: "get-user-api-v1-admin-users-user-id-get",
      requiresAuth: true
    })
    .schema(GetUserApiV1AdminUsersUserIdGetParamsSchema)
    .action(async ({ parsedInput, ctx }: { parsedInput: z.infer<typeof GetUserApiV1AdminUsersUserIdGetParamsSchema>; ctx: { user?: any; ratelimit?: { remaining: number } } }) => {
      const startTime = Date.now()
      
      try {
      // Validate and sanitize parameters
      const validatedParams = await validateAndSanitizeInput(GetUserApiV1AdminUsersUserIdGetParamsSchema, parsedInput) as z.infer<typeof GetUserApiV1AdminUsersUserIdGetParamsSchema>

        // Execute API call with enhanced error handling
        const response = await apiClient.admin.getUserApiV1AdminUsersUserIdGet({params: {
path: {
        user_id: validatedParams.path.user_id
      }
    },
          config: {
            timeout: 30000,
            retries: 3,
            validateResponse: false,
            responseSchema: GetUserApiV1AdminUsersUserIdGetResponseSchema
          }
        })
        

        // Log successful execution
        const duration = Date.now() - startTime
        await logActionExecution('getUserApiV1AdminUsersUserIdGet', true, duration, {
          method: 'GET',
          path: '/api/v1/admin/users/{user_id}'
        })
        
        return response.data
      } catch (error) {

        const duration = Date.now() - startTime

        // Enhanced error logging
        await logActionExecution('getUserApiV1AdminUsersUserIdGet', false, duration, {
          method: 'GET',
          path: '/api/v1/admin/users/{user_id}',
          error: error instanceof Error ? error.message : 'Unknown error'
        })
        
        // Throw enhanced error with context
        throw new ActionExecutionError(
          error instanceof Error ? error.message : 'Unknown error occurred',
          {
            endpoint: '/api/v1/admin/users/{user_id}',
            method: 'GET',
            timestamp: Date.now()
          },
          error
        )
      }
    })
)

/**
 * Update User
 * @generated from PUT /api/v1/admin/users/{user_id}
 * Features: Input validation, revalidation, error handling
 */
const UpdateUserApiV1AdminUsersUserIdPutInputSchema = z.object({ body: UpdateUserApiV1AdminUsersUserIdPutRequestSchema, params: UpdateUserApiV1AdminUsersUserIdPutParamsSchema })

export const updateUserApiV1AdminUsersUserIdPut = authActionClient
  .metadata({
    name: "update-user-api-v1-admin-users-user-id-put",
    requiresAuth: true
  })
  .schema(UpdateUserApiV1AdminUsersUserIdPutInputSchema)
  .action(async ({ parsedInput, ctx }: { parsedInput: z.infer<typeof UpdateUserApiV1AdminUsersUserIdPutInputSchema>; ctx: { user?: any; ratelimit?: { remaining: number } } }) => {
    const startTime = Date.now()
    
    try {
      // Validate and sanitize input payload
      const { body, params } = await validateAndSanitizeInput(z.object({
        body: UpdateUserApiV1AdminUsersUserIdPutRequestSchema,
        params: UpdateUserApiV1AdminUsersUserIdPutParamsSchema
      }), parsedInput)
      const validatedBody = body
      const validatedParams = params as z.infer<typeof UpdateUserApiV1AdminUsersUserIdPutParamsSchema>

      // Execute API call with enhanced configuration
      const response = await apiClient.admin.updateUserApiV1AdminUsersUserIdPut({params: {
path: {
        user_id: validatedParams.path.user_id
      }
    },
body: validatedBody,
        config: {
          timeout: 30000,
          retries: 3,
          validateResponse: false,
          responseSchema: UpdateUserApiV1AdminUsersUserIdPutResponseSchema
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
      updateTag('Admin')
      console.log('Updated tag: Admin')


      // Log successful execution
      const duration = Date.now() - startTime
      await logActionExecution('updateUserApiV1AdminUsersUserIdPut', true, duration, {
        method: 'PUT',
        path: '/api/v1/admin/users/{user_id}'
      })
      
      return response.data
    } catch (error) {

      const duration = Date.now() - startTime

      // Enhanced error logging
      await logActionExecution('updateUserApiV1AdminUsersUserIdPut', false, duration, {
        method: 'PUT',
        path: '/api/v1/admin/users/{user_id}',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      
      // Throw enhanced error with context
      throw new ActionExecutionError(
        error instanceof Error ? error.message : 'Unknown error occurred',
        {
          endpoint: '/api/v1/admin/users/{user_id}',
          method: 'PUT',
          timestamp: Date.now()
        },
        error
      )
    }
  })

/**
 * Suspend User
 * @generated from POST /api/v1/admin/users/{user_id}/suspend
 * Features: Input validation, revalidation, error handling
 */
export const suspendUserApiV1AdminUsersUserIdSuspendPost = authActionClient
  .metadata({
    name: "suspend-user-api-v1-admin-users-user-id-suspend-post",
    requiresAuth: true
  })
  .schema(SuspendUserApiV1AdminUsersUserIdSuspendPostParamsSchema)
  .action(async ({ parsedInput, ctx }: { parsedInput: z.infer<typeof SuspendUserApiV1AdminUsersUserIdSuspendPostParamsSchema>; ctx: { user?: any; ratelimit?: { remaining: number } } }) => {
    const startTime = Date.now()
    
    try {
      // Validate and sanitize parameters
      const validatedParams = await validateAndSanitizeInput(SuspendUserApiV1AdminUsersUserIdSuspendPostParamsSchema, parsedInput) as z.infer<typeof SuspendUserApiV1AdminUsersUserIdSuspendPostParamsSchema>

      // Execute API call with enhanced configuration
      const response = await apiClient.admin.suspendUserApiV1AdminUsersUserIdSuspendPost({params: {
path: {
        user_id: validatedParams.path.user_id
      }
    },
        config: {
          timeout: 30000,
          retries: 3,
          validateResponse: false,
          responseSchema: SuspendUserApiV1AdminUsersUserIdSuspendPostResponseSchema
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
      updateTag('Admin')
      console.log('Updated tag: Admin')


      // Log successful execution
      const duration = Date.now() - startTime
      await logActionExecution('suspendUserApiV1AdminUsersUserIdSuspendPost', true, duration, {
        method: 'POST',
        path: '/api/v1/admin/users/{user_id}/suspend'
      })
      
      return response.data
    } catch (error) {

      const duration = Date.now() - startTime

      // Enhanced error logging
      await logActionExecution('suspendUserApiV1AdminUsersUserIdSuspendPost', false, duration, {
        method: 'POST',
        path: '/api/v1/admin/users/{user_id}/suspend',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      
      // Throw enhanced error with context
      throw new ActionExecutionError(
        error instanceof Error ? error.message : 'Unknown error occurred',
        {
          endpoint: '/api/v1/admin/users/{user_id}/suspend',
          method: 'POST',
          timestamp: Date.now()
        },
        error
      )
    }
  })

/**
 * Activate User
 * @generated from POST /api/v1/admin/users/{user_id}/activate
 * Features: Input validation, revalidation, error handling
 */
export const activateUserApiV1AdminUsersUserIdActivatePost = authActionClient
  .metadata({
    name: "activate-user-api-v1-admin-users-user-id-activate-post",
    requiresAuth: true
  })
  .schema(ActivateUserApiV1AdminUsersUserIdActivatePostParamsSchema)
  .action(async ({ parsedInput, ctx }: { parsedInput: z.infer<typeof ActivateUserApiV1AdminUsersUserIdActivatePostParamsSchema>; ctx: { user?: any; ratelimit?: { remaining: number } } }) => {
    const startTime = Date.now()
    
    try {
      // Validate and sanitize parameters
      const validatedParams = await validateAndSanitizeInput(ActivateUserApiV1AdminUsersUserIdActivatePostParamsSchema, parsedInput) as z.infer<typeof ActivateUserApiV1AdminUsersUserIdActivatePostParamsSchema>

      // Execute API call with enhanced configuration
      const response = await apiClient.admin.activateUserApiV1AdminUsersUserIdActivatePost({params: {
path: {
        user_id: validatedParams.path.user_id
      }
    },
        config: {
          timeout: 30000,
          retries: 3,
          validateResponse: false,
          responseSchema: ActivateUserApiV1AdminUsersUserIdActivatePostResponseSchema
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
      updateTag('Admin')
      console.log('Updated tag: Admin')


      // Log successful execution
      const duration = Date.now() - startTime
      await logActionExecution('activateUserApiV1AdminUsersUserIdActivatePost', true, duration, {
        method: 'POST',
        path: '/api/v1/admin/users/{user_id}/activate'
      })
      
      return response.data
    } catch (error) {

      const duration = Date.now() - startTime

      // Enhanced error logging
      await logActionExecution('activateUserApiV1AdminUsersUserIdActivatePost', false, duration, {
        method: 'POST',
        path: '/api/v1/admin/users/{user_id}/activate',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      
      // Throw enhanced error with context
      throw new ActionExecutionError(
        error instanceof Error ? error.message : 'Unknown error occurred',
        {
          endpoint: '/api/v1/admin/users/{user_id}/activate',
          method: 'POST',
          timestamp: Date.now()
        },
        error
      )
    }
  })

/**
 * Get User Stats
 * @generated from GET /api/v1/admin/users/stats
 * Features: React cache, input validation, error handling
 */
export const getUserStatsApiV1AdminUsersStatsGet = cache(
  authActionClient
    .metadata({
      name: "get-user-stats-api-v1-admin-users-stats-get",
      requiresAuth: true
    })
    .schema(z.void())
    .action(async ({ parsedInput, ctx }: { parsedInput: void; ctx: { user?: any; ratelimit?: { remaining: number } } }) => {
      const startTime = Date.now()
      
      try {

        // Execute API call with enhanced error handling
        const response = await apiClient.admin.getUserStatsApiV1AdminUsersStatsGet({
          config: {
            timeout: 30000,
            retries: 3,
            validateResponse: false,
            responseSchema: GetUserStatsApiV1AdminUsersStatsGetResponseSchema
          }
        })
        

        // Log successful execution
        const duration = Date.now() - startTime
        await logActionExecution('getUserStatsApiV1AdminUsersStatsGet', true, duration, {
          method: 'GET',
          path: '/api/v1/admin/users/stats'
        })
        
        return response.data
      } catch (error) {

        const duration = Date.now() - startTime

        // Enhanced error logging
        await logActionExecution('getUserStatsApiV1AdminUsersStatsGet', false, duration, {
          method: 'GET',
          path: '/api/v1/admin/users/stats',
          error: error instanceof Error ? error.message : 'Unknown error'
        })
        
        // Throw enhanced error with context
        throw new ActionExecutionError(
          error instanceof Error ? error.message : 'Unknown error occurred',
          {
            endpoint: '/api/v1/admin/users/stats',
            method: 'GET',
            timestamp: Date.now()
          },
          error
        )
      }
    })
)

/**
 * Get Dashboard Metrics
 * @generated from GET /api/v1/admin/dashboard/metrics
 * Features: React cache, input validation, error handling
 */
export const getDashboardMetricsApiV1AdminDashboardMetricsGet = cache(
  authActionClient
    .metadata({
      name: "get-dashboard-metrics-api-v1-admin-dashboard-metrics-get",
      requiresAuth: true
    })
    .schema(GetDashboardMetricsApiV1AdminDashboardMetricsGetParamsSchema)
    .action(async ({ parsedInput, ctx }: { parsedInput: z.infer<typeof GetDashboardMetricsApiV1AdminDashboardMetricsGetParamsSchema>; ctx: { user?: any; ratelimit?: { remaining: number } } }) => {
      const startTime = Date.now()
      
      try {
      // Validate and sanitize parameters
      const validatedParams = await validateAndSanitizeInput(GetDashboardMetricsApiV1AdminDashboardMetricsGetParamsSchema, parsedInput) as z.infer<typeof GetDashboardMetricsApiV1AdminDashboardMetricsGetParamsSchema>

        // Execute API call with enhanced error handling
        const response = await apiClient.admin.getDashboardMetricsApiV1AdminDashboardMetricsGet({params: {
query: validatedParams.query,
    },
          config: {
            timeout: 30000,
            retries: 3,
            validateResponse: false,
            responseSchema: GetDashboardMetricsApiV1AdminDashboardMetricsGetResponseSchema
          }
        })
        

        // Log successful execution
        const duration = Date.now() - startTime
        await logActionExecution('getDashboardMetricsApiV1AdminDashboardMetricsGet', true, duration, {
          method: 'GET',
          path: '/api/v1/admin/dashboard/metrics'
        })
        
        return response.data
      } catch (error) {

        const duration = Date.now() - startTime

        // Enhanced error logging
        await logActionExecution('getDashboardMetricsApiV1AdminDashboardMetricsGet', false, duration, {
          method: 'GET',
          path: '/api/v1/admin/dashboard/metrics',
          error: error instanceof Error ? error.message : 'Unknown error'
        })
        
        // Throw enhanced error with context
        throw new ActionExecutionError(
          error instanceof Error ? error.message : 'Unknown error occurred',
          {
            endpoint: '/api/v1/admin/dashboard/metrics',
            method: 'GET',
            timestamp: Date.now()
          },
          error
        )
      }
    })
)

/**
 * Get Booking Trends
 * @generated from GET /api/v1/admin/dashboard/booking-trends
 * Features: React cache, input validation, error handling
 */
export const getBookingTrendsApiV1AdminDashboardBookingTrendsGet = cache(
  authActionClient
    .metadata({
      name: "get-booking-trends-api-v1-admin-dashboard-booking-trends-get",
      requiresAuth: true
    })
    .schema(GetBookingTrendsApiV1AdminDashboardBookingTrendsGetParamsSchema)
    .action(async ({ parsedInput, ctx }: { parsedInput: z.infer<typeof GetBookingTrendsApiV1AdminDashboardBookingTrendsGetParamsSchema>; ctx: { user?: any; ratelimit?: { remaining: number } } }) => {
      const startTime = Date.now()
      
      try {
      // Validate and sanitize parameters
      const validatedParams = await validateAndSanitizeInput(GetBookingTrendsApiV1AdminDashboardBookingTrendsGetParamsSchema, parsedInput) as z.infer<typeof GetBookingTrendsApiV1AdminDashboardBookingTrendsGetParamsSchema>

        // Execute API call with enhanced error handling
        const response = await apiClient.admin.getBookingTrendsApiV1AdminDashboardBookingTrendsGet({params: {
query: validatedParams.query,
    },
          config: {
            timeout: 30000,
            retries: 3,
            validateResponse: false,
            responseSchema: GetBookingTrendsApiV1AdminDashboardBookingTrendsGetResponseSchema
          }
        })
        

        // Log successful execution
        const duration = Date.now() - startTime
        await logActionExecution('getBookingTrendsApiV1AdminDashboardBookingTrendsGet', true, duration, {
          method: 'GET',
          path: '/api/v1/admin/dashboard/booking-trends'
        })
        
        return response.data
      } catch (error) {

        const duration = Date.now() - startTime

        // Enhanced error logging
        await logActionExecution('getBookingTrendsApiV1AdminDashboardBookingTrendsGet', false, duration, {
          method: 'GET',
          path: '/api/v1/admin/dashboard/booking-trends',
          error: error instanceof Error ? error.message : 'Unknown error'
        })
        
        // Throw enhanced error with context
        throw new ActionExecutionError(
          error instanceof Error ? error.message : 'Unknown error occurred',
          {
            endpoint: '/api/v1/admin/dashboard/booking-trends',
            method: 'GET',
            timestamp: Date.now()
          },
          error
        )
      }
    })
)

/**
 * Get Popular Destinations
 * @generated from GET /api/v1/admin/dashboard/popular-destinations
 * Features: React cache, input validation, error handling
 */
export const getPopularDestinationsApiV1AdminDashboardPopularDestinationsGet = cache(
  authActionClient
    .metadata({
      name: "get-popular-destinations-api-v1-admin-dashboard-popular-destinations-get",
      requiresAuth: true
    })
    .schema(GetPopularDestinationsApiV1AdminDashboardPopularDestinationsGetParamsSchema)
    .action(async ({ parsedInput, ctx }: { parsedInput: z.infer<typeof GetPopularDestinationsApiV1AdminDashboardPopularDestinationsGetParamsSchema>; ctx: { user?: any; ratelimit?: { remaining: number } } }) => {
      const startTime = Date.now()
      
      try {
      // Validate and sanitize parameters
      const validatedParams = await validateAndSanitizeInput(GetPopularDestinationsApiV1AdminDashboardPopularDestinationsGetParamsSchema, parsedInput) as z.infer<typeof GetPopularDestinationsApiV1AdminDashboardPopularDestinationsGetParamsSchema>

        // Execute API call with enhanced error handling
        const response = await apiClient.admin.getPopularDestinationsApiV1AdminDashboardPopularDestinationsGet({params: {
query: validatedParams.query,
    },
          config: {
            timeout: 30000,
            retries: 3,
            validateResponse: false,
            responseSchema: GetPopularDestinationsApiV1AdminDashboardPopularDestinationsGetResponseSchema
          }
        })
        

        // Log successful execution
        const duration = Date.now() - startTime
        await logActionExecution('getPopularDestinationsApiV1AdminDashboardPopularDestinationsGet', true, duration, {
          method: 'GET',
          path: '/api/v1/admin/dashboard/popular-destinations'
        })
        
        return response.data
      } catch (error) {

        const duration = Date.now() - startTime

        // Enhanced error logging
        await logActionExecution('getPopularDestinationsApiV1AdminDashboardPopularDestinationsGet', false, duration, {
          method: 'GET',
          path: '/api/v1/admin/dashboard/popular-destinations',
          error: error instanceof Error ? error.message : 'Unknown error'
        })
        
        // Throw enhanced error with context
        throw new ActionExecutionError(
          error instanceof Error ? error.message : 'Unknown error occurred',
          {
            endpoint: '/api/v1/admin/dashboard/popular-destinations',
            method: 'GET',
            timestamp: Date.now()
          },
          error
        )
      }
    })
)

/**
 * List Listings
 * @generated from GET /api/v1/admin/listings
 * Features: React cache, input validation, error handling
 */
export const listListingsApiV1AdminListingsGet = cache(
  authActionClient
    .metadata({
      name: "list-listings-api-v1-admin-listings-get",
      requiresAuth: true
    })
    .schema(ListListingsApiV1AdminListingsGetParamsSchema)
    .action(async ({ parsedInput, ctx }: { parsedInput: z.infer<typeof ListListingsApiV1AdminListingsGetParamsSchema>; ctx: { user?: any; ratelimit?: { remaining: number } } }) => {
      const startTime = Date.now()
      
      try {
      // Validate and sanitize parameters
      const validatedParams = await validateAndSanitizeInput(ListListingsApiV1AdminListingsGetParamsSchema, parsedInput) as z.infer<typeof ListListingsApiV1AdminListingsGetParamsSchema>

        // Execute API call with enhanced error handling
        const response = await apiClient.admin.listListingsApiV1AdminListingsGet({params: {
query: validatedParams.query,
    },
          config: {
            timeout: 30000,
            retries: 3,
            validateResponse: false,
            responseSchema: ListListingsApiV1AdminListingsGetResponseSchema
          }
        })
        

        // Log successful execution
        const duration = Date.now() - startTime
        await logActionExecution('listListingsApiV1AdminListingsGet', true, duration, {
          method: 'GET',
          path: '/api/v1/admin/listings'
        })
        
        return response.data
      } catch (error) {

        const duration = Date.now() - startTime

        // Enhanced error logging
        await logActionExecution('listListingsApiV1AdminListingsGet', false, duration, {
          method: 'GET',
          path: '/api/v1/admin/listings',
          error: error instanceof Error ? error.message : 'Unknown error'
        })
        
        // Throw enhanced error with context
        throw new ActionExecutionError(
          error instanceof Error ? error.message : 'Unknown error occurred',
          {
            endpoint: '/api/v1/admin/listings',
            method: 'GET',
            timestamp: Date.now()
          },
          error
        )
      }
    })
)

/**
 * Get Listing
 * @generated from GET /api/v1/admin/listings/{listing_id}
 * Features: React cache, input validation, error handling
 */
export const getListingApiV1AdminListingsListingIdGet = cache(
  authActionClient
    .metadata({
      name: "get-listing-api-v1-admin-listings-listing-id-get",
      requiresAuth: true
    })
    .schema(GetListingApiV1AdminListingsListingIdGetParamsSchema)
    .action(async ({ parsedInput, ctx }: { parsedInput: z.infer<typeof GetListingApiV1AdminListingsListingIdGetParamsSchema>; ctx: { user?: any; ratelimit?: { remaining: number } } }) => {
      const startTime = Date.now()
      
      try {
      // Validate and sanitize parameters
      const validatedParams = await validateAndSanitizeInput(GetListingApiV1AdminListingsListingIdGetParamsSchema, parsedInput) as z.infer<typeof GetListingApiV1AdminListingsListingIdGetParamsSchema>

        // Execute API call with enhanced error handling
        const response = await apiClient.admin.getListingApiV1AdminListingsListingIdGet({params: {
path: {
        listing_id: validatedParams.path.listing_id
      }
    },
          config: {
            timeout: 30000,
            retries: 3,
            validateResponse: false,
            responseSchema: GetListingApiV1AdminListingsListingIdGetResponseSchema
          }
        })
        

        // Log successful execution
        const duration = Date.now() - startTime
        await logActionExecution('getListingApiV1AdminListingsListingIdGet', true, duration, {
          method: 'GET',
          path: '/api/v1/admin/listings/{listing_id}'
        })
        
        return response.data
      } catch (error) {

        const duration = Date.now() - startTime

        // Enhanced error logging
        await logActionExecution('getListingApiV1AdminListingsListingIdGet', false, duration, {
          method: 'GET',
          path: '/api/v1/admin/listings/{listing_id}',
          error: error instanceof Error ? error.message : 'Unknown error'
        })
        
        // Throw enhanced error with context
        throw new ActionExecutionError(
          error instanceof Error ? error.message : 'Unknown error occurred',
          {
            endpoint: '/api/v1/admin/listings/{listing_id}',
            method: 'GET',
            timestamp: Date.now()
          },
          error
        )
      }
    })
)

/**
 * Get Listing Stats
 * @generated from GET /api/v1/admin/listings/stats
 * Features: React cache, input validation, error handling
 */
export const getListingStatsApiV1AdminListingsStatsGet = cache(
  authActionClient
    .metadata({
      name: "get-listing-stats-api-v1-admin-listings-stats-get",
      requiresAuth: true
    })
    .schema(z.void())
    .action(async ({ parsedInput, ctx }: { parsedInput: void; ctx: { user?: any; ratelimit?: { remaining: number } } }) => {
      const startTime = Date.now()
      
      try {

        // Execute API call with enhanced error handling
        const response = await apiClient.admin.getListingStatsApiV1AdminListingsStatsGet({
          config: {
            timeout: 30000,
            retries: 3,
            validateResponse: false,
            responseSchema: GetListingStatsApiV1AdminListingsStatsGetResponseSchema
          }
        })
        

        // Log successful execution
        const duration = Date.now() - startTime
        await logActionExecution('getListingStatsApiV1AdminListingsStatsGet', true, duration, {
          method: 'GET',
          path: '/api/v1/admin/listings/stats'
        })
        
        return response.data
      } catch (error) {

        const duration = Date.now() - startTime

        // Enhanced error logging
        await logActionExecution('getListingStatsApiV1AdminListingsStatsGet', false, duration, {
          method: 'GET',
          path: '/api/v1/admin/listings/stats',
          error: error instanceof Error ? error.message : 'Unknown error'
        })
        
        // Throw enhanced error with context
        throw new ActionExecutionError(
          error instanceof Error ? error.message : 'Unknown error occurred',
          {
            endpoint: '/api/v1/admin/listings/stats',
            method: 'GET',
            timestamp: Date.now()
          },
          error
        )
      }
    })
)

/**
 * List Bookings
 * @generated from GET /api/v1/admin/bookings
 * Features: React cache, input validation, error handling
 */
export const listBookingsApiV1AdminBookingsGet = cache(
  authActionClient
    .metadata({
      name: "list-bookings-api-v1-admin-bookings-get",
      requiresAuth: true
    })
    .schema(ListBookingsApiV1AdminBookingsGetParamsSchema)
    .action(async ({ parsedInput, ctx }: { parsedInput: z.infer<typeof ListBookingsApiV1AdminBookingsGetParamsSchema>; ctx: { user?: any; ratelimit?: { remaining: number } } }) => {
      const startTime = Date.now()
      
      try {
      // Validate and sanitize parameters
      const validatedParams = await validateAndSanitizeInput(ListBookingsApiV1AdminBookingsGetParamsSchema, parsedInput) as z.infer<typeof ListBookingsApiV1AdminBookingsGetParamsSchema>

        // Execute API call with enhanced error handling
        const response = await apiClient.admin.listBookingsApiV1AdminBookingsGet({params: {
query: validatedParams.query,
    },
          config: {
            timeout: 30000,
            retries: 3,
            validateResponse: false,
            responseSchema: ListBookingsApiV1AdminBookingsGetResponseSchema
          }
        })
        

        // Log successful execution
        const duration = Date.now() - startTime
        await logActionExecution('listBookingsApiV1AdminBookingsGet', true, duration, {
          method: 'GET',
          path: '/api/v1/admin/bookings'
        })
        
        return response.data
      } catch (error) {

        const duration = Date.now() - startTime

        // Enhanced error logging
        await logActionExecution('listBookingsApiV1AdminBookingsGet', false, duration, {
          method: 'GET',
          path: '/api/v1/admin/bookings',
          error: error instanceof Error ? error.message : 'Unknown error'
        })
        
        // Throw enhanced error with context
        throw new ActionExecutionError(
          error instanceof Error ? error.message : 'Unknown error occurred',
          {
            endpoint: '/api/v1/admin/bookings',
            method: 'GET',
            timestamp: Date.now()
          },
          error
        )
      }
    })
)

/**
 * Get Booking
 * @generated from GET /api/v1/admin/bookings/{booking_id}
 * Features: React cache, input validation, error handling
 */
export const getBookingApiV1AdminBookingsBookingIdGet = cache(
  authActionClient
    .metadata({
      name: "get-booking-api-v1-admin-bookings-booking-id-get",
      requiresAuth: true
    })
    .schema(GetBookingApiV1AdminBookingsBookingIdGetParamsSchema)
    .action(async ({ parsedInput, ctx }: { parsedInput: z.infer<typeof GetBookingApiV1AdminBookingsBookingIdGetParamsSchema>; ctx: { user?: any; ratelimit?: { remaining: number } } }) => {
      const startTime = Date.now()
      
      try {
      // Validate and sanitize parameters
      const validatedParams = await validateAndSanitizeInput(GetBookingApiV1AdminBookingsBookingIdGetParamsSchema, parsedInput) as z.infer<typeof GetBookingApiV1AdminBookingsBookingIdGetParamsSchema>

        // Execute API call with enhanced error handling
        const response = await apiClient.admin.getBookingApiV1AdminBookingsBookingIdGet({params: {
path: {
        booking_id: validatedParams.path.booking_id
      }
    },
          config: {
            timeout: 30000,
            retries: 3,
            validateResponse: false,
            responseSchema: GetBookingApiV1AdminBookingsBookingIdGetResponseSchema
          }
        })
        

        // Log successful execution
        const duration = Date.now() - startTime
        await logActionExecution('getBookingApiV1AdminBookingsBookingIdGet', true, duration, {
          method: 'GET',
          path: '/api/v1/admin/bookings/{booking_id}'
        })
        
        return response.data
      } catch (error) {

        const duration = Date.now() - startTime

        // Enhanced error logging
        await logActionExecution('getBookingApiV1AdminBookingsBookingIdGet', false, duration, {
          method: 'GET',
          path: '/api/v1/admin/bookings/{booking_id}',
          error: error instanceof Error ? error.message : 'Unknown error'
        })
        
        // Throw enhanced error with context
        throw new ActionExecutionError(
          error instanceof Error ? error.message : 'Unknown error occurred',
          {
            endpoint: '/api/v1/admin/bookings/{booking_id}',
            method: 'GET',
            timestamp: Date.now()
          },
          error
        )
      }
    })
)

/**
 * Get Booking Stats
 * @generated from GET /api/v1/admin/bookings/stats
 * Features: React cache, input validation, error handling
 */
export const getBookingStatsApiV1AdminBookingsStatsGet = cache(
  authActionClient
    .metadata({
      name: "get-booking-stats-api-v1-admin-bookings-stats-get",
      requiresAuth: true
    })
    .schema(z.void())
    .action(async ({ parsedInput, ctx }: { parsedInput: void; ctx: { user?: any; ratelimit?: { remaining: number } } }) => {
      const startTime = Date.now()
      
      try {

        // Execute API call with enhanced error handling
        const response = await apiClient.admin.getBookingStatsApiV1AdminBookingsStatsGet({
          config: {
            timeout: 30000,
            retries: 3,
            validateResponse: false,
            responseSchema: GetBookingStatsApiV1AdminBookingsStatsGetResponseSchema
          }
        })
        

        // Log successful execution
        const duration = Date.now() - startTime
        await logActionExecution('getBookingStatsApiV1AdminBookingsStatsGet', true, duration, {
          method: 'GET',
          path: '/api/v1/admin/bookings/stats'
        })
        
        return response.data
      } catch (error) {

        const duration = Date.now() - startTime

        // Enhanced error logging
        await logActionExecution('getBookingStatsApiV1AdminBookingsStatsGet', false, duration, {
          method: 'GET',
          path: '/api/v1/admin/bookings/stats',
          error: error instanceof Error ? error.message : 'Unknown error'
        })
        
        // Throw enhanced error with context
        throw new ActionExecutionError(
          error instanceof Error ? error.message : 'Unknown error occurred',
          {
            endpoint: '/api/v1/admin/bookings/stats',
            method: 'GET',
            timestamp: Date.now()
          },
          error
        )
      }
    })
)

/**
 * List Payments
 * @generated from GET /api/v1/admin/payments
 * Features: React cache, input validation, error handling
 */
export const listPaymentsApiV1AdminPaymentsGet = cache(
  authActionClient
    .metadata({
      name: "list-payments-api-v1-admin-payments-get",
      requiresAuth: true
    })
    .schema(ListPaymentsApiV1AdminPaymentsGetParamsSchema)
    .action(async ({ parsedInput, ctx }: { parsedInput: z.infer<typeof ListPaymentsApiV1AdminPaymentsGetParamsSchema>; ctx: { user?: any; ratelimit?: { remaining: number } } }) => {
      const startTime = Date.now()
      
      try {
      // Validate and sanitize parameters
      const validatedParams = await validateAndSanitizeInput(ListPaymentsApiV1AdminPaymentsGetParamsSchema, parsedInput) as z.infer<typeof ListPaymentsApiV1AdminPaymentsGetParamsSchema>

        // Execute API call with enhanced error handling
        const response = await apiClient.admin.listPaymentsApiV1AdminPaymentsGet({params: {
query: validatedParams.query,
    },
          config: {
            timeout: 30000,
            retries: 3,
            validateResponse: false,
            responseSchema: ListPaymentsApiV1AdminPaymentsGetResponseSchema
          }
        })
        

        // Log successful execution
        const duration = Date.now() - startTime
        await logActionExecution('listPaymentsApiV1AdminPaymentsGet', true, duration, {
          method: 'GET',
          path: '/api/v1/admin/payments'
        })
        
        return response.data
      } catch (error) {

        const duration = Date.now() - startTime

        // Enhanced error logging
        await logActionExecution('listPaymentsApiV1AdminPaymentsGet', false, duration, {
          method: 'GET',
          path: '/api/v1/admin/payments',
          error: error instanceof Error ? error.message : 'Unknown error'
        })
        
        // Throw enhanced error with context
        throw new ActionExecutionError(
          error instanceof Error ? error.message : 'Unknown error occurred',
          {
            endpoint: '/api/v1/admin/payments',
            method: 'GET',
            timestamp: Date.now()
          },
          error
        )
      }
    })
)

/**
 * Get Payment
 * @generated from GET /api/v1/admin/payments/{payment_id}
 * Features: React cache, input validation, error handling
 */
export const getPaymentApiV1AdminPaymentsPaymentIdGet = cache(
  authActionClient
    .metadata({
      name: "get-payment-api-v1-admin-payments-payment-id-get",
      requiresAuth: true
    })
    .schema(GetPaymentApiV1AdminPaymentsPaymentIdGetParamsSchema)
    .action(async ({ parsedInput, ctx }: { parsedInput: z.infer<typeof GetPaymentApiV1AdminPaymentsPaymentIdGetParamsSchema>; ctx: { user?: any; ratelimit?: { remaining: number } } }) => {
      const startTime = Date.now()
      
      try {
      // Validate and sanitize parameters
      const validatedParams = await validateAndSanitizeInput(GetPaymentApiV1AdminPaymentsPaymentIdGetParamsSchema, parsedInput) as z.infer<typeof GetPaymentApiV1AdminPaymentsPaymentIdGetParamsSchema>

        // Execute API call with enhanced error handling
        const response = await apiClient.admin.getPaymentApiV1AdminPaymentsPaymentIdGet({params: {
path: {
        payment_id: validatedParams.path.payment_id
      }
    },
          config: {
            timeout: 30000,
            retries: 3,
            validateResponse: false,
            responseSchema: GetPaymentApiV1AdminPaymentsPaymentIdGetResponseSchema
          }
        })
        

        // Log successful execution
        const duration = Date.now() - startTime
        await logActionExecution('getPaymentApiV1AdminPaymentsPaymentIdGet', true, duration, {
          method: 'GET',
          path: '/api/v1/admin/payments/{payment_id}'
        })
        
        return response.data
      } catch (error) {

        const duration = Date.now() - startTime

        // Enhanced error logging
        await logActionExecution('getPaymentApiV1AdminPaymentsPaymentIdGet', false, duration, {
          method: 'GET',
          path: '/api/v1/admin/payments/{payment_id}',
          error: error instanceof Error ? error.message : 'Unknown error'
        })
        
        // Throw enhanced error with context
        throw new ActionExecutionError(
          error instanceof Error ? error.message : 'Unknown error occurred',
          {
            endpoint: '/api/v1/admin/payments/{payment_id}',
            method: 'GET',
            timestamp: Date.now()
          },
          error
        )
      }
    })
)

/**
 * Get Payment Stats
 * @generated from GET /api/v1/admin/payments/stats
 * Features: React cache, input validation, error handling
 */
export const getPaymentStatsApiV1AdminPaymentsStatsGet = cache(
  authActionClient
    .metadata({
      name: "get-payment-stats-api-v1-admin-payments-stats-get",
      requiresAuth: true
    })
    .schema(z.void())
    .action(async ({ parsedInput, ctx }: { parsedInput: void; ctx: { user?: any; ratelimit?: { remaining: number } } }) => {
      const startTime = Date.now()
      
      try {

        // Execute API call with enhanced error handling
        const response = await apiClient.admin.getPaymentStatsApiV1AdminPaymentsStatsGet({
          config: {
            timeout: 30000,
            retries: 3,
            validateResponse: false,
            responseSchema: GetPaymentStatsApiV1AdminPaymentsStatsGetResponseSchema
          }
        })
        

        // Log successful execution
        const duration = Date.now() - startTime
        await logActionExecution('getPaymentStatsApiV1AdminPaymentsStatsGet', true, duration, {
          method: 'GET',
          path: '/api/v1/admin/payments/stats'
        })
        
        return response.data
      } catch (error) {

        const duration = Date.now() - startTime

        // Enhanced error logging
        await logActionExecution('getPaymentStatsApiV1AdminPaymentsStatsGet', false, duration, {
          method: 'GET',
          path: '/api/v1/admin/payments/stats',
          error: error instanceof Error ? error.message : 'Unknown error'
        })
        
        // Throw enhanced error with context
        throw new ActionExecutionError(
          error instanceof Error ? error.message : 'Unknown error occurred',
          {
            endpoint: '/api/v1/admin/payments/stats',
            method: 'GET',
            timestamp: Date.now()
          },
          error
        )
      }
    })
)