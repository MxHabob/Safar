import { z } from 'zod'
import { cache } from 'react'
import { BaseApiClient } from './base'
import type { ClientResponse, RequestConfiguration } from './base'
import { defaultMiddleware } from './middleware'
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
  OauthLoginApiV1UsersOauthLoginPostResponseSchema,
  RequestPasswordResetApiV1UsersPasswordResetRequestPostRequestSchema,
  RequestPasswordResetApiV1UsersPasswordResetRequestPostResponseSchema,
  ResetPasswordApiV1UsersPasswordResetPostRequestSchema,
  ResetPasswordApiV1UsersPasswordResetPostResponseSchema,
  ChangePasswordApiV1UsersPasswordChangePostRequestSchema,
  ChangePasswordApiV1UsersPasswordChangePostResponseSchema,
  VerifyEmailApiV1UsersEmailVerifyPostRequestSchema,
  VerifyEmailApiV1UsersEmailVerifyPostResponseSchema,
  ResendEmailVerificationApiV1UsersEmailResendVerificationPostResponseSchema
} from '@/generated/schemas'

export class UsersApiClient extends BaseApiClient {
  constructor() {
    super()
    
    // Add tag-specific middleware
    this.addMiddleware({
      name: 'users-context',
      onRequest: async (config) => {
        return {
          ...config,
          headers: {
            ...config.headers,
            'X-API-Context': 'users'
          }
        }
      }
    })
  }

  /**
   * Register
   * Register a new user.
   * @param options - Request options
   * @returns Promise<ClientResponse<z.infer<typeof RegisterApiV1UsersRegisterPostResponseSchema>>>
   * @example
   * const result = await client.registerApiV1UsersRegisterPost({
   *   config: { timeout: 5000 }
   * })
   */
  registerApiV1UsersRegisterPost = async (options: {
    body: z.infer<typeof RegisterApiV1UsersRegisterPostRequestSchema>
    config?: RequestConfiguration
  }) => {
    // Validate request body
    const validatedBody = await RegisterApiV1UsersRegisterPostRequestSchema.parseAsync(options.body)

    return this.request<z.infer<typeof RegisterApiV1UsersRegisterPostResponseSchema>>(
      'POST',
      '/api/v1/users/register',
      {
body: validatedBody,
config: { ...options?.config, middleware: [...defaultMiddleware, ...(options?.config?.middleware || [])] },
responseSchema: RegisterApiV1UsersRegisterPostResponseSchema
      }
    )
  }

  /**
   * Login
   * Login with email and password.
   * @param options - Request options
   * @returns Promise<ClientResponse<z.infer<typeof LoginApiV1UsersLoginPostResponseSchema>>>
   * @example
   * const result = await client.loginApiV1UsersLoginPost({
   *   config: { timeout: 5000 }
   * })
   */
  loginApiV1UsersLoginPost = async (options: {
    body: z.infer<typeof LoginApiV1UsersLoginPostRequestSchema>
    config?: RequestConfiguration
  }) => {
    // Validate request body
    const validatedBody = await LoginApiV1UsersLoginPostRequestSchema.parseAsync(options.body)

    return this.request<z.infer<typeof LoginApiV1UsersLoginPostResponseSchema>>(
      'POST',
      '/api/v1/users/login',
      {
body: validatedBody,
config: { ...options?.config, middleware: [...defaultMiddleware, ...(options?.config?.middleware || [])] },
responseSchema: LoginApiV1UsersLoginPostResponseSchema
      }
    )
  }

  /**
   * Refresh Token
   * Refresh an access token using a valid refresh token.
   * @param options - Request options
   * @returns Promise<ClientResponse<z.infer<typeof RefreshTokenApiV1UsersRefreshPostResponseSchema>>>
   * @example
   * const result = await client.refreshTokenApiV1UsersRefreshPost({
   *   config: { timeout: 5000 }
   * })
   */
  refreshTokenApiV1UsersRefreshPost = async (options: {
    body: z.infer<typeof RefreshTokenApiV1UsersRefreshPostRequestSchema>
    config?: RequestConfiguration
  }) => {
    // Validate request body
    const validatedBody = await RefreshTokenApiV1UsersRefreshPostRequestSchema.parseAsync(options.body)

    return this.request<z.infer<typeof RefreshTokenApiV1UsersRefreshPostResponseSchema>>(
      'POST',
      '/api/v1/users/refresh',
      {
body: validatedBody,
config: { ...options?.config, middleware: [...defaultMiddleware, ...(options?.config?.middleware || [])] },
responseSchema: RefreshTokenApiV1UsersRefreshPostResponseSchema
      }
    )
  }

