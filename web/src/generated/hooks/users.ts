'use client'
import { useQuery, useQueryClient, useSuspenseQuery, useMutation } from '@tanstack/react-query'
import { useOptimistic, useTransition } from 'react'
import { toast } from 'sonner'
import { listDevicesApiV1UsersUsersDevicesGet, getCurrentUserInfoApiV1UsersMeGet, get2faStatusApiV1Users2faStatusGet, exportUserDataApiV1UsersDataExportGet, registerDeviceApiV1UsersUsersDevicesRegisterPost, removeDeviceApiV1UsersUsersDevicesDeviceIdDelete, markDeviceTrustedApiV1UsersUsersDevicesDeviceIdTrustPatch, registerApiV1UsersRegisterPost, loginApiV1UsersLoginPost, refreshTokenApiV1UsersRefreshPost, updateCurrentUserApiV1UsersMePut, requestOtpApiV1UsersOtpRequestPost, verifyOtpApiV1UsersOtpVerifyPost, logoutApiV1UsersLogoutPost, logoutAllApiV1UsersLogoutAllPost, oauthLoginApiV1UsersOauthLoginPost, requestPasswordResetApiV1UsersPasswordResetRequestPost, resetPasswordApiV1UsersPasswordResetPost, changePasswordApiV1UsersPasswordChangePost, verifyEmailApiV1UsersEmailVerifyPost, resendEmailVerificationApiV1UsersEmailResendVerificationPost, verify2faLoginApiV1UsersLogin2faVerifyPost, setup2faApiV1Users2faSetupPost, verify2faSetupApiV1Users2faVerifyPost, disable2faApiV1Users2faDisablePost, regenerateBackupCodesApiV1Users2faBackupCodesRegeneratePost, deleteAccountApiV1UsersAccountDeletePost } from '@/generated/actions/users'
import {
  ListDevicesApiV1UsersUsersDevicesGetResponseSchema,
  GetCurrentUserInfoApiV1UsersMeGetResponseSchema,
  Get2faStatusApiV1Users2faStatusGetResponseSchema,
  ExportUserDataApiV1UsersDataExportGetResponseSchema,
  RegisterDeviceApiV1UsersUsersDevicesRegisterPostResponseSchema,
  RegisterDeviceApiV1UsersUsersDevicesRegisterPostRequestSchema,
  RemoveDeviceApiV1UsersUsersDevicesDeviceIdDeleteResponseSchema,
  RemoveDeviceApiV1UsersUsersDevicesDeviceIdDeleteParamsSchema,
  MarkDeviceTrustedApiV1UsersUsersDevicesDeviceIdTrustPatchResponseSchema,
  MarkDeviceTrustedApiV1UsersUsersDevicesDeviceIdTrustPatchRequestSchema,
  MarkDeviceTrustedApiV1UsersUsersDevicesDeviceIdTrustPatchParamsSchema,
  RegisterApiV1UsersRegisterPostResponseSchema,
  RegisterApiV1UsersRegisterPostRequestSchema,
  LoginApiV1UsersLoginPostResponseSchema,
  LoginApiV1UsersLoginPostRequestSchema,
  RefreshTokenApiV1UsersRefreshPostResponseSchema,
  RefreshTokenApiV1UsersRefreshPostRequestSchema,
  UpdateCurrentUserApiV1UsersMePutResponseSchema,
  UpdateCurrentUserApiV1UsersMePutRequestSchema,
  RequestOtpApiV1UsersOtpRequestPostResponseSchema,
  RequestOtpApiV1UsersOtpRequestPostRequestSchema,
  VerifyOtpApiV1UsersOtpVerifyPostResponseSchema,
  VerifyOtpApiV1UsersOtpVerifyPostRequestSchema,
  LogoutApiV1UsersLogoutPostResponseSchema,
  LogoutAllApiV1UsersLogoutAllPostResponseSchema,
  OauthLoginApiV1UsersOauthLoginPostResponseSchema,
  OauthLoginApiV1UsersOauthLoginPostRequestSchema,
  RequestPasswordResetApiV1UsersPasswordResetRequestPostResponseSchema,
  RequestPasswordResetApiV1UsersPasswordResetRequestPostRequestSchema,
  ResetPasswordApiV1UsersPasswordResetPostResponseSchema,
  ResetPasswordApiV1UsersPasswordResetPostRequestSchema,
  ChangePasswordApiV1UsersPasswordChangePostResponseSchema,
  ChangePasswordApiV1UsersPasswordChangePostRequestSchema,
  VerifyEmailApiV1UsersEmailVerifyPostResponseSchema,
  VerifyEmailApiV1UsersEmailVerifyPostRequestSchema,
  ResendEmailVerificationApiV1UsersEmailResendVerificationPostResponseSchema,
  Verify2faLoginApiV1UsersLogin2faVerifyPostResponseSchema,
  Verify2faLoginApiV1UsersLogin2faVerifyPostRequestSchema,
  Setup2faApiV1Users2faSetupPostResponseSchema,
  Verify2faSetupApiV1Users2faVerifyPostResponseSchema,
  Verify2faSetupApiV1Users2faVerifyPostRequestSchema,
  Disable2faApiV1Users2faDisablePostResponseSchema,
  Disable2faApiV1Users2faDisablePostRequestSchema,
  RegenerateBackupCodesApiV1Users2faBackupCodesRegeneratePostResponseSchema,
  DeleteAccountApiV1UsersAccountDeletePostResponseSchema,
  DeleteAccountApiV1UsersAccountDeletePostRequestSchema
} from '@/generated/schemas'
import type { z } from 'zod'



// Error handling utility
function handleActionError(error: unknown): never {
  const message = error instanceof Error ? error.message : 'An unexpected error occurred'
  toast.error(message)
  throw new Error(message)
}

type ActionResultLike<T> = {
  data?: T
  serverError?: unknown
  validationErrors?: unknown
}

async function resolveActionResult<T>(actionPromise: Promise<any>): Promise<T> {
  const result = await actionPromise
  if (result && typeof result === 'object') {
    const actionResult = result as ActionResultLike<T>
    if (actionResult.serverError) {
      const message = typeof actionResult.serverError === 'string' ? actionResult.serverError : 'Server action failed'
      throw new Error(message)
    }
    if (actionResult.validationErrors) {
      throw new Error('Validation failed, please check your input')
    }
    if (typeof actionResult.data !== 'undefined') {
      return actionResult.data as T
    }
  }
  return result as T
}

/**
 * Optimized query hook for GET /api/v1/users/users/devices
 * Features: Smart caching, error handling, type safety
 * @returns useQuery result with data of type z.infer<typeof ListDevicesApiV1UsersUsersDevicesGetResponseSchema>
 */
export function useListDevicesApiV1UsersUsersDevicesGet(options?: { enabled?: boolean; suspense?: boolean; refetchInterval?: number; initialData?: z.infer<typeof ListDevicesApiV1UsersUsersDevicesGetResponseSchema> }) {
  const { initialData, ...restOptions } = options ?? {}

  return useQuery({
    queryKey: ['listDevicesApiV1UsersUsersDevicesGet'],
    queryFn: async ({ signal }: { signal?: AbortSignal }) => {
      try {
        const result = await resolveActionResult<z.infer<typeof ListDevicesApiV1UsersUsersDevicesGetResponseSchema>>(listDevicesApiV1UsersUsersDevicesGet())
        return result
      } catch (error) {
        handleActionError(error)
      }
    },
    staleTime: 300000,
    gcTime: 600000, // React Query v5: gcTime replaces cacheTime
    enabled: true && (options?.enabled ?? true),
    refetchOnWindowFocus: true, // Refetch when window regains focus
    refetchOnReconnect: true, // Refetch when network reconnects
    refetchOnMount: 'always', // Always refetch on mount for fresh data
    refetchInterval: options?.refetchInterval, // Optional polling interval
    // React Query v5: placeholderData replaces keepPreviousData
    placeholderData: (previousData: z.infer<typeof ListDevicesApiV1UsersUsersDevicesGetResponseSchema> | undefined) => previousData,
    retry: (failureCount: number, error: Error) => {
      // Don't retry on 4xx errors (client errors)
      if (error instanceof Error && error.message.includes('4')) return false
      // Retry up to 3 times for network/server errors
      return failureCount < 3
    },
    initialData: initialData as z.infer<typeof ListDevicesApiV1UsersUsersDevicesGetResponseSchema> | undefined,
    ...restOptions
  })
}

/**
 * Suspense version for /api/v1/users/users/devices
 * @returns useSuspenseQuery result with data of type z.infer<typeof ListDevicesApiV1UsersUsersDevicesGetResponseSchema>
 */
export function useSuspenseListDevicesApiV1UsersUsersDevicesGet(options?: { enabled?: boolean; suspense?: boolean; refetchInterval?: number; initialData?: z.infer<typeof ListDevicesApiV1UsersUsersDevicesGetResponseSchema> }) {
  const { initialData, ...restOptions } = options ?? {}

  return useSuspenseQuery({
    queryKey: ['listDevicesApiV1UsersUsersDevicesGet'],
    queryFn: async () => {
      const result = await resolveActionResult<z.infer<typeof ListDevicesApiV1UsersUsersDevicesGetResponseSchema>>(listDevicesApiV1UsersUsersDevicesGet())
      return result
    },
    staleTime: 300000,
    initialData: initialData as z.infer<typeof ListDevicesApiV1UsersUsersDevicesGetResponseSchema> | undefined,
    ...restOptions
  })
}

/**
 * Optimized query hook for GET /api/v1/users/me
 * Features: Smart caching, error handling, type safety
 * @returns useQuery result with data of type z.infer<typeof GetCurrentUserInfoApiV1UsersMeGetResponseSchema>
 */
export function useGetCurrentUserInfoApiV1UsersMeGet(options?: { enabled?: boolean; suspense?: boolean; refetchInterval?: number; initialData?: z.infer<typeof GetCurrentUserInfoApiV1UsersMeGetResponseSchema> }) {
  const { initialData, ...restOptions } = options ?? {}

  return useQuery({
    queryKey: ['getCurrentUserInfoApiV1UsersMeGet'],
    queryFn: async ({ signal }: { signal?: AbortSignal }) => {
      try {
        const result = await resolveActionResult<z.infer<typeof GetCurrentUserInfoApiV1UsersMeGetResponseSchema>>(getCurrentUserInfoApiV1UsersMeGet())
        return result
      } catch (error) {
        handleActionError(error)
      }
    },
    staleTime: 300000,
    gcTime: 600000, // React Query v5: gcTime replaces cacheTime
    enabled: true && (options?.enabled ?? true),
    refetchOnWindowFocus: true, // Refetch when window regains focus
    refetchOnReconnect: true, // Refetch when network reconnects
    refetchOnMount: 'always', // Always refetch on mount for fresh data
    refetchInterval: options?.refetchInterval, // Optional polling interval
    // React Query v5: placeholderData replaces keepPreviousData
    placeholderData: (previousData: z.infer<typeof GetCurrentUserInfoApiV1UsersMeGetResponseSchema> | undefined) => previousData,
    retry: (failureCount: number, error: Error) => {
      // Don't retry on 4xx errors (client errors)
      if (error instanceof Error && error.message.includes('4')) return false
      // Retry up to 3 times for network/server errors
      return failureCount < 3
    },
    initialData: initialData as z.infer<typeof GetCurrentUserInfoApiV1UsersMeGetResponseSchema> | undefined,
    ...restOptions
  })
}

/**
 * Suspense version for /api/v1/users/me
 * @returns useSuspenseQuery result with data of type z.infer<typeof GetCurrentUserInfoApiV1UsersMeGetResponseSchema>
 */
export function useSuspenseGetCurrentUserInfoApiV1UsersMeGet(options?: { enabled?: boolean; suspense?: boolean; refetchInterval?: number; initialData?: z.infer<typeof GetCurrentUserInfoApiV1UsersMeGetResponseSchema> }) {
  const { initialData, ...restOptions } = options ?? {}

  return useSuspenseQuery({
    queryKey: ['getCurrentUserInfoApiV1UsersMeGet'],
    queryFn: async () => {
      const result = await resolveActionResult<z.infer<typeof GetCurrentUserInfoApiV1UsersMeGetResponseSchema>>(getCurrentUserInfoApiV1UsersMeGet())
      return result
    },
    staleTime: 300000,
    initialData: initialData as z.infer<typeof GetCurrentUserInfoApiV1UsersMeGetResponseSchema> | undefined,
    ...restOptions
  })
}

/**
 * Optimized query hook for GET /api/v1/users/2fa/status
 * Features: Smart caching, error handling, type safety
 * @returns useQuery result with data of type z.infer<typeof Get2faStatusApiV1Users2faStatusGetResponseSchema>
 */
export function useGet2faStatusApiV1Users2faStatusGet(options?: { enabled?: boolean; suspense?: boolean; refetchInterval?: number; initialData?: z.infer<typeof Get2faStatusApiV1Users2faStatusGetResponseSchema> }) {
  const { initialData, ...restOptions } = options ?? {}

  return useQuery({
    queryKey: ['get2faStatusApiV1Users2faStatusGet'],
    queryFn: async ({ signal }: { signal?: AbortSignal }) => {
      try {
        const result = await resolveActionResult<z.infer<typeof Get2faStatusApiV1Users2faStatusGetResponseSchema>>(get2faStatusApiV1Users2faStatusGet())
        return result
      } catch (error) {
        handleActionError(error)
      }
    },
    staleTime: 300000,
    gcTime: 600000, // React Query v5: gcTime replaces cacheTime
    enabled: true && (options?.enabled ?? true),
    refetchOnWindowFocus: true, // Refetch when window regains focus
    refetchOnReconnect: true, // Refetch when network reconnects
    refetchOnMount: 'always', // Always refetch on mount for fresh data
    refetchInterval: options?.refetchInterval, // Optional polling interval
    // React Query v5: placeholderData replaces keepPreviousData
    placeholderData: (previousData: z.infer<typeof Get2faStatusApiV1Users2faStatusGetResponseSchema> | undefined) => previousData,
    retry: (failureCount: number, error: Error) => {
      // Don't retry on 4xx errors (client errors)
      if (error instanceof Error && error.message.includes('4')) return false
      // Retry up to 3 times for network/server errors
      return failureCount < 3
    },
    initialData: initialData as z.infer<typeof Get2faStatusApiV1Users2faStatusGetResponseSchema> | undefined,
    ...restOptions
  })
}

