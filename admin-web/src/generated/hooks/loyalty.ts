'use client'
import { useQuery, useQueryClient, useSuspenseQuery, useMutation } from '@tanstack/react-query'
import { useOptimistic, useTransition } from 'react'
import { parseAsInteger, parseAsString, useQueryStates } from 'nuqs'
import { toast } from 'sonner'
import { getLoyaltyStatusApiV1LoyaltyStatusGet, getRedemptionOptionsApiV1LoyaltyRedemptionOptionsGet, getLoyaltyHistoryApiV1LoyaltyHistoryGet, redeemPointsApiV1LoyaltyRedeemPost } from '@/generated/actions/loyalty'
import {
  GetLoyaltyStatusApiV1LoyaltyStatusGetResponseSchema,
  GetRedemptionOptionsApiV1LoyaltyRedemptionOptionsGetResponseSchema,
  GetLoyaltyHistoryApiV1LoyaltyHistoryGetResponseSchema,
  GetLoyaltyHistoryApiV1LoyaltyHistoryGetParamsSchema,
  RedeemPointsApiV1LoyaltyRedeemPostResponseSchema,
  RedeemPointsApiV1LoyaltyRedeemPostRequestSchema
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
 * Optimized query hook for GET /api/v1/loyalty/status
 * Features: Smart caching, error handling, type safety
 * @returns useQuery result with data of type z.infer<typeof GetLoyaltyStatusApiV1LoyaltyStatusGetResponseSchema>
 */
export function useGetLoyaltyStatusApiV1LoyaltyStatusGet(options?: { enabled?: boolean; suspense?: boolean; refetchInterval?: number; initialData?: z.infer<typeof GetLoyaltyStatusApiV1LoyaltyStatusGetResponseSchema> }) {
  const { initialData, ...restOptions } = options ?? {}

  return useQuery({
    queryKey: ['getLoyaltyStatusApiV1LoyaltyStatusGet'],
    queryFn: async ({ signal }: { signal?: AbortSignal }) => {
      try {
        const result = await resolveActionResult<z.infer<typeof GetLoyaltyStatusApiV1LoyaltyStatusGetResponseSchema>>(getLoyaltyStatusApiV1LoyaltyStatusGet())
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
    placeholderData: (previousData: z.infer<typeof GetLoyaltyStatusApiV1LoyaltyStatusGetResponseSchema> | undefined) => previousData,
    retry: (failureCount: number, error: Error) => {
      // Don't retry on 4xx errors (client errors)
      if (error instanceof Error && error.message.includes('4')) return false
      // Retry up to 3 times for network/server errors
      return failureCount < 3
    },
    initialData: initialData as z.infer<typeof GetLoyaltyStatusApiV1LoyaltyStatusGetResponseSchema> | undefined,
    ...restOptions
  })
}

/**
 * Suspense version for /api/v1/loyalty/status
 * @returns useSuspenseQuery result with data of type z.infer<typeof GetLoyaltyStatusApiV1LoyaltyStatusGetResponseSchema>
 */
export function useSuspenseGetLoyaltyStatusApiV1LoyaltyStatusGet(options?: { enabled?: boolean; suspense?: boolean; refetchInterval?: number; initialData?: z.infer<typeof GetLoyaltyStatusApiV1LoyaltyStatusGetResponseSchema> }) {
  const { initialData, ...restOptions } = options ?? {}

  return useSuspenseQuery({
    queryKey: ['getLoyaltyStatusApiV1LoyaltyStatusGet'],
    queryFn: async () => {
      const result = await resolveActionResult<z.infer<typeof GetLoyaltyStatusApiV1LoyaltyStatusGetResponseSchema>>(getLoyaltyStatusApiV1LoyaltyStatusGet())
      return result
    },
    staleTime: 180000,
    initialData: initialData as z.infer<typeof GetLoyaltyStatusApiV1LoyaltyStatusGetResponseSchema> | undefined,
    ...restOptions
  })
}

/**
 * Optimized query hook for GET /api/v1/loyalty/redemption-options
 * Features: Smart caching, error handling, type safety
 * @returns useQuery result with data of type z.infer<typeof GetRedemptionOptionsApiV1LoyaltyRedemptionOptionsGetResponseSchema>
 */
export function useGetRedemptionOptionsApiV1LoyaltyRedemptionOptionsGet(options?: { enabled?: boolean; suspense?: boolean; refetchInterval?: number; initialData?: z.infer<typeof GetRedemptionOptionsApiV1LoyaltyRedemptionOptionsGetResponseSchema> }) {
  const { initialData, ...restOptions } = options ?? {}

  return useQuery({
    queryKey: ['getRedemptionOptionsApiV1LoyaltyRedemptionOptionsGet'],
    queryFn: async ({ signal }: { signal?: AbortSignal }) => {
      try {
        const result = await resolveActionResult<z.infer<typeof GetRedemptionOptionsApiV1LoyaltyRedemptionOptionsGetResponseSchema>>(getRedemptionOptionsApiV1LoyaltyRedemptionOptionsGet())
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
    placeholderData: (previousData: z.infer<typeof GetRedemptionOptionsApiV1LoyaltyRedemptionOptionsGetResponseSchema> | undefined) => previousData,
    retry: (failureCount: number, error: Error) => {
      // Don't retry on 4xx errors (client errors)
      if (error instanceof Error && error.message.includes('4')) return false
      // Retry up to 3 times for network/server errors
      return failureCount < 3
    },
    initialData: initialData as z.infer<typeof GetRedemptionOptionsApiV1LoyaltyRedemptionOptionsGetResponseSchema> | undefined,
    ...restOptions
  })
}

/**
 * Suspense version for /api/v1/loyalty/redemption-options
 * @returns useSuspenseQuery result with data of type z.infer<typeof GetRedemptionOptionsApiV1LoyaltyRedemptionOptionsGetResponseSchema>
 */
export function useSuspenseGetRedemptionOptionsApiV1LoyaltyRedemptionOptionsGet(options?: { enabled?: boolean; suspense?: boolean; refetchInterval?: number; initialData?: z.infer<typeof GetRedemptionOptionsApiV1LoyaltyRedemptionOptionsGetResponseSchema> }) {
  const { initialData, ...restOptions } = options ?? {}

  return useSuspenseQuery({
    queryKey: ['getRedemptionOptionsApiV1LoyaltyRedemptionOptionsGet'],
    queryFn: async () => {
      const result = await resolveActionResult<z.infer<typeof GetRedemptionOptionsApiV1LoyaltyRedemptionOptionsGetResponseSchema>>(getRedemptionOptionsApiV1LoyaltyRedemptionOptionsGet())
      return result
    },
    staleTime: 180000,
    initialData: initialData as z.infer<typeof GetRedemptionOptionsApiV1LoyaltyRedemptionOptionsGetResponseSchema> | undefined,
    ...restOptions
  })
}

/**
 * Optimized query hook for GET /api/v1/loyalty/history
 * Features: Smart caching, error handling, type safety
 * @returns useQuery result with data of type z.infer<typeof GetLoyaltyHistoryApiV1LoyaltyHistoryGetResponseSchema>
 */
export function useGetLoyaltyHistoryApiV1LoyaltyHistoryGet(limit?: number, options?: { enabled?: boolean; suspense?: boolean; refetchInterval?: number; initialData?: z.infer<typeof GetLoyaltyHistoryApiV1LoyaltyHistoryGetResponseSchema> }) {
  const { initialData, ...restOptions } = options ?? {}

  return useQuery({
    queryKey: ['getLoyaltyHistoryApiV1LoyaltyHistoryGet', limit],
    queryFn: async ({ signal }: { signal?: AbortSignal }) => {
      try {
        const result = await resolveActionResult<z.infer<typeof GetLoyaltyHistoryApiV1LoyaltyHistoryGetResponseSchema>>(getLoyaltyHistoryApiV1LoyaltyHistoryGet({ query: { limit } }))
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
    placeholderData: (previousData: z.infer<typeof GetLoyaltyHistoryApiV1LoyaltyHistoryGetResponseSchema> | undefined) => previousData,
    retry: (failureCount: number, error: Error) => {
      // Don't retry on 4xx errors (client errors)
      if (error instanceof Error && error.message.includes('4')) return false
      // Retry up to 3 times for network/server errors
      return failureCount < 3
    },
    initialData: initialData as z.infer<typeof GetLoyaltyHistoryApiV1LoyaltyHistoryGetResponseSchema> | undefined,
    ...restOptions
  })
}

/**
 * Suspense version for /api/v1/loyalty/history
 * @returns useSuspenseQuery result with data of type z.infer<typeof GetLoyaltyHistoryApiV1LoyaltyHistoryGetResponseSchema>
 */
export function useSuspenseGetLoyaltyHistoryApiV1LoyaltyHistoryGet(limit?: number, options?: { enabled?: boolean; suspense?: boolean; refetchInterval?: number; initialData?: z.infer<typeof GetLoyaltyHistoryApiV1LoyaltyHistoryGetResponseSchema> }) {
  const { initialData, ...restOptions } = options ?? {}

  return useSuspenseQuery({
    queryKey: ['getLoyaltyHistoryApiV1LoyaltyHistoryGet', limit],
    queryFn: async () => {
      const result = await resolveActionResult<z.infer<typeof GetLoyaltyHistoryApiV1LoyaltyHistoryGetResponseSchema>>(getLoyaltyHistoryApiV1LoyaltyHistoryGet({ query: { limit } }))
      return result
    },
    staleTime: 180000,
    initialData: initialData as z.infer<typeof GetLoyaltyHistoryApiV1LoyaltyHistoryGetResponseSchema> | undefined,
    ...restOptions
  })
}

/**
 * Optimized mutation hook for POST /api/v1/loyalty/redeem
 * Features: Optimistic updates, smart invalidation, error handling
 * @param options - Mutation options
 * @returns Mutation result with enhanced features
 */
export function useRedeemPointsApiV1LoyaltyRedeemPostMutation(options?: {
  onSuccess?: (data: z.infer<typeof RedeemPointsApiV1LoyaltyRedeemPostResponseSchema>, variables: z.infer<typeof RedeemPointsApiV1LoyaltyRedeemPostRequestSchema>) => void
  onError?: (error: Error, variables: z.infer<typeof RedeemPointsApiV1LoyaltyRedeemPostRequestSchema>) => void
  optimisticUpdate?: (variables: z.infer<typeof RedeemPointsApiV1LoyaltyRedeemPostRequestSchema>) => unknown
  showToast?: boolean
}) {
  const queryClient = useQueryClient()
  const [isPending, startTransition] = useTransition()
  const [optimisticData, setOptimisticData] = useOptimistic<unknown, z.infer<typeof RedeemPointsApiV1LoyaltyRedeemPostRequestSchema>>(null, (_, newData) => newData)

  const mutation = useMutation({
    mutationFn: async (variables: z.infer<typeof RedeemPointsApiV1LoyaltyRedeemPostRequestSchema>): Promise<z.infer<typeof RedeemPointsApiV1LoyaltyRedeemPostResponseSchema>> => {
      try {
        const result = await resolveActionResult<z.infer<typeof RedeemPointsApiV1LoyaltyRedeemPostResponseSchema>>(redeemPointsApiV1LoyaltyRedeemPost(variables))
        return (result ?? ({} as z.infer<typeof RedeemPointsApiV1LoyaltyRedeemPostResponseSchema>))
      } catch (error) {
        handleActionError(error)
      }
    },
    
    onMutate: async (variables: z.infer<typeof RedeemPointsApiV1LoyaltyRedeemPostRequestSchema>) => {
      await Promise.all([
        queryClient.cancelQueries({ queryKey: ['getLoyaltyStatusApiV1LoyaltyStatusGet'] }),
        queryClient.cancelQueries({ queryKey: ['getRedemptionOptionsApiV1LoyaltyRedemptionOptionsGet'] }),
        queryClient.cancelQueries({ queryKey: ['getLoyaltyHistoryApiV1LoyaltyHistoryGet'] })
      ])

      // Optimistic update (if provided)
      if (options?.optimisticUpdate) {
        const optimisticValue = options.optimisticUpdate(variables)
        setOptimisticData(optimisticValue as z.infer<typeof RedeemPointsApiV1LoyaltyRedeemPostRequestSchema>)
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
    
    onError: (error: Error, variables: z.infer<typeof RedeemPointsApiV1LoyaltyRedeemPostRequestSchema>) => {
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
        queryClient.invalidateQueries({ queryKey: ['getLoyaltyStatusApiV1LoyaltyStatusGet'] }),
        queryClient.invalidateQueries({ queryKey: ['getRedemptionOptionsApiV1LoyaltyRedemptionOptionsGet'] }),
        queryClient.invalidateQueries({ queryKey: ['getLoyaltyHistoryApiV1LoyaltyHistoryGet'] }),
        queryClient.invalidateQueries({ queryKey: ['Loyalty'] })
      ])
    }
  })

  return {
    ...mutation,
    mutateWithTransition: (variables: z.infer<typeof RedeemPointsApiV1LoyaltyRedeemPostRequestSchema>) => {
      startTransition(() => {
        mutation.mutate(variables)
      })
    },
    isPending: isPending || mutation.isPending,
    optimisticData
  }
}