  /**
   * Get Current User Info
   * Get the currently authenticated user profile.
   * @param options - Request options
   * @returns Promise<ClientResponse<z.infer<typeof GetCurrentUserInfoApiV1UsersMeGetResponseSchema>>>
   * @example
   * const result = await client.getCurrentUserInfoApiV1UsersMeGet({
   *   config: { timeout: 5000 }
   * })
   */
  getCurrentUserInfoApiV1UsersMeGet = cache(async (options?: { config?: RequestConfiguration }) => {
    return this.request<z.infer<typeof GetCurrentUserInfoApiV1UsersMeGetResponseSchema>>(
      'GET',
      '/api/v1/users/me',
      {
config: { ...options?.config, middleware: [...defaultMiddleware, ...(options?.config?.middleware || [])] },
responseSchema: GetCurrentUserInfoApiV1UsersMeGetResponseSchema
      }
    )
  })

  /**
   * Update Current User
   * Update the currently authenticated user profile.
   * @param options - Request options
   * @returns Promise<ClientResponse<z.infer<typeof UpdateCurrentUserApiV1UsersMePutResponseSchema>>>
   * @example
   * const result = await client.updateCurrentUserApiV1UsersMePut({
   *   config: { timeout: 5000 }
   * })
   */
  updateCurrentUserApiV1UsersMePut = async (options: {
    body: z.infer<typeof UpdateCurrentUserApiV1UsersMePutRequestSchema>
    config?: RequestConfiguration
  }) => {
    // Validate request body
    const validatedBody = await UpdateCurrentUserApiV1UsersMePutRequestSchema.parseAsync(options.body)

    return this.request<z.infer<typeof UpdateCurrentUserApiV1UsersMePutResponseSchema>>(
      'PUT',
      '/api/v1/users/me',
      {
body: validatedBody,
config: { ...options?.config, middleware: [...defaultMiddleware, ...(options?.config?.middleware || [])] },
responseSchema: UpdateCurrentUserApiV1UsersMePutResponseSchema
      }
    )
  }

  /**
   * Request Otp
   * Request an OTP code for phone verification.
   * @param options - Request options
   * @returns Promise<ClientResponse<z.infer<typeof RequestOtpApiV1UsersOtpRequestPostResponseSchema>>>
   * @example
   * const result = await client.requestOtpApiV1UsersOtpRequestPost({
   *   config: { timeout: 5000 }
   * })
   */
  requestOtpApiV1UsersOtpRequestPost = async (options: {
    body: z.infer<typeof RequestOtpApiV1UsersOtpRequestPostRequestSchema>
    config?: RequestConfiguration
  }) => {
    // Validate request body
    const validatedBody = await RequestOtpApiV1UsersOtpRequestPostRequestSchema.parseAsync(options.body)

    return this.request<z.infer<typeof RequestOtpApiV1UsersOtpRequestPostResponseSchema>>(
      'POST',
      '/api/v1/users/otp/request',
      {
body: validatedBody,
config: { ...options?.config, middleware: [...defaultMiddleware, ...(options?.config?.middleware || [])] },
responseSchema: RequestOtpApiV1UsersOtpRequestPostResponseSchema
      }
    )
  }

  /**
   * Verify Otp
   * Verify an OTP code for phone verification.
   * @param options - Request options
   * @returns Promise<ClientResponse<z.infer<typeof VerifyOtpApiV1UsersOtpVerifyPostResponseSchema>>>
   * @example
   * const result = await client.verifyOtpApiV1UsersOtpVerifyPost({
   *   config: { timeout: 5000 }
   * })
   */
  verifyOtpApiV1UsersOtpVerifyPost = async (options: {
    body: z.infer<typeof VerifyOtpApiV1UsersOtpVerifyPostRequestSchema>
    config?: RequestConfiguration
  }) => {
    // Validate request body
    const validatedBody = await VerifyOtpApiV1UsersOtpVerifyPostRequestSchema.parseAsync(options.body)

    return this.request<z.infer<typeof VerifyOtpApiV1UsersOtpVerifyPostResponseSchema>>(
      'POST',
      '/api/v1/users/otp/verify',
      {
body: validatedBody,
config: { ...options?.config, middleware: [...defaultMiddleware, ...(options?.config?.middleware || [])] },
responseSchema: VerifyOtpApiV1UsersOtpVerifyPostResponseSchema
      }
    )
  }