/**
 * Suspense version for /api/v1/users/2fa/status
 * @returns useSuspenseQuery result with data of type z.infer<typeof Get2faStatusApiV1Users2faStatusGetResponseSchema>
 */
export function useSuspenseGet2faStatusApiV1Users2faStatusGet(options?: { enabled?: boolean; suspense?: boolean; refetchInterval?: number; initialData?: z.infer<typeof Get2faStatusApiV1Users2faStatusGetResponseSchema> }) {
  const { initialData, ...restOptions } = options ?? {}

  return useSuspenseQuery({
    queryKey: ['get2faStatusApiV1Users2faStatusGet'],
    queryFn: async () => {
      const result = await resolveActionResult<z.infer<typeof Get2faStatusApiV1Users2faStatusGetResponseSchema>>(get2faStatusApiV1Users2faStatusGet())
      return result
    },
    staleTime: 300000,
    initialData: initialData as z.infer<typeof Get2faStatusApiV1Users2faStatusGetResponseSchema> | undefined,
    ...restOptions
  })
}

/**
 * Optimized query hook for GET /api/v1/users/data-export
 * Features: Smart caching, error handling, type safety
 * @returns useQuery result with data of type z.infer<typeof ExportUserDataApiV1UsersDataExportGetResponseSchema>
 */
export function useExportUserDataApiV1UsersDataExportGet(options?: { enabled?: boolean; suspense?: boolean; refetchInterval?: number; initialData?: z.infer<typeof ExportUserDataApiV1UsersDataExportGetResponseSchema> }) {
  const { initialData, ...restOptions } = options ?? {}

  return useQuery({
    queryKey: ['exportUserDataApiV1UsersDataExportGet'],
    queryFn: async ({ signal }: { signal?: AbortSignal }) => {
      try {
        const result = await resolveActionResult<z.infer<typeof ExportUserDataApiV1UsersDataExportGetResponseSchema>>(exportUserDataApiV1UsersDataExportGet())
        return result
      } catch (error) {
        handleActionError(error)
      }
    },
    staleTime: 300000,
    gcTime: 600000, // React Query v5: gcTime replaces cacheTime
    enabled: true && (options?.enabled ?? true),
    refetchOnWindowFocus: true, // Refetch when window regains focus
    refetchOnReconnect: true, // Refetch when network reconnects
    refetchOnMount: 'always', // Always refetch on mount for fresh data
    refetchInterval: options?.refetchInterval, // Optional polling interval
    // React Query v5: placeholderData replaces keepPreviousData
    placeholderData: (previousData: z.infer<typeof ExportUserDataApiV1UsersDataExportGetResponseSchema> | undefined) => previousData,
    retry: (failureCount: number, error: Error) => {
      // Don't retry on 4xx errors (client errors)
      if (error instanceof Error && error.message.includes('4')) return false
      // Retry up to 3 times for network/server errors
      return failureCount < 3
    },
    initialData: initialData as z.infer<typeof ExportUserDataApiV1UsersDataExportGetResponseSchema> | undefined,
    ...restOptions
  })
}

/**
 * Suspense version for /api/v1/users/data-export
 * @returns useSuspenseQuery result with data of type z.infer<typeof ExportUserDataApiV1UsersDataExportGetResponseSchema>
 */
export function useSuspenseExportUserDataApiV1UsersDataExportGet(options?: { enabled?: boolean; suspense?: boolean; refetchInterval?: number; initialData?: z.infer<typeof ExportUserDataApiV1UsersDataExportGetResponseSchema> }) {
  const { initialData, ...restOptions } = options ?? {}

  return useSuspenseQuery({
    queryKey: ['exportUserDataApiV1UsersDataExportGet'],
    queryFn: async () => {
      const result = await resolveActionResult<z.infer<typeof ExportUserDataApiV1UsersDataExportGetResponseSchema>>(exportUserDataApiV1UsersDataExportGet())
      return result
    },
    staleTime: 300000,
    initialData: initialData as z.infer<typeof ExportUserDataApiV1UsersDataExportGetResponseSchema> | undefined,
    ...restOptions
  })
}

/**
 * Optimized mutation hook for POST /api/v1/users/users/devices/register
 * Features: Optimistic updates, smart invalidation, error handling
 * @param options - Mutation options
 * @returns Mutation result with enhanced features
 */
export function useRegisterDeviceApiV1UsersUsersDevicesRegisterPostMutation(options?: {
  onSuccess?: (data: z.infer<typeof RegisterDeviceApiV1UsersUsersDevicesRegisterPostResponseSchema>, variables: z.infer<typeof RegisterDeviceApiV1UsersUsersDevicesRegisterPostRequestSchema>) => void
  onError?: (error: Error, variables: z.infer<typeof RegisterDeviceApiV1UsersUsersDevicesRegisterPostRequestSchema>) => void
  optimisticUpdate?: (variables: z.infer<typeof RegisterDeviceApiV1UsersUsersDevicesRegisterPostRequestSchema>) => unknown
  showToast?: boolean
}) {
  const queryClient = useQueryClient()
  const [isPending, startTransition] = useTransition()
  const [optimisticData, setOptimisticData] = useOptimistic<unknown, z.infer<typeof RegisterDeviceApiV1UsersUsersDevicesRegisterPostRequestSchema>>(null, (_, newData) => newData)

  const mutation = useMutation({
    mutationFn: async (variables: z.infer<typeof RegisterDeviceApiV1UsersUsersDevicesRegisterPostRequestSchema>): Promise<z.infer<typeof RegisterDeviceApiV1UsersUsersDevicesRegisterPostResponseSchema>> => {
      try {
        const result = await resolveActionResult<z.infer<typeof RegisterDeviceApiV1UsersUsersDevicesRegisterPostResponseSchema>>(registerDeviceApiV1UsersUsersDevicesRegisterPost(variables))
        return (result ?? ({} as z.infer<typeof RegisterDeviceApiV1UsersUsersDevicesRegisterPostResponseSchema>))
      } catch (error) {
        handleActionError(error)
      }
    },
    
    onMutate: async (variables: z.infer<typeof RegisterDeviceApiV1UsersUsersDevicesRegisterPostRequestSchema>) => {
      await Promise.all([
        queryClient.cancelQueries({ queryKey: ['listDevicesApiV1UsersUsersDevicesGet'] }),
        queryClient.cancelQueries({ queryKey: ['getCurrentUserInfoApiV1UsersMeGet'] }),
        queryClient.cancelQueries({ queryKey: ['get2faStatusApiV1Users2faStatusGet'] }),
        queryClient.cancelQueries({ queryKey: ['exportUserDataApiV1UsersDataExportGet'] })
      ])

      // Optimistic update (if provided)
      if (options?.optimisticUpdate) {
        const optimisticValue = options.optimisticUpdate(variables)
        setOptimisticData(optimisticValue as z.infer<typeof RegisterDeviceApiV1UsersUsersDevicesRegisterPostRequestSchema>)
      }
      
      return {}
    },
    
    onSuccess: (data, variables) => {
      // Show success toast
      if (options?.showToast !== false) {
        toast.success('Created successfully')
      }
      
      // Custom success handler
      options?.onSuccess?.(data, variables)
    },
    
    onError: (error: Error, variables: z.infer<typeof RegisterDeviceApiV1UsersUsersDevicesRegisterPostRequestSchema>) => {
      // Show error toast
      if (options?.showToast !== false) {
        toast.error(error.message || 'Failed to create')
      }
      
      // Custom error handler
      options?.onError?.(error as Error, variables)
    },
    
    onSettled: async () => {
      // Always refetch after error or success
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['listDevicesApiV1UsersUsersDevicesGet'] }),
        queryClient.invalidateQueries({ queryKey: ['getCurrentUserInfoApiV1UsersMeGet'] }),
        queryClient.invalidateQueries({ queryKey: ['get2faStatusApiV1Users2faStatusGet'] }),
        queryClient.invalidateQueries({ queryKey: ['exportUserDataApiV1UsersDataExportGet'] }),
        queryClient.invalidateQueries({ queryKey: ['Users'] }),
        queryClient.invalidateQueries({ queryKey: ['Devices'] })
      ])
    }
  })

  return {
    ...mutation,
    mutateWithTransition: (variables: z.infer<typeof RegisterDeviceApiV1UsersUsersDevicesRegisterPostRequestSchema>) => {
      startTransition(() => {
        mutation.mutate(variables)
      })
    },
    isPending: isPending || mutation.isPending,
    optimisticData
  }
}

/**
 * Optimized mutation hook for DELETE /api/v1/users/users/devices/{device_id}
 * Features: Optimistic updates, smart invalidation, error handling
 * @param options - Mutation options
 * @returns Mutation result with enhanced features
 */
export function useRemoveDeviceApiV1UsersUsersDevicesDeviceIdDeleteMutation(options?: {
  onSuccess?: (data: z.infer<typeof RemoveDeviceApiV1UsersUsersDevicesDeviceIdDeleteResponseSchema>, variables: z.infer<typeof RemoveDeviceApiV1UsersUsersDevicesDeviceIdDeleteParamsSchema>) => void
  onError?: (error: Error, variables: z.infer<typeof RemoveDeviceApiV1UsersUsersDevicesDeviceIdDeleteParamsSchema>) => void
  optimisticUpdate?: (variables: z.infer<typeof RemoveDeviceApiV1UsersUsersDevicesDeviceIdDeleteParamsSchema>) => unknown
  showToast?: boolean
}) {
  const queryClient = useQueryClient()
  const [isPending, startTransition] = useTransition()
  const [optimisticData, setOptimisticData] = useOptimistic<unknown, z.infer<typeof RemoveDeviceApiV1UsersUsersDevicesDeviceIdDeleteParamsSchema>>(null, (_, newData) => newData)

  const mutation = useMutation({
    mutationFn: async (variables: z.infer<typeof RemoveDeviceApiV1UsersUsersDevicesDeviceIdDeleteParamsSchema>): Promise<z.infer<typeof RemoveDeviceApiV1UsersUsersDevicesDeviceIdDeleteResponseSchema>> => {
      try {
        const result = await resolveActionResult<z.infer<typeof RemoveDeviceApiV1UsersUsersDevicesDeviceIdDeleteResponseSchema>>(removeDeviceApiV1UsersUsersDevicesDeviceIdDelete(variables))
        return (result ?? ({} as z.infer<typeof RemoveDeviceApiV1UsersUsersDevicesDeviceIdDeleteResponseSchema>))
      } catch (error) {
        handleActionError(error)
      }
    },
    
    onMutate: async (variables: z.infer<typeof RemoveDeviceApiV1UsersUsersDevicesDeviceIdDeleteParamsSchema>) => {
      await Promise.all([
        queryClient.cancelQueries({ queryKey: ['listDevicesApiV1UsersUsersDevicesGet'] }),
        queryClient.cancelQueries({ queryKey: ['getCurrentUserInfoApiV1UsersMeGet'] }),
        queryClient.cancelQueries({ queryKey: ['get2faStatusApiV1Users2faStatusGet'] }),
        queryClient.cancelQueries({ queryKey: ['exportUserDataApiV1UsersDataExportGet'] })
      ])

      // Optimistic update (if provided)
      if (options?.optimisticUpdate) {
        const optimisticValue = options.optimisticUpdate(variables)
        setOptimisticData(optimisticValue as z.infer<typeof RemoveDeviceApiV1UsersUsersDevicesDeviceIdDeleteParamsSchema>)
      }
      
      return {}
    },
    
    onSuccess: (data, variables) => {
      // Show success toast
      if (options?.showToast !== false) {
        toast.success('Deleted successfully')
      }
      
      // Custom success handler
      options?.onSuccess?.(data, variables)
    },
    
    onError: (error: Error, variables: z.infer<typeof RemoveDeviceApiV1UsersUsersDevicesDeviceIdDeleteParamsSchema>) => {
      // Show error toast
      if (options?.showToast !== false) {
        toast.error(error.message || 'Failed to delete')
      }
      
      // Custom error handler
      options?.onError?.(error as Error, variables)
    },
    
    onSettled: async () => {
      // Always refetch after error or success
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['listDevicesApiV1UsersUsersDevicesGet'] }),
        queryClient.invalidateQueries({ queryKey: ['getCurrentUserInfoApiV1UsersMeGet'] }),
        queryClient.invalidateQueries({ queryKey: ['get2faStatusApiV1Users2faStatusGet'] }),
        queryClient.invalidateQueries({ queryKey: ['exportUserDataApiV1UsersDataExportGet'] }),
        queryClient.invalidateQueries({ queryKey: ['Users'] }),
        queryClient.invalidateQueries({ queryKey: ['Devices'] })
      ])
    }
  })

  return {
    ...mutation,
    mutateWithTransition: (variables: z.infer<typeof RemoveDeviceApiV1UsersUsersDevicesDeviceIdDeleteParamsSchema>) => {
      startTransition(() => {
        mutation.mutate(variables)
      })
    },
    isPending: isPending || mutation.isPending,
    optimisticData
  }
}

/**
 * Optimized mutation hook for PATCH /api/v1/users/users/devices/{device_id}/trust
 * Features: Optimistic updates, smart invalidation, error handling
 * @param options - Mutation options
 * @returns Mutation result with enhanced features
 */
