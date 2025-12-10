'use client'
import { useQuery, useQueryClient, useSuspenseQuery, useMutation, useInfiniteQuery } from '@tanstack/react-query'
import { useOptimistic, useTransition } from 'react'
import { parseAsInteger, parseAsString, useQueryStates } from 'nuqs'
import { toast } from 'sonner'
import { getFeaturedListingsApiV1ListingsPremiumFeaturedGet, getPremiumListingsApiV1ListingsPremiumPremiumGet, getPricingOptionsApiV1ListingsPremiumPricingGet, upgradeListingToPremiumApiV1ListingsPremiumListingIdUpgradePost, featureListingApiV1ListingsPremiumListingIdFeaturePost } from '@/generated/actions/premiumListings'
import {
  GetFeaturedListingsApiV1ListingsPremiumFeaturedGetResponseSchema,
  GetFeaturedListingsApiV1ListingsPremiumFeaturedGetParamsSchema,
  GetPremiumListingsApiV1ListingsPremiumPremiumGetResponseSchema,
  GetPremiumListingsApiV1ListingsPremiumPremiumGetParamsSchema,
  GetPricingOptionsApiV1ListingsPremiumPricingGetResponseSchema,
  UpgradeListingToPremiumApiV1ListingsPremiumListingIdUpgradePostResponseSchema,
  UpgradeListingToPremiumApiV1ListingsPremiumListingIdUpgradePostParamsSchema,
  FeatureListingApiV1ListingsPremiumListingIdFeaturePostResponseSchema,
  FeatureListingApiV1ListingsPremiumListingIdFeaturePostParamsSchema
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
 * Optimized query hook for GET /api/v1/listings/premium/featured
 * Features: URL state sync, infinite loading, optimistic updates
 * @returns useQuery result with data of type z.infer<typeof GetFeaturedListingsApiV1ListingsPremiumFeaturedGetResponseSchema>
 */
export function useGetFeaturedListingsApiV1ListingsPremiumFeaturedGet(limit?: number, city?: unknown, country?: unknown, options?: { enabled?: boolean; suspense?: boolean; refetchInterval?: number; initialData?: z.infer<typeof GetFeaturedListingsApiV1ListingsPremiumFeaturedGetResponseSchema> }) {
  const [searchParams] = useQueryStates(searchParamsParser)
  const { initialData, ...restOptions } = options ?? {}
  
  return useQuery({
    queryKey: [...['getFeaturedListingsApiV1ListingsPremiumFeaturedGet', limit, city, country], searchParams],
    queryFn: async ({ signal }: { signal?: AbortSignal }) => {
      try {
        // Build query params object with only the parameters the endpoint expects
        const queryParams: { limit?: number; city?: unknown; country?: unknown } = {
          limit: limit !== undefined ? limit : searchParams.limit,
          city: city !== undefined ? city : undefined,
          country: country !== undefined ? country : undefined
        }
        const result = await resolveActionResult<z.infer<typeof GetFeaturedListingsApiV1ListingsPremiumFeaturedGetResponseSchema>>(getFeaturedListingsApiV1ListingsPremiumFeaturedGet({ query: queryParams }))
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
    placeholderData: (previousData: z.infer<typeof GetFeaturedListingsApiV1ListingsPremiumFeaturedGetResponseSchema> | undefined) => previousData,
    retry: (failureCount: number, error: Error) => {
      // Don't retry on 4xx errors (client errors)
      if (error instanceof Error && error.message.includes('4')) return false
      // Retry up to 3 times for network/server errors
      return failureCount < 3
    },
    initialData: initialData as z.infer<typeof GetFeaturedListingsApiV1ListingsPremiumFeaturedGetResponseSchema> | undefined,
    ...restOptions
  })
}

/**
 * Infinite query version for paginated /api/v1/listings/premium/featured
 * @returns useInfiniteQuery result with data of type z.infer<typeof GetFeaturedListingsApiV1ListingsPremiumFeaturedGetResponseSchema>
 */
export function useInfiniteGetFeaturedListingsApiV1ListingsPremiumFeaturedGet(limit?: number, city?: unknown, country?: unknown, options?: { enabled?: boolean; suspense?: boolean; refetchInterval?: number; initialData?: z.infer<typeof GetFeaturedListingsApiV1ListingsPremiumFeaturedGetResponseSchema> }) {
  const [searchParams] = useQueryStates(searchParamsParser)
  const { initialData, ...restOptions } = options ?? {}

  return useInfiniteQuery({
    queryKey: [...['getFeaturedListingsApiV1ListingsPremiumFeaturedGet', limit, city, country], 'infinite', searchParams],
    initialPageParam: 1,
    queryFn: async ({ pageParam = 1, signal }: { pageParam?: number; signal?: AbortSignal }) => {
      try {
        // Build query params object with only the parameters the endpoint expects
        const queryParams: { limit?: number; city?: unknown; country?: unknown } = {
          limit: limit !== undefined ? limit : searchParams.limit,
          city: city !== undefined ? city : undefined,
          country: country !== undefined ? country : undefined
        }
        const result = await resolveActionResult<z.infer<typeof GetFeaturedListingsApiV1ListingsPremiumFeaturedGetResponseSchema>>(getFeaturedListingsApiV1ListingsPremiumFeaturedGet({ query: queryParams }))
        return result
      } catch (error) {
        handleActionError(error)
      }
    },
    getNextPageParam: (lastPage: z.infer<typeof GetFeaturedListingsApiV1ListingsPremiumFeaturedGetResponseSchema>, allPages: z.infer<typeof GetFeaturedListingsApiV1ListingsPremiumFeaturedGetResponseSchema>[]) => {
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
 * Suspense version for /api/v1/listings/premium/featured - use in Server Components
 * @returns useSuspenseQuery result with data of type z.infer<typeof GetFeaturedListingsApiV1ListingsPremiumFeaturedGetResponseSchema>
 */
export function useSuspenseGetFeaturedListingsApiV1ListingsPremiumFeaturedGet(limit?: number, city?: unknown, country?: unknown, options?: { enabled?: boolean; suspense?: boolean; refetchInterval?: number; initialData?: z.infer<typeof GetFeaturedListingsApiV1ListingsPremiumFeaturedGetResponseSchema> }) {
  const { initialData, ...restOptions } = options ?? {}

  return useSuspenseQuery({
    queryKey: ['getFeaturedListingsApiV1ListingsPremiumFeaturedGet', limit, city, country],
    queryFn: async () => {
      const result = await resolveActionResult<z.infer<typeof GetFeaturedListingsApiV1ListingsPremiumFeaturedGetResponseSchema>>(getFeaturedListingsApiV1ListingsPremiumFeaturedGet({ query: { limit, city, country } }))
      return result
    },
    staleTime: 180000,
    initialData: initialData as z.infer<typeof GetFeaturedListingsApiV1ListingsPremiumFeaturedGetResponseSchema> | undefined,
    ...restOptions
  })
}

/**
 * Optimized query hook for GET /api/v1/listings/premium/premium
 * Features: URL state sync, infinite loading, optimistic updates
 * @returns useQuery result with data of type z.infer<typeof GetPremiumListingsApiV1ListingsPremiumPremiumGetResponseSchema>
 */
export function useGetPremiumListingsApiV1ListingsPremiumPremiumGet(limit?: number, city?: unknown, country?: unknown, options?: { enabled?: boolean; suspense?: boolean; refetchInterval?: number; initialData?: z.infer<typeof GetPremiumListingsApiV1ListingsPremiumPremiumGetResponseSchema> }) {
  const [searchParams] = useQueryStates(searchParamsParser)
  const { initialData, ...restOptions } = options ?? {}
  
  return useQuery({
    queryKey: [...['getPremiumListingsApiV1ListingsPremiumPremiumGet', limit, city, country], searchParams],
    queryFn: async ({ signal }: { signal?: AbortSignal }) => {
      try {
        // Build query params object with only the parameters the endpoint expects
        const queryParams: { limit?: number; city?: unknown; country?: unknown } = {
          limit: limit !== undefined ? limit : searchParams.limit,
          city: city !== undefined ? city : undefined,
          country: country !== undefined ? country : undefined
        }
        const result = await resolveActionResult<z.infer<typeof GetPremiumListingsApiV1ListingsPremiumPremiumGetResponseSchema>>(getPremiumListingsApiV1ListingsPremiumPremiumGet({ query: queryParams }))
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
    placeholderData: (previousData: z.infer<typeof GetPremiumListingsApiV1ListingsPremiumPremiumGetResponseSchema> | undefined) => previousData,
    retry: (failureCount: number, error: Error) => {
      // Don't retry on 4xx errors (client errors)
      if (error instanceof Error && error.message.includes('4')) return false
      // Retry up to 3 times for network/server errors
      return failureCount < 3
    },
    initialData: initialData as z.infer<typeof GetPremiumListingsApiV1ListingsPremiumPremiumGetResponseSchema> | undefined,
    ...restOptions
  })
}

/**
 * Infinite query version for paginated /api/v1/listings/premium/premium
 * @returns useInfiniteQuery result with data of type z.infer<typeof GetPremiumListingsApiV1ListingsPremiumPremiumGetResponseSchema>
 */
export function useInfiniteGetPremiumListingsApiV1ListingsPremiumPremiumGet(limit?: number, city?: unknown, country?: unknown, options?: { enabled?: boolean; suspense?: boolean; refetchInterval?: number; initialData?: z.infer<typeof GetPremiumListingsApiV1ListingsPremiumPremiumGetResponseSchema> }) {
  const [searchParams] = useQueryStates(searchParamsParser)
  const { initialData, ...restOptions } = options ?? {}

  return useInfiniteQuery({
    queryKey: [...['getPremiumListingsApiV1ListingsPremiumPremiumGet', limit, city, country], 'infinite', searchParams],
    initialPageParam: 1,
    queryFn: async ({ pageParam = 1, signal }: { pageParam?: number; signal?: AbortSignal }) => {
      try {
        // Build query params object with only the parameters the endpoint expects
        const queryParams: { limit?: number; city?: unknown; country?: unknown } = {
          limit: limit !== undefined ? limit : searchParams.limit,
          city: city !== undefined ? city : undefined,
          country: country !== undefined ? country : undefined
        }
        const result = await resolveActionResult<z.infer<typeof GetPremiumListingsApiV1ListingsPremiumPremiumGetResponseSchema>>(getPremiumListingsApiV1ListingsPremiumPremiumGet({ query: queryParams }))
        return result
      } catch (error) {
        handleActionError(error)
      }
    },
    getNextPageParam: (lastPage: z.infer<typeof GetPremiumListingsApiV1ListingsPremiumPremiumGetResponseSchema>, allPages: z.infer<typeof GetPremiumListingsApiV1ListingsPremiumPremiumGetResponseSchema>[]) => {
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
 * Suspense version for /api/v1/listings/premium/premium - use in Server Components
 * @returns useSuspenseQuery result with data of type z.infer<typeof GetPremiumListingsApiV1ListingsPremiumPremiumGetResponseSchema>
 */
export function useSuspenseGetPremiumListingsApiV1ListingsPremiumPremiumGet(limit?: number, city?: unknown, country?: unknown, options?: { enabled?: boolean; suspense?: boolean; refetchInterval?: number; initialData?: z.infer<typeof GetPremiumListingsApiV1ListingsPremiumPremiumGetResponseSchema> }) {
  const { initialData, ...restOptions } = options ?? {}

  return useSuspenseQuery({
    queryKey: ['getPremiumListingsApiV1ListingsPremiumPremiumGet', limit, city, country],
    queryFn: async () => {
      const result = await resolveActionResult<z.infer<typeof GetPremiumListingsApiV1ListingsPremiumPremiumGetResponseSchema>>(getPremiumListingsApiV1ListingsPremiumPremiumGet({ query: { limit, city, country } }))
      return result
    },
    staleTime: 180000,
    initialData: initialData as z.infer<typeof GetPremiumListingsApiV1ListingsPremiumPremiumGetResponseSchema> | undefined,
    ...restOptions
  })
}

/**
 * Optimized query hook for GET /api/v1/listings/premium/pricing
 * Features: URL state sync, infinite loading, optimistic updates
 * @returns useQuery result with data of type z.infer<typeof GetPricingOptionsApiV1ListingsPremiumPricingGetResponseSchema>
 */
export function useGetPricingOptionsApiV1ListingsPremiumPricingGet(options?: { enabled?: boolean; suspense?: boolean; refetchInterval?: number; initialData?: z.infer<typeof GetPricingOptionsApiV1ListingsPremiumPricingGetResponseSchema> }) {
  const [searchParams] = useQueryStates(searchParamsParser)
  const { initialData, ...restOptions } = options ?? {}
  
  return useQuery({
    queryKey: [...['getPricingOptionsApiV1ListingsPremiumPricingGet'], searchParams],
    queryFn: async ({ signal }: { signal?: AbortSignal }) => {
      try {
        const result = await resolveActionResult<z.infer<typeof GetPricingOptionsApiV1ListingsPremiumPricingGetResponseSchema>>(getPricingOptionsApiV1ListingsPremiumPricingGet())
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
    placeholderData: (previousData: z.infer<typeof GetPricingOptionsApiV1ListingsPremiumPricingGetResponseSchema> | undefined) => previousData,
    retry: (failureCount: number, error: Error) => {
      // Don't retry on 4xx errors (client errors)
      if (error instanceof Error && error.message.includes('4')) return false
      // Retry up to 3 times for network/server errors
      return failureCount < 3
    },
    initialData: initialData as z.infer<typeof GetPricingOptionsApiV1ListingsPremiumPricingGetResponseSchema> | undefined,
    ...restOptions
  })
}

/**
 * Infinite query version for paginated /api/v1/listings/premium/pricing
 * @returns useInfiniteQuery result with data of type z.infer<typeof GetPricingOptionsApiV1ListingsPremiumPricingGetResponseSchema>
 */
export function useInfiniteGetPricingOptionsApiV1ListingsPremiumPricingGet(options?: { enabled?: boolean; suspense?: boolean; refetchInterval?: number; initialData?: z.infer<typeof GetPricingOptionsApiV1ListingsPremiumPricingGetResponseSchema> }) {
  const [searchParams] = useQueryStates(searchParamsParser)
  const { initialData, ...restOptions } = options ?? {}

  return useInfiniteQuery({
    queryKey: [...['getPricingOptionsApiV1ListingsPremiumPricingGet'], 'infinite', searchParams],
    initialPageParam: 1,
    queryFn: async ({ pageParam = 1, signal }: { pageParam?: number; signal?: AbortSignal }) => {
      try {
        // Build query params object with only the parameters the endpoint expects
        
        const result = await resolveActionResult<z.infer<typeof GetPricingOptionsApiV1ListingsPremiumPricingGetResponseSchema>>(getPricingOptionsApiV1ListingsPremiumPricingGet())
        return result
      } catch (error) {
        handleActionError(error)
      }
    },
    getNextPageParam: (lastPage: z.infer<typeof GetPricingOptionsApiV1ListingsPremiumPricingGetResponseSchema>, allPages: z.infer<typeof GetPricingOptionsApiV1ListingsPremiumPricingGetResponseSchema>[]) => {
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
 * Suspense version for /api/v1/listings/premium/pricing - use in Server Components
 * @returns useSuspenseQuery result with data of type z.infer<typeof GetPricingOptionsApiV1ListingsPremiumPricingGetResponseSchema>
 */
export function useSuspenseGetPricingOptionsApiV1ListingsPremiumPricingGet(options?: { enabled?: boolean; suspense?: boolean; refetchInterval?: number; initialData?: z.infer<typeof GetPricingOptionsApiV1ListingsPremiumPricingGetResponseSchema> }) {
  const { initialData, ...restOptions } = options ?? {}

  return useSuspenseQuery({
    queryKey: ['getPricingOptionsApiV1ListingsPremiumPricingGet'],
    queryFn: async () => {
      const result = await resolveActionResult<z.infer<typeof GetPricingOptionsApiV1ListingsPremiumPricingGetResponseSchema>>(getPricingOptionsApiV1ListingsPremiumPricingGet())
      return result
    },
    staleTime: 180000,
    initialData: initialData as z.infer<typeof GetPricingOptionsApiV1ListingsPremiumPricingGetResponseSchema> | undefined,
    ...restOptions
  })
}

/**
 * Optimized mutation hook for POST /api/v1/listings/premium/{listing_id}/upgrade
 * Features: Optimistic updates, smart invalidation, error handling
 * @param options - Mutation options
 * @returns Mutation result with enhanced features
 */
export function useUpgradeListingToPremiumApiV1ListingsPremiumListingIdUpgradePostMutation(options?: {
  onSuccess?: (data: z.infer<typeof UpgradeListingToPremiumApiV1ListingsPremiumListingIdUpgradePostResponseSchema>, variables: z.infer<typeof UpgradeListingToPremiumApiV1ListingsPremiumListingIdUpgradePostParamsSchema>) => void
  onError?: (error: Error, variables: z.infer<typeof UpgradeListingToPremiumApiV1ListingsPremiumListingIdUpgradePostParamsSchema>) => void
  optimisticUpdate?: (variables: z.infer<typeof UpgradeListingToPremiumApiV1ListingsPremiumListingIdUpgradePostParamsSchema>) => unknown
  showToast?: boolean
}) {
  const queryClient = useQueryClient()
  const [isPending, startTransition] = useTransition()
  const [optimisticData, setOptimisticData] = useOptimistic<unknown, z.infer<typeof UpgradeListingToPremiumApiV1ListingsPremiumListingIdUpgradePostParamsSchema>>(null, (_, newData) => newData)

  const mutation = useMutation({
    mutationFn: async (variables: z.infer<typeof UpgradeListingToPremiumApiV1ListingsPremiumListingIdUpgradePostParamsSchema>): Promise<z.infer<typeof UpgradeListingToPremiumApiV1ListingsPremiumListingIdUpgradePostResponseSchema>> => {
      try {
        const result = await resolveActionResult<z.infer<typeof UpgradeListingToPremiumApiV1ListingsPremiumListingIdUpgradePostResponseSchema>>(upgradeListingToPremiumApiV1ListingsPremiumListingIdUpgradePost(variables))
        return (result ?? ({} as z.infer<typeof UpgradeListingToPremiumApiV1ListingsPremiumListingIdUpgradePostResponseSchema>))
      } catch (error) {
        handleActionError(error)
      }
    },
    
    onMutate: async (variables: z.infer<typeof UpgradeListingToPremiumApiV1ListingsPremiumListingIdUpgradePostParamsSchema>) => {
      await Promise.all([
        queryClient.cancelQueries({ queryKey: ['listListingsApiV1ListingsGet'] }),
        queryClient.cancelQueries({ queryKey: ['getListingApiV1ListingsListingIdGet'] }),
        queryClient.cancelQueries({ queryKey: ['getFeaturedListingsApiV1ListingsPremiumFeaturedGet'] }),
        queryClient.cancelQueries({ queryKey: ['getPremiumListingsApiV1ListingsPremiumPremiumGet'] }),
        queryClient.cancelQueries({ queryKey: ['getPricingOptionsApiV1ListingsPremiumPricingGet'] })
      ])

      // Optimistic update (if provided)
      if (options?.optimisticUpdate) {
        const optimisticValue = options.optimisticUpdate(variables)
        setOptimisticData(optimisticValue as z.infer<typeof UpgradeListingToPremiumApiV1ListingsPremiumListingIdUpgradePostParamsSchema>)
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
    
    onError: (error: Error, variables: z.infer<typeof UpgradeListingToPremiumApiV1ListingsPremiumListingIdUpgradePostParamsSchema>) => {
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
        queryClient.invalidateQueries({ queryKey: ['listListingsApiV1ListingsGet'] }),
        queryClient.invalidateQueries({ queryKey: ['getListingApiV1ListingsListingIdGet'] }),
        queryClient.invalidateQueries({ queryKey: ['getFeaturedListingsApiV1ListingsPremiumFeaturedGet'] }),
        queryClient.invalidateQueries({ queryKey: ['getPremiumListingsApiV1ListingsPremiumPremiumGet'] }),
        queryClient.invalidateQueries({ queryKey: ['getPricingOptionsApiV1ListingsPremiumPricingGet'] }),
        queryClient.invalidateQueries({ queryKey: ['Premium Listings'] })
      ])
    }
  })

  return {
    ...mutation,
    mutateWithTransition: (variables: z.infer<typeof UpgradeListingToPremiumApiV1ListingsPremiumListingIdUpgradePostParamsSchema>) => {
      startTransition(() => {
        mutation.mutate(variables)
      })
    },
    isPending: isPending || mutation.isPending,
    optimisticData
  }
}

/**
 * Optimized mutation hook for POST /api/v1/listings/premium/{listing_id}/feature
 * Features: Optimistic updates, smart invalidation, error handling
 * @param options - Mutation options
 * @returns Mutation result with enhanced features
 */
export function useFeatureListingApiV1ListingsPremiumListingIdFeaturePostMutation(options?: {
  onSuccess?: (data: z.infer<typeof FeatureListingApiV1ListingsPremiumListingIdFeaturePostResponseSchema>, variables: z.infer<typeof FeatureListingApiV1ListingsPremiumListingIdFeaturePostParamsSchema>) => void
  onError?: (error: Error, variables: z.infer<typeof FeatureListingApiV1ListingsPremiumListingIdFeaturePostParamsSchema>) => void
  optimisticUpdate?: (variables: z.infer<typeof FeatureListingApiV1ListingsPremiumListingIdFeaturePostParamsSchema>) => unknown
  showToast?: boolean
}) {
  const queryClient = useQueryClient()
  const [isPending, startTransition] = useTransition()
  const [optimisticData, setOptimisticData] = useOptimistic<unknown, z.infer<typeof FeatureListingApiV1ListingsPremiumListingIdFeaturePostParamsSchema>>(null, (_, newData) => newData)

  const mutation = useMutation({
    mutationFn: async (variables: z.infer<typeof FeatureListingApiV1ListingsPremiumListingIdFeaturePostParamsSchema>): Promise<z.infer<typeof FeatureListingApiV1ListingsPremiumListingIdFeaturePostResponseSchema>> => {
      try {
        const result = await resolveActionResult<z.infer<typeof FeatureListingApiV1ListingsPremiumListingIdFeaturePostResponseSchema>>(featureListingApiV1ListingsPremiumListingIdFeaturePost(variables))
        return (result ?? ({} as z.infer<typeof FeatureListingApiV1ListingsPremiumListingIdFeaturePostResponseSchema>))
      } catch (error) {
        handleActionError(error)
      }
    },
    
    onMutate: async (variables: z.infer<typeof FeatureListingApiV1ListingsPremiumListingIdFeaturePostParamsSchema>) => {
      await Promise.all([
        queryClient.cancelQueries({ queryKey: ['listListingsApiV1ListingsGet'] }),
        queryClient.cancelQueries({ queryKey: ['getListingApiV1ListingsListingIdGet'] }),
        queryClient.cancelQueries({ queryKey: ['getFeaturedListingsApiV1ListingsPremiumFeaturedGet'] }),
        queryClient.cancelQueries({ queryKey: ['getPremiumListingsApiV1ListingsPremiumPremiumGet'] }),
        queryClient.cancelQueries({ queryKey: ['getPricingOptionsApiV1ListingsPremiumPricingGet'] })
      ])

      // Optimistic update (if provided)
      if (options?.optimisticUpdate) {
        const optimisticValue = options.optimisticUpdate(variables)
        setOptimisticData(optimisticValue as z.infer<typeof FeatureListingApiV1ListingsPremiumListingIdFeaturePostParamsSchema>)
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
    
    onError: (error: Error, variables: z.infer<typeof FeatureListingApiV1ListingsPremiumListingIdFeaturePostParamsSchema>) => {
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
        queryClient.invalidateQueries({ queryKey: ['listListingsApiV1ListingsGet'] }),
        queryClient.invalidateQueries({ queryKey: ['getListingApiV1ListingsListingIdGet'] }),
        queryClient.invalidateQueries({ queryKey: ['getFeaturedListingsApiV1ListingsPremiumFeaturedGet'] }),
        queryClient.invalidateQueries({ queryKey: ['getPremiumListingsApiV1ListingsPremiumPremiumGet'] }),
        queryClient.invalidateQueries({ queryKey: ['getPricingOptionsApiV1ListingsPremiumPricingGet'] }),
        queryClient.invalidateQueries({ queryKey: ['Premium Listings'] })
      ])
    }
  })

  return {
    ...mutation,
    mutateWithTransition: (variables: z.infer<typeof FeatureListingApiV1ListingsPremiumListingIdFeaturePostParamsSchema>) => {
      startTransition(() => {
        mutation.mutate(variables)
      })
    },
    isPending: isPending || mutation.isPending,
    optimisticData
  }
}