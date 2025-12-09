'use client'
import { useQuery, useQueryClient, useSuspenseQuery, useMutation } from '@tanstack/react-query'
import { useOptimistic, useTransition } from 'react'
import { parseAsInteger, parseAsString, useQueryStates } from 'nuqs'
import { toast } from 'sonner'
import { getCurrentTenantApiV1TenancyTenantGet, getConfigApiV1TenancyTenantTenantIdConfigGet, createTenantApiV1TenancyTenantPost, updateBrandingApiV1TenancyTenantTenantIdBrandingPut, addCustomDomainApiV1TenancyTenantTenantIdDomainPost, verifyDomainApiV1TenancyTenantDomainVerifyPost, updateConfigApiV1TenancyTenantTenantIdConfigPut } from '@/generated/actions/multiTenancy'
import {
  GetCurrentTenantApiV1TenancyTenantGetResponseSchema,
  GetConfigApiV1TenancyTenantTenantIdConfigGetResponseSchema,
  GetConfigApiV1TenancyTenantTenantIdConfigGetParamsSchema,
  CreateTenantApiV1TenancyTenantPostResponseSchema,
  CreateTenantApiV1TenancyTenantPostParamsSchema,
  UpdateBrandingApiV1TenancyTenantTenantIdBrandingPutResponseSchema,
  UpdateBrandingApiV1TenancyTenantTenantIdBrandingPutParamsSchema,
  AddCustomDomainApiV1TenancyTenantTenantIdDomainPostResponseSchema,
  AddCustomDomainApiV1TenancyTenantTenantIdDomainPostParamsSchema,
  VerifyDomainApiV1TenancyTenantDomainVerifyPostResponseSchema,
  VerifyDomainApiV1TenancyTenantDomainVerifyPostParamsSchema,
  UpdateConfigApiV1TenancyTenantTenantIdConfigPutResponseSchema,
  UpdateConfigApiV1TenancyTenantTenantIdConfigPutRequestSchema,
  UpdateConfigApiV1TenancyTenantTenantIdConfigPutParamsSchema
} from '@/generated/schemas'
import type { z } from 'zod'

// Search params parsers for filtering and sorting
const searchParamsParser = {
  page: parseAsInteger.withDefault(1),
  limit: parseAsInteger.withDefault(10),
  search: parseAsString.withDefault(''),
  sort: parseAsString.withDefault(''),
  filter: parseAsString.withDefault(''),
}

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
 * Optimized query hook for GET /api/v1/tenancy/tenant
 * Features: Smart caching, error handling, type safety
 * @returns useQuery result with data of type z.infer<typeof GetCurrentTenantApiV1TenancyTenantGetResponseSchema>
 */
export function useGetCurrentTenantApiV1TenancyTenantGet(options?: { enabled?: boolean; suspense?: boolean; refetchInterval?: number; initialData?: z.infer<typeof GetCurrentTenantApiV1TenancyTenantGetResponseSchema> }) {
  const { initialData, ...restOptions } = options ?? {}

  return useQuery({
    queryKey: ['getCurrentTenantApiV1TenancyTenantGet'],
    queryFn: async ({ signal }: { signal?: AbortSignal }) => {
      try {
        const result = await resolveActionResult<z.infer<typeof GetCurrentTenantApiV1TenancyTenantGetResponseSchema>>(getCurrentTenantApiV1TenancyTenantGet())
        return result
      } catch (error) {
        handleActionError(error)
      }
    },
    staleTime: 180000,
    gcTime: 360000, // React Query v5: gcTime replaces cacheTime
    enabled: true && (options?.enabled ?? true),
    refetchOnWindowFocus: true, // Refetch when window regains focus
    refetchOnReconnect: true, // Refetch when network reconnects
    refetchOnMount: 'always', // Always refetch on mount for fresh data
    refetchInterval: options?.refetchInterval, // Optional polling interval
    // React Query v5: placeholderData replaces keepPreviousData
    placeholderData: (previousData: z.infer<typeof GetCurrentTenantApiV1TenancyTenantGetResponseSchema> | undefined) => previousData,
    retry: (failureCount: number, error: Error) => {
      // Don't retry on 4xx errors (client errors)
      if (error instanceof Error && error.message.includes('4')) return false
      // Retry up to 3 times for network/server errors
      return failureCount < 3
    },
    initialData: initialData as z.infer<typeof GetCurrentTenantApiV1TenancyTenantGetResponseSchema> | undefined,
    ...restOptions
  })
}

