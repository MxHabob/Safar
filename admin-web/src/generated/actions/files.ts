'use server'
import { z } from 'zod'
import { updateTag } from 'next/cache'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { apiClient } from '@/generated/client'
import { actionClientWithMeta, authActionClient, ActionError } from '@/generated/lib/safe-action'
import {
  UploadFileApiV1FilesUploadPostRequestSchema,
  UploadFileApiV1FilesUploadPostParamsSchema,
  UploadFileApiV1FilesUploadPostResponseSchema,
  UploadMultipleFilesApiV1FilesUploadMultiplePostRequestSchema,
  UploadMultipleFilesApiV1FilesUploadMultiplePostParamsSchema,
  UploadMultipleFilesApiV1FilesUploadMultiplePostResponseSchema
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
 * Upload File
 * @generated from POST /api/v1/files/upload
 * Features: Input validation, revalidation, error handling
 */
const UploadFileApiV1FilesUploadPostInputSchema = z.object({ body: UploadFileApiV1FilesUploadPostRequestSchema, params: UploadFileApiV1FilesUploadPostParamsSchema })

export const uploadFileApiV1FilesUploadPost = authActionClient
  .metadata({
    name: "upload-file-api-v1-files-upload-post",
    requiresAuth: true
  })
  .schema(UploadFileApiV1FilesUploadPostInputSchema)
  .action(async ({ parsedInput, ctx }: { parsedInput: z.infer<typeof UploadFileApiV1FilesUploadPostInputSchema>; ctx: { user?: any; ratelimit?: { remaining: number } } }) => {
    const startTime = Date.now()
    
    try {
      // Validate and sanitize input payload
      const { body, params } = await validateAndSanitizeInput(z.object({
        body: UploadFileApiV1FilesUploadPostRequestSchema,
        params: UploadFileApiV1FilesUploadPostParamsSchema
      }), parsedInput)
      const validatedBody = body
      const validatedParams = params as z.infer<typeof UploadFileApiV1FilesUploadPostParamsSchema>
        // Handle file uploads with standard FormData
        if (validatedBody && typeof validatedBody === 'object' && 'file' in validatedBody) {
          // Standard file upload handling
          const file = (validatedBody as any).file as File
          // Process file with compression and validation if enabled
        }

      // Execute API call with enhanced configuration
      const response = await apiClient.files.uploadFileApiV1FilesUploadPost({params: {
query: validatedParams.query,
    },
body: validatedBody,
        config: {
          timeout: 30000,
          retries: 3,
          validateResponse: false,
          responseSchema: UploadFileApiV1FilesUploadPostResponseSchema
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
      updateTag('Files')
      console.log('Updated tag: Files')


      // Log successful execution
      const duration = Date.now() - startTime
      await logActionExecution('uploadFileApiV1FilesUploadPost', true, duration, {
        method: 'POST',
        path: '/api/v1/files/upload'
      })
      
      return response.data
    } catch (error) {

      const duration = Date.now() - startTime

      // Enhanced error logging
      await logActionExecution('uploadFileApiV1FilesUploadPost', false, duration, {
        method: 'POST',
        path: '/api/v1/files/upload',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      
      // Throw enhanced error with context
      throw new ActionExecutionError(
        error instanceof Error ? error.message : 'Unknown error occurred',
        {
          endpoint: '/api/v1/files/upload',
          method: 'POST',
          timestamp: Date.now()
        },
        error
      )
    }
  })

/**
 * Upload Multiple Files
 * @generated from POST /api/v1/files/upload-multiple
 * Features: Input validation, revalidation, error handling
 */
const UploadMultipleFilesApiV1FilesUploadMultiplePostInputSchema = z.object({ body: UploadMultipleFilesApiV1FilesUploadMultiplePostRequestSchema, params: UploadMultipleFilesApiV1FilesUploadMultiplePostParamsSchema })

export const uploadMultipleFilesApiV1FilesUploadMultiplePost = authActionClient
  .metadata({
    name: "upload-multiple-files-api-v1-files-upload-multiple-post",
    requiresAuth: true
  })
  .schema(UploadMultipleFilesApiV1FilesUploadMultiplePostInputSchema)
  .action(async ({ parsedInput, ctx }: { parsedInput: z.infer<typeof UploadMultipleFilesApiV1FilesUploadMultiplePostInputSchema>; ctx: { user?: any; ratelimit?: { remaining: number } } }) => {
    const startTime = Date.now()
    
    try {
      // Validate and sanitize input payload
      const { body, params } = await validateAndSanitizeInput(z.object({
        body: UploadMultipleFilesApiV1FilesUploadMultiplePostRequestSchema,
        params: UploadMultipleFilesApiV1FilesUploadMultiplePostParamsSchema
      }), parsedInput)
      const validatedBody = body
      const validatedParams = params as z.infer<typeof UploadMultipleFilesApiV1FilesUploadMultiplePostParamsSchema>
        // Handle file uploads with standard FormData
        if (validatedBody && typeof validatedBody === 'object' && 'file' in validatedBody) {
          // Standard file upload handling
          const file = (validatedBody as any).file as File
          // Process file with compression and validation if enabled
        }

      // Execute API call with enhanced configuration
      const response = await apiClient.files.uploadMultipleFilesApiV1FilesUploadMultiplePost({params: {
query: validatedParams.query,
    },
body: validatedBody,
        config: {
          timeout: 30000,
          retries: 3,
          validateResponse: false,
          responseSchema: UploadMultipleFilesApiV1FilesUploadMultiplePostResponseSchema
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
      updateTag('Files')
      console.log('Updated tag: Files')


      // Log successful execution
      const duration = Date.now() - startTime
      await logActionExecution('uploadMultipleFilesApiV1FilesUploadMultiplePost', true, duration, {
        method: 'POST',
        path: '/api/v1/files/upload-multiple'
      })
      
      return response.data
    } catch (error) {

      const duration = Date.now() - startTime

      // Enhanced error logging
      await logActionExecution('uploadMultipleFilesApiV1FilesUploadMultiplePost', false, duration, {
        method: 'POST',
        path: '/api/v1/files/upload-multiple',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      
      // Throw enhanced error with context
      throw new ActionExecutionError(
        error instanceof Error ? error.message : 'Unknown error occurred',
        {
          endpoint: '/api/v1/files/upload-multiple',
          method: 'POST',
          timestamp: Date.now()
        },
        error
      )
    }
  })