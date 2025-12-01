'use client'
import { useQuery, useQueryClient, useSuspenseQuery, useMutation } from '@tanstack/react-query'
import { useOptimistic, useTransition } from 'react'
import { toast } from 'sonner'
import { getCurrentUserInfoApiV1UsersMeGet, registerApiV1UsersRegisterPost, loginApiV1UsersLoginPost, refreshTokenApiV1UsersRefreshPost, updateCurrentUserApiV1UsersMePut, requestOtpApiV1UsersOtpRequestPost, verifyOtpApiV1UsersOtpVerifyPost, logoutApiV1UsersLogoutPost, logoutAllApiV1UsersLogoutAllPost, oauthLoginApiV1UsersOauthLoginPost } from '@/generated/actions/users'
import {
  GetCurrentUserInfoApiV1UsersMeGetResponseSchema,
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
  OauthLoginApiV1UsersOauthLoginPostRequestSchema
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
      await queryClient.cancelQueries({ queryKey: ['getCurrentUserInfoApiV1UsersMeGet'] })

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
        queryClient.invalidateQueries({ queryKey: ['getCurrentUserInfoApiV1UsersMeGet'] }),
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
      await queryClient.cancelQueries({ queryKey: ['getCurrentUserInfoApiV1UsersMeGet'] })

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
        queryClient.invalidateQueries({ queryKey: ['getCurrentUserInfoApiV1UsersMeGet'] }),
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
      await queryClient.cancelQueries({ queryKey: ['getCurrentUserInfoApiV1UsersMeGet'] })

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
        queryClient.invalidateQueries({ queryKey: ['getCurrentUserInfoApiV1UsersMeGet'] }),
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
      await queryClient.cancelQueries({ queryKey: ['getCurrentUserInfoApiV1UsersMeGet'] })

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
        queryClient.invalidateQueries({ queryKey: ['getCurrentUserInfoApiV1UsersMeGet'] }),
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
      await queryClient.cancelQueries({ queryKey: ['getCurrentUserInfoApiV1UsersMeGet'] })

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
        queryClient.invalidateQueries({ queryKey: ['getCurrentUserInfoApiV1UsersMeGet'] }),
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
      await queryClient.cancelQueries({ queryKey: ['getCurrentUserInfoApiV1UsersMeGet'] })

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
        queryClient.invalidateQueries({ queryKey: ['getCurrentUserInfoApiV1UsersMeGet'] }),
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
      await queryClient.cancelQueries({ queryKey: ['getCurrentUserInfoApiV1UsersMeGet'] })

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
        queryClient.invalidateQueries({ queryKey: ['getCurrentUserInfoApiV1UsersMeGet'] }),
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
      await queryClient.cancelQueries({ queryKey: ['getCurrentUserInfoApiV1UsersMeGet'] })

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
        queryClient.invalidateQueries({ queryKey: ['getCurrentUserInfoApiV1UsersMeGet'] }),
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
      await queryClient.cancelQueries({ queryKey: ['getCurrentUserInfoApiV1UsersMeGet'] })

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
        queryClient.invalidateQueries({ queryKey: ['getCurrentUserInfoApiV1UsersMeGet'] }),
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