export function useMarkDeviceTrustedApiV1UsersUsersDevicesDeviceIdTrustPatchMutation(options?: {
  onSuccess?: (data: z.infer<typeof MarkDeviceTrustedApiV1UsersUsersDevicesDeviceIdTrustPatchResponseSchema>, variables: { body: z.infer<typeof MarkDeviceTrustedApiV1UsersUsersDevicesDeviceIdTrustPatchRequestSchema>, params: z.infer<typeof MarkDeviceTrustedApiV1UsersUsersDevicesDeviceIdTrustPatchParamsSchema> }) => void
  onError?: (error: Error, variables: { body: z.infer<typeof MarkDeviceTrustedApiV1UsersUsersDevicesDeviceIdTrustPatchRequestSchema>, params: z.infer<typeof MarkDeviceTrustedApiV1UsersUsersDevicesDeviceIdTrustPatchParamsSchema> }) => void
  optimisticUpdate?: (variables: { body: z.infer<typeof MarkDeviceTrustedApiV1UsersUsersDevicesDeviceIdTrustPatchRequestSchema>, params: z.infer<typeof MarkDeviceTrustedApiV1UsersUsersDevicesDeviceIdTrustPatchParamsSchema> }) => unknown
  showToast?: boolean
}) {
  const queryClient = useQueryClient()
  const [isPending, startTransition] = useTransition()
  const [optimisticData, setOptimisticData] = useOptimistic<unknown, { body: z.infer<typeof MarkDeviceTrustedApiV1UsersUsersDevicesDeviceIdTrustPatchRequestSchema>, params: z.infer<typeof MarkDeviceTrustedApiV1UsersUsersDevicesDeviceIdTrustPatchParamsSchema> }>(null, (_, newData) => newData)

  const mutation = useMutation({
    mutationFn: async (variables: { body: z.infer<typeof MarkDeviceTrustedApiV1UsersUsersDevicesDeviceIdTrustPatchRequestSchema>, params: z.infer<typeof MarkDeviceTrustedApiV1UsersUsersDevicesDeviceIdTrustPatchParamsSchema> }): Promise<z.infer<typeof MarkDeviceTrustedApiV1UsersUsersDevicesDeviceIdTrustPatchResponseSchema>> => {
      try {
        const result = await resolveActionResult<z.infer<typeof MarkDeviceTrustedApiV1UsersUsersDevicesDeviceIdTrustPatchResponseSchema>>(markDeviceTrustedApiV1UsersUsersDevicesDeviceIdTrustPatch(variables))
        return (result ?? ({} as z.infer<typeof MarkDeviceTrustedApiV1UsersUsersDevicesDeviceIdTrustPatchResponseSchema>))
      } catch (error) {
        handleActionError(error)
      }
    },
    
    onMutate: async (variables: { body: z.infer<typeof MarkDeviceTrustedApiV1UsersUsersDevicesDeviceIdTrustPatchRequestSchema>, params: z.infer<typeof MarkDeviceTrustedApiV1UsersUsersDevicesDeviceIdTrustPatchParamsSchema> }) => {
      await Promise.all([
        queryClient.cancelQueries({ queryKey: ['listDevicesApiV1UsersUsersDevicesGet'] }),
        queryClient.cancelQueries({ queryKey: ['getCurrentUserInfoApiV1UsersMeGet'] }),
        queryClient.cancelQueries({ queryKey: ['get2faStatusApiV1Users2faStatusGet'] }),
        queryClient.cancelQueries({ queryKey: ['exportUserDataApiV1UsersDataExportGet'] })
      ])

      // Optimistic update (if provided)
      if (options?.optimisticUpdate) {
        const optimisticValue = options.optimisticUpdate(variables)
        setOptimisticData(optimisticValue as { body: z.infer<typeof MarkDeviceTrustedApiV1UsersUsersDevicesDeviceIdTrustPatchRequestSchema>, params: z.infer<typeof MarkDeviceTrustedApiV1UsersUsersDevicesDeviceIdTrustPatchParamsSchema> })
      }
      
      return {}
    },
    
    onSuccess: (data, variables) => {
      // Show success toast
      if (options?.showToast !== false) {
        toast.success('Updated successfully')
      }
      
      // Custom success handler
      options?.onSuccess?.(data, variables)
    },
    
    onError: (error: Error, variables: { body: z.infer<typeof MarkDeviceTrustedApiV1UsersUsersDevicesDeviceIdTrustPatchRequestSchema>, params: z.infer<typeof MarkDeviceTrustedApiV1UsersUsersDevicesDeviceIdTrustPatchParamsSchema> }) => {
      // Show error toast
      if (options?.showToast !== false) {
        toast.error(error.message || 'Failed to update')
      }
      
      // Custom error handler
      options?.onError?.(error as Error, variables)
    },
    
    onSettled: async () => {
      // Always refetch after error or success
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['listDevicesApiV1UsersUsersDevicesGet'] }),
        queryClient.invalidateQueries({ queryKey: ['getCurrentUserInfoApiV1UsersMeGet'] }),
        queryClient.invalidateQueries({ queryKey: ['get2faStatusApiV1Users2faStatusGet'] }),
        queryClient.invalidateQueries({ queryKey: ['exportUserDataApiV1UsersDataExportGet'] }),
        queryClient.invalidateQueries({ queryKey: ['Users'] }),
        queryClient.invalidateQueries({ queryKey: ['Devices'] })
      ])
    }
  })

  return {
    ...mutation,
    mutateWithTransition: (variables: { body: z.infer<typeof MarkDeviceTrustedApiV1UsersUsersDevicesDeviceIdTrustPatchRequestSchema>, params: z.infer<typeof MarkDeviceTrustedApiV1UsersUsersDevicesDeviceIdTrustPatchParamsSchema> }) => {
      startTransition(() => {
        mutation.mutate(variables)
      })
    },
    isPending: isPending || mutation.isPending,
    optimisticData
  }
}

/**
 * Optimized mutation hook for POST /api/v1/users/register
 * Features: Optimistic updates, smart invalidation, error handling
 * @param options - Mutation options
 * @returns Mutation result with enhanced features
 */
export function useRegisterApiV1UsersRegisterPostMutation(options?: {
  onSuccess?: (data: z.infer<typeof RegisterApiV1UsersRegisterPostResponseSchema>, variables: z.infer<typeof RegisterApiV1UsersRegisterPostRequestSchema>) => void
  onError?: (error: Error, variables: z.infer<typeof RegisterApiV1UsersRegisterPostRequestSchema>) => void
  optimisticUpdate?: (variables: z.infer<typeof RegisterApiV1UsersRegisterPostRequestSchema>) => unknown
  showToast?: boolean
}) {
  const queryClient = useQueryClient()
  const [isPending, startTransition] = useTransition()
  const [optimisticData, setOptimisticData] = useOptimistic<unknown, z.infer<typeof RegisterApiV1UsersRegisterPostRequestSchema>>(null, (_, newData) => newData)

  const mutation = useMutation({
    mutationFn: async (variables: z.infer<typeof RegisterApiV1UsersRegisterPostRequestSchema>): Promise<z.infer<typeof RegisterApiV1UsersRegisterPostResponseSchema>> => {
      try {
        const result = await resolveActionResult<z.infer<typeof RegisterApiV1UsersRegisterPostResponseSchema>>(registerApiV1UsersRegisterPost(variables))
        return (result ?? ({} as z.infer<typeof RegisterApiV1UsersRegisterPostResponseSchema>))
      } catch (error) {
        handleActionError(error)
      }
    },
    
    onMutate: async (variables: z.infer<typeof RegisterApiV1UsersRegisterPostRequestSchema>) => {
      await Promise.all([
        queryClient.cancelQueries({ queryKey: ['listDevicesApiV1UsersUsersDevicesGet'] }),
        queryClient.cancelQueries({ queryKey: ['getCurrentUserInfoApiV1UsersMeGet'] }),
        queryClient.cancelQueries({ queryKey: ['get2faStatusApiV1Users2faStatusGet'] }),
        queryClient.cancelQueries({ queryKey: ['exportUserDataApiV1UsersDataExportGet'] })
      ])

      // Optimistic update (if provided)
      if (options?.optimisticUpdate) {
        const optimisticValue = options.optimisticUpdate(variables)
        setOptimisticData(optimisticValue as z.infer<typeof RegisterApiV1UsersRegisterPostRequestSchema>)
      }
      
      return {}
    },
    
    onSuccess: (data, variables) => {
      // Show success toast
      if (options?.showToast !== false) {
        toast.success('Created successfully')
      }
      
      // Custom success handler
      options?.onSuccess?.(data, variables)
    },
    
    onError: (error: Error, variables: z.infer<typeof RegisterApiV1UsersRegisterPostRequestSchema>) => {
      // Show error toast
      if (options?.showToast !== false) {
        toast.error(error.message || 'Failed to create')
      }
      
      // Custom error handler
      options?.onError?.(error as Error, variables)
    },
    
    onSettled: async () => {
      // Always refetch after error or success
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['listDevicesApiV1UsersUsersDevicesGet'] }),
        queryClient.invalidateQueries({ queryKey: ['getCurrentUserInfoApiV1UsersMeGet'] }),
        queryClient.invalidateQueries({ queryKey: ['get2faStatusApiV1Users2faStatusGet'] }),
        queryClient.invalidateQueries({ queryKey: ['exportUserDataApiV1UsersDataExportGet'] }),
        queryClient.invalidateQueries({ queryKey: ['Users'] })
      ])
    }
  })

  return {
    ...mutation,
    mutateWithTransition: (variables: z.infer<typeof RegisterApiV1UsersRegisterPostRequestSchema>) => {
      startTransition(() => {
        mutation.mutate(variables)
      })
    },
    isPending: isPending || mutation.isPending,
    optimisticData
  }
}

/**
 * Optimized mutation hook for POST /api/v1/users/login
 * Features: Optimistic updates, smart invalidation, error handling
 * @param options - Mutation options
 * @returns Mutation result with enhanced features
 */
export function useLoginApiV1UsersLoginPostMutation(options?: {
  onSuccess?: (data: z.infer<typeof LoginApiV1UsersLoginPostResponseSchema>, variables: z.infer<typeof LoginApiV1UsersLoginPostRequestSchema>) => void
  onError?: (error: Error, variables: z.infer<typeof LoginApiV1UsersLoginPostRequestSchema>) => void
  optimisticUpdate?: (variables: z.infer<typeof LoginApiV1UsersLoginPostRequestSchema>) => unknown
  showToast?: boolean
}) {
  const queryClient = useQueryClient()
  const [isPending, startTransition] = useTransition()
  const [optimisticData, setOptimisticData] = useOptimistic<unknown, z.infer<typeof LoginApiV1UsersLoginPostRequestSchema>>(null, (_, newData) => newData)

  const mutation = useMutation({
    mutationFn: async (variables: z.infer<typeof LoginApiV1UsersLoginPostRequestSchema>): Promise<z.infer<typeof LoginApiV1UsersLoginPostResponseSchema>> => {
      try {
        const result = await resolveActionResult<z.infer<typeof LoginApiV1UsersLoginPostResponseSchema>>(loginApiV1UsersLoginPost(variables))
        return (result ?? ({} as z.infer<typeof LoginApiV1UsersLoginPostResponseSchema>))
      } catch (error) {
        handleActionError(error)
      }
    },
    
    onMutate: async (variables: z.infer<typeof LoginApiV1UsersLoginPostRequestSchema>) => {
      await Promise.all([
        queryClient.cancelQueries({ queryKey: ['listDevicesApiV1UsersUsersDevicesGet'] }),
        queryClient.cancelQueries({ queryKey: ['getCurrentUserInfoApiV1UsersMeGet'] }),
        queryClient.cancelQueries({ queryKey: ['get2faStatusApiV1Users2faStatusGet'] }),
        queryClient.cancelQueries({ queryKey: ['exportUserDataApiV1UsersDataExportGet'] })
      ])

      // Optimistic update (if provided)
      if (options?.optimisticUpdate) {
        const optimisticValue = options.optimisticUpdate(variables)
        setOptimisticData(optimisticValue as z.infer<typeof LoginApiV1UsersLoginPostRequestSchema>)
      }
      
      return {}
    },
    
    onSuccess: (data, variables) => {
      // Show success toast
      if (options?.showToast !== false) {
        toast.success('Created successfully')
      }
      
      // Custom success handler
      options?.onSuccess?.(data, variables)
    },
    
    onError: (error: Error, variables: z.infer<typeof LoginApiV1UsersLoginPostRequestSchema>) => {
      // Show error toast
      if (options?.showToast !== false) {
        toast.error(error.message || 'Failed to create')
      }
      
      // Custom error handler
      options?.onError?.(error as Error, variables)
    },
    
    onSettled: async () => {
      // Always refetch after error or success
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['listDevicesApiV1UsersUsersDevicesGet'] }),
        queryClient.invalidateQueries({ queryKey: ['getCurrentUserInfoApiV1UsersMeGet'] }),
        queryClient.invalidateQueries({ queryKey: ['get2faStatusApiV1Users2faStatusGet'] }),
        queryClient.invalidateQueries({ queryKey: ['exportUserDataApiV1UsersDataExportGet'] }),
        queryClient.invalidateQueries({ queryKey: ['Users'] })
      ])
    }
  })

  return {
    ...mutation,
    mutateWithTransition: (variables: z.infer<typeof LoginApiV1UsersLoginPostRequestSchema>) => {
      startTransition(() => {
        mutation.mutate(variables)
      })
    },
    isPending: isPending || mutation.isPending,
    optimisticData
  }
}

/**
 * Optimized mutation hook for POST /api/v1/users/refresh
 * Features: Optimistic updates, smart invalidation, error handling
 * @param options - Mutation options
 * @returns Mutation result with enhanced features
 */
