'use server'
import { z } from 'zod'
import { cache } from 'react'
import { updateTag } from 'next/cache'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { apiClient } from '@/generated/client'
import { actionClientWithMeta, authActionClient, ActionError } from '@/generated/lib/safe-action'
import {
  RegisterDeviceApiV1UsersUsersDevicesRegisterPostRequestSchema,
  RegisterDeviceApiV1UsersUsersDevicesRegisterPostResponseSchema,
  ListDevicesApiV1UsersUsersDevicesGetResponseSchema,
  RemoveDeviceApiV1UsersUsersDevicesDeviceIdDeleteParamsSchema,
  RemoveDeviceApiV1UsersUsersDevicesDeviceIdDeleteResponseSchema,
  MarkDeviceTrustedApiV1UsersUsersDevicesDeviceIdTrustPatchRequestSchema,
  MarkDeviceTrustedApiV1UsersUsersDevicesDeviceIdTrustPatchParamsSchema,
  MarkDeviceTrustedApiV1UsersUsersDevicesDeviceIdTrustPatchResponseSchema,
  RegisterApiV1UsersRegisterPostRequestSchema,
  RegisterApiV1UsersRegisterPostResponseSchema,
  LoginApiV1UsersLoginPostRequestSchema,
  LoginApiV1UsersLoginPostResponseSchema,
  RefreshTokenApiV1UsersRefreshPostRequestSchema,
  RefreshTokenApiV1UsersRefreshPostResponseSchema,
  GetCurrentUserInfoApiV1UsersMeGetResponseSchema,
  UpdateCurrentUserApiV1UsersMePutRequestSchema,
  UpdateCurrentUserApiV1UsersMePutResponseSchema,
  RequestOtpApiV1UsersOtpRequestPostRequestSchema,
  RequestOtpApiV1UsersOtpRequestPostResponseSchema,
  VerifyOtpApiV1UsersOtpVerifyPostRequestSchema,
  VerifyOtpApiV1UsersOtpVerifyPostResponseSchema,
  LogoutApiV1UsersLogoutPostResponseSchema,
  GetSessionsApiV1UsersSessionsGetResponseSchema,
  RevokeSessionApiV1UsersSessionsSessionIdDeleteParamsSchema,
  RevokeSessionApiV1UsersSessionsSessionIdDeleteResponseSchema,
  LogoutAllApiV1UsersLogoutAllPostResponseSchema,
  OauthLoginApiV1UsersOauthLoginPostRequestSchema,
  OauthLoginApiV1UsersOauthLoginPostResponseSchema,
  RequestPasswordResetApiV1UsersPasswordResetRequestPostRequestSchema,
  RequestPasswordResetApiV1UsersPasswordResetRequestPostResponseSchema,
  ResetPasswordApiV1UsersPasswordResetPostRequestSchema,
  ResetPasswordApiV1UsersPasswordResetPostResponseSchema,
  ChangePasswordApiV1UsersPasswordChangePostRequestSchema,
  ChangePasswordApiV1UsersPasswordChangePostResponseSchema,
  VerifyEmailApiV1UsersEmailVerifyPostRequestSchema,
  VerifyEmailApiV1UsersEmailVerifyPostResponseSchema,
  ResendEmailVerificationApiV1UsersEmailResendVerificationPostResponseSchema,
  Verify2faLoginApiV1UsersLogin2faVerifyPostRequestSchema,
  Verify2faLoginApiV1UsersLogin2faVerifyPostResponseSchema,
  Setup2faApiV1Users2faSetupPostResponseSchema,
  Verify2faSetupApiV1Users2faVerifyPostRequestSchema,
  Verify2faSetupApiV1Users2faVerifyPostResponseSchema,
  Get2faStatusApiV1Users2faStatusGetResponseSchema,
  Disable2faApiV1Users2faDisablePostRequestSchema,
  Disable2faApiV1Users2faDisablePostResponseSchema,
  RegenerateBackupCodesApiV1Users2faBackupCodesRegeneratePostResponseSchema,
  ExportUserDataApiV1UsersDataExportGetResponseSchema,
  DeleteAccountApiV1UsersAccountDeletePostRequestSchema,
  DeleteAccountApiV1UsersAccountDeletePostResponseSchema
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
 * Register Device
 * @generated from POST /api/v1/users/users/devices/register
 * Features: Input validation, revalidation, error handling
 */
export const registerDeviceApiV1UsersUsersDevicesRegisterPost = authActionClient
  .metadata({
    name: "register-device-api-v1-users-users-devices-register-post",
    requiresAuth: true
  })
  .schema(RegisterDeviceApiV1UsersUsersDevicesRegisterPostRequestSchema)
  .action(async ({ parsedInput, ctx }: { parsedInput: z.infer<typeof RegisterDeviceApiV1UsersUsersDevicesRegisterPostRequestSchema>; ctx: { user?: any; ratelimit?: { remaining: number } } }) => {
    const startTime = Date.now()
    
    try {
      // Validate and sanitize request body
      const validatedBody = await validateAndSanitizeInput(RegisterDeviceApiV1UsersUsersDevicesRegisterPostRequestSchema, parsedInput)

      // Execute API call with enhanced configuration
      const response = await apiClient.users.registerDeviceApiV1UsersUsersDevicesRegisterPost({body: validatedBody,
        config: {
          timeout: 30000,
          retries: 3,
          validateResponse: false,
          responseSchema: RegisterDeviceApiV1UsersUsersDevicesRegisterPostResponseSchema
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
      updateTag('Users')
      console.log('Updated tag: Users')
      updateTag('Devices')
      console.log('Updated tag: Devices')


      // Log successful execution
      const duration = Date.now() - startTime
      await logActionExecution('registerDeviceApiV1UsersUsersDevicesRegisterPost', true, duration, {
        method: 'POST',
        path: '/api/v1/users/users/devices/register'
      })
      
      return response.data
    } catch (error) {

      const duration = Date.now() - startTime

      // Enhanced error logging
      await logActionExecution('registerDeviceApiV1UsersUsersDevicesRegisterPost', false, duration, {
        method: 'POST',
        path: '/api/v1/users/users/devices/register',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      
      // Throw enhanced error with context
      throw new ActionExecutionError(
        error instanceof Error ? error.message : 'Unknown error occurred',
        {
          endpoint: '/api/v1/users/users/devices/register',
          method: 'POST',
          timestamp: Date.now()
        },
        error
      )
    }
  })

/**
 * List Devices
 * @generated from GET /api/v1/users/users/devices
 * Features: React cache, input validation, error handling
 */
export const listDevicesApiV1UsersUsersDevicesGet = cache(
  authActionClient
    .metadata({
      name: "list-devices-api-v1-users-users-devices-get",
      requiresAuth: true
    })
    .schema(z.void())
    .action(async ({ parsedInput, ctx }: { parsedInput: void; ctx: { user?: any; ratelimit?: { remaining: number } } }) => {
      const startTime = Date.now()
      
      try {

        // Execute API call with enhanced error handling
        const response = await apiClient.users.listDevicesApiV1UsersUsersDevicesGet({
          config: {
            timeout: 30000,
            retries: 3,
            validateResponse: false,
            responseSchema: ListDevicesApiV1UsersUsersDevicesGetResponseSchema
          }
        })
        

        // Log successful execution
        const duration = Date.now() - startTime
        await logActionExecution('listDevicesApiV1UsersUsersDevicesGet', true, duration, {
          method: 'GET',
          path: '/api/v1/users/users/devices'
        })
        
        return response.data
      } catch (error) {

        const duration = Date.now() - startTime

        // Enhanced error logging
        await logActionExecution('listDevicesApiV1UsersUsersDevicesGet', false, duration, {
          method: 'GET',
          path: '/api/v1/users/users/devices',
          error: error instanceof Error ? error.message : 'Unknown error'
        })
        
        // Throw enhanced error with context
        throw new ActionExecutionError(
          error instanceof Error ? error.message : 'Unknown error occurred',
          {
            endpoint: '/api/v1/users/users/devices',
            method: 'GET',
            timestamp: Date.now()
          },
          error
        )
      }
    })
)

/**
 * Remove Device
 * @generated from DELETE /api/v1/users/users/devices/{device_id}
 * Features: Input validation, revalidation, error handling
 */
export const removeDeviceApiV1UsersUsersDevicesDeviceIdDelete = authActionClient
  .metadata({
    name: "remove-device-api-v1-users-users-devices-device-id-delete",
    requiresAuth: true
  })
  .schema(RemoveDeviceApiV1UsersUsersDevicesDeviceIdDeleteParamsSchema)
  .action(async ({ parsedInput, ctx }: { parsedInput: z.infer<typeof RemoveDeviceApiV1UsersUsersDevicesDeviceIdDeleteParamsSchema>; ctx: { user?: any; ratelimit?: { remaining: number } } }) => {
    const startTime = Date.now()
    
    try {
      // Validate and sanitize parameters
      const validatedParams = await validateAndSanitizeInput(RemoveDeviceApiV1UsersUsersDevicesDeviceIdDeleteParamsSchema, parsedInput) as z.infer<typeof RemoveDeviceApiV1UsersUsersDevicesDeviceIdDeleteParamsSchema>

      // Execute API call with enhanced configuration
      const response = await apiClient.users.removeDeviceApiV1UsersUsersDevicesDeviceIdDelete({params: {
path: {
        device_id: validatedParams.path.device_id
      }
    },
        config: {
          timeout: 30000,
          retries: 3,
          validateResponse: false,
          responseSchema: RemoveDeviceApiV1UsersUsersDevicesDeviceIdDeleteResponseSchema
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
      updateTag('Users')
      console.log('Updated tag: Users')
      updateTag('Devices')
      console.log('Updated tag: Devices')


      // Log successful execution
      const duration = Date.now() - startTime
      await logActionExecution('removeDeviceApiV1UsersUsersDevicesDeviceIdDelete', true, duration, {
        method: 'DELETE',
        path: '/api/v1/users/users/devices/{device_id}'
      })
      
      return response.data
    } catch (error) {

      const duration = Date.now() - startTime

      // Enhanced error logging
      await logActionExecution('removeDeviceApiV1UsersUsersDevicesDeviceIdDelete', false, duration, {
        method: 'DELETE',
        path: '/api/v1/users/users/devices/{device_id}',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      
      // Throw enhanced error with context
      throw new ActionExecutionError(
        error instanceof Error ? error.message : 'Unknown error occurred',
        {
          endpoint: '/api/v1/users/users/devices/{device_id}',
          method: 'DELETE',
          timestamp: Date.now()
        },
        error
      )
    }
  })

/**
 * Mark Device Trusted
 * @generated from PATCH /api/v1/users/users/devices/{device_id}/trust
 * Features: Input validation, revalidation, error handling
 */
const MarkDeviceTrustedApiV1UsersUsersDevicesDeviceIdTrustPatchInputSchema = z.object({ body: MarkDeviceTrustedApiV1UsersUsersDevicesDeviceIdTrustPatchRequestSchema, params: MarkDeviceTrustedApiV1UsersUsersDevicesDeviceIdTrustPatchParamsSchema })

export const markDeviceTrustedApiV1UsersUsersDevicesDeviceIdTrustPatch = authActionClient
  .metadata({
    name: "mark-device-trusted-api-v1-users-users-devices-device-id-trust-patch",
    requiresAuth: true
  })
  .schema(MarkDeviceTrustedApiV1UsersUsersDevicesDeviceIdTrustPatchInputSchema)
  .action(async ({ parsedInput, ctx }: { parsedInput: z.infer<typeof MarkDeviceTrustedApiV1UsersUsersDevicesDeviceIdTrustPatchInputSchema>; ctx: { user?: any; ratelimit?: { remaining: number } } }) => {
    const startTime = Date.now()
    
    try {
      // Validate and sanitize input payload
      const { body, params } = await validateAndSanitizeInput(z.object({
        body: MarkDeviceTrustedApiV1UsersUsersDevicesDeviceIdTrustPatchRequestSchema,
        params: MarkDeviceTrustedApiV1UsersUsersDevicesDeviceIdTrustPatchParamsSchema
      }), parsedInput)
      const validatedBody = body
      const validatedParams = params as z.infer<typeof MarkDeviceTrustedApiV1UsersUsersDevicesDeviceIdTrustPatchParamsSchema>

      // Execute API call with enhanced configuration
      const response = await apiClient.users.markDeviceTrustedApiV1UsersUsersDevicesDeviceIdTrustPatch({params: {
path: {
        device_id: validatedParams.path.device_id
      }
    },
body: validatedBody,
        config: {
          timeout: 30000,
          retries: 3,
          validateResponse: false,
          responseSchema: MarkDeviceTrustedApiV1UsersUsersDevicesDeviceIdTrustPatchResponseSchema
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
      updateTag('Users')
      console.log('Updated tag: Users')
      updateTag('Devices')
      console.log('Updated tag: Devices')


      // Log successful execution
      const duration = Date.now() - startTime
      await logActionExecution('markDeviceTrustedApiV1UsersUsersDevicesDeviceIdTrustPatch', true, duration, {
        method: 'PATCH',
        path: '/api/v1/users/users/devices/{device_id}/trust'
      })
      
      return response.data
    } catch (error) {

      const duration = Date.now() - startTime

      // Enhanced error logging
      await logActionExecution('markDeviceTrustedApiV1UsersUsersDevicesDeviceIdTrustPatch', false, duration, {
        method: 'PATCH',
        path: '/api/v1/users/users/devices/{device_id}/trust',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      
      // Throw enhanced error with context
      throw new ActionExecutionError(
        error instanceof Error ? error.message : 'Unknown error occurred',
        {
          endpoint: '/api/v1/users/users/devices/{device_id}/trust',
          method: 'PATCH',
          timestamp: Date.now()
        },
        error
      )
    }
  })

/**
 * Register
 * @generated from POST /api/v1/users/register
 * Features: Input validation, revalidation, error handling
 */
export const registerApiV1UsersRegisterPost = actionClientWithMeta
  .metadata({
    name: "register-api-v1-users-register-post",
    requiresAuth: false
  })
  .schema(RegisterApiV1UsersRegisterPostRequestSchema)
  .action(async ({ parsedInput, ctx }: { parsedInput: z.infer<typeof RegisterApiV1UsersRegisterPostRequestSchema>; ctx?: any }) => {
    const startTime = Date.now()
    
    try {
      // Validate and sanitize request body
      const validatedBody = await validateAndSanitizeInput(RegisterApiV1UsersRegisterPostRequestSchema, parsedInput)

      // Execute API call with enhanced configuration
      const response = await apiClient.users.registerApiV1UsersRegisterPost({body: validatedBody,
        config: {
          timeout: 30000,
          retries: 3,
          validateResponse: false,
          responseSchema: RegisterApiV1UsersRegisterPostResponseSchema
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
      updateTag('Users')
      console.log('Updated tag: Users')


      // Log successful execution
      const duration = Date.now() - startTime
      await logActionExecution('registerApiV1UsersRegisterPost', true, duration, {
        method: 'POST',
        path: '/api/v1/users/register'
      })
      
      return response.data
    } catch (error) {

      const duration = Date.now() - startTime

      // Enhanced error logging
      await logActionExecution('registerApiV1UsersRegisterPost', false, duration, {
        method: 'POST',
        path: '/api/v1/users/register',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      
      // Throw enhanced error with context
      throw new ActionExecutionError(
        error instanceof Error ? error.message : 'Unknown error occurred',
        {
          endpoint: '/api/v1/users/register',
          method: 'POST',
          timestamp: Date.now()
        },
        error
      )
    }
  })

/**
 * Login
 * @generated from POST /api/v1/users/login
 * Features: Input validation, revalidation, error handling
 */
export const loginApiV1UsersLoginPost = actionClientWithMeta
  .metadata({
    name: "login-api-v1-users-login-post",
    requiresAuth: false
  })
  .schema(LoginApiV1UsersLoginPostRequestSchema)
  .action(async ({ parsedInput, ctx }: { parsedInput: z.infer<typeof LoginApiV1UsersLoginPostRequestSchema>; ctx?: any }) => {
    const startTime = Date.now()
    
    try {
      // Validate and sanitize request body
      const validatedBody = await validateAndSanitizeInput(LoginApiV1UsersLoginPostRequestSchema, parsedInput)

      // Execute API call with enhanced configuration
      const response = await apiClient.users.loginApiV1UsersLoginPost({body: validatedBody,
        config: {
          timeout: 30000,
          retries: 3,
          validateResponse: false,
          responseSchema: LoginApiV1UsersLoginPostResponseSchema
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
      updateTag('Users')
      console.log('Updated tag: Users')


      // Log successful execution
      const duration = Date.now() - startTime
      await logActionExecution('loginApiV1UsersLoginPost', true, duration, {
        method: 'POST',
        path: '/api/v1/users/login'
      })
      
      return response.data
    } catch (error) {

      const duration = Date.now() - startTime

      // Enhanced error logging
      await logActionExecution('loginApiV1UsersLoginPost', false, duration, {
        method: 'POST',
        path: '/api/v1/users/login',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      
      // Throw enhanced error with context
      throw new ActionExecutionError(
        error instanceof Error ? error.message : 'Unknown error occurred',
        {
          endpoint: '/api/v1/users/login',
          method: 'POST',
          timestamp: Date.now()
        },
        error
      )
    }
  })

/**
 * Refresh Token
 * @generated from POST /api/v1/users/refresh
 * Features: Input validation, revalidation, error handling
 */
export const refreshTokenApiV1UsersRefreshPost = actionClientWithMeta
  .metadata({
    name: "refresh-token-api-v1-users-refresh-post",
    requiresAuth: false
  })
  .schema(RefreshTokenApiV1UsersRefreshPostRequestSchema)
  .action(async ({ parsedInput, ctx }: { parsedInput: z.infer<typeof RefreshTokenApiV1UsersRefreshPostRequestSchema>; ctx?: any }) => {
    const startTime = Date.now()
    
    try {
      // Validate and sanitize request body
      const validatedBody = await validateAndSanitizeInput(RefreshTokenApiV1UsersRefreshPostRequestSchema, parsedInput)

      // Execute API call with enhanced configuration
      const response = await apiClient.users.refreshTokenApiV1UsersRefreshPost({body: validatedBody,
        config: {
          timeout: 30000,
          retries: 3,
          validateResponse: false,
          responseSchema: RefreshTokenApiV1UsersRefreshPostResponseSchema
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
      updateTag('Users')
      console.log('Updated tag: Users')


      // Log successful execution
      const duration = Date.now() - startTime
      await logActionExecution('refreshTokenApiV1UsersRefreshPost', true, duration, {
        method: 'POST',
        path: '/api/v1/users/refresh'
      })
      
      return response.data
    } catch (error) {

      const duration = Date.now() - startTime

      // Enhanced error logging
      await logActionExecution('refreshTokenApiV1UsersRefreshPost', false, duration, {
        method: 'POST',
        path: '/api/v1/users/refresh',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      
      // Throw enhanced error with context
      throw new ActionExecutionError(
        error instanceof Error ? error.message : 'Unknown error occurred',
        {
          endpoint: '/api/v1/users/refresh',
          method: 'POST',
          timestamp: Date.now()
        },
        error
      )
    }
  })

/**
 * Get Current User Info
 * @generated from GET /api/v1/users/me
 * Features: React cache, input validation, error handling
 */
export const getCurrentUserInfoApiV1UsersMeGet = cache(
  authActionClient
    .metadata({
      name: "get-current-user-info-api-v1-users-me-get",
      requiresAuth: true
    })
    .schema(z.void())
    .action(async ({ parsedInput, ctx }: { parsedInput: void; ctx: { user?: any; ratelimit?: { remaining: number } } }) => {
      const startTime = Date.now()
      
      try {

        // Execute API call with enhanced error handling
        const response = await apiClient.users.getCurrentUserInfoApiV1UsersMeGet({
          config: {
            timeout: 30000,
            retries: 3,
            validateResponse: false,
            responseSchema: GetCurrentUserInfoApiV1UsersMeGetResponseSchema
          }
        })
        

        // Log successful execution
        const duration = Date.now() - startTime
        await logActionExecution('getCurrentUserInfoApiV1UsersMeGet', true, duration, {
          method: 'GET',
          path: '/api/v1/users/me'
        })
        
        return response.data
      } catch (error) {

        const duration = Date.now() - startTime

        // Enhanced error logging
        await logActionExecution('getCurrentUserInfoApiV1UsersMeGet', false, duration, {
          method: 'GET',
          path: '/api/v1/users/me',
          error: error instanceof Error ? error.message : 'Unknown error'
        })
        
        // Throw enhanced error with context
        throw new ActionExecutionError(
          error instanceof Error ? error.message : 'Unknown error occurred',
          {
            endpoint: '/api/v1/users/me',
            method: 'GET',
            timestamp: Date.now()
          },
          error
        )
      }
    })
)

/**
 * Update Current User
 * @generated from PUT /api/v1/users/me
 * Features: Input validation, revalidation, error handling
 */
export const updateCurrentUserApiV1UsersMePut = authActionClient
  .metadata({
    name: "update-current-user-api-v1-users-me-put",
    requiresAuth: true
  })
  .schema(UpdateCurrentUserApiV1UsersMePutRequestSchema)
  .action(async ({ parsedInput, ctx }: { parsedInput: z.infer<typeof UpdateCurrentUserApiV1UsersMePutRequestSchema>; ctx: { user?: any; ratelimit?: { remaining: number } } }) => {
    const startTime = Date.now()
    
    try {
      // Validate and sanitize request body
      const validatedBody = await validateAndSanitizeInput(UpdateCurrentUserApiV1UsersMePutRequestSchema, parsedInput)

      // Execute API call with enhanced configuration
      const response = await apiClient.users.updateCurrentUserApiV1UsersMePut({body: validatedBody,
        config: {
          timeout: 30000,
          retries: 3,
          validateResponse: false,
          responseSchema: UpdateCurrentUserApiV1UsersMePutResponseSchema
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
      updateTag('Users')
      console.log('Updated tag: Users')


      // Log successful execution
      const duration = Date.now() - startTime
      await logActionExecution('updateCurrentUserApiV1UsersMePut', true, duration, {
        method: 'PUT',
        path: '/api/v1/users/me'
      })
      
      return response.data
    } catch (error) {

      const duration = Date.now() - startTime

      // Enhanced error logging
      await logActionExecution('updateCurrentUserApiV1UsersMePut', false, duration, {
        method: 'PUT',
        path: '/api/v1/users/me',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      
      // Throw enhanced error with context
      throw new ActionExecutionError(
        error instanceof Error ? error.message : 'Unknown error occurred',
        {
          endpoint: '/api/v1/users/me',
          method: 'PUT',
          timestamp: Date.now()
        },
        error
      )
    }
  })

/**
 * Request Otp
 * @generated from POST /api/v1/users/otp/request
 * Features: Input validation, revalidation, error handling
 */
export const requestOtpApiV1UsersOtpRequestPost = actionClientWithMeta
  .metadata({
    name: "request-otp-api-v1-users-otp-request-post",
    requiresAuth: false
  })
  .schema(RequestOtpApiV1UsersOtpRequestPostRequestSchema)
  .action(async ({ parsedInput, ctx }: { parsedInput: z.infer<typeof RequestOtpApiV1UsersOtpRequestPostRequestSchema>; ctx?: any }) => {
    const startTime = Date.now()
    
    try {
      // Validate and sanitize request body
      const validatedBody = await validateAndSanitizeInput(RequestOtpApiV1UsersOtpRequestPostRequestSchema, parsedInput)

      // Execute API call with enhanced configuration
      const response = await apiClient.users.requestOtpApiV1UsersOtpRequestPost({body: validatedBody,
        config: {
          timeout: 30000,
          retries: 3,
          validateResponse: false,
          responseSchema: RequestOtpApiV1UsersOtpRequestPostResponseSchema
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
      updateTag('Users')
      console.log('Updated tag: Users')


      // Log successful execution
      const duration = Date.now() - startTime
      await logActionExecution('requestOtpApiV1UsersOtpRequestPost', true, duration, {
        method: 'POST',
        path: '/api/v1/users/otp/request'
      })
      
      return response.data
    } catch (error) {

      const duration = Date.now() - startTime

      // Enhanced error logging
      await logActionExecution('requestOtpApiV1UsersOtpRequestPost', false, duration, {
        method: 'POST',
        path: '/api/v1/users/otp/request',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      
      // Throw enhanced error with context
      throw new ActionExecutionError(
        error instanceof Error ? error.message : 'Unknown error occurred',
        {
          endpoint: '/api/v1/users/otp/request',
          method: 'POST',
          timestamp: Date.now()
        },
        error
      )
    }
  })

/**
 * Verify Otp
 * @generated from POST /api/v1/users/otp/verify
 * Features: Input validation, revalidation, error handling
 */
export const verifyOtpApiV1UsersOtpVerifyPost = actionClientWithMeta
  .metadata({
    name: "verify-otp-api-v1-users-otp-verify-post",
    requiresAuth: false
  })
  .schema(VerifyOtpApiV1UsersOtpVerifyPostRequestSchema)
  .action(async ({ parsedInput, ctx }: { parsedInput: z.infer<typeof VerifyOtpApiV1UsersOtpVerifyPostRequestSchema>; ctx?: any }) => {
    const startTime = Date.now()
    
    try {
      // Validate and sanitize request body
      const validatedBody = await validateAndSanitizeInput(VerifyOtpApiV1UsersOtpVerifyPostRequestSchema, parsedInput)

      // Execute API call with enhanced configuration
      const response = await apiClient.users.verifyOtpApiV1UsersOtpVerifyPost({body: validatedBody,
        config: {
          timeout: 30000,
          retries: 3,
          validateResponse: false,
          responseSchema: VerifyOtpApiV1UsersOtpVerifyPostResponseSchema
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
      updateTag('Users')
      console.log('Updated tag: Users')


      // Log successful execution
      const duration = Date.now() - startTime
      await logActionExecution('verifyOtpApiV1UsersOtpVerifyPost', true, duration, {
        method: 'POST',
        path: '/api/v1/users/otp/verify'
      })
      
      return response.data
    } catch (error) {

      const duration = Date.now() - startTime

      // Enhanced error logging
      await logActionExecution('verifyOtpApiV1UsersOtpVerifyPost', false, duration, {
        method: 'POST',
        path: '/api/v1/users/otp/verify',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      
      // Throw enhanced error with context
      throw new ActionExecutionError(
        error instanceof Error ? error.message : 'Unknown error occurred',
        {
          endpoint: '/api/v1/users/otp/verify',
          method: 'POST',
          timestamp: Date.now()
        },
        error
      )
    }
  })

/**
 * Logout
 * @generated from POST /api/v1/users/logout
 * Features: Input validation, revalidation, error handling
 */
export const logoutApiV1UsersLogoutPost = authActionClient
  .metadata({
    name: "logout-api-v1-users-logout-post",
    requiresAuth: true
  })
  .schema(z.void())
  .action(async ({ parsedInput, ctx }: { parsedInput: void; ctx: { user?: any; ratelimit?: { remaining: number } } }) => {
    const startTime = Date.now()
    
    try {

      // Execute API call with enhanced configuration
      const response = await apiClient.users.logoutApiV1UsersLogoutPost({
        config: {
          timeout: 30000,
          retries: 3,
          validateResponse: false,
          responseSchema: LogoutApiV1UsersLogoutPostResponseSchema
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
      updateTag('Users')
      console.log('Updated tag: Users')


      // Log successful execution
      const duration = Date.now() - startTime
      await logActionExecution('logoutApiV1UsersLogoutPost', true, duration, {
        method: 'POST',
        path: '/api/v1/users/logout'
      })
      
      return response.data
    } catch (error) {

      const duration = Date.now() - startTime

      // Enhanced error logging
      await logActionExecution('logoutApiV1UsersLogoutPost', false, duration, {
        method: 'POST',
        path: '/api/v1/users/logout',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      
      // Throw enhanced error with context
      throw new ActionExecutionError(
        error instanceof Error ? error.message : 'Unknown error occurred',
        {
          endpoint: '/api/v1/users/logout',
          method: 'POST',
          timestamp: Date.now()
        },
        error
      )
    }
  })

/**
 * Get Sessions
 * @generated from GET /api/v1/users/sessions
 * Features: React cache, input validation, error handling
 */
export const getSessionsApiV1UsersSessionsGet = cache(
  authActionClient
    .metadata({
      name: "get-sessions-api-v1-users-sessions-get",
      requiresAuth: true
    })
    .schema(z.void())
    .action(async ({ parsedInput, ctx }: { parsedInput: void; ctx: { user?: any; ratelimit?: { remaining: number } } }) => {
      const startTime = Date.now()
      
      try {

        // Execute API call with enhanced error handling
        const response = await apiClient.users.getSessionsApiV1UsersSessionsGet({
          config: {
            timeout: 30000,
            retries: 3,
            validateResponse: false,
            responseSchema: GetSessionsApiV1UsersSessionsGetResponseSchema
          }
        })
        

        // Log successful execution
        const duration = Date.now() - startTime
        await logActionExecution('getSessionsApiV1UsersSessionsGet', true, duration, {
          method: 'GET',
          path: '/api/v1/users/sessions'
        })
        
        return response.data
      } catch (error) {

        const duration = Date.now() - startTime

        // Enhanced error logging
        await logActionExecution('getSessionsApiV1UsersSessionsGet', false, duration, {
          method: 'GET',
          path: '/api/v1/users/sessions',
          error: error instanceof Error ? error.message : 'Unknown error'
        })
        
        // Throw enhanced error with context
        throw new ActionExecutionError(
          error instanceof Error ? error.message : 'Unknown error occurred',
          {
            endpoint: '/api/v1/users/sessions',
            method: 'GET',
            timestamp: Date.now()
          },
          error
        )
      }
    })
)

/**
 * Revoke Session
 * @generated from DELETE /api/v1/users/sessions/{session_id}
 * Features: Input validation, revalidation, error handling
 */
export const revokeSessionApiV1UsersSessionsSessionIdDelete = authActionClient
  .metadata({
    name: "revoke-session-api-v1-users-sessions-session-id-delete",
    requiresAuth: true
  })
  .schema(RevokeSessionApiV1UsersSessionsSessionIdDeleteParamsSchema)
  .action(async ({ parsedInput, ctx }: { parsedInput: z.infer<typeof RevokeSessionApiV1UsersSessionsSessionIdDeleteParamsSchema>; ctx: { user?: any; ratelimit?: { remaining: number } } }) => {
    const startTime = Date.now()
    
    try {
      // Validate and sanitize parameters
      const validatedParams = await validateAndSanitizeInput(RevokeSessionApiV1UsersSessionsSessionIdDeleteParamsSchema, parsedInput) as z.infer<typeof RevokeSessionApiV1UsersSessionsSessionIdDeleteParamsSchema>

      // Execute API call with enhanced configuration
      const response = await apiClient.users.revokeSessionApiV1UsersSessionsSessionIdDelete({params: {
path: {
        session_id: validatedParams.path.session_id
      }
    },
        config: {
          timeout: 30000,
          retries: 3,
          validateResponse: false,
          responseSchema: RevokeSessionApiV1UsersSessionsSessionIdDeleteResponseSchema
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
      updateTag('Users')
      console.log('Updated tag: Users')


      // Log successful execution
      const duration = Date.now() - startTime
      await logActionExecution('revokeSessionApiV1UsersSessionsSessionIdDelete', true, duration, {
        method: 'DELETE',
        path: '/api/v1/users/sessions/{session_id}'
      })
      
      return response.data
    } catch (error) {

      const duration = Date.now() - startTime

      // Enhanced error logging
      await logActionExecution('revokeSessionApiV1UsersSessionsSessionIdDelete', false, duration, {
        method: 'DELETE',
        path: '/api/v1/users/sessions/{session_id}',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      
      // Throw enhanced error with context
      throw new ActionExecutionError(
        error instanceof Error ? error.message : 'Unknown error occurred',
        {
          endpoint: '/api/v1/users/sessions/{session_id}',
          method: 'DELETE',
          timestamp: Date.now()
        },
        error
      )
    }
  })

/**
 * Logout All
 * @generated from POST /api/v1/users/logout-all
 * Features: Input validation, revalidation, error handling
 */
export const logoutAllApiV1UsersLogoutAllPost = authActionClient
  .metadata({
    name: "logout-all-api-v1-users-logout-all-post",
    requiresAuth: true
  })
  .schema(z.void())
  .action(async ({ parsedInput, ctx }: { parsedInput: void; ctx: { user?: any; ratelimit?: { remaining: number } } }) => {
    const startTime = Date.now()
    
    try {

      // Execute API call with enhanced configuration
      const response = await apiClient.users.logoutAllApiV1UsersLogoutAllPost({
        config: {
          timeout: 30000,
          retries: 3,
          validateResponse: false,
          responseSchema: LogoutAllApiV1UsersLogoutAllPostResponseSchema
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
      updateTag('Users')
      console.log('Updated tag: Users')


      // Log successful execution
      const duration = Date.now() - startTime
      await logActionExecution('logoutAllApiV1UsersLogoutAllPost', true, duration, {
        method: 'POST',
        path: '/api/v1/users/logout-all'
      })
      
      return response.data
    } catch (error) {

      const duration = Date.now() - startTime

      // Enhanced error logging
      await logActionExecution('logoutAllApiV1UsersLogoutAllPost', false, duration, {
        method: 'POST',
        path: '/api/v1/users/logout-all',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      
      // Throw enhanced error with context
      throw new ActionExecutionError(
        error instanceof Error ? error.message : 'Unknown error occurred',
        {
          endpoint: '/api/v1/users/logout-all',
          method: 'POST',
          timestamp: Date.now()
        },
        error
      )
    }
  })

/**
 * Oauth Login
 * @generated from POST /api/v1/users/oauth/login
 * Features: Input validation, revalidation, error handling
 */
export const oauthLoginApiV1UsersOauthLoginPost = actionClientWithMeta
  .metadata({
    name: "oauth-login-api-v1-users-oauth-login-post",
    requiresAuth: false
  })
  .schema(OauthLoginApiV1UsersOauthLoginPostRequestSchema)
  .action(async ({ parsedInput, ctx }: { parsedInput: z.infer<typeof OauthLoginApiV1UsersOauthLoginPostRequestSchema>; ctx?: any }) => {
    const startTime = Date.now()
    
    try {
      // Validate and sanitize request body
      const validatedBody = await validateAndSanitizeInput(OauthLoginApiV1UsersOauthLoginPostRequestSchema, parsedInput)

      // Execute API call with enhanced configuration
      const response = await apiClient.users.oauthLoginApiV1UsersOauthLoginPost({body: validatedBody,
        config: {
          timeout: 30000,
          retries: 3,
          validateResponse: false,
          responseSchema: OauthLoginApiV1UsersOauthLoginPostResponseSchema
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
      updateTag('Users')
      console.log('Updated tag: Users')


      // Log successful execution
      const duration = Date.now() - startTime
      await logActionExecution('oauthLoginApiV1UsersOauthLoginPost', true, duration, {
        method: 'POST',
        path: '/api/v1/users/oauth/login'
      })
      
      return response.data
    } catch (error) {

      const duration = Date.now() - startTime

      // Enhanced error logging
      await logActionExecution('oauthLoginApiV1UsersOauthLoginPost', false, duration, {
        method: 'POST',
        path: '/api/v1/users/oauth/login',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      
      // Throw enhanced error with context
      throw new ActionExecutionError(
        error instanceof Error ? error.message : 'Unknown error occurred',
        {
          endpoint: '/api/v1/users/oauth/login',
          method: 'POST',
          timestamp: Date.now()
        },
        error
      )
    }
  })

/**
 * Request Password Reset
 * @generated from POST /api/v1/users/password/reset/request
 * Features: Input validation, revalidation, error handling
 */
export const requestPasswordResetApiV1UsersPasswordResetRequestPost = actionClientWithMeta
  .metadata({
    name: "request-password-reset-api-v1-users-password-reset-request-post",
    requiresAuth: false
  })
  .schema(RequestPasswordResetApiV1UsersPasswordResetRequestPostRequestSchema)
  .action(async ({ parsedInput, ctx }: { parsedInput: z.infer<typeof RequestPasswordResetApiV1UsersPasswordResetRequestPostRequestSchema>; ctx?: any }) => {
    const startTime = Date.now()
    
    try {
      // Validate and sanitize request body
      const validatedBody = await validateAndSanitizeInput(RequestPasswordResetApiV1UsersPasswordResetRequestPostRequestSchema, parsedInput)

      // Execute API call with enhanced configuration
      const response = await apiClient.users.requestPasswordResetApiV1UsersPasswordResetRequestPost({body: validatedBody,
        config: {
          timeout: 30000,
          retries: 3,
          validateResponse: false,
          responseSchema: RequestPasswordResetApiV1UsersPasswordResetRequestPostResponseSchema
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
      updateTag('Users')
      console.log('Updated tag: Users')


      // Log successful execution
      const duration = Date.now() - startTime
      await logActionExecution('requestPasswordResetApiV1UsersPasswordResetRequestPost', true, duration, {
        method: 'POST',
        path: '/api/v1/users/password/reset/request'
      })
      
      return response.data
    } catch (error) {

      const duration = Date.now() - startTime

      // Enhanced error logging
      await logActionExecution('requestPasswordResetApiV1UsersPasswordResetRequestPost', false, duration, {
        method: 'POST',
        path: '/api/v1/users/password/reset/request',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      
      // Throw enhanced error with context
      throw new ActionExecutionError(
        error instanceof Error ? error.message : 'Unknown error occurred',
        {
          endpoint: '/api/v1/users/password/reset/request',
          method: 'POST',
          timestamp: Date.now()
        },
        error
      )
    }
  })

/**
 * Reset Password
 * @generated from POST /api/v1/users/password/reset
 * Features: Input validation, revalidation, error handling
 */
export const resetPasswordApiV1UsersPasswordResetPost = actionClientWithMeta
  .metadata({
    name: "reset-password-api-v1-users-password-reset-post",
    requiresAuth: false
  })
  .schema(ResetPasswordApiV1UsersPasswordResetPostRequestSchema)
  .action(async ({ parsedInput, ctx }: { parsedInput: z.infer<typeof ResetPasswordApiV1UsersPasswordResetPostRequestSchema>; ctx?: any }) => {
    const startTime = Date.now()
    
    try {
      // Validate and sanitize request body
      const validatedBody = await validateAndSanitizeInput(ResetPasswordApiV1UsersPasswordResetPostRequestSchema, parsedInput)

      // Execute API call with enhanced configuration
      const response = await apiClient.users.resetPasswordApiV1UsersPasswordResetPost({body: validatedBody,
        config: {
          timeout: 30000,
          retries: 3,
          validateResponse: false,
          responseSchema: ResetPasswordApiV1UsersPasswordResetPostResponseSchema
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
      updateTag('Users')
      console.log('Updated tag: Users')


      // Log successful execution
      const duration = Date.now() - startTime
      await logActionExecution('resetPasswordApiV1UsersPasswordResetPost', true, duration, {
        method: 'POST',
        path: '/api/v1/users/password/reset'
      })
      
      return response.data
    } catch (error) {

      const duration = Date.now() - startTime

      // Enhanced error logging
      await logActionExecution('resetPasswordApiV1UsersPasswordResetPost', false, duration, {
        method: 'POST',
        path: '/api/v1/users/password/reset',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      
      // Throw enhanced error with context
      throw new ActionExecutionError(
        error instanceof Error ? error.message : 'Unknown error occurred',
        {
          endpoint: '/api/v1/users/password/reset',
          method: 'POST',
          timestamp: Date.now()
        },
        error
      )
    }
  })

/**
 * Change Password
 * @generated from POST /api/v1/users/password/change
 * Features: Input validation, revalidation, error handling
 */
export const changePasswordApiV1UsersPasswordChangePost = authActionClient
  .metadata({
    name: "change-password-api-v1-users-password-change-post",
    requiresAuth: true
  })
  .schema(ChangePasswordApiV1UsersPasswordChangePostRequestSchema)
  .action(async ({ parsedInput, ctx }: { parsedInput: z.infer<typeof ChangePasswordApiV1UsersPasswordChangePostRequestSchema>; ctx: { user?: any; ratelimit?: { remaining: number } } }) => {
    const startTime = Date.now()
    
    try {
      // Validate and sanitize request body
      const validatedBody = await validateAndSanitizeInput(ChangePasswordApiV1UsersPasswordChangePostRequestSchema, parsedInput)

      // Execute API call with enhanced configuration
      const response = await apiClient.users.changePasswordApiV1UsersPasswordChangePost({body: validatedBody,
        config: {
          timeout: 30000,
          retries: 3,
          validateResponse: false,
          responseSchema: ChangePasswordApiV1UsersPasswordChangePostResponseSchema
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
      updateTag('Users')
      console.log('Updated tag: Users')


      // Log successful execution
      const duration = Date.now() - startTime
      await logActionExecution('changePasswordApiV1UsersPasswordChangePost', true, duration, {
        method: 'POST',
        path: '/api/v1/users/password/change'
      })
      
      return response.data
    } catch (error) {

      const duration = Date.now() - startTime

      // Enhanced error logging
      await logActionExecution('changePasswordApiV1UsersPasswordChangePost', false, duration, {
        method: 'POST',
        path: '/api/v1/users/password/change',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      
      // Throw enhanced error with context
      throw new ActionExecutionError(
        error instanceof Error ? error.message : 'Unknown error occurred',
        {
          endpoint: '/api/v1/users/password/change',
          method: 'POST',
          timestamp: Date.now()
        },
        error
      )
    }
  })

/**
 * Verify Email
 * @generated from POST /api/v1/users/email/verify
 * Features: Input validation, revalidation, error handling
 */
export const verifyEmailApiV1UsersEmailVerifyPost = authActionClient
  .metadata({
    name: "verify-email-api-v1-users-email-verify-post",
    requiresAuth: false
  })
  .schema(VerifyEmailApiV1UsersEmailVerifyPostRequestSchema)
  .action(async ({ parsedInput, ctx }: { parsedInput: z.infer<typeof VerifyEmailApiV1UsersEmailVerifyPostRequestSchema>; ctx: { user?: any; ratelimit?: { remaining: number } } }) => {
    const startTime = Date.now()
    
    try {
      // Validate and sanitize request body
      const validatedBody = await validateAndSanitizeInput(VerifyEmailApiV1UsersEmailVerifyPostRequestSchema, parsedInput)

      // Execute API call with enhanced configuration
      const response = await apiClient.users.verifyEmailApiV1UsersEmailVerifyPost({body: validatedBody,
        config: {
          timeout: 30000,
          retries: 3,
          validateResponse: false,
          responseSchema: VerifyEmailApiV1UsersEmailVerifyPostResponseSchema
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
      updateTag('Users')
      console.log('Updated tag: Users')


      // Log successful execution
      const duration = Date.now() - startTime
      await logActionExecution('verifyEmailApiV1UsersEmailVerifyPost', true, duration, {
        method: 'POST',
        path: '/api/v1/users/email/verify'
      })
      
      return response.data
    } catch (error) {

      const duration = Date.now() - startTime

      // Enhanced error logging
      await logActionExecution('verifyEmailApiV1UsersEmailVerifyPost', false, duration, {
        method: 'POST',
        path: '/api/v1/users/email/verify',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      
      // Throw enhanced error with context
      throw new ActionExecutionError(
        error instanceof Error ? error.message : 'Unknown error occurred',
        {
          endpoint: '/api/v1/users/email/verify',
          method: 'POST',
          timestamp: Date.now()
        },
        error
      )
    }
  })

/**
 * Resend Email Verification
 * @generated from POST /api/v1/users/email/resend-verification
 * Features: Input validation, revalidation, error handling
 */
export const resendEmailVerificationApiV1UsersEmailResendVerificationPost = authActionClient
  .metadata({
    name: "resend-email-verification-api-v1-users-email-resend-verification-post",
    requiresAuth: true
  })
  .schema(z.void())
  .action(async ({ parsedInput, ctx }: { parsedInput: void; ctx: { user?: any; ratelimit?: { remaining: number } } }) => {
    const startTime = Date.now()
    
    try {

      // Execute API call with enhanced configuration
      const response = await apiClient.users.resendEmailVerificationApiV1UsersEmailResendVerificationPost({
        config: {
          timeout: 30000,
          retries: 3,
          validateResponse: false,
          responseSchema: ResendEmailVerificationApiV1UsersEmailResendVerificationPostResponseSchema
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
      updateTag('Users')
      console.log('Updated tag: Users')


      // Log successful execution
      const duration = Date.now() - startTime
      await logActionExecution('resendEmailVerificationApiV1UsersEmailResendVerificationPost', true, duration, {
        method: 'POST',
        path: '/api/v1/users/email/resend-verification'
      })
      
      return response.data
    } catch (error) {

      const duration = Date.now() - startTime

      // Enhanced error logging
      await logActionExecution('resendEmailVerificationApiV1UsersEmailResendVerificationPost', false, duration, {
        method: 'POST',
        path: '/api/v1/users/email/resend-verification',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      
      // Throw enhanced error with context
      throw new ActionExecutionError(
        error instanceof Error ? error.message : 'Unknown error occurred',
        {
          endpoint: '/api/v1/users/email/resend-verification',
          method: 'POST',
          timestamp: Date.now()
        },
        error
      )
    }
  })

/**
 * Verify 2Fa Login
 * @generated from POST /api/v1/users/login/2fa/verify
 * Features: Input validation, revalidation, error handling
 */
export const verify2faLoginApiV1UsersLogin2faVerifyPost = actionClientWithMeta
  .metadata({
    name: "verify2fa-login-api-v1-users-login2fa-verify-post",
    requiresAuth: false
  })
  .schema(Verify2faLoginApiV1UsersLogin2faVerifyPostRequestSchema)
  .action(async ({ parsedInput, ctx }: { parsedInput: z.infer<typeof Verify2faLoginApiV1UsersLogin2faVerifyPostRequestSchema>; ctx?: any }) => {
    const startTime = Date.now()
    
    try {
      // Validate and sanitize request body
      const validatedBody = await validateAndSanitizeInput(Verify2faLoginApiV1UsersLogin2faVerifyPostRequestSchema, parsedInput)

      // Execute API call with enhanced configuration
      const response = await apiClient.users.verify2faLoginApiV1UsersLogin2faVerifyPost({body: validatedBody,
        config: {
          timeout: 30000,
          retries: 3,
          validateResponse: false,
          responseSchema: Verify2faLoginApiV1UsersLogin2faVerifyPostResponseSchema
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
      updateTag('Users')
      console.log('Updated tag: Users')


      // Log successful execution
      const duration = Date.now() - startTime
      await logActionExecution('verify2faLoginApiV1UsersLogin2faVerifyPost', true, duration, {
        method: 'POST',
        path: '/api/v1/users/login/2fa/verify'
      })
      
      return response.data
    } catch (error) {

      const duration = Date.now() - startTime

      // Enhanced error logging
      await logActionExecution('verify2faLoginApiV1UsersLogin2faVerifyPost', false, duration, {
        method: 'POST',
        path: '/api/v1/users/login/2fa/verify',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      
      // Throw enhanced error with context
      throw new ActionExecutionError(
        error instanceof Error ? error.message : 'Unknown error occurred',
        {
          endpoint: '/api/v1/users/login/2fa/verify',
          method: 'POST',
          timestamp: Date.now()
        },
        error
      )
    }
  })

/**
 * Setup 2Fa
 * @generated from POST /api/v1/users/2fa/setup
 * Features: Input validation, revalidation, error handling
 */
export const setup2faApiV1Users2faSetupPost = authActionClient
  .metadata({
    name: "setup2fa-api-v1-users2fa-setup-post",
    requiresAuth: true
  })
  .schema(z.void())
  .action(async ({ parsedInput, ctx }: { parsedInput: void; ctx: { user?: any; ratelimit?: { remaining: number } } }) => {
    const startTime = Date.now()
    
    try {

      // Execute API call with enhanced configuration
      const response = await apiClient.users.setup2faApiV1Users2faSetupPost({
        config: {
          timeout: 30000,
          retries: 3,
          validateResponse: false,
          responseSchema: Setup2faApiV1Users2faSetupPostResponseSchema
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
      updateTag('Users')
      console.log('Updated tag: Users')


      // Log successful execution
      const duration = Date.now() - startTime
      await logActionExecution('setup2faApiV1Users2faSetupPost', true, duration, {
        method: 'POST',
        path: '/api/v1/users/2fa/setup'
      })
      
      return response.data
    } catch (error) {

      const duration = Date.now() - startTime

      // Enhanced error logging
      await logActionExecution('setup2faApiV1Users2faSetupPost', false, duration, {
        method: 'POST',
        path: '/api/v1/users/2fa/setup',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      
      // Throw enhanced error with context
      throw new ActionExecutionError(
        error instanceof Error ? error.message : 'Unknown error occurred',
        {
          endpoint: '/api/v1/users/2fa/setup',
          method: 'POST',
          timestamp: Date.now()
        },
        error
      )
    }
  })

/**
 * Verify 2Fa Setup
 * @generated from POST /api/v1/users/2fa/verify
 * Features: Input validation, revalidation, error handling
 */
export const verify2faSetupApiV1Users2faVerifyPost = authActionClient
  .metadata({
    name: "verify2fa-setup-api-v1-users2fa-verify-post",
    requiresAuth: true
  })
  .schema(Verify2faSetupApiV1Users2faVerifyPostRequestSchema)
  .action(async ({ parsedInput, ctx }: { parsedInput: z.infer<typeof Verify2faSetupApiV1Users2faVerifyPostRequestSchema>; ctx: { user?: any; ratelimit?: { remaining: number } } }) => {
    const startTime = Date.now()
    
    try {
      // Validate and sanitize request body
      const validatedBody = await validateAndSanitizeInput(Verify2faSetupApiV1Users2faVerifyPostRequestSchema, parsedInput)

      // Execute API call with enhanced configuration
      const response = await apiClient.users.verify2faSetupApiV1Users2faVerifyPost({body: validatedBody,
        config: {
          timeout: 30000,
          retries: 3,
          validateResponse: false,
          responseSchema: Verify2faSetupApiV1Users2faVerifyPostResponseSchema
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
      updateTag('Users')
      console.log('Updated tag: Users')


      // Log successful execution
      const duration = Date.now() - startTime
      await logActionExecution('verify2faSetupApiV1Users2faVerifyPost', true, duration, {
        method: 'POST',
        path: '/api/v1/users/2fa/verify'
      })
      
      return response.data
    } catch (error) {

      const duration = Date.now() - startTime

      // Enhanced error logging
      await logActionExecution('verify2faSetupApiV1Users2faVerifyPost', false, duration, {
        method: 'POST',
        path: '/api/v1/users/2fa/verify',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      
      // Throw enhanced error with context
      throw new ActionExecutionError(
        error instanceof Error ? error.message : 'Unknown error occurred',
        {
          endpoint: '/api/v1/users/2fa/verify',
          method: 'POST',
          timestamp: Date.now()
        },
        error
      )
    }
  })

/**
 * Get 2Fa Status
 * @generated from GET /api/v1/users/2fa/status
 * Features: React cache, input validation, error handling
 */
export const get2faStatusApiV1Users2faStatusGet = cache(
  authActionClient
    .metadata({
      name: "get2fa-status-api-v1-users2fa-status-get",
      requiresAuth: true
    })
    .schema(z.void())
    .action(async ({ parsedInput, ctx }: { parsedInput: void; ctx: { user?: any; ratelimit?: { remaining: number } } }) => {
      const startTime = Date.now()
      
      try {

        // Execute API call with enhanced error handling
        const response = await apiClient.users.get2faStatusApiV1Users2faStatusGet({
          config: {
            timeout: 30000,
            retries: 3,
            validateResponse: false,
            responseSchema: Get2faStatusApiV1Users2faStatusGetResponseSchema
          }
        })
        

        // Log successful execution
        const duration = Date.now() - startTime
        await logActionExecution('get2faStatusApiV1Users2faStatusGet', true, duration, {
          method: 'GET',
          path: '/api/v1/users/2fa/status'
        })
        
        return response.data
      } catch (error) {

        const duration = Date.now() - startTime

        // Enhanced error logging
        await logActionExecution('get2faStatusApiV1Users2faStatusGet', false, duration, {
          method: 'GET',
          path: '/api/v1/users/2fa/status',
          error: error instanceof Error ? error.message : 'Unknown error'
        })
        
        // Throw enhanced error with context
        throw new ActionExecutionError(
          error instanceof Error ? error.message : 'Unknown error occurred',
          {
            endpoint: '/api/v1/users/2fa/status',
            method: 'GET',
            timestamp: Date.now()
          },
          error
        )
      }
    })
)

/**
 * Disable 2Fa
 * @generated from POST /api/v1/users/2fa/disable
 * Features: Input validation, revalidation, error handling
 */
export const disable2faApiV1Users2faDisablePost = authActionClient
  .metadata({
    name: "disable2fa-api-v1-users2fa-disable-post",
    requiresAuth: true
  })
  .schema(Disable2faApiV1Users2faDisablePostRequestSchema)
  .action(async ({ parsedInput, ctx }: { parsedInput: z.infer<typeof Disable2faApiV1Users2faDisablePostRequestSchema>; ctx: { user?: any; ratelimit?: { remaining: number } } }) => {
    const startTime = Date.now()
    
    try {
      // Validate and sanitize request body
      const validatedBody = await validateAndSanitizeInput(Disable2faApiV1Users2faDisablePostRequestSchema, parsedInput)

      // Execute API call with enhanced configuration
      const response = await apiClient.users.disable2faApiV1Users2faDisablePost({body: validatedBody,
        config: {
          timeout: 30000,
          retries: 3,
          validateResponse: false,
          responseSchema: Disable2faApiV1Users2faDisablePostResponseSchema
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
      updateTag('Users')
      console.log('Updated tag: Users')


      // Log successful execution
      const duration = Date.now() - startTime
      await logActionExecution('disable2faApiV1Users2faDisablePost', true, duration, {
        method: 'POST',
        path: '/api/v1/users/2fa/disable'
      })
      
      return response.data
    } catch (error) {

      const duration = Date.now() - startTime

      // Enhanced error logging
      await logActionExecution('disable2faApiV1Users2faDisablePost', false, duration, {
        method: 'POST',
        path: '/api/v1/users/2fa/disable',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      
      // Throw enhanced error with context
      throw new ActionExecutionError(
        error instanceof Error ? error.message : 'Unknown error occurred',
        {
          endpoint: '/api/v1/users/2fa/disable',
          method: 'POST',
          timestamp: Date.now()
        },
        error
      )
    }
  })

/**
 * Regenerate Backup Codes
 * @generated from POST /api/v1/users/2fa/backup-codes/regenerate
 * Features: Input validation, revalidation, error handling
 */
export const regenerateBackupCodesApiV1Users2faBackupCodesRegeneratePost = authActionClient
  .metadata({
    name: "regenerate-backup-codes-api-v1-users2fa-backup-codes-regenerate-post",
    requiresAuth: true
  })
  .schema(z.void())
  .action(async ({ parsedInput, ctx }: { parsedInput: void; ctx: { user?: any; ratelimit?: { remaining: number } } }) => {
    const startTime = Date.now()
    
    try {

      // Execute API call with enhanced configuration
      const response = await apiClient.users.regenerateBackupCodesApiV1Users2faBackupCodesRegeneratePost({
        config: {
          timeout: 30000,
          retries: 3,
          validateResponse: false,
          responseSchema: RegenerateBackupCodesApiV1Users2faBackupCodesRegeneratePostResponseSchema
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
      updateTag('Users')
      console.log('Updated tag: Users')


      // Log successful execution
      const duration = Date.now() - startTime
      await logActionExecution('regenerateBackupCodesApiV1Users2faBackupCodesRegeneratePost', true, duration, {
        method: 'POST',
        path: '/api/v1/users/2fa/backup-codes/regenerate'
      })
      
      return response.data
    } catch (error) {

      const duration = Date.now() - startTime

      // Enhanced error logging
      await logActionExecution('regenerateBackupCodesApiV1Users2faBackupCodesRegeneratePost', false, duration, {
        method: 'POST',
        path: '/api/v1/users/2fa/backup-codes/regenerate',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      
      // Throw enhanced error with context
      throw new ActionExecutionError(
        error instanceof Error ? error.message : 'Unknown error occurred',
        {
          endpoint: '/api/v1/users/2fa/backup-codes/regenerate',
          method: 'POST',
          timestamp: Date.now()
        },
        error
      )
    }
  })

/**
 * Export User Data
 * @generated from GET /api/v1/users/data-export
 * Features: React cache, input validation, error handling
 */
export const exportUserDataApiV1UsersDataExportGet = cache(
  authActionClient
    .metadata({
      name: "export-user-data-api-v1-users-data-export-get",
      requiresAuth: true
    })
    .schema(z.void())
    .action(async ({ parsedInput, ctx }: { parsedInput: void; ctx: { user?: any; ratelimit?: { remaining: number } } }) => {
      const startTime = Date.now()
      
      try {

        // Execute API call with enhanced error handling
        const response = await apiClient.users.exportUserDataApiV1UsersDataExportGet({
          config: {
            timeout: 30000,
            retries: 3,
            validateResponse: false,
            responseSchema: ExportUserDataApiV1UsersDataExportGetResponseSchema
          }
        })
        

        // Log successful execution
        const duration = Date.now() - startTime
        await logActionExecution('exportUserDataApiV1UsersDataExportGet', true, duration, {
          method: 'GET',
          path: '/api/v1/users/data-export'
        })
        
        return response.data
      } catch (error) {

        const duration = Date.now() - startTime

        // Enhanced error logging
        await logActionExecution('exportUserDataApiV1UsersDataExportGet', false, duration, {
          method: 'GET',
          path: '/api/v1/users/data-export',
          error: error instanceof Error ? error.message : 'Unknown error'
        })
        
        // Throw enhanced error with context
        throw new ActionExecutionError(
          error instanceof Error ? error.message : 'Unknown error occurred',
          {
            endpoint: '/api/v1/users/data-export',
            method: 'GET',
            timestamp: Date.now()
          },
          error
        )
      }
    })
)

/**
 * Delete Account
 * @generated from POST /api/v1/users/account/delete
 * Features: Input validation, revalidation, error handling
 */
export const deleteAccountApiV1UsersAccountDeletePost = authActionClient
  .metadata({
    name: "delete-account-api-v1-users-account-delete-post",
    requiresAuth: true
  })
  .schema(DeleteAccountApiV1UsersAccountDeletePostRequestSchema)
  .action(async ({ parsedInput, ctx }: { parsedInput: z.infer<typeof DeleteAccountApiV1UsersAccountDeletePostRequestSchema>; ctx: { user?: any; ratelimit?: { remaining: number } } }) => {
    const startTime = Date.now()
    
    try {
      // Validate and sanitize request body
      const validatedBody = await validateAndSanitizeInput(DeleteAccountApiV1UsersAccountDeletePostRequestSchema, parsedInput)

      // Execute API call with enhanced configuration
      const response = await apiClient.users.deleteAccountApiV1UsersAccountDeletePost({body: validatedBody,
        config: {
          timeout: 30000,
          retries: 3,
          validateResponse: false,
          responseSchema: DeleteAccountApiV1UsersAccountDeletePostResponseSchema
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
      updateTag('Users')
      console.log('Updated tag: Users')


      // Log successful execution
      const duration = Date.now() - startTime
      await logActionExecution('deleteAccountApiV1UsersAccountDeletePost', true, duration, {
        method: 'POST',
        path: '/api/v1/users/account/delete'
      })
      
      return response.data
    } catch (error) {

      const duration = Date.now() - startTime

      // Enhanced error logging
      await logActionExecution('deleteAccountApiV1UsersAccountDeletePost', false, duration, {
        method: 'POST',
        path: '/api/v1/users/account/delete',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      
      // Throw enhanced error with context
      throw new ActionExecutionError(
        error instanceof Error ? error.message : 'Unknown error occurred',
        {
          endpoint: '/api/v1/users/account/delete',
          method: 'POST',
          timestamp: Date.now()
        },
        error
      )
    }
  })