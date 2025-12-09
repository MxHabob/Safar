import { z } from 'zod'
import { cache } from 'react'
import { BaseApiClient } from './base'
import type { ClientResponse, RequestConfiguration } from './base'
import { defaultMiddleware } from './middleware'
import {
  RegisterDeviceApiV1UsersUsersDevicesRegisterPostRequestSchema,
  RegisterDeviceApiV1UsersUsersDevicesRegisterPostResponseSchema,
  ListDevicesApiV1UsersUsersDevicesGetResponseSchema,
  RemoveDeviceApiV1UsersUsersDevicesDeviceIdDeleteResponseSchema,
  RemoveDeviceApiV1UsersUsersDevicesDeviceIdDeleteParamsSchema,
  MarkDeviceTrustedApiV1UsersUsersDevicesDeviceIdTrustPatchRequestSchema,
  MarkDeviceTrustedApiV1UsersUsersDevicesDeviceIdTrustPatchResponseSchema,
  MarkDeviceTrustedApiV1UsersUsersDevicesDeviceIdTrustPatchParamsSchema,
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
   * Register Device
   * Register or update a device for the current user.
   * @param options - Request options
   * @returns Promise<ClientResponse<z.infer<typeof RegisterDeviceApiV1UsersUsersDevicesRegisterPostResponseSchema>>>
   * @example
   * const result = await client.registerDeviceApiV1UsersUsersDevicesRegisterPost({
   *   config: { timeout: 5000 }
   * })
   */
  registerDeviceApiV1UsersUsersDevicesRegisterPost = async (options: {
    body: z.infer<typeof RegisterDeviceApiV1UsersUsersDevicesRegisterPostRequestSchema>
    config?: RequestConfiguration
  }) => {
    // Validate request body
    const validatedBody = await RegisterDeviceApiV1UsersUsersDevicesRegisterPostRequestSchema.parseAsync(options.body)

    return this.request<z.infer<typeof RegisterDeviceApiV1UsersUsersDevicesRegisterPostResponseSchema>>(
      'POST',
      '/api/v1/users/users/devices/register',
      {
body: validatedBody,
config: { ...options?.config, middleware: [...defaultMiddleware, ...(options?.config?.middleware || [])] },
responseSchema: RegisterDeviceApiV1UsersUsersDevicesRegisterPostResponseSchema
      }
    )
  }

  /**
   * List Devices
   * Get all devices for the current user.
   * @param options - Request options
   * @returns Promise<ClientResponse<z.infer<typeof ListDevicesApiV1UsersUsersDevicesGetResponseSchema>>>
   * @example
   * const result = await client.listDevicesApiV1UsersUsersDevicesGet({
   *   config: { timeout: 5000 }
   * })
   */
  listDevicesApiV1UsersUsersDevicesGet = cache(async (options?: { config?: RequestConfiguration }) => {
    return this.request<z.infer<typeof ListDevicesApiV1UsersUsersDevicesGetResponseSchema>>(
      'GET',
      '/api/v1/users/users/devices',
      {
config: { ...options?.config, middleware: [...defaultMiddleware, ...(options?.config?.middleware || [])] },
responseSchema: ListDevicesApiV1UsersUsersDevicesGetResponseSchema
      }
    )
  })

  /**
   * Remove Device
   * Remove a device from the user's account.
   * @param options - Request options
   * @returns Promise<ClientResponse<z.infer<typeof RemoveDeviceApiV1UsersUsersDevicesDeviceIdDeleteResponseSchema>>>
   * @example
   * const result = await client.removeDeviceApiV1UsersUsersDevicesDeviceIdDelete({
   *   config: { timeout: 5000 }
   * })
   */
  removeDeviceApiV1UsersUsersDevicesDeviceIdDelete = async (options: {
    params: z.infer<typeof RemoveDeviceApiV1UsersUsersDevicesDeviceIdDeleteParamsSchema>
    config?: RequestConfiguration
  }) => {
// Validate and extract parameters
const validatedParams = await RemoveDeviceApiV1UsersUsersDevicesDeviceIdDeleteParamsSchema.parseAsync(options.params)

    return this.request<z.infer<typeof RemoveDeviceApiV1UsersUsersDevicesDeviceIdDeleteResponseSchema>>(
      'DELETE',
      '/api/v1/users/users/devices/{device_id}',
      {
        pathParams: validatedParams.path,
config: { ...options?.config, middleware: [...defaultMiddleware, ...(options?.config?.middleware || [])] },
responseSchema: RemoveDeviceApiV1UsersUsersDevicesDeviceIdDeleteResponseSchema
      }
    )
  }

  /**
   * Mark Device Trusted
   * Mark a device as trusted or untrusted.
   * @param options - Request options
   * @returns Promise<ClientResponse<z.infer<typeof MarkDeviceTrustedApiV1UsersUsersDevicesDeviceIdTrustPatchResponseSchema>>>
   * @example
   * const result = await client.markDeviceTrustedApiV1UsersUsersDevicesDeviceIdTrustPatch({
   *   config: { timeout: 5000 }
   * })
   */
  markDeviceTrustedApiV1UsersUsersDevicesDeviceIdTrustPatch = async (options: {
    params: z.infer<typeof MarkDeviceTrustedApiV1UsersUsersDevicesDeviceIdTrustPatchParamsSchema>
    body: z.infer<typeof MarkDeviceTrustedApiV1UsersUsersDevicesDeviceIdTrustPatchRequestSchema>
    config?: RequestConfiguration
  }) => {
    // Validate request body
    const validatedBody = await MarkDeviceTrustedApiV1UsersUsersDevicesDeviceIdTrustPatchRequestSchema.parseAsync(options.body)
// Validate and extract parameters
const validatedParams = await MarkDeviceTrustedApiV1UsersUsersDevicesDeviceIdTrustPatchParamsSchema.parseAsync(options.params)

    return this.request<z.infer<typeof MarkDeviceTrustedApiV1UsersUsersDevicesDeviceIdTrustPatchResponseSchema>>(
      'PATCH',
      '/api/v1/users/users/devices/{device_id}/trust',
      {
        pathParams: validatedParams.path,
body: validatedBody,
config: { ...options?.config, middleware: [...defaultMiddleware, ...(options?.config?.middleware || [])] },
responseSchema: MarkDeviceTrustedApiV1UsersUsersDevicesDeviceIdTrustPatchResponseSchema
      }
    )
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

Security improvements:
- Implements refresh token rotation (old token is blacklisted)
- Checks user revocation timestamp
- Prevents token reuse attacks
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

  /**
   * Verify 2Fa Login
   * Verify 2FA code during login and complete authentication.
   * @param options - Request options
   * @returns Promise<ClientResponse<z.infer<typeof Verify2faLoginApiV1UsersLogin2faVerifyPostResponseSchema>>>
   * @example
   * const result = await client.verify2faLoginApiV1UsersLogin2faVerifyPost({
   *   config: { timeout: 5000 }
   * })
   */
  verify2faLoginApiV1UsersLogin2faVerifyPost = async (options: {
    body: z.infer<typeof Verify2faLoginApiV1UsersLogin2faVerifyPostRequestSchema>
    config?: RequestConfiguration
  }) => {
    // Validate request body
    const validatedBody = await Verify2faLoginApiV1UsersLogin2faVerifyPostRequestSchema.parseAsync(options.body)

    return this.request<z.infer<typeof Verify2faLoginApiV1UsersLogin2faVerifyPostResponseSchema>>(
      'POST',
      '/api/v1/users/login/2fa/verify',
      {
body: validatedBody,
config: { ...options?.config, middleware: [...defaultMiddleware, ...(options?.config?.middleware || [])] },
responseSchema: Verify2faLoginApiV1UsersLogin2faVerifyPostResponseSchema
      }
    )
  }

  /**
   * Setup 2Fa
   * Set up two-factor authentication (TOTP).
Returns QR code and backup codes.
   * @param options - Request options
   * @returns Promise<ClientResponse<z.infer<typeof Setup2faApiV1Users2faSetupPostResponseSchema>>>
   * @example
   * const result = await client.setup2faApiV1Users2faSetupPost({
   *   config: { timeout: 5000 }
   * })
   */
  setup2faApiV1Users2faSetupPost = async (options?: { config?: RequestConfiguration }) => {
    return this.request<z.infer<typeof Setup2faApiV1Users2faSetupPostResponseSchema>>(
      'POST',
      '/api/v1/users/2fa/setup',
      {
config: { ...options?.config, middleware: [...defaultMiddleware, ...(options?.config?.middleware || [])] },
responseSchema: Setup2faApiV1Users2faSetupPostResponseSchema
      }
    )
  }

  /**
   * Verify 2Fa Setup
   * Verify TOTP code to enable 2FA.
   * @param options - Request options
   * @returns Promise<ClientResponse<z.infer<typeof Verify2faSetupApiV1Users2faVerifyPostResponseSchema>>>
   * @example
   * const result = await client.verify2faSetupApiV1Users2faVerifyPost({
   *   config: { timeout: 5000 }
   * })
   */
  verify2faSetupApiV1Users2faVerifyPost = async (options: {
    body: z.infer<typeof Verify2faSetupApiV1Users2faVerifyPostRequestSchema>
    config?: RequestConfiguration
  }) => {
    // Validate request body
    const validatedBody = await Verify2faSetupApiV1Users2faVerifyPostRequestSchema.parseAsync(options.body)

    return this.request<z.infer<typeof Verify2faSetupApiV1Users2faVerifyPostResponseSchema>>(
      'POST',
      '/api/v1/users/2fa/verify',
      {
body: validatedBody,
config: { ...options?.config, middleware: [...defaultMiddleware, ...(options?.config?.middleware || [])] },
responseSchema: Verify2faSetupApiV1Users2faVerifyPostResponseSchema
      }
    )
  }

  /**
   * Get 2Fa Status
   * Get 2FA status for current user.
   * @param options - Request options
   * @returns Promise<ClientResponse<z.infer<typeof Get2faStatusApiV1Users2faStatusGetResponseSchema>>>
   * @example
   * const result = await client.get2faStatusApiV1Users2faStatusGet({
   *   config: { timeout: 5000 }
   * })
   */
  get2faStatusApiV1Users2faStatusGet = cache(async (options?: { config?: RequestConfiguration }) => {
    return this.request<z.infer<typeof Get2faStatusApiV1Users2faStatusGetResponseSchema>>(
      'GET',
      '/api/v1/users/2fa/status',
      {
config: { ...options?.config, middleware: [...defaultMiddleware, ...(options?.config?.middleware || [])] },
responseSchema: Get2faStatusApiV1Users2faStatusGetResponseSchema
      }
    )
  })

  /**
   * Disable 2Fa
   * Disable 2FA for current user (requires password verification).
   * @param options - Request options
   * @returns Promise<ClientResponse<z.infer<typeof Disable2faApiV1Users2faDisablePostResponseSchema>>>
   * @example
   * const result = await client.disable2faApiV1Users2faDisablePost({
   *   config: { timeout: 5000 }
   * })
   */
  disable2faApiV1Users2faDisablePost = async (options: {
    body: z.infer<typeof Disable2faApiV1Users2faDisablePostRequestSchema>
    config?: RequestConfiguration
  }) => {
    // Validate request body
    const validatedBody = await Disable2faApiV1Users2faDisablePostRequestSchema.parseAsync(options.body)

    return this.request<z.infer<typeof Disable2faApiV1Users2faDisablePostResponseSchema>>(
      'POST',
      '/api/v1/users/2fa/disable',
      {
body: validatedBody,
config: { ...options?.config, middleware: [...defaultMiddleware, ...(options?.config?.middleware || [])] },
responseSchema: Disable2faApiV1Users2faDisablePostResponseSchema
      }
    )
  }

  /**
   * Regenerate Backup Codes
   * Regenerate backup codes for 2FA recovery.
   * @param options - Request options
   * @returns Promise<ClientResponse<z.infer<typeof RegenerateBackupCodesApiV1Users2faBackupCodesRegeneratePostResponseSchema>>>
   * @example
   * const result = await client.regenerateBackupCodesApiV1Users2faBackupCodesRegeneratePost({
   *   config: { timeout: 5000 }
   * })
   */
  regenerateBackupCodesApiV1Users2faBackupCodesRegeneratePost = async (options?: { config?: RequestConfiguration }) => {
    return this.request<z.infer<typeof RegenerateBackupCodesApiV1Users2faBackupCodesRegeneratePostResponseSchema>>(
      'POST',
      '/api/v1/users/2fa/backup-codes/regenerate',
      {
config: { ...options?.config, middleware: [...defaultMiddleware, ...(options?.config?.middleware || [])] },
responseSchema: RegenerateBackupCodesApiV1Users2faBackupCodesRegeneratePostResponseSchema
      }
    )
  }

  /**
   * Export User Data
   * Export all user data in JSON format (GDPR Article 15 - Right of Access).

Returns comprehensive JSON export of all user data including:
- Profile information
- Bookings, reviews, messages
- Preferences and settings
- Activity logs
   * @param options - Request options
   * @returns Promise<ClientResponse<z.infer<typeof ExportUserDataApiV1UsersDataExportGetResponseSchema>>>
   * @example
   * const result = await client.exportUserDataApiV1UsersDataExportGet({
   *   config: { timeout: 5000 }
   * })
   */
  exportUserDataApiV1UsersDataExportGet = cache(async (options?: { config?: RequestConfiguration }) => {
    return this.request<z.infer<typeof ExportUserDataApiV1UsersDataExportGetResponseSchema>>(
      'GET',
      '/api/v1/users/data-export',
      {
config: { ...options?.config, middleware: [...defaultMiddleware, ...(options?.config?.middleware || [])] },
responseSchema: ExportUserDataApiV1UsersDataExportGetResponseSchema
      }
    )
  })

  /**
   * Delete Account
   * Permanently delete user account and all associated data (GDPR Article 17 - Right to Erasure).

WARNING: This action is irreversible. All user data will be permanently deleted.

Some data may be anonymized rather than deleted to preserve business records:
- Reviews: Anonymized (user identity removed, ratings preserved)
- Completed bookings: Guest ID anonymized for historical records
- Listings: Deactivated if user is host

Requires password verification and explicit confirmation.
   * @param options - Request options
   * @returns Promise<ClientResponse<z.infer<typeof DeleteAccountApiV1UsersAccountDeletePostResponseSchema>>>
   * @example
   * const result = await client.deleteAccountApiV1UsersAccountDeletePost({
   *   config: { timeout: 5000 }
   * })
   */
  deleteAccountApiV1UsersAccountDeletePost = async (options: {
    body: z.infer<typeof DeleteAccountApiV1UsersAccountDeletePostRequestSchema>
    config?: RequestConfiguration
  }) => {
    // Validate request body
    const validatedBody = await DeleteAccountApiV1UsersAccountDeletePostRequestSchema.parseAsync(options.body)

    return this.request<z.infer<typeof DeleteAccountApiV1UsersAccountDeletePostResponseSchema>>(
      'POST',
      '/api/v1/users/account/delete',
      {
body: validatedBody,
config: { ...options?.config, middleware: [...defaultMiddleware, ...(options?.config?.middleware || [])] },
responseSchema: DeleteAccountApiV1UsersAccountDeletePostResponseSchema
      }
    )
  }
}