export function useRefreshTokenApiV1UsersRefreshPostMutation(options?: {
  onSuccess?: (data: z.infer<typeof RefreshTokenApiV1UsersRefreshPostResponseSchema>, variables: z.infer<typeof RefreshTokenApiV1UsersRefreshPostRequestSchema>) => void
  onError?: (error: Error, variables: z.infer<typeof RefreshTokenApiV1UsersRefreshPostRequestSchema>) => void
  optimisticUpdate?: (variables: z.infer<typeof RefreshTokenApiV1UsersRefreshPostRequestSchema>) => unknown
  showToast?: boolean
}) {
  const queryClient = useQueryClient()
  const [isPending, startTransition] = useTransition()
  const [optimisticData, setOptimisticData] = useOptimistic<unknown, z.infer<typeof RefreshTokenApiV1UsersRefreshPostRequestSchema>>(null, (_, newData) => newData)

  const mutation = useMutation({
    mutationFn: async (variables: z.infer<typeof RefreshTokenApiV1UsersRefreshPostRequestSchema>): Promise<z.infer<typeof RefreshTokenApiV1UsersRefreshPostResponseSchema>> => {
      try {
        const result = await resolveActionResult<z.infer<typeof RefreshTokenApiV1UsersRefreshPostResponseSchema>>(refreshTokenApiV1UsersRefreshPost(variables))
        return (result ?? ({} as z.infer<typeof RefreshTokenApiV1UsersRefreshPostResponseSchema>))
      } catch (error) {
        handleActionError(error)
      }
    },
    
    onMutate: async (variables: z.infer<typeof RefreshTokenApiV1UsersRefreshPostRequestSchema>) => {
      await Promise.all([
        queryClient.cancelQueries({ queryKey: ['listDevicesApiV1UsersUsersDevicesGet'] }),
        queryClient.cancelQueries({ queryKey: ['getCurrentUserInfoApiV1UsersMeGet'] }),
        queryClient.cancelQueries({ queryKey: ['get2faStatusApiV1Users2faStatusGet'] }),
        queryClient.cancelQueries({ queryKey: ['exportUserDataApiV1UsersDataExportGet'] })
      ])

      // Optimistic update (if provided)
      if (options?.optimisticUpdate) {
        const optimisticValue = options.optimisticUpdate(variables)
        setOptimisticData(optimisticValue as z.infer<typeof RefreshTokenApiV1UsersRefreshPostRequestSchema>)
      }
      
      return {}
    },
    
    onSuccess: (data, variables) => {
      // Show success toast
      if (options?.showToast !== false) {
        toast.success('Created successfully')
      }
      
      // Custom success handler
      options?.onSuccess?.(data, variables)
    },
    
    onError: (error: Error, variables: z.infer<typeof RefreshTokenApiV1UsersRefreshPostRequestSchema>) => {
      // Show error toast
      if (options?.showToast !== false) {
        toast.error(error.message || 'Failed to create')
      }
      
      // Custom error handler
      options?.onError?.(error as Error, variables)
    },
    
    onSettled: async () => {
      // Always refetch after error or success
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['listDevicesApiV1UsersUsersDevicesGet'] }),
        queryClient.invalidateQueries({ queryKey: ['getCurrentUserInfoApiV1UsersMeGet'] }),
        queryClient.invalidateQueries({ queryKey: ['get2faStatusApiV1Users2faStatusGet'] }),
        queryClient.invalidateQueries({ queryKey: ['exportUserDataApiV1UsersDataExportGet'] }),
        queryClient.invalidateQueries({ queryKey: ['Users'] })
      ])
    }
  })

  return {
    ...mutation,
    mutateWithTransition: (variables: z.infer<typeof RefreshTokenApiV1UsersRefreshPostRequestSchema>) => {
      startTransition(() => {
        mutation.mutate(variables)
      })
    },
    isPending: isPending || mutation.isPending,
    optimisticData
  }
}

/**
 * Optimized mutation hook for PUT /api/v1/users/me
 * Features: Optimistic updates, smart invalidation, error handling
 * @param options - Mutation options
 * @returns Mutation result with enhanced features
 */
export function useUpdateCurrentUserApiV1UsersMePutMutation(options?: {
  onSuccess?: (data: z.infer<typeof UpdateCurrentUserApiV1UsersMePutResponseSchema>, variables: z.infer<typeof UpdateCurrentUserApiV1UsersMePutRequestSchema>) => void
  onError?: (error: Error, variables: z.infer<typeof UpdateCurrentUserApiV1UsersMePutRequestSchema>) => void
  optimisticUpdate?: (variables: z.infer<typeof UpdateCurrentUserApiV1UsersMePutRequestSchema>) => unknown
  showToast?: boolean
}) {
  const queryClient = useQueryClient()
  const [isPending, startTransition] = useTransition()
  const [optimisticData, setOptimisticData] = useOptimistic<unknown, z.infer<typeof UpdateCurrentUserApiV1UsersMePutRequestSchema>>(null, (_, newData) => newData)

  const mutation = useMutation({
    mutationFn: async (variables: z.infer<typeof UpdateCurrentUserApiV1UsersMePutRequestSchema>): Promise<z.infer<typeof UpdateCurrentUserApiV1UsersMePutResponseSchema>> => {
      try {
        const result = await resolveActionResult<z.infer<typeof UpdateCurrentUserApiV1UsersMePutResponseSchema>>(updateCurrentUserApiV1UsersMePut(variables))
        return (result ?? ({} as z.infer<typeof UpdateCurrentUserApiV1UsersMePutResponseSchema>))
      } catch (error) {
        handleActionError(error)
      }
    },
    
    onMutate: async (variables: z.infer<typeof UpdateCurrentUserApiV1UsersMePutRequestSchema>) => {
      await Promise.all([
        queryClient.cancelQueries({ queryKey: ['listDevicesApiV1UsersUsersDevicesGet'] }),
        queryClient.cancelQueries({ queryKey: ['getCurrentUserInfoApiV1UsersMeGet'] }),
        queryClient.cancelQueries({ queryKey: ['get2faStatusApiV1Users2faStatusGet'] }),
        queryClient.cancelQueries({ queryKey: ['exportUserDataApiV1UsersDataExportGet'] })
      ])

      // Optimistic update (if provided)
      if (options?.optimisticUpdate) {
        const optimisticValue = options.optimisticUpdate(variables)
        setOptimisticData(optimisticValue as z.infer<typeof UpdateCurrentUserApiV1UsersMePutRequestSchema>)
      }
      
      return {}
    },
    
    onSuccess: (data, variables) => {
      // Show success toast
      if (options?.showToast !== false) {
        toast.success('Updated successfully')
      }
      
      // Custom success handler
      options?.onSuccess?.(data, variables)
    },
    
    onError: (error: Error, variables: z.infer<typeof UpdateCurrentUserApiV1UsersMePutRequestSchema>) => {
      // Show error toast
      if (options?.showToast !== false) {
        toast.error(error.message || 'Failed to update')
      }
      
      // Custom error handler
      options?.onError?.(error as Error, variables)
    },
    
    onSettled: async () => {
      // Always refetch after error or success
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['listDevicesApiV1UsersUsersDevicesGet'] }),
        queryClient.invalidateQueries({ queryKey: ['getCurrentUserInfoApiV1UsersMeGet'] }),
        queryClient.invalidateQueries({ queryKey: ['get2faStatusApiV1Users2faStatusGet'] }),
        queryClient.invalidateQueries({ queryKey: ['exportUserDataApiV1UsersDataExportGet'] }),
        queryClient.invalidateQueries({ queryKey: ['Users'] })
      ])
    }
  })

  return {
    ...mutation,
    mutateWithTransition: (variables: z.infer<typeof UpdateCurrentUserApiV1UsersMePutRequestSchema>) => {
      startTransition(() => {
        mutation.mutate(variables)
      })
    },
    isPending: isPending || mutation.isPending,
    optimisticData
  }
}

/**
 * Optimized mutation hook for POST /api/v1/users/otp/request
 * Features: Optimistic updates, smart invalidation, error handling
 * @param options - Mutation options
 * @returns Mutation result with enhanced features
 */
export function useRequestOtpApiV1UsersOtpRequestPostMutation(options?: {
  onSuccess?: (data: z.infer<typeof RequestOtpApiV1UsersOtpRequestPostResponseSchema>, variables: z.infer<typeof RequestOtpApiV1UsersOtpRequestPostRequestSchema>) => void
  onError?: (error: Error, variables: z.infer<typeof RequestOtpApiV1UsersOtpRequestPostRequestSchema>) => void
  optimisticUpdate?: (variables: z.infer<typeof RequestOtpApiV1UsersOtpRequestPostRequestSchema>) => unknown
  showToast?: boolean
}) {
  const queryClient = useQueryClient()
  const [isPending, startTransition] = useTransition()
  const [optimisticData, setOptimisticData] = useOptimistic<unknown, z.infer<typeof RequestOtpApiV1UsersOtpRequestPostRequestSchema>>(null, (_, newData) => newData)

  const mutation = useMutation({
    mutationFn: async (variables: z.infer<typeof RequestOtpApiV1UsersOtpRequestPostRequestSchema>): Promise<z.infer<typeof RequestOtpApiV1UsersOtpRequestPostResponseSchema>> => {
      try {
        const result = await resolveActionResult<z.infer<typeof RequestOtpApiV1UsersOtpRequestPostResponseSchema>>(requestOtpApiV1UsersOtpRequestPost(variables))
        return (result ?? ({} as z.infer<typeof RequestOtpApiV1UsersOtpRequestPostResponseSchema>))
      } catch (error) {
        handleActionError(error)
      }
    },
    
    onMutate: async (variables: z.infer<typeof RequestOtpApiV1UsersOtpRequestPostRequestSchema>) => {
      await Promise.all([
        queryClient.cancelQueries({ queryKey: ['listDevicesApiV1UsersUsersDevicesGet'] }),
        queryClient.cancelQueries({ queryKey: ['getCurrentUserInfoApiV1UsersMeGet'] }),
        queryClient.cancelQueries({ queryKey: ['get2faStatusApiV1Users2faStatusGet'] }),
        queryClient.cancelQueries({ queryKey: ['exportUserDataApiV1UsersDataExportGet'] })
      ])

      // Optimistic update (if provided)
      if (options?.optimisticUpdate) {
        const optimisticValue = options.optimisticUpdate(variables)
        setOptimisticData(optimisticValue as z.infer<typeof RequestOtpApiV1UsersOtpRequestPostRequestSchema>)
      }
      
      return {}
    },
    
    onSuccess: (data, variables) => {
      // Show success toast
      if (options?.showToast !== false) {
        toast.success('Created successfully')
      }
      
      // Custom success handler
      options?.onSuccess?.(data, variables)
    },
    
    onError: (error: Error, variables: z.infer<typeof RequestOtpApiV1UsersOtpRequestPostRequestSchema>) => {
      // Show error toast
      if (options?.showToast !== false) {
        toast.error(error.message || 'Failed to create')
      }
      
      // Custom error handler
      options?.onError?.(error as Error, variables)
    },
    
    onSettled: async () => {
      // Always refetch after error or success
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['listDevicesApiV1UsersUsersDevicesGet'] }),
        queryClient.invalidateQueries({ queryKey: ['getCurrentUserInfoApiV1UsersMeGet'] }),
        queryClient.invalidateQueries({ queryKey: ['get2faStatusApiV1Users2faStatusGet'] }),
        queryClient.invalidateQueries({ queryKey: ['exportUserDataApiV1UsersDataExportGet'] }),
        queryClient.invalidateQueries({ queryKey: ['Users'] })
      ])
    }
  })

  return {
    ...mutation,
    mutateWithTransition: (variables: z.infer<typeof RequestOtpApiV1UsersOtpRequestPostRequestSchema>) => {
      startTransition(() => {
        mutation.mutate(variables)
      })
    },
    isPending: isPending || mutation.isPending,
    optimisticData
  }
}

/**
 * Optimized mutation hook for POST /api/v1/users/otp/verify
 * Features: Optimistic updates, smart invalidation, error handling
 * @param options - Mutation options
 * @returns Mutation result with enhanced features
 */
export function useVerifyOtpApiV1UsersOtpVerifyPostMutation(options?: {
  onSuccess?: (data: z.infer<typeof VerifyOtpApiV1UsersOtpVerifyPostResponseSchema>, variables: z.infer<typeof VerifyOtpApiV1UsersOtpVerifyPostRequestSchema>) => void
  onError?: (error: Error, variables: z.infer<typeof VerifyOtpApiV1UsersOtpVerifyPostRequestSchema>) => void
  optimisticUpdate?: (variables: z.infer<typeof VerifyOtpApiV1UsersOtpVerifyPostRequestSchema>) => unknown
  showToast?: boolean
}) {
  const queryClient = useQueryClient()
  const [isPending, startTransition] = useTransition()
  const [optimisticData, setOptimisticData] = useOptimistic<unknown, z.infer<typeof VerifyOtpApiV1UsersOtpVerifyPostRequestSchema>>(null, (_, newData) => newData)

  const mutation = useMutation({
    mutationFn: async (variables: z.infer<typeof VerifyOtpApiV1UsersOtpVerifyPostRequestSchema>): Promise<z.infer<typeof VerifyOtpApiV1UsersOtpVerifyPostResponseSchema>> => {
      try {
        const result = await resolveActionResult<z.infer<typeof VerifyOtpApiV1UsersOtpVerifyPostResponseSchema>>(verifyOtpApiV1UsersOtpVerifyPost(variables))
        return (result ?? ({} as z.infer<typeof VerifyOtpApiV1UsersOtpVerifyPostResponseSchema>))
      } catch (error) {
        handleActionError(error)
      }
    },
    
    onMutate: async (variables: z.infer<typeof VerifyOtpApiV1UsersOtpVerifyPostRequestSchema>) => {
      await Promise.all([
        queryClient.cancelQueries({ queryKey: ['listDevicesApiV1UsersUsersDevicesGet'] }),
        queryClient.cancelQueries({ queryKey: ['getCurrentUserInfoApiV1UsersMeGet'] }),
        queryClient.cancelQueries({ queryKey: ['get2faStatusApiV1Users2faStatusGet'] }),
        queryClient.cancelQueries({ queryKey: ['exportUserDataApiV1UsersDataExportGet'] })
      ])

      // Optimistic update (if provided)
      if (options?.optimisticUpdate) {
        const optimisticValue = options.optimisticUpdate(variables)
        setOptimisticData(optimisticValue as z.infer<typeof VerifyOtpApiV1UsersOtpVerifyPostRequestSchema>)
      }
      
      return {}
    },
    
    onSuccess: (data, variables) => {
      // Show success toast
      if (options?.showToast !== false) {
        toast.success('Created successfully')
      }
      
      // Custom success handler
      options?.onSuccess?.(data, variables)
    },
    
    onError: (error: Error, variables: z.infer<typeof VerifyOtpApiV1UsersOtpVerifyPostRequestSchema>) => {
      // Show error toast
      if (options?.showToast !== false) {
        toast.error(error.message || 'Failed to create')
      }
      
      // Custom error handler
      options?.onError?.(error as Error, variables)
    },
    
    onSettled: async () => {
      // Always refetch after error or success
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['listDevicesApiV1UsersUsersDevicesGet'] }),
        queryClient.invalidateQueries({ queryKey: ['getCurrentUserInfoApiV1UsersMeGet'] }),
        queryClient.invalidateQueries({ queryKey: ['get2faStatusApiV1Users2faStatusGet'] }),
        queryClient.invalidateQueries({ queryKey: ['exportUserDataApiV1UsersDataExportGet'] }),
        queryClient.invalidateQueries({ queryKey: ['Users'] })
      ])
    }
  })

  return {
    ...mutation,
    mutateWithTransition: (variables: z.infer<typeof VerifyOtpApiV1UsersOtpVerifyPostRequestSchema>) => {
      startTransition(() => {
        mutation.mutate(variables)
      })
    },
    isPending: isPending || mutation.isPending,
    optimisticData
  }
}