/**
 * Suspense version for /api/v1/tenancy/tenant
 * @returns useSuspenseQuery result with data of type z.infer<typeof GetCurrentTenantApiV1TenancyTenantGetResponseSchema>
 */
export function useSuspenseGetCurrentTenantApiV1TenancyTenantGet(options?: { enabled?: boolean; suspense?: boolean; refetchInterval?: number; initialData?: z.infer<typeof GetCurrentTenantApiV1TenancyTenantGetResponseSchema> }) {
  const { initialData, ...restOptions } = options ?? {}

  return useSuspenseQuery({
    queryKey: ['getCurrentTenantApiV1TenancyTenantGet'],
    queryFn: async () => {
      const result = await resolveActionResult<z.infer<typeof GetCurrentTenantApiV1TenancyTenantGetResponseSchema>>(getCurrentTenantApiV1TenancyTenantGet())
      return result
    },
    staleTime: 180000,
    initialData: initialData as z.infer<typeof GetCurrentTenantApiV1TenancyTenantGetResponseSchema> | undefined,
    ...restOptions
  })
}

/**
 * Optimized query hook for GET /api/v1/tenancy/tenant/{tenant_id}/config
 * Features: Smart caching, error handling, type safety
 * @returns useQuery result with data of type z.infer<typeof GetConfigApiV1TenancyTenantTenantIdConfigGetResponseSchema>
 */
export function useGetConfigApiV1TenancyTenantTenantIdConfigGet(tenant_id: string, options?: { enabled?: boolean; suspense?: boolean; refetchInterval?: number; initialData?: z.infer<typeof GetConfigApiV1TenancyTenantTenantIdConfigGetResponseSchema> }) {
  const { initialData, ...restOptions } = options ?? {}

  return useQuery({
    queryKey: ['getConfigApiV1TenancyTenantTenantIdConfigGet', tenant_id],
    queryFn: async ({ signal }: { signal?: AbortSignal }) => {
      try {
        const result = await resolveActionResult<z.infer<typeof GetConfigApiV1TenancyTenantTenantIdConfigGetResponseSchema>>(getConfigApiV1TenancyTenantTenantIdConfigGet({ path: { tenant_id } }))
        return result
      } catch (error) {
        handleActionError(error)
      }
    },
    staleTime: 180000,
    gcTime: 360000, // React Query v5: gcTime replaces cacheTime
    enabled: !!tenant_id && (options?.enabled ?? true),
    refetchOnWindowFocus: true, // Refetch when window regains focus
    refetchOnReconnect: true, // Refetch when network reconnects
    refetchOnMount: 'always', // Always refetch on mount for fresh data
    refetchInterval: options?.refetchInterval, // Optional polling interval
    // React Query v5: placeholderData replaces keepPreviousData
    placeholderData: (previousData: z.infer<typeof GetConfigApiV1TenancyTenantTenantIdConfigGetResponseSchema> | undefined) => previousData,
    retry: (failureCount: number, error: Error) => {
      // Don't retry on 4xx errors (client errors)
      if (error instanceof Error && error.message.includes('4')) return false
      // Retry up to 3 times for network/server errors
      return failureCount < 3
    },
    initialData: initialData as z.infer<typeof GetConfigApiV1TenancyTenantTenantIdConfigGetResponseSchema> | undefined,
    ...restOptions
  })
}

/**
 * Suspense version for /api/v1/tenancy/tenant/{tenant_id}/config
 * @returns useSuspenseQuery result with data of type z.infer<typeof GetConfigApiV1TenancyTenantTenantIdConfigGetResponseSchema>
 */
