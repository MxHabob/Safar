'use server'
import { z } from 'zod'
import { cache } from 'react'
import { updateTag } from 'next/cache'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { apiClient } from '@/generated/client'
import { actionClientWithMeta, authActionClient, ActionError } from '@/generated/lib/safe-action'
import {
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
  LogoutAllApiV1UsersLogoutAllPostResponseSchema,
  OauthLoginApiV1UsersOauthLoginPostRequestSchema,
  OauthLoginApiV1UsersOauthLoginPostResponseSchema
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