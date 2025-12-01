'use server'
import { z } from 'zod'
import { cache } from 'react'
import { updateTag } from 'next/cache'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { apiClient } from '@/generated/client'
import { actionClientWithMeta, authActionClient, ActionError } from '@/generated/lib/safe-action'
import {
  ListTravelPlansApiV1AiTravelPlannerGetParamsSchema,
  ListTravelPlansApiV1AiTravelPlannerGetResponseSchema,
  CreateTravelPlanApiV1AiTravelPlannerPostRequestSchema,
  CreateTravelPlanApiV1AiTravelPlannerPostResponseSchema,
  GetTravelPlanApiV1AiTravelPlannerPlanIdGetParamsSchema,
  GetTravelPlanApiV1AiTravelPlannerPlanIdGetResponseSchema
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
 * List Travel Plans
 * @generated from GET /api/v1/ai/travel-planner
 * Features: React cache, input validation, error handling
 */
export const listTravelPlansApiV1AiTravelPlannerGet = cache(
  authActionClient
    .metadata({
      name: "list-travel-plans-api-v1-ai-travel-planner-get",
      requiresAuth: true
    })
    .schema(ListTravelPlansApiV1AiTravelPlannerGetParamsSchema)
    .action(async ({ parsedInput, ctx }: { parsedInput: z.infer<typeof ListTravelPlansApiV1AiTravelPlannerGetParamsSchema>; ctx: { user?: any; ratelimit?: { remaining: number } } }) => {
      const startTime = Date.now()
      
      try {
      // Validate and sanitize parameters
      const validatedParams = await validateAndSanitizeInput(ListTravelPlansApiV1AiTravelPlannerGetParamsSchema, parsedInput) as z.infer<typeof ListTravelPlansApiV1AiTravelPlannerGetParamsSchema>

        // Execute API call with enhanced error handling
        const response = await apiClient.aiTravelPlanner.listTravelPlansApiV1AiTravelPlannerGet({params: {
query: validatedParams.query,
    },
          config: {
            timeout: 30000,
            retries: 3,
            validateResponse: false,
            responseSchema: ListTravelPlansApiV1AiTravelPlannerGetResponseSchema
          }
        })
        

        // Log successful execution
        const duration = Date.now() - startTime
        await logActionExecution('listTravelPlansApiV1AiTravelPlannerGet', true, duration, {
          method: 'GET',
          path: '/api/v1/ai/travel-planner'
        })
        
        return response.data
      } catch (error) {

        const duration = Date.now() - startTime

        // Enhanced error logging
        await logActionExecution('listTravelPlansApiV1AiTravelPlannerGet', false, duration, {
          method: 'GET',
          path: '/api/v1/ai/travel-planner',
          error: error instanceof Error ? error.message : 'Unknown error'
        })
        
        // Throw enhanced error with context
        throw new ActionExecutionError(
          error instanceof Error ? error.message : 'Unknown error occurred',
          {
            endpoint: '/api/v1/ai/travel-planner',
            method: 'GET',
            timestamp: Date.now()
          },
          error
        )
      }
    })
)

/**
 * Create Travel Plan
 * @generated from POST /api/v1/ai/travel-planner
 * Features: Input validation, revalidation, error handling
 */
export const createTravelPlanApiV1AiTravelPlannerPost = authActionClient
  .metadata({
    name: "create-travel-plan-api-v1-ai-travel-planner-post",
    requiresAuth: true
  })
  .schema(CreateTravelPlanApiV1AiTravelPlannerPostRequestSchema)
  .action(async ({ parsedInput, ctx }: { parsedInput: z.infer<typeof CreateTravelPlanApiV1AiTravelPlannerPostRequestSchema>; ctx: { user?: any; ratelimit?: { remaining: number } } }) => {
    const startTime = Date.now()
    
    try {
      // Validate and sanitize request body
      const validatedBody = await validateAndSanitizeInput(CreateTravelPlanApiV1AiTravelPlannerPostRequestSchema, parsedInput)

      // Execute API call with enhanced configuration
      const response = await apiClient.aiTravelPlanner.createTravelPlanApiV1AiTravelPlannerPost({body: validatedBody,
        config: {
          timeout: 30000,
          retries: 3,
          validateResponse: false,
          responseSchema: CreateTravelPlanApiV1AiTravelPlannerPostResponseSchema
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
      updateTag('AI Travel Planner')
      console.log('Updated tag: AI Travel Planner')


      // Log successful execution
      const duration = Date.now() - startTime
      await logActionExecution('createTravelPlanApiV1AiTravelPlannerPost', true, duration, {
        method: 'POST',
        path: '/api/v1/ai/travel-planner'
      })
      
      return response.data
    } catch (error) {

      const duration = Date.now() - startTime

      // Enhanced error logging
      await logActionExecution('createTravelPlanApiV1AiTravelPlannerPost', false, duration, {
        method: 'POST',
        path: '/api/v1/ai/travel-planner',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      
      // Throw enhanced error with context
      throw new ActionExecutionError(
        error instanceof Error ? error.message : 'Unknown error occurred',
        {
          endpoint: '/api/v1/ai/travel-planner',
          method: 'POST',
          timestamp: Date.now()
        },
        error
      )
    }
  })

/**
 * Get Travel Plan
 * @generated from GET /api/v1/ai/travel-planner/{plan_id}
 * Features: React cache, input validation, error handling
 */
export const getTravelPlanApiV1AiTravelPlannerPlanIdGet = cache(
  authActionClient
    .metadata({
      name: "get-travel-plan-api-v1-ai-travel-planner-plan-id-get",
      requiresAuth: true
    })
    .schema(GetTravelPlanApiV1AiTravelPlannerPlanIdGetParamsSchema)
    .action(async ({ parsedInput, ctx }: { parsedInput: z.infer<typeof GetTravelPlanApiV1AiTravelPlannerPlanIdGetParamsSchema>; ctx: { user?: any; ratelimit?: { remaining: number } } }) => {
      const startTime = Date.now()
      
      try {
      // Validate and sanitize parameters
      const validatedParams = await validateAndSanitizeInput(GetTravelPlanApiV1AiTravelPlannerPlanIdGetParamsSchema, parsedInput) as z.infer<typeof GetTravelPlanApiV1AiTravelPlannerPlanIdGetParamsSchema>

        // Execute API call with enhanced error handling
        const response = await apiClient.aiTravelPlanner.getTravelPlanApiV1AiTravelPlannerPlanIdGet({params: {
path: {
        plan_id: Number(validatedParams.path.plan_id)
      }
    },
          config: {
            timeout: 30000,
            retries: 3,
            validateResponse: false,
            responseSchema: GetTravelPlanApiV1AiTravelPlannerPlanIdGetResponseSchema
          }
        })
        

        // Log successful execution
        const duration = Date.now() - startTime
        await logActionExecution('getTravelPlanApiV1AiTravelPlannerPlanIdGet', true, duration, {
          method: 'GET',
          path: '/api/v1/ai/travel-planner/{plan_id}'
        })
        
        return response.data
      } catch (error) {

        const duration = Date.now() - startTime

        // Enhanced error logging
        await logActionExecution('getTravelPlanApiV1AiTravelPlannerPlanIdGet', false, duration, {
          method: 'GET',
          path: '/api/v1/ai/travel-planner/{plan_id}',
          error: error instanceof Error ? error.message : 'Unknown error'
        })
        
        // Throw enhanced error with context
        throw new ActionExecutionError(
          error instanceof Error ? error.message : 'Unknown error occurred',
          {
            endpoint: '/api/v1/ai/travel-planner/{plan_id}',
            method: 'GET',
            timestamp: Date.now()
          },
          error
        )
      }
    })
)