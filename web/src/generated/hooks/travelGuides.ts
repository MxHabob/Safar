'use client'
import { useQuery, useQueryClient, useSuspenseQuery, useMutation } from '@tanstack/react-query'
import { useOptimistic, useTransition } from 'react'
import { parseAsInteger, parseAsString, useQueryStates } from 'nuqs'
import { toast } from 'sonner'
import { getGuidesApiV1TravelGuidesGet, getGuideApiV1TravelGuidesGuideIdGet, getStoriesApiV1TravelGuidesStoriesGet, getStoryApiV1TravelGuidesStoriesStoryIdGet, createGuideApiV1TravelGuidesPost, publishGuideApiV1TravelGuidesGuideIdPublishPost, bookmarkGuideApiV1TravelGuidesGuideIdBookmarkPost, likeGuideApiV1TravelGuidesGuideIdLikePost, createStoryApiV1TravelGuidesStoriesPost, publishStoryApiV1TravelGuidesStoriesStoryIdPublishPost } from '@/generated/actions/travelGuides'
import {
  GetGuidesApiV1TravelGuidesGetResponseSchema,
  GetGuidesApiV1TravelGuidesGetParamsSchema,
  GetGuideApiV1TravelGuidesGuideIdGetResponseSchema,
  GetGuideApiV1TravelGuidesGuideIdGetParamsSchema,
  GetStoriesApiV1TravelGuidesStoriesGetResponseSchema,
  GetStoriesApiV1TravelGuidesStoriesGetParamsSchema,
  GetStoryApiV1TravelGuidesStoriesStoryIdGetResponseSchema,
  GetStoryApiV1TravelGuidesStoriesStoryIdGetParamsSchema,
  CreateGuideApiV1TravelGuidesPostResponseSchema,
  CreateGuideApiV1TravelGuidesPostRequestSchema,
  PublishGuideApiV1TravelGuidesGuideIdPublishPostResponseSchema,
  PublishGuideApiV1TravelGuidesGuideIdPublishPostParamsSchema,
  BookmarkGuideApiV1TravelGuidesGuideIdBookmarkPostResponseSchema,
  BookmarkGuideApiV1TravelGuidesGuideIdBookmarkPostParamsSchema,
  LikeGuideApiV1TravelGuidesGuideIdLikePostResponseSchema,
  LikeGuideApiV1TravelGuidesGuideIdLikePostParamsSchema,
  CreateStoryApiV1TravelGuidesStoriesPostResponseSchema,
  CreateStoryApiV1TravelGuidesStoriesPostRequestSchema,
  PublishStoryApiV1TravelGuidesStoriesStoryIdPublishPostResponseSchema,
  PublishStoryApiV1TravelGuidesStoriesStoryIdPublishPostParamsSchema
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
 * Optimized query hook for GET /api/v1/travel-guides
 * Features: Smart caching, error handling, type safety
 * @returns useQuery result with data of type z.infer<typeof GetGuidesApiV1TravelGuidesGetResponseSchema>
 */
export function useGetGuidesApiV1TravelGuidesGet(destination?: unknown, country?: unknown, city?: unknown, tags?: unknown, category?: unknown, is_official?: unknown, status?: string, skip?: number, limit?: number, sort_by?: string, options?: { enabled?: boolean; suspense?: boolean; refetchInterval?: number; initialData?: z.infer<typeof GetGuidesApiV1TravelGuidesGetResponseSchema> }) {
  const { initialData, ...restOptions } = options ?? {}

  return useQuery({
    queryKey: ['getGuidesApiV1TravelGuidesGet', destination, country, city, tags, category, is_official, status, skip, limit, sort_by],
    queryFn: async ({ signal }: { signal?: AbortSignal }) => {
      try {
        const result = await resolveActionResult<z.infer<typeof GetGuidesApiV1TravelGuidesGetResponseSchema>>(getGuidesApiV1TravelGuidesGet({ query: { destination, country, city, tags, category, is_official, status, skip, limit, sort_by } }))
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
    placeholderData: (previousData: z.infer<typeof GetGuidesApiV1TravelGuidesGetResponseSchema> | undefined) => previousData,
    retry: (failureCount: number, error: Error) => {
      // Don't retry on 4xx errors (client errors)
      if (error instanceof Error && error.message.includes('4')) return false
      // Retry up to 3 times for network/server errors
      return failureCount < 3
    },
    initialData: initialData as z.infer<typeof GetGuidesApiV1TravelGuidesGetResponseSchema> | undefined,
    ...restOptions
  })
}

/**
 * Suspense version for /api/v1/travel-guides
 * @returns useSuspenseQuery result with data of type z.infer<typeof GetGuidesApiV1TravelGuidesGetResponseSchema>
 */
export function useSuspenseGetGuidesApiV1TravelGuidesGet(destination?: unknown, country?: unknown, city?: unknown, tags?: unknown, category?: unknown, is_official?: unknown, status?: string, skip?: number, limit?: number, sort_by?: string, options?: { enabled?: boolean; suspense?: boolean; refetchInterval?: number; initialData?: z.infer<typeof GetGuidesApiV1TravelGuidesGetResponseSchema> }) {
  const { initialData, ...restOptions } = options ?? {}

  return useSuspenseQuery({
    queryKey: ['getGuidesApiV1TravelGuidesGet', destination, country, city, tags, category, is_official, status, skip, limit, sort_by],
    queryFn: async () => {
      const result = await resolveActionResult<z.infer<typeof GetGuidesApiV1TravelGuidesGetResponseSchema>>(getGuidesApiV1TravelGuidesGet({ query: { destination, country, city, tags, category, is_official, status, skip, limit, sort_by } }))
      return result
    },
    staleTime: 180000,
    initialData: initialData as z.infer<typeof GetGuidesApiV1TravelGuidesGetResponseSchema> | undefined,
    ...restOptions
  })
}

/**
 * Optimized query hook for GET /api/v1/travel-guides/{guide_id}
 * Features: Smart caching, error handling, type safety
 * @returns useQuery result with data of type z.infer<typeof GetGuideApiV1TravelGuidesGuideIdGetResponseSchema>
 */
export function useGetGuideApiV1TravelGuidesGuideIdGet(guide_id: string, options?: { enabled?: boolean; suspense?: boolean; refetchInterval?: number; initialData?: z.infer<typeof GetGuideApiV1TravelGuidesGuideIdGetResponseSchema> }) {
  const { initialData, ...restOptions } = options ?? {}

  return useQuery({
    queryKey: ['getGuideApiV1TravelGuidesGuideIdGet', guide_id],
    queryFn: async ({ signal }: { signal?: AbortSignal }) => {
      try {
        const result = await resolveActionResult<z.infer<typeof GetGuideApiV1TravelGuidesGuideIdGetResponseSchema>>(getGuideApiV1TravelGuidesGuideIdGet({ path: { guide_id } }))
        return result
      } catch (error) {
        handleActionError(error)
      }
    },
    staleTime: 180000,
    gcTime: 360000, // React Query v5: gcTime replaces cacheTime
    enabled: !!guide_id && (options?.enabled ?? true),
    refetchOnWindowFocus: true, // Refetch when window regains focus
    refetchOnReconnect: true, // Refetch when network reconnects
    refetchOnMount: 'always', // Always refetch on mount for fresh data
    refetchInterval: options?.refetchInterval, // Optional polling interval
    // React Query v5: placeholderData replaces keepPreviousData
    placeholderData: (previousData: z.infer<typeof GetGuideApiV1TravelGuidesGuideIdGetResponseSchema> | undefined) => previousData,
    retry: (failureCount: number, error: Error) => {
      // Don't retry on 4xx errors (client errors)
      if (error instanceof Error && error.message.includes('4')) return false
      // Retry up to 3 times for network/server errors
      return failureCount < 3
    },
    initialData: initialData as z.infer<typeof GetGuideApiV1TravelGuidesGuideIdGetResponseSchema> | undefined,
    ...restOptions
  })
}

/**
 * Suspense version for /api/v1/travel-guides/{guide_id}
 * @returns useSuspenseQuery result with data of type z.infer<typeof GetGuideApiV1TravelGuidesGuideIdGetResponseSchema>
 */
export function useSuspenseGetGuideApiV1TravelGuidesGuideIdGet(guide_id: string, options?: { enabled?: boolean; suspense?: boolean; refetchInterval?: number; initialData?: z.infer<typeof GetGuideApiV1TravelGuidesGuideIdGetResponseSchema> }) {
  const { initialData, ...restOptions } = options ?? {}

  return useSuspenseQuery({
    queryKey: ['getGuideApiV1TravelGuidesGuideIdGet', guide_id],
    queryFn: async () => {
      const result = await resolveActionResult<z.infer<typeof GetGuideApiV1TravelGuidesGuideIdGetResponseSchema>>(getGuideApiV1TravelGuidesGuideIdGet({ path: { guide_id } }))
      return result
    },
    staleTime: 180000,
    initialData: initialData as z.infer<typeof GetGuideApiV1TravelGuidesGuideIdGetResponseSchema> | undefined,
    ...restOptions
  })
}

/**
 * Optimized query hook for GET /api/v1/travel-guides/stories
 * Features: Smart caching, error handling, type safety
 * @returns useQuery result with data of type z.infer<typeof GetStoriesApiV1TravelGuidesStoriesGetResponseSchema>
 */
export function useGetStoriesApiV1TravelGuidesStoriesGet(destination?: unknown, country?: unknown, author_id?: unknown, guide_id?: unknown, is_featured?: unknown, status?: string, skip?: number, limit?: number, sort_by?: string, options?: { enabled?: boolean; suspense?: boolean; refetchInterval?: number; initialData?: z.infer<typeof GetStoriesApiV1TravelGuidesStoriesGetResponseSchema> }) {
  const { initialData, ...restOptions } = options ?? {}

  return useQuery({
    queryKey: ['getStoriesApiV1TravelGuidesStoriesGet', destination, country, author_id, guide_id, is_featured, status, skip, limit, sort_by],
    queryFn: async ({ signal }: { signal?: AbortSignal }) => {
      try {
        const result = await resolveActionResult<z.infer<typeof GetStoriesApiV1TravelGuidesStoriesGetResponseSchema>>(getStoriesApiV1TravelGuidesStoriesGet({ query: { destination, country, author_id, guide_id, is_featured, status, skip, limit, sort_by } }))
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
    placeholderData: (previousData: z.infer<typeof GetStoriesApiV1TravelGuidesStoriesGetResponseSchema> | undefined) => previousData,
    retry: (failureCount: number, error: Error) => {
      // Don't retry on 4xx errors (client errors)
      if (error instanceof Error && error.message.includes('4')) return false
      // Retry up to 3 times for network/server errors
      return failureCount < 3
    },
    initialData: initialData as z.infer<typeof GetStoriesApiV1TravelGuidesStoriesGetResponseSchema> | undefined,
    ...restOptions
  })
}

/**
 * Suspense version for /api/v1/travel-guides/stories
 * @returns useSuspenseQuery result with data of type z.infer<typeof GetStoriesApiV1TravelGuidesStoriesGetResponseSchema>
 */
export function useSuspenseGetStoriesApiV1TravelGuidesStoriesGet(destination?: unknown, country?: unknown, author_id?: unknown, guide_id?: unknown, is_featured?: unknown, status?: string, skip?: number, limit?: number, sort_by?: string, options?: { enabled?: boolean; suspense?: boolean; refetchInterval?: number; initialData?: z.infer<typeof GetStoriesApiV1TravelGuidesStoriesGetResponseSchema> }) {
  const { initialData, ...restOptions } = options ?? {}

  return useSuspenseQuery({
    queryKey: ['getStoriesApiV1TravelGuidesStoriesGet', destination, country, author_id, guide_id, is_featured, status, skip, limit, sort_by],
    queryFn: async () => {
      const result = await resolveActionResult<z.infer<typeof GetStoriesApiV1TravelGuidesStoriesGetResponseSchema>>(getStoriesApiV1TravelGuidesStoriesGet({ query: { destination, country, author_id, guide_id, is_featured, status, skip, limit, sort_by } }))
      return result
    },
    staleTime: 180000,
    initialData: initialData as z.infer<typeof GetStoriesApiV1TravelGuidesStoriesGetResponseSchema> | undefined,
    ...restOptions
  })
}

/**
 * Optimized query hook for GET /api/v1/travel-guides/stories/{story_id}
 * Features: Smart caching, error handling, type safety
 * @returns useQuery result with data of type z.infer<typeof GetStoryApiV1TravelGuidesStoriesStoryIdGetResponseSchema>
 */
export function useGetStoryApiV1TravelGuidesStoriesStoryIdGet(story_id: string, options?: { enabled?: boolean; suspense?: boolean; refetchInterval?: number; initialData?: z.infer<typeof GetStoryApiV1TravelGuidesStoriesStoryIdGetResponseSchema> }) {
  const { initialData, ...restOptions } = options ?? {}

  return useQuery({
    queryKey: ['getStoryApiV1TravelGuidesStoriesStoryIdGet', story_id],
    queryFn: async ({ signal }: { signal?: AbortSignal }) => {
      try {
        const result = await resolveActionResult<z.infer<typeof GetStoryApiV1TravelGuidesStoriesStoryIdGetResponseSchema>>(getStoryApiV1TravelGuidesStoriesStoryIdGet({ path: { story_id } }))
        return result
      } catch (error) {
        handleActionError(error)
      }
    },
    staleTime: 180000,
    gcTime: 360000, // React Query v5: gcTime replaces cacheTime
    enabled: !!story_id && (options?.enabled ?? true),
    refetchOnWindowFocus: true, // Refetch when window regains focus
    refetchOnReconnect: true, // Refetch when network reconnects
    refetchOnMount: 'always', // Always refetch on mount for fresh data
    refetchInterval: options?.refetchInterval, // Optional polling interval
    // React Query v5: placeholderData replaces keepPreviousData
    placeholderData: (previousData: z.infer<typeof GetStoryApiV1TravelGuidesStoriesStoryIdGetResponseSchema> | undefined) => previousData,
    retry: (failureCount: number, error: Error) => {
      // Don't retry on 4xx errors (client errors)
      if (error instanceof Error && error.message.includes('4')) return false
      // Retry up to 3 times for network/server errors
      return failureCount < 3
    },
    initialData: initialData as z.infer<typeof GetStoryApiV1TravelGuidesStoriesStoryIdGetResponseSchema> | undefined,
    ...restOptions
  })
}

/**
 * Suspense version for /api/v1/travel-guides/stories/{story_id}
 * @returns useSuspenseQuery result with data of type z.infer<typeof GetStoryApiV1TravelGuidesStoriesStoryIdGetResponseSchema>
 */
export function useSuspenseGetStoryApiV1TravelGuidesStoriesStoryIdGet(story_id: string, options?: { enabled?: boolean; suspense?: boolean; refetchInterval?: number; initialData?: z.infer<typeof GetStoryApiV1TravelGuidesStoriesStoryIdGetResponseSchema> }) {
  const { initialData, ...restOptions } = options ?? {}

  return useSuspenseQuery({
    queryKey: ['getStoryApiV1TravelGuidesStoriesStoryIdGet', story_id],
    queryFn: async () => {
      const result = await resolveActionResult<z.infer<typeof GetStoryApiV1TravelGuidesStoriesStoryIdGetResponseSchema>>(getStoryApiV1TravelGuidesStoriesStoryIdGet({ path: { story_id } }))
      return result
    },
    staleTime: 180000,
    initialData: initialData as z.infer<typeof GetStoryApiV1TravelGuidesStoriesStoryIdGetResponseSchema> | undefined,
    ...restOptions
  })
}

/**
 * Optimized mutation hook for POST /api/v1/travel-guides
 * Features: Optimistic updates, smart invalidation, error handling
 * @param options - Mutation options
 * @returns Mutation result with enhanced features
 */
export function useCreateGuideApiV1TravelGuidesPostMutation(options?: {
  onSuccess?: (data: z.infer<typeof CreateGuideApiV1TravelGuidesPostResponseSchema>, variables: z.infer<typeof CreateGuideApiV1TravelGuidesPostRequestSchema>) => void
  onError?: (error: Error, variables: z.infer<typeof CreateGuideApiV1TravelGuidesPostRequestSchema>) => void
  optimisticUpdate?: (variables: z.infer<typeof CreateGuideApiV1TravelGuidesPostRequestSchema>) => unknown
  showToast?: boolean
}) {
  const queryClient = useQueryClient()
  const [isPending, startTransition] = useTransition()
  const [optimisticData, setOptimisticData] = useOptimistic<unknown, z.infer<typeof CreateGuideApiV1TravelGuidesPostRequestSchema>>(null, (_, newData) => newData)

  const mutation = useMutation({
    mutationFn: async (variables: z.infer<typeof CreateGuideApiV1TravelGuidesPostRequestSchema>): Promise<z.infer<typeof CreateGuideApiV1TravelGuidesPostResponseSchema>> => {
      try {
        const result = await resolveActionResult<z.infer<typeof CreateGuideApiV1TravelGuidesPostResponseSchema>>(createGuideApiV1TravelGuidesPost(variables))
        return (result ?? ({} as z.infer<typeof CreateGuideApiV1TravelGuidesPostResponseSchema>))
      } catch (error) {
        handleActionError(error)
      }
    },
    
    onMutate: async (variables: z.infer<typeof CreateGuideApiV1TravelGuidesPostRequestSchema>) => {
      await Promise.all([
        queryClient.cancelQueries({ queryKey: ['getGuidesApiV1TravelGuidesGet'] }),
        queryClient.cancelQueries({ queryKey: ['getGuideApiV1TravelGuidesGuideIdGet'] }),
        queryClient.cancelQueries({ queryKey: ['getStoriesApiV1TravelGuidesStoriesGet'] }),
        queryClient.cancelQueries({ queryKey: ['getStoryApiV1TravelGuidesStoriesStoryIdGet'] })
      ])

      // Optimistic update (if provided)
      if (options?.optimisticUpdate) {
        const optimisticValue = options.optimisticUpdate(variables)
        setOptimisticData(optimisticValue as z.infer<typeof CreateGuideApiV1TravelGuidesPostRequestSchema>)
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
    
    onError: (error: Error, variables: z.infer<typeof CreateGuideApiV1TravelGuidesPostRequestSchema>) => {
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
        queryClient.invalidateQueries({ queryKey: ['getGuidesApiV1TravelGuidesGet'] }),
        queryClient.invalidateQueries({ queryKey: ['getGuideApiV1TravelGuidesGuideIdGet'] }),
        queryClient.invalidateQueries({ queryKey: ['getStoriesApiV1TravelGuidesStoriesGet'] }),
        queryClient.invalidateQueries({ queryKey: ['getStoryApiV1TravelGuidesStoriesStoryIdGet'] }),
        queryClient.invalidateQueries({ queryKey: ['Travel Guides'] })
      ])
    }
  })

  return {
    ...mutation,
    mutateWithTransition: (variables: z.infer<typeof CreateGuideApiV1TravelGuidesPostRequestSchema>) => {
      startTransition(() => {
        mutation.mutate(variables)
      })
    },
    isPending: isPending || mutation.isPending,
    optimisticData
  }
}

/**
 * Optimized mutation hook for POST /api/v1/travel-guides/{guide_id}/publish
 * Features: Optimistic updates, smart invalidation, error handling
 * @param options - Mutation options
 * @returns Mutation result with enhanced features
 */
export function usePublishGuideApiV1TravelGuidesGuideIdPublishPostMutation(options?: {
  onSuccess?: (data: z.infer<typeof PublishGuideApiV1TravelGuidesGuideIdPublishPostResponseSchema>, variables: z.infer<typeof PublishGuideApiV1TravelGuidesGuideIdPublishPostParamsSchema>) => void
  onError?: (error: Error, variables: z.infer<typeof PublishGuideApiV1TravelGuidesGuideIdPublishPostParamsSchema>) => void
  optimisticUpdate?: (variables: z.infer<typeof PublishGuideApiV1TravelGuidesGuideIdPublishPostParamsSchema>) => unknown
  showToast?: boolean
}) {
  const queryClient = useQueryClient()
  const [isPending, startTransition] = useTransition()
  const [optimisticData, setOptimisticData] = useOptimistic<unknown, z.infer<typeof PublishGuideApiV1TravelGuidesGuideIdPublishPostParamsSchema>>(null, (_, newData) => newData)

  const mutation = useMutation({
    mutationFn: async (variables: z.infer<typeof PublishGuideApiV1TravelGuidesGuideIdPublishPostParamsSchema>): Promise<z.infer<typeof PublishGuideApiV1TravelGuidesGuideIdPublishPostResponseSchema>> => {
      try {
        const result = await resolveActionResult<z.infer<typeof PublishGuideApiV1TravelGuidesGuideIdPublishPostResponseSchema>>(publishGuideApiV1TravelGuidesGuideIdPublishPost(variables))
        return (result ?? ({} as z.infer<typeof PublishGuideApiV1TravelGuidesGuideIdPublishPostResponseSchema>))
      } catch (error) {
        handleActionError(error)
      }
    },
    
    onMutate: async (variables: z.infer<typeof PublishGuideApiV1TravelGuidesGuideIdPublishPostParamsSchema>) => {
      await Promise.all([
        queryClient.cancelQueries({ queryKey: ['getGuidesApiV1TravelGuidesGet'] }),
        queryClient.cancelQueries({ queryKey: ['getGuideApiV1TravelGuidesGuideIdGet'] }),
        queryClient.cancelQueries({ queryKey: ['getStoriesApiV1TravelGuidesStoriesGet'] }),
        queryClient.cancelQueries({ queryKey: ['getStoryApiV1TravelGuidesStoriesStoryIdGet'] })
      ])

      // Optimistic update (if provided)
      if (options?.optimisticUpdate) {
        const optimisticValue = options.optimisticUpdate(variables)
        setOptimisticData(optimisticValue as z.infer<typeof PublishGuideApiV1TravelGuidesGuideIdPublishPostParamsSchema>)
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
    
    onError: (error: Error, variables: z.infer<typeof PublishGuideApiV1TravelGuidesGuideIdPublishPostParamsSchema>) => {
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
        queryClient.invalidateQueries({ queryKey: ['getGuidesApiV1TravelGuidesGet'] }),
        queryClient.invalidateQueries({ queryKey: ['getGuideApiV1TravelGuidesGuideIdGet'] }),
        queryClient.invalidateQueries({ queryKey: ['getStoriesApiV1TravelGuidesStoriesGet'] }),
        queryClient.invalidateQueries({ queryKey: ['getStoryApiV1TravelGuidesStoriesStoryIdGet'] }),
        queryClient.invalidateQueries({ queryKey: ['Travel Guides'] })
      ])
    }
  })

  return {
    ...mutation,
    mutateWithTransition: (variables: z.infer<typeof PublishGuideApiV1TravelGuidesGuideIdPublishPostParamsSchema>) => {
      startTransition(() => {
        mutation.mutate(variables)
      })
    },
    isPending: isPending || mutation.isPending,
    optimisticData
  }
}

/**
 * Optimized mutation hook for POST /api/v1/travel-guides/{guide_id}/bookmark
 * Features: Optimistic updates, smart invalidation, error handling
 * @param options - Mutation options
 * @returns Mutation result with enhanced features
 */
export function useBookmarkGuideApiV1TravelGuidesGuideIdBookmarkPostMutation(options?: {
  onSuccess?: (data: z.infer<typeof BookmarkGuideApiV1TravelGuidesGuideIdBookmarkPostResponseSchema>, variables: z.infer<typeof BookmarkGuideApiV1TravelGuidesGuideIdBookmarkPostParamsSchema>) => void
  onError?: (error: Error, variables: z.infer<typeof BookmarkGuideApiV1TravelGuidesGuideIdBookmarkPostParamsSchema>) => void
  optimisticUpdate?: (variables: z.infer<typeof BookmarkGuideApiV1TravelGuidesGuideIdBookmarkPostParamsSchema>) => unknown
  showToast?: boolean
}) {
  const queryClient = useQueryClient()
  const [isPending, startTransition] = useTransition()
  const [optimisticData, setOptimisticData] = useOptimistic<unknown, z.infer<typeof BookmarkGuideApiV1TravelGuidesGuideIdBookmarkPostParamsSchema>>(null, (_, newData) => newData)

  const mutation = useMutation({
    mutationFn: async (variables: z.infer<typeof BookmarkGuideApiV1TravelGuidesGuideIdBookmarkPostParamsSchema>): Promise<z.infer<typeof BookmarkGuideApiV1TravelGuidesGuideIdBookmarkPostResponseSchema>> => {
      try {
        const result = await resolveActionResult<z.infer<typeof BookmarkGuideApiV1TravelGuidesGuideIdBookmarkPostResponseSchema>>(bookmarkGuideApiV1TravelGuidesGuideIdBookmarkPost(variables))
        return (result ?? ({} as z.infer<typeof BookmarkGuideApiV1TravelGuidesGuideIdBookmarkPostResponseSchema>))
      } catch (error) {
        handleActionError(error)
      }
    },
    
    onMutate: async (variables: z.infer<typeof BookmarkGuideApiV1TravelGuidesGuideIdBookmarkPostParamsSchema>) => {
      await Promise.all([
        queryClient.cancelQueries({ queryKey: ['getGuidesApiV1TravelGuidesGet'] }),
        queryClient.cancelQueries({ queryKey: ['getGuideApiV1TravelGuidesGuideIdGet'] }),
        queryClient.cancelQueries({ queryKey: ['getStoriesApiV1TravelGuidesStoriesGet'] }),
        queryClient.cancelQueries({ queryKey: ['getStoryApiV1TravelGuidesStoriesStoryIdGet'] })
      ])

      // Optimistic update (if provided)
      if (options?.optimisticUpdate) {
        const optimisticValue = options.optimisticUpdate(variables)
        setOptimisticData(optimisticValue as z.infer<typeof BookmarkGuideApiV1TravelGuidesGuideIdBookmarkPostParamsSchema>)
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
    
    onError: (error: Error, variables: z.infer<typeof BookmarkGuideApiV1TravelGuidesGuideIdBookmarkPostParamsSchema>) => {
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
        queryClient.invalidateQueries({ queryKey: ['getGuidesApiV1TravelGuidesGet'] }),
        queryClient.invalidateQueries({ queryKey: ['getGuideApiV1TravelGuidesGuideIdGet'] }),
        queryClient.invalidateQueries({ queryKey: ['getStoriesApiV1TravelGuidesStoriesGet'] }),
        queryClient.invalidateQueries({ queryKey: ['getStoryApiV1TravelGuidesStoriesStoryIdGet'] }),
        queryClient.invalidateQueries({ queryKey: ['Travel Guides'] })
      ])
    }
  })

  return {
    ...mutation,
    mutateWithTransition: (variables: z.infer<typeof BookmarkGuideApiV1TravelGuidesGuideIdBookmarkPostParamsSchema>) => {
      startTransition(() => {
        mutation.mutate(variables)
      })
    },
    isPending: isPending || mutation.isPending,
    optimisticData
  }
}

/**
 * Optimized mutation hook for POST /api/v1/travel-guides/{guide_id}/like
 * Features: Optimistic updates, smart invalidation, error handling
 * @param options - Mutation options
 * @returns Mutation result with enhanced features
 */
export function useLikeGuideApiV1TravelGuidesGuideIdLikePostMutation(options?: {
  onSuccess?: (data: z.infer<typeof LikeGuideApiV1TravelGuidesGuideIdLikePostResponseSchema>, variables: z.infer<typeof LikeGuideApiV1TravelGuidesGuideIdLikePostParamsSchema>) => void
  onError?: (error: Error, variables: z.infer<typeof LikeGuideApiV1TravelGuidesGuideIdLikePostParamsSchema>) => void
  optimisticUpdate?: (variables: z.infer<typeof LikeGuideApiV1TravelGuidesGuideIdLikePostParamsSchema>) => unknown
  showToast?: boolean
}) {
  const queryClient = useQueryClient()
  const [isPending, startTransition] = useTransition()
  const [optimisticData, setOptimisticData] = useOptimistic<unknown, z.infer<typeof LikeGuideApiV1TravelGuidesGuideIdLikePostParamsSchema>>(null, (_, newData) => newData)

  const mutation = useMutation({
    mutationFn: async (variables: z.infer<typeof LikeGuideApiV1TravelGuidesGuideIdLikePostParamsSchema>): Promise<z.infer<typeof LikeGuideApiV1TravelGuidesGuideIdLikePostResponseSchema>> => {
      try {
        const result = await resolveActionResult<z.infer<typeof LikeGuideApiV1TravelGuidesGuideIdLikePostResponseSchema>>(likeGuideApiV1TravelGuidesGuideIdLikePost(variables))
        return (result ?? ({} as z.infer<typeof LikeGuideApiV1TravelGuidesGuideIdLikePostResponseSchema>))
      } catch (error) {
        handleActionError(error)
      }
    },
    
    onMutate: async (variables: z.infer<typeof LikeGuideApiV1TravelGuidesGuideIdLikePostParamsSchema>) => {
      await Promise.all([
        queryClient.cancelQueries({ queryKey: ['getGuidesApiV1TravelGuidesGet'] }),
        queryClient.cancelQueries({ queryKey: ['getGuideApiV1TravelGuidesGuideIdGet'] }),
        queryClient.cancelQueries({ queryKey: ['getStoriesApiV1TravelGuidesStoriesGet'] }),
        queryClient.cancelQueries({ queryKey: ['getStoryApiV1TravelGuidesStoriesStoryIdGet'] })
      ])

      // Optimistic update (if provided)
      if (options?.optimisticUpdate) {
        const optimisticValue = options.optimisticUpdate(variables)
        setOptimisticData(optimisticValue as z.infer<typeof LikeGuideApiV1TravelGuidesGuideIdLikePostParamsSchema>)
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
    
    onError: (error: Error, variables: z.infer<typeof LikeGuideApiV1TravelGuidesGuideIdLikePostParamsSchema>) => {
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
        queryClient.invalidateQueries({ queryKey: ['getGuidesApiV1TravelGuidesGet'] }),
        queryClient.invalidateQueries({ queryKey: ['getGuideApiV1TravelGuidesGuideIdGet'] }),
        queryClient.invalidateQueries({ queryKey: ['getStoriesApiV1TravelGuidesStoriesGet'] }),
        queryClient.invalidateQueries({ queryKey: ['getStoryApiV1TravelGuidesStoriesStoryIdGet'] }),
        queryClient.invalidateQueries({ queryKey: ['Travel Guides'] })
      ])
    }
  })

  return {
    ...mutation,
    mutateWithTransition: (variables: z.infer<typeof LikeGuideApiV1TravelGuidesGuideIdLikePostParamsSchema>) => {
      startTransition(() => {
        mutation.mutate(variables)
      })
    },
    isPending: isPending || mutation.isPending,
    optimisticData
  }
}

/**
 * Optimized mutation hook for POST /api/v1/travel-guides/stories
 * Features: Optimistic updates, smart invalidation, error handling
 * @param options - Mutation options
 * @returns Mutation result with enhanced features
 */
export function useCreateStoryApiV1TravelGuidesStoriesPostMutation(options?: {
  onSuccess?: (data: z.infer<typeof CreateStoryApiV1TravelGuidesStoriesPostResponseSchema>, variables: z.infer<typeof CreateStoryApiV1TravelGuidesStoriesPostRequestSchema>) => void
  onError?: (error: Error, variables: z.infer<typeof CreateStoryApiV1TravelGuidesStoriesPostRequestSchema>) => void
  optimisticUpdate?: (variables: z.infer<typeof CreateStoryApiV1TravelGuidesStoriesPostRequestSchema>) => unknown
  showToast?: boolean
}) {
  const queryClient = useQueryClient()
  const [isPending, startTransition] = useTransition()
  const [optimisticData, setOptimisticData] = useOptimistic<unknown, z.infer<typeof CreateStoryApiV1TravelGuidesStoriesPostRequestSchema>>(null, (_, newData) => newData)

  const mutation = useMutation({
    mutationFn: async (variables: z.infer<typeof CreateStoryApiV1TravelGuidesStoriesPostRequestSchema>): Promise<z.infer<typeof CreateStoryApiV1TravelGuidesStoriesPostResponseSchema>> => {
      try {
        const result = await resolveActionResult<z.infer<typeof CreateStoryApiV1TravelGuidesStoriesPostResponseSchema>>(createStoryApiV1TravelGuidesStoriesPost(variables))
        return (result ?? ({} as z.infer<typeof CreateStoryApiV1TravelGuidesStoriesPostResponseSchema>))
      } catch (error) {
        handleActionError(error)
      }
    },
    
    onMutate: async (variables: z.infer<typeof CreateStoryApiV1TravelGuidesStoriesPostRequestSchema>) => {
      await Promise.all([
        queryClient.cancelQueries({ queryKey: ['getGuidesApiV1TravelGuidesGet'] }),
        queryClient.cancelQueries({ queryKey: ['getGuideApiV1TravelGuidesGuideIdGet'] }),
        queryClient.cancelQueries({ queryKey: ['getStoriesApiV1TravelGuidesStoriesGet'] }),
        queryClient.cancelQueries({ queryKey: ['getStoryApiV1TravelGuidesStoriesStoryIdGet'] })
      ])

      // Optimistic update (if provided)
      if (options?.optimisticUpdate) {
        const optimisticValue = options.optimisticUpdate(variables)
        setOptimisticData(optimisticValue as z.infer<typeof CreateStoryApiV1TravelGuidesStoriesPostRequestSchema>)
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
    
    onError: (error: Error, variables: z.infer<typeof CreateStoryApiV1TravelGuidesStoriesPostRequestSchema>) => {
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
        queryClient.invalidateQueries({ queryKey: ['getGuidesApiV1TravelGuidesGet'] }),
        queryClient.invalidateQueries({ queryKey: ['getGuideApiV1TravelGuidesGuideIdGet'] }),
        queryClient.invalidateQueries({ queryKey: ['getStoriesApiV1TravelGuidesStoriesGet'] }),
        queryClient.invalidateQueries({ queryKey: ['getStoryApiV1TravelGuidesStoriesStoryIdGet'] }),
        queryClient.invalidateQueries({ queryKey: ['Travel Guides'] })
      ])
    }
  })

  return {
    ...mutation,
    mutateWithTransition: (variables: z.infer<typeof CreateStoryApiV1TravelGuidesStoriesPostRequestSchema>) => {
      startTransition(() => {
        mutation.mutate(variables)
      })
    },
    isPending: isPending || mutation.isPending,
    optimisticData
  }
}

/**
 * Optimized mutation hook for POST /api/v1/travel-guides/stories/{story_id}/publish
 * Features: Optimistic updates, smart invalidation, error handling
 * @param options - Mutation options
 * @returns Mutation result with enhanced features
 */
export function usePublishStoryApiV1TravelGuidesStoriesStoryIdPublishPostMutation(options?: {
  onSuccess?: (data: z.infer<typeof PublishStoryApiV1TravelGuidesStoriesStoryIdPublishPostResponseSchema>, variables: z.infer<typeof PublishStoryApiV1TravelGuidesStoriesStoryIdPublishPostParamsSchema>) => void
  onError?: (error: Error, variables: z.infer<typeof PublishStoryApiV1TravelGuidesStoriesStoryIdPublishPostParamsSchema>) => void
  optimisticUpdate?: (variables: z.infer<typeof PublishStoryApiV1TravelGuidesStoriesStoryIdPublishPostParamsSchema>) => unknown
  showToast?: boolean
}) {
  const queryClient = useQueryClient()
  const [isPending, startTransition] = useTransition()
  const [optimisticData, setOptimisticData] = useOptimistic<unknown, z.infer<typeof PublishStoryApiV1TravelGuidesStoriesStoryIdPublishPostParamsSchema>>(null, (_, newData) => newData)

  const mutation = useMutation({
    mutationFn: async (variables: z.infer<typeof PublishStoryApiV1TravelGuidesStoriesStoryIdPublishPostParamsSchema>): Promise<z.infer<typeof PublishStoryApiV1TravelGuidesStoriesStoryIdPublishPostResponseSchema>> => {
      try {
        const result = await resolveActionResult<z.infer<typeof PublishStoryApiV1TravelGuidesStoriesStoryIdPublishPostResponseSchema>>(publishStoryApiV1TravelGuidesStoriesStoryIdPublishPost(variables))
        return (result ?? ({} as z.infer<typeof PublishStoryApiV1TravelGuidesStoriesStoryIdPublishPostResponseSchema>))
      } catch (error) {
        handleActionError(error)
      }
    },
    
    onMutate: async (variables: z.infer<typeof PublishStoryApiV1TravelGuidesStoriesStoryIdPublishPostParamsSchema>) => {
      await Promise.all([
        queryClient.cancelQueries({ queryKey: ['getGuidesApiV1TravelGuidesGet'] }),
        queryClient.cancelQueries({ queryKey: ['getGuideApiV1TravelGuidesGuideIdGet'] }),
        queryClient.cancelQueries({ queryKey: ['getStoriesApiV1TravelGuidesStoriesGet'] }),
        queryClient.cancelQueries({ queryKey: ['getStoryApiV1TravelGuidesStoriesStoryIdGet'] })
      ])

      // Optimistic update (if provided)
      if (options?.optimisticUpdate) {
        const optimisticValue = options.optimisticUpdate(variables)
        setOptimisticData(optimisticValue as z.infer<typeof PublishStoryApiV1TravelGuidesStoriesStoryIdPublishPostParamsSchema>)
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
    
    onError: (error: Error, variables: z.infer<typeof PublishStoryApiV1TravelGuidesStoriesStoryIdPublishPostParamsSchema>) => {
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
        queryClient.invalidateQueries({ queryKey: ['getGuidesApiV1TravelGuidesGet'] }),
        queryClient.invalidateQueries({ queryKey: ['getGuideApiV1TravelGuidesGuideIdGet'] }),
        queryClient.invalidateQueries({ queryKey: ['getStoriesApiV1TravelGuidesStoriesGet'] }),
        queryClient.invalidateQueries({ queryKey: ['getStoryApiV1TravelGuidesStoriesStoryIdGet'] }),
        queryClient.invalidateQueries({ queryKey: ['Travel Guides'] })
      ])
    }
  })

  return {
    ...mutation,
    mutateWithTransition: (variables: z.infer<typeof PublishStoryApiV1TravelGuidesStoriesStoryIdPublishPostParamsSchema>) => {
      startTransition(() => {
        mutation.mutate(variables)
      })
    },
    isPending: isPending || mutation.isPending,
    optimisticData
  }
}