  /**
   * Logout
   * Logout the current user and revoke the current token.
   * @param options - Request options
   * @returns Promise<ClientResponse<z.infer<typeof LogoutApiV1UsersLogoutPostResponseSchema>>>
   * @example
   * const result = await client.logoutApiV1UsersLogoutPost({
   *   config: { timeout: 5000 }
   * })
   */
  logoutApiV1UsersLogoutPost = async (options?: { config?: RequestConfiguration }) => {
    return this.request<z.infer<typeof LogoutApiV1UsersLogoutPostResponseSchema>>(
      'POST',
      '/api/v1/users/logout',
      {
config: { ...options?.config, middleware: [...defaultMiddleware, ...(options?.config?.middleware || [])] },
responseSchema: LogoutApiV1UsersLogoutPostResponseSchema
      }
    )
  }

  /**
   * Logout All
   * Logout the current user from all devices (revoke all tokens).
   * @param options - Request options
   * @returns Promise<ClientResponse<z.infer<typeof LogoutAllApiV1UsersLogoutAllPostResponseSchema>>>
   * @example
   * const result = await client.logoutAllApiV1UsersLogoutAllPost({
   *   config: { timeout: 5000 }
   * })
   */
  logoutAllApiV1UsersLogoutAllPost = async (options?: { config?: RequestConfiguration }) => {
    return this.request<z.infer<typeof LogoutAllApiV1UsersLogoutAllPostResponseSchema>>(
      'POST',
      '/api/v1/users/logout-all',
      {
config: { ...options?.config, middleware: [...defaultMiddleware, ...(options?.config?.middleware || [])] },
responseSchema: LogoutAllApiV1UsersLogoutAllPostResponseSchema
      }
    )
  }

  /**
   * Oauth Login
   * Login via OAuth (Google, Apple).
   * @param options - Request options
   * @returns Promise<ClientResponse<z.infer<typeof OauthLoginApiV1UsersOauthLoginPostResponseSchema>>>
   * @example
   * const result = await client.oauthLoginApiV1UsersOauthLoginPost({
   *   config: { timeout: 5000 }
   * })
   */
  oauthLoginApiV1UsersOauthLoginPost = async (options: {
    body: z.infer<typeof OauthLoginApiV1UsersOauthLoginPostRequestSchema>
    config?: RequestConfiguration
  }) => {
    // Validate request body
    const validatedBody = await OauthLoginApiV1UsersOauthLoginPostRequestSchema.parseAsync(options.body)

    return this.request<z.infer<typeof OauthLoginApiV1UsersOauthLoginPostResponseSchema>>(
      'POST',
      '/api/v1/users/oauth/login',
      {
body: validatedBody,
config: { ...options?.config, middleware: [...defaultMiddleware, ...(options?.config?.middleware || [])] },
responseSchema: OauthLoginApiV1UsersOauthLoginPostResponseSchema
      }
    )
  }

  /**
   * Request Password Reset
   * Request a password reset code.
   * @param options - Request options
   * @returns Promise<ClientResponse<z.infer<typeof RequestPasswordResetApiV1UsersPasswordResetRequestPostResponseSchema>>>
   * @example
   * const result = await client.requestPasswordResetApiV1UsersPasswordResetRequestPost({
   *   config: { timeout: 5000 }
   * })
   */
  requestPasswordResetApiV1UsersPasswordResetRequestPost = async (options: {
    body: z.infer<typeof RequestPasswordResetApiV1UsersPasswordResetRequestPostRequestSchema>
    config?: RequestConfiguration
  }) => {
    // Validate request body
    const validatedBody = await RequestPasswordResetApiV1UsersPasswordResetRequestPostRequestSchema.parseAsync(options.body)

    return this.request<z.infer<typeof RequestPasswordResetApiV1UsersPasswordResetRequestPostResponseSchema>>(
      'POST',
      '/api/v1/users/password/reset/request',
      {
body: validatedBody,
config: { ...options?.config, middleware: [...defaultMiddleware, ...(options?.config?.middleware || [])] },
responseSchema: RequestPasswordResetApiV1UsersPasswordResetRequestPostResponseSchema
      }
    )
  }