/**
 * Optimized mutation hook for POST /api/v1/users/logout
 * Features: Optimistic updates, smart invalidation, error handling
 * @param options - Mutation options
 * @returns Mutation result with enhanced features
 */
export function useLogoutApiV1UsersLogoutPostMutation(options?: {
  onSuccess?: (data: z.infer<typeof LogoutApiV1UsersLogoutPostResponseSchema>, variables: void) => void
  onError?: (error: Error, variables: void) => void
  optimisticUpdate?: (variables: void) => unknown
  showToast?: boolean
}) {
  const queryClient = useQueryClient()
  const [isPending, startTransition] = useTransition()
  const [optimisticData, setOptimisticData] = useOptimistic<unknown, void>(null, (_, newData) => newData)

  const mutation = useMutation({
    mutationFn: async (variables: void): Promise<z.infer<typeof LogoutApiV1UsersLogoutPostResponseSchema>> => {
      try {
        const result = await resolveActionResult<z.infer<typeof LogoutApiV1UsersLogoutPostResponseSchema>>(logoutApiV1UsersLogoutPost())
        return (result ?? ({} as z.infer<typeof LogoutApiV1UsersLogoutPostResponseSchema>))
      } catch (error) {
        handleActionError(error)
      }
    },
    
    onMutate: async (variables: void) => {
      await Promise.all([
        queryClient.cancelQueries({ queryKey: ['listDevicesApiV1UsersUsersDevicesGet'] }),
        queryClient.cancelQueries({ queryKey: ['getCurrentUserInfoApiV1UsersMeGet'] }),
        queryClient.cancelQueries({ queryKey: ['get2faStatusApiV1Users2faStatusGet'] }),
        queryClient.cancelQueries({ queryKey: ['exportUserDataApiV1UsersDataExportGet'] })
      ])

      // Optimistic update (if provided)
      if (options?.optimisticUpdate) {
        const optimisticValue = options.optimisticUpdate(variables)
        setOptimisticData(optimisticValue as void)
      }
      
      return {}
    },
    
    onSuccess: (data, variables) => {
      // Show success toast
      if (options?.showToast !== false) {
        toast.success('Created successfully')
      }
      
      // Custom success handler
      options?.onSuccess?.(data, variables)
    },
    
    onError: (error: Error, variables: void) => {
      // Show error toast
      if (options?.showToast !== false) {
        toast.error(error.message || 'Failed to create')
      }
      
      // Custom error handler
      options?.onError?.(error as Error, variables)
    },
    
    onSettled: async () => {
      // Always refetch after error or success
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['listDevicesApiV1UsersUsersDevicesGet'] }),
        queryClient.invalidateQueries({ queryKey: ['getCurrentUserInfoApiV1UsersMeGet'] }),
        queryClient.invalidateQueries({ queryKey: ['get2faStatusApiV1Users2faStatusGet'] }),
        queryClient.invalidateQueries({ queryKey: ['exportUserDataApiV1UsersDataExportGet'] }),
        queryClient.invalidateQueries({ queryKey: ['Users'] })
      ])
    }
  })

  return {
    ...mutation,
    mutateWithTransition: (variables: void) => {
      startTransition(() => {
        mutation.mutate(variables)
      })
    },
    isPending: isPending || mutation.isPending,
    optimisticData
  }
}

/**
 * Optimized mutation hook for POST /api/v1/users/logout-all
 * Features: Optimistic updates, smart invalidation, error handling
 * @param options - Mutation options
 * @returns Mutation result with enhanced features
 */
export function useLogoutAllApiV1UsersLogoutAllPostMutation(options?: {
  onSuccess?: (data: z.infer<typeof LogoutAllApiV1UsersLogoutAllPostResponseSchema>, variables: void) => void
  onError?: (error: Error, variables: void) => void
  optimisticUpdate?: (variables: void) => unknown
  showToast?: boolean
}) {
  const queryClient = useQueryClient()
  const [isPending, startTransition] = useTransition()
  const [optimisticData, setOptimisticData] = useOptimistic<unknown, void>(null, (_, newData) => newData)

  const mutation = useMutation({
    mutationFn: async (variables: void): Promise<z.infer<typeof LogoutAllApiV1UsersLogoutAllPostResponseSchema>> => {
      try {
        const result = await resolveActionResult<z.infer<typeof LogoutAllApiV1UsersLogoutAllPostResponseSchema>>(logoutAllApiV1UsersLogoutAllPost())
        return (result ?? ({} as z.infer<typeof LogoutAllApiV1UsersLogoutAllPostResponseSchema>))
      } catch (error) {
        handleActionError(error)
      }
    },
    
    onMutate: async (variables: void) => {
      await Promise.all([
        queryClient.cancelQueries({ queryKey: ['listDevicesApiV1UsersUsersDevicesGet'] }),
        queryClient.cancelQueries({ queryKey: ['getCurrentUserInfoApiV1UsersMeGet'] }),
        queryClient.cancelQueries({ queryKey: ['get2faStatusApiV1Users2faStatusGet'] }),
        queryClient.cancelQueries({ queryKey: ['exportUserDataApiV1UsersDataExportGet'] })
      ])

      // Optimistic update (if provided)
      if (options?.optimisticUpdate) {
        const optimisticValue = options.optimisticUpdate(variables)
        setOptimisticData(optimisticValue as void)
      }
      
      return {}
    },
    
    onSuccess: (data, variables) => {
      // Show success toast
      if (options?.showToast !== false) {
        toast.success('Created successfully')
      }
      
      // Custom success handler
      options?.onSuccess?.(data, variables)
    },
    
    onError: (error: Error, variables: void) => {
      // Show error toast
      if (options?.showToast !== false) {
        toast.error(error.message || 'Failed to create')
      }
      
      // Custom error handler
      options?.onError?.(error as Error, variables)
    },
    
    onSettled: async () => {
      // Always refetch after error or success
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['listDevicesApiV1UsersUsersDevicesGet'] }),
        queryClient.invalidateQueries({ queryKey: ['getCurrentUserInfoApiV1UsersMeGet'] }),
        queryClient.invalidateQueries({ queryKey: ['get2faStatusApiV1Users2faStatusGet'] }),
        queryClient.invalidateQueries({ queryKey: ['exportUserDataApiV1UsersDataExportGet'] }),
        queryClient.invalidateQueries({ queryKey: ['Users'] })
      ])
    }
  })

  return {
    ...mutation,
    mutateWithTransition: (variables: void) => {
      startTransition(() => {
        mutation.mutate(variables)
      })
    },
    isPending: isPending || mutation.isPending,
    optimisticData
  }
}

/**
 * Optimized mutation hook for POST /api/v1/users/oauth/login
 * Features: Optimistic updates, smart invalidation, error handling
 * @param options - Mutation options
 * @returns Mutation result with enhanced features
 */
export function useOauthLoginApiV1UsersOauthLoginPostMutation(options?: {
  onSuccess?: (data: z.infer<typeof OauthLoginApiV1UsersOauthLoginPostResponseSchema>, variables: z.infer<typeof OauthLoginApiV1UsersOauthLoginPostRequestSchema>) => void
  onError?: (error: Error, variables: z.infer<typeof OauthLoginApiV1UsersOauthLoginPostRequestSchema>) => void
  optimisticUpdate?: (variables: z.infer<typeof OauthLoginApiV1UsersOauthLoginPostRequestSchema>) => unknown
  showToast?: boolean
}) {
  const queryClient = useQueryClient()
  const [isPending, startTransition] = useTransition()
  const [optimisticData, setOptimisticData] = useOptimistic<unknown, z.infer<typeof OauthLoginApiV1UsersOauthLoginPostRequestSchema>>(null, (_, newData) => newData)

  const mutation = useMutation({
    mutationFn: async (variables: z.infer<typeof OauthLoginApiV1UsersOauthLoginPostRequestSchema>): Promise<z.infer<typeof OauthLoginApiV1UsersOauthLoginPostResponseSchema>> => {
      try {
        const result = await resolveActionResult<z.infer<typeof OauthLoginApiV1UsersOauthLoginPostResponseSchema>>(oauthLoginApiV1UsersOauthLoginPost(variables))
        return (result ?? ({} as z.infer<typeof OauthLoginApiV1UsersOauthLoginPostResponseSchema>))
      } catch (error) {
        handleActionError(error)
      }
    },
    
    onMutate: async (variables: z.infer<typeof OauthLoginApiV1UsersOauthLoginPostRequestSchema>) => {
      await Promise.all([
        queryClient.cancelQueries({ queryKey: ['listDevicesApiV1UsersUsersDevicesGet'] }),
        queryClient.cancelQueries({ queryKey: ['getCurrentUserInfoApiV1UsersMeGet'] }),
        queryClient.cancelQueries({ queryKey: ['get2faStatusApiV1Users2faStatusGet'] }),
        queryClient.cancelQueries({ queryKey: ['exportUserDataApiV1UsersDataExportGet'] })
      ])

      // Optimistic update (if provided)
      if (options?.optimisticUpdate) {
        const optimisticValue = options.optimisticUpdate(variables)
        setOptimisticData(optimisticValue as z.infer<typeof OauthLoginApiV1UsersOauthLoginPostRequestSchema>)
      }
      
      return {}
    },
    
    onSuccess: (data, variables) => {
      // Show success toast
      if (options?.showToast !== false) {
        toast.success('Created successfully')
      }
      
      // Custom success handler
      options?.onSuccess?.(data, variables)
    },
    
    onError: (error: Error, variables: z.infer<typeof OauthLoginApiV1UsersOauthLoginPostRequestSchema>) => {
      // Show error toast
      if (options?.showToast !== false) {
        toast.error(error.message || 'Failed to create')
      }
      
      // Custom error handler
      options?.onError?.(error as Error, variables)
    },
    
    onSettled: async () => {
      // Always refetch after error or success
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['listDevicesApiV1UsersUsersDevicesGet'] }),
        queryClient.invalidateQueries({ queryKey: ['getCurrentUserInfoApiV1UsersMeGet'] }),
        queryClient.invalidateQueries({ queryKey: ['get2faStatusApiV1Users2faStatusGet'] }),
        queryClient.invalidateQueries({ queryKey: ['exportUserDataApiV1UsersDataExportGet'] }),
        queryClient.invalidateQueries({ queryKey: ['Users'] })
      ])
    }
  })

  return {
    ...mutation,
    mutateWithTransition: (variables: z.infer<typeof OauthLoginApiV1UsersOauthLoginPostRequestSchema>) => {
      startTransition(() => {
        mutation.mutate(variables)
      })
    },
    isPending: isPending || mutation.isPending,
    optimisticData
  }
}

/**
 * Optimized mutation hook for POST /api/v1/users/password/reset/request
 * Features: Optimistic updates, smart invalidation, error handling
 * @param options - Mutation options
 * @returns Mutation result with enhanced features
 */
