'use server'
import { z } from 'zod'
import { updateTag } from 'next/cache'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { apiClient } from '@/generated/client'
import { actionClientWithMeta, ActionError } from '@/generated/lib/safe-action'
import {
  StripeWebhookApiV1WebhooksStripePostParamsSchema,
  StripeWebhookApiV1WebhooksStripePostResponseSchema
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
 * Stripe Webhook
 * @generated from POST /api/v1/webhooks/stripe
 * Features: Input validation, revalidation, error handling
 */
export const stripeWebhookApiV1WebhooksStripePost = actionClientWithMeta
  .metadata({
    name: "stripe-webhook-api-v1-webhooks-stripe-post",
    requiresAuth: false
  })
  .schema(StripeWebhookApiV1WebhooksStripePostParamsSchema)
  .action(async ({ parsedInput, ctx }: { parsedInput: z.infer<typeof StripeWebhookApiV1WebhooksStripePostParamsSchema>; ctx?: any }) => {
    const startTime = Date.now()
    
    try {
      // Validate and sanitize parameters
      const validatedParams = await validateAndSanitizeInput(StripeWebhookApiV1WebhooksStripePostParamsSchema, parsedInput) as z.infer<typeof StripeWebhookApiV1WebhooksStripePostParamsSchema>

      // Execute API call with enhanced configuration
      const response = await apiClient.webhooks.stripeWebhookApiV1WebhooksStripePost({
        config: {
          timeout: 30000,
          retries: 3,
          validateResponse: false,
          responseSchema: StripeWebhookApiV1WebhooksStripePostResponseSchema
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
      updateTag('Webhooks')
      console.log('Updated tag: Webhooks')


      // Log successful execution
      const duration = Date.now() - startTime
      await logActionExecution('stripeWebhookApiV1WebhooksStripePost', true, duration, {
        method: 'POST',
        path: '/api/v1/webhooks/stripe'
      })
      
      return response.data
    } catch (error) {

      const duration = Date.now() - startTime

      // Enhanced error logging
      await logActionExecution('stripeWebhookApiV1WebhooksStripePost', false, duration, {
        method: 'POST',
        path: '/api/v1/webhooks/stripe',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      
      // Throw enhanced error with context
      throw new ActionExecutionError(
        error instanceof Error ? error.message : 'Unknown error occurred',
        {
          endpoint: '/api/v1/webhooks/stripe',
          method: 'POST',
          timestamp: Date.now()
        },
        error
      )
    }
  })