export function useSuspenseGetConfigApiV1TenancyTenantTenantIdConfigGet(tenant_id: string, options?: { enabled?: boolean; suspense?: boolean; refetchInterval?: number; initialData?: z.infer<typeof GetConfigApiV1TenancyTenantTenantIdConfigGetResponseSchema> }) {
  const { initialData, ...restOptions } = options ?? {}

  return useSuspenseQuery({
    queryKey: ['getConfigApiV1TenancyTenantTenantIdConfigGet', tenant_id],
    queryFn: async () => {
      const result = await resolveActionResult<z.infer<typeof GetConfigApiV1TenancyTenantTenantIdConfigGetResponseSchema>>(getConfigApiV1TenancyTenantTenantIdConfigGet({ path: { tenant_id } }))
      return result
    },
    staleTime: 180000,
    initialData: initialData as z.infer<typeof GetConfigApiV1TenancyTenantTenantIdConfigGetResponseSchema> | undefined,
    ...restOptions
  })
}

/**
 * Optimized mutation hook for POST /api/v1/tenancy/tenant
 * Features: Optimistic updates, smart invalidation, error handling
 * @param options - Mutation options
 * @returns Mutation result with enhanced features
 */
export function useCreateTenantApiV1TenancyTenantPostMutation(options?: {
  onSuccess?: (data: z.infer<typeof CreateTenantApiV1TenancyTenantPostResponseSchema>, variables: z.infer<typeof CreateTenantApiV1TenancyTenantPostParamsSchema>) => void
  onError?: (error: Error, variables: z.infer<typeof CreateTenantApiV1TenancyTenantPostParamsSchema>) => void
  optimisticUpdate?: (variables: z.infer<typeof CreateTenantApiV1TenancyTenantPostParamsSchema>) => unknown
  showToast?: boolean
}) {
  const queryClient = useQueryClient()
  const [isPending, startTransition] = useTransition()
  const [optimisticData, setOptimisticData] = useOptimistic<unknown, z.infer<typeof CreateTenantApiV1TenancyTenantPostParamsSchema>>(null, (_, newData) => newData)

  const mutation = useMutation({
    mutationFn: async (variables: z.infer<typeof CreateTenantApiV1TenancyTenantPostParamsSchema>): Promise<z.infer<typeof CreateTenantApiV1TenancyTenantPostResponseSchema>> => {
      try {
        const result = await resolveActionResult<z.infer<typeof CreateTenantApiV1TenancyTenantPostResponseSchema>>(createTenantApiV1TenancyTenantPost(variables))
        return (result ?? ({} as z.infer<typeof CreateTenantApiV1TenancyTenantPostResponseSchema>))
      } catch (error) {
        handleActionError(error)
      }
    },
    
    onMutate: async (variables: z.infer<typeof CreateTenantApiV1TenancyTenantPostParamsSchema>) => {
      await Promise.all([
        queryClient.cancelQueries({ queryKey: ['getCurrentTenantApiV1TenancyTenantGet'] }),
        queryClient.cancelQueries({ queryKey: ['getConfigApiV1TenancyTenantTenantIdConfigGet'] })
      ])

      // Optimistic update (if provided)
      if (options?.optimisticUpdate) {
        const optimisticValue = options.optimisticUpdate(variables)
        setOptimisticData(optimisticValue as z.infer<typeof CreateTenantApiV1TenancyTenantPostParamsSchema>)
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
    
    onError: (error: Error, variables: z.infer<typeof CreateTenantApiV1TenancyTenantPostParamsSchema>) => {
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
        queryClient.invalidateQueries({ queryKey: ['getCurrentTenantApiV1TenancyTenantGet'] }),
        queryClient.invalidateQueries({ queryKey: ['getConfigApiV1TenancyTenantTenantIdConfigGet'] }),
        queryClient.invalidateQueries({ queryKey: ['Multi-Tenancy'] })
      ])
    }
  })

  return {
    ...mutation,
    mutateWithTransition: (variables: z.infer<typeof CreateTenantApiV1TenancyTenantPostParamsSchema>) => {
      startTransition(() => {
        mutation.mutate(variables)
      })
    },
    isPending: isPending || mutation.isPending,
    optimisticData
  }
}