export function useRequestPasswordResetApiV1UsersPasswordResetRequestPostMutation(options?: {
  onSuccess?: (data: z.infer<typeof RequestPasswordResetApiV1UsersPasswordResetRequestPostResponseSchema>, variables: z.infer<typeof RequestPasswordResetApiV1UsersPasswordResetRequestPostRequestSchema>) => void
  onError?: (error: Error, variables: z.infer<typeof RequestPasswordResetApiV1UsersPasswordResetRequestPostRequestSchema>) => void
  optimisticUpdate?: (variables: z.infer<typeof RequestPasswordResetApiV1UsersPasswordResetRequestPostRequestSchema>) => unknown
  showToast?: boolean
}) {
  const queryClient = useQueryClient()
  const [isPending, startTransition] = useTransition()
  const [optimisticData, setOptimisticData] = useOptimistic<unknown, z.infer<typeof RequestPasswordResetApiV1UsersPasswordResetRequestPostRequestSchema>>(null, (_, newData) => newData)

  const mutation = useMutation({
    mutationFn: async (variables: z.infer<typeof RequestPasswordResetApiV1UsersPasswordResetRequestPostRequestSchema>): Promise<z.infer<typeof RequestPasswordResetApiV1UsersPasswordResetRequestPostResponseSchema>> => {
      try {
        const result = await resolveActionResult<z.infer<typeof RequestPasswordResetApiV1UsersPasswordResetRequestPostResponseSchema>>(requestPasswordResetApiV1UsersPasswordResetRequestPost(variables))
        return (result ?? ({} as z.infer<typeof RequestPasswordResetApiV1UsersPasswordResetRequestPostResponseSchema>))
      } catch (error) {
        handleActionError(error)
      }
    },
    
    onMutate: async (variables: z.infer<typeof RequestPasswordResetApiV1UsersPasswordResetRequestPostRequestSchema>) => {
      await Promise.all([
        queryClient.cancelQueries({ queryKey: ['listDevicesApiV1UsersUsersDevicesGet'] }),
        queryClient.cancelQueries({ queryKey: ['getCurrentUserInfoApiV1UsersMeGet'] }),
        queryClient.cancelQueries({ queryKey: ['get2faStatusApiV1Users2faStatusGet'] }),
        queryClient.cancelQueries({ queryKey: ['exportUserDataApiV1UsersDataExportGet'] })
      ])

      // Optimistic update (if provided)
      if (options?.optimisticUpdate) {
        const optimisticValue = options.optimisticUpdate(variables)
        setOptimisticData(optimisticValue as z.infer<typeof RequestPasswordResetApiV1UsersPasswordResetRequestPostRequestSchema>)
      }
      
      return {}
    },
    
    onSuccess: (data, variables) => {
      // Show success toast
      if (options?.showToast !== false) {
        toast.success('Created successfully')
      }
      
      // Custom success handler
      options?.onSuccess?.(data, variables)
    },
    
    onError: (error: Error, variables: z.infer<typeof RequestPasswordResetApiV1UsersPasswordResetRequestPostRequestSchema>) => {
      // Show error toast
      if (options?.showToast !== false) {
        toast.error(error.message || 'Failed to create')
      }
      
      // Custom error handler
      options?.onError?.(error as Error, variables)
    },
    
    onSettled: async () => {
      // Always refetch after error or success
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['listDevicesApiV1UsersUsersDevicesGet'] }),
        queryClient.invalidateQueries({ queryKey: ['getCurrentUserInfoApiV1UsersMeGet'] }),
        queryClient.invalidateQueries({ queryKey: ['get2faStatusApiV1Users2faStatusGet'] }),
        queryClient.invalidateQueries({ queryKey: ['exportUserDataApiV1UsersDataExportGet'] }),
        queryClient.invalidateQueries({ queryKey: ['Users'] })
      ])
    }
  })

  return {
    ...mutation,
    mutateWithTransition: (variables: z.infer<typeof RequestPasswordResetApiV1UsersPasswordResetRequestPostRequestSchema>) => {
      startTransition(() => {
        mutation.mutate(variables)
      })
    },
    isPending: isPending || mutation.isPending,
    optimisticData
  }
}

/**
 * Optimized mutation hook for POST /api/v1/users/password/reset
 * Features: Optimistic updates, smart invalidation, error handling
 * @param options - Mutation options
 * @returns Mutation result with enhanced features
 */
export function useResetPasswordApiV1UsersPasswordResetPostMutation(options?: {
  onSuccess?: (data: z.infer<typeof ResetPasswordApiV1UsersPasswordResetPostResponseSchema>, variables: z.infer<typeof ResetPasswordApiV1UsersPasswordResetPostRequestSchema>) => void
  onError?: (error: Error, variables: z.infer<typeof ResetPasswordApiV1UsersPasswordResetPostRequestSchema>) => void
  optimisticUpdate?: (variables: z.infer<typeof ResetPasswordApiV1UsersPasswordResetPostRequestSchema>) => unknown
  showToast?: boolean
}) {
  const queryClient = useQueryClient()
  const [isPending, startTransition] = useTransition()
  const [optimisticData, setOptimisticData] = useOptimistic<unknown, z.infer<typeof ResetPasswordApiV1UsersPasswordResetPostRequestSchema>>(null, (_, newData) => newData)

  const mutation = useMutation({
    mutationFn: async (variables: z.infer<typeof ResetPasswordApiV1UsersPasswordResetPostRequestSchema>): Promise<z.infer<typeof ResetPasswordApiV1UsersPasswordResetPostResponseSchema>> => {
      try {
        const result = await resolveActionResult<z.infer<typeof ResetPasswordApiV1UsersPasswordResetPostResponseSchema>>(resetPasswordApiV1UsersPasswordResetPost(variables))
        return (result ?? ({} as z.infer<typeof ResetPasswordApiV1UsersPasswordResetPostResponseSchema>))
      } catch (error) {
        handleActionError(error)
      }
    },
    
    onMutate: async (variables: z.infer<typeof ResetPasswordApiV1UsersPasswordResetPostRequestSchema>) => {
      await Promise.all([
        queryClient.cancelQueries({ queryKey: ['listDevicesApiV1UsersUsersDevicesGet'] }),
        queryClient.cancelQueries({ queryKey: ['getCurrentUserInfoApiV1UsersMeGet'] }),
        queryClient.cancelQueries({ queryKey: ['get2faStatusApiV1Users2faStatusGet'] }),
        queryClient.cancelQueries({ queryKey: ['exportUserDataApiV1UsersDataExportGet'] })
      ])

      // Optimistic update (if provided)
      if (options?.optimisticUpdate) {
        const optimisticValue = options.optimisticUpdate(variables)
        setOptimisticData(optimisticValue as z.infer<typeof ResetPasswordApiV1UsersPasswordResetPostRequestSchema>)
      }
      
      return {}
    },
    
    onSuccess: (data, variables) => {
      // Show success toast
      if (options?.showToast !== false) {
        toast.success('Created successfully')
      }
      
      // Custom success handler
      options?.onSuccess?.(data, variables)
    },
    
    onError: (error: Error, variables: z.infer<typeof ResetPasswordApiV1UsersPasswordResetPostRequestSchema>) => {
      // Show error toast
      if (options?.showToast !== false) {
        toast.error(error.message || 'Failed to create')
      }
      
      // Custom error handler
      options?.onError?.(error as Error, variables)
    },
    
    onSettled: async () => {
      // Always refetch after error or success
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['listDevicesApiV1UsersUsersDevicesGet'] }),
        queryClient.invalidateQueries({ queryKey: ['getCurrentUserInfoApiV1UsersMeGet'] }),
        queryClient.invalidateQueries({ queryKey: ['get2faStatusApiV1Users2faStatusGet'] }),
        queryClient.invalidateQueries({ queryKey: ['exportUserDataApiV1UsersDataExportGet'] }),
        queryClient.invalidateQueries({ queryKey: ['Users'] })
      ])
    }
  })

  return {
    ...mutation,
    mutateWithTransition: (variables: z.infer<typeof ResetPasswordApiV1UsersPasswordResetPostRequestSchema>) => {
      startTransition(() => {
        mutation.mutate(variables)
      })
    },
    isPending: isPending || mutation.isPending,
    optimisticData
  }
}

/**
 * Optimized mutation hook for POST /api/v1/users/password/change
 * Features: Optimistic updates, smart invalidation, error handling
 * @param options - Mutation options
 * @returns Mutation result with enhanced features
 */
export function useChangePasswordApiV1UsersPasswordChangePostMutation(options?: {
  onSuccess?: (data: z.infer<typeof ChangePasswordApiV1UsersPasswordChangePostResponseSchema>, variables: z.infer<typeof ChangePasswordApiV1UsersPasswordChangePostRequestSchema>) => void
  onError?: (error: Error, variables: z.infer<typeof ChangePasswordApiV1UsersPasswordChangePostRequestSchema>) => void
  optimisticUpdate?: (variables: z.infer<typeof ChangePasswordApiV1UsersPasswordChangePostRequestSchema>) => unknown
  showToast?: boolean
}) {
  const queryClient = useQueryClient()
  const [isPending, startTransition] = useTransition()
  const [optimisticData, setOptimisticData] = useOptimistic<unknown, z.infer<typeof ChangePasswordApiV1UsersPasswordChangePostRequestSchema>>(null, (_, newData) => newData)

  const mutation = useMutation({
    mutationFn: async (variables: z.infer<typeof ChangePasswordApiV1UsersPasswordChangePostRequestSchema>): Promise<z.infer<typeof ChangePasswordApiV1UsersPasswordChangePostResponseSchema>> => {
      try {
        const result = await resolveActionResult<z.infer<typeof ChangePasswordApiV1UsersPasswordChangePostResponseSchema>>(changePasswordApiV1UsersPasswordChangePost(variables))
        return (result ?? ({} as z.infer<typeof ChangePasswordApiV1UsersPasswordChangePostResponseSchema>))
      } catch (error) {
        handleActionError(error)
      }
    },
    
    onMutate: async (variables: z.infer<typeof ChangePasswordApiV1UsersPasswordChangePostRequestSchema>) => {
      await Promise.all([
        queryClient.cancelQueries({ queryKey: ['listDevicesApiV1UsersUsersDevicesGet'] }),
        queryClient.cancelQueries({ queryKey: ['getCurrentUserInfoApiV1UsersMeGet'] }),
        queryClient.cancelQueries({ queryKey: ['get2faStatusApiV1Users2faStatusGet'] }),
        queryClient.cancelQueries({ queryKey: ['exportUserDataApiV1UsersDataExportGet'] })
      ])

      // Optimistic update (if provided)
      if (options?.optimisticUpdate) {
        const optimisticValue = options.optimisticUpdate(variables)
        setOptimisticData(optimisticValue as z.infer<typeof ChangePasswordApiV1UsersPasswordChangePostRequestSchema>)
      }
      
      return {}
    },
    
    onSuccess: (data, variables) => {
      // Show success toast
      if (options?.showToast !== false) {
        toast.success('Created successfully')
      }
      
      // Custom success handler
      options?.onSuccess?.(data, variables)
    },
    
    onError: (error: Error, variables: z.infer<typeof ChangePasswordApiV1UsersPasswordChangePostRequestSchema>) => {
      // Show error toast
      if (options?.showToast !== false) {
        toast.error(error.message || 'Failed to create')
      }
      
      // Custom error handler
      options?.onError?.(error as Error, variables)
    },
    
    onSettled: async () => {
      // Always refetch after error or success
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['listDevicesApiV1UsersUsersDevicesGet'] }),
        queryClient.invalidateQueries({ queryKey: ['getCurrentUserInfoApiV1UsersMeGet'] }),
        queryClient.invalidateQueries({ queryKey: ['get2faStatusApiV1Users2faStatusGet'] }),
        queryClient.invalidateQueries({ queryKey: ['exportUserDataApiV1UsersDataExportGet'] }),
        queryClient.invalidateQueries({ queryKey: ['Users'] })
      ])
    }
  })

  return {
    ...mutation,
    mutateWithTransition: (variables: z.infer<typeof ChangePasswordApiV1UsersPasswordChangePostRequestSchema>) => {
      startTransition(() => {
        mutation.mutate(variables)
      })
    },
    isPending: isPending || mutation.isPending,
    optimisticData
  }
}

/**
 * Optimized mutation hook for POST /api/v1/users/email/verify
 * Features: Optimistic updates, smart invalidation, error handling
 * @param options - Mutation options
 * @returns Mutation result with enhanced features
 */
export function useVerifyEmailApiV1UsersEmailVerifyPostMutation(options?: {
  onSuccess?: (data: z.infer<typeof VerifyEmailApiV1UsersEmailVerifyPostResponseSchema>, variables: z.infer<typeof VerifyEmailApiV1UsersEmailVerifyPostRequestSchema>) => void
  onError?: (error: Error, variables: z.infer<typeof VerifyEmailApiV1UsersEmailVerifyPostRequestSchema>) => void
  optimisticUpdate?: (variables: z.infer<typeof VerifyEmailApiV1UsersEmailVerifyPostRequestSchema>) => unknown
  showToast?: boolean
}) {
  const queryClient = useQueryClient()
  const [isPending, startTransition] = useTransition()
  const [optimisticData, setOptimisticData] = useOptimistic<unknown, z.infer<typeof VerifyEmailApiV1UsersEmailVerifyPostRequestSchema>>(null, (_, newData) => newData)

  const mutation = useMutation({
    mutationFn: async (variables: z.infer<typeof VerifyEmailApiV1UsersEmailVerifyPostRequestSchema>): Promise<z.infer<typeof VerifyEmailApiV1UsersEmailVerifyPostResponseSchema>> => {
      try {
        const result = await resolveActionResult<z.infer<typeof VerifyEmailApiV1UsersEmailVerifyPostResponseSchema>>(verifyEmailApiV1UsersEmailVerifyPost(variables))
        return (result ?? ({} as z.infer<typeof VerifyEmailApiV1UsersEmailVerifyPostResponseSchema>))
      } catch (error) {
        handleActionError(error)
      }
    },
    
    onMutate: async (variables: z.infer<typeof VerifyEmailApiV1UsersEmailVerifyPostRequestSchema>) => {
      await Promise.all([
        queryClient.cancelQueries({ queryKey: ['listDevicesApiV1UsersUsersDevicesGet'] }),
        queryClient.cancelQueries({ queryKey: ['getCurrentUserInfoApiV1UsersMeGet'] }),
        queryClient.cancelQueries({ queryKey: ['get2faStatusApiV1Users2faStatusGet'] }),
        queryClient.cancelQueries({ queryKey: ['exportUserDataApiV1UsersDataExportGet'] })
      ])

      // Optimistic update (if provided)
      if (options?.optimisticUpdate) {
        const optimisticValue = options.optimisticUpdate(variables)
        setOptimisticData(optimisticValue as z.infer<typeof VerifyEmailApiV1UsersEmailVerifyPostRequestSchema>)
      }
      
      return {}
    },
    
    onSuccess: (data, variables) => {
      // Show success toast
      if (options?.showToast !== false) {
        toast.success('Created successfully')
      }
      
      // Custom success handler
      options?.onSuccess?.(data, variables)
    },
    
    onError: (error: Error, variables: z.infer<typeof VerifyEmailApiV1UsersEmailVerifyPostRequestSchema>) => {
      // Show error toast
      if (options?.showToast !== false) {
        toast.error(error.message || 'Failed to create')
      }
      
      // Custom error handler
      options?.onError?.(error as Error, variables)
    },
    
    onSettled: async () => {
      // Always refetch after error or success
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['listDevicesApiV1UsersUsersDevicesGet'] }),
        queryClient.invalidateQueries({ queryKey: ['getCurrentUserInfoApiV1UsersMeGet'] }),
        queryClient.invalidateQueries({ queryKey: ['get2faStatusApiV1Users2faStatusGet'] }),
        queryClient.invalidateQueries({ queryKey: ['exportUserDataApiV1UsersDataExportGet'] }),
        queryClient.invalidateQueries({ queryKey: ['Users'] })
      ])
    }
  })

  return {
    ...mutation,
    mutateWithTransition: (variables: z.infer<typeof VerifyEmailApiV1UsersEmailVerifyPostRequestSchema>) => {
      startTransition(() => {
        mutation.mutate(variables)
      })
    },
    isPending: isPending || mutation.isPending,
    optimisticData
  }
}

