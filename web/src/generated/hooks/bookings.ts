'use client'
import { useQuery, useQueryClient, useSuspenseQuery, useMutation, useInfiniteQuery } from '@tanstack/react-query'
import { useOptimistic, useTransition } from 'react'
import { parseAsInteger, parseAsString, useQueryStates } from 'nuqs'
import { toast } from 'sonner'
import { listBookingsApiV1BookingsGet, getBookingApiV1BookingsBookingIdGet, listHostBookingsApiV1BookingsHostListingsGet, createBookingApiV1BookingsPost, cancelBookingApiV1BookingsBookingIdCancelPost, confirmBookingApiV1BookingsBookingIdConfirmPost, completeBookingApiV1BookingsBookingIdCompletePost } from '@/generated/actions/bookings'
import {
  ListBookingsApiV1BookingsGetResponseSchema,
  ListBookingsApiV1BookingsGetParamsSchema,
  GetBookingApiV1BookingsBookingIdGetResponseSchema,
  GetBookingApiV1BookingsBookingIdGetParamsSchema,
  ListHostBookingsApiV1BookingsHostListingsGetResponseSchema,
  ListHostBookingsApiV1BookingsHostListingsGetParamsSchema,
  CreateBookingApiV1BookingsPostResponseSchema,
  CreateBookingApiV1BookingsPostRequestSchema,
  CancelBookingApiV1BookingsBookingIdCancelPostResponseSchema,
  CancelBookingApiV1BookingsBookingIdCancelPostRequestSchema,
  CancelBookingApiV1BookingsBookingIdCancelPostParamsSchema,
  ConfirmBookingApiV1BookingsBookingIdConfirmPostResponseSchema,
  ConfirmBookingApiV1BookingsBookingIdConfirmPostParamsSchema,
  CompleteBookingApiV1BookingsBookingIdCompletePostResponseSchema,
  CompleteBookingApiV1BookingsBookingIdCompletePostParamsSchema
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
 * Optimized query hook for GET /api/v1/bookings
 * Features: Smart caching, error handling, type safety
 * @returns useQuery result with data of type z.infer<typeof ListBookingsApiV1BookingsGetResponseSchema>
 */
export function useListBookingsApiV1BookingsGet(skip?: number, limit?: number, status?: unknown, options?: { enabled?: boolean; suspense?: boolean; refetchInterval?: number; initialData?: z.infer<typeof ListBookingsApiV1BookingsGetResponseSchema> }) {
  const { initialData, ...restOptions } = options ?? {}

  return useQuery({
    queryKey: ['listBookingsApiV1BookingsGet', skip, limit, status],
    queryFn: async ({ signal }: { signal?: AbortSignal }) => {
      try {
        const result = await resolveActionResult<z.infer<typeof ListBookingsApiV1BookingsGetResponseSchema>>(listBookingsApiV1BookingsGet({ query: { skip, limit, status } }))
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
    placeholderData: (previousData: z.infer<typeof ListBookingsApiV1BookingsGetResponseSchema> | undefined) => previousData,
    retry: (failureCount: number, error: Error) => {
      // Don't retry on 4xx errors (client errors)
      if (error instanceof Error && error.message.includes('4')) return false
      // Retry up to 3 times for network/server errors
      return failureCount < 3
    },
    initialData: initialData as z.infer<typeof ListBookingsApiV1BookingsGetResponseSchema> | undefined,
    ...restOptions
  })
}

/**
 * Suspense version for /api/v1/bookings
 * @returns useSuspenseQuery result with data of type z.infer<typeof ListBookingsApiV1BookingsGetResponseSchema>
 */
export function useSuspenseListBookingsApiV1BookingsGet(skip?: number, limit?: number, status?: unknown, options?: { enabled?: boolean; suspense?: boolean; refetchInterval?: number; initialData?: z.infer<typeof ListBookingsApiV1BookingsGetResponseSchema> }) {
  const { initialData, ...restOptions } = options ?? {}

  return useSuspenseQuery({
    queryKey: ['listBookingsApiV1BookingsGet', skip, limit, status],
    queryFn: async () => {
      const result = await resolveActionResult<z.infer<typeof ListBookingsApiV1BookingsGetResponseSchema>>(listBookingsApiV1BookingsGet({ query: { skip, limit, status } }))
      return result
    },
    staleTime: 180000,
    initialData: initialData as z.infer<typeof ListBookingsApiV1BookingsGetResponseSchema> | undefined,
    ...restOptions
  })
}

/**
 * Optimized query hook for GET /api/v1/bookings/{booking_id}
 * Features: Smart caching, error handling, type safety
 * @returns useQuery result with data of type z.infer<typeof GetBookingApiV1BookingsBookingIdGetResponseSchema>
 */
export function useGetBookingApiV1BookingsBookingIdGet(booking_id: string, options?: { enabled?: boolean; suspense?: boolean; refetchInterval?: number; initialData?: z.infer<typeof GetBookingApiV1BookingsBookingIdGetResponseSchema> }) {
  const { initialData, ...restOptions } = options ?? {}

  return useQuery({
    queryKey: ['getBookingApiV1BookingsBookingIdGet', booking_id],
    queryFn: async ({ signal }: { signal?: AbortSignal }) => {
      try {
        const result = await resolveActionResult<z.infer<typeof GetBookingApiV1BookingsBookingIdGetResponseSchema>>(getBookingApiV1BookingsBookingIdGet({ path: { booking_id } }))
        return result
      } catch (error) {
        handleActionError(error)
      }
    },
    staleTime: 180000,
    gcTime: 360000, // React Query v5: gcTime replaces cacheTime
    enabled: !!booking_id && (options?.enabled ?? true),
    refetchOnWindowFocus: true, // Refetch when window regains focus
    refetchOnReconnect: true, // Refetch when network reconnects
    refetchOnMount: 'always', // Always refetch on mount for fresh data
    refetchInterval: options?.refetchInterval, // Optional polling interval
    // React Query v5: placeholderData replaces keepPreviousData
    placeholderData: (previousData: z.infer<typeof GetBookingApiV1BookingsBookingIdGetResponseSchema> | undefined) => previousData,
    retry: (failureCount: number, error: Error) => {
      // Don't retry on 4xx errors (client errors)
      if (error instanceof Error && error.message.includes('4')) return false
      // Retry up to 3 times for network/server errors
      return failureCount < 3
    },
    initialData: initialData as z.infer<typeof GetBookingApiV1BookingsBookingIdGetResponseSchema> | undefined,
    ...restOptions
  })
}

/**
 * Suspense version for /api/v1/bookings/{booking_id}
 * @returns useSuspenseQuery result with data of type z.infer<typeof GetBookingApiV1BookingsBookingIdGetResponseSchema>
 */
export function useSuspenseGetBookingApiV1BookingsBookingIdGet(booking_id: string, options?: { enabled?: boolean; suspense?: boolean; refetchInterval?: number; initialData?: z.infer<typeof GetBookingApiV1BookingsBookingIdGetResponseSchema> }) {
  const { initialData, ...restOptions } = options ?? {}

  return useSuspenseQuery({
    queryKey: ['getBookingApiV1BookingsBookingIdGet', booking_id],
    queryFn: async () => {
      const result = await resolveActionResult<z.infer<typeof GetBookingApiV1BookingsBookingIdGetResponseSchema>>(getBookingApiV1BookingsBookingIdGet({ path: { booking_id } }))
      return result
    },
    staleTime: 180000,
    initialData: initialData as z.infer<typeof GetBookingApiV1BookingsBookingIdGetResponseSchema> | undefined,
    ...restOptions
  })
}

/**
 * Optimized query hook for GET /api/v1/bookings/host/listings
 * Features: URL state sync, infinite loading, optimistic updates
 * @returns useQuery result with data of type z.infer<typeof ListHostBookingsApiV1BookingsHostListingsGetResponseSchema>
 */
export function useListHostBookingsApiV1BookingsHostListingsGet(skip?: number, limit?: number, status?: unknown, options?: { enabled?: boolean; suspense?: boolean; refetchInterval?: number; initialData?: z.infer<typeof ListHostBookingsApiV1BookingsHostListingsGetResponseSchema> }) {
  const [searchParams] = useQueryStates(searchParamsParser)
  const { initialData, ...restOptions } = options ?? {}
  
  return useQuery({
    queryKey: [...['listHostBookingsApiV1BookingsHostListingsGet', skip, limit, status], searchParams],
    queryFn: async ({ signal }: { signal?: AbortSignal }) => {
      try {
        // Build query params object with only the parameters the endpoint expects
        const queryParams: { skip?: number; limit?: number; status?: unknown } = {
          skip: skip !== undefined ? skip : undefined,
          limit: limit !== undefined ? limit : searchParams.limit,
          status: status !== undefined ? status : undefined
        }
        const result = await resolveActionResult<z.infer<typeof ListHostBookingsApiV1BookingsHostListingsGetResponseSchema>>(listHostBookingsApiV1BookingsHostListingsGet({ query: queryParams }))
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
    placeholderData: (previousData: z.infer<typeof ListHostBookingsApiV1BookingsHostListingsGetResponseSchema> | undefined) => previousData,
    retry: (failureCount: number, error: Error) => {
      // Don't retry on 4xx errors (client errors)
      if (error instanceof Error && error.message.includes('4')) return false
      // Retry up to 3 times for network/server errors
      return failureCount < 3
    },
    initialData: initialData as z.infer<typeof ListHostBookingsApiV1BookingsHostListingsGetResponseSchema> | undefined,
    ...restOptions
  })
}

/**
 * Infinite query version for paginated /api/v1/bookings/host/listings
 * @returns useInfiniteQuery result with data of type z.infer<typeof ListHostBookingsApiV1BookingsHostListingsGetResponseSchema>
 */
export function useInfiniteListHostBookingsApiV1BookingsHostListingsGet(skip?: number, limit?: number, status?: unknown, options?: { enabled?: boolean; suspense?: boolean; refetchInterval?: number; initialData?: z.infer<typeof ListHostBookingsApiV1BookingsHostListingsGetResponseSchema> }) {
  const [searchParams] = useQueryStates(searchParamsParser)
  const { initialData, ...restOptions } = options ?? {}

  return useInfiniteQuery({
    queryKey: [...['listHostBookingsApiV1BookingsHostListingsGet', skip, limit, status], 'infinite', searchParams],
    initialPageParam: 1,
    queryFn: async ({ pageParam = 1, signal }: { pageParam?: number; signal?: AbortSignal }) => {
      try {
        // Build query params object with only the parameters the endpoint expects
        const queryParams: { skip?: number; limit?: number; status?: unknown } = {
          skip: skip !== undefined ? skip : undefined,
          limit: limit !== undefined ? limit : searchParams.limit,
          status: status !== undefined ? status : undefined
        }
        const result = await resolveActionResult<z.infer<typeof ListHostBookingsApiV1BookingsHostListingsGetResponseSchema>>(listHostBookingsApiV1BookingsHostListingsGet({ query: queryParams }))
        return result
      } catch (error) {
        handleActionError(error)
      }
    },
    getNextPageParam: (lastPage: z.infer<typeof ListHostBookingsApiV1BookingsHostListingsGetResponseSchema>, allPages: z.infer<typeof ListHostBookingsApiV1BookingsHostListingsGetResponseSchema>[]) => {
      // Check if response has pagination metadata
      if (lastPage && typeof lastPage === 'object' && 'hasMore' in lastPage && (lastPage as any).hasMore) {
        return allPages.length + 1
      }
      // Fallback: check if array length matches limit (suggesting more pages)
      if (Array.isArray(lastPage) && lastPage.length === searchParams.limit) {
        return allPages.length + 1
      }
      // Check if response has total and we haven't loaded all items
      if (lastPage && typeof lastPage === 'object' && 'total' in lastPage && Array.isArray((lastPage as any).files || (lastPage as any).items || lastPage)) {
        const items = (lastPage as any).files || (lastPage as any).items || lastPage
        const total = (lastPage as any).total || 0
        const loaded = allPages.reduce((sum, page) => {
          const pageItems = (page as any)?.files || (page as any)?.items || (Array.isArray(page) ? page : [])
          return sum + (Array.isArray(pageItems) ? pageItems.length : 0)
        }, 0)
        if (loaded < total) {
          return allPages.length + 1
        }
      }
      return undefined
    },
    staleTime: 180000,
    gcTime: 360000,
    enabled: true && (options?.enabled ?? true),
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchOnMount: 'always',
    retry: 3,
    ...restOptions
  })
}

/**
 * Suspense version for /api/v1/bookings/host/listings - use in Server Components
 * @returns useSuspenseQuery result with data of type z.infer<typeof ListHostBookingsApiV1BookingsHostListingsGetResponseSchema>
 */
export function useSuspenseListHostBookingsApiV1BookingsHostListingsGet(skip?: number, limit?: number, status?: unknown, options?: { enabled?: boolean; suspense?: boolean; refetchInterval?: number; initialData?: z.infer<typeof ListHostBookingsApiV1BookingsHostListingsGetResponseSchema> }) {
  const { initialData, ...restOptions } = options ?? {}

  return useSuspenseQuery({
    queryKey: ['listHostBookingsApiV1BookingsHostListingsGet', skip, limit, status],
    queryFn: async () => {
      const result = await resolveActionResult<z.infer<typeof ListHostBookingsApiV1BookingsHostListingsGetResponseSchema>>(listHostBookingsApiV1BookingsHostListingsGet({ query: { skip, limit, status } }))
      return result
    },
    staleTime: 180000,
    initialData: initialData as z.infer<typeof ListHostBookingsApiV1BookingsHostListingsGetResponseSchema> | undefined,
    ...restOptions
  })
}

/**
 * Optimized mutation hook for POST /api/v1/bookings
 * Features: Optimistic updates, smart invalidation, error handling
 * @param options - Mutation options
 * @returns Mutation result with enhanced features
 */
export function useCreateBookingApiV1BookingsPostMutation(options?: {
  onSuccess?: (data: z.infer<typeof CreateBookingApiV1BookingsPostResponseSchema>, variables: z.infer<typeof CreateBookingApiV1BookingsPostRequestSchema>) => void
  onError?: (error: Error, variables: z.infer<typeof CreateBookingApiV1BookingsPostRequestSchema>) => void
  optimisticUpdate?: (variables: z.infer<typeof CreateBookingApiV1BookingsPostRequestSchema>) => unknown
  showToast?: boolean
}) {
  const queryClient = useQueryClient()
  const [isPending, startTransition] = useTransition()
  const [optimisticData, setOptimisticData] = useOptimistic<unknown, z.infer<typeof CreateBookingApiV1BookingsPostRequestSchema>>(null, (_, newData) => newData)

  const mutation = useMutation({
    mutationFn: async (variables: z.infer<typeof CreateBookingApiV1BookingsPostRequestSchema>): Promise<z.infer<typeof CreateBookingApiV1BookingsPostResponseSchema>> => {
      try {
        const result = await resolveActionResult<z.infer<typeof CreateBookingApiV1BookingsPostResponseSchema>>(createBookingApiV1BookingsPost(variables))
        return (result ?? ({} as z.infer<typeof CreateBookingApiV1BookingsPostResponseSchema>))
      } catch (error) {
        handleActionError(error)
      }
    },
    
    onMutate: async (variables: z.infer<typeof CreateBookingApiV1BookingsPostRequestSchema>) => {
      await Promise.all([
        queryClient.cancelQueries({ queryKey: ['listBookingsApiV1BookingsGet'] }),
        queryClient.cancelQueries({ queryKey: ['getBookingApiV1BookingsBookingIdGet'] }),
        queryClient.cancelQueries({ queryKey: ['listHostBookingsApiV1BookingsHostListingsGet'] })
      ])

      // Optimistic update (if provided)
      if (options?.optimisticUpdate) {
        const optimisticValue = options.optimisticUpdate(variables)
        setOptimisticData(optimisticValue as z.infer<typeof CreateBookingApiV1BookingsPostRequestSchema>)
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
    
    onError: (error: Error, variables: z.infer<typeof CreateBookingApiV1BookingsPostRequestSchema>) => {
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
        queryClient.invalidateQueries({ queryKey: ['listBookingsApiV1BookingsGet'] }),
        queryClient.invalidateQueries({ queryKey: ['getBookingApiV1BookingsBookingIdGet'] }),
        queryClient.invalidateQueries({ queryKey: ['listHostBookingsApiV1BookingsHostListingsGet'] }),
        queryClient.invalidateQueries({ queryKey: ['Bookings'] })
      ])
    }
  })

  return {
    ...mutation,
    mutateWithTransition: (variables: z.infer<typeof CreateBookingApiV1BookingsPostRequestSchema>) => {
      startTransition(() => {
        mutation.mutate(variables)
      })
    },
    isPending: isPending || mutation.isPending,
    optimisticData
  }
}

/**
 * Optimized mutation hook for POST /api/v1/bookings/{booking_id}/cancel
 * Features: Optimistic updates, smart invalidation, error handling
 * @param options - Mutation options
 * @returns Mutation result with enhanced features
 */
export function useCancelBookingApiV1BookingsBookingIdCancelPostMutation(options?: {
  onSuccess?: (data: z.infer<typeof CancelBookingApiV1BookingsBookingIdCancelPostResponseSchema>, variables: { body: z.infer<typeof CancelBookingApiV1BookingsBookingIdCancelPostRequestSchema>, params: z.infer<typeof CancelBookingApiV1BookingsBookingIdCancelPostParamsSchema> }) => void
  onError?: (error: Error, variables: { body: z.infer<typeof CancelBookingApiV1BookingsBookingIdCancelPostRequestSchema>, params: z.infer<typeof CancelBookingApiV1BookingsBookingIdCancelPostParamsSchema> }) => void
  optimisticUpdate?: (variables: { body: z.infer<typeof CancelBookingApiV1BookingsBookingIdCancelPostRequestSchema>, params: z.infer<typeof CancelBookingApiV1BookingsBookingIdCancelPostParamsSchema> }) => unknown
  showToast?: boolean
}) {
  const queryClient = useQueryClient()
  const [isPending, startTransition] = useTransition()
  const [optimisticData, setOptimisticData] = useOptimistic<unknown, { body: z.infer<typeof CancelBookingApiV1BookingsBookingIdCancelPostRequestSchema>, params: z.infer<typeof CancelBookingApiV1BookingsBookingIdCancelPostParamsSchema> }>(null, (_, newData) => newData)

  const mutation = useMutation({
    mutationFn: async (variables: { body: z.infer<typeof CancelBookingApiV1BookingsBookingIdCancelPostRequestSchema>, params: z.infer<typeof CancelBookingApiV1BookingsBookingIdCancelPostParamsSchema> }): Promise<z.infer<typeof CancelBookingApiV1BookingsBookingIdCancelPostResponseSchema>> => {
      try {
        const result = await resolveActionResult<z.infer<typeof CancelBookingApiV1BookingsBookingIdCancelPostResponseSchema>>(cancelBookingApiV1BookingsBookingIdCancelPost(variables))
        return (result ?? ({} as z.infer<typeof CancelBookingApiV1BookingsBookingIdCancelPostResponseSchema>))
      } catch (error) {
        handleActionError(error)
      }
    },
    
    onMutate: async (variables: { body: z.infer<typeof CancelBookingApiV1BookingsBookingIdCancelPostRequestSchema>, params: z.infer<typeof CancelBookingApiV1BookingsBookingIdCancelPostParamsSchema> }) => {
      await Promise.all([
        queryClient.cancelQueries({ queryKey: ['listBookingsApiV1BookingsGet'] }),
        queryClient.cancelQueries({ queryKey: ['getBookingApiV1BookingsBookingIdGet'] }),
        queryClient.cancelQueries({ queryKey: ['listHostBookingsApiV1BookingsHostListingsGet'] })
      ])

      // Optimistic update (if provided)
      if (options?.optimisticUpdate) {
        const optimisticValue = options.optimisticUpdate(variables)
        setOptimisticData(optimisticValue as { body: z.infer<typeof CancelBookingApiV1BookingsBookingIdCancelPostRequestSchema>, params: z.infer<typeof CancelBookingApiV1BookingsBookingIdCancelPostParamsSchema> })
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
    
    onError: (error: Error, variables: { body: z.infer<typeof CancelBookingApiV1BookingsBookingIdCancelPostRequestSchema>, params: z.infer<typeof CancelBookingApiV1BookingsBookingIdCancelPostParamsSchema> }) => {
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
        queryClient.invalidateQueries({ queryKey: ['listBookingsApiV1BookingsGet'] }),
        queryClient.invalidateQueries({ queryKey: ['getBookingApiV1BookingsBookingIdGet'] }),
        queryClient.invalidateQueries({ queryKey: ['listHostBookingsApiV1BookingsHostListingsGet'] }),
        queryClient.invalidateQueries({ queryKey: ['Bookings'] })
      ])
    }
  })

  return {
    ...mutation,
    mutateWithTransition: (variables: { body: z.infer<typeof CancelBookingApiV1BookingsBookingIdCancelPostRequestSchema>, params: z.infer<typeof CancelBookingApiV1BookingsBookingIdCancelPostParamsSchema> }) => {
      startTransition(() => {
        mutation.mutate(variables)
      })
    },
    isPending: isPending || mutation.isPending,
    optimisticData
  }
}

/**
 * Optimized mutation hook for POST /api/v1/bookings/{booking_id}/confirm
 * Features: Optimistic updates, smart invalidation, error handling
 * @param options - Mutation options
 * @returns Mutation result with enhanced features
 */
export function useConfirmBookingApiV1BookingsBookingIdConfirmPostMutation(options?: {
  onSuccess?: (data: z.infer<typeof ConfirmBookingApiV1BookingsBookingIdConfirmPostResponseSchema>, variables: z.infer<typeof ConfirmBookingApiV1BookingsBookingIdConfirmPostParamsSchema>) => void
  onError?: (error: Error, variables: z.infer<typeof ConfirmBookingApiV1BookingsBookingIdConfirmPostParamsSchema>) => void
  optimisticUpdate?: (variables: z.infer<typeof ConfirmBookingApiV1BookingsBookingIdConfirmPostParamsSchema>) => unknown
  showToast?: boolean
}) {
  const queryClient = useQueryClient()
  const [isPending, startTransition] = useTransition()
  const [optimisticData, setOptimisticData] = useOptimistic<unknown, z.infer<typeof ConfirmBookingApiV1BookingsBookingIdConfirmPostParamsSchema>>(null, (_, newData) => newData)

  const mutation = useMutation({
    mutationFn: async (variables: z.infer<typeof ConfirmBookingApiV1BookingsBookingIdConfirmPostParamsSchema>): Promise<z.infer<typeof ConfirmBookingApiV1BookingsBookingIdConfirmPostResponseSchema>> => {
      try {
        const result = await resolveActionResult<z.infer<typeof ConfirmBookingApiV1BookingsBookingIdConfirmPostResponseSchema>>(confirmBookingApiV1BookingsBookingIdConfirmPost(variables))
        return (result ?? ({} as z.infer<typeof ConfirmBookingApiV1BookingsBookingIdConfirmPostResponseSchema>))
      } catch (error) {
        handleActionError(error)
      }
    },
    
    onMutate: async (variables: z.infer<typeof ConfirmBookingApiV1BookingsBookingIdConfirmPostParamsSchema>) => {
      await Promise.all([
        queryClient.cancelQueries({ queryKey: ['listBookingsApiV1BookingsGet'] }),
        queryClient.cancelQueries({ queryKey: ['getBookingApiV1BookingsBookingIdGet'] }),
        queryClient.cancelQueries({ queryKey: ['listHostBookingsApiV1BookingsHostListingsGet'] })
      ])

      // Optimistic update (if provided)
      if (options?.optimisticUpdate) {
        const optimisticValue = options.optimisticUpdate(variables)
        setOptimisticData(optimisticValue as z.infer<typeof ConfirmBookingApiV1BookingsBookingIdConfirmPostParamsSchema>)
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
    
    onError: (error: Error, variables: z.infer<typeof ConfirmBookingApiV1BookingsBookingIdConfirmPostParamsSchema>) => {
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
        queryClient.invalidateQueries({ queryKey: ['listBookingsApiV1BookingsGet'] }),
        queryClient.invalidateQueries({ queryKey: ['getBookingApiV1BookingsBookingIdGet'] }),
        queryClient.invalidateQueries({ queryKey: ['listHostBookingsApiV1BookingsHostListingsGet'] }),
        queryClient.invalidateQueries({ queryKey: ['Bookings'] })
      ])
    }
  })

  return {
    ...mutation,
    mutateWithTransition: (variables: z.infer<typeof ConfirmBookingApiV1BookingsBookingIdConfirmPostParamsSchema>) => {
      startTransition(() => {
        mutation.mutate(variables)
      })
    },
    isPending: isPending || mutation.isPending,
    optimisticData
  }
}

/**
 * Optimized mutation hook for POST /api/v1/bookings/{booking_id}/complete
 * Features: Optimistic updates, smart invalidation, error handling
 * @param options - Mutation options
 * @returns Mutation result with enhanced features
 */
export function useCompleteBookingApiV1BookingsBookingIdCompletePostMutation(options?: {
  onSuccess?: (data: z.infer<typeof CompleteBookingApiV1BookingsBookingIdCompletePostResponseSchema>, variables: z.infer<typeof CompleteBookingApiV1BookingsBookingIdCompletePostParamsSchema>) => void
  onError?: (error: Error, variables: z.infer<typeof CompleteBookingApiV1BookingsBookingIdCompletePostParamsSchema>) => void
  optimisticUpdate?: (variables: z.infer<typeof CompleteBookingApiV1BookingsBookingIdCompletePostParamsSchema>) => unknown
  showToast?: boolean
}) {
  const queryClient = useQueryClient()
  const [isPending, startTransition] = useTransition()
  const [optimisticData, setOptimisticData] = useOptimistic<unknown, z.infer<typeof CompleteBookingApiV1BookingsBookingIdCompletePostParamsSchema>>(null, (_, newData) => newData)

  const mutation = useMutation({
    mutationFn: async (variables: z.infer<typeof CompleteBookingApiV1BookingsBookingIdCompletePostParamsSchema>): Promise<z.infer<typeof CompleteBookingApiV1BookingsBookingIdCompletePostResponseSchema>> => {
      try {
        const result = await resolveActionResult<z.infer<typeof CompleteBookingApiV1BookingsBookingIdCompletePostResponseSchema>>(completeBookingApiV1BookingsBookingIdCompletePost(variables))
        return (result ?? ({} as z.infer<typeof CompleteBookingApiV1BookingsBookingIdCompletePostResponseSchema>))
      } catch (error) {
        handleActionError(error)
      }
    },
    
    onMutate: async (variables: z.infer<typeof CompleteBookingApiV1BookingsBookingIdCompletePostParamsSchema>) => {
      await Promise.all([
        queryClient.cancelQueries({ queryKey: ['listBookingsApiV1BookingsGet'] }),
        queryClient.cancelQueries({ queryKey: ['getBookingApiV1BookingsBookingIdGet'] }),
        queryClient.cancelQueries({ queryKey: ['listHostBookingsApiV1BookingsHostListingsGet'] })
      ])

      // Optimistic update (if provided)
      if (options?.optimisticUpdate) {
        const optimisticValue = options.optimisticUpdate(variables)
        setOptimisticData(optimisticValue as z.infer<typeof CompleteBookingApiV1BookingsBookingIdCompletePostParamsSchema>)
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
    
    onError: (error: Error, variables: z.infer<typeof CompleteBookingApiV1BookingsBookingIdCompletePostParamsSchema>) => {
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
        queryClient.invalidateQueries({ queryKey: ['listBookingsApiV1BookingsGet'] }),
        queryClient.invalidateQueries({ queryKey: ['getBookingApiV1BookingsBookingIdGet'] }),
        queryClient.invalidateQueries({ queryKey: ['listHostBookingsApiV1BookingsHostListingsGet'] }),
        queryClient.invalidateQueries({ queryKey: ['Bookings'] })
      ])
    }
  })

  return {
    ...mutation,
    mutateWithTransition: (variables: z.infer<typeof CompleteBookingApiV1BookingsBookingIdCompletePostParamsSchema>) => {
      startTransition(() => {
        mutation.mutate(variables)
      })
    },
    isPending: isPending || mutation.isPending,
    optimisticData
  }
}