/**
 * Optimized mutation hook for PUT /api/v1/tenancy/tenant/{tenant_id}/branding
 * Features: Optimistic updates, smart invalidation, error handling
 * @param options - Mutation options
 * @returns Mutation result with enhanced features
 */
export function useUpdateBrandingApiV1TenancyTenantTenantIdBrandingPutMutation(options?: {
  onSuccess?: (data: z.infer<typeof UpdateBrandingApiV1TenancyTenantTenantIdBrandingPutResponseSchema>, variables: z.infer<typeof UpdateBrandingApiV1TenancyTenantTenantIdBrandingPutParamsSchema>) => void
  onError?: (error: Error, variables: z.infer<typeof UpdateBrandingApiV1TenancyTenantTenantIdBrandingPutParamsSchema>) => void
  optimisticUpdate?: (variables: z.infer<typeof UpdateBrandingApiV1TenancyTenantTenantIdBrandingPutParamsSchema>) => unknown
  showToast?: boolean
}) {
  const queryClient = useQueryClient()
  const [isPending, startTransition] = useTransition()
  const [optimisticData, setOptimisticData] = useOptimistic<unknown, z.infer<typeof UpdateBrandingApiV1TenancyTenantTenantIdBrandingPutParamsSchema>>(null, (_, newData) => newData)

  const mutation = useMutation({
    mutationFn: async (variables: z.infer<typeof UpdateBrandingApiV1TenancyTenantTenantIdBrandingPutParamsSchema>): Promise<z.infer<typeof UpdateBrandingApiV1TenancyTenantTenantIdBrandingPutResponseSchema>> => {
      try {
        const result = await resolveActionResult<z.infer<typeof UpdateBrandingApiV1TenancyTenantTenantIdBrandingPutResponseSchema>>(updateBrandingApiV1TenancyTenantTenantIdBrandingPut(variables))
        return (result ?? ({} as z.infer<typeof UpdateBrandingApiV1TenancyTenantTenantIdBrandingPutResponseSchema>))
      } catch (error) {
        handleActionError(error)
      }
    },
    
    onMutate: async (variables: z.infer<typeof UpdateBrandingApiV1TenancyTenantTenantIdBrandingPutParamsSchema>) => {
      await Promise.all([
        queryClient.cancelQueries({ queryKey: ['getCurrentTenantApiV1TenancyTenantGet'] }),
        queryClient.cancelQueries({ queryKey: ['getConfigApiV1TenancyTenantTenantIdConfigGet'] })
      ])

      // Optimistic update (if provided)
      if (options?.optimisticUpdate) {
        const optimisticValue = options.optimisticUpdate(variables)
        setOptimisticData(optimisticValue as z.infer<typeof UpdateBrandingApiV1TenancyTenantTenantIdBrandingPutParamsSchema>)
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
    
    onError: (error: Error, variables: z.infer<typeof UpdateBrandingApiV1TenancyTenantTenantIdBrandingPutParamsSchema>) => {
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
        queryClient.invalidateQueries({ queryKey: ['getCurrentTenantApiV1TenancyTenantGet'] }),
        queryClient.invalidateQueries({ queryKey: ['getConfigApiV1TenancyTenantTenantIdConfigGet'] }),
        queryClient.invalidateQueries({ queryKey: ['Multi-Tenancy'] })
      ])
    }
  })

  return {
    ...mutation,
    mutateWithTransition: (variables: z.infer<typeof UpdateBrandingApiV1TenancyTenantTenantIdBrandingPutParamsSchema>) => {
      startTransition(() => {
        mutation.mutate(variables)
      })
    },
    isPending: isPending || mutation.isPending,
    optimisticData
  }
}

