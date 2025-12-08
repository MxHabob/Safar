'use server'
import { z } from 'zod'
import { updateTag } from 'next/cache'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { apiClient } from '@/generated/client'
import { actionClientWithMeta, authActionClient, ActionError } from '@/generated/lib/safe-action'
import {
  CreatePaymentIntentApiV1PaymentsIntentPostRequestSchema,
  CreatePaymentIntentApiV1PaymentsIntentPostResponseSchema,
  ProcessPaymentApiV1PaymentsProcessPostRequestSchema,
  ProcessPaymentApiV1PaymentsProcessPostResponseSchema
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
 * Create Payment Intent
 * @generated from POST /api/v1/payments/intent
 * Features: Input validation, revalidation, error handling
 */
export const createPaymentIntentApiV1PaymentsIntentPost = authActionClient
  .metadata({
    name: "create-payment-intent-api-v1-payments-intent-post",
    requiresAuth: true
  })
  .schema(CreatePaymentIntentApiV1PaymentsIntentPostRequestSchema)
  .action(async ({ parsedInput, ctx }: { parsedInput: z.infer<typeof CreatePaymentIntentApiV1PaymentsIntentPostRequestSchema>; ctx: { user?: any; ratelimit?: { remaining: number } } }) => {
    const startTime = Date.now()
    
    try {
      // Validate and sanitize request body
      const validatedBody = await validateAndSanitizeInput(CreatePaymentIntentApiV1PaymentsIntentPostRequestSchema, parsedInput)

      // Execute API call with enhanced configuration
      const response = await apiClient.payments.createPaymentIntentApiV1PaymentsIntentPost({body: validatedBody,
        config: {
          timeout: 30000,
          retries: 3,
          validateResponse: false,
          responseSchema: CreatePaymentIntentApiV1PaymentsIntentPostResponseSchema
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
      updateTag('Payments')
      console.log('Updated tag: Payments')


      // Log successful execution
      const duration = Date.now() - startTime
      await logActionExecution('createPaymentIntentApiV1PaymentsIntentPost', true, duration, {
        method: 'POST',
        path: '/api/v1/payments/intent'
      })
      
      return response.data
    } catch (error) {

      const duration = Date.now() - startTime

      // Enhanced error logging
      await logActionExecution('createPaymentIntentApiV1PaymentsIntentPost', false, duration, {
        method: 'POST',
        path: '/api/v1/payments/intent',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      
      // Throw enhanced error with context
      throw new ActionExecutionError(
        error instanceof Error ? error.message : 'Unknown error occurred',
        {
          endpoint: '/api/v1/payments/intent',
          method: 'POST',
          timestamp: Date.now()
        },
        error
      )
    }
  })

/**
 * Process Payment
 * @generated from POST /api/v1/payments/process
 * Features: Input validation, revalidation, error handling
 */
export const processPaymentApiV1PaymentsProcessPost = authActionClient
  .metadata({
    name: "process-payment-api-v1-payments-process-post",
    requiresAuth: true
  })
  .schema(ProcessPaymentApiV1PaymentsProcessPostRequestSchema)
  .action(async ({ parsedInput, ctx }: { parsedInput: z.infer<typeof ProcessPaymentApiV1PaymentsProcessPostRequestSchema>; ctx: { user?: any; ratelimit?: { remaining: number } } }) => {
    const startTime = Date.now()
    
    try {
      // Validate and sanitize request body
      const validatedBody = await validateAndSanitizeInput(ProcessPaymentApiV1PaymentsProcessPostRequestSchema, parsedInput)

      // Execute API call with enhanced configuration
      const response = await apiClient.payments.processPaymentApiV1PaymentsProcessPost({body: validatedBody,
        config: {
          timeout: 30000,
          retries: 3,
          validateResponse: false,
          responseSchema: ProcessPaymentApiV1PaymentsProcessPostResponseSchema
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
      updateTag('Payments')
      console.log('Updated tag: Payments')


      // Log successful execution
      const duration = Date.now() - startTime
      await logActionExecution('processPaymentApiV1PaymentsProcessPost', true, duration, {
        method: 'POST',
        path: '/api/v1/payments/process'
      })
      
      return response.data
    } catch (error) {

      const duration = Date.now() - startTime

      // Enhanced error logging
      await logActionExecution('processPaymentApiV1PaymentsProcessPost', false, duration, {
        method: 'POST',
        path: '/api/v1/payments/process',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      
      // Throw enhanced error with context
      throw new ActionExecutionError(
        error instanceof Error ? error.message : 'Unknown error occurred',
        {
          endpoint: '/api/v1/payments/process',
          method: 'POST',
          timestamp: Date.now()
        },
        error
      )
    }
  })