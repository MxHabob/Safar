'use client'
import { useQuery, useQueryClient, useSuspenseQuery, useMutation } from '@tanstack/react-query'
import { useOptimistic, useTransition } from 'react'
import { parseAsInteger, parseAsString, useQueryStates } from 'nuqs'
import { toast } from 'sonner'
import { getSubscriptionPlansApiV1SubscriptionsPlansGet, getMySubscriptionApiV1SubscriptionsMySubscriptionGet, checkUsageApiV1SubscriptionsUsageLimitTypeGet, subscribeApiV1SubscriptionsSubscribePost, cancelSubscriptionApiV1SubscriptionsSubscriptionIdCancelPost } from '@/generated/actions/subscriptions'
import {
  GetSubscriptionPlansApiV1SubscriptionsPlansGetResponseSchema,
  GetSubscriptionPlansApiV1SubscriptionsPlansGetParamsSchema,
  GetMySubscriptionApiV1SubscriptionsMySubscriptionGetResponseSchema,
  GetMySubscriptionApiV1SubscriptionsMySubscriptionGetParamsSchema,
  CheckUsageApiV1SubscriptionsUsageLimitTypeGetResponseSchema,
  CheckUsageApiV1SubscriptionsUsageLimitTypeGetParamsSchema,
  SubscribeApiV1SubscriptionsSubscribePostResponseSchema,
  SubscribeApiV1SubscriptionsSubscribePostParamsSchema,
  CancelSubscriptionApiV1SubscriptionsSubscriptionIdCancelPostResponseSchema,
  CancelSubscriptionApiV1SubscriptionsSubscriptionIdCancelPostParamsSchema
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
 * Optimized query hook for GET /api/v1/subscriptions/plans
 * Features: Smart caching, error handling, type safety
 * @returns useQuery result with data of type z.infer<typeof GetSubscriptionPlansApiV1SubscriptionsPlansGetResponseSchema>
 */
export function useGetSubscriptionPlansApiV1SubscriptionsPlansGet(plan_type: 'host' | 'guest', options?: { enabled?: boolean; suspense?: boolean; refetchInterval?: number; initialData?: z.infer<typeof GetSubscriptionPlansApiV1SubscriptionsPlansGetResponseSchema> }) {
  const { initialData, ...restOptions } = options ?? {}

  return useQuery({
    queryKey: ['getSubscriptionPlansApiV1SubscriptionsPlansGet', plan_type],
    queryFn: async ({ signal }: { signal?: AbortSignal }) => {
      try {
        const result = await resolveActionResult<z.infer<typeof GetSubscriptionPlansApiV1SubscriptionsPlansGetResponseSchema>>(getSubscriptionPlansApiV1SubscriptionsPlansGet({ query: { plan_type } }))
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
    placeholderData: (previousData: z.infer<typeof GetSubscriptionPlansApiV1SubscriptionsPlansGetResponseSchema> | undefined) => previousData,
    retry: (failureCount: number, error: Error) => {
      // Don't retry on 4xx errors (client errors)
      if (error instanceof Error && error.message.includes('4')) return false
      // Retry up to 3 times for network/server errors
      return failureCount < 3
    },
    initialData: initialData as z.infer<typeof GetSubscriptionPlansApiV1SubscriptionsPlansGetResponseSchema> | undefined,
    ...restOptions
  })
}

/**
 * Suspense version for /api/v1/subscriptions/plans
 * @returns useSuspenseQuery result with data of type z.infer<typeof GetSubscriptionPlansApiV1SubscriptionsPlansGetResponseSchema>
 */
export function useSuspenseGetSubscriptionPlansApiV1SubscriptionsPlansGet(plan_type: 'host' | 'guest', options?: { enabled?: boolean; suspense?: boolean; refetchInterval?: number; initialData?: z.infer<typeof GetSubscriptionPlansApiV1SubscriptionsPlansGetResponseSchema> }) {
  const { initialData, ...restOptions } = options ?? {}

  return useSuspenseQuery({
    queryKey: ['getSubscriptionPlansApiV1SubscriptionsPlansGet', plan_type],
    queryFn: async () => {
      const result = await resolveActionResult<z.infer<typeof GetSubscriptionPlansApiV1SubscriptionsPlansGetResponseSchema>>(getSubscriptionPlansApiV1SubscriptionsPlansGet({ query: { plan_type } }))
      return result
    },
    staleTime: 180000,
    initialData: initialData as z.infer<typeof GetSubscriptionPlansApiV1SubscriptionsPlansGetResponseSchema> | undefined,
    ...restOptions
  })
}

/**
 * Optimized query hook for GET /api/v1/subscriptions/my-subscription
 * Features: Smart caching, error handling, type safety
 * @returns useQuery result with data of type z.infer<typeof GetMySubscriptionApiV1SubscriptionsMySubscriptionGetResponseSchema>
 */
export function useGetMySubscriptionApiV1SubscriptionsMySubscriptionGet(plan_type?: unknown, options?: { enabled?: boolean; suspense?: boolean; refetchInterval?: number; initialData?: z.infer<typeof GetMySubscriptionApiV1SubscriptionsMySubscriptionGetResponseSchema> }) {
  const { initialData, ...restOptions } = options ?? {}

  return useQuery({
    queryKey: ['getMySubscriptionApiV1SubscriptionsMySubscriptionGet', plan_type],
    queryFn: async ({ signal }: { signal?: AbortSignal }) => {
      try {
        const result = await resolveActionResult<z.infer<typeof GetMySubscriptionApiV1SubscriptionsMySubscriptionGetResponseSchema>>(getMySubscriptionApiV1SubscriptionsMySubscriptionGet({ query: { plan_type } }))
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
    placeholderData: (previousData: z.infer<typeof GetMySubscriptionApiV1SubscriptionsMySubscriptionGetResponseSchema> | undefined) => previousData,
    retry: (failureCount: number, error: Error) => {
      // Don't retry on 4xx errors (client errors)
      if (error instanceof Error && error.message.includes('4')) return false
      // Retry up to 3 times for network/server errors
      return failureCount < 3
    },
    initialData: initialData as z.infer<typeof GetMySubscriptionApiV1SubscriptionsMySubscriptionGetResponseSchema> | undefined,
    ...restOptions
  })
}

/**
 * Suspense version for /api/v1/subscriptions/my-subscription
 * @returns useSuspenseQuery result with data of type z.infer<typeof GetMySubscriptionApiV1SubscriptionsMySubscriptionGetResponseSchema>
 */
export function useSuspenseGetMySubscriptionApiV1SubscriptionsMySubscriptionGet(plan_type?: unknown, options?: { enabled?: boolean; suspense?: boolean; refetchInterval?: number; initialData?: z.infer<typeof GetMySubscriptionApiV1SubscriptionsMySubscriptionGetResponseSchema> }) {
  const { initialData, ...restOptions } = options ?? {}

  return useSuspenseQuery({
    queryKey: ['getMySubscriptionApiV1SubscriptionsMySubscriptionGet', plan_type],
    queryFn: async () => {
      const result = await resolveActionResult<z.infer<typeof GetMySubscriptionApiV1SubscriptionsMySubscriptionGetResponseSchema>>(getMySubscriptionApiV1SubscriptionsMySubscriptionGet({ query: { plan_type } }))
      return result
    },
    staleTime: 180000,
    initialData: initialData as z.infer<typeof GetMySubscriptionApiV1SubscriptionsMySubscriptionGetResponseSchema> | undefined,
    ...restOptions
  })
}

/**
 * Optimized query hook for GET /api/v1/subscriptions/usage/{limit_type}
 * Features: Smart caching, error handling, type safety
 * @returns useQuery result with data of type z.infer<typeof CheckUsageApiV1SubscriptionsUsageLimitTypeGetResponseSchema>
 */
export function useCheckUsageApiV1SubscriptionsUsageLimitTypeGet(limit_type: string, plan_type?: unknown, options?: { enabled?: boolean; suspense?: boolean; refetchInterval?: number; initialData?: z.infer<typeof CheckUsageApiV1SubscriptionsUsageLimitTypeGetResponseSchema> }) {
  const { initialData, ...restOptions } = options ?? {}

  return useQuery({
    queryKey: ['checkUsageApiV1SubscriptionsUsageLimitTypeGet', limit_type, plan_type],
    queryFn: async ({ signal }: { signal?: AbortSignal }) => {
      try {
        const result = await resolveActionResult<z.infer<typeof CheckUsageApiV1SubscriptionsUsageLimitTypeGetResponseSchema>>(checkUsageApiV1SubscriptionsUsageLimitTypeGet({ path: { limit_type }, query: { plan_type } }))
        return result
      } catch (error) {
        handleActionError(error)
      }
    },
    staleTime: 180000,
    gcTime: 360000, // React Query v5: gcTime replaces cacheTime
    enabled: !!limit_type && (options?.enabled ?? true),
    refetchOnWindowFocus: true, // Refetch when window regains focus
    refetchOnReconnect: true, // Refetch when network reconnects
    refetchOnMount: 'always', // Always refetch on mount for fresh data
    refetchInterval: options?.refetchInterval, // Optional polling interval
    // React Query v5: placeholderData replaces keepPreviousData
    placeholderData: (previousData: z.infer<typeof CheckUsageApiV1SubscriptionsUsageLimitTypeGetResponseSchema> | undefined) => previousData,
    retry: (failureCount: number, error: Error) => {
      // Don't retry on 4xx errors (client errors)
      if (error instanceof Error && error.message.includes('4')) return false
      // Retry up to 3 times for network/server errors
      return failureCount < 3
    },
    initialData: initialData as z.infer<typeof CheckUsageApiV1SubscriptionsUsageLimitTypeGetResponseSchema> | undefined,
    ...restOptions
  })
}

/**
 * Suspense version for /api/v1/subscriptions/usage/{limit_type}
 * @returns useSuspenseQuery result with data of type z.infer<typeof CheckUsageApiV1SubscriptionsUsageLimitTypeGetResponseSchema>
 */
export function useSuspenseCheckUsageApiV1SubscriptionsUsageLimitTypeGet(limit_type: string, plan_type?: unknown, options?: { enabled?: boolean; suspense?: boolean; refetchInterval?: number; initialData?: z.infer<typeof CheckUsageApiV1SubscriptionsUsageLimitTypeGetResponseSchema> }) {
  const { initialData, ...restOptions } = options ?? {}

  return useSuspenseQuery({
    queryKey: ['checkUsageApiV1SubscriptionsUsageLimitTypeGet', limit_type, plan_type],
    queryFn: async () => {
      const result = await resolveActionResult<z.infer<typeof CheckUsageApiV1SubscriptionsUsageLimitTypeGetResponseSchema>>(checkUsageApiV1SubscriptionsUsageLimitTypeGet({ path: { limit_type }, query: { plan_type } }))
      return result
    },
    staleTime: 180000,
    initialData: initialData as z.infer<typeof CheckUsageApiV1SubscriptionsUsageLimitTypeGetResponseSchema> | undefined,
    ...restOptions
  })
}

/**
 * Optimized mutation hook for POST /api/v1/subscriptions/subscribe
 * Features: Optimistic updates, smart invalidation, error handling
 * @param options - Mutation options
 * @returns Mutation result with enhanced features
 */
export function useSubscribeApiV1SubscriptionsSubscribePostMutation(options?: {
  onSuccess?: (data: z.infer<typeof SubscribeApiV1SubscriptionsSubscribePostResponseSchema>, variables: z.infer<typeof SubscribeApiV1SubscriptionsSubscribePostParamsSchema>) => void
  onError?: (error: Error, variables: z.infer<typeof SubscribeApiV1SubscriptionsSubscribePostParamsSchema>) => void
  optimisticUpdate?: (variables: z.infer<typeof SubscribeApiV1SubscriptionsSubscribePostParamsSchema>) => unknown
  showToast?: boolean
}) {
  const queryClient = useQueryClient()
  const [isPending, startTransition] = useTransition()
  const [optimisticData, setOptimisticData] = useOptimistic<unknown, z.infer<typeof SubscribeApiV1SubscriptionsSubscribePostParamsSchema>>(null, (_, newData) => newData)

  const mutation = useMutation({
    mutationFn: async (variables: z.infer<typeof SubscribeApiV1SubscriptionsSubscribePostParamsSchema>): Promise<z.infer<typeof SubscribeApiV1SubscriptionsSubscribePostResponseSchema>> => {
      try {
        const result = await resolveActionResult<z.infer<typeof SubscribeApiV1SubscriptionsSubscribePostResponseSchema>>(subscribeApiV1SubscriptionsSubscribePost(variables))
        return (result ?? ({} as z.infer<typeof SubscribeApiV1SubscriptionsSubscribePostResponseSchema>))
      } catch (error) {
        handleActionError(error)
      }
    },
    
    onMutate: async (variables: z.infer<typeof SubscribeApiV1SubscriptionsSubscribePostParamsSchema>) => {
      await Promise.all([
        queryClient.cancelQueries({ queryKey: ['getSubscriptionPlansApiV1SubscriptionsPlansGet'] }),
        queryClient.cancelQueries({ queryKey: ['getMySubscriptionApiV1SubscriptionsMySubscriptionGet'] }),
        queryClient.cancelQueries({ queryKey: ['checkUsageApiV1SubscriptionsUsageLimitTypeGet'] })
      ])

      // Optimistic update (if provided)
      if (options?.optimisticUpdate) {
        const optimisticValue = options.optimisticUpdate(variables)
        setOptimisticData(optimisticValue as z.infer<typeof SubscribeApiV1SubscriptionsSubscribePostParamsSchema>)
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
    
    onError: (error: Error, variables: z.infer<typeof SubscribeApiV1SubscriptionsSubscribePostParamsSchema>) => {
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
        queryClient.invalidateQueries({ queryKey: ['getSubscriptionPlansApiV1SubscriptionsPlansGet'] }),
        queryClient.invalidateQueries({ queryKey: ['getMySubscriptionApiV1SubscriptionsMySubscriptionGet'] }),
        queryClient.invalidateQueries({ queryKey: ['checkUsageApiV1SubscriptionsUsageLimitTypeGet'] }),
        queryClient.invalidateQueries({ queryKey: ['Subscriptions'] })
      ])
    }
  })

  return {
    ...mutation,
    mutateWithTransition: (variables: z.infer<typeof SubscribeApiV1SubscriptionsSubscribePostParamsSchema>) => {
      startTransition(() => {
        mutation.mutate(variables)
      })
    },
    isPending: isPending || mutation.isPending,
    optimisticData
  }
}

/**
 * Optimized mutation hook for POST /api/v1/subscriptions/{subscription_id}/cancel
 * Features: Optimistic updates, smart invalidation, error handling
 * @param options - Mutation options
 * @returns Mutation result with enhanced features
 */
export function useCancelSubscriptionApiV1SubscriptionsSubscriptionIdCancelPostMutation(options?: {
  onSuccess?: (data: z.infer<typeof CancelSubscriptionApiV1SubscriptionsSubscriptionIdCancelPostResponseSchema>, variables: z.infer<typeof CancelSubscriptionApiV1SubscriptionsSubscriptionIdCancelPostParamsSchema>) => void
  onError?: (error: Error, variables: z.infer<typeof CancelSubscriptionApiV1SubscriptionsSubscriptionIdCancelPostParamsSchema>) => void
  optimisticUpdate?: (variables: z.infer<typeof CancelSubscriptionApiV1SubscriptionsSubscriptionIdCancelPostParamsSchema>) => unknown
  showToast?: boolean
}) {
  const queryClient = useQueryClient()
  const [isPending, startTransition] = useTransition()
  const [optimisticData, setOptimisticData] = useOptimistic<unknown, z.infer<typeof CancelSubscriptionApiV1SubscriptionsSubscriptionIdCancelPostParamsSchema>>(null, (_, newData) => newData)

  const mutation = useMutation({
    mutationFn: async (variables: z.infer<typeof CancelSubscriptionApiV1SubscriptionsSubscriptionIdCancelPostParamsSchema>): Promise<z.infer<typeof CancelSubscriptionApiV1SubscriptionsSubscriptionIdCancelPostResponseSchema>> => {
      try {
        const result = await resolveActionResult<z.infer<typeof CancelSubscriptionApiV1SubscriptionsSubscriptionIdCancelPostResponseSchema>>(cancelSubscriptionApiV1SubscriptionsSubscriptionIdCancelPost(variables))
        return (result ?? ({} as z.infer<typeof CancelSubscriptionApiV1SubscriptionsSubscriptionIdCancelPostResponseSchema>))
      } catch (error) {
        handleActionError(error)
      }
    },
    
    onMutate: async (variables: z.infer<typeof CancelSubscriptionApiV1SubscriptionsSubscriptionIdCancelPostParamsSchema>) => {
      await Promise.all([
        queryClient.cancelQueries({ queryKey: ['getSubscriptionPlansApiV1SubscriptionsPlansGet'] }),
        queryClient.cancelQueries({ queryKey: ['getMySubscriptionApiV1SubscriptionsMySubscriptionGet'] }),
        queryClient.cancelQueries({ queryKey: ['checkUsageApiV1SubscriptionsUsageLimitTypeGet'] })
      ])

      // Optimistic update (if provided)
      if (options?.optimisticUpdate) {
        const optimisticValue = options.optimisticUpdate(variables)
        setOptimisticData(optimisticValue as z.infer<typeof CancelSubscriptionApiV1SubscriptionsSubscriptionIdCancelPostParamsSchema>)
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
    
    onError: (error: Error, variables: z.infer<typeof CancelSubscriptionApiV1SubscriptionsSubscriptionIdCancelPostParamsSchema>) => {
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
        queryClient.invalidateQueries({ queryKey: ['getSubscriptionPlansApiV1SubscriptionsPlansGet'] }),
        queryClient.invalidateQueries({ queryKey: ['getMySubscriptionApiV1SubscriptionsMySubscriptionGet'] }),
        queryClient.invalidateQueries({ queryKey: ['checkUsageApiV1SubscriptionsUsageLimitTypeGet'] }),
        queryClient.invalidateQueries({ queryKey: ['Subscriptions'] })
      ])
    }
  })

  return {
    ...mutation,
    mutateWithTransition: (variables: z.infer<typeof CancelSubscriptionApiV1SubscriptionsSubscriptionIdCancelPostParamsSchema>) => {
      startTransition(() => {
        mutation.mutate(variables)
      })
    },
    isPending: isPending || mutation.isPending,
    optimisticData
  }
}