'use client'
import { useQuery, useQueryClient, useSuspenseQuery, useInfiniteQuery } from '@tanstack/react-query'
import { parseAsInteger, parseAsString, useQueryStates } from 'nuqs'
import { toast } from 'sonner'
import { searchListingsApiV1SearchListingsGet, getSearchSuggestionsApiV1SearchSuggestionsGet } from '@/generated/actions/search'
import {
  SearchListingsApiV1SearchListingsGetResponseSchema,
  SearchListingsApiV1SearchListingsGetParamsSchema,
  GetSearchSuggestionsApiV1SearchSuggestionsGetResponseSchema,
  GetSearchSuggestionsApiV1SearchSuggestionsGetParamsSchema
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
 * Optimized query hook for GET /api/v1/search/listings
 * Features: URL state sync, infinite loading, optimistic updates
 * @returns useQuery result with data of type z.infer<typeof SearchListingsApiV1SearchListingsGetResponseSchema>
 */
export function useSearchListingsApiV1SearchListingsGet(query?: string, city?: string, country?: string, listing_type?: unknown, min_price?: number, max_price?: number, min_guests?: number, min_bedrooms?: number, min_bathrooms?: number, latitude?: number, longitude?: number, radius_km?: number, skip?: number, limit?: number, sort_by?: string, enable_personalization?: boolean, enable_popularity_boost?: boolean, enable_location_boost?: boolean, ab_test_variant?: string, options?: { enabled?: boolean; suspense?: boolean; refetchInterval?: number; initialData?: z.infer<typeof SearchListingsApiV1SearchListingsGetResponseSchema> }) {
  const [searchParams] = useQueryStates(searchParamsParser)
  const { initialData, ...restOptions } = options ?? {}
  
  return useQuery({
    queryKey: [...['searchListingsApiV1SearchListingsGet', query, city, country, listing_type, min_price, max_price, min_guests, min_bedrooms, min_bathrooms, latitude, longitude, radius_km, skip, limit, sort_by, enable_personalization, enable_popularity_boost, enable_location_boost, ab_test_variant], searchParams],
    queryFn: async ({ signal }: { signal?: AbortSignal }) => {
      try {
        // Build query params object with only the parameters the endpoint expects
        const queryParams: { query?: string; city?: string; country?: string; listing_type?: unknown; min_price?: number; max_price?: number; min_guests?: number; min_bedrooms?: number; min_bathrooms?: number; latitude?: number; longitude?: number; radius_km?: number; skip?: number; limit?: number; sort_by?: string; enable_personalization?: boolean; enable_popularity_boost?: boolean; enable_location_boost?: boolean; ab_test_variant?: string } = {
          query: query || searchParams.search || '',
          city: city !== undefined ? city : undefined,
          country: country !== undefined ? country : undefined,
          listing_type: listing_type !== undefined ? listing_type : undefined,
          min_price: min_price !== undefined ? min_price : undefined,
          max_price: max_price !== undefined ? max_price : undefined,
          min_guests: min_guests !== undefined ? min_guests : undefined,
          min_bedrooms: min_bedrooms !== undefined ? min_bedrooms : undefined,
          min_bathrooms: min_bathrooms !== undefined ? min_bathrooms : undefined,
          latitude: latitude !== undefined ? latitude : undefined,
          longitude: longitude !== undefined ? longitude : undefined,
          radius_km: radius_km !== undefined ? radius_km : undefined,
          skip: skip !== undefined ? skip : undefined,
          limit: limit !== undefined ? limit : searchParams.limit,
          sort_by: sort_by !== undefined ? sort_by : undefined,
          enable_personalization: enable_personalization !== undefined ? enable_personalization : undefined,
          enable_popularity_boost: enable_popularity_boost !== undefined ? enable_popularity_boost : undefined,
          enable_location_boost: enable_location_boost !== undefined ? enable_location_boost : undefined,
          ab_test_variant: ab_test_variant !== undefined ? ab_test_variant : undefined
        }
        const result = await resolveActionResult<z.infer<typeof SearchListingsApiV1SearchListingsGetResponseSchema>>(searchListingsApiV1SearchListingsGet({ query: queryParams }))
        return result
      } catch (error) {
        handleActionError(error)
      }
    },
    staleTime: 30000,
    gcTime: 60000, // React Query v5: gcTime replaces cacheTime
    enabled: true && (options?.enabled ?? true),
    refetchOnWindowFocus: true, // Refetch when window regains focus
    refetchOnReconnect: true, // Refetch when network reconnects
    refetchOnMount: 'always', // Always refetch on mount for fresh data
    refetchInterval: options?.refetchInterval, // Optional polling interval
    // React Query v5: placeholderData replaces keepPreviousData
    placeholderData: (previousData: z.infer<typeof SearchListingsApiV1SearchListingsGetResponseSchema> | undefined) => previousData,
    retry: (failureCount: number, error: Error) => {
      // Don't retry on 4xx errors (client errors)
      if (error instanceof Error && error.message.includes('4')) return false
      // Retry up to 3 times for network/server errors
      return failureCount < 3
    },
    initialData: initialData as z.infer<typeof SearchListingsApiV1SearchListingsGetResponseSchema> | undefined,
    ...restOptions
  })
}

/**
 * Infinite query version for paginated /api/v1/search/listings
 * @returns useInfiniteQuery result with data of type z.infer<typeof SearchListingsApiV1SearchListingsGetResponseSchema>
 */
export function useInfiniteSearchListingsApiV1SearchListingsGet(query?: string, city?: string, country?: string, listing_type?: unknown, min_price?: number, max_price?: number, min_guests?: number, min_bedrooms?: number, min_bathrooms?: number, latitude?: number, longitude?: number, radius_km?: number, skip?: number, limit?: number, sort_by?: string, enable_personalization?: boolean, enable_popularity_boost?: boolean, enable_location_boost?: boolean, ab_test_variant?: string, options?: { enabled?: boolean; suspense?: boolean; refetchInterval?: number; initialData?: z.infer<typeof SearchListingsApiV1SearchListingsGetResponseSchema> }) {
  const [searchParams] = useQueryStates(searchParamsParser)
  const { initialData, ...restOptions } = options ?? {}

  return useInfiniteQuery({
    queryKey: [...['searchListingsApiV1SearchListingsGet', query, city, country, listing_type, min_price, max_price, min_guests, min_bedrooms, min_bathrooms, latitude, longitude, radius_km, skip, limit, sort_by, enable_personalization, enable_popularity_boost, enable_location_boost, ab_test_variant], 'infinite', searchParams],
    initialPageParam: 1,
    queryFn: async ({ pageParam = 1, signal }: { pageParam?: number; signal?: AbortSignal }) => {
      try {
        // Build query params object with only the parameters the endpoint expects
        const queryParams: { query?: string; city?: string; country?: string; listing_type?: unknown; min_price?: number; max_price?: number; min_guests?: number; min_bedrooms?: number; min_bathrooms?: number; latitude?: number; longitude?: number; radius_km?: number; skip?: number; limit?: number; sort_by?: string; enable_personalization?: boolean; enable_popularity_boost?: boolean; enable_location_boost?: boolean; ab_test_variant?: string } = {
          query: query || searchParams.search || '',
          city: city !== undefined ? city : undefined,
          country: country !== undefined ? country : undefined,
          listing_type: listing_type !== undefined ? listing_type : undefined,
          min_price: min_price !== undefined ? min_price : undefined,
          max_price: max_price !== undefined ? max_price : undefined,
          min_guests: min_guests !== undefined ? min_guests : undefined,
          min_bedrooms: min_bedrooms !== undefined ? min_bedrooms : undefined,
          min_bathrooms: min_bathrooms !== undefined ? min_bathrooms : undefined,
          latitude: latitude !== undefined ? latitude : undefined,
          longitude: longitude !== undefined ? longitude : undefined,
          radius_km: radius_km !== undefined ? radius_km : undefined,
          skip: skip !== undefined ? skip : undefined,
          limit: limit !== undefined ? limit : searchParams.limit,
          sort_by: sort_by !== undefined ? sort_by : undefined,
          enable_personalization: enable_personalization !== undefined ? enable_personalization : undefined,
          enable_popularity_boost: enable_popularity_boost !== undefined ? enable_popularity_boost : undefined,
          enable_location_boost: enable_location_boost !== undefined ? enable_location_boost : undefined,
          ab_test_variant: ab_test_variant !== undefined ? ab_test_variant : undefined
        }
        const result = await resolveActionResult<z.infer<typeof SearchListingsApiV1SearchListingsGetResponseSchema>>(searchListingsApiV1SearchListingsGet({ query: queryParams }))
        return result
      } catch (error) {
        handleActionError(error)
      }
    },
    getNextPageParam: (lastPage: z.infer<typeof SearchListingsApiV1SearchListingsGetResponseSchema>, allPages: z.infer<typeof SearchListingsApiV1SearchListingsGetResponseSchema>[]) => {
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
    staleTime: 30000,
    gcTime: 60000,
    enabled: true && (options?.enabled ?? true),
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchOnMount: 'always',
    retry: 3,
    ...restOptions
  })
}

/**
 * Suspense version for /api/v1/search/listings - use in Server Components
 * @returns useSuspenseQuery result with data of type z.infer<typeof SearchListingsApiV1SearchListingsGetResponseSchema>
 */
export function useSuspenseSearchListingsApiV1SearchListingsGet(query?: string, city?: string, country?: string, listing_type?: unknown, min_price?: number, max_price?: number, min_guests?: number, min_bedrooms?: number, min_bathrooms?: number, latitude?: number, longitude?: number, radius_km?: number, skip?: number, limit?: number, sort_by?: string, enable_personalization?: boolean, enable_popularity_boost?: boolean, enable_location_boost?: boolean, ab_test_variant?: string, options?: { enabled?: boolean; suspense?: boolean; refetchInterval?: number; initialData?: z.infer<typeof SearchListingsApiV1SearchListingsGetResponseSchema> }) {
  const { initialData, ...restOptions } = options ?? {}

  return useSuspenseQuery({
    queryKey: ['searchListingsApiV1SearchListingsGet', query, city, country, listing_type, min_price, max_price, min_guests, min_bedrooms, min_bathrooms, latitude, longitude, radius_km, skip, limit, sort_by, enable_personalization, enable_popularity_boost, enable_location_boost, ab_test_variant],
    queryFn: async () => {
      const result = await resolveActionResult<z.infer<typeof SearchListingsApiV1SearchListingsGetResponseSchema>>(searchListingsApiV1SearchListingsGet({ query: { query, city, country, listing_type, min_price, max_price, min_guests, min_bedrooms, min_bathrooms, latitude, longitude, radius_km, skip, limit, sort_by, enable_personalization, enable_popularity_boost, enable_location_boost, ab_test_variant } }))
      return result
    },
    staleTime: 30000,
    initialData: initialData as z.infer<typeof SearchListingsApiV1SearchListingsGetResponseSchema> | undefined,
    ...restOptions
  })
}

/**
 * Optimized query hook for GET /api/v1/search/suggestions
 * Features: URL state sync, infinite loading, optimistic updates
 * @returns useQuery result with data of type z.infer<typeof GetSearchSuggestionsApiV1SearchSuggestionsGetResponseSchema>
 */
export function useGetSearchSuggestionsApiV1SearchSuggestionsGet(query: string, limit?: number, options?: { enabled?: boolean; suspense?: boolean; refetchInterval?: number; initialData?: z.infer<typeof GetSearchSuggestionsApiV1SearchSuggestionsGetResponseSchema> }) {
  const [searchParams] = useQueryStates(searchParamsParser)
  const { initialData, ...restOptions } = options ?? {}
  
  return useQuery({
    queryKey: [...['getSearchSuggestionsApiV1SearchSuggestionsGet', query, limit], searchParams],
    queryFn: async ({ signal }: { signal?: AbortSignal }) => {
      try {
        // Build query params object with only the parameters the endpoint expects
        const queryParams: { query: string; limit?: number } = {
          query: query || searchParams.search || '',
          limit: limit !== undefined ? limit : searchParams.limit
        }
        const result = await resolveActionResult<z.infer<typeof GetSearchSuggestionsApiV1SearchSuggestionsGetResponseSchema>>(getSearchSuggestionsApiV1SearchSuggestionsGet({ query: queryParams }))
        return result
      } catch (error) {
        handleActionError(error)
      }
    },
    staleTime: 30000,
    gcTime: 60000, // React Query v5: gcTime replaces cacheTime
    enabled: true && (options?.enabled ?? true),
    refetchOnWindowFocus: true, // Refetch when window regains focus
    refetchOnReconnect: true, // Refetch when network reconnects
    refetchOnMount: 'always', // Always refetch on mount for fresh data
    refetchInterval: options?.refetchInterval, // Optional polling interval
    // React Query v5: placeholderData replaces keepPreviousData
    placeholderData: (previousData: z.infer<typeof GetSearchSuggestionsApiV1SearchSuggestionsGetResponseSchema> | undefined) => previousData,
    retry: (failureCount: number, error: Error) => {
      // Don't retry on 4xx errors (client errors)
      if (error instanceof Error && error.message.includes('4')) return false
      // Retry up to 3 times for network/server errors
      return failureCount < 3
    },
    initialData: initialData as z.infer<typeof GetSearchSuggestionsApiV1SearchSuggestionsGetResponseSchema> | undefined,
    ...restOptions
  })
}

/**
 * Infinite query version for paginated /api/v1/search/suggestions
 * @returns useInfiniteQuery result with data of type z.infer<typeof GetSearchSuggestionsApiV1SearchSuggestionsGetResponseSchema>
 */
export function useInfiniteGetSearchSuggestionsApiV1SearchSuggestionsGet(query: string, limit?: number, options?: { enabled?: boolean; suspense?: boolean; refetchInterval?: number; initialData?: z.infer<typeof GetSearchSuggestionsApiV1SearchSuggestionsGetResponseSchema> }) {
  const [searchParams] = useQueryStates(searchParamsParser)
  const { initialData, ...restOptions } = options ?? {}

  return useInfiniteQuery({
    queryKey: [...['getSearchSuggestionsApiV1SearchSuggestionsGet', query, limit], 'infinite', searchParams],
    initialPageParam: 1,
    queryFn: async ({ pageParam = 1, signal }: { pageParam?: number; signal?: AbortSignal }) => {
      try {
        // Build query params object with only the parameters the endpoint expects
        const queryParams: { query: string; limit?: number } = {
          query: query || searchParams.search || '',
          limit: limit !== undefined ? limit : searchParams.limit
        }
        const result = await resolveActionResult<z.infer<typeof GetSearchSuggestionsApiV1SearchSuggestionsGetResponseSchema>>(getSearchSuggestionsApiV1SearchSuggestionsGet({ query: queryParams }))
        return result
      } catch (error) {
        handleActionError(error)
      }
    },
    getNextPageParam: (lastPage: z.infer<typeof GetSearchSuggestionsApiV1SearchSuggestionsGetResponseSchema>, allPages: z.infer<typeof GetSearchSuggestionsApiV1SearchSuggestionsGetResponseSchema>[]) => {
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
    staleTime: 30000,
    gcTime: 60000,
    enabled: true && (options?.enabled ?? true),
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchOnMount: 'always',
    retry: 3,
    ...restOptions
  })
}

/**
 * Suspense version for /api/v1/search/suggestions - use in Server Components
 * @returns useSuspenseQuery result with data of type z.infer<typeof GetSearchSuggestionsApiV1SearchSuggestionsGetResponseSchema>
 */
export function useSuspenseGetSearchSuggestionsApiV1SearchSuggestionsGet(query: string, limit?: number, options?: { enabled?: boolean; suspense?: boolean; refetchInterval?: number; initialData?: z.infer<typeof GetSearchSuggestionsApiV1SearchSuggestionsGetResponseSchema> }) {
  const { initialData, ...restOptions } = options ?? {}

  return useSuspenseQuery({
    queryKey: ['getSearchSuggestionsApiV1SearchSuggestionsGet', query, limit],
    queryFn: async () => {
      const result = await resolveActionResult<z.infer<typeof GetSearchSuggestionsApiV1SearchSuggestionsGetResponseSchema>>(getSearchSuggestionsApiV1SearchSuggestionsGet({ query: { query, limit } }))
      return result
    },
    staleTime: 30000,
    initialData: initialData as z.infer<typeof GetSearchSuggestionsApiV1SearchSuggestionsGetResponseSchema> | undefined,
    ...restOptions
  })
}