/**
 * Optimized mutation hook for POST /api/v1/tenancy/tenant/{tenant_id}/domain
 * Features: Optimistic updates, smart invalidation, error handling
 * @param options - Mutation options
 * @returns Mutation result with enhanced features
 */
export function useAddCustomDomainApiV1TenancyTenantTenantIdDomainPostMutation(options?: {
  onSuccess?: (data: z.infer<typeof AddCustomDomainApiV1TenancyTenantTenantIdDomainPostResponseSchema>, variables: z.infer<typeof AddCustomDomainApiV1TenancyTenantTenantIdDomainPostParamsSchema>) => void
  onError?: (error: Error, variables: z.infer<typeof AddCustomDomainApiV1TenancyTenantTenantIdDomainPostParamsSchema>) => void
  optimisticUpdate?: (variables: z.infer<typeof AddCustomDomainApiV1TenancyTenantTenantIdDomainPostParamsSchema>) => unknown
  showToast?: boolean
}) {
  const queryClient = useQueryClient()
  const [isPending, startTransition] = useTransition()
  const [optimisticData, setOptimisticData] = useOptimistic<unknown, z.infer<typeof AddCustomDomainApiV1TenancyTenantTenantIdDomainPostParamsSchema>>(null, (_, newData) => newData)

  const mutation = useMutation({
    mutationFn: async (variables: z.infer<typeof AddCustomDomainApiV1TenancyTenantTenantIdDomainPostParamsSchema>): Promise<z.infer<typeof AddCustomDomainApiV1TenancyTenantTenantIdDomainPostResponseSchema>> => {
      try {
        const result = await resolveActionResult<z.infer<typeof AddCustomDomainApiV1TenancyTenantTenantIdDomainPostResponseSchema>>(addCustomDomainApiV1TenancyTenantTenantIdDomainPost(variables))
        return (result ?? ({} as z.infer<typeof AddCustomDomainApiV1TenancyTenantTenantIdDomainPostResponseSchema>))
      } catch (error) {
        handleActionError(error)
      }
    },
    
    onMutate: async (variables: z.infer<typeof AddCustomDomainApiV1TenancyTenantTenantIdDomainPostParamsSchema>) => {
      await Promise.all([
        queryClient.cancelQueries({ queryKey: ['getCurrentTenantApiV1TenancyTenantGet'] }),
        queryClient.cancelQueries({ queryKey: ['getConfigApiV1TenancyTenantTenantIdConfigGet'] })
      ])

      // Optimistic update (if provided)
      if (options?.optimisticUpdate) {
        const optimisticValue = options.optimisticUpdate(variables)
        setOptimisticData(optimisticValue as z.infer<typeof AddCustomDomainApiV1TenancyTenantTenantIdDomainPostParamsSchema>)
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
    
    onError: (error: Error, variables: z.infer<typeof AddCustomDomainApiV1TenancyTenantTenantIdDomainPostParamsSchema>) => {
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
        queryClient.invalidateQueries({ queryKey: ['getCurrentTenantApiV1TenancyTenantGet'] }),
        queryClient.invalidateQueries({ queryKey: ['getConfigApiV1TenancyTenantTenantIdConfigGet'] }),
        queryClient.invalidateQueries({ queryKey: ['Multi-Tenancy'] })
      ])
    }
  })

  return {
    ...mutation,
    mutateWithTransition: (variables: z.infer<typeof AddCustomDomainApiV1TenancyTenantTenantIdDomainPostParamsSchema>) => {
      startTransition(() => {
        mutation.mutate(variables)
      })
    },
    isPending: isPending || mutation.isPending,
    optimisticData
  }
}

/**
 * Optimized mutation hook for POST /api/v1/tenancy/tenant/domain/verify
 * Features: Optimistic updates, smart invalidation, error handling
 * @param options - Mutation options
 * @returns Mutation result with enhanced features
 */