/**
 * Optimized mutation hook for POST /api/v1/users/email/resend-verification
 * Features: Optimistic updates, smart invalidation, error handling
 * @param options - Mutation options
 * @returns Mutation result with enhanced features
 */
export function useResendEmailVerificationApiV1UsersEmailResendVerificationPostMutation(options?: {
  onSuccess?: (data: z.infer<typeof ResendEmailVerificationApiV1UsersEmailResendVerificationPostResponseSchema>, variables: void) => void
  onError?: (error: Error, variables: void) => void
  optimisticUpdate?: (variables: void) => unknown
  showToast?: boolean
}) {
  const queryClient = useQueryClient()
  const [isPending, startTransition] = useTransition()
  const [optimisticData, setOptimisticData] = useOptimistic<unknown, void>(null, (_, newData) => newData)

  const mutation = useMutation({
    mutationFn: async (variables: void): Promise<z.infer<typeof ResendEmailVerificationApiV1UsersEmailResendVerificationPostResponseSchema>> => {
      try {
        const result = await resolveActionResult<z.infer<typeof ResendEmailVerificationApiV1UsersEmailResendVerificationPostResponseSchema>>(resendEmailVerificationApiV1UsersEmailResendVerificationPost())
        return (result ?? ({} as z.infer<typeof ResendEmailVerificationApiV1UsersEmailResendVerificationPostResponseSchema>))
      } catch (error) {
        handleActionError(error)
      }
    },
    
    onMutate: async (variables: void) => {
      await Promise.all([
        queryClient.cancelQueries({ queryKey: ['listDevicesApiV1UsersUsersDevicesGet'] }),
        queryClient.cancelQueries({ queryKey: ['getCurrentUserInfoApiV1UsersMeGet'] }),
        queryClient.cancelQueries({ queryKey: ['get2faStatusApiV1Users2faStatusGet'] }),
        queryClient.cancelQueries({ queryKey: ['exportUserDataApiV1UsersDataExportGet'] })
      ])

      // Optimistic update (if provided)
      if (options?.optimisticUpdate) {
        const optimisticValue = options.optimisticUpdate(variables)
        setOptimisticData(optimisticValue as void)
      }
      
      return {}
    },
    
    onSuccess: (data, variables) => {
      // Show success toast
      if (options?.showToast !== false) {
        toast.success('Created successfully')
      }
      
      // Custom success handler
      options?.onSuccess?.(data, variables)
    },
    
    onError: (error: Error, variables: void) => {
      // Show error toast
      if (options?.showToast !== false) {
        toast.error(error.message || 'Failed to create')
      }
      
      // Custom error handler
      options?.onError?.(error as Error, variables)
    },
    
    onSettled: async () => {
      // Always refetch after error or success
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['listDevicesApiV1UsersUsersDevicesGet'] }),
        queryClient.invalidateQueries({ queryKey: ['getCurrentUserInfoApiV1UsersMeGet'] }),
        queryClient.invalidateQueries({ queryKey: ['get2faStatusApiV1Users2faStatusGet'] }),
        queryClient.invalidateQueries({ queryKey: ['exportUserDataApiV1UsersDataExportGet'] }),
        queryClient.invalidateQueries({ queryKey: ['Users'] })
      ])
    }
  })

  return {
    ...mutation,
    mutateWithTransition: (variables: void) => {
      startTransition(() => {
        mutation.mutate(variables)
      })
    },
    isPending: isPending || mutation.isPending,
    optimisticData
  }
}

/**
 * Optimized mutation hook for POST /api/v1/users/login/2fa/verify
 * Features: Optimistic updates, smart invalidation, error handling
 * @param options - Mutation options
 * @returns Mutation result with enhanced features
 */
export function useVerify2faLoginApiV1UsersLogin2faVerifyPostMutation(options?: {
  onSuccess?: (data: z.infer<typeof Verify2faLoginApiV1UsersLogin2faVerifyPostResponseSchema>, variables: z.infer<typeof Verify2faLoginApiV1UsersLogin2faVerifyPostRequestSchema>) => void
  onError?: (error: Error, variables: z.infer<typeof Verify2faLoginApiV1UsersLogin2faVerifyPostRequestSchema>) => void
  optimisticUpdate?: (variables: z.infer<typeof Verify2faLoginApiV1UsersLogin2faVerifyPostRequestSchema>) => unknown
  showToast?: boolean
}) {
  const queryClient = useQueryClient()
  const [isPending, startTransition] = useTransition()
  const [optimisticData, setOptimisticData] = useOptimistic<unknown, z.infer<typeof Verify2faLoginApiV1UsersLogin2faVerifyPostRequestSchema>>(null, (_, newData) => newData)

  const mutation = useMutation({
    mutationFn: async (variables: z.infer<typeof Verify2faLoginApiV1UsersLogin2faVerifyPostRequestSchema>): Promise<z.infer<typeof Verify2faLoginApiV1UsersLogin2faVerifyPostResponseSchema>> => {
      try {
        const result = await resolveActionResult<z.infer<typeof Verify2faLoginApiV1UsersLogin2faVerifyPostResponseSchema>>(verify2faLoginApiV1UsersLogin2faVerifyPost(variables))
        return (result ?? ({} as z.infer<typeof Verify2faLoginApiV1UsersLogin2faVerifyPostResponseSchema>))
      } catch (error) {
        handleActionError(error)
      }
    },
    
    onMutate: async (variables: z.infer<typeof Verify2faLoginApiV1UsersLogin2faVerifyPostRequestSchema>) => {
      await Promise.all([
        queryClient.cancelQueries({ queryKey: ['listDevicesApiV1UsersUsersDevicesGet'] }),
        queryClient.cancelQueries({ queryKey: ['getCurrentUserInfoApiV1UsersMeGet'] }),
        queryClient.cancelQueries({ queryKey: ['get2faStatusApiV1Users2faStatusGet'] }),
        queryClient.cancelQueries({ queryKey: ['exportUserDataApiV1UsersDataExportGet'] })
      ])

      // Optimistic update (if provided)
      if (options?.optimisticUpdate) {
        const optimisticValue = options.optimisticUpdate(variables)
        setOptimisticData(optimisticValue as z.infer<typeof Verify2faLoginApiV1UsersLogin2faVerifyPostRequestSchema>)
      }
      
      return {}
    },
    
    onSuccess: (data, variables) => {
      // Show success toast
      if (options?.showToast !== false) {
        toast.success('Created successfully')
      }
      
      // Custom success handler
      options?.onSuccess?.(data, variables)
    },
    
    onError: (error: Error, variables: z.infer<typeof Verify2faLoginApiV1UsersLogin2faVerifyPostRequestSchema>) => {
      // Show error toast
      if (options?.showToast !== false) {
        toast.error(error.message || 'Failed to create')
      }
      
      // Custom error handler
      options?.onError?.(error as Error, variables)
    },
    
    onSettled: async () => {
      // Always refetch after error or success
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['listDevicesApiV1UsersUsersDevicesGet'] }),
        queryClient.invalidateQueries({ queryKey: ['getCurrentUserInfoApiV1UsersMeGet'] }),
        queryClient.invalidateQueries({ queryKey: ['get2faStatusApiV1Users2faStatusGet'] }),
        queryClient.invalidateQueries({ queryKey: ['exportUserDataApiV1UsersDataExportGet'] }),
        queryClient.invalidateQueries({ queryKey: ['Users'] })
      ])
    }
  })

  return {
    ...mutation,
    mutateWithTransition: (variables: z.infer<typeof Verify2faLoginApiV1UsersLogin2faVerifyPostRequestSchema>) => {
      startTransition(() => {
        mutation.mutate(variables)
      })
    },
    isPending: isPending || mutation.isPending,
    optimisticData
  }
}

/**
 * Optimized mutation hook for POST /api/v1/users/2fa/setup
 * Features: Optimistic updates, smart invalidation, error handling
 * @param options - Mutation options
 * @returns Mutation result with enhanced features
 */
export function useSetup2faApiV1Users2faSetupPostMutation(options?: {
  onSuccess?: (data: z.infer<typeof Setup2faApiV1Users2faSetupPostResponseSchema>, variables: void) => void
  onError?: (error: Error, variables: void) => void
  optimisticUpdate?: (variables: void) => unknown
  showToast?: boolean
}) {
  const queryClient = useQueryClient()
  const [isPending, startTransition] = useTransition()
  const [optimisticData, setOptimisticData] = useOptimistic<unknown, void>(null, (_, newData) => newData)

  const mutation = useMutation({
    mutationFn: async (variables: void): Promise<z.infer<typeof Setup2faApiV1Users2faSetupPostResponseSchema>> => {
      try {
        const result = await resolveActionResult<z.infer<typeof Setup2faApiV1Users2faSetupPostResponseSchema>>(setup2faApiV1Users2faSetupPost())
        return (result ?? ({} as z.infer<typeof Setup2faApiV1Users2faSetupPostResponseSchema>))
      } catch (error) {
        handleActionError(error)
      }
    },
    
    onMutate: async (variables: void) => {
      await Promise.all([
        queryClient.cancelQueries({ queryKey: ['listDevicesApiV1UsersUsersDevicesGet'] }),
        queryClient.cancelQueries({ queryKey: ['getCurrentUserInfoApiV1UsersMeGet'] }),
        queryClient.cancelQueries({ queryKey: ['get2faStatusApiV1Users2faStatusGet'] }),
        queryClient.cancelQueries({ queryKey: ['exportUserDataApiV1UsersDataExportGet'] })
      ])

      // Optimistic update (if provided)
      if (options?.optimisticUpdate) {
        const optimisticValue = options.optimisticUpdate(variables)
        setOptimisticData(optimisticValue as void)
      }
      
      return {}
    },
    
    onSuccess: (data, variables) => {
      // Show success toast
      if (options?.showToast !== false) {
        toast.success('Created successfully')
      }
      
      // Custom success handler
      options?.onSuccess?.(data, variables)
    },
    
    onError: (error: Error, variables: void) => {
      // Show error toast
      if (options?.showToast !== false) {
        toast.error(error.message || 'Failed to create')
      }
      
      // Custom error handler
      options?.onError?.(error as Error, variables)
    },
    
    onSettled: async () => {
      // Always refetch after error or success
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['listDevicesApiV1UsersUsersDevicesGet'] }),
        queryClient.invalidateQueries({ queryKey: ['getCurrentUserInfoApiV1UsersMeGet'] }),
        queryClient.invalidateQueries({ queryKey: ['get2faStatusApiV1Users2faStatusGet'] }),
        queryClient.invalidateQueries({ queryKey: ['exportUserDataApiV1UsersDataExportGet'] }),
        queryClient.invalidateQueries({ queryKey: ['Users'] })
      ])
    }
  })

  return {
    ...mutation,
    mutateWithTransition: (variables: void) => {
      startTransition(() => {
        mutation.mutate(variables)
      })
    },
    isPending: isPending || mutation.isPending,
    optimisticData
  }
}

/**
 * Optimized mutation hook for POST /api/v1/users/2fa/verify
 * Features: Optimistic updates, smart invalidation, error handling
 * @param options - Mutation options
 * @returns Mutation result with enhanced features
 */