  /**
   * Reset Password
   * Reset password using verification code.
   * @param options - Request options
   * @returns Promise<ClientResponse<z.infer<typeof ResetPasswordApiV1UsersPasswordResetPostResponseSchema>>>
   * @example
   * const result = await client.resetPasswordApiV1UsersPasswordResetPost({
   *   config: { timeout: 5000 }
   * })
   */
  resetPasswordApiV1UsersPasswordResetPost = async (options: {
    body: z.infer<typeof ResetPasswordApiV1UsersPasswordResetPostRequestSchema>
    config?: RequestConfiguration
  }) => {
    // Validate request body
    const validatedBody = await ResetPasswordApiV1UsersPasswordResetPostRequestSchema.parseAsync(options.body)

    return this.request<z.infer<typeof ResetPasswordApiV1UsersPasswordResetPostResponseSchema>>(
      'POST',
      '/api/v1/users/password/reset',
      {
body: validatedBody,
config: { ...options?.config, middleware: [...defaultMiddleware, ...(options?.config?.middleware || [])] },
responseSchema: ResetPasswordApiV1UsersPasswordResetPostResponseSchema
      }
    )
  }

  /**
   * Change Password
   * Change password for authenticated user.
   * @param options - Request options
   * @returns Promise<ClientResponse<z.infer<typeof ChangePasswordApiV1UsersPasswordChangePostResponseSchema>>>
   * @example
   * const result = await client.changePasswordApiV1UsersPasswordChangePost({
   *   config: { timeout: 5000 }
   * })
   */
  changePasswordApiV1UsersPasswordChangePost = async (options: {
    body: z.infer<typeof ChangePasswordApiV1UsersPasswordChangePostRequestSchema>
    config?: RequestConfiguration
  }) => {
    // Validate request body
    const validatedBody = await ChangePasswordApiV1UsersPasswordChangePostRequestSchema.parseAsync(options.body)

    return this.request<z.infer<typeof ChangePasswordApiV1UsersPasswordChangePostResponseSchema>>(
      'POST',
      '/api/v1/users/password/change',
      {
body: validatedBody,
config: { ...options?.config, middleware: [...defaultMiddleware, ...(options?.config?.middleware || [])] },
responseSchema: ChangePasswordApiV1UsersPasswordChangePostResponseSchema
      }
    )
  }

  /**
   * Verify Email
   * Verify email address with verification code.
   * @param options - Request options
   * @returns Promise<ClientResponse<z.infer<typeof VerifyEmailApiV1UsersEmailVerifyPostResponseSchema>>>
   * @example
   * const result = await client.verifyEmailApiV1UsersEmailVerifyPost({
   *   config: { timeout: 5000 }
   * })
   */
  verifyEmailApiV1UsersEmailVerifyPost = async (options: {
    body: z.infer<typeof VerifyEmailApiV1UsersEmailVerifyPostRequestSchema>
    config?: RequestConfiguration
  }) => {
    // Validate request body
    const validatedBody = await VerifyEmailApiV1UsersEmailVerifyPostRequestSchema.parseAsync(options.body)

    return this.request<z.infer<typeof VerifyEmailApiV1UsersEmailVerifyPostResponseSchema>>(
      'POST',
      '/api/v1/users/email/verify',
      {
body: validatedBody,
config: { ...options?.config, middleware: [...defaultMiddleware, ...(options?.config?.middleware || [])] },
responseSchema: VerifyEmailApiV1UsersEmailVerifyPostResponseSchema
      }
    )
  }

  /**
   * Resend Email Verification
   * Resend email verification code.
   * @param options - Request options
   * @returns Promise<ClientResponse<z.infer<typeof ResendEmailVerificationApiV1UsersEmailResendVerificationPostResponseSchema>>>
   * @example
   * const result = await client.resendEmailVerificationApiV1UsersEmailResendVerificationPost({
   *   config: { timeout: 5000 }
   * })
   */
  resendEmailVerificationApiV1UsersEmailResendVerificationPost = async (options?: { config?: RequestConfiguration }) => {
    return this.request<z.infer<typeof ResendEmailVerificationApiV1UsersEmailResendVerificationPostResponseSchema>>(
      'POST',
      '/api/v1/users/email/resend-verification',
      {
config: { ...options?.config, middleware: [...defaultMiddleware, ...(options?.config?.middleware || [])] },
responseSchema: ResendEmailVerificationApiV1UsersEmailResendVerificationPostResponseSchema
      }
    )
  }
}