export function useVerifyDomainApiV1TenancyTenantDomainVerifyPostMutation(options?: {
  onSuccess?: (data: z.infer<typeof VerifyDomainApiV1TenancyTenantDomainVerifyPostResponseSchema>, variables: z.infer<typeof VerifyDomainApiV1TenancyTenantDomainVerifyPostParamsSchema>) => void
  onError?: (error: Error, variables: z.infer<typeof VerifyDomainApiV1TenancyTenantDomainVerifyPostParamsSchema>) => void
  optimisticUpdate?: (variables: z.infer<typeof VerifyDomainApiV1TenancyTenantDomainVerifyPostParamsSchema>) => unknown
  showToast?: boolean
}) {
  const queryClient = useQueryClient()
  const [isPending, startTransition] = useTransition()
  const [optimisticData, setOptimisticData] = useOptimistic<unknown, z.infer<typeof VerifyDomainApiV1TenancyTenantDomainVerifyPostParamsSchema>>(null, (_, newData) => newData)

  const mutation = useMutation({
    mutationFn: async (variables: z.infer<typeof VerifyDomainApiV1TenancyTenantDomainVerifyPostParamsSchema>): Promise<z.infer<typeof VerifyDomainApiV1TenancyTenantDomainVerifyPostResponseSchema>> => {
      try {
        const result = await resolveActionResult<z.infer<typeof VerifyDomainApiV1TenancyTenantDomainVerifyPostResponseSchema>>(verifyDomainApiV1TenancyTenantDomainVerifyPost(variables))
        return (result ?? ({} as z.infer<typeof VerifyDomainApiV1TenancyTenantDomainVerifyPostResponseSchema>))
      } catch (error) {
        handleActionError(error)
      }
    },
    
    onMutate: async (variables: z.infer<typeof VerifyDomainApiV1TenancyTenantDomainVerifyPostParamsSchema>) => {
      await Promise.all([
        queryClient.cancelQueries({ queryKey: ['getCurrentTenantApiV1TenancyTenantGet'] }),
        queryClient.cancelQueries({ queryKey: ['getConfigApiV1TenancyTenantTenantIdConfigGet'] })
      ])

      // Optimistic update (if provided)
      if (options?.optimisticUpdate) {
        const optimisticValue = options.optimisticUpdate(variables)
        setOptimisticData(optimisticValue as z.infer<typeof VerifyDomainApiV1TenancyTenantDomainVerifyPostParamsSchema>)
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
    
    onError: (error: Error, variables: z.infer<typeof VerifyDomainApiV1TenancyTenantDomainVerifyPostParamsSchema>) => {
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
        queryClient.invalidateQueries({ queryKey: ['getCurrentTenantApiV1TenancyTenantGet'] }),
        queryClient.invalidateQueries({ queryKey: ['getConfigApiV1TenancyTenantTenantIdConfigGet'] }),
        queryClient.invalidateQueries({ queryKey: ['Multi-Tenancy'] })
      ])
    }
  })

  return {
    ...mutation,
    mutateWithTransition: (variables: z.infer<typeof VerifyDomainApiV1TenancyTenantDomainVerifyPostParamsSchema>) => {
      startTransition(() => {
        mutation.mutate(variables)
      })
    },
    isPending: isPending || mutation.isPending,
    optimisticData
  }
}

/**
 * Optimized mutation hook for PUT /api/v1/tenancy/tenant/{tenant_id}/config
 * Features: Optimistic updates, smart invalidation, error handling
 * @param options - Mutation options
 * @returns Mutation result with enhanced features
 */