export function useVerify2faSetupApiV1Users2faVerifyPostMutation(options?: {
  onSuccess?: (data: z.infer<typeof Verify2faSetupApiV1Users2faVerifyPostResponseSchema>, variables: z.infer<typeof Verify2faSetupApiV1Users2faVerifyPostRequestSchema>) => void
  onError?: (error: Error, variables: z.infer<typeof Verify2faSetupApiV1Users2faVerifyPostRequestSchema>) => void
  optimisticUpdate?: (variables: z.infer<typeof Verify2faSetupApiV1Users2faVerifyPostRequestSchema>) => unknown
  showToast?: boolean
}) {
  const queryClient = useQueryClient()
  const [isPending, startTransition] = useTransition()
  const [optimisticData, setOptimisticData] = useOptimistic<unknown, z.infer<typeof Verify2faSetupApiV1Users2faVerifyPostRequestSchema>>(null, (_, newData) => newData)

  const mutation = useMutation({
    mutationFn: async (variables: z.infer<typeof Verify2faSetupApiV1Users2faVerifyPostRequestSchema>): Promise<z.infer<typeof Verify2faSetupApiV1Users2faVerifyPostResponseSchema>> => {
      try {
        const result = await resolveActionResult<z.infer<typeof Verify2faSetupApiV1Users2faVerifyPostResponseSchema>>(verify2faSetupApiV1Users2faVerifyPost(variables))
        return (result ?? ({} as z.infer<typeof Verify2faSetupApiV1Users2faVerifyPostResponseSchema>))
      } catch (error) {
        handleActionError(error)
      }
    },
    
    onMutate: async (variables: z.infer<typeof Verify2faSetupApiV1Users2faVerifyPostRequestSchema>) => {
      await Promise.all([
        queryClient.cancelQueries({ queryKey: ['listDevicesApiV1UsersUsersDevicesGet'] }),
        queryClient.cancelQueries({ queryKey: ['getCurrentUserInfoApiV1UsersMeGet'] }),
        queryClient.cancelQueries({ queryKey: ['get2faStatusApiV1Users2faStatusGet'] }),
        queryClient.cancelQueries({ queryKey: ['exportUserDataApiV1UsersDataExportGet'] })
      ])

      // Optimistic update (if provided)
      if (options?.optimisticUpdate) {
        const optimisticValue = options.optimisticUpdate(variables)
        setOptimisticData(optimisticValue as z.infer<typeof Verify2faSetupApiV1Users2faVerifyPostRequestSchema>)
      }
      
      return {}
    },
    
    onSuccess: (data, variables) => {
      // Show success toast
      if (options?.showToast !== false) {
        toast.success('Created successfully')
      }
      
      // Custom success handler
      options?.onSuccess?.(data, variables)
    },
    
    onError: (error: Error, variables: z.infer<typeof Verify2faSetupApiV1Users2faVerifyPostRequestSchema>) => {
      // Show error toast
      if (options?.showToast !== false) {
        toast.error(error.message || 'Failed to create')
      }
      
      // Custom error handler
      options?.onError?.(error as Error, variables)
    },
    
    onSettled: async () => {
      // Always refetch after error or success
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['listDevicesApiV1UsersUsersDevicesGet'] }),
        queryClient.invalidateQueries({ queryKey: ['getCurrentUserInfoApiV1UsersMeGet'] }),
        queryClient.invalidateQueries({ queryKey: ['get2faStatusApiV1Users2faStatusGet'] }),
        queryClient.invalidateQueries({ queryKey: ['exportUserDataApiV1UsersDataExportGet'] }),
        queryClient.invalidateQueries({ queryKey: ['Users'] })
      ])
    }
  })

  return {
    ...mutation,
    mutateWithTransition: (variables: z.infer<typeof Verify2faSetupApiV1Users2faVerifyPostRequestSchema>) => {
      startTransition(() => {
        mutation.mutate(variables)
      })
    },
    isPending: isPending || mutation.isPending,
    optimisticData
  }
}

/**
 * Optimized mutation hook for POST /api/v1/users/2fa/disable
 * Features: Optimistic updates, smart invalidation, error handling
 * @param options - Mutation options
 * @returns Mutation result with enhanced features
 */
export function useDisable2faApiV1Users2faDisablePostMutation(options?: {
  onSuccess?: (data: z.infer<typeof Disable2faApiV1Users2faDisablePostResponseSchema>, variables: z.infer<typeof Disable2faApiV1Users2faDisablePostRequestSchema>) => void
  onError?: (error: Error, variables: z.infer<typeof Disable2faApiV1Users2faDisablePostRequestSchema>) => void
  optimisticUpdate?: (variables: z.infer<typeof Disable2faApiV1Users2faDisablePostRequestSchema>) => unknown
  showToast?: boolean
}) {
  const queryClient = useQueryClient()
  const [isPending, startTransition] = useTransition()
  const [optimisticData, setOptimisticData] = useOptimistic<unknown, z.infer<typeof Disable2faApiV1Users2faDisablePostRequestSchema>>(null, (_, newData) => newData)

  const mutation = useMutation({
    mutationFn: async (variables: z.infer<typeof Disable2faApiV1Users2faDisablePostRequestSchema>): Promise<z.infer<typeof Disable2faApiV1Users2faDisablePostResponseSchema>> => {
      try {
        const result = await resolveActionResult<z.infer<typeof Disable2faApiV1Users2faDisablePostResponseSchema>>(disable2faApiV1Users2faDisablePost(variables))
        return (result ?? ({} as z.infer<typeof Disable2faApiV1Users2faDisablePostResponseSchema>))
      } catch (error) {
        handleActionError(error)
      }
    },
    
    onMutate: async (variables: z.infer<typeof Disable2faApiV1Users2faDisablePostRequestSchema>) => {
      await Promise.all([
        queryClient.cancelQueries({ queryKey: ['listDevicesApiV1UsersUsersDevicesGet'] }),
        queryClient.cancelQueries({ queryKey: ['getCurrentUserInfoApiV1UsersMeGet'] }),
        queryClient.cancelQueries({ queryKey: ['get2faStatusApiV1Users2faStatusGet'] }),
        queryClient.cancelQueries({ queryKey: ['exportUserDataApiV1UsersDataExportGet'] })
      ])

      // Optimistic update (if provided)
      if (options?.optimisticUpdate) {
        const optimisticValue = options.optimisticUpdate(variables)
        setOptimisticData(optimisticValue as z.infer<typeof Disable2faApiV1Users2faDisablePostRequestSchema>)
      }
      
      return {}
    },
    
    onSuccess: (data, variables) => {
      // Show success toast
      if (options?.showToast !== false) {
        toast.success('Created successfully')
      }
      
      // Custom success handler
      options?.onSuccess?.(data, variables)
    },
    
    onError: (error: Error, variables: z.infer<typeof Disable2faApiV1Users2faDisablePostRequestSchema>) => {
      // Show error toast
      if (options?.showToast !== false) {
        toast.error(error.message || 'Failed to create')
      }
      
      // Custom error handler
      options?.onError?.(error as Error, variables)
    },
    
    onSettled: async () => {
      // Always refetch after error or success
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['listDevicesApiV1UsersUsersDevicesGet'] }),
        queryClient.invalidateQueries({ queryKey: ['getCurrentUserInfoApiV1UsersMeGet'] }),
        queryClient.invalidateQueries({ queryKey: ['get2faStatusApiV1Users2faStatusGet'] }),
        queryClient.invalidateQueries({ queryKey: ['exportUserDataApiV1UsersDataExportGet'] }),
        queryClient.invalidateQueries({ queryKey: ['Users'] })
      ])
    }
  })

  return {
    ...mutation,
    mutateWithTransition: (variables: z.infer<typeof Disable2faApiV1Users2faDisablePostRequestSchema>) => {
      startTransition(() => {
        mutation.mutate(variables)
      })
    },
    isPending: isPending || mutation.isPending,
    optimisticData
  }
}

/**
 * Optimized mutation hook for POST /api/v1/users/2fa/backup-codes/regenerate
 * Features: Optimistic updates, smart invalidation, error handling
 * @param options - Mutation options
 * @returns Mutation result with enhanced features
 */
export function useRegenerateBackupCodesApiV1Users2faBackupCodesRegeneratePostMutation(options?: {
  onSuccess?: (data: z.infer<typeof RegenerateBackupCodesApiV1Users2faBackupCodesRegeneratePostResponseSchema>, variables: void) => void
  onError?: (error: Error, variables: void) => void
  optimisticUpdate?: (variables: void) => unknown
  showToast?: boolean
}) {
  const queryClient = useQueryClient()
  const [isPending, startTransition] = useTransition()
  const [optimisticData, setOptimisticData] = useOptimistic<unknown, void>(null, (_, newData) => newData)

  const mutation = useMutation({
    mutationFn: async (variables: void): Promise<z.infer<typeof RegenerateBackupCodesApiV1Users2faBackupCodesRegeneratePostResponseSchema>> => {
      try {
        const result = await resolveActionResult<z.infer<typeof RegenerateBackupCodesApiV1Users2faBackupCodesRegeneratePostResponseSchema>>(regenerateBackupCodesApiV1Users2faBackupCodesRegeneratePost())
        return (result ?? ({} as z.infer<typeof RegenerateBackupCodesApiV1Users2faBackupCodesRegeneratePostResponseSchema>))
      } catch (error) {
        handleActionError(error)
      }
    },
    
    onMutate: async (variables: void) => {
      await Promise.all([
        queryClient.cancelQueries({ queryKey: ['listDevicesApiV1UsersUsersDevicesGet'] }),
        queryClient.cancelQueries({ queryKey: ['getCurrentUserInfoApiV1UsersMeGet'] }),
        queryClient.cancelQueries({ queryKey: ['get2faStatusApiV1Users2faStatusGet'] }),
        queryClient.cancelQueries({ queryKey: ['exportUserDataApiV1UsersDataExportGet'] })
      ])

      // Optimistic update (if provided)
      if (options?.optimisticUpdate) {
        const optimisticValue = options.optimisticUpdate(variables)
        setOptimisticData(optimisticValue as void)
      }
      
      return {}
    },
    
    onSuccess: (data, variables) => {
      // Show success toast
      if (options?.showToast !== false) {
        toast.success('Created successfully')
      }
      
      // Custom success handler
      options?.onSuccess?.(data, variables)
    },
    
    onError: (error: Error, variables: void) => {
      // Show error toast
      if (options?.showToast !== false) {
        toast.error(error.message || 'Failed to create')
      }
      
      // Custom error handler
      options?.onError?.(error as Error, variables)
    },
    
    onSettled: async () => {
      // Always refetch after error or success
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['listDevicesApiV1UsersUsersDevicesGet'] }),
        queryClient.invalidateQueries({ queryKey: ['getCurrentUserInfoApiV1UsersMeGet'] }),
        queryClient.invalidateQueries({ queryKey: ['get2faStatusApiV1Users2faStatusGet'] }),
        queryClient.invalidateQueries({ queryKey: ['exportUserDataApiV1UsersDataExportGet'] }),
        queryClient.invalidateQueries({ queryKey: ['Users'] })
      ])
    }
  })

  return {
    ...mutation,
    mutateWithTransition: (variables: void) => {
      startTransition(() => {
        mutation.mutate(variables)
      })
    },
    isPending: isPending || mutation.isPending,
    optimisticData
  }
}

/**
 * Optimized mutation hook for POST /api/v1/users/account/delete
 * Features: Optimistic updates, smart invalidation, error handling
 * @param options - Mutation options
 * @returns Mutation result with enhanced features
 */
export function useDeleteAccountApiV1UsersAccountDeletePostMutation(options?: {
  onSuccess?: (data: z.infer<typeof DeleteAccountApiV1UsersAccountDeletePostResponseSchema>, variables: z.infer<typeof DeleteAccountApiV1UsersAccountDeletePostRequestSchema>) => void
  onError?: (error: Error, variables: z.infer<typeof DeleteAccountApiV1UsersAccountDeletePostRequestSchema>) => void
  optimisticUpdate?: (variables: z.infer<typeof DeleteAccountApiV1UsersAccountDeletePostRequestSchema>) => unknown
  showToast?: boolean
}) {
  const queryClient = useQueryClient()
  const [isPending, startTransition] = useTransition()
  const [optimisticData, setOptimisticData] = useOptimistic<unknown, z.infer<typeof DeleteAccountApiV1UsersAccountDeletePostRequestSchema>>(null, (_, newData) => newData)

  const mutation = useMutation({
    mutationFn: async (variables: z.infer<typeof DeleteAccountApiV1UsersAccountDeletePostRequestSchema>): Promise<z.infer<typeof DeleteAccountApiV1UsersAccountDeletePostResponseSchema>> => {
      try {
        const result = await resolveActionResult<z.infer<typeof DeleteAccountApiV1UsersAccountDeletePostResponseSchema>>(deleteAccountApiV1UsersAccountDeletePost(variables))
        return (result ?? ({} as z.infer<typeof DeleteAccountApiV1UsersAccountDeletePostResponseSchema>))
      } catch (error) {
        handleActionError(error)
      }
    },
    
    onMutate: async (variables: z.infer<typeof DeleteAccountApiV1UsersAccountDeletePostRequestSchema>) => {
      await Promise.all([
        queryClient.cancelQueries({ queryKey: ['listDevicesApiV1UsersUsersDevicesGet'] }),
        queryClient.cancelQueries({ queryKey: ['getCurrentUserInfoApiV1UsersMeGet'] }),
        queryClient.cancelQueries({ queryKey: ['get2faStatusApiV1Users2faStatusGet'] }),
        queryClient.cancelQueries({ queryKey: ['exportUserDataApiV1UsersDataExportGet'] })
      ])

      // Optimistic update (if provided)
      if (options?.optimisticUpdate) {
        const optimisticValue = options.optimisticUpdate(variables)
        setOptimisticData(optimisticValue as z.infer<typeof DeleteAccountApiV1UsersAccountDeletePostRequestSchema>)
      }
      
      return {}
    },
    
    onSuccess: (data, variables) => {
      // Show success toast
      if (options?.showToast !== false) {
        toast.success('Created successfully')
      }
      
      // Custom success handler
      options?.onSuccess?.(data, variables)
    },
    
    onError: (error: Error, variables: z.infer<typeof DeleteAccountApiV1UsersAccountDeletePostRequestSchema>) => {
      // Show error toast
      if (options?.showToast !== false) {
        toast.error(error.message || 'Failed to create')
      }
      
      // Custom error handler
      options?.onError?.(error as Error, variables)
    },
    
    onSettled: async () => {
      // Always refetch after error or success
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['listDevicesApiV1UsersUsersDevicesGet'] }),
        queryClient.invalidateQueries({ queryKey: ['getCurrentUserInfoApiV1UsersMeGet'] }),
        queryClient.invalidateQueries({ queryKey: ['get2faStatusApiV1Users2faStatusGet'] }),
        queryClient.invalidateQueries({ queryKey: ['exportUserDataApiV1UsersDataExportGet'] }),
        queryClient.invalidateQueries({ queryKey: ['Users'] })
      ])
    }
  })

  return {
    ...mutation,
    mutateWithTransition: (variables: z.infer<typeof DeleteAccountApiV1UsersAccountDeletePostRequestSchema>) => {
      startTransition(() => {
        mutation.mutate(variables)
      })
    },
    isPending: isPending || mutation.isPending,
    optimisticData
  }
}