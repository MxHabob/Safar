'use client'
import { useQuery, useQueryClient, useSuspenseQuery, useMutation, useInfiniteQuery } from '@tanstack/react-query'
import { useOptimistic, useTransition } from 'react'
import { parseAsInteger, parseAsString, useQueryStates } from 'nuqs'
import { toast } from 'sonner'
import { listListingsApiV1ListingsGet, getListingApiV1ListingsListingIdGet, createListingApiV1ListingsPost, updateListingApiV1ListingsListingIdPut, deleteListingApiV1ListingsListingIdDelete, createListingLocationApiV1ListingsListingIdLocationPost } from '@/generated/actions/listings'
import {
  ListListingsApiV1ListingsGetResponseSchema,
  ListListingsApiV1ListingsGetParamsSchema,
  GetListingApiV1ListingsListingIdGetResponseSchema,
  GetListingApiV1ListingsListingIdGetParamsSchema,
  CreateListingApiV1ListingsPostResponseSchema,
  CreateListingApiV1ListingsPostRequestSchema,
  UpdateListingApiV1ListingsListingIdPutResponseSchema,
  UpdateListingApiV1ListingsListingIdPutRequestSchema,
  UpdateListingApiV1ListingsListingIdPutParamsSchema,
  DeleteListingApiV1ListingsListingIdDeleteResponseSchema,
  DeleteListingApiV1ListingsListingIdDeleteParamsSchema,
  CreateListingLocationApiV1ListingsListingIdLocationPostResponseSchema,
  CreateListingLocationApiV1ListingsListingIdLocationPostRequestSchema,
  CreateListingLocationApiV1ListingsListingIdLocationPostParamsSchema
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
 * Optimized query hook for GET /api/v1/listings
 * Features: URL state sync, infinite loading, optimistic updates
 * @returns useQuery result with data of type z.infer<typeof ListListingsApiV1ListingsGetResponseSchema>
 */
export function useListListingsApiV1ListingsGet(skip?: number, limit?: number, city?: unknown, country?: unknown, listing_type?: unknown, min_price?: unknown, max_price?: unknown, min_guests?: unknown, status?: unknown, options?: { enabled?: boolean; suspense?: boolean; refetchInterval?: number; initialData?: z.infer<typeof ListListingsApiV1ListingsGetResponseSchema> }) {
  const [searchParams] = useQueryStates(searchParamsParser)
  const { initialData, ...restOptions } = options ?? {}
  
  return useQuery({
    queryKey: [...['listListingsApiV1ListingsGet', skip, limit, city, country, listing_type, min_price, max_price, min_guests, status], searchParams],
    queryFn: async ({ signal }: { signal?: AbortSignal }) => {
      try {
        // Build query params object with only the parameters the endpoint expects
        const queryParams: { skip?: number; limit?: number; city?: unknown; country?: unknown; listing_type?: unknown; min_price?: unknown; max_price?: unknown; min_guests?: unknown; status?: unknown } = {
          skip: skip !== undefined ? skip : undefined,
          limit: limit !== undefined ? limit : searchParams.limit,
          city: city !== undefined ? city : undefined,
          country: country !== undefined ? country : undefined,
          listing_type: listing_type !== undefined ? listing_type : undefined,
          min_price: min_price !== undefined ? min_price : undefined,
          max_price: max_price !== undefined ? max_price : undefined,
          min_guests: min_guests !== undefined ? min_guests : undefined,
          status: status !== undefined ? status : undefined
        }
        const result = await resolveActionResult<z.infer<typeof ListListingsApiV1ListingsGetResponseSchema>>(listListingsApiV1ListingsGet({ query: queryParams }))
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
    placeholderData: (previousData: z.infer<typeof ListListingsApiV1ListingsGetResponseSchema> | undefined) => previousData,
    retry: (failureCount: number, error: Error) => {
      // Don't retry on 4xx errors (client errors)
      if (error instanceof Error && error.message.includes('4')) return false
      // Retry up to 3 times for network/server errors
      return failureCount < 3
    },
    initialData: initialData as z.infer<typeof ListListingsApiV1ListingsGetResponseSchema> | undefined,
    ...restOptions
  })
}

/**
 * Infinite query version for paginated /api/v1/listings
 * @returns useInfiniteQuery result with data of type z.infer<typeof ListListingsApiV1ListingsGetResponseSchema>
 */
export function useInfiniteListListingsApiV1ListingsGet(skip?: number, limit?: number, city?: unknown, country?: unknown, listing_type?: unknown, min_price?: unknown, max_price?: unknown, min_guests?: unknown, status?: unknown, options?: { enabled?: boolean; suspense?: boolean; refetchInterval?: number; initialData?: z.infer<typeof ListListingsApiV1ListingsGetResponseSchema> }) {
  const [searchParams] = useQueryStates(searchParamsParser)
  const { initialData, ...restOptions } = options ?? {}

  return useInfiniteQuery({
    queryKey: [...['listListingsApiV1ListingsGet', skip, limit, city, country, listing_type, min_price, max_price, min_guests, status], 'infinite', searchParams],
    initialPageParam: 1,
    queryFn: async ({ pageParam = 1, signal }: { pageParam?: number; signal?: AbortSignal }) => {
      try {
        // Build query params object with only the parameters the endpoint expects
        const queryParams: { skip?: number; limit?: number; city?: unknown; country?: unknown; listing_type?: unknown; min_price?: unknown; max_price?: unknown; min_guests?: unknown; status?: unknown } = {
          skip: skip !== undefined ? skip : undefined,
          limit: limit !== undefined ? limit : searchParams.limit,
          city: city !== undefined ? city : undefined,
          country: country !== undefined ? country : undefined,
          listing_type: listing_type !== undefined ? listing_type : undefined,
          min_price: min_price !== undefined ? min_price : undefined,
          max_price: max_price !== undefined ? max_price : undefined,
          min_guests: min_guests !== undefined ? min_guests : undefined,
          status: status !== undefined ? status : undefined
        }
        const result = await resolveActionResult<z.infer<typeof ListListingsApiV1ListingsGetResponseSchema>>(listListingsApiV1ListingsGet({ query: queryParams }))
        return result
      } catch (error) {
        handleActionError(error)
      }
    },
    getNextPageParam: (lastPage: z.infer<typeof ListListingsApiV1ListingsGetResponseSchema>, allPages: z.infer<typeof ListListingsApiV1ListingsGetResponseSchema>[]) => {
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
 * Suspense version for /api/v1/listings - use in Server Components
 * @returns useSuspenseQuery result with data of type z.infer<typeof ListListingsApiV1ListingsGetResponseSchema>
 */
export function useSuspenseListListingsApiV1ListingsGet(skip?: number, limit?: number, city?: unknown, country?: unknown, listing_type?: unknown, min_price?: unknown, max_price?: unknown, min_guests?: unknown, status?: unknown, options?: { enabled?: boolean; suspense?: boolean; refetchInterval?: number; initialData?: z.infer<typeof ListListingsApiV1ListingsGetResponseSchema> }) {
  const { initialData, ...restOptions } = options ?? {}

  return useSuspenseQuery({
    queryKey: ['listListingsApiV1ListingsGet', skip, limit, city, country, listing_type, min_price, max_price, min_guests, status],
    queryFn: async () => {
      const result = await resolveActionResult<z.infer<typeof ListListingsApiV1ListingsGetResponseSchema>>(listListingsApiV1ListingsGet({ query: { skip, limit, city, country, listing_type, min_price, max_price, min_guests, status } }))
      return result
    },
    staleTime: 180000,
    initialData: initialData as z.infer<typeof ListListingsApiV1ListingsGetResponseSchema> | undefined,
    ...restOptions
  })
}

/**
 * Optimized query hook for GET /api/v1/listings/{listing_id}
 * Features: URL state sync, infinite loading, optimistic updates
 * @returns useQuery result with data of type z.infer<typeof GetListingApiV1ListingsListingIdGetResponseSchema>
 */
export function useGetListingApiV1ListingsListingIdGet(listing_id: string, options?: { enabled?: boolean; suspense?: boolean; refetchInterval?: number; initialData?: z.infer<typeof GetListingApiV1ListingsListingIdGetResponseSchema> }) {
  const [searchParams] = useQueryStates(searchParamsParser)
  const { initialData, ...restOptions } = options ?? {}
  
  return useQuery({
    queryKey: [...['getListingApiV1ListingsListingIdGet', listing_id], searchParams],
    queryFn: async ({ signal }: { signal?: AbortSignal }) => {
      try {
        
        const result = await resolveActionResult<z.infer<typeof GetListingApiV1ListingsListingIdGetResponseSchema>>(getListingApiV1ListingsListingIdGet({ path: { listing_id } }))
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
    placeholderData: (previousData: z.infer<typeof GetListingApiV1ListingsListingIdGetResponseSchema> | undefined) => previousData,
    retry: (failureCount: number, error: Error) => {
      // Don't retry on 4xx errors (client errors)
      if (error instanceof Error && error.message.includes('4')) return false
      // Retry up to 3 times for network/server errors
      return failureCount < 3
    },
    initialData: initialData as z.infer<typeof GetListingApiV1ListingsListingIdGetResponseSchema> | undefined,
    ...restOptions
  })
}

/**
 * Infinite query version for paginated /api/v1/listings/{listing_id}
 * @returns useInfiniteQuery result with data of type z.infer<typeof GetListingApiV1ListingsListingIdGetResponseSchema>
 */
export function useInfiniteGetListingApiV1ListingsListingIdGet(listing_id: string, options?: { enabled?: boolean; suspense?: boolean; refetchInterval?: number; initialData?: z.infer<typeof GetListingApiV1ListingsListingIdGetResponseSchema> }) {
  const [searchParams] = useQueryStates(searchParamsParser)
  const { initialData, ...restOptions } = options ?? {}

  return useInfiniteQuery({
    queryKey: [...['getListingApiV1ListingsListingIdGet', listing_id], 'infinite', searchParams],
    initialPageParam: 1,
    queryFn: async ({ pageParam = 1, signal }: { pageParam?: number; signal?: AbortSignal }) => {
      try {
        // Build query params object with only the parameters the endpoint expects
        const queryParams: {  } = {
          
        }
        const result = await resolveActionResult<z.infer<typeof GetListingApiV1ListingsListingIdGetResponseSchema>>(getListingApiV1ListingsListingIdGet({ path: { listing_id } }))
        return result
      } catch (error) {
        handleActionError(error)
      }
    },
    getNextPageParam: (lastPage: z.infer<typeof GetListingApiV1ListingsListingIdGetResponseSchema>, allPages: z.infer<typeof GetListingApiV1ListingsListingIdGetResponseSchema>[]) => {
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
 * Suspense version for /api/v1/listings/{listing_id} - use in Server Components
 * @returns useSuspenseQuery result with data of type z.infer<typeof GetListingApiV1ListingsListingIdGetResponseSchema>
 */
export function useSuspenseGetListingApiV1ListingsListingIdGet(listing_id: string, options?: { enabled?: boolean; suspense?: boolean; refetchInterval?: number; initialData?: z.infer<typeof GetListingApiV1ListingsListingIdGetResponseSchema> }) {
  const { initialData, ...restOptions } = options ?? {}

  return useSuspenseQuery({
    queryKey: ['getListingApiV1ListingsListingIdGet', listing_id],
    queryFn: async () => {
      const result = await resolveActionResult<z.infer<typeof GetListingApiV1ListingsListingIdGetResponseSchema>>(getListingApiV1ListingsListingIdGet({ path: { listing_id } }))
      return result
    },
    staleTime: 180000,
    initialData: initialData as z.infer<typeof GetListingApiV1ListingsListingIdGetResponseSchema> | undefined,
    ...restOptions
  })
}

/**
 * Optimized mutation hook for POST /api/v1/listings
 * Features: Optimistic updates, smart invalidation, error handling
 * @param options - Mutation options
 * @returns Mutation result with enhanced features
 */
export function useCreateListingApiV1ListingsPostMutation(options?: {
  onSuccess?: (data: z.infer<typeof CreateListingApiV1ListingsPostResponseSchema>, variables: z.infer<typeof CreateListingApiV1ListingsPostRequestSchema>) => void
  onError?: (error: Error, variables: z.infer<typeof CreateListingApiV1ListingsPostRequestSchema>) => void
  optimisticUpdate?: (variables: z.infer<typeof CreateListingApiV1ListingsPostRequestSchema>) => unknown
  showToast?: boolean
}) {
  const queryClient = useQueryClient()
  const [isPending, startTransition] = useTransition()
  const [optimisticData, setOptimisticData] = useOptimistic<unknown, z.infer<typeof CreateListingApiV1ListingsPostRequestSchema>>(null, (_, newData) => newData)

  const mutation = useMutation({
    mutationFn: async (variables: z.infer<typeof CreateListingApiV1ListingsPostRequestSchema>): Promise<z.infer<typeof CreateListingApiV1ListingsPostResponseSchema>> => {
      try {
        const result = await resolveActionResult<z.infer<typeof CreateListingApiV1ListingsPostResponseSchema>>(createListingApiV1ListingsPost(variables))
        return (result ?? ({} as z.infer<typeof CreateListingApiV1ListingsPostResponseSchema>))
      } catch (error) {
        handleActionError(error)
      }
    },
    
    onMutate: async (variables: z.infer<typeof CreateListingApiV1ListingsPostRequestSchema>) => {
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
        setOptimisticData(optimisticValue as z.infer<typeof CreateListingApiV1ListingsPostRequestSchema>)
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
    
    onError: (error: Error, variables: z.infer<typeof CreateListingApiV1ListingsPostRequestSchema>) => {
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
        queryClient.invalidateQueries({ queryKey: ['Listings'] })
      ])
    }
  })

  return {
    ...mutation,
    mutateWithTransition: (variables: z.infer<typeof CreateListingApiV1ListingsPostRequestSchema>) => {
      startTransition(() => {
        mutation.mutate(variables)
      })
    },
    isPending: isPending || mutation.isPending,
    optimisticData
  }
}

/**
 * Optimized mutation hook for PUT /api/v1/listings/{listing_id}
 * Features: Optimistic updates, smart invalidation, error handling
 * @param options - Mutation options
 * @returns Mutation result with enhanced features
 */
export function useUpdateListingApiV1ListingsListingIdPutMutation(options?: {
  onSuccess?: (data: z.infer<typeof UpdateListingApiV1ListingsListingIdPutResponseSchema>, variables: { body: z.infer<typeof UpdateListingApiV1ListingsListingIdPutRequestSchema>, params: z.infer<typeof UpdateListingApiV1ListingsListingIdPutParamsSchema> }) => void
  onError?: (error: Error, variables: { body: z.infer<typeof UpdateListingApiV1ListingsListingIdPutRequestSchema>, params: z.infer<typeof UpdateListingApiV1ListingsListingIdPutParamsSchema> }) => void
  optimisticUpdate?: (variables: { body: z.infer<typeof UpdateListingApiV1ListingsListingIdPutRequestSchema>, params: z.infer<typeof UpdateListingApiV1ListingsListingIdPutParamsSchema> }) => unknown
  showToast?: boolean
}) {
  const queryClient = useQueryClient()
  const [isPending, startTransition] = useTransition()
  const [optimisticData, setOptimisticData] = useOptimistic<unknown, { body: z.infer<typeof UpdateListingApiV1ListingsListingIdPutRequestSchema>, params: z.infer<typeof UpdateListingApiV1ListingsListingIdPutParamsSchema> }>(null, (_, newData) => newData)

  const mutation = useMutation({
    mutationFn: async (variables: { body: z.infer<typeof UpdateListingApiV1ListingsListingIdPutRequestSchema>, params: z.infer<typeof UpdateListingApiV1ListingsListingIdPutParamsSchema> }): Promise<z.infer<typeof UpdateListingApiV1ListingsListingIdPutResponseSchema>> => {
      try {
        const result = await resolveActionResult<z.infer<typeof UpdateListingApiV1ListingsListingIdPutResponseSchema>>(updateListingApiV1ListingsListingIdPut(variables))
        return (result ?? ({} as z.infer<typeof UpdateListingApiV1ListingsListingIdPutResponseSchema>))
      } catch (error) {
        handleActionError(error)
      }
    },
    
    onMutate: async (variables: { body: z.infer<typeof UpdateListingApiV1ListingsListingIdPutRequestSchema>, params: z.infer<typeof UpdateListingApiV1ListingsListingIdPutParamsSchema> }) => {
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
        setOptimisticData(optimisticValue as { body: z.infer<typeof UpdateListingApiV1ListingsListingIdPutRequestSchema>, params: z.infer<typeof UpdateListingApiV1ListingsListingIdPutParamsSchema> })
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
    
    onError: (error: Error, variables: { body: z.infer<typeof UpdateListingApiV1ListingsListingIdPutRequestSchema>, params: z.infer<typeof UpdateListingApiV1ListingsListingIdPutParamsSchema> }) => {
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
        queryClient.invalidateQueries({ queryKey: ['listListingsApiV1ListingsGet'] }),
        queryClient.invalidateQueries({ queryKey: ['getListingApiV1ListingsListingIdGet'] }),
        queryClient.invalidateQueries({ queryKey: ['getFeaturedListingsApiV1ListingsPremiumFeaturedGet'] }),
        queryClient.invalidateQueries({ queryKey: ['getPremiumListingsApiV1ListingsPremiumPremiumGet'] }),
        queryClient.invalidateQueries({ queryKey: ['getPricingOptionsApiV1ListingsPremiumPricingGet'] }),
        queryClient.invalidateQueries({ queryKey: ['Listings'] })
      ])
    }
  })

  return {
    ...mutation,
    mutateWithTransition: (variables: { body: z.infer<typeof UpdateListingApiV1ListingsListingIdPutRequestSchema>, params: z.infer<typeof UpdateListingApiV1ListingsListingIdPutParamsSchema> }) => {
      startTransition(() => {
        mutation.mutate(variables)
      })
    },
    isPending: isPending || mutation.isPending,
    optimisticData
  }
}

/**
 * Optimized mutation hook for DELETE /api/v1/listings/{listing_id}
 * Features: Optimistic updates, smart invalidation, error handling
 * @param options - Mutation options
 * @returns Mutation result with enhanced features
 */
export function useDeleteListingApiV1ListingsListingIdDeleteMutation(options?: {
  onSuccess?: (data: z.infer<typeof DeleteListingApiV1ListingsListingIdDeleteResponseSchema>, variables: z.infer<typeof DeleteListingApiV1ListingsListingIdDeleteParamsSchema>) => void
  onError?: (error: Error, variables: z.infer<typeof DeleteListingApiV1ListingsListingIdDeleteParamsSchema>) => void
  optimisticUpdate?: (variables: z.infer<typeof DeleteListingApiV1ListingsListingIdDeleteParamsSchema>) => unknown
  showToast?: boolean
}) {
  const queryClient = useQueryClient()
  const [isPending, startTransition] = useTransition()
  const [optimisticData, setOptimisticData] = useOptimistic<unknown, z.infer<typeof DeleteListingApiV1ListingsListingIdDeleteParamsSchema>>(null, (_, newData) => newData)

  const mutation = useMutation({
    mutationFn: async (variables: z.infer<typeof DeleteListingApiV1ListingsListingIdDeleteParamsSchema>): Promise<z.infer<typeof DeleteListingApiV1ListingsListingIdDeleteResponseSchema>> => {
      try {
        const result = await resolveActionResult<z.infer<typeof DeleteListingApiV1ListingsListingIdDeleteResponseSchema>>(deleteListingApiV1ListingsListingIdDelete(variables))
        return (result ?? ({} as z.infer<typeof DeleteListingApiV1ListingsListingIdDeleteResponseSchema>))
      } catch (error) {
        handleActionError(error)
      }
    },
    
    onMutate: async (variables: z.infer<typeof DeleteListingApiV1ListingsListingIdDeleteParamsSchema>) => {
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
        setOptimisticData(optimisticValue as z.infer<typeof DeleteListingApiV1ListingsListingIdDeleteParamsSchema>)
      }
      
      return {}
    },
    
    onSuccess: (data, variables) => {
      // Show success toast
      if (options?.showToast !== false) {
        toast.success('Deleted successfully')
      }
      
      // Custom success handler
      options?.onSuccess?.(data, variables)
    },
    
    onError: (error: Error, variables: z.infer<typeof DeleteListingApiV1ListingsListingIdDeleteParamsSchema>) => {
      // Show error toast
      if (options?.showToast !== false) {
        toast.error(error.message || 'Failed to delete')
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
        queryClient.invalidateQueries({ queryKey: ['Listings'] })
      ])
    }
  })

  return {
    ...mutation,
    mutateWithTransition: (variables: z.infer<typeof DeleteListingApiV1ListingsListingIdDeleteParamsSchema>) => {
      startTransition(() => {
        mutation.mutate(variables)
      })
    },
    isPending: isPending || mutation.isPending,
    optimisticData
  }
}

/**
 * Optimized mutation hook for POST /api/v1/listings/{listing_id}/location
 * Features: Optimistic updates, smart invalidation, error handling
 * @param options - Mutation options
 * @returns Mutation result with enhanced features
 */
export function useCreateListingLocationApiV1ListingsListingIdLocationPostMutation(options?: {
  onSuccess?: (data: z.infer<typeof CreateListingLocationApiV1ListingsListingIdLocationPostResponseSchema>, variables: { body: z.infer<typeof CreateListingLocationApiV1ListingsListingIdLocationPostRequestSchema>, params: z.infer<typeof CreateListingLocationApiV1ListingsListingIdLocationPostParamsSchema> }) => void
  onError?: (error: Error, variables: { body: z.infer<typeof CreateListingLocationApiV1ListingsListingIdLocationPostRequestSchema>, params: z.infer<typeof CreateListingLocationApiV1ListingsListingIdLocationPostParamsSchema> }) => void
  optimisticUpdate?: (variables: { body: z.infer<typeof CreateListingLocationApiV1ListingsListingIdLocationPostRequestSchema>, params: z.infer<typeof CreateListingLocationApiV1ListingsListingIdLocationPostParamsSchema> }) => unknown
  showToast?: boolean
}) {
  const queryClient = useQueryClient()
  const [isPending, startTransition] = useTransition()
  const [optimisticData, setOptimisticData] = useOptimistic<unknown, { body: z.infer<typeof CreateListingLocationApiV1ListingsListingIdLocationPostRequestSchema>, params: z.infer<typeof CreateListingLocationApiV1ListingsListingIdLocationPostParamsSchema> }>(null, (_, newData) => newData)

  const mutation = useMutation({
    mutationFn: async (variables: { body: z.infer<typeof CreateListingLocationApiV1ListingsListingIdLocationPostRequestSchema>, params: z.infer<typeof CreateListingLocationApiV1ListingsListingIdLocationPostParamsSchema> }): Promise<z.infer<typeof CreateListingLocationApiV1ListingsListingIdLocationPostResponseSchema>> => {
      try {
        const result = await resolveActionResult<z.infer<typeof CreateListingLocationApiV1ListingsListingIdLocationPostResponseSchema>>(createListingLocationApiV1ListingsListingIdLocationPost(variables))
        return (result ?? ({} as z.infer<typeof CreateListingLocationApiV1ListingsListingIdLocationPostResponseSchema>))
      } catch (error) {
        handleActionError(error)
      }
    },
    
    onMutate: async (variables: { body: z.infer<typeof CreateListingLocationApiV1ListingsListingIdLocationPostRequestSchema>, params: z.infer<typeof CreateListingLocationApiV1ListingsListingIdLocationPostParamsSchema> }) => {
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
        setOptimisticData(optimisticValue as { body: z.infer<typeof CreateListingLocationApiV1ListingsListingIdLocationPostRequestSchema>, params: z.infer<typeof CreateListingLocationApiV1ListingsListingIdLocationPostParamsSchema> })
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
    
    onError: (error: Error, variables: { body: z.infer<typeof CreateListingLocationApiV1ListingsListingIdLocationPostRequestSchema>, params: z.infer<typeof CreateListingLocationApiV1ListingsListingIdLocationPostParamsSchema> }) => {
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
        queryClient.invalidateQueries({ queryKey: ['Listings'] })
      ])
    }
  })

  return {
    ...mutation,
    mutateWithTransition: (variables: { body: z.infer<typeof CreateListingLocationApiV1ListingsListingIdLocationPostRequestSchema>, params: z.infer<typeof CreateListingLocationApiV1ListingsListingIdLocationPostParamsSchema> }) => {
      startTransition(() => {
        mutation.mutate(variables)
      })
    },
    isPending: isPending || mutation.isPending,
    optimisticData
  }
}