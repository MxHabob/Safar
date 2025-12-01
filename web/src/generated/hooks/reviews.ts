'use client'
import { useQuery, useQueryClient, useSuspenseQuery, useMutation, useInfiniteQuery } from '@tanstack/react-query'
import { useOptimistic, useTransition } from 'react'
import { parseAsInteger, parseAsString, useQueryStates } from 'nuqs'
import { toast } from 'sonner'
import { getListingReviewsApiV1ReviewsListingsListingIdGet, getReviewApiV1ReviewsReviewIdGet, createReviewApiV1ReviewsPost, createReviewResponseApiV1ReviewsReviewIdResponsePost, markReviewHelpfulApiV1ReviewsReviewIdHelpfulPost } from '@/generated/actions/reviews'
import {
  GetListingReviewsApiV1ReviewsListingsListingIdGetResponseSchema,
  GetListingReviewsApiV1ReviewsListingsListingIdGetParamsSchema,
  GetReviewApiV1ReviewsReviewIdGetResponseSchema,
  GetReviewApiV1ReviewsReviewIdGetParamsSchema,
  CreateReviewApiV1ReviewsPostResponseSchema,
  CreateReviewApiV1ReviewsPostRequestSchema,
  CreateReviewResponseApiV1ReviewsReviewIdResponsePostResponseSchema,
  CreateReviewResponseApiV1ReviewsReviewIdResponsePostRequestSchema,
  CreateReviewResponseApiV1ReviewsReviewIdResponsePostParamsSchema,
  MarkReviewHelpfulApiV1ReviewsReviewIdHelpfulPostResponseSchema,
  MarkReviewHelpfulApiV1ReviewsReviewIdHelpfulPostRequestSchema,
  MarkReviewHelpfulApiV1ReviewsReviewIdHelpfulPostParamsSchema
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
 * Optimized query hook for GET /api/v1/reviews/listings/{listing_id}
 * Features: URL state sync, infinite loading, optimistic updates
 * @returns useQuery result with data of type z.infer<typeof GetListingReviewsApiV1ReviewsListingsListingIdGetResponseSchema>
 */
export function useGetListingReviewsApiV1ReviewsListingsListingIdGet(listing_id: number, skip?: number, limit?: number, options?: { enabled?: boolean; suspense?: boolean; refetchInterval?: number; initialData?: z.infer<typeof GetListingReviewsApiV1ReviewsListingsListingIdGetResponseSchema> }) {
  const [searchParams] = useQueryStates(searchParamsParser)
  const { initialData, ...restOptions } = options ?? {}
  
  return useQuery({
    queryKey: [...['getListingReviewsApiV1ReviewsListingsListingIdGet', listing_id, skip, limit], searchParams],
    queryFn: async ({ signal }: { signal?: AbortSignal }) => {
      try {
        // Build query params object with only the parameters the endpoint expects
        const queryParams: { skip?: number; limit?: number } = {
          skip: skip !== undefined ? skip : undefined,
          limit: limit !== undefined ? limit : searchParams.limit
        }
        const result = await resolveActionResult<z.infer<typeof GetListingReviewsApiV1ReviewsListingsListingIdGetResponseSchema>>(getListingReviewsApiV1ReviewsListingsListingIdGet({ path: { listing_id }, query: queryParams }))
        return result
      } catch (error) {
        handleActionError(error)
      }
    },
    staleTime: 180000,
    gcTime: 360000, // React Query v5: gcTime replaces cacheTime
    enabled: !!listing_id && (options?.enabled ?? true),
    refetchOnWindowFocus: true, // Refetch when window regains focus
    refetchOnReconnect: true, // Refetch when network reconnects
    refetchOnMount: 'always', // Always refetch on mount for fresh data
    refetchInterval: options?.refetchInterval, // Optional polling interval
    // React Query v5: placeholderData replaces keepPreviousData
    placeholderData: (previousData: z.infer<typeof GetListingReviewsApiV1ReviewsListingsListingIdGetResponseSchema> | undefined) => previousData,
    retry: (failureCount: number, error: Error) => {
      // Don't retry on 4xx errors (client errors)
      if (error instanceof Error && error.message.includes('4')) return false
      // Retry up to 3 times for network/server errors
      return failureCount < 3
    },
    initialData: initialData as z.infer<typeof GetListingReviewsApiV1ReviewsListingsListingIdGetResponseSchema> | undefined,
    ...restOptions
  })
}

/**
 * Infinite query version for paginated /api/v1/reviews/listings/{listing_id}
 * @returns useInfiniteQuery result with data of type z.infer<typeof GetListingReviewsApiV1ReviewsListingsListingIdGetResponseSchema>
 */
export function useInfiniteGetListingReviewsApiV1ReviewsListingsListingIdGet(listing_id: number, skip?: number, limit?: number, options?: { enabled?: boolean; suspense?: boolean; refetchInterval?: number; initialData?: z.infer<typeof GetListingReviewsApiV1ReviewsListingsListingIdGetResponseSchema> }) {
  const [searchParams] = useQueryStates(searchParamsParser)
  const { initialData, ...restOptions } = options ?? {}

  return useInfiniteQuery({
    queryKey: [...['getListingReviewsApiV1ReviewsListingsListingIdGet', listing_id, skip, limit], 'infinite', searchParams],
    initialPageParam: 1,
    queryFn: async ({ pageParam = 1, signal }: { pageParam?: number; signal?: AbortSignal }) => {
      try {
        // Build query params object with only the parameters the endpoint expects
        const queryParams: { skip?: number; limit?: number } = {
          skip: skip !== undefined ? skip : undefined,
          limit: limit !== undefined ? limit : searchParams.limit
        }
        const result = await resolveActionResult<z.infer<typeof GetListingReviewsApiV1ReviewsListingsListingIdGetResponseSchema>>(getListingReviewsApiV1ReviewsListingsListingIdGet({ path: { listing_id }, query: queryParams }))
        return result
      } catch (error) {
        handleActionError(error)
      }
    },
    getNextPageParam: (lastPage: z.infer<typeof GetListingReviewsApiV1ReviewsListingsListingIdGetResponseSchema>, allPages: z.infer<typeof GetListingReviewsApiV1ReviewsListingsListingIdGetResponseSchema>[]) => {
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
    enabled: !!listing_id && (options?.enabled ?? true),
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchOnMount: 'always',
    retry: 3,
    ...restOptions
  })
}

/**
 * Suspense version for /api/v1/reviews/listings/{listing_id} - use in Server Components
 * @returns useSuspenseQuery result with data of type z.infer<typeof GetListingReviewsApiV1ReviewsListingsListingIdGetResponseSchema>
 */
export function useSuspenseGetListingReviewsApiV1ReviewsListingsListingIdGet(listing_id: number, skip?: number, limit?: number, options?: { enabled?: boolean; suspense?: boolean; refetchInterval?: number; initialData?: z.infer<typeof GetListingReviewsApiV1ReviewsListingsListingIdGetResponseSchema> }) {
  const { initialData, ...restOptions } = options ?? {}

  return useSuspenseQuery({
    queryKey: ['getListingReviewsApiV1ReviewsListingsListingIdGet', listing_id, skip, limit],
    queryFn: async () => {
      const result = await resolveActionResult<z.infer<typeof GetListingReviewsApiV1ReviewsListingsListingIdGetResponseSchema>>(getListingReviewsApiV1ReviewsListingsListingIdGet({ path: { listing_id }, query: { skip, limit } }))
      return result
    },
    staleTime: 180000,
    initialData: initialData as z.infer<typeof GetListingReviewsApiV1ReviewsListingsListingIdGetResponseSchema> | undefined,
    ...restOptions
  })
}

/**
 * Optimized query hook for GET /api/v1/reviews/{review_id}
 * Features: Smart caching, error handling, type safety
 * @returns useQuery result with data of type z.infer<typeof GetReviewApiV1ReviewsReviewIdGetResponseSchema>
 */
export function useGetReviewApiV1ReviewsReviewIdGet(review_id: number, options?: { enabled?: boolean; suspense?: boolean; refetchInterval?: number; initialData?: z.infer<typeof GetReviewApiV1ReviewsReviewIdGetResponseSchema> }) {
  const { initialData, ...restOptions } = options ?? {}

  return useQuery({
    queryKey: ['getReviewApiV1ReviewsReviewIdGet', review_id],
    queryFn: async ({ signal }: { signal?: AbortSignal }) => {
      try {
        const result = await resolveActionResult<z.infer<typeof GetReviewApiV1ReviewsReviewIdGetResponseSchema>>(getReviewApiV1ReviewsReviewIdGet({ path: { review_id } }))
        return result
      } catch (error) {
        handleActionError(error)
      }
    },
    staleTime: 180000,
    gcTime: 360000, // React Query v5: gcTime replaces cacheTime
    enabled: !!review_id && (options?.enabled ?? true),
    refetchOnWindowFocus: true, // Refetch when window regains focus
    refetchOnReconnect: true, // Refetch when network reconnects
    refetchOnMount: 'always', // Always refetch on mount for fresh data
    refetchInterval: options?.refetchInterval, // Optional polling interval
    // React Query v5: placeholderData replaces keepPreviousData
    placeholderData: (previousData: z.infer<typeof GetReviewApiV1ReviewsReviewIdGetResponseSchema> | undefined) => previousData,
    retry: (failureCount: number, error: Error) => {
      // Don't retry on 4xx errors (client errors)
      if (error instanceof Error && error.message.includes('4')) return false
      // Retry up to 3 times for network/server errors
      return failureCount < 3
    },
    initialData: initialData as z.infer<typeof GetReviewApiV1ReviewsReviewIdGetResponseSchema> | undefined,
    ...restOptions
  })
}

/**
 * Suspense version for /api/v1/reviews/{review_id}
 * @returns useSuspenseQuery result with data of type z.infer<typeof GetReviewApiV1ReviewsReviewIdGetResponseSchema>
 */
export function useSuspenseGetReviewApiV1ReviewsReviewIdGet(review_id: number, options?: { enabled?: boolean; suspense?: boolean; refetchInterval?: number; initialData?: z.infer<typeof GetReviewApiV1ReviewsReviewIdGetResponseSchema> }) {
  const { initialData, ...restOptions } = options ?? {}

  return useSuspenseQuery({
    queryKey: ['getReviewApiV1ReviewsReviewIdGet', review_id],
    queryFn: async () => {
      const result = await resolveActionResult<z.infer<typeof GetReviewApiV1ReviewsReviewIdGetResponseSchema>>(getReviewApiV1ReviewsReviewIdGet({ path: { review_id } }))
      return result
    },
    staleTime: 180000,
    initialData: initialData as z.infer<typeof GetReviewApiV1ReviewsReviewIdGetResponseSchema> | undefined,
    ...restOptions
  })
}

/**
 * Optimized mutation hook for POST /api/v1/reviews
 * Features: Optimistic updates, smart invalidation, error handling
 * @param options - Mutation options
 * @returns Mutation result with enhanced features
 */
export function useCreateReviewApiV1ReviewsPostMutation(options?: {
  onSuccess?: (data: z.infer<typeof CreateReviewApiV1ReviewsPostResponseSchema>, variables: z.infer<typeof CreateReviewApiV1ReviewsPostRequestSchema>) => void
  onError?: (error: Error, variables: z.infer<typeof CreateReviewApiV1ReviewsPostRequestSchema>) => void
  optimisticUpdate?: (variables: z.infer<typeof CreateReviewApiV1ReviewsPostRequestSchema>) => unknown
  showToast?: boolean
}) {
  const queryClient = useQueryClient()
  const [isPending, startTransition] = useTransition()
  const [optimisticData, setOptimisticData] = useOptimistic<unknown, z.infer<typeof CreateReviewApiV1ReviewsPostRequestSchema>>(null, (_, newData) => newData)

  const mutation = useMutation({
    mutationFn: async (variables: z.infer<typeof CreateReviewApiV1ReviewsPostRequestSchema>): Promise<z.infer<typeof CreateReviewApiV1ReviewsPostResponseSchema>> => {
      try {
        const result = await resolveActionResult<z.infer<typeof CreateReviewApiV1ReviewsPostResponseSchema>>(createReviewApiV1ReviewsPost(variables))
        return (result ?? ({} as z.infer<typeof CreateReviewApiV1ReviewsPostResponseSchema>))
      } catch (error) {
        handleActionError(error)
      }
    },
    
    onMutate: async (variables: z.infer<typeof CreateReviewApiV1ReviewsPostRequestSchema>) => {
      await Promise.all([
        queryClient.cancelQueries({ queryKey: ['getListingReviewsApiV1ReviewsListingsListingIdGet'] }),
        queryClient.cancelQueries({ queryKey: ['getReviewApiV1ReviewsReviewIdGet'] })
      ])

      // Optimistic update (if provided)
      if (options?.optimisticUpdate) {
        const optimisticValue = options.optimisticUpdate(variables)
        setOptimisticData(optimisticValue as z.infer<typeof CreateReviewApiV1ReviewsPostRequestSchema>)
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
    
    onError: (error: Error, variables: z.infer<typeof CreateReviewApiV1ReviewsPostRequestSchema>) => {
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
        queryClient.invalidateQueries({ queryKey: ['getListingReviewsApiV1ReviewsListingsListingIdGet'] }),
        queryClient.invalidateQueries({ queryKey: ['getReviewApiV1ReviewsReviewIdGet'] }),
        queryClient.invalidateQueries({ queryKey: ['Reviews'] })
      ])
    }
  })

  return {
    ...mutation,
    mutateWithTransition: (variables: z.infer<typeof CreateReviewApiV1ReviewsPostRequestSchema>) => {
      startTransition(() => {
        mutation.mutate(variables)
      })
    },
    isPending: isPending || mutation.isPending,
    optimisticData
  }
}

/**
 * Optimized mutation hook for POST /api/v1/reviews/{review_id}/response
 * Features: Optimistic updates, smart invalidation, error handling
 * @param options - Mutation options
 * @returns Mutation result with enhanced features
 */
export function useCreateReviewResponseApiV1ReviewsReviewIdResponsePostMutation(options?: {
  onSuccess?: (data: z.infer<typeof CreateReviewResponseApiV1ReviewsReviewIdResponsePostResponseSchema>, variables: { body: z.infer<typeof CreateReviewResponseApiV1ReviewsReviewIdResponsePostRequestSchema>, params: z.infer<typeof CreateReviewResponseApiV1ReviewsReviewIdResponsePostParamsSchema> }) => void
  onError?: (error: Error, variables: { body: z.infer<typeof CreateReviewResponseApiV1ReviewsReviewIdResponsePostRequestSchema>, params: z.infer<typeof CreateReviewResponseApiV1ReviewsReviewIdResponsePostParamsSchema> }) => void
  optimisticUpdate?: (variables: { body: z.infer<typeof CreateReviewResponseApiV1ReviewsReviewIdResponsePostRequestSchema>, params: z.infer<typeof CreateReviewResponseApiV1ReviewsReviewIdResponsePostParamsSchema> }) => unknown
  showToast?: boolean
}) {
  const queryClient = useQueryClient()
  const [isPending, startTransition] = useTransition()
  const [optimisticData, setOptimisticData] = useOptimistic<unknown, { body: z.infer<typeof CreateReviewResponseApiV1ReviewsReviewIdResponsePostRequestSchema>, params: z.infer<typeof CreateReviewResponseApiV1ReviewsReviewIdResponsePostParamsSchema> }>(null, (_, newData) => newData)

  const mutation = useMutation({
    mutationFn: async (variables: { body: z.infer<typeof CreateReviewResponseApiV1ReviewsReviewIdResponsePostRequestSchema>, params: z.infer<typeof CreateReviewResponseApiV1ReviewsReviewIdResponsePostParamsSchema> }): Promise<z.infer<typeof CreateReviewResponseApiV1ReviewsReviewIdResponsePostResponseSchema>> => {
      try {
        const result = await resolveActionResult<z.infer<typeof CreateReviewResponseApiV1ReviewsReviewIdResponsePostResponseSchema>>(createReviewResponseApiV1ReviewsReviewIdResponsePost(variables))
        return (result ?? ({} as z.infer<typeof CreateReviewResponseApiV1ReviewsReviewIdResponsePostResponseSchema>))
      } catch (error) {
        handleActionError(error)
      }
    },
    
    onMutate: async (variables: { body: z.infer<typeof CreateReviewResponseApiV1ReviewsReviewIdResponsePostRequestSchema>, params: z.infer<typeof CreateReviewResponseApiV1ReviewsReviewIdResponsePostParamsSchema> }) => {
      await Promise.all([
        queryClient.cancelQueries({ queryKey: ['getListingReviewsApiV1ReviewsListingsListingIdGet'] }),
        queryClient.cancelQueries({ queryKey: ['getReviewApiV1ReviewsReviewIdGet'] })
      ])

      // Optimistic update (if provided)
      if (options?.optimisticUpdate) {
        const optimisticValue = options.optimisticUpdate(variables)
        setOptimisticData(optimisticValue as { body: z.infer<typeof CreateReviewResponseApiV1ReviewsReviewIdResponsePostRequestSchema>, params: z.infer<typeof CreateReviewResponseApiV1ReviewsReviewIdResponsePostParamsSchema> })
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
    
    onError: (error: Error, variables: { body: z.infer<typeof CreateReviewResponseApiV1ReviewsReviewIdResponsePostRequestSchema>, params: z.infer<typeof CreateReviewResponseApiV1ReviewsReviewIdResponsePostParamsSchema> }) => {
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
        queryClient.invalidateQueries({ queryKey: ['getListingReviewsApiV1ReviewsListingsListingIdGet'] }),
        queryClient.invalidateQueries({ queryKey: ['getReviewApiV1ReviewsReviewIdGet'] }),
        queryClient.invalidateQueries({ queryKey: ['Reviews'] })
      ])
    }
  })

  return {
    ...mutation,
    mutateWithTransition: (variables: { body: z.infer<typeof CreateReviewResponseApiV1ReviewsReviewIdResponsePostRequestSchema>, params: z.infer<typeof CreateReviewResponseApiV1ReviewsReviewIdResponsePostParamsSchema> }) => {
      startTransition(() => {
        mutation.mutate(variables)
      })
    },
    isPending: isPending || mutation.isPending,
    optimisticData
  }
}

/**
 * Optimized mutation hook for POST /api/v1/reviews/{review_id}/helpful
 * Features: Optimistic updates, smart invalidation, error handling
 * @param options - Mutation options
 * @returns Mutation result with enhanced features
 */
export function useMarkReviewHelpfulApiV1ReviewsReviewIdHelpfulPostMutation(options?: {
  onSuccess?: (data: z.infer<typeof MarkReviewHelpfulApiV1ReviewsReviewIdHelpfulPostResponseSchema>, variables: { body: z.infer<typeof MarkReviewHelpfulApiV1ReviewsReviewIdHelpfulPostRequestSchema>, params: z.infer<typeof MarkReviewHelpfulApiV1ReviewsReviewIdHelpfulPostParamsSchema> }) => void
  onError?: (error: Error, variables: { body: z.infer<typeof MarkReviewHelpfulApiV1ReviewsReviewIdHelpfulPostRequestSchema>, params: z.infer<typeof MarkReviewHelpfulApiV1ReviewsReviewIdHelpfulPostParamsSchema> }) => void
  optimisticUpdate?: (variables: { body: z.infer<typeof MarkReviewHelpfulApiV1ReviewsReviewIdHelpfulPostRequestSchema>, params: z.infer<typeof MarkReviewHelpfulApiV1ReviewsReviewIdHelpfulPostParamsSchema> }) => unknown
  showToast?: boolean
}) {
  const queryClient = useQueryClient()
  const [isPending, startTransition] = useTransition()
  const [optimisticData, setOptimisticData] = useOptimistic<unknown, { body: z.infer<typeof MarkReviewHelpfulApiV1ReviewsReviewIdHelpfulPostRequestSchema>, params: z.infer<typeof MarkReviewHelpfulApiV1ReviewsReviewIdHelpfulPostParamsSchema> }>(null, (_, newData) => newData)

  const mutation = useMutation({
    mutationFn: async (variables: { body: z.infer<typeof MarkReviewHelpfulApiV1ReviewsReviewIdHelpfulPostRequestSchema>, params: z.infer<typeof MarkReviewHelpfulApiV1ReviewsReviewIdHelpfulPostParamsSchema> }): Promise<z.infer<typeof MarkReviewHelpfulApiV1ReviewsReviewIdHelpfulPostResponseSchema>> => {
      try {
        const result = await resolveActionResult<z.infer<typeof MarkReviewHelpfulApiV1ReviewsReviewIdHelpfulPostResponseSchema>>(markReviewHelpfulApiV1ReviewsReviewIdHelpfulPost(variables))
        return (result ?? ({} as z.infer<typeof MarkReviewHelpfulApiV1ReviewsReviewIdHelpfulPostResponseSchema>))
      } catch (error) {
        handleActionError(error)
      }
    },
    
    onMutate: async (variables: { body: z.infer<typeof MarkReviewHelpfulApiV1ReviewsReviewIdHelpfulPostRequestSchema>, params: z.infer<typeof MarkReviewHelpfulApiV1ReviewsReviewIdHelpfulPostParamsSchema> }) => {
      await Promise.all([
        queryClient.cancelQueries({ queryKey: ['getListingReviewsApiV1ReviewsListingsListingIdGet'] }),
        queryClient.cancelQueries({ queryKey: ['getReviewApiV1ReviewsReviewIdGet'] })
      ])

      // Optimistic update (if provided)
      if (options?.optimisticUpdate) {
        const optimisticValue = options.optimisticUpdate(variables)
        setOptimisticData(optimisticValue as { body: z.infer<typeof MarkReviewHelpfulApiV1ReviewsReviewIdHelpfulPostRequestSchema>, params: z.infer<typeof MarkReviewHelpfulApiV1ReviewsReviewIdHelpfulPostParamsSchema> })
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
    
    onError: (error: Error, variables: { body: z.infer<typeof MarkReviewHelpfulApiV1ReviewsReviewIdHelpfulPostRequestSchema>, params: z.infer<typeof MarkReviewHelpfulApiV1ReviewsReviewIdHelpfulPostParamsSchema> }) => {
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
        queryClient.invalidateQueries({ queryKey: ['getListingReviewsApiV1ReviewsListingsListingIdGet'] }),
        queryClient.invalidateQueries({ queryKey: ['getReviewApiV1ReviewsReviewIdGet'] }),
        queryClient.invalidateQueries({ queryKey: ['Reviews'] })
      ])
    }
  })

  return {
    ...mutation,
    mutateWithTransition: (variables: { body: z.infer<typeof MarkReviewHelpfulApiV1ReviewsReviewIdHelpfulPostRequestSchema>, params: z.infer<typeof MarkReviewHelpfulApiV1ReviewsReviewIdHelpfulPostParamsSchema> }) => {
      startTransition(() => {
        mutation.mutate(variables)
      })
    },
    isPending: isPending || mutation.isPending,
    optimisticData
  }
}