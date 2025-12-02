'use client'
import { useQuery, useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import { parseAsInteger, parseAsString, useQueryStates } from 'nuqs'
import { toast } from 'sonner'
import { getAuditLogsApiV1AnalyticsAuditLogsGet, getAuditLogApiV1AnalyticsAuditLogsLogIdGet, getAuditLogsSummaryApiV1AnalyticsAuditLogsStatsSummaryGet } from '@/generated/actions/analytics'
import {
  GetAuditLogsApiV1AnalyticsAuditLogsGetResponseSchema,
  GetAuditLogsApiV1AnalyticsAuditLogsGetParamsSchema,
  GetAuditLogApiV1AnalyticsAuditLogsLogIdGetResponseSchema,
  GetAuditLogApiV1AnalyticsAuditLogsLogIdGetParamsSchema,
  GetAuditLogsSummaryApiV1AnalyticsAuditLogsStatsSummaryGetResponseSchema,
  GetAuditLogsSummaryApiV1AnalyticsAuditLogsStatsSummaryGetParamsSchema
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
 * Optimized query hook for GET /api/v1/analytics/audit-logs
 * Features: Smart caching, error handling, type safety
 * @returns useQuery result with data of type z.infer<typeof GetAuditLogsApiV1AnalyticsAuditLogsGetResponseSchema>
 */
export function useGetAuditLogsApiV1AnalyticsAuditLogsGet(actor_id?: unknown, action?: unknown, resource_type?: unknown, resource_id?: unknown, start_date?: unknown, end_date?: unknown, skip?: number, limit?: number, options?: { enabled?: boolean; suspense?: boolean; refetchInterval?: number; initialData?: z.infer<typeof GetAuditLogsApiV1AnalyticsAuditLogsGetResponseSchema> }) {
  const { initialData, ...restOptions } = options ?? {}

  return useQuery({
    queryKey: ['getAuditLogsApiV1AnalyticsAuditLogsGet', actor_id, action, resource_type, resource_id, start_date, end_date, skip, limit],
    queryFn: async ({ signal }: { signal?: AbortSignal }) => {
      try {
        const result = await resolveActionResult<z.infer<typeof GetAuditLogsApiV1AnalyticsAuditLogsGetResponseSchema>>(getAuditLogsApiV1AnalyticsAuditLogsGet({ query: { actor_id, action, resource_type, resource_id, start_date, end_date, skip, limit } }))
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
    placeholderData: (previousData: z.infer<typeof GetAuditLogsApiV1AnalyticsAuditLogsGetResponseSchema> | undefined) => previousData,
    retry: (failureCount: number, error: Error) => {
      // Don't retry on 4xx errors (client errors)
      if (error instanceof Error && error.message.includes('4')) return false
      // Retry up to 3 times for network/server errors
      return failureCount < 3
    },
    initialData: initialData as z.infer<typeof GetAuditLogsApiV1AnalyticsAuditLogsGetResponseSchema> | undefined,
    ...restOptions
  })
}

/**
 * Suspense version for /api/v1/analytics/audit-logs
 * @returns useSuspenseQuery result with data of type z.infer<typeof GetAuditLogsApiV1AnalyticsAuditLogsGetResponseSchema>
 */
export function useSuspenseGetAuditLogsApiV1AnalyticsAuditLogsGet(actor_id?: unknown, action?: unknown, resource_type?: unknown, resource_id?: unknown, start_date?: unknown, end_date?: unknown, skip?: number, limit?: number, options?: { enabled?: boolean; suspense?: boolean; refetchInterval?: number; initialData?: z.infer<typeof GetAuditLogsApiV1AnalyticsAuditLogsGetResponseSchema> }) {
  const { initialData, ...restOptions } = options ?? {}

  return useSuspenseQuery({
    queryKey: ['getAuditLogsApiV1AnalyticsAuditLogsGet', actor_id, action, resource_type, resource_id, start_date, end_date, skip, limit],
    queryFn: async () => {
      const result = await resolveActionResult<z.infer<typeof GetAuditLogsApiV1AnalyticsAuditLogsGetResponseSchema>>(getAuditLogsApiV1AnalyticsAuditLogsGet({ query: { actor_id, action, resource_type, resource_id, start_date, end_date, skip, limit } }))
      return result
    },
    staleTime: 60000,
    initialData: initialData as z.infer<typeof GetAuditLogsApiV1AnalyticsAuditLogsGetResponseSchema> | undefined,
    ...restOptions
  })
}

/**
 * Optimized query hook for GET /api/v1/analytics/audit-logs/{log_id}
 * Features: Smart caching, error handling, type safety
 * @returns useQuery result with data of type z.infer<typeof GetAuditLogApiV1AnalyticsAuditLogsLogIdGetResponseSchema>
 */
export function useGetAuditLogApiV1AnalyticsAuditLogsLogIdGet(log_id: string, options?: { enabled?: boolean; suspense?: boolean; refetchInterval?: number; initialData?: z.infer<typeof GetAuditLogApiV1AnalyticsAuditLogsLogIdGetResponseSchema> }) {
  const { initialData, ...restOptions } = options ?? {}

  return useQuery({
    queryKey: ['getAuditLogApiV1AnalyticsAuditLogsLogIdGet', log_id],
    queryFn: async ({ signal }: { signal?: AbortSignal }) => {
      try {
        const result = await resolveActionResult<z.infer<typeof GetAuditLogApiV1AnalyticsAuditLogsLogIdGetResponseSchema>>(getAuditLogApiV1AnalyticsAuditLogsLogIdGet({ path: { log_id } }))
        return result
      } catch (error) {
        handleActionError(error)
      }
    },
    staleTime: 60000,
    gcTime: 120000, // React Query v5: gcTime replaces cacheTime
    enabled: !!log_id && (options?.enabled ?? true),
    refetchOnWindowFocus: true, // Refetch when window regains focus
    refetchOnReconnect: true, // Refetch when network reconnects
    refetchOnMount: 'always', // Always refetch on mount for fresh data
    refetchInterval: options?.refetchInterval, // Optional polling interval
    // React Query v5: placeholderData replaces keepPreviousData
    placeholderData: (previousData: z.infer<typeof GetAuditLogApiV1AnalyticsAuditLogsLogIdGetResponseSchema> | undefined) => previousData,
    retry: (failureCount: number, error: Error) => {
      // Don't retry on 4xx errors (client errors)
      if (error instanceof Error && error.message.includes('4')) return false
      // Retry up to 3 times for network/server errors
      return failureCount < 3
    },
    initialData: initialData as z.infer<typeof GetAuditLogApiV1AnalyticsAuditLogsLogIdGetResponseSchema> | undefined,
    ...restOptions
  })
}

/**
 * Suspense version for /api/v1/analytics/audit-logs/{log_id}
 * @returns useSuspenseQuery result with data of type z.infer<typeof GetAuditLogApiV1AnalyticsAuditLogsLogIdGetResponseSchema>
 */
export function useSuspenseGetAuditLogApiV1AnalyticsAuditLogsLogIdGet(log_id: string, options?: { enabled?: boolean; suspense?: boolean; refetchInterval?: number; initialData?: z.infer<typeof GetAuditLogApiV1AnalyticsAuditLogsLogIdGetResponseSchema> }) {
  const { initialData, ...restOptions } = options ?? {}

  return useSuspenseQuery({
    queryKey: ['getAuditLogApiV1AnalyticsAuditLogsLogIdGet', log_id],
    queryFn: async () => {
      const result = await resolveActionResult<z.infer<typeof GetAuditLogApiV1AnalyticsAuditLogsLogIdGetResponseSchema>>(getAuditLogApiV1AnalyticsAuditLogsLogIdGet({ path: { log_id } }))
      return result
    },
    staleTime: 60000,
    initialData: initialData as z.infer<typeof GetAuditLogApiV1AnalyticsAuditLogsLogIdGetResponseSchema> | undefined,
    ...restOptions
  })
}

/**
 * Optimized query hook for GET /api/v1/analytics/audit-logs/stats/summary
 * Features: Smart caching, error handling, type safety
 * @returns useQuery result with data of type z.infer<typeof GetAuditLogsSummaryApiV1AnalyticsAuditLogsStatsSummaryGetResponseSchema>
 */
export function useGetAuditLogsSummaryApiV1AnalyticsAuditLogsStatsSummaryGet(days?: number, options?: { enabled?: boolean; suspense?: boolean; refetchInterval?: number; initialData?: z.infer<typeof GetAuditLogsSummaryApiV1AnalyticsAuditLogsStatsSummaryGetResponseSchema> }) {
  const { initialData, ...restOptions } = options ?? {}

  return useQuery({
    queryKey: ['getAuditLogsSummaryApiV1AnalyticsAuditLogsStatsSummaryGet', days],
    queryFn: async ({ signal }: { signal?: AbortSignal }) => {
      try {
        const result = await resolveActionResult<z.infer<typeof GetAuditLogsSummaryApiV1AnalyticsAuditLogsStatsSummaryGetResponseSchema>>(getAuditLogsSummaryApiV1AnalyticsAuditLogsStatsSummaryGet({ query: { days } }))
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
    placeholderData: (previousData: z.infer<typeof GetAuditLogsSummaryApiV1AnalyticsAuditLogsStatsSummaryGetResponseSchema> | undefined) => previousData,
    retry: (failureCount: number, error: Error) => {
      // Don't retry on 4xx errors (client errors)
      if (error instanceof Error && error.message.includes('4')) return false
      // Retry up to 3 times for network/server errors
      return failureCount < 3
    },
    initialData: initialData as z.infer<typeof GetAuditLogsSummaryApiV1AnalyticsAuditLogsStatsSummaryGetResponseSchema> | undefined,
    ...restOptions
  })
}

/**
 * Suspense version for /api/v1/analytics/audit-logs/stats/summary
 * @returns useSuspenseQuery result with data of type z.infer<typeof GetAuditLogsSummaryApiV1AnalyticsAuditLogsStatsSummaryGetResponseSchema>
 */
export function useSuspenseGetAuditLogsSummaryApiV1AnalyticsAuditLogsStatsSummaryGet(days?: number, options?: { enabled?: boolean; suspense?: boolean; refetchInterval?: number; initialData?: z.infer<typeof GetAuditLogsSummaryApiV1AnalyticsAuditLogsStatsSummaryGetResponseSchema> }) {
  const { initialData, ...restOptions } = options ?? {}

  return useSuspenseQuery({
    queryKey: ['getAuditLogsSummaryApiV1AnalyticsAuditLogsStatsSummaryGet', days],
    queryFn: async () => {
      const result = await resolveActionResult<z.infer<typeof GetAuditLogsSummaryApiV1AnalyticsAuditLogsStatsSummaryGetResponseSchema>>(getAuditLogsSummaryApiV1AnalyticsAuditLogsStatsSummaryGet({ query: { days } }))
      return result
    },
    staleTime: 60000,
    initialData: initialData as z.infer<typeof GetAuditLogsSummaryApiV1AnalyticsAuditLogsStatsSummaryGetResponseSchema> | undefined,
    ...restOptions
  })
}

