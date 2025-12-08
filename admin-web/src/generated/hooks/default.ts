'use client'
import { useQuery, useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { healthCheckHealthGet, readinessCheckHealthReadyGet, livenessCheckHealthLiveGet, applePayDomainAssociationWellKnownAppleDeveloperMerchantidDomainAssociationGet, rootGet } from '@/generated/actions/default'
import {
  HealthCheckHealthGetResponseSchema,
  ReadinessCheckHealthReadyGetResponseSchema,
  LivenessCheckHealthLiveGetResponseSchema,
  ApplePayDomainAssociationWellKnownAppleDeveloperMerchantidDomainAssociationGetResponseSchema,
  RootGetResponseSchema
} from '@/generated/schemas'
import type { z } from 'zod'



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
 * Optimized query hook for GET /health
 * Features: Smart caching, error handling, type safety
 * @returns useQuery result with data of type z.infer<typeof HealthCheckHealthGetResponseSchema>
 */
export function useHealthCheckHealthGet(options?: { enabled?: boolean; suspense?: boolean; refetchInterval?: number; initialData?: z.infer<typeof HealthCheckHealthGetResponseSchema> }) {
  const { initialData, ...restOptions } = options ?? {}

  return useQuery({
    queryKey: ['healthCheckHealthGet'],
    queryFn: async ({ signal }: { signal?: AbortSignal }) => {
      try {
        const result = await resolveActionResult<z.infer<typeof HealthCheckHealthGetResponseSchema>>(healthCheckHealthGet())
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
    placeholderData: (previousData: z.infer<typeof HealthCheckHealthGetResponseSchema> | undefined) => previousData,
    retry: (failureCount: number, error: Error) => {
      // Don't retry on 4xx errors (client errors)
      if (error instanceof Error && error.message.includes('4')) return false
      // Retry up to 3 times for network/server errors
      return failureCount < 3
    },
    initialData: initialData as z.infer<typeof HealthCheckHealthGetResponseSchema> | undefined,
    ...restOptions
  })
}

/**
 * Suspense version for /health
 * @returns useSuspenseQuery result with data of type z.infer<typeof HealthCheckHealthGetResponseSchema>
 */
export function useSuspenseHealthCheckHealthGet(options?: { enabled?: boolean; suspense?: boolean; refetchInterval?: number; initialData?: z.infer<typeof HealthCheckHealthGetResponseSchema> }) {
  const { initialData, ...restOptions } = options ?? {}

  return useSuspenseQuery({
    queryKey: ['healthCheckHealthGet'],
    queryFn: async () => {
      const result = await resolveActionResult<z.infer<typeof HealthCheckHealthGetResponseSchema>>(healthCheckHealthGet())
      return result
    },
    staleTime: 180000,
    initialData: initialData as z.infer<typeof HealthCheckHealthGetResponseSchema> | undefined,
    ...restOptions
  })
}

/**
 * Optimized query hook for GET /health/ready
 * Features: Smart caching, error handling, type safety
 * @returns useQuery result with data of type z.infer<typeof ReadinessCheckHealthReadyGetResponseSchema>
 */
export function useReadinessCheckHealthReadyGet(options?: { enabled?: boolean; suspense?: boolean; refetchInterval?: number; initialData?: z.infer<typeof ReadinessCheckHealthReadyGetResponseSchema> }) {
  const { initialData, ...restOptions } = options ?? {}

  return useQuery({
    queryKey: ['readinessCheckHealthReadyGet'],
    queryFn: async ({ signal }: { signal?: AbortSignal }) => {
      try {
        const result = await resolveActionResult<z.infer<typeof ReadinessCheckHealthReadyGetResponseSchema>>(readinessCheckHealthReadyGet())
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
    placeholderData: (previousData: z.infer<typeof ReadinessCheckHealthReadyGetResponseSchema> | undefined) => previousData,
    retry: (failureCount: number, error: Error) => {
      // Don't retry on 4xx errors (client errors)
      if (error instanceof Error && error.message.includes('4')) return false
      // Retry up to 3 times for network/server errors
      return failureCount < 3
    },
    initialData: initialData as z.infer<typeof ReadinessCheckHealthReadyGetResponseSchema> | undefined,
    ...restOptions
  })
}

/**
 * Suspense version for /health/ready
 * @returns useSuspenseQuery result with data of type z.infer<typeof ReadinessCheckHealthReadyGetResponseSchema>
 */
export function useSuspenseReadinessCheckHealthReadyGet(options?: { enabled?: boolean; suspense?: boolean; refetchInterval?: number; initialData?: z.infer<typeof ReadinessCheckHealthReadyGetResponseSchema> }) {
  const { initialData, ...restOptions } = options ?? {}

  return useSuspenseQuery({
    queryKey: ['readinessCheckHealthReadyGet'],
    queryFn: async () => {
      const result = await resolveActionResult<z.infer<typeof ReadinessCheckHealthReadyGetResponseSchema>>(readinessCheckHealthReadyGet())
      return result
    },
    staleTime: 180000,
    initialData: initialData as z.infer<typeof ReadinessCheckHealthReadyGetResponseSchema> | undefined,
    ...restOptions
  })
}

/**
 * Optimized query hook for GET /health/live
 * Features: Smart caching, error handling, type safety
 * @returns useQuery result with data of type z.infer<typeof LivenessCheckHealthLiveGetResponseSchema>
 */
export function useLivenessCheckHealthLiveGet(options?: { enabled?: boolean; suspense?: boolean; refetchInterval?: number; initialData?: z.infer<typeof LivenessCheckHealthLiveGetResponseSchema> }) {
  const { initialData, ...restOptions } = options ?? {}

  return useQuery({
    queryKey: ['livenessCheckHealthLiveGet'],
    queryFn: async ({ signal }: { signal?: AbortSignal }) => {
      try {
        const result = await resolveActionResult<z.infer<typeof LivenessCheckHealthLiveGetResponseSchema>>(livenessCheckHealthLiveGet())
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
    placeholderData: (previousData: z.infer<typeof LivenessCheckHealthLiveGetResponseSchema> | undefined) => previousData,
    retry: (failureCount: number, error: Error) => {
      // Don't retry on 4xx errors (client errors)
      if (error instanceof Error && error.message.includes('4')) return false
      // Retry up to 3 times for network/server errors
      return failureCount < 3
    },
    initialData: initialData as z.infer<typeof LivenessCheckHealthLiveGetResponseSchema> | undefined,
    ...restOptions
  })
}

/**
 * Suspense version for /health/live
 * @returns useSuspenseQuery result with data of type z.infer<typeof LivenessCheckHealthLiveGetResponseSchema>
 */
export function useSuspenseLivenessCheckHealthLiveGet(options?: { enabled?: boolean; suspense?: boolean; refetchInterval?: number; initialData?: z.infer<typeof LivenessCheckHealthLiveGetResponseSchema> }) {
  const { initialData, ...restOptions } = options ?? {}

  return useSuspenseQuery({
    queryKey: ['livenessCheckHealthLiveGet'],
    queryFn: async () => {
      const result = await resolveActionResult<z.infer<typeof LivenessCheckHealthLiveGetResponseSchema>>(livenessCheckHealthLiveGet())
      return result
    },
    staleTime: 180000,
    initialData: initialData as z.infer<typeof LivenessCheckHealthLiveGetResponseSchema> | undefined,
    ...restOptions
  })
}

/**
 * Optimized query hook for GET /.well-known/apple-developer-merchantid-domain-association
 * Features: Smart caching, error handling, type safety
 * @returns useQuery result with data of type z.infer<typeof ApplePayDomainAssociationWellKnownAppleDeveloperMerchantidDomainAssociationGetResponseSchema>
 */
export function useApplePayDomainAssociationWellKnownAppleDeveloperMerchantidDomainAssociationGet(options?: { enabled?: boolean; suspense?: boolean; refetchInterval?: number; initialData?: z.infer<typeof ApplePayDomainAssociationWellKnownAppleDeveloperMerchantidDomainAssociationGetResponseSchema> }) {
  const { initialData, ...restOptions } = options ?? {}

  return useQuery({
    queryKey: ['applePayDomainAssociationWellKnownAppleDeveloperMerchantidDomainAssociationGet'],
    queryFn: async ({ signal }: { signal?: AbortSignal }) => {
      try {
        const result = await resolveActionResult<z.infer<typeof ApplePayDomainAssociationWellKnownAppleDeveloperMerchantidDomainAssociationGetResponseSchema>>(applePayDomainAssociationWellKnownAppleDeveloperMerchantidDomainAssociationGet())
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
    placeholderData: (previousData: z.infer<typeof ApplePayDomainAssociationWellKnownAppleDeveloperMerchantidDomainAssociationGetResponseSchema> | undefined) => previousData,
    retry: (failureCount: number, error: Error) => {
      // Don't retry on 4xx errors (client errors)
      if (error instanceof Error && error.message.includes('4')) return false
      // Retry up to 3 times for network/server errors
      return failureCount < 3
    },
    initialData: initialData as z.infer<typeof ApplePayDomainAssociationWellKnownAppleDeveloperMerchantidDomainAssociationGetResponseSchema> | undefined,
    ...restOptions
  })
}

/**
 * Suspense version for /.well-known/apple-developer-merchantid-domain-association
 * @returns useSuspenseQuery result with data of type z.infer<typeof ApplePayDomainAssociationWellKnownAppleDeveloperMerchantidDomainAssociationGetResponseSchema>
 */
export function useSuspenseApplePayDomainAssociationWellKnownAppleDeveloperMerchantidDomainAssociationGet(options?: { enabled?: boolean; suspense?: boolean; refetchInterval?: number; initialData?: z.infer<typeof ApplePayDomainAssociationWellKnownAppleDeveloperMerchantidDomainAssociationGetResponseSchema> }) {
  const { initialData, ...restOptions } = options ?? {}

  return useSuspenseQuery({
    queryKey: ['applePayDomainAssociationWellKnownAppleDeveloperMerchantidDomainAssociationGet'],
    queryFn: async () => {
      const result = await resolveActionResult<z.infer<typeof ApplePayDomainAssociationWellKnownAppleDeveloperMerchantidDomainAssociationGetResponseSchema>>(applePayDomainAssociationWellKnownAppleDeveloperMerchantidDomainAssociationGet())
      return result
    },
    staleTime: 180000,
    initialData: initialData as z.infer<typeof ApplePayDomainAssociationWellKnownAppleDeveloperMerchantidDomainAssociationGetResponseSchema> | undefined,
    ...restOptions
  })
}

/**
 * Optimized query hook for GET /
 * Features: Smart caching, error handling, type safety
 * @returns useQuery result with data of type z.infer<typeof RootGetResponseSchema>
 */
export function useRootGet(options?: { enabled?: boolean; suspense?: boolean; refetchInterval?: number; initialData?: z.infer<typeof RootGetResponseSchema> }) {
  const { initialData, ...restOptions } = options ?? {}

  return useQuery({
    queryKey: ['rootGet'],
    queryFn: async ({ signal }: { signal?: AbortSignal }) => {
      try {
        const result = await resolveActionResult<z.infer<typeof RootGetResponseSchema>>(rootGet())
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
    placeholderData: (previousData: z.infer<typeof RootGetResponseSchema> | undefined) => previousData,
    retry: (failureCount: number, error: Error) => {
      // Don't retry on 4xx errors (client errors)
      if (error instanceof Error && error.message.includes('4')) return false
      // Retry up to 3 times for network/server errors
      return failureCount < 3
    },
    initialData: initialData as z.infer<typeof RootGetResponseSchema> | undefined,
    ...restOptions
  })
}

/**
 * Suspense version for /
 * @returns useSuspenseQuery result with data of type z.infer<typeof RootGetResponseSchema>
 */
export function useSuspenseRootGet(options?: { enabled?: boolean; suspense?: boolean; refetchInterval?: number; initialData?: z.infer<typeof RootGetResponseSchema> }) {
  const { initialData, ...restOptions } = options ?? {}

  return useSuspenseQuery({
    queryKey: ['rootGet'],
    queryFn: async () => {
      const result = await resolveActionResult<z.infer<typeof RootGetResponseSchema>>(rootGet())
      return result
    },
    staleTime: 180000,
    initialData: initialData as z.infer<typeof RootGetResponseSchema> | undefined,
    ...restOptions
  })
}

