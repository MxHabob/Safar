'use server'
import { z } from 'zod'
import { cache } from 'react'
import { updateTag } from 'next/cache'
import { headers } from 'next/headers'
import { apiClient } from '@/generated/client'
import { actionClientWithMeta, authActionClient, ActionError } from '@/generated/lib/safe-action'
import {
  SearchListingsApiV1SearchListingsGetParamsSchema,
  SearchListingsApiV1SearchListingsGetResponseSchema,
  GetSearchSuggestionsApiV1SearchSuggestionsGetParamsSchema,
  GetSearchSuggestionsApiV1SearchSuggestionsGetResponseSchema
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
 * Search Listings
 * @generated from GET /api/v1/search/listings
 * Features: React cache, input validation, error handling
 */
export const searchListingsApiV1SearchListingsGet = cache(
  authActionClient
    .metadata({
      name: "search-listings-api-v1-search-listings-get",
      requiresAuth: true
    })
    .schema(SearchListingsApiV1SearchListingsGetParamsSchema)
    .action(async ({ parsedInput, ctx }: { parsedInput: z.infer<typeof SearchListingsApiV1SearchListingsGetParamsSchema>; ctx: { user?: any; ratelimit?: { remaining: number } } }) => {
      const startTime = Date.now()
      
      try {
      // Validate and sanitize parameters
      const validatedParams = await validateAndSanitizeInput(SearchListingsApiV1SearchListingsGetParamsSchema, parsedInput) as z.infer<typeof SearchListingsApiV1SearchListingsGetParamsSchema>

        // Execute API call with enhanced error handling
        const response = await apiClient.search.searchListingsApiV1SearchListingsGet({params: {
query: validatedParams.query,
    },
          config: {
            timeout: 30000,
            retries: 3,
            validateResponse: false,
            responseSchema: SearchListingsApiV1SearchListingsGetResponseSchema
          }
        })
        

        // Log successful execution
        const duration = Date.now() - startTime
        await logActionExecution('searchListingsApiV1SearchListingsGet', true, duration, {
          method: 'GET',
          path: '/api/v1/search/listings'
        })
        
        return response.data
      } catch (error) {

        const duration = Date.now() - startTime

        // Enhanced error logging
        await logActionExecution('searchListingsApiV1SearchListingsGet', false, duration, {
          method: 'GET',
          path: '/api/v1/search/listings',
          error: error instanceof Error ? error.message : 'Unknown error'
        })
        
        // Throw enhanced error with context
        throw new ActionExecutionError(
          error instanceof Error ? error.message : 'Unknown error occurred',
          {
            endpoint: '/api/v1/search/listings',
            method: 'GET',
            timestamp: Date.now()
          },
          error
        )
      }
    })
)

/**
 * Get Search Suggestions
 * @generated from GET /api/v1/search/suggestions
 * Features: React cache, input validation, error handling
 */
export const getSearchSuggestionsApiV1SearchSuggestionsGet = cache(
  actionClientWithMeta
    .metadata({
      name: "get-search-suggestions-api-v1-search-suggestions-get",
      requiresAuth: false
    })
    .schema(GetSearchSuggestionsApiV1SearchSuggestionsGetParamsSchema)
    .action(async ({ parsedInput, ctx }: { parsedInput: z.infer<typeof GetSearchSuggestionsApiV1SearchSuggestionsGetParamsSchema>; ctx?: any }) => {
      const startTime = Date.now()
      
      try {
      // Validate and sanitize parameters
      const validatedParams = await validateAndSanitizeInput(GetSearchSuggestionsApiV1SearchSuggestionsGetParamsSchema, parsedInput) as z.infer<typeof GetSearchSuggestionsApiV1SearchSuggestionsGetParamsSchema>

        // Execute API call with enhanced error handling
        const response = await apiClient.search.getSearchSuggestionsApiV1SearchSuggestionsGet({params: {
query: validatedParams.query,
    },
          config: {
            timeout: 30000,
            retries: 3,
            validateResponse: false,
            responseSchema: GetSearchSuggestionsApiV1SearchSuggestionsGetResponseSchema
          }
        })
        

        // Log successful execution
        const duration = Date.now() - startTime
        await logActionExecution('getSearchSuggestionsApiV1SearchSuggestionsGet', true, duration, {
          method: 'GET',
          path: '/api/v1/search/suggestions'
        })
        
        return response.data
      } catch (error) {

        const duration = Date.now() - startTime

        // Enhanced error logging
        await logActionExecution('getSearchSuggestionsApiV1SearchSuggestionsGet', false, duration, {
          method: 'GET',
          path: '/api/v1/search/suggestions',
          error: error instanceof Error ? error.message : 'Unknown error'
        })
        
        // Throw enhanced error with context
        throw new ActionExecutionError(
          error instanceof Error ? error.message : 'Unknown error occurred',
          {
            endpoint: '/api/v1/search/suggestions',
            method: 'GET',
            timestamp: Date.now()
          },
          error
        )
      }
    })
)