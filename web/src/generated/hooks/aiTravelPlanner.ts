'use client'
import { useQuery, useQueryClient, useSuspenseQuery, useMutation } from '@tanstack/react-query'
import { useOptimistic, useTransition } from 'react'
import { parseAsInteger, parseAsString, useQueryStates } from 'nuqs'
import { toast } from 'sonner'
import { listTravelPlansApiV1AiTravelPlannerGet, getTravelPlanApiV1AiTravelPlannerPlanIdGet, createTravelPlanApiV1AiTravelPlannerPost } from '@/generated/actions/aiTravelPlanner'
import {
  ListTravelPlansApiV1AiTravelPlannerGetResponseSchema,
  ListTravelPlansApiV1AiTravelPlannerGetParamsSchema,
  GetTravelPlanApiV1AiTravelPlannerPlanIdGetResponseSchema,
  GetTravelPlanApiV1AiTravelPlannerPlanIdGetParamsSchema,
  CreateTravelPlanApiV1AiTravelPlannerPostResponseSchema,
  CreateTravelPlanApiV1AiTravelPlannerPostRequestSchema
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
 * Optimized query hook for GET /api/v1/ai/travel-planner
 * Features: Smart caching, error handling, type safety
 * @returns useQuery result with data of type z.infer<typeof ListTravelPlansApiV1AiTravelPlannerGetResponseSchema>
 */
export function useListTravelPlansApiV1AiTravelPlannerGet(skip?: number, limit?: number, options?: { enabled?: boolean; suspense?: boolean; refetchInterval?: number; initialData?: z.infer<typeof ListTravelPlansApiV1AiTravelPlannerGetResponseSchema> }) {
  const { initialData, ...restOptions } = options ?? {}

  return useQuery({
    queryKey: ['listTravelPlansApiV1AiTravelPlannerGet', skip, limit],
    queryFn: async ({ signal }: { signal?: AbortSignal }) => {
      try {
        const result = await resolveActionResult<z.infer<typeof ListTravelPlansApiV1AiTravelPlannerGetResponseSchema>>(listTravelPlansApiV1AiTravelPlannerGet({ query: { skip, limit } }))
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
    placeholderData: (previousData: z.infer<typeof ListTravelPlansApiV1AiTravelPlannerGetResponseSchema> | undefined) => previousData,
    retry: (failureCount: number, error: Error) => {
      // Don't retry on 4xx errors (client errors)
      if (error instanceof Error && error.message.includes('4')) return false
      // Retry up to 3 times for network/server errors
      return failureCount < 3
    },
    initialData: initialData as z.infer<typeof ListTravelPlansApiV1AiTravelPlannerGetResponseSchema> | undefined,
    ...restOptions
  })
}

/**
 * Suspense version for /api/v1/ai/travel-planner
 * @returns useSuspenseQuery result with data of type z.infer<typeof ListTravelPlansApiV1AiTravelPlannerGetResponseSchema>
 */
export function useSuspenseListTravelPlansApiV1AiTravelPlannerGet(skip?: number, limit?: number, options?: { enabled?: boolean; suspense?: boolean; refetchInterval?: number; initialData?: z.infer<typeof ListTravelPlansApiV1AiTravelPlannerGetResponseSchema> }) {
  const { initialData, ...restOptions } = options ?? {}

  return useSuspenseQuery({
    queryKey: ['listTravelPlansApiV1AiTravelPlannerGet', skip, limit],
    queryFn: async () => {
      const result = await resolveActionResult<z.infer<typeof ListTravelPlansApiV1AiTravelPlannerGetResponseSchema>>(listTravelPlansApiV1AiTravelPlannerGet({ query: { skip, limit } }))
      return result
    },
    staleTime: 180000,
    initialData: initialData as z.infer<typeof ListTravelPlansApiV1AiTravelPlannerGetResponseSchema> | undefined,
    ...restOptions
  })
}

/**
 * Optimized query hook for GET /api/v1/ai/travel-planner/{plan_id}
 * Features: Smart caching, error handling, type safety
 * @returns useQuery result with data of type z.infer<typeof GetTravelPlanApiV1AiTravelPlannerPlanIdGetResponseSchema>
 */
export function useGetTravelPlanApiV1AiTravelPlannerPlanIdGet(plan_id: number, options?: { enabled?: boolean; suspense?: boolean; refetchInterval?: number; initialData?: z.infer<typeof GetTravelPlanApiV1AiTravelPlannerPlanIdGetResponseSchema> }) {
  const { initialData, ...restOptions } = options ?? {}

  return useQuery({
    queryKey: ['getTravelPlanApiV1AiTravelPlannerPlanIdGet', plan_id],
    queryFn: async ({ signal }: { signal?: AbortSignal }) => {
      try {
        const result = await resolveActionResult<z.infer<typeof GetTravelPlanApiV1AiTravelPlannerPlanIdGetResponseSchema>>(getTravelPlanApiV1AiTravelPlannerPlanIdGet({ path: { plan_id } }))
        return result
      } catch (error) {
        handleActionError(error)
      }
    },
    staleTime: 180000,
    gcTime: 360000, // React Query v5: gcTime replaces cacheTime
    enabled: !!plan_id && (options?.enabled ?? true),
    refetchOnWindowFocus: true, // Refetch when window regains focus
    refetchOnReconnect: true, // Refetch when network reconnects
    refetchOnMount: 'always', // Always refetch on mount for fresh data
    refetchInterval: options?.refetchInterval, // Optional polling interval
    // React Query v5: placeholderData replaces keepPreviousData
    placeholderData: (previousData: z.infer<typeof GetTravelPlanApiV1AiTravelPlannerPlanIdGetResponseSchema> | undefined) => previousData,
    retry: (failureCount: number, error: Error) => {
      // Don't retry on 4xx errors (client errors)
      if (error instanceof Error && error.message.includes('4')) return false
      // Retry up to 3 times for network/server errors
      return failureCount < 3
    },
    initialData: initialData as z.infer<typeof GetTravelPlanApiV1AiTravelPlannerPlanIdGetResponseSchema> | undefined,
    ...restOptions
  })
}

/**
 * Suspense version for /api/v1/ai/travel-planner/{plan_id}
 * @returns useSuspenseQuery result with data of type z.infer<typeof GetTravelPlanApiV1AiTravelPlannerPlanIdGetResponseSchema>
 */
export function useSuspenseGetTravelPlanApiV1AiTravelPlannerPlanIdGet(plan_id: number, options?: { enabled?: boolean; suspense?: boolean; refetchInterval?: number; initialData?: z.infer<typeof GetTravelPlanApiV1AiTravelPlannerPlanIdGetResponseSchema> }) {
  const { initialData, ...restOptions } = options ?? {}

  return useSuspenseQuery({
    queryKey: ['getTravelPlanApiV1AiTravelPlannerPlanIdGet', plan_id],
    queryFn: async () => {
      const result = await resolveActionResult<z.infer<typeof GetTravelPlanApiV1AiTravelPlannerPlanIdGetResponseSchema>>(getTravelPlanApiV1AiTravelPlannerPlanIdGet({ path: { plan_id } }))
      return result
    },
    staleTime: 180000,
    initialData: initialData as z.infer<typeof GetTravelPlanApiV1AiTravelPlannerPlanIdGetResponseSchema> | undefined,
    ...restOptions
  })
}

/**
 * Optimized mutation hook for POST /api/v1/ai/travel-planner
 * Features: Optimistic updates, smart invalidation, error handling
 * @param options - Mutation options
 * @returns Mutation result with enhanced features
 */
export function useCreateTravelPlanApiV1AiTravelPlannerPostMutation(options?: {
  onSuccess?: (data: z.infer<typeof CreateTravelPlanApiV1AiTravelPlannerPostResponseSchema>, variables: z.infer<typeof CreateTravelPlanApiV1AiTravelPlannerPostRequestSchema>) => void
  onError?: (error: Error, variables: z.infer<typeof CreateTravelPlanApiV1AiTravelPlannerPostRequestSchema>) => void
  optimisticUpdate?: (variables: z.infer<typeof CreateTravelPlanApiV1AiTravelPlannerPostRequestSchema>) => unknown
  showToast?: boolean
}) {
  const queryClient = useQueryClient()
  const [isPending, startTransition] = useTransition()
  const [optimisticData, setOptimisticData] = useOptimistic<unknown, z.infer<typeof CreateTravelPlanApiV1AiTravelPlannerPostRequestSchema>>(null, (_, newData) => newData)

  const mutation = useMutation({
    mutationFn: async (variables: z.infer<typeof CreateTravelPlanApiV1AiTravelPlannerPostRequestSchema>): Promise<z.infer<typeof CreateTravelPlanApiV1AiTravelPlannerPostResponseSchema>> => {
      try {
        const result = await resolveActionResult<z.infer<typeof CreateTravelPlanApiV1AiTravelPlannerPostResponseSchema>>(createTravelPlanApiV1AiTravelPlannerPost(variables))
        return (result ?? ({} as z.infer<typeof CreateTravelPlanApiV1AiTravelPlannerPostResponseSchema>))
      } catch (error) {
        handleActionError(error)
      }
    },
    
    onMutate: async (variables: z.infer<typeof CreateTravelPlanApiV1AiTravelPlannerPostRequestSchema>) => {
      await Promise.all([
        queryClient.cancelQueries({ queryKey: ['listTravelPlansApiV1AiTravelPlannerGet'] }),
        queryClient.cancelQueries({ queryKey: ['getTravelPlanApiV1AiTravelPlannerPlanIdGet'] })
      ])

      // Optimistic update (if provided)
      if (options?.optimisticUpdate) {
        const optimisticValue = options.optimisticUpdate(variables)
        setOptimisticData(optimisticValue as z.infer<typeof CreateTravelPlanApiV1AiTravelPlannerPostRequestSchema>)
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
    
    onError: (error: Error, variables: z.infer<typeof CreateTravelPlanApiV1AiTravelPlannerPostRequestSchema>) => {
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
        queryClient.invalidateQueries({ queryKey: ['listTravelPlansApiV1AiTravelPlannerGet'] }),
        queryClient.invalidateQueries({ queryKey: ['getTravelPlanApiV1AiTravelPlannerPlanIdGet'] }),
        queryClient.invalidateQueries({ queryKey: ['AI Travel Planner'] })
      ])
    }
  })

  return {
    ...mutation,
    mutateWithTransition: (variables: z.infer<typeof CreateTravelPlanApiV1AiTravelPlannerPostRequestSchema>) => {
      startTransition(() => {
        mutation.mutate(variables)
      })
    },
    isPending: isPending || mutation.isPending,
    optimisticData
  }
}