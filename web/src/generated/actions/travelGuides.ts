'use server'
import { z } from 'zod'
import { cache } from 'react'
import { updateTag } from 'next/cache'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { apiClient } from '@/generated/client'
import { actionClientWithMeta, authActionClient, ActionError } from '@/generated/lib/safe-action'
import {
  GetGuidesApiV1TravelGuidesGetParamsSchema,
  GetGuidesApiV1TravelGuidesGetResponseSchema,
  CreateGuideApiV1TravelGuidesPostRequestSchema,
  CreateGuideApiV1TravelGuidesPostResponseSchema,
  PublishGuideApiV1TravelGuidesGuideIdPublishPostParamsSchema,
  PublishGuideApiV1TravelGuidesGuideIdPublishPostResponseSchema,
  GetGuideApiV1TravelGuidesGuideIdGetParamsSchema,
  GetGuideApiV1TravelGuidesGuideIdGetResponseSchema,
  BookmarkGuideApiV1TravelGuidesGuideIdBookmarkPostParamsSchema,
  BookmarkGuideApiV1TravelGuidesGuideIdBookmarkPostResponseSchema,
  LikeGuideApiV1TravelGuidesGuideIdLikePostParamsSchema,
  LikeGuideApiV1TravelGuidesGuideIdLikePostResponseSchema,
  GetStoriesApiV1TravelGuidesStoriesGetParamsSchema,
  GetStoriesApiV1TravelGuidesStoriesGetResponseSchema,
  CreateStoryApiV1TravelGuidesStoriesPostRequestSchema,
  CreateStoryApiV1TravelGuidesStoriesPostResponseSchema,
  PublishStoryApiV1TravelGuidesStoriesStoryIdPublishPostParamsSchema,
  PublishStoryApiV1TravelGuidesStoriesStoryIdPublishPostResponseSchema,
  GetStoryApiV1TravelGuidesStoriesStoryIdGetParamsSchema,
  GetStoryApiV1TravelGuidesStoriesStoryIdGetResponseSchema
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

// Helper to get current time after accessing request data (required by Next.js 16)
// This ensures we access request data before using Date.now()
// Note: During prerendering, headers() rejects, so we handle that gracefully
async function getCurrentTime(): Promise<number> {
  try {
    // Access headers first to satisfy Next.js 16 requirement for non-prerendered requests
    // This will reject during prerendering with HANGING_PROMISE_REJECTION
    const headersList = await headers()
    // If headers() succeeds, we've accessed request data, so Date.now() is safe
    return Date.now()
  } catch (error) {
    // During prerendering, headers() rejects with HANGING_PROMISE_REJECTION
    // In this case, we can safely use Date.now() because we're in a static/prerendered context
    // where time-based functions are allowed
    if (error && typeof error === 'object' && 'digest' in error && error.digest === 'HANGING_PROMISE_REJECTION') {
      // This is prerendering - Date.now() is safe here
      return Date.now()
    }
    // For other errors, still use Date.now() as fallback
    return Date.now()
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
 * Get Guides
 * @generated from GET /api/v1/travel-guides
 * Features: React cache, input validation, error handling
 */
export const getGuidesApiV1TravelGuidesGet = cache(
  actionClientWithMeta
    .metadata({
      name: "get-guides-api-v1-travel-guides-get",
      requiresAuth: false
    })
    .schema(GetGuidesApiV1TravelGuidesGetParamsSchema)
    .action(async ({ parsedInput, ctx }: { parsedInput: z.infer<typeof GetGuidesApiV1TravelGuidesGetParamsSchema>; ctx?: any }) => {
      const startTime = await getCurrentTime()
      
      try {
      // Validate and sanitize parameters
      const validatedParams = await validateAndSanitizeInput(GetGuidesApiV1TravelGuidesGetParamsSchema, parsedInput) as z.infer<typeof GetGuidesApiV1TravelGuidesGetParamsSchema>

        // Execute API call with enhanced error handling
        const response = await apiClient.travelGuides.getGuidesApiV1TravelGuidesGet({params: {
query: validatedParams.query,
    },
          config: {
            timeout: 30000,
            retries: 3,
            validateResponse: false,
            responseSchema: GetGuidesApiV1TravelGuidesGetResponseSchema
          }
        })
        

        // Log successful execution
        const duration = (await getCurrentTime()) - startTime
        await logActionExecution('getGuidesApiV1TravelGuidesGet', true, duration, {
          method: 'GET',
          path: '/api/v1/travel-guides'
        })
        
        return response.data
      } catch (error) {

        const duration = (await getCurrentTime()) - startTime

        // Enhanced error logging
        await logActionExecution('getGuidesApiV1TravelGuidesGet', false, duration, {
          method: 'GET',
          path: '/api/v1/travel-guides',
          error: error instanceof Error ? error.message : 'Unknown error'
        })
        
        // Throw enhanced error with context
        throw new ActionExecutionError(
          error instanceof Error ? error.message : 'Unknown error occurred',
          {
            endpoint: '/api/v1/travel-guides',
            method: 'GET',
            timestamp: await getCurrentTime()
          },
          error
        )
      }
    })
)

/**
 * Create Guide
 * @generated from POST /api/v1/travel-guides
 * Features: Input validation, revalidation, error handling
 */
export const createGuideApiV1TravelGuidesPost = authActionClient
  .metadata({
    name: "create-guide-api-v1-travel-guides-post",
    requiresAuth: true
  })
  .schema(CreateGuideApiV1TravelGuidesPostRequestSchema)
  .action(async ({ parsedInput, ctx }: { parsedInput: z.infer<typeof CreateGuideApiV1TravelGuidesPostRequestSchema>; ctx: { user?: any; ratelimit?: { remaining: number } } }) => {
    const startTime = await getCurrentTime()
    
    try {
      // Validate and sanitize request body
      const validatedBody = await validateAndSanitizeInput(CreateGuideApiV1TravelGuidesPostRequestSchema, parsedInput)

      // Execute API call with enhanced configuration
      const response = await apiClient.travelGuides.createGuideApiV1TravelGuidesPost({body: validatedBody,
        config: {
          timeout: 30000,
          retries: 3,
          validateResponse: false,
          responseSchema: CreateGuideApiV1TravelGuidesPostResponseSchema
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
      updateTag('Travel Guides')
      console.log('Updated tag: Travel Guides')


      // Log successful execution
      const duration = Date.now() - startTime
      await logActionExecution('createGuideApiV1TravelGuidesPost', true, duration, {
        method: 'POST',
        path: '/api/v1/travel-guides'
      })
      
      return response.data
    } catch (error) {

      const duration = Date.now() - startTime

      // Enhanced error logging
      await logActionExecution('createGuideApiV1TravelGuidesPost', false, duration, {
        method: 'POST',
        path: '/api/v1/travel-guides',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      
      // Throw enhanced error with context
      throw new ActionExecutionError(
        error instanceof Error ? error.message : 'Unknown error occurred',
        {
          endpoint: '/api/v1/travel-guides',
          method: 'POST',
          timestamp: Date.now()
        },
        error
      )
    }
  })

/**
 * Publish Guide
 * @generated from POST /api/v1/travel-guides/{guide_id}/publish
 * Features: Input validation, revalidation, error handling
 */
export const publishGuideApiV1TravelGuidesGuideIdPublishPost = authActionClient
  .metadata({
    name: "publish-guide-api-v1-travel-guides-guide-id-publish-post",
    requiresAuth: true
  })
  .schema(PublishGuideApiV1TravelGuidesGuideIdPublishPostParamsSchema)
  .action(async ({ parsedInput, ctx }: { parsedInput: z.infer<typeof PublishGuideApiV1TravelGuidesGuideIdPublishPostParamsSchema>; ctx: { user?: any; ratelimit?: { remaining: number } } }) => {
    const startTime = await getCurrentTime()
    
    try {
      // Validate and sanitize parameters
      const validatedParams = await validateAndSanitizeInput(PublishGuideApiV1TravelGuidesGuideIdPublishPostParamsSchema, parsedInput) as z.infer<typeof PublishGuideApiV1TravelGuidesGuideIdPublishPostParamsSchema>

      // Execute API call with enhanced configuration
      const response = await apiClient.travelGuides.publishGuideApiV1TravelGuidesGuideIdPublishPost({params: {
path: {
        guide_id: validatedParams.path.guide_id
      }
    },
        config: {
          timeout: 30000,
          retries: 3,
          validateResponse: false,
          responseSchema: PublishGuideApiV1TravelGuidesGuideIdPublishPostResponseSchema
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
      updateTag('Travel Guides')
      console.log('Updated tag: Travel Guides')


      // Log successful execution
      const duration = Date.now() - startTime
      await logActionExecution('publishGuideApiV1TravelGuidesGuideIdPublishPost', true, duration, {
        method: 'POST',
        path: '/api/v1/travel-guides/{guide_id}/publish'
      })
      
      return response.data
    } catch (error) {

      const duration = Date.now() - startTime

      // Enhanced error logging
      await logActionExecution('publishGuideApiV1TravelGuidesGuideIdPublishPost', false, duration, {
        method: 'POST',
        path: '/api/v1/travel-guides/{guide_id}/publish',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      
      // Throw enhanced error with context
      throw new ActionExecutionError(
        error instanceof Error ? error.message : 'Unknown error occurred',
        {
          endpoint: '/api/v1/travel-guides/{guide_id}/publish',
          method: 'POST',
          timestamp: Date.now()
        },
        error
      )
    }
  })

/**
 * Get Guide
 * @generated from GET /api/v1/travel-guides/{guide_id}
 * Features: React cache, input validation, error handling
 */
export const getGuideApiV1TravelGuidesGuideIdGet = cache(
  actionClientWithMeta
    .metadata({
      name: "get-guide-api-v1-travel-guides-guide-id-get",
      requiresAuth: false
    })
    .schema(GetGuideApiV1TravelGuidesGuideIdGetParamsSchema)
    .action(async ({ parsedInput, ctx }: { parsedInput: z.infer<typeof GetGuideApiV1TravelGuidesGuideIdGetParamsSchema>; ctx?: any }) => {
      const startTime = await getCurrentTime()
      
      try {
      // Validate and sanitize parameters
      const validatedParams = await validateAndSanitizeInput(GetGuideApiV1TravelGuidesGuideIdGetParamsSchema, parsedInput) as z.infer<typeof GetGuideApiV1TravelGuidesGuideIdGetParamsSchema>

        // Execute API call with enhanced error handling
        const response = await apiClient.travelGuides.getGuideApiV1TravelGuidesGuideIdGet({params: {
path: {
        guide_id: validatedParams.path.guide_id
      }
    },
          config: {
            timeout: 30000,
            retries: 3,
            validateResponse: false,
            responseSchema: GetGuideApiV1TravelGuidesGuideIdGetResponseSchema
          }
        })
        

        // Log successful execution
        const duration = (await getCurrentTime()) - startTime
        await logActionExecution('getGuideApiV1TravelGuidesGuideIdGet', true, duration, {
          method: 'GET',
          path: '/api/v1/travel-guides/{guide_id}'
        })
        
        return response.data
      } catch (error) {

        const duration = (await getCurrentTime()) - startTime

        // Enhanced error logging
        await logActionExecution('getGuideApiV1TravelGuidesGuideIdGet', false, duration, {
          method: 'GET',
          path: '/api/v1/travel-guides/{guide_id}',
          error: error instanceof Error ? error.message : 'Unknown error'
        })
        
        // Throw enhanced error with context
        throw new ActionExecutionError(
          error instanceof Error ? error.message : 'Unknown error occurred',
          {
            endpoint: '/api/v1/travel-guides/{guide_id}',
            method: 'GET',
            timestamp: await getCurrentTime()
          },
          error
        )
      }
    })
)

/**
 * Bookmark Guide
 * @generated from POST /api/v1/travel-guides/{guide_id}/bookmark
 * Features: Input validation, revalidation, error handling
 */
export const bookmarkGuideApiV1TravelGuidesGuideIdBookmarkPost = authActionClient
  .metadata({
    name: "bookmark-guide-api-v1-travel-guides-guide-id-bookmark-post",
    requiresAuth: true
  })
  .schema(BookmarkGuideApiV1TravelGuidesGuideIdBookmarkPostParamsSchema)
  .action(async ({ parsedInput, ctx }: { parsedInput: z.infer<typeof BookmarkGuideApiV1TravelGuidesGuideIdBookmarkPostParamsSchema>; ctx: { user?: any; ratelimit?: { remaining: number } } }) => {
    const startTime = await getCurrentTime()
    
    try {
      // Validate and sanitize parameters
      const validatedParams = await validateAndSanitizeInput(BookmarkGuideApiV1TravelGuidesGuideIdBookmarkPostParamsSchema, parsedInput) as z.infer<typeof BookmarkGuideApiV1TravelGuidesGuideIdBookmarkPostParamsSchema>

      // Execute API call with enhanced configuration
      const response = await apiClient.travelGuides.bookmarkGuideApiV1TravelGuidesGuideIdBookmarkPost({params: {
path: {
        guide_id: validatedParams.path.guide_id
      }
    },
        config: {
          timeout: 30000,
          retries: 3,
          validateResponse: false,
          responseSchema: BookmarkGuideApiV1TravelGuidesGuideIdBookmarkPostResponseSchema
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
      updateTag('Travel Guides')
      console.log('Updated tag: Travel Guides')


      // Log successful execution
      const duration = Date.now() - startTime
      await logActionExecution('bookmarkGuideApiV1TravelGuidesGuideIdBookmarkPost', true, duration, {
        method: 'POST',
        path: '/api/v1/travel-guides/{guide_id}/bookmark'
      })
      
      return response.data
    } catch (error) {

      const duration = Date.now() - startTime

      // Enhanced error logging
      await logActionExecution('bookmarkGuideApiV1TravelGuidesGuideIdBookmarkPost', false, duration, {
        method: 'POST',
        path: '/api/v1/travel-guides/{guide_id}/bookmark',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      
      // Throw enhanced error with context
      throw new ActionExecutionError(
        error instanceof Error ? error.message : 'Unknown error occurred',
        {
          endpoint: '/api/v1/travel-guides/{guide_id}/bookmark',
          method: 'POST',
          timestamp: Date.now()
        },
        error
      )
    }
  })

/**
 * Like Guide
 * @generated from POST /api/v1/travel-guides/{guide_id}/like
 * Features: Input validation, revalidation, error handling
 */
export const likeGuideApiV1TravelGuidesGuideIdLikePost = authActionClient
  .metadata({
    name: "like-guide-api-v1-travel-guides-guide-id-like-post",
    requiresAuth: true
  })
  .schema(LikeGuideApiV1TravelGuidesGuideIdLikePostParamsSchema)
  .action(async ({ parsedInput, ctx }: { parsedInput: z.infer<typeof LikeGuideApiV1TravelGuidesGuideIdLikePostParamsSchema>; ctx: { user?: any; ratelimit?: { remaining: number } } }) => {
    const startTime = await getCurrentTime()
    
    try {
      // Validate and sanitize parameters
      const validatedParams = await validateAndSanitizeInput(LikeGuideApiV1TravelGuidesGuideIdLikePostParamsSchema, parsedInput) as z.infer<typeof LikeGuideApiV1TravelGuidesGuideIdLikePostParamsSchema>

      // Execute API call with enhanced configuration
      const response = await apiClient.travelGuides.likeGuideApiV1TravelGuidesGuideIdLikePost({params: {
path: {
        guide_id: validatedParams.path.guide_id
      }
    },
        config: {
          timeout: 30000,
          retries: 3,
          validateResponse: false,
          responseSchema: LikeGuideApiV1TravelGuidesGuideIdLikePostResponseSchema
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
      updateTag('Travel Guides')
      console.log('Updated tag: Travel Guides')


      // Log successful execution
      const duration = Date.now() - startTime
      await logActionExecution('likeGuideApiV1TravelGuidesGuideIdLikePost', true, duration, {
        method: 'POST',
        path: '/api/v1/travel-guides/{guide_id}/like'
      })
      
      return response.data
    } catch (error) {

      const duration = Date.now() - startTime

      // Enhanced error logging
      await logActionExecution('likeGuideApiV1TravelGuidesGuideIdLikePost', false, duration, {
        method: 'POST',
        path: '/api/v1/travel-guides/{guide_id}/like',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      
      // Throw enhanced error with context
      throw new ActionExecutionError(
        error instanceof Error ? error.message : 'Unknown error occurred',
        {
          endpoint: '/api/v1/travel-guides/{guide_id}/like',
          method: 'POST',
          timestamp: Date.now()
        },
        error
      )
    }
  })

/**
 * Get Stories
 * @generated from GET /api/v1/travel-guides/stories
 * Features: React cache, input validation, error handling
 */
export const getStoriesApiV1TravelGuidesStoriesGet = cache(
  actionClientWithMeta
    .metadata({
      name: "get-stories-api-v1-travel-guides-stories-get",
      requiresAuth: false
    })
    .schema(GetStoriesApiV1TravelGuidesStoriesGetParamsSchema)
    .action(async ({ parsedInput, ctx }: { parsedInput: z.infer<typeof GetStoriesApiV1TravelGuidesStoriesGetParamsSchema>; ctx?: any }) => {
      const startTime = await getCurrentTime()
      
      try {
      // Validate and sanitize parameters
      const validatedParams = await validateAndSanitizeInput(GetStoriesApiV1TravelGuidesStoriesGetParamsSchema, parsedInput) as z.infer<typeof GetStoriesApiV1TravelGuidesStoriesGetParamsSchema>

        // Execute API call with enhanced error handling
        const response = await apiClient.travelGuides.getStoriesApiV1TravelGuidesStoriesGet({params: {
query: validatedParams.query,
    },
          config: {
            timeout: 30000,
            retries: 3,
            validateResponse: false,
            responseSchema: GetStoriesApiV1TravelGuidesStoriesGetResponseSchema
          }
        })
        

        // Log successful execution
        const duration = (await getCurrentTime()) - startTime
        await logActionExecution('getStoriesApiV1TravelGuidesStoriesGet', true, duration, {
          method: 'GET',
          path: '/api/v1/travel-guides/stories'
        })
        
        return response.data
      } catch (error) {

        const duration = (await getCurrentTime()) - startTime

        // Enhanced error logging
        await logActionExecution('getStoriesApiV1TravelGuidesStoriesGet', false, duration, {
          method: 'GET',
          path: '/api/v1/travel-guides/stories',
          error: error instanceof Error ? error.message : 'Unknown error'
        })
        
        // Throw enhanced error with context
        throw new ActionExecutionError(
          error instanceof Error ? error.message : 'Unknown error occurred',
          {
            endpoint: '/api/v1/travel-guides/stories',
            method: 'GET',
            timestamp: await getCurrentTime()
          },
          error
        )
      }
    })
)

/**
 * Create Story
 * @generated from POST /api/v1/travel-guides/stories
 * Features: Input validation, revalidation, error handling
 */
export const createStoryApiV1TravelGuidesStoriesPost = authActionClient
  .metadata({
    name: "create-story-api-v1-travel-guides-stories-post",
    requiresAuth: true
  })
  .schema(CreateStoryApiV1TravelGuidesStoriesPostRequestSchema)
  .action(async ({ parsedInput, ctx }: { parsedInput: z.infer<typeof CreateStoryApiV1TravelGuidesStoriesPostRequestSchema>; ctx: { user?: any; ratelimit?: { remaining: number } } }) => {
    const startTime = await getCurrentTime()
    
    try {
      // Validate and sanitize request body
      const validatedBody = await validateAndSanitizeInput(CreateStoryApiV1TravelGuidesStoriesPostRequestSchema, parsedInput)

      // Execute API call with enhanced configuration
      const response = await apiClient.travelGuides.createStoryApiV1TravelGuidesStoriesPost({body: validatedBody,
        config: {
          timeout: 30000,
          retries: 3,
          validateResponse: false,
          responseSchema: CreateStoryApiV1TravelGuidesStoriesPostResponseSchema
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
      updateTag('Travel Guides')
      console.log('Updated tag: Travel Guides')


      // Log successful execution
      const duration = Date.now() - startTime
      await logActionExecution('createStoryApiV1TravelGuidesStoriesPost', true, duration, {
        method: 'POST',
        path: '/api/v1/travel-guides/stories'
      })
      
      return response.data
    } catch (error) {

      const duration = Date.now() - startTime

      // Enhanced error logging
      await logActionExecution('createStoryApiV1TravelGuidesStoriesPost', false, duration, {
        method: 'POST',
        path: '/api/v1/travel-guides/stories',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      
      // Throw enhanced error with context
      throw new ActionExecutionError(
        error instanceof Error ? error.message : 'Unknown error occurred',
        {
          endpoint: '/api/v1/travel-guides/stories',
          method: 'POST',
          timestamp: Date.now()
        },
        error
      )
    }
  })

/**
 * Publish Story
 * @generated from POST /api/v1/travel-guides/stories/{story_id}/publish
 * Features: Input validation, revalidation, error handling
 */
export const publishStoryApiV1TravelGuidesStoriesStoryIdPublishPost = authActionClient
  .metadata({
    name: "publish-story-api-v1-travel-guides-stories-story-id-publish-post",
    requiresAuth: true
  })
  .schema(PublishStoryApiV1TravelGuidesStoriesStoryIdPublishPostParamsSchema)
  .action(async ({ parsedInput, ctx }: { parsedInput: z.infer<typeof PublishStoryApiV1TravelGuidesStoriesStoryIdPublishPostParamsSchema>; ctx: { user?: any; ratelimit?: { remaining: number } } }) => {
    const startTime = await getCurrentTime()
    
    try {
      // Validate and sanitize parameters
      const validatedParams = await validateAndSanitizeInput(PublishStoryApiV1TravelGuidesStoriesStoryIdPublishPostParamsSchema, parsedInput) as z.infer<typeof PublishStoryApiV1TravelGuidesStoriesStoryIdPublishPostParamsSchema>

      // Execute API call with enhanced configuration
      const response = await apiClient.travelGuides.publishStoryApiV1TravelGuidesStoriesStoryIdPublishPost({params: {
path: {
        story_id: validatedParams.path.story_id
      }
    },
        config: {
          timeout: 30000,
          retries: 3,
          validateResponse: false,
          responseSchema: PublishStoryApiV1TravelGuidesStoriesStoryIdPublishPostResponseSchema
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
      updateTag('Travel Guides')
      console.log('Updated tag: Travel Guides')


      // Log successful execution
      const duration = Date.now() - startTime
      await logActionExecution('publishStoryApiV1TravelGuidesStoriesStoryIdPublishPost', true, duration, {
        method: 'POST',
        path: '/api/v1/travel-guides/stories/{story_id}/publish'
      })
      
      return response.data
    } catch (error) {

      const duration = Date.now() - startTime

      // Enhanced error logging
      await logActionExecution('publishStoryApiV1TravelGuidesStoriesStoryIdPublishPost', false, duration, {
        method: 'POST',
        path: '/api/v1/travel-guides/stories/{story_id}/publish',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      
      // Throw enhanced error with context
      throw new ActionExecutionError(
        error instanceof Error ? error.message : 'Unknown error occurred',
        {
          endpoint: '/api/v1/travel-guides/stories/{story_id}/publish',
          method: 'POST',
          timestamp: Date.now()
        },
        error
      )
    }
  })

/**
 * Get Story
 * @generated from GET /api/v1/travel-guides/stories/{story_id}
 * Features: React cache, input validation, error handling
 */
export const getStoryApiV1TravelGuidesStoriesStoryIdGet = cache(
  actionClientWithMeta
    .metadata({
      name: "get-story-api-v1-travel-guides-stories-story-id-get",
      requiresAuth: false
    })
    .schema(GetStoryApiV1TravelGuidesStoriesStoryIdGetParamsSchema)
    .action(async ({ parsedInput, ctx }: { parsedInput: z.infer<typeof GetStoryApiV1TravelGuidesStoriesStoryIdGetParamsSchema>; ctx?: any }) => {
      const startTime = await getCurrentTime()
      
      try {
      // Validate and sanitize parameters
      const validatedParams = await validateAndSanitizeInput(GetStoryApiV1TravelGuidesStoriesStoryIdGetParamsSchema, parsedInput) as z.infer<typeof GetStoryApiV1TravelGuidesStoriesStoryIdGetParamsSchema>

        // Execute API call with enhanced error handling
        const response = await apiClient.travelGuides.getStoryApiV1TravelGuidesStoriesStoryIdGet({params: {
path: {
        story_id: validatedParams.path.story_id
      }
    },
          config: {
            timeout: 30000,
            retries: 3,
            validateResponse: false,
            responseSchema: GetStoryApiV1TravelGuidesStoriesStoryIdGetResponseSchema
          }
        })
        

        // Log successful execution
        const duration = (await getCurrentTime()) - startTime
        await logActionExecution('getStoryApiV1TravelGuidesStoriesStoryIdGet', true, duration, {
          method: 'GET',
          path: '/api/v1/travel-guides/stories/{story_id}'
        })
        
        return response.data
      } catch (error) {

        const duration = (await getCurrentTime()) - startTime

        // Enhanced error logging
        await logActionExecution('getStoryApiV1TravelGuidesStoriesStoryIdGet', false, duration, {
          method: 'GET',
          path: '/api/v1/travel-guides/stories/{story_id}',
          error: error instanceof Error ? error.message : 'Unknown error'
        })
        
        // Throw enhanced error with context
        throw new ActionExecutionError(
          error instanceof Error ? error.message : 'Unknown error occurred',
          {
            endpoint: '/api/v1/travel-guides/stories/{story_id}',
            method: 'GET',
            timestamp: await getCurrentTime()
          },
          error
        )
      }
    })
)