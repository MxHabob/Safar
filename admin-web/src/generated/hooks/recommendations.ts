'use client'
import { useQuery, useQueryClient, useSuspenseQuery, useMutation, useInfiniteQuery } from '@tanstack/react-query'
import { useOptimistic, useTransition } from 'react'
import { parseAsInteger, parseAsString, useQueryStates } from 'nuqs'
import { toast } from 'sonner'
import { getMyRecommendationsApiV1RecommendationsForMeGet, getSimilarListingsApiV1RecommendationsSimilarListingIdGet, getTrendingListingsApiV1RecommendationsTrendingGet, getMlRecommendationsApiV1RecommendationsMlForMeGet, explainRecommendationApiV1RecommendationsMlExplainListingIdGet, trainRecommendationModelApiV1RecommendationsMlTrainPost } from '@/generated/actions/recommendations'
import {
  GetMyRecommendationsApiV1RecommendationsForMeGetResponseSchema,
  GetMyRecommendationsApiV1RecommendationsForMeGetParamsSchema,
  GetSimilarListingsApiV1RecommendationsSimilarListingIdGetResponseSchema,
  GetSimilarListingsApiV1RecommendationsSimilarListingIdGetParamsSchema,
  GetTrendingListingsApiV1RecommendationsTrendingGetResponseSchema,
  GetTrendingListingsApiV1RecommendationsTrendingGetParamsSchema,
  GetMlRecommendationsApiV1RecommendationsMlForMeGetResponseSchema,
  GetMlRecommendationsApiV1RecommendationsMlForMeGetParamsSchema,
  ExplainRecommendationApiV1RecommendationsMlExplainListingIdGetResponseSchema,
  ExplainRecommendationApiV1RecommendationsMlExplainListingIdGetParamsSchema,
  TrainRecommendationModelApiV1RecommendationsMlTrainPostResponseSchema,
  TrainRecommendationModelApiV1RecommendationsMlTrainPostParamsSchema
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
 * Optimized query hook for GET /api/v1/recommendations/for-me
 * Features: Smart caching, error handling, type safety
 * @returns useQuery result with data of type z.infer<typeof GetMyRecommendationsApiV1RecommendationsForMeGetResponseSchema>
 */
export function useGetMyRecommendationsApiV1RecommendationsForMeGet(limit?: number, options?: { enabled?: boolean; suspense?: boolean; refetchInterval?: number; initialData?: z.infer<typeof GetMyRecommendationsApiV1RecommendationsForMeGetResponseSchema> }) {
  const { initialData, ...restOptions } = options ?? {}

  return useQuery({
    queryKey: ['getMyRecommendationsApiV1RecommendationsForMeGet', limit],
    queryFn: async ({ signal }: { signal?: AbortSignal }) => {
      try {
        const result = await resolveActionResult<z.infer<typeof GetMyRecommendationsApiV1RecommendationsForMeGetResponseSchema>>(getMyRecommendationsApiV1RecommendationsForMeGet({ query: { limit } }))
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
    placeholderData: (previousData: z.infer<typeof GetMyRecommendationsApiV1RecommendationsForMeGetResponseSchema> | undefined) => previousData,
    retry: (failureCount: number, error: Error) => {
      // Don't retry on 4xx errors (client errors)
      if (error instanceof Error && error.message.includes('4')) return false
      // Retry up to 3 times for network/server errors
      return failureCount < 3
    },
    initialData: initialData as z.infer<typeof GetMyRecommendationsApiV1RecommendationsForMeGetResponseSchema> | undefined,
    ...restOptions
  })
}

/**
 * Suspense version for /api/v1/recommendations/for-me
 * @returns useSuspenseQuery result with data of type z.infer<typeof GetMyRecommendationsApiV1RecommendationsForMeGetResponseSchema>
 */
export function useSuspenseGetMyRecommendationsApiV1RecommendationsForMeGet(limit?: number, options?: { enabled?: boolean; suspense?: boolean; refetchInterval?: number; initialData?: z.infer<typeof GetMyRecommendationsApiV1RecommendationsForMeGetResponseSchema> }) {
  const { initialData, ...restOptions } = options ?? {}

  return useSuspenseQuery({
    queryKey: ['getMyRecommendationsApiV1RecommendationsForMeGet', limit],
    queryFn: async () => {
      const result = await resolveActionResult<z.infer<typeof GetMyRecommendationsApiV1RecommendationsForMeGetResponseSchema>>(getMyRecommendationsApiV1RecommendationsForMeGet({ query: { limit } }))
      return result
    },
    staleTime: 180000,
    initialData: initialData as z.infer<typeof GetMyRecommendationsApiV1RecommendationsForMeGetResponseSchema> | undefined,
    ...restOptions
  })
}

/**
 * Optimized query hook for GET /api/v1/recommendations/similar/{listing_id}
 * Features: URL state sync, infinite loading, optimistic updates
 * @returns useQuery result with data of type z.infer<typeof GetSimilarListingsApiV1RecommendationsSimilarListingIdGetResponseSchema>
 */
export function useGetSimilarListingsApiV1RecommendationsSimilarListingIdGet(listing_id: string, limit?: number, options?: { enabled?: boolean; suspense?: boolean; refetchInterval?: number; initialData?: z.infer<typeof GetSimilarListingsApiV1RecommendationsSimilarListingIdGetResponseSchema> }) {
  const [searchParams] = useQueryStates(searchParamsParser)
  const { initialData, ...restOptions } = options ?? {}
  
  return useQuery({
    queryKey: [...['getSimilarListingsApiV1RecommendationsSimilarListingIdGet', listing_id, limit], searchParams],
    queryFn: async ({ signal }: { signal?: AbortSignal }) => {
      try {
        // Build query params object with only the parameters the endpoint expects
        const queryParams: { limit?: number } = {
          limit: limit !== undefined ? limit : searchParams.limit
        }
        const result = await resolveActionResult<z.infer<typeof GetSimilarListingsApiV1RecommendationsSimilarListingIdGetResponseSchema>>(getSimilarListingsApiV1RecommendationsSimilarListingIdGet({ path: { listing_id }, query: queryParams }))
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
    placeholderData: (previousData: z.infer<typeof GetSimilarListingsApiV1RecommendationsSimilarListingIdGetResponseSchema> | undefined) => previousData,
    retry: (failureCount: number, error: Error) => {
      // Don't retry on 4xx errors (client errors)
      if (error instanceof Error && error.message.includes('4')) return false
      // Retry up to 3 times for network/server errors
      return failureCount < 3
    },
    initialData: initialData as z.infer<typeof GetSimilarListingsApiV1RecommendationsSimilarListingIdGetResponseSchema> | undefined,
    ...restOptions
  })
}

/**
 * Infinite query version for paginated /api/v1/recommendations/similar/{listing_id}
 * @returns useInfiniteQuery result with data of type z.infer<typeof GetSimilarListingsApiV1RecommendationsSimilarListingIdGetResponseSchema>
 */
export function useInfiniteGetSimilarListingsApiV1RecommendationsSimilarListingIdGet(listing_id: string, limit?: number, options?: { enabled?: boolean; suspense?: boolean; refetchInterval?: number; initialData?: z.infer<typeof GetSimilarListingsApiV1RecommendationsSimilarListingIdGetResponseSchema> }) {
  const [searchParams] = useQueryStates(searchParamsParser)
  const { initialData, ...restOptions } = options ?? {}

  return useInfiniteQuery({
    queryKey: [...['getSimilarListingsApiV1RecommendationsSimilarListingIdGet', listing_id, limit], 'infinite', searchParams],
    initialPageParam: 1,
    queryFn: async ({ pageParam = 1, signal }: { pageParam?: number; signal?: AbortSignal }) => {
      try {
        // Build query params object with only the parameters the endpoint expects
        const queryParams: { limit?: number } = {
          limit: limit !== undefined ? limit : searchParams.limit
        }
        const result = await resolveActionResult<z.infer<typeof GetSimilarListingsApiV1RecommendationsSimilarListingIdGetResponseSchema>>(getSimilarListingsApiV1RecommendationsSimilarListingIdGet({ path: { listing_id }, query: queryParams }))
        return result
      } catch (error) {
        handleActionError(error)
      }
    },
    getNextPageParam: (lastPage: z.infer<typeof GetSimilarListingsApiV1RecommendationsSimilarListingIdGetResponseSchema>, allPages: z.infer<typeof GetSimilarListingsApiV1RecommendationsSimilarListingIdGetResponseSchema>[]) => {
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
 * Suspense version for /api/v1/recommendations/similar/{listing_id} - use in Server Components
 * @returns useSuspenseQuery result with data of type z.infer<typeof GetSimilarListingsApiV1RecommendationsSimilarListingIdGetResponseSchema>
 */
export function useSuspenseGetSimilarListingsApiV1RecommendationsSimilarListingIdGet(listing_id: string, limit?: number, options?: { enabled?: boolean; suspense?: boolean; refetchInterval?: number; initialData?: z.infer<typeof GetSimilarListingsApiV1RecommendationsSimilarListingIdGetResponseSchema> }) {
  const { initialData, ...restOptions } = options ?? {}

  return useSuspenseQuery({
    queryKey: ['getSimilarListingsApiV1RecommendationsSimilarListingIdGet', listing_id, limit],
    queryFn: async () => {
      const result = await resolveActionResult<z.infer<typeof GetSimilarListingsApiV1RecommendationsSimilarListingIdGetResponseSchema>>(getSimilarListingsApiV1RecommendationsSimilarListingIdGet({ path: { listing_id }, query: { limit } }))
      return result
    },
    staleTime: 180000,
    initialData: initialData as z.infer<typeof GetSimilarListingsApiV1RecommendationsSimilarListingIdGetResponseSchema> | undefined,
    ...restOptions
  })
}

/**
 * Optimized query hook for GET /api/v1/recommendations/trending
 * Features: Smart caching, error handling, type safety
 * @returns useQuery result with data of type z.infer<typeof GetTrendingListingsApiV1RecommendationsTrendingGetResponseSchema>
 */
export function useGetTrendingListingsApiV1RecommendationsTrendingGet(limit?: number, days?: number, options?: { enabled?: boolean; suspense?: boolean; refetchInterval?: number; initialData?: z.infer<typeof GetTrendingListingsApiV1RecommendationsTrendingGetResponseSchema> }) {
  const { initialData, ...restOptions } = options ?? {}

  return useQuery({
    queryKey: ['getTrendingListingsApiV1RecommendationsTrendingGet', limit, days],
    queryFn: async ({ signal }: { signal?: AbortSignal }) => {
      try {
        const result = await resolveActionResult<z.infer<typeof GetTrendingListingsApiV1RecommendationsTrendingGetResponseSchema>>(getTrendingListingsApiV1RecommendationsTrendingGet({ query: { limit, days } }))
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
    placeholderData: (previousData: z.infer<typeof GetTrendingListingsApiV1RecommendationsTrendingGetResponseSchema> | undefined) => previousData,
    retry: (failureCount: number, error: Error) => {
      // Don't retry on 4xx errors (client errors)
      if (error instanceof Error && error.message.includes('4')) return false
      // Retry up to 3 times for network/server errors
      return failureCount < 3
    },
    initialData: initialData as z.infer<typeof GetTrendingListingsApiV1RecommendationsTrendingGetResponseSchema> | undefined,
    ...restOptions
  })
}

/**
 * Suspense version for /api/v1/recommendations/trending
 * @returns useSuspenseQuery result with data of type z.infer<typeof GetTrendingListingsApiV1RecommendationsTrendingGetResponseSchema>
 */
export function useSuspenseGetTrendingListingsApiV1RecommendationsTrendingGet(limit?: number, days?: number, options?: { enabled?: boolean; suspense?: boolean; refetchInterval?: number; initialData?: z.infer<typeof GetTrendingListingsApiV1RecommendationsTrendingGetResponseSchema> }) {
  const { initialData, ...restOptions } = options ?? {}

  return useSuspenseQuery({
    queryKey: ['getTrendingListingsApiV1RecommendationsTrendingGet', limit, days],
    queryFn: async () => {
      const result = await resolveActionResult<z.infer<typeof GetTrendingListingsApiV1RecommendationsTrendingGetResponseSchema>>(getTrendingListingsApiV1RecommendationsTrendingGet({ query: { limit, days } }))
      return result
    },
    staleTime: 180000,
    initialData: initialData as z.infer<typeof GetTrendingListingsApiV1RecommendationsTrendingGetResponseSchema> | undefined,
    ...restOptions
  })
}

/**
 * Optimized query hook for GET /api/v1/recommendations/ml/for-me
 * Features: Smart caching, error handling, type safety
 * @returns useQuery result with data of type z.infer<typeof GetMlRecommendationsApiV1RecommendationsMlForMeGetResponseSchema>
 */
export function useGetMlRecommendationsApiV1RecommendationsMlForMeGet(limit?: number, algorithm?: string, options?: { enabled?: boolean; suspense?: boolean; refetchInterval?: number; initialData?: z.infer<typeof GetMlRecommendationsApiV1RecommendationsMlForMeGetResponseSchema> }) {
  const { initialData, ...restOptions } = options ?? {}

  return useQuery({
    queryKey: ['getMlRecommendationsApiV1RecommendationsMlForMeGet', limit, algorithm],
    queryFn: async ({ signal }: { signal?: AbortSignal }) => {
      try {
        const result = await resolveActionResult<z.infer<typeof GetMlRecommendationsApiV1RecommendationsMlForMeGetResponseSchema>>(getMlRecommendationsApiV1RecommendationsMlForMeGet({ query: { limit, algorithm } }))
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
    placeholderData: (previousData: z.infer<typeof GetMlRecommendationsApiV1RecommendationsMlForMeGetResponseSchema> | undefined) => previousData,
    retry: (failureCount: number, error: Error) => {
      // Don't retry on 4xx errors (client errors)
      if (error instanceof Error && error.message.includes('4')) return false
      // Retry up to 3 times for network/server errors
      return failureCount < 3
    },
    initialData: initialData as z.infer<typeof GetMlRecommendationsApiV1RecommendationsMlForMeGetResponseSchema> | undefined,
    ...restOptions
  })
}

/**
 * Suspense version for /api/v1/recommendations/ml/for-me
 * @returns useSuspenseQuery result with data of type z.infer<typeof GetMlRecommendationsApiV1RecommendationsMlForMeGetResponseSchema>
 */
export function useSuspenseGetMlRecommendationsApiV1RecommendationsMlForMeGet(limit?: number, algorithm?: string, options?: { enabled?: boolean; suspense?: boolean; refetchInterval?: number; initialData?: z.infer<typeof GetMlRecommendationsApiV1RecommendationsMlForMeGetResponseSchema> }) {
  const { initialData, ...restOptions } = options ?? {}

  return useSuspenseQuery({
    queryKey: ['getMlRecommendationsApiV1RecommendationsMlForMeGet', limit, algorithm],
    queryFn: async () => {
      const result = await resolveActionResult<z.infer<typeof GetMlRecommendationsApiV1RecommendationsMlForMeGetResponseSchema>>(getMlRecommendationsApiV1RecommendationsMlForMeGet({ query: { limit, algorithm } }))
      return result
    },
    staleTime: 180000,
    initialData: initialData as z.infer<typeof GetMlRecommendationsApiV1RecommendationsMlForMeGetResponseSchema> | undefined,
    ...restOptions
  })
}

/**
 * Optimized query hook for GET /api/v1/recommendations/ml/explain/{listing_id}
 * Features: URL state sync, infinite loading, optimistic updates
 * @returns useQuery result with data of type z.infer<typeof ExplainRecommendationApiV1RecommendationsMlExplainListingIdGetResponseSchema>
 */
export function useExplainRecommendationApiV1RecommendationsMlExplainListingIdGet(listing_id: string, options?: { enabled?: boolean; suspense?: boolean; refetchInterval?: number; initialData?: z.infer<typeof ExplainRecommendationApiV1RecommendationsMlExplainListingIdGetResponseSchema> }) {
  const [searchParams] = useQueryStates(searchParamsParser)
  const { initialData, ...restOptions } = options ?? {}
  
  return useQuery({
    queryKey: [...['explainRecommendationApiV1RecommendationsMlExplainListingIdGet', listing_id], searchParams],
    queryFn: async ({ signal }: { signal?: AbortSignal }) => {
      try {
        
        const result = await resolveActionResult<z.infer<typeof ExplainRecommendationApiV1RecommendationsMlExplainListingIdGetResponseSchema>>(explainRecommendationApiV1RecommendationsMlExplainListingIdGet({ path: { listing_id } }))
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
    placeholderData: (previousData: z.infer<typeof ExplainRecommendationApiV1RecommendationsMlExplainListingIdGetResponseSchema> | undefined) => previousData,
    retry: (failureCount: number, error: Error) => {
      // Don't retry on 4xx errors (client errors)
      if (error instanceof Error && error.message.includes('4')) return false
      // Retry up to 3 times for network/server errors
      return failureCount < 3
    },
    initialData: initialData as z.infer<typeof ExplainRecommendationApiV1RecommendationsMlExplainListingIdGetResponseSchema> | undefined,
    ...restOptions
  })
}

/**
 * Infinite query version for paginated /api/v1/recommendations/ml/explain/{listing_id}
 * @returns useInfiniteQuery result with data of type z.infer<typeof ExplainRecommendationApiV1RecommendationsMlExplainListingIdGetResponseSchema>
 */
export function useInfiniteExplainRecommendationApiV1RecommendationsMlExplainListingIdGet(listing_id: string, options?: { enabled?: boolean; suspense?: boolean; refetchInterval?: number; initialData?: z.infer<typeof ExplainRecommendationApiV1RecommendationsMlExplainListingIdGetResponseSchema> }) {
  const [searchParams] = useQueryStates(searchParamsParser)
  const { initialData, ...restOptions } = options ?? {}

  return useInfiniteQuery({
    queryKey: [...['explainRecommendationApiV1RecommendationsMlExplainListingIdGet', listing_id], 'infinite', searchParams],
    initialPageParam: 1,
    queryFn: async ({ pageParam = 1, signal }: { pageParam?: number; signal?: AbortSignal }) => {
      try {
        // Build query params object with only the parameters the endpoint expects
        const queryParams: {  } = {
          
        }
        const result = await resolveActionResult<z.infer<typeof ExplainRecommendationApiV1RecommendationsMlExplainListingIdGetResponseSchema>>(explainRecommendationApiV1RecommendationsMlExplainListingIdGet({ path: { listing_id } }))
        return result
      } catch (error) {
        handleActionError(error)
      }
    },
    getNextPageParam: (lastPage: z.infer<typeof ExplainRecommendationApiV1RecommendationsMlExplainListingIdGetResponseSchema>, allPages: z.infer<typeof ExplainRecommendationApiV1RecommendationsMlExplainListingIdGetResponseSchema>[]) => {
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
 * Suspense version for /api/v1/recommendations/ml/explain/{listing_id} - use in Server Components
 * @returns useSuspenseQuery result with data of type z.infer<typeof ExplainRecommendationApiV1RecommendationsMlExplainListingIdGetResponseSchema>
 */
export function useSuspenseExplainRecommendationApiV1RecommendationsMlExplainListingIdGet(listing_id: string, options?: { enabled?: boolean; suspense?: boolean; refetchInterval?: number; initialData?: z.infer<typeof ExplainRecommendationApiV1RecommendationsMlExplainListingIdGetResponseSchema> }) {
  const { initialData, ...restOptions } = options ?? {}

  return useSuspenseQuery({
    queryKey: ['explainRecommendationApiV1RecommendationsMlExplainListingIdGet', listing_id],
    queryFn: async () => {
      const result = await resolveActionResult<z.infer<typeof ExplainRecommendationApiV1RecommendationsMlExplainListingIdGetResponseSchema>>(explainRecommendationApiV1RecommendationsMlExplainListingIdGet({ path: { listing_id } }))
      return result
    },
    staleTime: 180000,
    initialData: initialData as z.infer<typeof ExplainRecommendationApiV1RecommendationsMlExplainListingIdGetResponseSchema> | undefined,
    ...restOptions
  })
}

/**
 * Optimized mutation hook for POST /api/v1/recommendations/ml/train
 * Features: Optimistic updates, smart invalidation, error handling
 * @param options - Mutation options
 * @returns Mutation result with enhanced features
 */
export function useTrainRecommendationModelApiV1RecommendationsMlTrainPostMutation(options?: {
  onSuccess?: (data: z.infer<typeof TrainRecommendationModelApiV1RecommendationsMlTrainPostResponseSchema>, variables: z.infer<typeof TrainRecommendationModelApiV1RecommendationsMlTrainPostParamsSchema>) => void
  onError?: (error: Error, variables: z.infer<typeof TrainRecommendationModelApiV1RecommendationsMlTrainPostParamsSchema>) => void
  optimisticUpdate?: (variables: z.infer<typeof TrainRecommendationModelApiV1RecommendationsMlTrainPostParamsSchema>) => unknown
  showToast?: boolean
}) {
  const queryClient = useQueryClient()
  const [isPending, startTransition] = useTransition()
  const [optimisticData, setOptimisticData] = useOptimistic<unknown, z.infer<typeof TrainRecommendationModelApiV1RecommendationsMlTrainPostParamsSchema>>(null, (_, newData) => newData)

  const mutation = useMutation({
    mutationFn: async (variables: z.infer<typeof TrainRecommendationModelApiV1RecommendationsMlTrainPostParamsSchema>): Promise<z.infer<typeof TrainRecommendationModelApiV1RecommendationsMlTrainPostResponseSchema>> => {
      try {
        const result = await resolveActionResult<z.infer<typeof TrainRecommendationModelApiV1RecommendationsMlTrainPostResponseSchema>>(trainRecommendationModelApiV1RecommendationsMlTrainPost(variables))
        return (result ?? ({} as z.infer<typeof TrainRecommendationModelApiV1RecommendationsMlTrainPostResponseSchema>))
      } catch (error) {
        handleActionError(error)
      }
    },
    
    onMutate: async (variables: z.infer<typeof TrainRecommendationModelApiV1RecommendationsMlTrainPostParamsSchema>) => {
      await Promise.all([
        queryClient.cancelQueries({ queryKey: ['getMyRecommendationsApiV1RecommendationsForMeGet'] }),
        queryClient.cancelQueries({ queryKey: ['getSimilarListingsApiV1RecommendationsSimilarListingIdGet'] }),
        queryClient.cancelQueries({ queryKey: ['getTrendingListingsApiV1RecommendationsTrendingGet'] }),
        queryClient.cancelQueries({ queryKey: ['getMlRecommendationsApiV1RecommendationsMlForMeGet'] }),
        queryClient.cancelQueries({ queryKey: ['explainRecommendationApiV1RecommendationsMlExplainListingIdGet'] })
      ])

      // Optimistic update (if provided)
      if (options?.optimisticUpdate) {
        const optimisticValue = options.optimisticUpdate(variables)
        setOptimisticData(optimisticValue as z.infer<typeof TrainRecommendationModelApiV1RecommendationsMlTrainPostParamsSchema>)
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
    
    onError: (error: Error, variables: z.infer<typeof TrainRecommendationModelApiV1RecommendationsMlTrainPostParamsSchema>) => {
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
        queryClient.invalidateQueries({ queryKey: ['getMyRecommendationsApiV1RecommendationsForMeGet'] }),
        queryClient.invalidateQueries({ queryKey: ['getSimilarListingsApiV1RecommendationsSimilarListingIdGet'] }),
        queryClient.invalidateQueries({ queryKey: ['getTrendingListingsApiV1RecommendationsTrendingGet'] }),
        queryClient.invalidateQueries({ queryKey: ['getMlRecommendationsApiV1RecommendationsMlForMeGet'] }),
        queryClient.invalidateQueries({ queryKey: ['explainRecommendationApiV1RecommendationsMlExplainListingIdGet'] }),
        queryClient.invalidateQueries({ queryKey: ['Recommendations'] })
      ])
    }
  })

  return {
    ...mutation,
    mutateWithTransition: (variables: z.infer<typeof TrainRecommendationModelApiV1RecommendationsMlTrainPostParamsSchema>) => {
      startTransition(() => {
        mutation.mutate(variables)
      })
    },
    isPending: isPending || mutation.isPending,
    optimisticData
  }
}