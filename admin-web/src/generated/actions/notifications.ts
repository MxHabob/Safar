'use server'
import { z } from 'zod'
import { updateTag } from 'next/cache'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { apiClient } from '@/generated/client'
import { actionClientWithMeta, authActionClient, ActionError } from '@/generated/lib/safe-action'
import {
  SendPushNotificationApiV1NotificationsPushSendPostRequestSchema,
  SendPushNotificationApiV1NotificationsPushSendPostResponseSchema,
  SendBulkPushNotificationsApiV1NotificationsPushBulkPostRequestSchema,
  SendBulkPushNotificationsApiV1NotificationsPushBulkPostResponseSchema
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
 * Send Push Notification
 * @generated from POST /api/v1/notifications/push/send
 * Features: Input validation, revalidation, error handling
 */
export const sendPushNotificationApiV1NotificationsPushSendPost = authActionClient
  .metadata({
    name: "send-push-notification-api-v1-notifications-push-send-post",
    requiresAuth: true
  })
  .schema(SendPushNotificationApiV1NotificationsPushSendPostRequestSchema)
  .action(async ({ parsedInput, ctx }: { parsedInput: z.infer<typeof SendPushNotificationApiV1NotificationsPushSendPostRequestSchema>; ctx: { user?: any; ratelimit?: { remaining: number } } }) => {
    const startTime = Date.now()
    
    try {
      // Validate and sanitize request body
      const validatedBody = await validateAndSanitizeInput(SendPushNotificationApiV1NotificationsPushSendPostRequestSchema, parsedInput)

      // Execute API call with enhanced configuration
      const response = await apiClient.notifications.sendPushNotificationApiV1NotificationsPushSendPost({body: validatedBody,
        config: {
          timeout: 30000,
          retries: 3,
          validateResponse: false,
          responseSchema: SendPushNotificationApiV1NotificationsPushSendPostResponseSchema
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
      updateTag('Notifications')
      console.log('Updated tag: Notifications')


      // Log successful execution
      const duration = Date.now() - startTime
      await logActionExecution('sendPushNotificationApiV1NotificationsPushSendPost', true, duration, {
        method: 'POST',
        path: '/api/v1/notifications/push/send'
      })
      
      return response.data
    } catch (error) {

      const duration = Date.now() - startTime

      // Enhanced error logging
      await logActionExecution('sendPushNotificationApiV1NotificationsPushSendPost', false, duration, {
        method: 'POST',
        path: '/api/v1/notifications/push/send',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      
      // Throw enhanced error with context
      throw new ActionExecutionError(
        error instanceof Error ? error.message : 'Unknown error occurred',
        {
          endpoint: '/api/v1/notifications/push/send',
          method: 'POST',
          timestamp: Date.now()
        },
        error
      )
    }
  })

/**
 * Send Bulk Push Notifications
 * @generated from POST /api/v1/notifications/push/bulk
 * Features: Input validation, revalidation, error handling
 */
export const sendBulkPushNotificationsApiV1NotificationsPushBulkPost = authActionClient
  .metadata({
    name: "send-bulk-push-notifications-api-v1-notifications-push-bulk-post",
    requiresAuth: true
  })
  .schema(SendBulkPushNotificationsApiV1NotificationsPushBulkPostRequestSchema)
  .action(async ({ parsedInput, ctx }: { parsedInput: z.infer<typeof SendBulkPushNotificationsApiV1NotificationsPushBulkPostRequestSchema>; ctx: { user?: any; ratelimit?: { remaining: number } } }) => {
    const startTime = Date.now()
    
    try {
      // Validate and sanitize request body
      const validatedBody = await validateAndSanitizeInput(SendBulkPushNotificationsApiV1NotificationsPushBulkPostRequestSchema, parsedInput)

      // Execute API call with enhanced configuration
      const response = await apiClient.notifications.sendBulkPushNotificationsApiV1NotificationsPushBulkPost({body: validatedBody,
        config: {
          timeout: 30000,
          retries: 3,
          validateResponse: false,
          responseSchema: SendBulkPushNotificationsApiV1NotificationsPushBulkPostResponseSchema
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
      updateTag('Notifications')
      console.log('Updated tag: Notifications')


      // Log successful execution
      const duration = Date.now() - startTime
      await logActionExecution('sendBulkPushNotificationsApiV1NotificationsPushBulkPost', true, duration, {
        method: 'POST',
        path: '/api/v1/notifications/push/bulk'
      })
      
      return response.data
    } catch (error) {

      const duration = Date.now() - startTime

      // Enhanced error logging
      await logActionExecution('sendBulkPushNotificationsApiV1NotificationsPushBulkPost', false, duration, {
        method: 'POST',
        path: '/api/v1/notifications/push/bulk',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      
      // Throw enhanced error with context
      throw new ActionExecutionError(
        error instanceof Error ? error.message : 'Unknown error occurred',
        {
          endpoint: '/api/v1/notifications/push/bulk',
          method: 'POST',
          timestamp: Date.now()
        },
        error
      )
    }
  })