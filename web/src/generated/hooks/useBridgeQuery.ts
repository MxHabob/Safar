'use client'

import { useQuery, useMutation, useInfiniteQuery, useSuspenseQuery, type UseQueryOptions, type UseMutationOptions, type UseInfiniteQueryOptions, type UseSuspenseQueryOptions, type QueryKey, type QueryFunction } from '@tanstack/react-query'

/**
 * Enhanced React Query wrapper hook with Next.js 16.0.1 optimizations
 * Provides consistent defaults across all queries following best practices
 * 
 * Features:
 * - React Query v5: Uses gcTime instead of cacheTime
 * - React Query v5: Uses placeholderData instead of keepPreviousData
 * - Next.js 16.0.1: Optimized for App Router and Server Components
 */
export function useBridgeQuery<TData = unknown, TError = Error>(
  queryKey: QueryKey,
  queryFn: QueryFunction<TData, QueryKey>,
  options?: Partial<UseQueryOptions<TData, TError, TData, QueryKey>>
) {
  return useQuery<TData, TError>({
    queryKey,
    queryFn: queryFn as QueryFunction<TData, QueryKey>,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchOnMount: 'always',
    // React Query v5: placeholderData returns previous data if available
    placeholderData: (previousData) => previousData,
    retry: (failureCount: number, error: TError) => {
      if (error instanceof Error && error.message.includes('4')) return false
      return failureCount < 3
    },
    ...options,
  })
}

/**
 * Enhanced infinite query wrapper
 * React Query v5: Optimized for paginated data with infinite scrolling
 */
export function useBridgeInfiniteQuery<TData = unknown, TError = Error, TPageParam = number>(
  queryKey: QueryKey,
  queryFn: QueryFunction<TData, QueryKey, TPageParam>,
  options?: Partial<UseInfiniteQueryOptions<TData, TError, TData, QueryKey, TPageParam>> & {
    getNextPageParam?: (lastPage: TData, allPages: TData[]) => TPageParam | undefined
  }
) {
  return useInfiniteQuery<TData, TError, TData, QueryKey, TPageParam>({
    queryKey,
    initialPageParam: 1 as TPageParam,
    queryFn,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchOnMount: 'always',
    retry: (failureCount: number, error: TError) => {
      if (error instanceof Error && error.message.includes('4')) return false
      return failureCount < 3
    },
    // Provide default getNextPageParam if not provided
    getNextPageParam: options?.getNextPageParam || (() => undefined),
    ...options,
  })
}

/**
 * Enhanced suspense query wrapper
 * Next.js 16.0.1: Optimized for Server Components with Suspense
 */
export function useBridgeSuspenseQuery<TData = unknown, TError = Error>(
  queryKey: QueryKey,
  queryFn: QueryFunction<TData, QueryKey>,
  options?: Partial<UseSuspenseQueryOptions<TData, TError, TData, QueryKey>>
) {
  return useSuspenseQuery<TData, TError>({
    queryKey,
    queryFn: queryFn as QueryFunction<TData, QueryKey>,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: (failureCount: number, error: TError) => {
      if (error instanceof Error && error.message.includes('4')) return false
      return failureCount < 3
    },
    ...options,
  })
}

/**
 * Enhanced mutation wrapper
 */
export function useBridgeMutation<TData = unknown, TError = Error, TVariables = void>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options?: Partial<UseMutationOptions<TData, TError, TVariables>>
) {
  return useMutation<TData, TError, TVariables>({
    mutationFn,
    retry: 3,
    ...options,
  })
}
