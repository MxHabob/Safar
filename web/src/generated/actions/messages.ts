'use server'
import { z } from 'zod'
import { cache } from 'react'
import { updateTag } from 'next/cache'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { apiClient } from '@/generated/client'
import { actionClientWithMeta, authActionClient, ActionError } from '@/generated/lib/safe-action'
import {
  CreateMessageApiV1MessagesPostRequestSchema,
  CreateMessageApiV1MessagesPostResponseSchema,
  GetConversationsApiV1MessagesConversationsGetParamsSchema,
  GetConversationsApiV1MessagesConversationsGetResponseSchema,
  CreateConversationApiV1MessagesConversationsPostRequestSchema,
  CreateConversationApiV1MessagesConversationsPostResponseSchema,
  GetConversationApiV1MessagesConversationsConversationIdGetParamsSchema,
  GetConversationApiV1MessagesConversationsConversationIdGetResponseSchema,
  GetConversationMessagesApiV1MessagesConversationsConversationIdMessagesGetParamsSchema,
  GetConversationMessagesApiV1MessagesConversationsConversationIdMessagesGetResponseSchema,
  MarkConversationReadApiV1MessagesConversationsConversationIdReadPostParamsSchema,
  MarkConversationReadApiV1MessagesConversationsConversationIdReadPostResponseSchema,
  MarkMessageReadApiV1MessagesMessageIdReadPostParamsSchema,
  MarkMessageReadApiV1MessagesMessageIdReadPostResponseSchema
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
 * Create Message
 * @generated from POST /api/v1/messages
 * Features: Input validation, revalidation, error handling
 */
export const createMessageApiV1MessagesPost = authActionClient
  .metadata({
    name: "create-message-api-v1-messages-post",
    requiresAuth: true
  })
  .schema(CreateMessageApiV1MessagesPostRequestSchema)
  .action(async ({ parsedInput, ctx }: { parsedInput: z.infer<typeof CreateMessageApiV1MessagesPostRequestSchema>; ctx: { user?: any; ratelimit?: { remaining: number } } }) => {
    const startTime = Date.now()
    
    try {
      // Validate and sanitize request body
      const validatedBody = await validateAndSanitizeInput(CreateMessageApiV1MessagesPostRequestSchema, parsedInput)

      // Execute API call with enhanced configuration
      const response = await apiClient.messages.createMessageApiV1MessagesPost({body: validatedBody,
        config: {
          timeout: 30000,
          retries: 3,
          validateResponse: false,
          responseSchema: CreateMessageApiV1MessagesPostResponseSchema
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
      updateTag('Messages')
      console.log('Updated tag: Messages')


      // Log successful execution
      const duration = Date.now() - startTime
      await logActionExecution('createMessageApiV1MessagesPost', true, duration, {
        method: 'POST',
        path: '/api/v1/messages'
      })
      
      return response.data
    } catch (error) {

      const duration = Date.now() - startTime

      // Enhanced error logging
      await logActionExecution('createMessageApiV1MessagesPost', false, duration, {
        method: 'POST',
        path: '/api/v1/messages',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      
      // Throw enhanced error with context
      throw new ActionExecutionError(
        error instanceof Error ? error.message : 'Unknown error occurred',
        {
          endpoint: '/api/v1/messages',
          method: 'POST',
          timestamp: Date.now()
        },
        error
      )
    }
  })

/**
 * Get Conversations
 * @generated from GET /api/v1/messages/conversations
 * Features: React cache, input validation, error handling
 */
export const getConversationsApiV1MessagesConversationsGet = cache(
  authActionClient
    .metadata({
      name: "get-conversations-api-v1-messages-conversations-get",
      requiresAuth: true
    })
    .schema(GetConversationsApiV1MessagesConversationsGetParamsSchema)
    .action(async ({ parsedInput, ctx }: { parsedInput: z.infer<typeof GetConversationsApiV1MessagesConversationsGetParamsSchema>; ctx: { user?: any; ratelimit?: { remaining: number } } }) => {
      const startTime = Date.now()
      
      try {
      // Validate and sanitize parameters
      const validatedParams = await validateAndSanitizeInput(GetConversationsApiV1MessagesConversationsGetParamsSchema, parsedInput) as z.infer<typeof GetConversationsApiV1MessagesConversationsGetParamsSchema>

        // Execute API call with enhanced error handling
        const response = await apiClient.messages.getConversationsApiV1MessagesConversationsGet({params: {
query: validatedParams.query,
    },
          config: {
            timeout: 30000,
            retries: 3,
            validateResponse: false,
            responseSchema: GetConversationsApiV1MessagesConversationsGetResponseSchema
          }
        })
        

        // Log successful execution
        const duration = Date.now() - startTime
        await logActionExecution('getConversationsApiV1MessagesConversationsGet', true, duration, {
          method: 'GET',
          path: '/api/v1/messages/conversations'
        })
        
        return response.data
      } catch (error) {

        const duration = Date.now() - startTime

        // Enhanced error logging
        await logActionExecution('getConversationsApiV1MessagesConversationsGet', false, duration, {
          method: 'GET',
          path: '/api/v1/messages/conversations',
          error: error instanceof Error ? error.message : 'Unknown error'
        })
        
        // Throw enhanced error with context
        throw new ActionExecutionError(
          error instanceof Error ? error.message : 'Unknown error occurred',
          {
            endpoint: '/api/v1/messages/conversations',
            method: 'GET',
            timestamp: Date.now()
          },
          error
        )
      }
    })
)

/**
 * Create Conversation
 * @generated from POST /api/v1/messages/conversations
 * Features: Input validation, revalidation, error handling
 */
export const createConversationApiV1MessagesConversationsPost = authActionClient
  .metadata({
    name: "create-conversation-api-v1-messages-conversations-post",
    requiresAuth: true
  })
  .schema(CreateConversationApiV1MessagesConversationsPostRequestSchema)
  .action(async ({ parsedInput, ctx }: { parsedInput: z.infer<typeof CreateConversationApiV1MessagesConversationsPostRequestSchema>; ctx: { user?: any; ratelimit?: { remaining: number } } }) => {
    const startTime = Date.now()
    
    try {
      // Validate and sanitize request body
      const validatedBody = await validateAndSanitizeInput(CreateConversationApiV1MessagesConversationsPostRequestSchema, parsedInput)

      // Execute API call with enhanced configuration
      const response = await apiClient.messages.createConversationApiV1MessagesConversationsPost({body: validatedBody,
        config: {
          timeout: 30000,
          retries: 3,
          validateResponse: false,
          responseSchema: CreateConversationApiV1MessagesConversationsPostResponseSchema
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
      updateTag('Messages')
      console.log('Updated tag: Messages')


      // Log successful execution
      const duration = Date.now() - startTime
      await logActionExecution('createConversationApiV1MessagesConversationsPost', true, duration, {
        method: 'POST',
        path: '/api/v1/messages/conversations'
      })
      
      return response.data
    } catch (error) {

      const duration = Date.now() - startTime

      // Enhanced error logging
      await logActionExecution('createConversationApiV1MessagesConversationsPost', false, duration, {
        method: 'POST',
        path: '/api/v1/messages/conversations',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      
      // Throw enhanced error with context
      throw new ActionExecutionError(
        error instanceof Error ? error.message : 'Unknown error occurred',
        {
          endpoint: '/api/v1/messages/conversations',
          method: 'POST',
          timestamp: Date.now()
        },
        error
      )
    }
  })

/**
 * Get Conversation
 * @generated from GET /api/v1/messages/conversations/{conversation_id}
 * Features: React cache, input validation, error handling
 */
export const getConversationApiV1MessagesConversationsConversationIdGet = cache(
  authActionClient
    .metadata({
      name: "get-conversation-api-v1-messages-conversations-conversation-id-get",
      requiresAuth: true
    })
    .schema(GetConversationApiV1MessagesConversationsConversationIdGetParamsSchema)
    .action(async ({ parsedInput, ctx }: { parsedInput: z.infer<typeof GetConversationApiV1MessagesConversationsConversationIdGetParamsSchema>; ctx: { user?: any; ratelimit?: { remaining: number } } }) => {
      const startTime = Date.now()
      
      try {
      // Validate and sanitize parameters
      const validatedParams = await validateAndSanitizeInput(GetConversationApiV1MessagesConversationsConversationIdGetParamsSchema, parsedInput) as z.infer<typeof GetConversationApiV1MessagesConversationsConversationIdGetParamsSchema>

        // Execute API call with enhanced error handling
        const response = await apiClient.messages.getConversationApiV1MessagesConversationsConversationIdGet({params: {
path: {
        conversation_id: Number(validatedParams.path.conversation_id)
      },
query: validatedParams.query,
    },
          config: {
            timeout: 30000,
            retries: 3,
            validateResponse: false,
            responseSchema: GetConversationApiV1MessagesConversationsConversationIdGetResponseSchema
          }
        })
        

        // Log successful execution
        const duration = Date.now() - startTime
        await logActionExecution('getConversationApiV1MessagesConversationsConversationIdGet', true, duration, {
          method: 'GET',
          path: '/api/v1/messages/conversations/{conversation_id}'
        })
        
        return response.data
      } catch (error) {

        const duration = Date.now() - startTime

        // Enhanced error logging
        await logActionExecution('getConversationApiV1MessagesConversationsConversationIdGet', false, duration, {
          method: 'GET',
          path: '/api/v1/messages/conversations/{conversation_id}',
          error: error instanceof Error ? error.message : 'Unknown error'
        })
        
        // Throw enhanced error with context
        throw new ActionExecutionError(
          error instanceof Error ? error.message : 'Unknown error occurred',
          {
            endpoint: '/api/v1/messages/conversations/{conversation_id}',
            method: 'GET',
            timestamp: Date.now()
          },
          error
        )
      }
    })
)

/**
 * Get Conversation Messages
 * @generated from GET /api/v1/messages/conversations/{conversation_id}/messages
 * Features: React cache, input validation, error handling
 */
export const getConversationMessagesApiV1MessagesConversationsConversationIdMessagesGet = cache(
  authActionClient
    .metadata({
      name: "get-conversation-messages-api-v1-messages-conversations-conversation-id-messages-get",
      requiresAuth: true
    })
    .schema(GetConversationMessagesApiV1MessagesConversationsConversationIdMessagesGetParamsSchema)
    .action(async ({ parsedInput, ctx }: { parsedInput: z.infer<typeof GetConversationMessagesApiV1MessagesConversationsConversationIdMessagesGetParamsSchema>; ctx: { user?: any; ratelimit?: { remaining: number } } }) => {
      const startTime = Date.now()
      
      try {
      // Validate and sanitize parameters
      const validatedParams = await validateAndSanitizeInput(GetConversationMessagesApiV1MessagesConversationsConversationIdMessagesGetParamsSchema, parsedInput) as z.infer<typeof GetConversationMessagesApiV1MessagesConversationsConversationIdMessagesGetParamsSchema>

        // Execute API call with enhanced error handling
        const response = await apiClient.messages.getConversationMessagesApiV1MessagesConversationsConversationIdMessagesGet({params: {
path: {
        conversation_id: Number(validatedParams.path.conversation_id)
      },
query: validatedParams.query,
    },
          config: {
            timeout: 30000,
            retries: 3,
            validateResponse: false,
            responseSchema: GetConversationMessagesApiV1MessagesConversationsConversationIdMessagesGetResponseSchema
          }
        })
        

        // Log successful execution
        const duration = Date.now() - startTime
        await logActionExecution('getConversationMessagesApiV1MessagesConversationsConversationIdMessagesGet', true, duration, {
          method: 'GET',
          path: '/api/v1/messages/conversations/{conversation_id}/messages'
        })
        
        return response.data
      } catch (error) {

        const duration = Date.now() - startTime

        // Enhanced error logging
        await logActionExecution('getConversationMessagesApiV1MessagesConversationsConversationIdMessagesGet', false, duration, {
          method: 'GET',
          path: '/api/v1/messages/conversations/{conversation_id}/messages',
          error: error instanceof Error ? error.message : 'Unknown error'
        })
        
        // Throw enhanced error with context
        throw new ActionExecutionError(
          error instanceof Error ? error.message : 'Unknown error occurred',
          {
            endpoint: '/api/v1/messages/conversations/{conversation_id}/messages',
            method: 'GET',
            timestamp: Date.now()
          },
          error
        )
      }
    })
)

/**
 * Mark Conversation Read
 * @generated from POST /api/v1/messages/conversations/{conversation_id}/read
 * Features: Input validation, revalidation, error handling
 */
export const markConversationReadApiV1MessagesConversationsConversationIdReadPost = authActionClient
  .metadata({
    name: "mark-conversation-read-api-v1-messages-conversations-conversation-id-read-post",
    requiresAuth: true
  })
  .schema(MarkConversationReadApiV1MessagesConversationsConversationIdReadPostParamsSchema)
  .action(async ({ parsedInput, ctx }: { parsedInput: z.infer<typeof MarkConversationReadApiV1MessagesConversationsConversationIdReadPostParamsSchema>; ctx: { user?: any; ratelimit?: { remaining: number } } }) => {
    const startTime = Date.now()
    
    try {
      // Validate and sanitize parameters
      const validatedParams = await validateAndSanitizeInput(MarkConversationReadApiV1MessagesConversationsConversationIdReadPostParamsSchema, parsedInput) as z.infer<typeof MarkConversationReadApiV1MessagesConversationsConversationIdReadPostParamsSchema>

      // Execute API call with enhanced configuration
      const response = await apiClient.messages.markConversationReadApiV1MessagesConversationsConversationIdReadPost({params: {
path: {
        conversation_id: Number(validatedParams.path.conversation_id)
      }
    },
        config: {
          timeout: 30000,
          retries: 3,
          validateResponse: false,
          responseSchema: MarkConversationReadApiV1MessagesConversationsConversationIdReadPostResponseSchema
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
      updateTag('Messages')
      console.log('Updated tag: Messages')


      // Log successful execution
      const duration = Date.now() - startTime
      await logActionExecution('markConversationReadApiV1MessagesConversationsConversationIdReadPost', true, duration, {
        method: 'POST',
        path: '/api/v1/messages/conversations/{conversation_id}/read'
      })
      
      return response.data
    } catch (error) {

      const duration = Date.now() - startTime

      // Enhanced error logging
      await logActionExecution('markConversationReadApiV1MessagesConversationsConversationIdReadPost', false, duration, {
        method: 'POST',
        path: '/api/v1/messages/conversations/{conversation_id}/read',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      
      // Throw enhanced error with context
      throw new ActionExecutionError(
        error instanceof Error ? error.message : 'Unknown error occurred',
        {
          endpoint: '/api/v1/messages/conversations/{conversation_id}/read',
          method: 'POST',
          timestamp: Date.now()
        },
        error
      )
    }
  })

/**
 * Mark Message Read
 * @generated from POST /api/v1/messages/{message_id}/read
 * Features: Input validation, revalidation, error handling
 */
export const markMessageReadApiV1MessagesMessageIdReadPost = authActionClient
  .metadata({
    name: "mark-message-read-api-v1-messages-message-id-read-post",
    requiresAuth: true
  })
  .schema(MarkMessageReadApiV1MessagesMessageIdReadPostParamsSchema)
  .action(async ({ parsedInput, ctx }: { parsedInput: z.infer<typeof MarkMessageReadApiV1MessagesMessageIdReadPostParamsSchema>; ctx: { user?: any; ratelimit?: { remaining: number } } }) => {
    const startTime = Date.now()
    
    try {
      // Validate and sanitize parameters
      const validatedParams = await validateAndSanitizeInput(MarkMessageReadApiV1MessagesMessageIdReadPostParamsSchema, parsedInput) as z.infer<typeof MarkMessageReadApiV1MessagesMessageIdReadPostParamsSchema>

      // Execute API call with enhanced configuration
      const response = await apiClient.messages.markMessageReadApiV1MessagesMessageIdReadPost({params: {
path: {
        message_id: Number(validatedParams.path.message_id)
      }
    },
        config: {
          timeout: 30000,
          retries: 3,
          validateResponse: false,
          responseSchema: MarkMessageReadApiV1MessagesMessageIdReadPostResponseSchema
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
      updateTag('Messages')
      console.log('Updated tag: Messages')


      // Log successful execution
      const duration = Date.now() - startTime
      await logActionExecution('markMessageReadApiV1MessagesMessageIdReadPost', true, duration, {
        method: 'POST',
        path: '/api/v1/messages/{message_id}/read'
      })
      
      return response.data
    } catch (error) {

      const duration = Date.now() - startTime

      // Enhanced error logging
      await logActionExecution('markMessageReadApiV1MessagesMessageIdReadPost', false, duration, {
        method: 'POST',
        path: '/api/v1/messages/{message_id}/read',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      
      // Throw enhanced error with context
      throw new ActionExecutionError(
        error instanceof Error ? error.message : 'Unknown error occurred',
        {
          endpoint: '/api/v1/messages/{message_id}/read',
          method: 'POST',
          timestamp: Date.now()
        },
        error
      )
    }
  })