export function useUpdateConfigApiV1TenancyTenantTenantIdConfigPutMutation(options?: {
  onSuccess?: (data: z.infer<typeof UpdateConfigApiV1TenancyTenantTenantIdConfigPutResponseSchema>, variables: { body: z.infer<typeof UpdateConfigApiV1TenancyTenantTenantIdConfigPutRequestSchema>, params: z.infer<typeof UpdateConfigApiV1TenancyTenantTenantIdConfigPutParamsSchema> }) => void
  onError?: (error: Error, variables: { body: z.infer<typeof UpdateConfigApiV1TenancyTenantTenantIdConfigPutRequestSchema>, params: z.infer<typeof UpdateConfigApiV1TenancyTenantTenantIdConfigPutParamsSchema> }) => void
  optimisticUpdate?: (variables: { body: z.infer<typeof UpdateConfigApiV1TenancyTenantTenantIdConfigPutRequestSchema>, params: z.infer<typeof UpdateConfigApiV1TenancyTenantTenantIdConfigPutParamsSchema> }) => unknown
  showToast?: boolean
}) {
  const queryClient = useQueryClient()
  const [isPending, startTransition] = useTransition()
  const [optimisticData, setOptimisticData] = useOptimistic<unknown, { body: z.infer<typeof UpdateConfigApiV1TenancyTenantTenantIdConfigPutRequestSchema>, params: z.infer<typeof UpdateConfigApiV1TenancyTenantTenantIdConfigPutParamsSchema> }>(null, (_, newData) => newData)

  const mutation = useMutation({
    mutationFn: async (variables: { body: z.infer<typeof UpdateConfigApiV1TenancyTenantTenantIdConfigPutRequestSchema>, params: z.infer<typeof UpdateConfigApiV1TenancyTenantTenantIdConfigPutParamsSchema> }): Promise<z.infer<typeof UpdateConfigApiV1TenancyTenantTenantIdConfigPutResponseSchema>> => {
      try {
        const result = await resolveActionResult<z.infer<typeof UpdateConfigApiV1TenancyTenantTenantIdConfigPutResponseSchema>>(updateConfigApiV1TenancyTenantTenantIdConfigPut(variables))
        return (result ?? ({} as z.infer<typeof UpdateConfigApiV1TenancyTenantTenantIdConfigPutResponseSchema>))
      } catch (error) {
        handleActionError(error)
      }
    },
    
    onMutate: async (variables: { body: z.infer<typeof UpdateConfigApiV1TenancyTenantTenantIdConfigPutRequestSchema>, params: z.infer<typeof UpdateConfigApiV1TenancyTenantTenantIdConfigPutParamsSchema> }) => {
      await Promise.all([
        queryClient.cancelQueries({ queryKey: ['getCurrentTenantApiV1TenancyTenantGet'] }),
        queryClient.cancelQueries({ queryKey: ['getConfigApiV1TenancyTenantTenantIdConfigGet'] })
      ])

      // Optimistic update (if provided)
      if (options?.optimisticUpdate) {
        const optimisticValue = options.optimisticUpdate(variables)
        setOptimisticData(optimisticValue as { body: z.infer<typeof UpdateConfigApiV1TenancyTenantTenantIdConfigPutRequestSchema>, params: z.infer<typeof UpdateConfigApiV1TenancyTenantTenantIdConfigPutParamsSchema> })
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
    
    onError: (error: Error, variables: { body: z.infer<typeof UpdateConfigApiV1TenancyTenantTenantIdConfigPutRequestSchema>, params: z.infer<typeof UpdateConfigApiV1TenancyTenantTenantIdConfigPutParamsSchema> }) => {
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
        queryClient.invalidateQueries({ queryKey: ['getCurrentTenantApiV1TenancyTenantGet'] }),
        queryClient.invalidateQueries({ queryKey: ['getConfigApiV1TenancyTenantTenantIdConfigGet'] }),
        queryClient.invalidateQueries({ queryKey: ['Multi-Tenancy'] })
      ])
    }
  })

  return {
    ...mutation,
    mutateWithTransition: (variables: { body: z.infer<typeof UpdateConfigApiV1TenancyTenantTenantIdConfigPutRequestSchema>, params: z.infer<typeof UpdateConfigApiV1TenancyTenantTenantIdConfigPutParamsSchema> }) => {
      startTransition(() => {
        mutation.mutate(variables)
      })
    },
    isPending: isPending || mutation.isPending,
    optimisticData
  }
}