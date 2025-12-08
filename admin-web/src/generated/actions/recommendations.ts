'use server'
import { z } from 'zod'
import { cache } from 'react'
import { updateTag } from 'next/cache'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { apiClient } from '@/generated/client'
import { actionClientWithMeta, authActionClient, ActionError } from '@/generated/lib/safe-action'
import {
  GetMyRecommendationsApiV1RecommendationsForMeGetParamsSchema,
  GetMyRecommendationsApiV1RecommendationsForMeGetResponseSchema,
  GetSimilarListingsApiV1RecommendationsSimilarListingIdGetParamsSchema,
  GetSimilarListingsApiV1RecommendationsSimilarListingIdGetResponseSchema,
  GetTrendingListingsApiV1RecommendationsTrendingGetParamsSchema,
  GetTrendingListingsApiV1RecommendationsTrendingGetResponseSchema,
  GetMlRecommendationsApiV1RecommendationsMlForMeGetParamsSchema,
  GetMlRecommendationsApiV1RecommendationsMlForMeGetResponseSchema,
  ExplainRecommendationApiV1RecommendationsMlExplainListingIdGetParamsSchema,
  ExplainRecommendationApiV1RecommendationsMlExplainListingIdGetResponseSchema,
  TrainRecommendationModelApiV1RecommendationsMlTrainPostParamsSchema,
  TrainRecommendationModelApiV1RecommendationsMlTrainPostResponseSchema
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
 * Get My Recommendations
 * @generated from GET /api/v1/recommendations/for-me
 * Features: React cache, input validation, error handling
 */
export const getMyRecommendationsApiV1RecommendationsForMeGet = cache(
  authActionClient
    .metadata({
      name: "get-my-recommendations-api-v1-recommendations-for-me-get",
      requiresAuth: true
    })
    .schema(GetMyRecommendationsApiV1RecommendationsForMeGetParamsSchema)
    .action(async ({ parsedInput, ctx }: { parsedInput: z.infer<typeof GetMyRecommendationsApiV1RecommendationsForMeGetParamsSchema>; ctx: { user?: any; ratelimit?: { remaining: number } } }) => {
      const startTime = Date.now()
      
      try {
      // Validate and sanitize parameters
      const validatedParams = await validateAndSanitizeInput(GetMyRecommendationsApiV1RecommendationsForMeGetParamsSchema, parsedInput) as z.infer<typeof GetMyRecommendationsApiV1RecommendationsForMeGetParamsSchema>

        // Execute API call with enhanced error handling
        const response = await apiClient.recommendations.getMyRecommendationsApiV1RecommendationsForMeGet({params: {
query: validatedParams.query,
    },
          config: {
            timeout: 30000,
            retries: 3,
            validateResponse: false,
            responseSchema: GetMyRecommendationsApiV1RecommendationsForMeGetResponseSchema
          }
        })
        

        // Log successful execution
        const duration = Date.now() - startTime
        await logActionExecution('getMyRecommendationsApiV1RecommendationsForMeGet', true, duration, {
          method: 'GET',
          path: '/api/v1/recommendations/for-me'
        })
        
        return response.data
      } catch (error) {

        const duration = Date.now() - startTime

        // Enhanced error logging
        await logActionExecution('getMyRecommendationsApiV1RecommendationsForMeGet', false, duration, {
          method: 'GET',
          path: '/api/v1/recommendations/for-me',
          error: error instanceof Error ? error.message : 'Unknown error'
        })
        
        // Throw enhanced error with context
        throw new ActionExecutionError(
          error instanceof Error ? error.message : 'Unknown error occurred',
          {
            endpoint: '/api/v1/recommendations/for-me',
            method: 'GET',
            timestamp: Date.now()
          },
          error
        )
      }
    })
)

/**
 * Get Similar Listings
 * @generated from GET /api/v1/recommendations/similar/{listing_id}
 * Features: React cache, input validation, error handling
 */
export const getSimilarListingsApiV1RecommendationsSimilarListingIdGet = cache(
  actionClientWithMeta
    .metadata({
      name: "get-similar-listings-api-v1-recommendations-similar-listing-id-get",
      requiresAuth: false
    })
    .schema(GetSimilarListingsApiV1RecommendationsSimilarListingIdGetParamsSchema)
    .action(async ({ parsedInput, ctx }: { parsedInput: z.infer<typeof GetSimilarListingsApiV1RecommendationsSimilarListingIdGetParamsSchema>; ctx?: any }) => {
      const startTime = Date.now()
      
      try {
      // Validate and sanitize parameters
      const validatedParams = await validateAndSanitizeInput(GetSimilarListingsApiV1RecommendationsSimilarListingIdGetParamsSchema, parsedInput) as z.infer<typeof GetSimilarListingsApiV1RecommendationsSimilarListingIdGetParamsSchema>

        // Execute API call with enhanced error handling
        const response = await apiClient.recommendations.getSimilarListingsApiV1RecommendationsSimilarListingIdGet({params: {
path: {
        listing_id: validatedParams.path.listing_id
      },
query: validatedParams.query,
    },
          config: {
            timeout: 30000,
            retries: 3,
            validateResponse: false,
            responseSchema: GetSimilarListingsApiV1RecommendationsSimilarListingIdGetResponseSchema
          }
        })
        

        // Log successful execution
        const duration = Date.now() - startTime
        await logActionExecution('getSimilarListingsApiV1RecommendationsSimilarListingIdGet', true, duration, {
          method: 'GET',
          path: '/api/v1/recommendations/similar/{listing_id}'
        })
        
        return response.data
      } catch (error) {

        const duration = Date.now() - startTime

        // Enhanced error logging
        await logActionExecution('getSimilarListingsApiV1RecommendationsSimilarListingIdGet', false, duration, {
          method: 'GET',
          path: '/api/v1/recommendations/similar/{listing_id}',
          error: error instanceof Error ? error.message : 'Unknown error'
        })
        
        // Throw enhanced error with context
        throw new ActionExecutionError(
          error instanceof Error ? error.message : 'Unknown error occurred',
          {
            endpoint: '/api/v1/recommendations/similar/{listing_id}',
            method: 'GET',
            timestamp: Date.now()
          },
          error
        )
      }
    })
)

/**
 * Get Trending Listings
 * @generated from GET /api/v1/recommendations/trending
 * Features: React cache, input validation, error handling
 */
export const getTrendingListingsApiV1RecommendationsTrendingGet = cache(
  authActionClient
    .metadata({
      name: "get-trending-listings-api-v1-recommendations-trending-get",
      requiresAuth: true
    })
    .schema(GetTrendingListingsApiV1RecommendationsTrendingGetParamsSchema)
    .action(async ({ parsedInput, ctx }: { parsedInput: z.infer<typeof GetTrendingListingsApiV1RecommendationsTrendingGetParamsSchema>; ctx: { user?: any; ratelimit?: { remaining: number } } }) => {
      const startTime = Date.now()
      
      try {
      // Validate and sanitize parameters
      const validatedParams = await validateAndSanitizeInput(GetTrendingListingsApiV1RecommendationsTrendingGetParamsSchema, parsedInput) as z.infer<typeof GetTrendingListingsApiV1RecommendationsTrendingGetParamsSchema>

        // Execute API call with enhanced error handling
        const response = await apiClient.recommendations.getTrendingListingsApiV1RecommendationsTrendingGet({params: {
query: validatedParams.query,
    },
          config: {
            timeout: 30000,
            retries: 3,
            validateResponse: false,
            responseSchema: GetTrendingListingsApiV1RecommendationsTrendingGetResponseSchema
          }
        })
        

        // Log successful execution
        const duration = Date.now() - startTime
        await logActionExecution('getTrendingListingsApiV1RecommendationsTrendingGet', true, duration, {
          method: 'GET',
          path: '/api/v1/recommendations/trending'
        })
        
        return response.data
      } catch (error) {

        const duration = Date.now() - startTime

        // Enhanced error logging
        await logActionExecution('getTrendingListingsApiV1RecommendationsTrendingGet', false, duration, {
          method: 'GET',
          path: '/api/v1/recommendations/trending',
          error: error instanceof Error ? error.message : 'Unknown error'
        })
        
        // Throw enhanced error with context
        throw new ActionExecutionError(
          error instanceof Error ? error.message : 'Unknown error occurred',
          {
            endpoint: '/api/v1/recommendations/trending',
            method: 'GET',
            timestamp: Date.now()
          },
          error
        )
      }
    })
)

/**
 * Get Ml Recommendations
 * @generated from GET /api/v1/recommendations/ml/for-me
 * Features: React cache, input validation, error handling
 */
export const getMlRecommendationsApiV1RecommendationsMlForMeGet = cache(
  authActionClient
    .metadata({
      name: "get-ml-recommendations-api-v1-recommendations-ml-for-me-get",
      requiresAuth: true
    })
    .schema(GetMlRecommendationsApiV1RecommendationsMlForMeGetParamsSchema)
    .action(async ({ parsedInput, ctx }: { parsedInput: z.infer<typeof GetMlRecommendationsApiV1RecommendationsMlForMeGetParamsSchema>; ctx: { user?: any; ratelimit?: { remaining: number } } }) => {
      const startTime = Date.now()
      
      try {
      // Validate and sanitize parameters
      const validatedParams = await validateAndSanitizeInput(GetMlRecommendationsApiV1RecommendationsMlForMeGetParamsSchema, parsedInput) as z.infer<typeof GetMlRecommendationsApiV1RecommendationsMlForMeGetParamsSchema>

        // Execute API call with enhanced error handling
        const response = await apiClient.recommendations.getMlRecommendationsApiV1RecommendationsMlForMeGet({params: {
query: validatedParams.query,
    },
          config: {
            timeout: 30000,
            retries: 3,
            validateResponse: false,
            responseSchema: GetMlRecommendationsApiV1RecommendationsMlForMeGetResponseSchema
          }
        })
        

        // Log successful execution
        const duration = Date.now() - startTime
        await logActionExecution('getMlRecommendationsApiV1RecommendationsMlForMeGet', true, duration, {
          method: 'GET',
          path: '/api/v1/recommendations/ml/for-me'
        })
        
        return response.data
      } catch (error) {

        const duration = Date.now() - startTime

        // Enhanced error logging
        await logActionExecution('getMlRecommendationsApiV1RecommendationsMlForMeGet', false, duration, {
          method: 'GET',
          path: '/api/v1/recommendations/ml/for-me',
          error: error instanceof Error ? error.message : 'Unknown error'
        })
        
        // Throw enhanced error with context
        throw new ActionExecutionError(
          error instanceof Error ? error.message : 'Unknown error occurred',
          {
            endpoint: '/api/v1/recommendations/ml/for-me',
            method: 'GET',
            timestamp: Date.now()
          },
          error
        )
      }
    })
)

/**
 * Explain Recommendation
 * @generated from GET /api/v1/recommendations/ml/explain/{listing_id}
 * Features: React cache, input validation, error handling
 */
export const explainRecommendationApiV1RecommendationsMlExplainListingIdGet = cache(
  authActionClient
    .metadata({
      name: "explain-recommendation-api-v1-recommendations-ml-explain-listing-id-get",
      requiresAuth: true
    })
    .schema(ExplainRecommendationApiV1RecommendationsMlExplainListingIdGetParamsSchema)
    .action(async ({ parsedInput, ctx }: { parsedInput: z.infer<typeof ExplainRecommendationApiV1RecommendationsMlExplainListingIdGetParamsSchema>; ctx: { user?: any; ratelimit?: { remaining: number } } }) => {
      const startTime = Date.now()
      
      try {
      // Validate and sanitize parameters
      const validatedParams = await validateAndSanitizeInput(ExplainRecommendationApiV1RecommendationsMlExplainListingIdGetParamsSchema, parsedInput) as z.infer<typeof ExplainRecommendationApiV1RecommendationsMlExplainListingIdGetParamsSchema>

        // Execute API call with enhanced error handling
        const response = await apiClient.recommendations.explainRecommendationApiV1RecommendationsMlExplainListingIdGet({params: {
path: {
        listing_id: validatedParams.path.listing_id
      }
    },
          config: {
            timeout: 30000,
            retries: 3,
            validateResponse: false,
            responseSchema: ExplainRecommendationApiV1RecommendationsMlExplainListingIdGetResponseSchema
          }
        })
        

        // Log successful execution
        const duration = Date.now() - startTime
        await logActionExecution('explainRecommendationApiV1RecommendationsMlExplainListingIdGet', true, duration, {
          method: 'GET',
          path: '/api/v1/recommendations/ml/explain/{listing_id}'
        })
        
        return response.data
      } catch (error) {

        const duration = Date.now() - startTime

        // Enhanced error logging
        await logActionExecution('explainRecommendationApiV1RecommendationsMlExplainListingIdGet', false, duration, {
          method: 'GET',
          path: '/api/v1/recommendations/ml/explain/{listing_id}',
          error: error instanceof Error ? error.message : 'Unknown error'
        })
        
        // Throw enhanced error with context
        throw new ActionExecutionError(
          error instanceof Error ? error.message : 'Unknown error occurred',
          {
            endpoint: '/api/v1/recommendations/ml/explain/{listing_id}',
            method: 'GET',
            timestamp: Date.now()
          },
          error
        )
      }
    })
)

/**
 * Train Recommendation Model
 * @generated from POST /api/v1/recommendations/ml/train
 * Features: Input validation, revalidation, error handling
 */
export const trainRecommendationModelApiV1RecommendationsMlTrainPost = authActionClient
  .metadata({
    name: "train-recommendation-model-api-v1-recommendations-ml-train-post",
    requiresAuth: true
  })
  .schema(TrainRecommendationModelApiV1RecommendationsMlTrainPostParamsSchema)
  .action(async ({ parsedInput, ctx }: { parsedInput: z.infer<typeof TrainRecommendationModelApiV1RecommendationsMlTrainPostParamsSchema>; ctx: { user?: any; ratelimit?: { remaining: number } } }) => {
    const startTime = Date.now()
    
    try {
      // Validate and sanitize parameters
      const validatedParams = await validateAndSanitizeInput(TrainRecommendationModelApiV1RecommendationsMlTrainPostParamsSchema, parsedInput) as z.infer<typeof TrainRecommendationModelApiV1RecommendationsMlTrainPostParamsSchema>

      // Execute API call with enhanced configuration
      const response = await apiClient.recommendations.trainRecommendationModelApiV1RecommendationsMlTrainPost({params: {
query: validatedParams.query,
    },
        config: {
          timeout: 30000,
          retries: 3,
          validateResponse: false,
          responseSchema: TrainRecommendationModelApiV1RecommendationsMlTrainPostResponseSchema
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
      updateTag('Recommendations')
      console.log('Updated tag: Recommendations')


      // Log successful execution
      const duration = Date.now() - startTime
      await logActionExecution('trainRecommendationModelApiV1RecommendationsMlTrainPost', true, duration, {
        method: 'POST',
        path: '/api/v1/recommendations/ml/train'
      })
      
      return response.data
    } catch (error) {

      const duration = Date.now() - startTime

      // Enhanced error logging
      await logActionExecution('trainRecommendationModelApiV1RecommendationsMlTrainPost', false, duration, {
        method: 'POST',
        path: '/api/v1/recommendations/ml/train',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      
      // Throw enhanced error with context
      throw new ActionExecutionError(
        error instanceof Error ? error.message : 'Unknown error occurred',
        {
          endpoint: '/api/v1/recommendations/ml/train',
          method: 'POST',
          timestamp: Date.now()
        },
        error
      )
    }
  })