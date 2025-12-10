'use client'
import { useQuery, useQueryClient, useSuspenseQuery, useMutation, useInfiniteQuery } from '@tanstack/react-query'
import { useOptimistic, useTransition } from 'react'
import { parseAsInteger, parseAsString, useQueryStates } from 'nuqs'
import { toast } from 'sonner'
import { listUsersApiV1AdminUsersGet, getUserApiV1AdminUsersUserIdGet, getUserStatsApiV1AdminUsersStatsGet, getDashboardMetricsApiV1AdminDashboardMetricsGet, getBookingTrendsApiV1AdminDashboardBookingTrendsGet, getPopularDestinationsApiV1AdminDashboardPopularDestinationsGet, listListingsApiV1AdminListingsGet, getListingApiV1AdminListingsListingIdGet, getListingStatsApiV1AdminListingsStatsGet, listBookingsApiV1AdminBookingsGet, getBookingApiV1AdminBookingsBookingIdGet, getBookingStatsApiV1AdminBookingsStatsGet, listPaymentsApiV1AdminPaymentsGet, getPaymentApiV1AdminPaymentsPaymentIdGet, getPaymentStatsApiV1AdminPaymentsStatsGet, updateUserApiV1AdminUsersUserIdPut, suspendUserApiV1AdminUsersUserIdSuspendPost, activateUserApiV1AdminUsersUserIdActivatePost } from '@/generated/actions/admin'
import {
  ListUsersApiV1AdminUsersGetResponseSchema,
  ListUsersApiV1AdminUsersGetParamsSchema,
  GetUserApiV1AdminUsersUserIdGetResponseSchema,
  GetUserApiV1AdminUsersUserIdGetParamsSchema,
  GetUserStatsApiV1AdminUsersStatsGetResponseSchema,
  GetDashboardMetricsApiV1AdminDashboardMetricsGetResponseSchema,
  GetDashboardMetricsApiV1AdminDashboardMetricsGetParamsSchema,
  GetBookingTrendsApiV1AdminDashboardBookingTrendsGetResponseSchema,
  GetBookingTrendsApiV1AdminDashboardBookingTrendsGetParamsSchema,
  GetPopularDestinationsApiV1AdminDashboardPopularDestinationsGetResponseSchema,
  GetPopularDestinationsApiV1AdminDashboardPopularDestinationsGetParamsSchema,
  ListListingsApiV1AdminListingsGetResponseSchema,
  ListListingsApiV1AdminListingsGetParamsSchema,
  GetListingApiV1AdminListingsListingIdGetResponseSchema,
  GetListingApiV1AdminListingsListingIdGetParamsSchema,
  GetListingStatsApiV1AdminListingsStatsGetResponseSchema,
  ListBookingsApiV1AdminBookingsGetResponseSchema,
  ListBookingsApiV1AdminBookingsGetParamsSchema,
  GetBookingApiV1AdminBookingsBookingIdGetResponseSchema,
  GetBookingApiV1AdminBookingsBookingIdGetParamsSchema,
  GetBookingStatsApiV1AdminBookingsStatsGetResponseSchema,
  ListPaymentsApiV1AdminPaymentsGetResponseSchema,
  ListPaymentsApiV1AdminPaymentsGetParamsSchema,
  GetPaymentApiV1AdminPaymentsPaymentIdGetResponseSchema,
  GetPaymentApiV1AdminPaymentsPaymentIdGetParamsSchema,
  GetPaymentStatsApiV1AdminPaymentsStatsGetResponseSchema,
  UpdateUserApiV1AdminUsersUserIdPutResponseSchema,
  UpdateUserApiV1AdminUsersUserIdPutRequestSchema,
  UpdateUserApiV1AdminUsersUserIdPutParamsSchema,
  SuspendUserApiV1AdminUsersUserIdSuspendPostResponseSchema,
  SuspendUserApiV1AdminUsersUserIdSuspendPostParamsSchema,
  ActivateUserApiV1AdminUsersUserIdActivatePostResponseSchema,
  ActivateUserApiV1AdminUsersUserIdActivatePostParamsSchema
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
 * Optimized query hook for GET /api/v1/admin/users
 * Features: Smart caching, error handling, type safety
 * @returns useQuery result with data of type z.infer<typeof ListUsersApiV1AdminUsersGetResponseSchema>
 */
export function useListUsersApiV1AdminUsersGet(skip?: number, limit?: number, role?: unknown, status?: unknown, search?: unknown, options?: { enabled?: boolean; suspense?: boolean; refetchInterval?: number; initialData?: z.infer<typeof ListUsersApiV1AdminUsersGetResponseSchema> }) {
  const { initialData, ...restOptions } = options ?? {}

  return useQuery({
    queryKey: ['listUsersApiV1AdminUsersGet', skip, limit, role, status, search],
    queryFn: async ({ signal }: { signal?: AbortSignal }) => {
      try {
        const result = await resolveActionResult<z.infer<typeof ListUsersApiV1AdminUsersGetResponseSchema>>(listUsersApiV1AdminUsersGet({ query: { skip, limit, role, status, search } }))
        return result
      } catch (error) {
        handleActionError(error)
      }
    },
    staleTime: 300000,
    gcTime: 600000, // React Query v5: gcTime replaces cacheTime
    enabled: true && (options?.enabled ?? true),
    refetchOnWindowFocus: true, // Refetch when window regains focus
    refetchOnReconnect: true, // Refetch when network reconnects
    refetchOnMount: 'always', // Always refetch on mount for fresh data
    refetchInterval: options?.refetchInterval, // Optional polling interval
    // React Query v5: placeholderData replaces keepPreviousData
    placeholderData: (previousData: z.infer<typeof ListUsersApiV1AdminUsersGetResponseSchema> | undefined) => previousData,
    retry: (failureCount: number, error: Error) => {
      // Don't retry on 4xx errors (client errors)
      if (error instanceof Error && error.message.includes('4')) return false
      // Retry up to 3 times for network/server errors
      return failureCount < 3
    },
    initialData: initialData as z.infer<typeof ListUsersApiV1AdminUsersGetResponseSchema> | undefined,
    ...restOptions
  })
}

/**
 * Suspense version for /api/v1/admin/users
 * @returns useSuspenseQuery result with data of type z.infer<typeof ListUsersApiV1AdminUsersGetResponseSchema>
 */
export function useSuspenseListUsersApiV1AdminUsersGet(skip?: number, limit?: number, role?: unknown, status?: unknown, search?: unknown, options?: { enabled?: boolean; suspense?: boolean; refetchInterval?: number; initialData?: z.infer<typeof ListUsersApiV1AdminUsersGetResponseSchema> }) {
  const { initialData, ...restOptions } = options ?? {}

  return useSuspenseQuery({
    queryKey: ['listUsersApiV1AdminUsersGet', skip, limit, role, status, search],
    queryFn: async () => {
      const result = await resolveActionResult<z.infer<typeof ListUsersApiV1AdminUsersGetResponseSchema>>(listUsersApiV1AdminUsersGet({ query: { skip, limit, role, status, search } }))
      return result
    },
    staleTime: 300000,
    initialData: initialData as z.infer<typeof ListUsersApiV1AdminUsersGetResponseSchema> | undefined,
    ...restOptions
  })
}

/**
 * Optimized query hook for GET /api/v1/admin/users/{user_id}
 * Features: Smart caching, error handling, type safety
 * @returns useQuery result with data of type z.infer<typeof GetUserApiV1AdminUsersUserIdGetResponseSchema>
 */
export function useGetUserApiV1AdminUsersUserIdGet(user_id: string, options?: { enabled?: boolean; suspense?: boolean; refetchInterval?: number; initialData?: z.infer<typeof GetUserApiV1AdminUsersUserIdGetResponseSchema> }) {
  const { initialData, ...restOptions } = options ?? {}

  return useQuery({
    queryKey: ['getUserApiV1AdminUsersUserIdGet', user_id],
    queryFn: async ({ signal }: { signal?: AbortSignal }) => {
      try {
        const result = await resolveActionResult<z.infer<typeof GetUserApiV1AdminUsersUserIdGetResponseSchema>>(getUserApiV1AdminUsersUserIdGet({ path: { user_id } }))
        return result
      } catch (error) {
        handleActionError(error)
      }
    },
    staleTime: 300000,
    gcTime: 600000, // React Query v5: gcTime replaces cacheTime
    enabled: !!user_id && (options?.enabled ?? true),
    refetchOnWindowFocus: true, // Refetch when window regains focus
    refetchOnReconnect: true, // Refetch when network reconnects
    refetchOnMount: 'always', // Always refetch on mount for fresh data
    refetchInterval: options?.refetchInterval, // Optional polling interval
    // React Query v5: placeholderData replaces keepPreviousData
    placeholderData: (previousData: z.infer<typeof GetUserApiV1AdminUsersUserIdGetResponseSchema> | undefined) => previousData,
    retry: (failureCount: number, error: Error) => {
      // Don't retry on 4xx errors (client errors)
      if (error instanceof Error && error.message.includes('4')) return false
      // Retry up to 3 times for network/server errors
      return failureCount < 3
    },
    initialData: initialData as z.infer<typeof GetUserApiV1AdminUsersUserIdGetResponseSchema> | undefined,
    ...restOptions
  })
}

/**
 * Suspense version for /api/v1/admin/users/{user_id}
 * @returns useSuspenseQuery result with data of type z.infer<typeof GetUserApiV1AdminUsersUserIdGetResponseSchema>
 */
export function useSuspenseGetUserApiV1AdminUsersUserIdGet(user_id: string, options?: { enabled?: boolean; suspense?: boolean; refetchInterval?: number; initialData?: z.infer<typeof GetUserApiV1AdminUsersUserIdGetResponseSchema> }) {
  const { initialData, ...restOptions } = options ?? {}

  return useSuspenseQuery({
    queryKey: ['getUserApiV1AdminUsersUserIdGet', user_id],
    queryFn: async () => {
      const result = await resolveActionResult<z.infer<typeof GetUserApiV1AdminUsersUserIdGetResponseSchema>>(getUserApiV1AdminUsersUserIdGet({ path: { user_id } }))
      return result
    },
    staleTime: 300000,
    initialData: initialData as z.infer<typeof GetUserApiV1AdminUsersUserIdGetResponseSchema> | undefined,
    ...restOptions
  })
}

/**
 * Optimized query hook for GET /api/v1/admin/users/stats
 * Features: Smart caching, error handling, type safety
 * @returns useQuery result with data of type z.infer<typeof GetUserStatsApiV1AdminUsersStatsGetResponseSchema>
 */
export function useGetUserStatsApiV1AdminUsersStatsGet(options?: { enabled?: boolean; suspense?: boolean; refetchInterval?: number; initialData?: z.infer<typeof GetUserStatsApiV1AdminUsersStatsGetResponseSchema> }) {
  const { initialData, ...restOptions } = options ?? {}

  return useQuery({
    queryKey: ['getUserStatsApiV1AdminUsersStatsGet'],
    queryFn: async ({ signal }: { signal?: AbortSignal }) => {
      try {
        const result = await resolveActionResult<z.infer<typeof GetUserStatsApiV1AdminUsersStatsGetResponseSchema>>(getUserStatsApiV1AdminUsersStatsGet())
        return result
      } catch (error) {
        handleActionError(error)
      }
    },
    staleTime: 300000,
    gcTime: 600000, // React Query v5: gcTime replaces cacheTime
    enabled: true && (options?.enabled ?? true),
    refetchOnWindowFocus: true, // Refetch when window regains focus
    refetchOnReconnect: true, // Refetch when network reconnects
    refetchOnMount: 'always', // Always refetch on mount for fresh data
    refetchInterval: options?.refetchInterval, // Optional polling interval
    // React Query v5: placeholderData replaces keepPreviousData
    placeholderData: (previousData: z.infer<typeof GetUserStatsApiV1AdminUsersStatsGetResponseSchema> | undefined) => previousData,
    retry: (failureCount: number, error: Error) => {
      // Don't retry on 4xx errors (client errors)
      if (error instanceof Error && error.message.includes('4')) return false
      // Retry up to 3 times for network/server errors
      return failureCount < 3
    },
    initialData: initialData as z.infer<typeof GetUserStatsApiV1AdminUsersStatsGetResponseSchema> | undefined,
    ...restOptions
  })
}

/**
 * Suspense version for /api/v1/admin/users/stats
 * @returns useSuspenseQuery result with data of type z.infer<typeof GetUserStatsApiV1AdminUsersStatsGetResponseSchema>
 */
export function useSuspenseGetUserStatsApiV1AdminUsersStatsGet(options?: { enabled?: boolean; suspense?: boolean; refetchInterval?: number; initialData?: z.infer<typeof GetUserStatsApiV1AdminUsersStatsGetResponseSchema> }) {
  const { initialData, ...restOptions } = options ?? {}

  return useSuspenseQuery({
    queryKey: ['getUserStatsApiV1AdminUsersStatsGet'],
    queryFn: async () => {
      const result = await resolveActionResult<z.infer<typeof GetUserStatsApiV1AdminUsersStatsGetResponseSchema>>(getUserStatsApiV1AdminUsersStatsGet())
      return result
    },
    staleTime: 300000,
    initialData: initialData as z.infer<typeof GetUserStatsApiV1AdminUsersStatsGetResponseSchema> | undefined,
    ...restOptions
  })
}

/**
 * Optimized query hook for GET /api/v1/admin/dashboard/metrics
 * Features: Smart caching, error handling, type safety
 * @returns useQuery result with data of type z.infer<typeof GetDashboardMetricsApiV1AdminDashboardMetricsGetResponseSchema>
 */
export function useGetDashboardMetricsApiV1AdminDashboardMetricsGet(start_date?: unknown, end_date?: unknown, options?: { enabled?: boolean; suspense?: boolean; refetchInterval?: number; initialData?: z.infer<typeof GetDashboardMetricsApiV1AdminDashboardMetricsGetResponseSchema> }) {
  const { initialData, ...restOptions } = options ?? {}

  return useQuery({
    queryKey: ['getDashboardMetricsApiV1AdminDashboardMetricsGet', start_date, end_date],
    queryFn: async ({ signal }: { signal?: AbortSignal }) => {
      try {
        const result = await resolveActionResult<z.infer<typeof GetDashboardMetricsApiV1AdminDashboardMetricsGetResponseSchema>>(getDashboardMetricsApiV1AdminDashboardMetricsGet({ query: { start_date, end_date } }))
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
    placeholderData: (previousData: z.infer<typeof GetDashboardMetricsApiV1AdminDashboardMetricsGetResponseSchema> | undefined) => previousData,
    retry: (failureCount: number, error: Error) => {
      // Don't retry on 4xx errors (client errors)
      if (error instanceof Error && error.message.includes('4')) return false
      // Retry up to 3 times for network/server errors
      return failureCount < 3
    },
    initialData: initialData as z.infer<typeof GetDashboardMetricsApiV1AdminDashboardMetricsGetResponseSchema> | undefined,
    ...restOptions
  })
}

/**
 * Suspense version for /api/v1/admin/dashboard/metrics
 * @returns useSuspenseQuery result with data of type z.infer<typeof GetDashboardMetricsApiV1AdminDashboardMetricsGetResponseSchema>
 */
export function useSuspenseGetDashboardMetricsApiV1AdminDashboardMetricsGet(start_date?: unknown, end_date?: unknown, options?: { enabled?: boolean; suspense?: boolean; refetchInterval?: number; initialData?: z.infer<typeof GetDashboardMetricsApiV1AdminDashboardMetricsGetResponseSchema> }) {
  const { initialData, ...restOptions } = options ?? {}

  return useSuspenseQuery({
    queryKey: ['getDashboardMetricsApiV1AdminDashboardMetricsGet', start_date, end_date],
    queryFn: async () => {
      const result = await resolveActionResult<z.infer<typeof GetDashboardMetricsApiV1AdminDashboardMetricsGetResponseSchema>>(getDashboardMetricsApiV1AdminDashboardMetricsGet({ query: { start_date, end_date } }))
      return result
    },
    staleTime: 180000,
    initialData: initialData as z.infer<typeof GetDashboardMetricsApiV1AdminDashboardMetricsGetResponseSchema> | undefined,
    ...restOptions
  })
}

/**
 * Optimized query hook for GET /api/v1/admin/dashboard/booking-trends
 * Features: Smart caching, error handling, type safety
 * @returns useQuery result with data of type z.infer<typeof GetBookingTrendsApiV1AdminDashboardBookingTrendsGetResponseSchema>
 */
export function useGetBookingTrendsApiV1AdminDashboardBookingTrendsGet(days?: number, options?: { enabled?: boolean; suspense?: boolean; refetchInterval?: number; initialData?: z.infer<typeof GetBookingTrendsApiV1AdminDashboardBookingTrendsGetResponseSchema> }) {
  const { initialData, ...restOptions } = options ?? {}

  return useQuery({
    queryKey: ['getBookingTrendsApiV1AdminDashboardBookingTrendsGet', days],
    queryFn: async ({ signal }: { signal?: AbortSignal }) => {
      try {
        const result = await resolveActionResult<z.infer<typeof GetBookingTrendsApiV1AdminDashboardBookingTrendsGetResponseSchema>>(getBookingTrendsApiV1AdminDashboardBookingTrendsGet({ query: { days } }))
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
    placeholderData: (previousData: z.infer<typeof GetBookingTrendsApiV1AdminDashboardBookingTrendsGetResponseSchema> | undefined) => previousData,
    retry: (failureCount: number, error: Error) => {
      // Don't retry on 4xx errors (client errors)
      if (error instanceof Error && error.message.includes('4')) return false
      // Retry up to 3 times for network/server errors
      return failureCount < 3
    },
    initialData: initialData as z.infer<typeof GetBookingTrendsApiV1AdminDashboardBookingTrendsGetResponseSchema> | undefined,
    ...restOptions
  })
}

/**
 * Suspense version for /api/v1/admin/dashboard/booking-trends
 * @returns useSuspenseQuery result with data of type z.infer<typeof GetBookingTrendsApiV1AdminDashboardBookingTrendsGetResponseSchema>
 */
export function useSuspenseGetBookingTrendsApiV1AdminDashboardBookingTrendsGet(days?: number, options?: { enabled?: boolean; suspense?: boolean; refetchInterval?: number; initialData?: z.infer<typeof GetBookingTrendsApiV1AdminDashboardBookingTrendsGetResponseSchema> }) {
  const { initialData, ...restOptions } = options ?? {}

  return useSuspenseQuery({
    queryKey: ['getBookingTrendsApiV1AdminDashboardBookingTrendsGet', days],
    queryFn: async () => {
      const result = await resolveActionResult<z.infer<typeof GetBookingTrendsApiV1AdminDashboardBookingTrendsGetResponseSchema>>(getBookingTrendsApiV1AdminDashboardBookingTrendsGet({ query: { days } }))
      return result
    },
    staleTime: 180000,
    initialData: initialData as z.infer<typeof GetBookingTrendsApiV1AdminDashboardBookingTrendsGetResponseSchema> | undefined,
    ...restOptions
  })
}

/**
 * Optimized query hook for GET /api/v1/admin/dashboard/popular-destinations
 * Features: Smart caching, error handling, type safety
 * @returns useQuery result with data of type z.infer<typeof GetPopularDestinationsApiV1AdminDashboardPopularDestinationsGetResponseSchema>
 */
export function useGetPopularDestinationsApiV1AdminDashboardPopularDestinationsGet(limit?: number, days?: number, options?: { enabled?: boolean; suspense?: boolean; refetchInterval?: number; initialData?: z.infer<typeof GetPopularDestinationsApiV1AdminDashboardPopularDestinationsGetResponseSchema> }) {
  const { initialData, ...restOptions } = options ?? {}

  return useQuery({
    queryKey: ['getPopularDestinationsApiV1AdminDashboardPopularDestinationsGet', limit, days],
    queryFn: async ({ signal }: { signal?: AbortSignal }) => {
      try {
        const result = await resolveActionResult<z.infer<typeof GetPopularDestinationsApiV1AdminDashboardPopularDestinationsGetResponseSchema>>(getPopularDestinationsApiV1AdminDashboardPopularDestinationsGet({ query: { limit, days } }))
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
    placeholderData: (previousData: z.infer<typeof GetPopularDestinationsApiV1AdminDashboardPopularDestinationsGetResponseSchema> | undefined) => previousData,
    retry: (failureCount: number, error: Error) => {
      // Don't retry on 4xx errors (client errors)
      if (error instanceof Error && error.message.includes('4')) return false
      // Retry up to 3 times for network/server errors
      return failureCount < 3
    },
    initialData: initialData as z.infer<typeof GetPopularDestinationsApiV1AdminDashboardPopularDestinationsGetResponseSchema> | undefined,
    ...restOptions
  })
}

/**
 * Suspense version for /api/v1/admin/dashboard/popular-destinations
 * @returns useSuspenseQuery result with data of type z.infer<typeof GetPopularDestinationsApiV1AdminDashboardPopularDestinationsGetResponseSchema>
 */
export function useSuspenseGetPopularDestinationsApiV1AdminDashboardPopularDestinationsGet(limit?: number, days?: number, options?: { enabled?: boolean; suspense?: boolean; refetchInterval?: number; initialData?: z.infer<typeof GetPopularDestinationsApiV1AdminDashboardPopularDestinationsGetResponseSchema> }) {
  const { initialData, ...restOptions } = options ?? {}

  return useSuspenseQuery({
    queryKey: ['getPopularDestinationsApiV1AdminDashboardPopularDestinationsGet', limit, days],
    queryFn: async () => {
      const result = await resolveActionResult<z.infer<typeof GetPopularDestinationsApiV1AdminDashboardPopularDestinationsGetResponseSchema>>(getPopularDestinationsApiV1AdminDashboardPopularDestinationsGet({ query: { limit, days } }))
      return result
    },
    staleTime: 180000,
    initialData: initialData as z.infer<typeof GetPopularDestinationsApiV1AdminDashboardPopularDestinationsGetResponseSchema> | undefined,
    ...restOptions
  })
}

/**
 * Optimized query hook for GET /api/v1/admin/listings
 * Features: URL state sync, infinite loading, optimistic updates
 * @returns useQuery result with data of type z.infer<typeof ListListingsApiV1AdminListingsGetResponseSchema>
 */
export function useListListingsApiV1AdminListingsGet(skip?: number, limit?: number, status?: unknown, search?: unknown, options?: { enabled?: boolean; suspense?: boolean; refetchInterval?: number; initialData?: z.infer<typeof ListListingsApiV1AdminListingsGetResponseSchema> }) {
  const [searchParams] = useQueryStates(searchParamsParser)
  const { initialData, ...restOptions } = options ?? {}
  
  return useQuery({
    queryKey: [...['listListingsApiV1AdminListingsGet', skip, limit, status, search], searchParams],
    queryFn: async ({ signal }: { signal?: AbortSignal }) => {
      try {
        // Build query params object with only the parameters the endpoint expects
        const queryParams: { skip?: number; limit?: number; status?: unknown; search?: unknown } = {
          skip: skip !== undefined ? skip : undefined,
          limit: limit !== undefined ? limit : searchParams.limit,
          status: status !== undefined ? status : undefined,
          search: search !== undefined ? search : undefined
        }
        const result = await resolveActionResult<z.infer<typeof ListListingsApiV1AdminListingsGetResponseSchema>>(listListingsApiV1AdminListingsGet({ query: queryParams }))
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
    placeholderData: (previousData: z.infer<typeof ListListingsApiV1AdminListingsGetResponseSchema> | undefined) => previousData,
    retry: (failureCount: number, error: Error) => {
      // Don't retry on 4xx errors (client errors)
      if (error instanceof Error && error.message.includes('4')) return false
      // Retry up to 3 times for network/server errors
      return failureCount < 3
    },
    initialData: initialData as z.infer<typeof ListListingsApiV1AdminListingsGetResponseSchema> | undefined,
    ...restOptions
  })
}

/**
 * Infinite query version for paginated /api/v1/admin/listings
 * @returns useInfiniteQuery result with data of type z.infer<typeof ListListingsApiV1AdminListingsGetResponseSchema>
 */
export function useInfiniteListListingsApiV1AdminListingsGet(skip?: number, limit?: number, status?: unknown, search?: unknown, options?: { enabled?: boolean; suspense?: boolean; refetchInterval?: number; initialData?: z.infer<typeof ListListingsApiV1AdminListingsGetResponseSchema> }) {
  const [searchParams] = useQueryStates(searchParamsParser)
  const { initialData, ...restOptions } = options ?? {}

  return useInfiniteQuery({
    queryKey: [...['listListingsApiV1AdminListingsGet', skip, limit, status, search], 'infinite', searchParams],
    initialPageParam: 1,
    queryFn: async ({ pageParam = 1, signal }: { pageParam?: number; signal?: AbortSignal }) => {
      try {
        // Build query params object with only the parameters the endpoint expects
        const queryParams: { skip?: number; limit?: number; status?: unknown; search?: unknown } = {
          skip: skip !== undefined ? skip : undefined,
          limit: limit !== undefined ? limit : searchParams.limit,
          status: status !== undefined ? status : undefined,
          search: search !== undefined ? search : undefined
        }
        const result = await resolveActionResult<z.infer<typeof ListListingsApiV1AdminListingsGetResponseSchema>>(listListingsApiV1AdminListingsGet({ query: queryParams }))
        return result
      } catch (error) {
        handleActionError(error)
      }
    },
    getNextPageParam: (lastPage: z.infer<typeof ListListingsApiV1AdminListingsGetResponseSchema>, allPages: z.infer<typeof ListListingsApiV1AdminListingsGetResponseSchema>[]) => {
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
 * Suspense version for /api/v1/admin/listings - use in Server Components
 * @returns useSuspenseQuery result with data of type z.infer<typeof ListListingsApiV1AdminListingsGetResponseSchema>
 */
export function useSuspenseListListingsApiV1AdminListingsGet(skip?: number, limit?: number, status?: unknown, search?: unknown, options?: { enabled?: boolean; suspense?: boolean; refetchInterval?: number; initialData?: z.infer<typeof ListListingsApiV1AdminListingsGetResponseSchema> }) {
  const { initialData, ...restOptions } = options ?? {}

  return useSuspenseQuery({
    queryKey: ['listListingsApiV1AdminListingsGet', skip, limit, status, search],
    queryFn: async () => {
      const result = await resolveActionResult<z.infer<typeof ListListingsApiV1AdminListingsGetResponseSchema>>(listListingsApiV1AdminListingsGet({ query: { skip, limit, status, search } }))
      return result
    },
    staleTime: 180000,
    initialData: initialData as z.infer<typeof ListListingsApiV1AdminListingsGetResponseSchema> | undefined,
    ...restOptions
  })
}

/**
 * Optimized query hook for GET /api/v1/admin/listings/{listing_id}
 * Features: URL state sync, infinite loading, optimistic updates
 * @returns useQuery result with data of type z.infer<typeof GetListingApiV1AdminListingsListingIdGetResponseSchema>
 */
export function useGetListingApiV1AdminListingsListingIdGet(listing_id: string, options?: { enabled?: boolean; suspense?: boolean; refetchInterval?: number; initialData?: z.infer<typeof GetListingApiV1AdminListingsListingIdGetResponseSchema> }) {
  const [searchParams] = useQueryStates(searchParamsParser)
  const { initialData, ...restOptions } = options ?? {}
  
  return useQuery({
    queryKey: [...['getListingApiV1AdminListingsListingIdGet', listing_id], searchParams],
    queryFn: async ({ signal }: { signal?: AbortSignal }) => {
      try {
        
        const result = await resolveActionResult<z.infer<typeof GetListingApiV1AdminListingsListingIdGetResponseSchema>>(getListingApiV1AdminListingsListingIdGet({ path: { listing_id } }))
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
    placeholderData: (previousData: z.infer<typeof GetListingApiV1AdminListingsListingIdGetResponseSchema> | undefined) => previousData,
    retry: (failureCount: number, error: Error) => {
      // Don't retry on 4xx errors (client errors)
      if (error instanceof Error && error.message.includes('4')) return false
      // Retry up to 3 times for network/server errors
      return failureCount < 3
    },
    initialData: initialData as z.infer<typeof GetListingApiV1AdminListingsListingIdGetResponseSchema> | undefined,
    ...restOptions
  })
}

/**
 * Infinite query version for paginated /api/v1/admin/listings/{listing_id}
 * @returns useInfiniteQuery result with data of type z.infer<typeof GetListingApiV1AdminListingsListingIdGetResponseSchema>
 */
export function useInfiniteGetListingApiV1AdminListingsListingIdGet(listing_id: string, options?: { enabled?: boolean; suspense?: boolean; refetchInterval?: number; initialData?: z.infer<typeof GetListingApiV1AdminListingsListingIdGetResponseSchema> }) {
  const [searchParams] = useQueryStates(searchParamsParser)
  const { initialData, ...restOptions } = options ?? {}

  return useInfiniteQuery({
    queryKey: [...['getListingApiV1AdminListingsListingIdGet', listing_id], 'infinite', searchParams],
    initialPageParam: 1,
    queryFn: async ({ pageParam = 1, signal }: { pageParam?: number; signal?: AbortSignal }) => {
      try {
        // Build query params object with only the parameters the endpoint expects
        const queryParams: {  } = {
          
        }
        const result = await resolveActionResult<z.infer<typeof GetListingApiV1AdminListingsListingIdGetResponseSchema>>(getListingApiV1AdminListingsListingIdGet({ path: { listing_id } }))
        return result
      } catch (error) {
        handleActionError(error)
      }
    },
    getNextPageParam: (lastPage: z.infer<typeof GetListingApiV1AdminListingsListingIdGetResponseSchema>, allPages: z.infer<typeof GetListingApiV1AdminListingsListingIdGetResponseSchema>[]) => {
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
 * Suspense version for /api/v1/admin/listings/{listing_id} - use in Server Components
 * @returns useSuspenseQuery result with data of type z.infer<typeof GetListingApiV1AdminListingsListingIdGetResponseSchema>
 */
export function useSuspenseGetListingApiV1AdminListingsListingIdGet(listing_id: string, options?: { enabled?: boolean; suspense?: boolean; refetchInterval?: number; initialData?: z.infer<typeof GetListingApiV1AdminListingsListingIdGetResponseSchema> }) {
  const { initialData, ...restOptions } = options ?? {}

  return useSuspenseQuery({
    queryKey: ['getListingApiV1AdminListingsListingIdGet', listing_id],
    queryFn: async () => {
      const result = await resolveActionResult<z.infer<typeof GetListingApiV1AdminListingsListingIdGetResponseSchema>>(getListingApiV1AdminListingsListingIdGet({ path: { listing_id } }))
      return result
    },
    staleTime: 180000,
    initialData: initialData as z.infer<typeof GetListingApiV1AdminListingsListingIdGetResponseSchema> | undefined,
    ...restOptions
  })
}

/**
 * Optimized query hook for GET /api/v1/admin/listings/stats
 * Features: URL state sync, infinite loading, optimistic updates
 * @returns useQuery result with data of type z.infer<typeof GetListingStatsApiV1AdminListingsStatsGetResponseSchema>
 */
export function useGetListingStatsApiV1AdminListingsStatsGet(options?: { enabled?: boolean; suspense?: boolean; refetchInterval?: number; initialData?: z.infer<typeof GetListingStatsApiV1AdminListingsStatsGetResponseSchema> }) {
  const [searchParams] = useQueryStates(searchParamsParser)
  const { initialData, ...restOptions } = options ?? {}
  
  return useQuery({
    queryKey: [...['getListingStatsApiV1AdminListingsStatsGet'], searchParams],
    queryFn: async ({ signal }: { signal?: AbortSignal }) => {
      try {
        
        const result = await resolveActionResult<z.infer<typeof GetListingStatsApiV1AdminListingsStatsGetResponseSchema>>(getListingStatsApiV1AdminListingsStatsGet())
        return result
      } catch (error) {
        handleActionError(error)
      }
    },
    staleTime: 60000,
    gcTime: 120000, // React Query v5: gcTime replaces cacheTime
    enabled: true && (options?.enabled ?? true),
    refetchOnWindowFocus: true, // Refetch when window regains focus
    refetchOnReconnect: true, // Refetch when network reconnects
    refetchOnMount: 'always', // Always refetch on mount for fresh data
    refetchInterval: options?.refetchInterval, // Optional polling interval
    // React Query v5: placeholderData replaces keepPreviousData
    placeholderData: (previousData: z.infer<typeof GetListingStatsApiV1AdminListingsStatsGetResponseSchema> | undefined) => previousData,
    retry: (failureCount: number, error: Error) => {
      // Don't retry on 4xx errors (client errors)
      if (error instanceof Error && error.message.includes('4')) return false
      // Retry up to 3 times for network/server errors
      return failureCount < 3
    },
    initialData: initialData as z.infer<typeof GetListingStatsApiV1AdminListingsStatsGetResponseSchema> | undefined,
    ...restOptions
  })
}

/**
 * Infinite query version for paginated /api/v1/admin/listings/stats
 * @returns useInfiniteQuery result with data of type z.infer<typeof GetListingStatsApiV1AdminListingsStatsGetResponseSchema>
 */
export function useInfiniteGetListingStatsApiV1AdminListingsStatsGet(options?: { enabled?: boolean; suspense?: boolean; refetchInterval?: number; initialData?: z.infer<typeof GetListingStatsApiV1AdminListingsStatsGetResponseSchema> }) {
  const [searchParams] = useQueryStates(searchParamsParser)
  const { initialData, ...restOptions } = options ?? {}

  return useInfiniteQuery({
    queryKey: [...['getListingStatsApiV1AdminListingsStatsGet'], 'infinite', searchParams],
    initialPageParam: 1,
    queryFn: async ({ pageParam = 1, signal }: { pageParam?: number; signal?: AbortSignal }) => {
      try {
        // Build query params object with only the parameters the endpoint expects
        const queryParams: {  } = {
          
        }
        const result = await resolveActionResult<z.infer<typeof GetListingStatsApiV1AdminListingsStatsGetResponseSchema>>(getListingStatsApiV1AdminListingsStatsGet())
        return result
      } catch (error) {
        handleActionError(error)
      }
    },
    getNextPageParam: (lastPage: z.infer<typeof GetListingStatsApiV1AdminListingsStatsGetResponseSchema>, allPages: z.infer<typeof GetListingStatsApiV1AdminListingsStatsGetResponseSchema>[]) => {
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
    staleTime: 60000,
    gcTime: 120000,
    enabled: true && (options?.enabled ?? true),
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchOnMount: 'always',
    retry: 3,
    ...restOptions
  })
}

/**
 * Suspense version for /api/v1/admin/listings/stats - use in Server Components
 * @returns useSuspenseQuery result with data of type z.infer<typeof GetListingStatsApiV1AdminListingsStatsGetResponseSchema>
 */
export function useSuspenseGetListingStatsApiV1AdminListingsStatsGet(options?: { enabled?: boolean; suspense?: boolean; refetchInterval?: number; initialData?: z.infer<typeof GetListingStatsApiV1AdminListingsStatsGetResponseSchema> }) {
  const { initialData, ...restOptions } = options ?? {}

  return useSuspenseQuery({
    queryKey: ['getListingStatsApiV1AdminListingsStatsGet'],
    queryFn: async () => {
      const result = await resolveActionResult<z.infer<typeof GetListingStatsApiV1AdminListingsStatsGetResponseSchema>>(getListingStatsApiV1AdminListingsStatsGet())
      return result
    },
    staleTime: 60000,
    initialData: initialData as z.infer<typeof GetListingStatsApiV1AdminListingsStatsGetResponseSchema> | undefined,
    ...restOptions
  })
}

/**
 * Optimized query hook for GET /api/v1/admin/bookings
 * Features: Smart caching, error handling, type safety
 * @returns useQuery result with data of type z.infer<typeof ListBookingsApiV1AdminBookingsGetResponseSchema>
 */
export function useListBookingsApiV1AdminBookingsGet(skip?: number, limit?: number, status?: unknown, options?: { enabled?: boolean; suspense?: boolean; refetchInterval?: number; initialData?: z.infer<typeof ListBookingsApiV1AdminBookingsGetResponseSchema> }) {
  const { initialData, ...restOptions } = options ?? {}

  return useQuery({
    queryKey: ['listBookingsApiV1AdminBookingsGet', skip, limit, status],
    queryFn: async ({ signal }: { signal?: AbortSignal }) => {
      try {
        const result = await resolveActionResult<z.infer<typeof ListBookingsApiV1AdminBookingsGetResponseSchema>>(listBookingsApiV1AdminBookingsGet({ query: { skip, limit, status } }))
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
    placeholderData: (previousData: z.infer<typeof ListBookingsApiV1AdminBookingsGetResponseSchema> | undefined) => previousData,
    retry: (failureCount: number, error: Error) => {
      // Don't retry on 4xx errors (client errors)
      if (error instanceof Error && error.message.includes('4')) return false
      // Retry up to 3 times for network/server errors
      return failureCount < 3
    },
    initialData: initialData as z.infer<typeof ListBookingsApiV1AdminBookingsGetResponseSchema> | undefined,
    ...restOptions
  })
}

/**
 * Suspense version for /api/v1/admin/bookings
 * @returns useSuspenseQuery result with data of type z.infer<typeof ListBookingsApiV1AdminBookingsGetResponseSchema>
 */
export function useSuspenseListBookingsApiV1AdminBookingsGet(skip?: number, limit?: number, status?: unknown, options?: { enabled?: boolean; suspense?: boolean; refetchInterval?: number; initialData?: z.infer<typeof ListBookingsApiV1AdminBookingsGetResponseSchema> }) {
  const { initialData, ...restOptions } = options ?? {}

  return useSuspenseQuery({
    queryKey: ['listBookingsApiV1AdminBookingsGet', skip, limit, status],
    queryFn: async () => {
      const result = await resolveActionResult<z.infer<typeof ListBookingsApiV1AdminBookingsGetResponseSchema>>(listBookingsApiV1AdminBookingsGet({ query: { skip, limit, status } }))
      return result
    },
    staleTime: 180000,
    initialData: initialData as z.infer<typeof ListBookingsApiV1AdminBookingsGetResponseSchema> | undefined,
    ...restOptions
  })
}

/**
 * Optimized query hook for GET /api/v1/admin/bookings/{booking_id}
 * Features: Smart caching, error handling, type safety
 * @returns useQuery result with data of type z.infer<typeof GetBookingApiV1AdminBookingsBookingIdGetResponseSchema>
 */
export function useGetBookingApiV1AdminBookingsBookingIdGet(booking_id: string, options?: { enabled?: boolean; suspense?: boolean; refetchInterval?: number; initialData?: z.infer<typeof GetBookingApiV1AdminBookingsBookingIdGetResponseSchema> }) {
  const { initialData, ...restOptions } = options ?? {}

  return useQuery({
    queryKey: ['getBookingApiV1AdminBookingsBookingIdGet', booking_id],
    queryFn: async ({ signal }: { signal?: AbortSignal }) => {
      try {
        const result = await resolveActionResult<z.infer<typeof GetBookingApiV1AdminBookingsBookingIdGetResponseSchema>>(getBookingApiV1AdminBookingsBookingIdGet({ path: { booking_id } }))
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
    placeholderData: (previousData: z.infer<typeof GetBookingApiV1AdminBookingsBookingIdGetResponseSchema> | undefined) => previousData,
    retry: (failureCount: number, error: Error) => {
      // Don't retry on 4xx errors (client errors)
      if (error instanceof Error && error.message.includes('4')) return false
      // Retry up to 3 times for network/server errors
      return failureCount < 3
    },
    initialData: initialData as z.infer<typeof GetBookingApiV1AdminBookingsBookingIdGetResponseSchema> | undefined,
    ...restOptions
  })
}

/**
 * Suspense version for /api/v1/admin/bookings/{booking_id}
 * @returns useSuspenseQuery result with data of type z.infer<typeof GetBookingApiV1AdminBookingsBookingIdGetResponseSchema>
 */
export function useSuspenseGetBookingApiV1AdminBookingsBookingIdGet(booking_id: string, options?: { enabled?: boolean; suspense?: boolean; refetchInterval?: number; initialData?: z.infer<typeof GetBookingApiV1AdminBookingsBookingIdGetResponseSchema> }) {
  const { initialData, ...restOptions } = options ?? {}

  return useSuspenseQuery({
    queryKey: ['getBookingApiV1AdminBookingsBookingIdGet', booking_id],
    queryFn: async () => {
      const result = await resolveActionResult<z.infer<typeof GetBookingApiV1AdminBookingsBookingIdGetResponseSchema>>(getBookingApiV1AdminBookingsBookingIdGet({ path: { booking_id } }))
      return result
    },
    staleTime: 180000,
    initialData: initialData as z.infer<typeof GetBookingApiV1AdminBookingsBookingIdGetResponseSchema> | undefined,
    ...restOptions
  })
}

/**
 * Optimized query hook for GET /api/v1/admin/bookings/stats
 * Features: Smart caching, error handling, type safety
 * @returns useQuery result with data of type z.infer<typeof GetBookingStatsApiV1AdminBookingsStatsGetResponseSchema>
 */
export function useGetBookingStatsApiV1AdminBookingsStatsGet(options?: { enabled?: boolean; suspense?: boolean; refetchInterval?: number; initialData?: z.infer<typeof GetBookingStatsApiV1AdminBookingsStatsGetResponseSchema> }) {
  const { initialData, ...restOptions } = options ?? {}

  return useQuery({
    queryKey: ['getBookingStatsApiV1AdminBookingsStatsGet'],
    queryFn: async ({ signal }: { signal?: AbortSignal }) => {
      try {
        const result = await resolveActionResult<z.infer<typeof GetBookingStatsApiV1AdminBookingsStatsGetResponseSchema>>(getBookingStatsApiV1AdminBookingsStatsGet())
        return result
      } catch (error) {
        handleActionError(error)
      }
    },
    staleTime: 60000,
    gcTime: 120000, // React Query v5: gcTime replaces cacheTime
    enabled: true && (options?.enabled ?? true),
    refetchOnWindowFocus: true, // Refetch when window regains focus
    refetchOnReconnect: true, // Refetch when network reconnects
    refetchOnMount: 'always', // Always refetch on mount for fresh data
    refetchInterval: options?.refetchInterval, // Optional polling interval
    // React Query v5: placeholderData replaces keepPreviousData
    placeholderData: (previousData: z.infer<typeof GetBookingStatsApiV1AdminBookingsStatsGetResponseSchema> | undefined) => previousData,
    retry: (failureCount: number, error: Error) => {
      // Don't retry on 4xx errors (client errors)
      if (error instanceof Error && error.message.includes('4')) return false
      // Retry up to 3 times for network/server errors
      return failureCount < 3
    },
    initialData: initialData as z.infer<typeof GetBookingStatsApiV1AdminBookingsStatsGetResponseSchema> | undefined,
    ...restOptions
  })
}

/**
 * Suspense version for /api/v1/admin/bookings/stats
 * @returns useSuspenseQuery result with data of type z.infer<typeof GetBookingStatsApiV1AdminBookingsStatsGetResponseSchema>
 */
export function useSuspenseGetBookingStatsApiV1AdminBookingsStatsGet(options?: { enabled?: boolean; suspense?: boolean; refetchInterval?: number; initialData?: z.infer<typeof GetBookingStatsApiV1AdminBookingsStatsGetResponseSchema> }) {
  const { initialData, ...restOptions } = options ?? {}

  return useSuspenseQuery({
    queryKey: ['getBookingStatsApiV1AdminBookingsStatsGet'],
    queryFn: async () => {
      const result = await resolveActionResult<z.infer<typeof GetBookingStatsApiV1AdminBookingsStatsGetResponseSchema>>(getBookingStatsApiV1AdminBookingsStatsGet())
      return result
    },
    staleTime: 60000,
    initialData: initialData as z.infer<typeof GetBookingStatsApiV1AdminBookingsStatsGetResponseSchema> | undefined,
    ...restOptions
  })
}

/**
 * Optimized query hook for GET /api/v1/admin/payments
 * Features: Smart caching, error handling, type safety
 * @returns useQuery result with data of type z.infer<typeof ListPaymentsApiV1AdminPaymentsGetResponseSchema>
 */
export function useListPaymentsApiV1AdminPaymentsGet(skip?: number, limit?: number, status?: unknown, options?: { enabled?: boolean; suspense?: boolean; refetchInterval?: number; initialData?: z.infer<typeof ListPaymentsApiV1AdminPaymentsGetResponseSchema> }) {
  const { initialData, ...restOptions } = options ?? {}

  return useQuery({
    queryKey: ['listPaymentsApiV1AdminPaymentsGet', skip, limit, status],
    queryFn: async ({ signal }: { signal?: AbortSignal }) => {
      try {
        const result = await resolveActionResult<z.infer<typeof ListPaymentsApiV1AdminPaymentsGetResponseSchema>>(listPaymentsApiV1AdminPaymentsGet({ query: { skip, limit, status } }))
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
    placeholderData: (previousData: z.infer<typeof ListPaymentsApiV1AdminPaymentsGetResponseSchema> | undefined) => previousData,
    retry: (failureCount: number, error: Error) => {
      // Don't retry on 4xx errors (client errors)
      if (error instanceof Error && error.message.includes('4')) return false
      // Retry up to 3 times for network/server errors
      return failureCount < 3
    },
    initialData: initialData as z.infer<typeof ListPaymentsApiV1AdminPaymentsGetResponseSchema> | undefined,
    ...restOptions
  })
}

/**
 * Suspense version for /api/v1/admin/payments
 * @returns useSuspenseQuery result with data of type z.infer<typeof ListPaymentsApiV1AdminPaymentsGetResponseSchema>
 */
export function useSuspenseListPaymentsApiV1AdminPaymentsGet(skip?: number, limit?: number, status?: unknown, options?: { enabled?: boolean; suspense?: boolean; refetchInterval?: number; initialData?: z.infer<typeof ListPaymentsApiV1AdminPaymentsGetResponseSchema> }) {
  const { initialData, ...restOptions } = options ?? {}

  return useSuspenseQuery({
    queryKey: ['listPaymentsApiV1AdminPaymentsGet', skip, limit, status],
    queryFn: async () => {
      const result = await resolveActionResult<z.infer<typeof ListPaymentsApiV1AdminPaymentsGetResponseSchema>>(listPaymentsApiV1AdminPaymentsGet({ query: { skip, limit, status } }))
      return result
    },
    staleTime: 180000,
    initialData: initialData as z.infer<typeof ListPaymentsApiV1AdminPaymentsGetResponseSchema> | undefined,
    ...restOptions
  })
}

/**
 * Optimized query hook for GET /api/v1/admin/payments/{payment_id}
 * Features: Smart caching, error handling, type safety
 * @returns useQuery result with data of type z.infer<typeof GetPaymentApiV1AdminPaymentsPaymentIdGetResponseSchema>
 */
export function useGetPaymentApiV1AdminPaymentsPaymentIdGet(payment_id: string, options?: { enabled?: boolean; suspense?: boolean; refetchInterval?: number; initialData?: z.infer<typeof GetPaymentApiV1AdminPaymentsPaymentIdGetResponseSchema> }) {
  const { initialData, ...restOptions } = options ?? {}

  return useQuery({
    queryKey: ['getPaymentApiV1AdminPaymentsPaymentIdGet', payment_id],
    queryFn: async ({ signal }: { signal?: AbortSignal }) => {
      try {
        const result = await resolveActionResult<z.infer<typeof GetPaymentApiV1AdminPaymentsPaymentIdGetResponseSchema>>(getPaymentApiV1AdminPaymentsPaymentIdGet({ path: { payment_id } }))
        return result
      } catch (error) {
        handleActionError(error)
      }
    },
    staleTime: 180000,
    gcTime: 360000, // React Query v5: gcTime replaces cacheTime
    enabled: !!payment_id && (options?.enabled ?? true),
    refetchOnWindowFocus: true, // Refetch when window regains focus
    refetchOnReconnect: true, // Refetch when network reconnects
    refetchOnMount: 'always', // Always refetch on mount for fresh data
    refetchInterval: options?.refetchInterval, // Optional polling interval
    // React Query v5: placeholderData replaces keepPreviousData
    placeholderData: (previousData: z.infer<typeof GetPaymentApiV1AdminPaymentsPaymentIdGetResponseSchema> | undefined) => previousData,
    retry: (failureCount: number, error: Error) => {
      // Don't retry on 4xx errors (client errors)
      if (error instanceof Error && error.message.includes('4')) return false
      // Retry up to 3 times for network/server errors
      return failureCount < 3
    },
    initialData: initialData as z.infer<typeof GetPaymentApiV1AdminPaymentsPaymentIdGetResponseSchema> | undefined,
    ...restOptions
  })
}

/**
 * Suspense version for /api/v1/admin/payments/{payment_id}
 * @returns useSuspenseQuery result with data of type z.infer<typeof GetPaymentApiV1AdminPaymentsPaymentIdGetResponseSchema>
 */
export function useSuspenseGetPaymentApiV1AdminPaymentsPaymentIdGet(payment_id: string, options?: { enabled?: boolean; suspense?: boolean; refetchInterval?: number; initialData?: z.infer<typeof GetPaymentApiV1AdminPaymentsPaymentIdGetResponseSchema> }) {
  const { initialData, ...restOptions } = options ?? {}

  return useSuspenseQuery({
    queryKey: ['getPaymentApiV1AdminPaymentsPaymentIdGet', payment_id],
    queryFn: async () => {
      const result = await resolveActionResult<z.infer<typeof GetPaymentApiV1AdminPaymentsPaymentIdGetResponseSchema>>(getPaymentApiV1AdminPaymentsPaymentIdGet({ path: { payment_id } }))
      return result
    },
    staleTime: 180000,
    initialData: initialData as z.infer<typeof GetPaymentApiV1AdminPaymentsPaymentIdGetResponseSchema> | undefined,
    ...restOptions
  })
}

/**
 * Optimized query hook for GET /api/v1/admin/payments/stats
 * Features: Smart caching, error handling, type safety
 * @returns useQuery result with data of type z.infer<typeof GetPaymentStatsApiV1AdminPaymentsStatsGetResponseSchema>
 */
export function useGetPaymentStatsApiV1AdminPaymentsStatsGet(options?: { enabled?: boolean; suspense?: boolean; refetchInterval?: number; initialData?: z.infer<typeof GetPaymentStatsApiV1AdminPaymentsStatsGetResponseSchema> }) {
  const { initialData, ...restOptions } = options ?? {}

  return useQuery({
    queryKey: ['getPaymentStatsApiV1AdminPaymentsStatsGet'],
    queryFn: async ({ signal }: { signal?: AbortSignal }) => {
      try {
        const result = await resolveActionResult<z.infer<typeof GetPaymentStatsApiV1AdminPaymentsStatsGetResponseSchema>>(getPaymentStatsApiV1AdminPaymentsStatsGet())
        return result
      } catch (error) {
        handleActionError(error)
      }
    },
    staleTime: 60000,
    gcTime: 120000, // React Query v5: gcTime replaces cacheTime
    enabled: true && (options?.enabled ?? true),
    refetchOnWindowFocus: true, // Refetch when window regains focus
    refetchOnReconnect: true, // Refetch when network reconnects
    refetchOnMount: 'always', // Always refetch on mount for fresh data
    refetchInterval: options?.refetchInterval, // Optional polling interval
    // React Query v5: placeholderData replaces keepPreviousData
    placeholderData: (previousData: z.infer<typeof GetPaymentStatsApiV1AdminPaymentsStatsGetResponseSchema> | undefined) => previousData,
    retry: (failureCount: number, error: Error) => {
      // Don't retry on 4xx errors (client errors)
      if (error instanceof Error && error.message.includes('4')) return false
      // Retry up to 3 times for network/server errors
      return failureCount < 3
    },
    initialData: initialData as z.infer<typeof GetPaymentStatsApiV1AdminPaymentsStatsGetResponseSchema> | undefined,
    ...restOptions
  })
}

/**
 * Suspense version for /api/v1/admin/payments/stats
 * @returns useSuspenseQuery result with data of type z.infer<typeof GetPaymentStatsApiV1AdminPaymentsStatsGetResponseSchema>
 */
export function useSuspenseGetPaymentStatsApiV1AdminPaymentsStatsGet(options?: { enabled?: boolean; suspense?: boolean; refetchInterval?: number; initialData?: z.infer<typeof GetPaymentStatsApiV1AdminPaymentsStatsGetResponseSchema> }) {
  const { initialData, ...restOptions } = options ?? {}

  return useSuspenseQuery({
    queryKey: ['getPaymentStatsApiV1AdminPaymentsStatsGet'],
    queryFn: async () => {
      const result = await resolveActionResult<z.infer<typeof GetPaymentStatsApiV1AdminPaymentsStatsGetResponseSchema>>(getPaymentStatsApiV1AdminPaymentsStatsGet())
      return result
    },
    staleTime: 60000,
    initialData: initialData as z.infer<typeof GetPaymentStatsApiV1AdminPaymentsStatsGetResponseSchema> | undefined,
    ...restOptions
  })
}

/**
 * Optimized mutation hook for PUT /api/v1/admin/users/{user_id}
 * Features: Optimistic updates, smart invalidation, error handling
 * @param options - Mutation options
 * @returns Mutation result with enhanced features
 */
export function useUpdateUserApiV1AdminUsersUserIdPutMutation(options?: {
  onSuccess?: (data: z.infer<typeof UpdateUserApiV1AdminUsersUserIdPutResponseSchema>, variables: { body: z.infer<typeof UpdateUserApiV1AdminUsersUserIdPutRequestSchema>, params: z.infer<typeof UpdateUserApiV1AdminUsersUserIdPutParamsSchema> }) => void
  onError?: (error: Error, variables: { body: z.infer<typeof UpdateUserApiV1AdminUsersUserIdPutRequestSchema>, params: z.infer<typeof UpdateUserApiV1AdminUsersUserIdPutParamsSchema> }) => void
  optimisticUpdate?: (variables: { body: z.infer<typeof UpdateUserApiV1AdminUsersUserIdPutRequestSchema>, params: z.infer<typeof UpdateUserApiV1AdminUsersUserIdPutParamsSchema> }) => unknown
  showToast?: boolean
}) {
  const queryClient = useQueryClient()
  const [isPending, startTransition] = useTransition()
  const [optimisticData, setOptimisticData] = useOptimistic<unknown, { body: z.infer<typeof UpdateUserApiV1AdminUsersUserIdPutRequestSchema>, params: z.infer<typeof UpdateUserApiV1AdminUsersUserIdPutParamsSchema> }>(null, (_, newData) => newData)

  const mutation = useMutation({
    mutationFn: async (variables: { body: z.infer<typeof UpdateUserApiV1AdminUsersUserIdPutRequestSchema>, params: z.infer<typeof UpdateUserApiV1AdminUsersUserIdPutParamsSchema> }): Promise<z.infer<typeof UpdateUserApiV1AdminUsersUserIdPutResponseSchema>> => {
      try {
        const result = await resolveActionResult<z.infer<typeof UpdateUserApiV1AdminUsersUserIdPutResponseSchema>>(updateUserApiV1AdminUsersUserIdPut(variables))
        return (result ?? ({} as z.infer<typeof UpdateUserApiV1AdminUsersUserIdPutResponseSchema>))
      } catch (error) {
        handleActionError(error)
      }
    },
    
    onMutate: async (variables: { body: z.infer<typeof UpdateUserApiV1AdminUsersUserIdPutRequestSchema>, params: z.infer<typeof UpdateUserApiV1AdminUsersUserIdPutParamsSchema> }) => {
      await Promise.all([
        queryClient.cancelQueries({ queryKey: ['listUsersApiV1AdminUsersGet'] }),
        queryClient.cancelQueries({ queryKey: ['getUserApiV1AdminUsersUserIdGet'] }),
        queryClient.cancelQueries({ queryKey: ['getUserStatsApiV1AdminUsersStatsGet'] }),
        queryClient.cancelQueries({ queryKey: ['getDashboardMetricsApiV1AdminDashboardMetricsGet'] }),
        queryClient.cancelQueries({ queryKey: ['getBookingTrendsApiV1AdminDashboardBookingTrendsGet'] }),
        queryClient.cancelQueries({ queryKey: ['getPopularDestinationsApiV1AdminDashboardPopularDestinationsGet'] }),
        queryClient.cancelQueries({ queryKey: ['listListingsApiV1AdminListingsGet'] }),
        queryClient.cancelQueries({ queryKey: ['getListingApiV1AdminListingsListingIdGet'] }),
        queryClient.cancelQueries({ queryKey: ['getListingStatsApiV1AdminListingsStatsGet'] }),
        queryClient.cancelQueries({ queryKey: ['listBookingsApiV1AdminBookingsGet'] }),
        queryClient.cancelQueries({ queryKey: ['getBookingApiV1AdminBookingsBookingIdGet'] }),
        queryClient.cancelQueries({ queryKey: ['getBookingStatsApiV1AdminBookingsStatsGet'] }),
        queryClient.cancelQueries({ queryKey: ['listPaymentsApiV1AdminPaymentsGet'] }),
        queryClient.cancelQueries({ queryKey: ['getPaymentApiV1AdminPaymentsPaymentIdGet'] }),
        queryClient.cancelQueries({ queryKey: ['getPaymentStatsApiV1AdminPaymentsStatsGet'] })
      ])

      // Optimistic update (if provided)
      if (options?.optimisticUpdate) {
        const optimisticValue = options.optimisticUpdate(variables)
        setOptimisticData(optimisticValue as { body: z.infer<typeof UpdateUserApiV1AdminUsersUserIdPutRequestSchema>, params: z.infer<typeof UpdateUserApiV1AdminUsersUserIdPutParamsSchema> })
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
    
    onError: (error: Error, variables: { body: z.infer<typeof UpdateUserApiV1AdminUsersUserIdPutRequestSchema>, params: z.infer<typeof UpdateUserApiV1AdminUsersUserIdPutParamsSchema> }) => {
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
        queryClient.invalidateQueries({ queryKey: ['listUsersApiV1AdminUsersGet'] }),
        queryClient.invalidateQueries({ queryKey: ['getUserApiV1AdminUsersUserIdGet'] }),
        queryClient.invalidateQueries({ queryKey: ['getUserStatsApiV1AdminUsersStatsGet'] }),
        queryClient.invalidateQueries({ queryKey: ['getDashboardMetricsApiV1AdminDashboardMetricsGet'] }),
        queryClient.invalidateQueries({ queryKey: ['getBookingTrendsApiV1AdminDashboardBookingTrendsGet'] }),
        queryClient.invalidateQueries({ queryKey: ['getPopularDestinationsApiV1AdminDashboardPopularDestinationsGet'] }),
        queryClient.invalidateQueries({ queryKey: ['listListingsApiV1AdminListingsGet'] }),
        queryClient.invalidateQueries({ queryKey: ['getListingApiV1AdminListingsListingIdGet'] }),
        queryClient.invalidateQueries({ queryKey: ['getListingStatsApiV1AdminListingsStatsGet'] }),
        queryClient.invalidateQueries({ queryKey: ['listBookingsApiV1AdminBookingsGet'] }),
        queryClient.invalidateQueries({ queryKey: ['getBookingApiV1AdminBookingsBookingIdGet'] }),
        queryClient.invalidateQueries({ queryKey: ['getBookingStatsApiV1AdminBookingsStatsGet'] }),
        queryClient.invalidateQueries({ queryKey: ['listPaymentsApiV1AdminPaymentsGet'] }),
        queryClient.invalidateQueries({ queryKey: ['getPaymentApiV1AdminPaymentsPaymentIdGet'] }),
        queryClient.invalidateQueries({ queryKey: ['getPaymentStatsApiV1AdminPaymentsStatsGet'] }),
        queryClient.invalidateQueries({ queryKey: ['Admin'] })
      ])
    }
  })

  return {
    ...mutation,
    mutateWithTransition: (variables: { body: z.infer<typeof UpdateUserApiV1AdminUsersUserIdPutRequestSchema>, params: z.infer<typeof UpdateUserApiV1AdminUsersUserIdPutParamsSchema> }) => {
      startTransition(() => {
        mutation.mutate(variables)
      })
    },
    isPending: isPending || mutation.isPending,
    optimisticData
  }
}

/**
 * Optimized mutation hook for POST /api/v1/admin/users/{user_id}/suspend
 * Features: Optimistic updates, smart invalidation, error handling
 * @param options - Mutation options
 * @returns Mutation result with enhanced features
 */
export function useSuspendUserApiV1AdminUsersUserIdSuspendPostMutation(options?: {
  onSuccess?: (data: z.infer<typeof SuspendUserApiV1AdminUsersUserIdSuspendPostResponseSchema>, variables: z.infer<typeof SuspendUserApiV1AdminUsersUserIdSuspendPostParamsSchema>) => void
  onError?: (error: Error, variables: z.infer<typeof SuspendUserApiV1AdminUsersUserIdSuspendPostParamsSchema>) => void
  optimisticUpdate?: (variables: z.infer<typeof SuspendUserApiV1AdminUsersUserIdSuspendPostParamsSchema>) => unknown
  showToast?: boolean
}) {
  const queryClient = useQueryClient()
  const [isPending, startTransition] = useTransition()
  const [optimisticData, setOptimisticData] = useOptimistic<unknown, z.infer<typeof SuspendUserApiV1AdminUsersUserIdSuspendPostParamsSchema>>(null, (_, newData) => newData)

  const mutation = useMutation({
    mutationFn: async (variables: z.infer<typeof SuspendUserApiV1AdminUsersUserIdSuspendPostParamsSchema>): Promise<z.infer<typeof SuspendUserApiV1AdminUsersUserIdSuspendPostResponseSchema>> => {
      try {
        const result = await resolveActionResult<z.infer<typeof SuspendUserApiV1AdminUsersUserIdSuspendPostResponseSchema>>(suspendUserApiV1AdminUsersUserIdSuspendPost(variables))
        return (result ?? ({} as z.infer<typeof SuspendUserApiV1AdminUsersUserIdSuspendPostResponseSchema>))
      } catch (error) {
        handleActionError(error)
      }
    },
    
    onMutate: async (variables: z.infer<typeof SuspendUserApiV1AdminUsersUserIdSuspendPostParamsSchema>) => {
      await Promise.all([
        queryClient.cancelQueries({ queryKey: ['listUsersApiV1AdminUsersGet'] }),
        queryClient.cancelQueries({ queryKey: ['getUserApiV1AdminUsersUserIdGet'] }),
        queryClient.cancelQueries({ queryKey: ['getUserStatsApiV1AdminUsersStatsGet'] }),
        queryClient.cancelQueries({ queryKey: ['getDashboardMetricsApiV1AdminDashboardMetricsGet'] }),
        queryClient.cancelQueries({ queryKey: ['getBookingTrendsApiV1AdminDashboardBookingTrendsGet'] }),
        queryClient.cancelQueries({ queryKey: ['getPopularDestinationsApiV1AdminDashboardPopularDestinationsGet'] }),
        queryClient.cancelQueries({ queryKey: ['listListingsApiV1AdminListingsGet'] }),
        queryClient.cancelQueries({ queryKey: ['getListingApiV1AdminListingsListingIdGet'] }),
        queryClient.cancelQueries({ queryKey: ['getListingStatsApiV1AdminListingsStatsGet'] }),
        queryClient.cancelQueries({ queryKey: ['listBookingsApiV1AdminBookingsGet'] }),
        queryClient.cancelQueries({ queryKey: ['getBookingApiV1AdminBookingsBookingIdGet'] }),
        queryClient.cancelQueries({ queryKey: ['getBookingStatsApiV1AdminBookingsStatsGet'] }),
        queryClient.cancelQueries({ queryKey: ['listPaymentsApiV1AdminPaymentsGet'] }),
        queryClient.cancelQueries({ queryKey: ['getPaymentApiV1AdminPaymentsPaymentIdGet'] }),
        queryClient.cancelQueries({ queryKey: ['getPaymentStatsApiV1AdminPaymentsStatsGet'] })
      ])

      // Optimistic update (if provided)
      if (options?.optimisticUpdate) {
        const optimisticValue = options.optimisticUpdate(variables)
        setOptimisticData(optimisticValue as z.infer<typeof SuspendUserApiV1AdminUsersUserIdSuspendPostParamsSchema>)
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
    
    onError: (error: Error, variables: z.infer<typeof SuspendUserApiV1AdminUsersUserIdSuspendPostParamsSchema>) => {
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
        queryClient.invalidateQueries({ queryKey: ['listUsersApiV1AdminUsersGet'] }),
        queryClient.invalidateQueries({ queryKey: ['getUserApiV1AdminUsersUserIdGet'] }),
        queryClient.invalidateQueries({ queryKey: ['getUserStatsApiV1AdminUsersStatsGet'] }),
        queryClient.invalidateQueries({ queryKey: ['getDashboardMetricsApiV1AdminDashboardMetricsGet'] }),
        queryClient.invalidateQueries({ queryKey: ['getBookingTrendsApiV1AdminDashboardBookingTrendsGet'] }),
        queryClient.invalidateQueries({ queryKey: ['getPopularDestinationsApiV1AdminDashboardPopularDestinationsGet'] }),
        queryClient.invalidateQueries({ queryKey: ['listListingsApiV1AdminListingsGet'] }),
        queryClient.invalidateQueries({ queryKey: ['getListingApiV1AdminListingsListingIdGet'] }),
        queryClient.invalidateQueries({ queryKey: ['getListingStatsApiV1AdminListingsStatsGet'] }),
        queryClient.invalidateQueries({ queryKey: ['listBookingsApiV1AdminBookingsGet'] }),
        queryClient.invalidateQueries({ queryKey: ['getBookingApiV1AdminBookingsBookingIdGet'] }),
        queryClient.invalidateQueries({ queryKey: ['getBookingStatsApiV1AdminBookingsStatsGet'] }),
        queryClient.invalidateQueries({ queryKey: ['listPaymentsApiV1AdminPaymentsGet'] }),
        queryClient.invalidateQueries({ queryKey: ['getPaymentApiV1AdminPaymentsPaymentIdGet'] }),
        queryClient.invalidateQueries({ queryKey: ['getPaymentStatsApiV1AdminPaymentsStatsGet'] }),
        queryClient.invalidateQueries({ queryKey: ['Admin'] })
      ])
    }
  })

  return {
    ...mutation,
    mutateWithTransition: (variables: z.infer<typeof SuspendUserApiV1AdminUsersUserIdSuspendPostParamsSchema>) => {
      startTransition(() => {
        mutation.mutate(variables)
      })
    },
    isPending: isPending || mutation.isPending,
    optimisticData
  }
}

/**
 * Optimized mutation hook for POST /api/v1/admin/users/{user_id}/activate
 * Features: Optimistic updates, smart invalidation, error handling
 * @param options - Mutation options
 * @returns Mutation result with enhanced features
 */
export function useActivateUserApiV1AdminUsersUserIdActivatePostMutation(options?: {
  onSuccess?: (data: z.infer<typeof ActivateUserApiV1AdminUsersUserIdActivatePostResponseSchema>, variables: z.infer<typeof ActivateUserApiV1AdminUsersUserIdActivatePostParamsSchema>) => void
  onError?: (error: Error, variables: z.infer<typeof ActivateUserApiV1AdminUsersUserIdActivatePostParamsSchema>) => void
  optimisticUpdate?: (variables: z.infer<typeof ActivateUserApiV1AdminUsersUserIdActivatePostParamsSchema>) => unknown
  showToast?: boolean
}) {
  const queryClient = useQueryClient()
  const [isPending, startTransition] = useTransition()
  const [optimisticData, setOptimisticData] = useOptimistic<unknown, z.infer<typeof ActivateUserApiV1AdminUsersUserIdActivatePostParamsSchema>>(null, (_, newData) => newData)

  const mutation = useMutation({
    mutationFn: async (variables: z.infer<typeof ActivateUserApiV1AdminUsersUserIdActivatePostParamsSchema>): Promise<z.infer<typeof ActivateUserApiV1AdminUsersUserIdActivatePostResponseSchema>> => {
      try {
        const result = await resolveActionResult<z.infer<typeof ActivateUserApiV1AdminUsersUserIdActivatePostResponseSchema>>(activateUserApiV1AdminUsersUserIdActivatePost(variables))
        return (result ?? ({} as z.infer<typeof ActivateUserApiV1AdminUsersUserIdActivatePostResponseSchema>))
      } catch (error) {
        handleActionError(error)
      }
    },
    
    onMutate: async (variables: z.infer<typeof ActivateUserApiV1AdminUsersUserIdActivatePostParamsSchema>) => {
      await Promise.all([
        queryClient.cancelQueries({ queryKey: ['listUsersApiV1AdminUsersGet'] }),
        queryClient.cancelQueries({ queryKey: ['getUserApiV1AdminUsersUserIdGet'] }),
        queryClient.cancelQueries({ queryKey: ['getUserStatsApiV1AdminUsersStatsGet'] }),
        queryClient.cancelQueries({ queryKey: ['getDashboardMetricsApiV1AdminDashboardMetricsGet'] }),
        queryClient.cancelQueries({ queryKey: ['getBookingTrendsApiV1AdminDashboardBookingTrendsGet'] }),
        queryClient.cancelQueries({ queryKey: ['getPopularDestinationsApiV1AdminDashboardPopularDestinationsGet'] }),
        queryClient.cancelQueries({ queryKey: ['listListingsApiV1AdminListingsGet'] }),
        queryClient.cancelQueries({ queryKey: ['getListingApiV1AdminListingsListingIdGet'] }),
        queryClient.cancelQueries({ queryKey: ['getListingStatsApiV1AdminListingsStatsGet'] }),
        queryClient.cancelQueries({ queryKey: ['listBookingsApiV1AdminBookingsGet'] }),
        queryClient.cancelQueries({ queryKey: ['getBookingApiV1AdminBookingsBookingIdGet'] }),
        queryClient.cancelQueries({ queryKey: ['getBookingStatsApiV1AdminBookingsStatsGet'] }),
        queryClient.cancelQueries({ queryKey: ['listPaymentsApiV1AdminPaymentsGet'] }),
        queryClient.cancelQueries({ queryKey: ['getPaymentApiV1AdminPaymentsPaymentIdGet'] }),
        queryClient.cancelQueries({ queryKey: ['getPaymentStatsApiV1AdminPaymentsStatsGet'] })
      ])

      // Optimistic update (if provided)
      if (options?.optimisticUpdate) {
        const optimisticValue = options.optimisticUpdate(variables)
        setOptimisticData(optimisticValue as z.infer<typeof ActivateUserApiV1AdminUsersUserIdActivatePostParamsSchema>)
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
    
    onError: (error: Error, variables: z.infer<typeof ActivateUserApiV1AdminUsersUserIdActivatePostParamsSchema>) => {
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
        queryClient.invalidateQueries({ queryKey: ['listUsersApiV1AdminUsersGet'] }),
        queryClient.invalidateQueries({ queryKey: ['getUserApiV1AdminUsersUserIdGet'] }),
        queryClient.invalidateQueries({ queryKey: ['getUserStatsApiV1AdminUsersStatsGet'] }),
        queryClient.invalidateQueries({ queryKey: ['getDashboardMetricsApiV1AdminDashboardMetricsGet'] }),
        queryClient.invalidateQueries({ queryKey: ['getBookingTrendsApiV1AdminDashboardBookingTrendsGet'] }),
        queryClient.invalidateQueries({ queryKey: ['getPopularDestinationsApiV1AdminDashboardPopularDestinationsGet'] }),
        queryClient.invalidateQueries({ queryKey: ['listListingsApiV1AdminListingsGet'] }),
        queryClient.invalidateQueries({ queryKey: ['getListingApiV1AdminListingsListingIdGet'] }),
        queryClient.invalidateQueries({ queryKey: ['getListingStatsApiV1AdminListingsStatsGet'] }),
        queryClient.invalidateQueries({ queryKey: ['listBookingsApiV1AdminBookingsGet'] }),
        queryClient.invalidateQueries({ queryKey: ['getBookingApiV1AdminBookingsBookingIdGet'] }),
        queryClient.invalidateQueries({ queryKey: ['getBookingStatsApiV1AdminBookingsStatsGet'] }),
        queryClient.invalidateQueries({ queryKey: ['listPaymentsApiV1AdminPaymentsGet'] }),
        queryClient.invalidateQueries({ queryKey: ['getPaymentApiV1AdminPaymentsPaymentIdGet'] }),
        queryClient.invalidateQueries({ queryKey: ['getPaymentStatsApiV1AdminPaymentsStatsGet'] }),
        queryClient.invalidateQueries({ queryKey: ['Admin'] })
      ])
    }
  })

  return {
    ...mutation,
    mutateWithTransition: (variables: z.infer<typeof ActivateUserApiV1AdminUsersUserIdActivatePostParamsSchema>) => {
      startTransition(() => {
        mutation.mutate(variables)
      })
    },
    isPending: isPending || mutation.isPending,
    optimisticData
  }
}