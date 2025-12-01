'use client'
import { useQuery, useQueryClient, useSuspenseQuery, useMutation } from '@tanstack/react-query'
import { useOptimistic, useTransition } from 'react'
import { parseAsInteger, parseAsString, useQueryStates } from 'nuqs'
import { toast } from 'sonner'
import { getConversationsApiV1MessagesConversationsGet, getConversationApiV1MessagesConversationsConversationIdGet, getConversationMessagesApiV1MessagesConversationsConversationIdMessagesGet, createMessageApiV1MessagesPost, createConversationApiV1MessagesConversationsPost, markConversationReadApiV1MessagesConversationsConversationIdReadPost, markMessageReadApiV1MessagesMessageIdReadPost } from '@/generated/actions/messages'
import {
  GetConversationsApiV1MessagesConversationsGetResponseSchema,
  GetConversationsApiV1MessagesConversationsGetParamsSchema,
  GetConversationApiV1MessagesConversationsConversationIdGetResponseSchema,
  GetConversationApiV1MessagesConversationsConversationIdGetParamsSchema,
  GetConversationMessagesApiV1MessagesConversationsConversationIdMessagesGetResponseSchema,
  GetConversationMessagesApiV1MessagesConversationsConversationIdMessagesGetParamsSchema,
  CreateMessageApiV1MessagesPostResponseSchema,
  CreateMessageApiV1MessagesPostRequestSchema,
  CreateConversationApiV1MessagesConversationsPostResponseSchema,
  CreateConversationApiV1MessagesConversationsPostRequestSchema,
  MarkConversationReadApiV1MessagesConversationsConversationIdReadPostResponseSchema,
  MarkConversationReadApiV1MessagesConversationsConversationIdReadPostParamsSchema,
  MarkMessageReadApiV1MessagesMessageIdReadPostResponseSchema,
  MarkMessageReadApiV1MessagesMessageIdReadPostParamsSchema
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
 * Optimized query hook for GET /api/v1/messages/conversations
 * Features: Smart caching, error handling, type safety
 * @returns useQuery result with data of type z.infer<typeof GetConversationsApiV1MessagesConversationsGetResponseSchema>
 */
export function useGetConversationsApiV1MessagesConversationsGet(skip?: number, limit?: number, options?: { enabled?: boolean; suspense?: boolean; refetchInterval?: number; initialData?: z.infer<typeof GetConversationsApiV1MessagesConversationsGetResponseSchema> }) {
  const { initialData, ...restOptions } = options ?? {}

  return useQuery({
    queryKey: ['getConversationsApiV1MessagesConversationsGet', skip, limit],
    queryFn: async ({ signal }: { signal?: AbortSignal }) => {
      try {
        const result = await resolveActionResult<z.infer<typeof GetConversationsApiV1MessagesConversationsGetResponseSchema>>(getConversationsApiV1MessagesConversationsGet({ query: { skip, limit } }))
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
    placeholderData: (previousData: z.infer<typeof GetConversationsApiV1MessagesConversationsGetResponseSchema> | undefined) => previousData,
    retry: (failureCount: number, error: Error) => {
      // Don't retry on 4xx errors (client errors)
      if (error instanceof Error && error.message.includes('4')) return false
      // Retry up to 3 times for network/server errors
      return failureCount < 3
    },
    initialData: initialData as z.infer<typeof GetConversationsApiV1MessagesConversationsGetResponseSchema> | undefined,
    ...restOptions
  })
}

/**
 * Suspense version for /api/v1/messages/conversations
 * @returns useSuspenseQuery result with data of type z.infer<typeof GetConversationsApiV1MessagesConversationsGetResponseSchema>
 */
export function useSuspenseGetConversationsApiV1MessagesConversationsGet(skip?: number, limit?: number, options?: { enabled?: boolean; suspense?: boolean; refetchInterval?: number; initialData?: z.infer<typeof GetConversationsApiV1MessagesConversationsGetResponseSchema> }) {
  const { initialData, ...restOptions } = options ?? {}

  return useSuspenseQuery({
    queryKey: ['getConversationsApiV1MessagesConversationsGet', skip, limit],
    queryFn: async () => {
      const result = await resolveActionResult<z.infer<typeof GetConversationsApiV1MessagesConversationsGetResponseSchema>>(getConversationsApiV1MessagesConversationsGet({ query: { skip, limit } }))
      return result
    },
    staleTime: 180000,
    initialData: initialData as z.infer<typeof GetConversationsApiV1MessagesConversationsGetResponseSchema> | undefined,
    ...restOptions
  })
}

/**
 * Optimized query hook for GET /api/v1/messages/conversations/{conversation_id}
 * Features: Smart caching, error handling, type safety
 * @returns useQuery result with data of type z.infer<typeof GetConversationApiV1MessagesConversationsConversationIdGetResponseSchema>
 */
export function useGetConversationApiV1MessagesConversationsConversationIdGet(conversation_id: number, skip?: number, limit?: number, options?: { enabled?: boolean; suspense?: boolean; refetchInterval?: number; initialData?: z.infer<typeof GetConversationApiV1MessagesConversationsConversationIdGetResponseSchema> }) {
  const { initialData, ...restOptions } = options ?? {}

  return useQuery({
    queryKey: ['getConversationApiV1MessagesConversationsConversationIdGet', conversation_id, skip, limit],
    queryFn: async ({ signal }: { signal?: AbortSignal }) => {
      try {
        const result = await resolveActionResult<z.infer<typeof GetConversationApiV1MessagesConversationsConversationIdGetResponseSchema>>(getConversationApiV1MessagesConversationsConversationIdGet({ path: { conversation_id }, query: { skip, limit } }))
        return result
      } catch (error) {
        handleActionError(error)
      }
    },
    staleTime: 180000,
    gcTime: 360000, // React Query v5: gcTime replaces cacheTime
    enabled: !!conversation_id && (options?.enabled ?? true),
    refetchOnWindowFocus: true, // Refetch when window regains focus
    refetchOnReconnect: true, // Refetch when network reconnects
    refetchOnMount: 'always', // Always refetch on mount for fresh data
    refetchInterval: options?.refetchInterval, // Optional polling interval
    // React Query v5: placeholderData replaces keepPreviousData
    placeholderData: (previousData: z.infer<typeof GetConversationApiV1MessagesConversationsConversationIdGetResponseSchema> | undefined) => previousData,
    retry: (failureCount: number, error: Error) => {
      // Don't retry on 4xx errors (client errors)
      if (error instanceof Error && error.message.includes('4')) return false
      // Retry up to 3 times for network/server errors
      return failureCount < 3
    },
    initialData: initialData as z.infer<typeof GetConversationApiV1MessagesConversationsConversationIdGetResponseSchema> | undefined,
    ...restOptions
  })
}

/**
 * Suspense version for /api/v1/messages/conversations/{conversation_id}
 * @returns useSuspenseQuery result with data of type z.infer<typeof GetConversationApiV1MessagesConversationsConversationIdGetResponseSchema>
 */
export function useSuspenseGetConversationApiV1MessagesConversationsConversationIdGet(conversation_id: number, skip?: number, limit?: number, options?: { enabled?: boolean; suspense?: boolean; refetchInterval?: number; initialData?: z.infer<typeof GetConversationApiV1MessagesConversationsConversationIdGetResponseSchema> }) {
  const { initialData, ...restOptions } = options ?? {}

  return useSuspenseQuery({
    queryKey: ['getConversationApiV1MessagesConversationsConversationIdGet', conversation_id, skip, limit],
    queryFn: async () => {
      const result = await resolveActionResult<z.infer<typeof GetConversationApiV1MessagesConversationsConversationIdGetResponseSchema>>(getConversationApiV1MessagesConversationsConversationIdGet({ path: { conversation_id }, query: { skip, limit } }))
      return result
    },
    staleTime: 180000,
    initialData: initialData as z.infer<typeof GetConversationApiV1MessagesConversationsConversationIdGetResponseSchema> | undefined,
    ...restOptions
  })
}

/**
 * Optimized query hook for GET /api/v1/messages/conversations/{conversation_id}/messages
 * Features: Smart caching, error handling, type safety
 * @returns useQuery result with data of type z.infer<typeof GetConversationMessagesApiV1MessagesConversationsConversationIdMessagesGetResponseSchema>
 */
export function useGetConversationMessagesApiV1MessagesConversationsConversationIdMessagesGet(conversation_id: number, skip?: number, limit?: number, options?: { enabled?: boolean; suspense?: boolean; refetchInterval?: number; initialData?: z.infer<typeof GetConversationMessagesApiV1MessagesConversationsConversationIdMessagesGetResponseSchema> }) {
  const { initialData, ...restOptions } = options ?? {}

  return useQuery({
    queryKey: ['getConversationMessagesApiV1MessagesConversationsConversationIdMessagesGet', conversation_id, skip, limit],
    queryFn: async ({ signal }: { signal?: AbortSignal }) => {
      try {
        const result = await resolveActionResult<z.infer<typeof GetConversationMessagesApiV1MessagesConversationsConversationIdMessagesGetResponseSchema>>(getConversationMessagesApiV1MessagesConversationsConversationIdMessagesGet({ path: { conversation_id }, query: { skip, limit } }))
        return result
      } catch (error) {
        handleActionError(error)
      }
    },
    staleTime: 180000,
    gcTime: 360000, // React Query v5: gcTime replaces cacheTime
    enabled: !!conversation_id && (options?.enabled ?? true),
    refetchOnWindowFocus: true, // Refetch when window regains focus
    refetchOnReconnect: true, // Refetch when network reconnects
    refetchOnMount: 'always', // Always refetch on mount for fresh data
    refetchInterval: options?.refetchInterval, // Optional polling interval
    // React Query v5: placeholderData replaces keepPreviousData
    placeholderData: (previousData: z.infer<typeof GetConversationMessagesApiV1MessagesConversationsConversationIdMessagesGetResponseSchema> | undefined) => previousData,
    retry: (failureCount: number, error: Error) => {
      // Don't retry on 4xx errors (client errors)
      if (error instanceof Error && error.message.includes('4')) return false
      // Retry up to 3 times for network/server errors
      return failureCount < 3
    },
    initialData: initialData as z.infer<typeof GetConversationMessagesApiV1MessagesConversationsConversationIdMessagesGetResponseSchema> | undefined,
    ...restOptions
  })
}

/**
 * Suspense version for /api/v1/messages/conversations/{conversation_id}/messages
 * @returns useSuspenseQuery result with data of type z.infer<typeof GetConversationMessagesApiV1MessagesConversationsConversationIdMessagesGetResponseSchema>
 */
export function useSuspenseGetConversationMessagesApiV1MessagesConversationsConversationIdMessagesGet(conversation_id: number, skip?: number, limit?: number, options?: { enabled?: boolean; suspense?: boolean; refetchInterval?: number; initialData?: z.infer<typeof GetConversationMessagesApiV1MessagesConversationsConversationIdMessagesGetResponseSchema> }) {
  const { initialData, ...restOptions } = options ?? {}

  return useSuspenseQuery({
    queryKey: ['getConversationMessagesApiV1MessagesConversationsConversationIdMessagesGet', conversation_id, skip, limit],
    queryFn: async () => {
      const result = await resolveActionResult<z.infer<typeof GetConversationMessagesApiV1MessagesConversationsConversationIdMessagesGetResponseSchema>>(getConversationMessagesApiV1MessagesConversationsConversationIdMessagesGet({ path: { conversation_id }, query: { skip, limit } }))
      return result
    },
    staleTime: 180000,
    initialData: initialData as z.infer<typeof GetConversationMessagesApiV1MessagesConversationsConversationIdMessagesGetResponseSchema> | undefined,
    ...restOptions
  })
}

/**
 * Optimized mutation hook for POST /api/v1/messages
 * Features: Optimistic updates, smart invalidation, error handling
 * @param options - Mutation options
 * @returns Mutation result with enhanced features
 */
export function useCreateMessageApiV1MessagesPostMutation(options?: {
  onSuccess?: (data: z.infer<typeof CreateMessageApiV1MessagesPostResponseSchema>, variables: z.infer<typeof CreateMessageApiV1MessagesPostRequestSchema>) => void
  onError?: (error: Error, variables: z.infer<typeof CreateMessageApiV1MessagesPostRequestSchema>) => void
  optimisticUpdate?: (variables: z.infer<typeof CreateMessageApiV1MessagesPostRequestSchema>) => unknown
  showToast?: boolean
}) {
  const queryClient = useQueryClient()
  const [isPending, startTransition] = useTransition()
  const [optimisticData, setOptimisticData] = useOptimistic<unknown, z.infer<typeof CreateMessageApiV1MessagesPostRequestSchema>>(null, (_, newData) => newData)

  const mutation = useMutation({
    mutationFn: async (variables: z.infer<typeof CreateMessageApiV1MessagesPostRequestSchema>): Promise<z.infer<typeof CreateMessageApiV1MessagesPostResponseSchema>> => {
      try {
        const result = await resolveActionResult<z.infer<typeof CreateMessageApiV1MessagesPostResponseSchema>>(createMessageApiV1MessagesPost(variables))
        return (result ?? ({} as z.infer<typeof CreateMessageApiV1MessagesPostResponseSchema>))
      } catch (error) {
        handleActionError(error)
      }
    },
    
    onMutate: async (variables: z.infer<typeof CreateMessageApiV1MessagesPostRequestSchema>) => {
      await Promise.all([
        queryClient.cancelQueries({ queryKey: ['getConversationsApiV1MessagesConversationsGet'] }),
        queryClient.cancelQueries({ queryKey: ['getConversationApiV1MessagesConversationsConversationIdGet'] }),
        queryClient.cancelQueries({ queryKey: ['getConversationMessagesApiV1MessagesConversationsConversationIdMessagesGet'] })
      ])

      // Optimistic update (if provided)
      if (options?.optimisticUpdate) {
        const optimisticValue = options.optimisticUpdate(variables)
        setOptimisticData(optimisticValue as z.infer<typeof CreateMessageApiV1MessagesPostRequestSchema>)
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
    
    onError: (error: Error, variables: z.infer<typeof CreateMessageApiV1MessagesPostRequestSchema>) => {
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
        queryClient.invalidateQueries({ queryKey: ['getConversationsApiV1MessagesConversationsGet'] }),
        queryClient.invalidateQueries({ queryKey: ['getConversationApiV1MessagesConversationsConversationIdGet'] }),
        queryClient.invalidateQueries({ queryKey: ['getConversationMessagesApiV1MessagesConversationsConversationIdMessagesGet'] }),
        queryClient.invalidateQueries({ queryKey: ['Messages'] })
      ])
    }
  })

  return {
    ...mutation,
    mutateWithTransition: (variables: z.infer<typeof CreateMessageApiV1MessagesPostRequestSchema>) => {
      startTransition(() => {
        mutation.mutate(variables)
      })
    },
    isPending: isPending || mutation.isPending,
    optimisticData
  }
}

/**
 * Optimized mutation hook for POST /api/v1/messages/conversations
 * Features: Optimistic updates, smart invalidation, error handling
 * @param options - Mutation options
 * @returns Mutation result with enhanced features
 */
export function useCreateConversationApiV1MessagesConversationsPostMutation(options?: {
  onSuccess?: (data: z.infer<typeof CreateConversationApiV1MessagesConversationsPostResponseSchema>, variables: z.infer<typeof CreateConversationApiV1MessagesConversationsPostRequestSchema>) => void
  onError?: (error: Error, variables: z.infer<typeof CreateConversationApiV1MessagesConversationsPostRequestSchema>) => void
  optimisticUpdate?: (variables: z.infer<typeof CreateConversationApiV1MessagesConversationsPostRequestSchema>) => unknown
  showToast?: boolean
}) {
  const queryClient = useQueryClient()
  const [isPending, startTransition] = useTransition()
  const [optimisticData, setOptimisticData] = useOptimistic<unknown, z.infer<typeof CreateConversationApiV1MessagesConversationsPostRequestSchema>>(null, (_, newData) => newData)

  const mutation = useMutation({
    mutationFn: async (variables: z.infer<typeof CreateConversationApiV1MessagesConversationsPostRequestSchema>): Promise<z.infer<typeof CreateConversationApiV1MessagesConversationsPostResponseSchema>> => {
      try {
        const result = await resolveActionResult<z.infer<typeof CreateConversationApiV1MessagesConversationsPostResponseSchema>>(createConversationApiV1MessagesConversationsPost(variables))
        return (result ?? ({} as z.infer<typeof CreateConversationApiV1MessagesConversationsPostResponseSchema>))
      } catch (error) {
        handleActionError(error)
      }
    },
    
    onMutate: async (variables: z.infer<typeof CreateConversationApiV1MessagesConversationsPostRequestSchema>) => {
      await Promise.all([
        queryClient.cancelQueries({ queryKey: ['getConversationsApiV1MessagesConversationsGet'] }),
        queryClient.cancelQueries({ queryKey: ['getConversationApiV1MessagesConversationsConversationIdGet'] }),
        queryClient.cancelQueries({ queryKey: ['getConversationMessagesApiV1MessagesConversationsConversationIdMessagesGet'] })
      ])

      // Optimistic update (if provided)
      if (options?.optimisticUpdate) {
        const optimisticValue = options.optimisticUpdate(variables)
        setOptimisticData(optimisticValue as z.infer<typeof CreateConversationApiV1MessagesConversationsPostRequestSchema>)
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
    
    onError: (error: Error, variables: z.infer<typeof CreateConversationApiV1MessagesConversationsPostRequestSchema>) => {
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
        queryClient.invalidateQueries({ queryKey: ['getConversationsApiV1MessagesConversationsGet'] }),
        queryClient.invalidateQueries({ queryKey: ['getConversationApiV1MessagesConversationsConversationIdGet'] }),
        queryClient.invalidateQueries({ queryKey: ['getConversationMessagesApiV1MessagesConversationsConversationIdMessagesGet'] }),
        queryClient.invalidateQueries({ queryKey: ['Messages'] })
      ])
    }
  })

  return {
    ...mutation,
    mutateWithTransition: (variables: z.infer<typeof CreateConversationApiV1MessagesConversationsPostRequestSchema>) => {
      startTransition(() => {
        mutation.mutate(variables)
      })
    },
    isPending: isPending || mutation.isPending,
    optimisticData
  }
}

/**
 * Optimized mutation hook for POST /api/v1/messages/conversations/{conversation_id}/read
 * Features: Optimistic updates, smart invalidation, error handling
 * @param options - Mutation options
 * @returns Mutation result with enhanced features
 */
export function useMarkConversationReadApiV1MessagesConversationsConversationIdReadPostMutation(options?: {
  onSuccess?: (data: z.infer<typeof MarkConversationReadApiV1MessagesConversationsConversationIdReadPostResponseSchema>, variables: z.infer<typeof MarkConversationReadApiV1MessagesConversationsConversationIdReadPostParamsSchema>) => void
  onError?: (error: Error, variables: z.infer<typeof MarkConversationReadApiV1MessagesConversationsConversationIdReadPostParamsSchema>) => void
  optimisticUpdate?: (variables: z.infer<typeof MarkConversationReadApiV1MessagesConversationsConversationIdReadPostParamsSchema>) => unknown
  showToast?: boolean
}) {
  const queryClient = useQueryClient()
  const [isPending, startTransition] = useTransition()
  const [optimisticData, setOptimisticData] = useOptimistic<unknown, z.infer<typeof MarkConversationReadApiV1MessagesConversationsConversationIdReadPostParamsSchema>>(null, (_, newData) => newData)

  const mutation = useMutation({
    mutationFn: async (variables: z.infer<typeof MarkConversationReadApiV1MessagesConversationsConversationIdReadPostParamsSchema>): Promise<z.infer<typeof MarkConversationReadApiV1MessagesConversationsConversationIdReadPostResponseSchema>> => {
      try {
        const result = await resolveActionResult<z.infer<typeof MarkConversationReadApiV1MessagesConversationsConversationIdReadPostResponseSchema>>(markConversationReadApiV1MessagesConversationsConversationIdReadPost(variables))
        return (result ?? ({} as z.infer<typeof MarkConversationReadApiV1MessagesConversationsConversationIdReadPostResponseSchema>))
      } catch (error) {
        handleActionError(error)
      }
    },
    
    onMutate: async (variables: z.infer<typeof MarkConversationReadApiV1MessagesConversationsConversationIdReadPostParamsSchema>) => {
      await Promise.all([
        queryClient.cancelQueries({ queryKey: ['getConversationsApiV1MessagesConversationsGet'] }),
        queryClient.cancelQueries({ queryKey: ['getConversationApiV1MessagesConversationsConversationIdGet'] }),
        queryClient.cancelQueries({ queryKey: ['getConversationMessagesApiV1MessagesConversationsConversationIdMessagesGet'] })
      ])

      // Optimistic update (if provided)
      if (options?.optimisticUpdate) {
        const optimisticValue = options.optimisticUpdate(variables)
        setOptimisticData(optimisticValue as z.infer<typeof MarkConversationReadApiV1MessagesConversationsConversationIdReadPostParamsSchema>)
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
    
    onError: (error: Error, variables: z.infer<typeof MarkConversationReadApiV1MessagesConversationsConversationIdReadPostParamsSchema>) => {
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
        queryClient.invalidateQueries({ queryKey: ['getConversationsApiV1MessagesConversationsGet'] }),
        queryClient.invalidateQueries({ queryKey: ['getConversationApiV1MessagesConversationsConversationIdGet'] }),
        queryClient.invalidateQueries({ queryKey: ['getConversationMessagesApiV1MessagesConversationsConversationIdMessagesGet'] }),
        queryClient.invalidateQueries({ queryKey: ['Messages'] })
      ])
    }
  })

  return {
    ...mutation,
    mutateWithTransition: (variables: z.infer<typeof MarkConversationReadApiV1MessagesConversationsConversationIdReadPostParamsSchema>) => {
      startTransition(() => {
        mutation.mutate(variables)
      })
    },
    isPending: isPending || mutation.isPending,
    optimisticData
  }
}

/**
 * Optimized mutation hook for POST /api/v1/messages/{message_id}/read
 * Features: Optimistic updates, smart invalidation, error handling
 * @param options - Mutation options
 * @returns Mutation result with enhanced features
 */
export function useMarkMessageReadApiV1MessagesMessageIdReadPostMutation(options?: {
  onSuccess?: (data: z.infer<typeof MarkMessageReadApiV1MessagesMessageIdReadPostResponseSchema>, variables: z.infer<typeof MarkMessageReadApiV1MessagesMessageIdReadPostParamsSchema>) => void
  onError?: (error: Error, variables: z.infer<typeof MarkMessageReadApiV1MessagesMessageIdReadPostParamsSchema>) => void
  optimisticUpdate?: (variables: z.infer<typeof MarkMessageReadApiV1MessagesMessageIdReadPostParamsSchema>) => unknown
  showToast?: boolean
}) {
  const queryClient = useQueryClient()
  const [isPending, startTransition] = useTransition()
  const [optimisticData, setOptimisticData] = useOptimistic<unknown, z.infer<typeof MarkMessageReadApiV1MessagesMessageIdReadPostParamsSchema>>(null, (_, newData) => newData)

  const mutation = useMutation({
    mutationFn: async (variables: z.infer<typeof MarkMessageReadApiV1MessagesMessageIdReadPostParamsSchema>): Promise<z.infer<typeof MarkMessageReadApiV1MessagesMessageIdReadPostResponseSchema>> => {
      try {
        const result = await resolveActionResult<z.infer<typeof MarkMessageReadApiV1MessagesMessageIdReadPostResponseSchema>>(markMessageReadApiV1MessagesMessageIdReadPost(variables))
        return (result ?? ({} as z.infer<typeof MarkMessageReadApiV1MessagesMessageIdReadPostResponseSchema>))
      } catch (error) {
        handleActionError(error)
      }
    },
    
    onMutate: async (variables: z.infer<typeof MarkMessageReadApiV1MessagesMessageIdReadPostParamsSchema>) => {
      await Promise.all([
        queryClient.cancelQueries({ queryKey: ['getConversationsApiV1MessagesConversationsGet'] }),
        queryClient.cancelQueries({ queryKey: ['getConversationApiV1MessagesConversationsConversationIdGet'] }),
        queryClient.cancelQueries({ queryKey: ['getConversationMessagesApiV1MessagesConversationsConversationIdMessagesGet'] })
      ])

      // Optimistic update (if provided)
      if (options?.optimisticUpdate) {
        const optimisticValue = options.optimisticUpdate(variables)
        setOptimisticData(optimisticValue as z.infer<typeof MarkMessageReadApiV1MessagesMessageIdReadPostParamsSchema>)
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
    
    onError: (error: Error, variables: z.infer<typeof MarkMessageReadApiV1MessagesMessageIdReadPostParamsSchema>) => {
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
        queryClient.invalidateQueries({ queryKey: ['getConversationsApiV1MessagesConversationsGet'] }),
        queryClient.invalidateQueries({ queryKey: ['getConversationApiV1MessagesConversationsConversationIdGet'] }),
        queryClient.invalidateQueries({ queryKey: ['getConversationMessagesApiV1MessagesConversationsConversationIdMessagesGet'] }),
        queryClient.invalidateQueries({ queryKey: ['Messages'] })
      ])
    }
  })

  return {
    ...mutation,
    mutateWithTransition: (variables: z.infer<typeof MarkMessageReadApiV1MessagesMessageIdReadPostParamsSchema>) => {
      startTransition(() => {
        mutation.mutate(variables)
      })
    },
    isPending: isPending || mutation.isPending,
    optimisticData
  }
}