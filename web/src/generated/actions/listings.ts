'use server'
import { z } from 'zod'
import { cache } from 'react'
import { updateTag } from 'next/cache'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { apiClient } from '@/generated/client'
import { actionClientWithMeta, authActionClient, ActionError } from '@/generated/lib/safe-action'
import {
  ListListingsApiV1ListingsGetParamsSchema,
  ListListingsApiV1ListingsGetResponseSchema,
  CreateListingApiV1ListingsPostRequestSchema,
  CreateListingApiV1ListingsPostResponseSchema,
  GetListingApiV1ListingsListingIdGetParamsSchema,
  GetListingApiV1ListingsListingIdGetResponseSchema,
  UpdateListingApiV1ListingsListingIdPutRequestSchema,
  UpdateListingApiV1ListingsListingIdPutParamsSchema,
  UpdateListingApiV1ListingsListingIdPutResponseSchema,
  DeleteListingApiV1ListingsListingIdDeleteParamsSchema,
  DeleteListingApiV1ListingsListingIdDeleteResponseSchema,
  CreateListingLocationApiV1ListingsListingIdLocationPostRequestSchema,
  CreateListingLocationApiV1ListingsListingIdLocationPostParamsSchema,
  CreateListingLocationApiV1ListingsListingIdLocationPostResponseSchema
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
 * List Listings
 * @generated from GET /api/v1/listings
 * Features: React cache, input validation, error handling
 */
export const listListingsApiV1ListingsGet = cache(
  actionClientWithMeta
    .metadata({
      name: "list-listings-api-v1-listings-get",
      requiresAuth: false
    })
    .schema(ListListingsApiV1ListingsGetParamsSchema)
    .action(async ({ parsedInput, ctx }: { parsedInput: z.infer<typeof ListListingsApiV1ListingsGetParamsSchema>; ctx?: any }) => {
      const startTime = Date.now()
      
      try {
      // Validate and sanitize parameters
      const validatedParams = await validateAndSanitizeInput(ListListingsApiV1ListingsGetParamsSchema, parsedInput) as z.infer<typeof ListListingsApiV1ListingsGetParamsSchema>

        // Execute API call with enhanced error handling
        const response = await apiClient.listings.listListingsApiV1ListingsGet({params: {
query: validatedParams.query,
    },
          config: {
            timeout: 30000,
            retries: 3,
            validateResponse: false,
            responseSchema: ListListingsApiV1ListingsGetResponseSchema
          }
        })
        

        // Log successful execution
        const duration = Date.now() - startTime
        await logActionExecution('listListingsApiV1ListingsGet', true, duration, {
          method: 'GET',
          path: '/api/v1/listings'
        })
        
        return response.data
      } catch (error) {

        const duration = Date.now() - startTime

        // Enhanced error logging
        await logActionExecution('listListingsApiV1ListingsGet', false, duration, {
          method: 'GET',
          path: '/api/v1/listings',
          error: error instanceof Error ? error.message : 'Unknown error'
        })
        
        // Throw enhanced error with context
        throw new ActionExecutionError(
          error instanceof Error ? error.message : 'Unknown error occurred',
          {
            endpoint: '/api/v1/listings',
            method: 'GET',
            timestamp: Date.now()
          },
          error
        )
      }
    })
)

/**
 * Create Listing
 * @generated from POST /api/v1/listings
 * Features: Input validation, revalidation, error handling
 */
export const createListingApiV1ListingsPost = authActionClient
  .metadata({
    name: "create-listing-api-v1-listings-post",
    requiresAuth: true
  })
  .schema(CreateListingApiV1ListingsPostRequestSchema)
  .action(async ({ parsedInput, ctx }: { parsedInput: z.infer<typeof CreateListingApiV1ListingsPostRequestSchema>; ctx: { user?: any; ratelimit?: { remaining: number } } }) => {
    const startTime = Date.now()
    
    try {
      // Validate and sanitize request body
      const validatedBody = await validateAndSanitizeInput(CreateListingApiV1ListingsPostRequestSchema, parsedInput)

      // Execute API call with enhanced configuration
      const response = await apiClient.listings.createListingApiV1ListingsPost({body: validatedBody,
        config: {
          timeout: 30000,
          retries: 3,
          validateResponse: false,
          responseSchema: CreateListingApiV1ListingsPostResponseSchema
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
      updateTag('Listings')
      console.log('Updated tag: Listings')


      // Log successful execution
      const duration = Date.now() - startTime
      await logActionExecution('createListingApiV1ListingsPost', true, duration, {
        method: 'POST',
        path: '/api/v1/listings'
      })
      
      return response.data
    } catch (error) {

      const duration = Date.now() - startTime

      // Enhanced error logging
      await logActionExecution('createListingApiV1ListingsPost', false, duration, {
        method: 'POST',
        path: '/api/v1/listings',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      
      // Throw enhanced error with context
      throw new ActionExecutionError(
        error instanceof Error ? error.message : 'Unknown error occurred',
        {
          endpoint: '/api/v1/listings',
          method: 'POST',
          timestamp: Date.now()
        },
        error
      )
    }
  })

/**
 * Get Listing
 * @generated from GET /api/v1/listings/{listing_id}
 * Features: React cache, input validation, error handling
 */
export const getListingApiV1ListingsListingIdGet = cache(
  authActionClient
    .metadata({
      name: "get-listing-api-v1-listings-listing-id-get",
      requiresAuth: false
    })
    .schema(GetListingApiV1ListingsListingIdGetParamsSchema)
    .action(async ({ parsedInput, ctx }: { parsedInput: z.infer<typeof GetListingApiV1ListingsListingIdGetParamsSchema>; ctx: { user?: any; ratelimit?: { remaining: number } } }) => {
      const startTime = Date.now()
      
      try {
      // Validate and sanitize parameters
      const validatedParams = await validateAndSanitizeInput(GetListingApiV1ListingsListingIdGetParamsSchema, parsedInput) as z.infer<typeof GetListingApiV1ListingsListingIdGetParamsSchema>

        // Execute API call with enhanced error handling
        const response = await apiClient.listings.getListingApiV1ListingsListingIdGet({params: {
path: {
        listing_id: validatedParams.path.listing_id
      }
    },
          config: {
            timeout: 30000,
            retries: 3,
            validateResponse: false,
            responseSchema: GetListingApiV1ListingsListingIdGetResponseSchema
          }
        })
        

        // Log successful execution
        const duration = Date.now() - startTime
        await logActionExecution('getListingApiV1ListingsListingIdGet', true, duration, {
          method: 'GET',
          path: '/api/v1/listings/{listing_id}'
        })
        
        return response.data
      } catch (error) {

        const duration = Date.now() - startTime

        // Enhanced error logging
        await logActionExecution('getListingApiV1ListingsListingIdGet', false, duration, {
          method: 'GET',
          path: '/api/v1/listings/{listing_id}',
          error: error instanceof Error ? error.message : 'Unknown error'
        })
        
        // Throw enhanced error with context
        throw new ActionExecutionError(
          error instanceof Error ? error.message : 'Unknown error occurred',
          {
            endpoint: '/api/v1/listings/{listing_id}',
            method: 'GET',
            timestamp: Date.now()
          },
          error
        )
      }
    })
)

/**
 * Update Listing
 * @generated from PUT /api/v1/listings/{listing_id}
 * Features: Input validation, revalidation, error handling
 */
const UpdateListingApiV1ListingsListingIdPutInputSchema = z.object({ body: UpdateListingApiV1ListingsListingIdPutRequestSchema, params: UpdateListingApiV1ListingsListingIdPutParamsSchema })

export const updateListingApiV1ListingsListingIdPut = authActionClient
  .metadata({
    name: "update-listing-api-v1-listings-listing-id-put",
    requiresAuth: true
  })
  .schema(UpdateListingApiV1ListingsListingIdPutInputSchema)
  .action(async ({ parsedInput, ctx }: { parsedInput: z.infer<typeof UpdateListingApiV1ListingsListingIdPutInputSchema>; ctx: { user?: any; ratelimit?: { remaining: number } } }) => {
    const startTime = Date.now()
    
    try {
      // Validate and sanitize input payload
      const { body, params } = await validateAndSanitizeInput(z.object({
        body: UpdateListingApiV1ListingsListingIdPutRequestSchema,
        params: UpdateListingApiV1ListingsListingIdPutParamsSchema
      }), parsedInput)
      const validatedBody = body
      const validatedParams = params as z.infer<typeof UpdateListingApiV1ListingsListingIdPutParamsSchema>

      // Execute API call with enhanced configuration
      const response = await apiClient.listings.updateListingApiV1ListingsListingIdPut({params: {
path: {
        listing_id: validatedParams.path.listing_id
      }
    },
body: validatedBody,
        config: {
          timeout: 30000,
          retries: 3,
          validateResponse: false,
          responseSchema: UpdateListingApiV1ListingsListingIdPutResponseSchema
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
      updateTag('Listings')
      console.log('Updated tag: Listings')


      // Log successful execution
      const duration = Date.now() - startTime
      await logActionExecution('updateListingApiV1ListingsListingIdPut', true, duration, {
        method: 'PUT',
        path: '/api/v1/listings/{listing_id}'
      })
      
      return response.data
    } catch (error) {

      const duration = Date.now() - startTime

      // Enhanced error logging
      await logActionExecution('updateListingApiV1ListingsListingIdPut', false, duration, {
        method: 'PUT',
        path: '/api/v1/listings/{listing_id}',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      
      // Throw enhanced error with context
      throw new ActionExecutionError(
        error instanceof Error ? error.message : 'Unknown error occurred',
        {
          endpoint: '/api/v1/listings/{listing_id}',
          method: 'PUT',
          timestamp: Date.now()
        },
        error
      )
    }
  })

/**
 * Delete Listing
 * @generated from DELETE /api/v1/listings/{listing_id}
 * Features: Input validation, revalidation, error handling
 */
export const deleteListingApiV1ListingsListingIdDelete = authActionClient
  .metadata({
    name: "delete-listing-api-v1-listings-listing-id-delete",
    requiresAuth: true
  })
  .schema(DeleteListingApiV1ListingsListingIdDeleteParamsSchema)
  .action(async ({ parsedInput, ctx }: { parsedInput: z.infer<typeof DeleteListingApiV1ListingsListingIdDeleteParamsSchema>; ctx: { user?: any; ratelimit?: { remaining: number } } }) => {
    const startTime = Date.now()
    
    try {
      // Validate and sanitize parameters
      const validatedParams = await validateAndSanitizeInput(DeleteListingApiV1ListingsListingIdDeleteParamsSchema, parsedInput) as z.infer<typeof DeleteListingApiV1ListingsListingIdDeleteParamsSchema>

      // Execute API call with enhanced configuration
      const response = await apiClient.listings.deleteListingApiV1ListingsListingIdDelete({params: {
path: {
        listing_id: validatedParams.path.listing_id
      }
    },
        config: {
          timeout: 30000,
          retries: 3,
          validateResponse: false,
          responseSchema: DeleteListingApiV1ListingsListingIdDeleteResponseSchema
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
      updateTag('Listings')
      console.log('Updated tag: Listings')


      // Log successful execution
      const duration = Date.now() - startTime
      await logActionExecution('deleteListingApiV1ListingsListingIdDelete', true, duration, {
        method: 'DELETE',
        path: '/api/v1/listings/{listing_id}'
      })
      
      return response.data
    } catch (error) {

      const duration = Date.now() - startTime

      // Enhanced error logging
      await logActionExecution('deleteListingApiV1ListingsListingIdDelete', false, duration, {
        method: 'DELETE',
        path: '/api/v1/listings/{listing_id}',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      
      // Throw enhanced error with context
      throw new ActionExecutionError(
        error instanceof Error ? error.message : 'Unknown error occurred',
        {
          endpoint: '/api/v1/listings/{listing_id}',
          method: 'DELETE',
          timestamp: Date.now()
        },
        error
      )
    }
  })

/**
 * Create Listing Location
 * @generated from POST /api/v1/listings/{listing_id}/location
 * Features: Input validation, revalidation, error handling
 */
const CreateListingLocationApiV1ListingsListingIdLocationPostInputSchema = z.object({ body: CreateListingLocationApiV1ListingsListingIdLocationPostRequestSchema, params: CreateListingLocationApiV1ListingsListingIdLocationPostParamsSchema })

export const createListingLocationApiV1ListingsListingIdLocationPost = authActionClient
  .metadata({
    name: "create-listing-location-api-v1-listings-listing-id-location-post",
    requiresAuth: true
  })
  .schema(CreateListingLocationApiV1ListingsListingIdLocationPostInputSchema)
  .action(async ({ parsedInput, ctx }: { parsedInput: z.infer<typeof CreateListingLocationApiV1ListingsListingIdLocationPostInputSchema>; ctx: { user?: any; ratelimit?: { remaining: number } } }) => {
    const startTime = Date.now()
    
    try {
      // Validate and sanitize input payload
      const { body, params } = await validateAndSanitizeInput(z.object({
        body: CreateListingLocationApiV1ListingsListingIdLocationPostRequestSchema,
        params: CreateListingLocationApiV1ListingsListingIdLocationPostParamsSchema
      }), parsedInput)
      const validatedBody = body
      const validatedParams = params as z.infer<typeof CreateListingLocationApiV1ListingsListingIdLocationPostParamsSchema>

      // Execute API call with enhanced configuration
      const response = await apiClient.listings.createListingLocationApiV1ListingsListingIdLocationPost({params: {
path: {
        listing_id: validatedParams.path.listing_id
      }
    },
body: validatedBody,
        config: {
          timeout: 30000,
          retries: 3,
          validateResponse: false,
          responseSchema: CreateListingLocationApiV1ListingsListingIdLocationPostResponseSchema
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
      updateTag('Listings')
      console.log('Updated tag: Listings')


      // Log successful execution
      const duration = Date.now() - startTime
      await logActionExecution('createListingLocationApiV1ListingsListingIdLocationPost', true, duration, {
        method: 'POST',
        path: '/api/v1/listings/{listing_id}/location'
      })
      
      return response.data
    } catch (error) {

      const duration = Date.now() - startTime

      // Enhanced error logging
      await logActionExecution('createListingLocationApiV1ListingsListingIdLocationPost', false, duration, {
        method: 'POST',
        path: '/api/v1/listings/{listing_id}/location',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      
      // Throw enhanced error with context
      throw new ActionExecutionError(
        error instanceof Error ? error.message : 'Unknown error occurred',
        {
          endpoint: '/api/v1/listings/{listing_id}/location',
          method: 'POST',
          timestamp: Date.now()
        },
        error
      )
    }
  })