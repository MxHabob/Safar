'use client'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useOptimistic, useTransition } from 'react'
import { parseAsInteger, parseAsString, useQueryStates } from 'nuqs'
import { toast } from 'sonner'
import { uploadFileApiV1FilesUploadPost, uploadMultipleFilesApiV1FilesUploadMultiplePost } from '@/generated/actions/files'
import {
  UploadFileApiV1FilesUploadPostResponseSchema,
  UploadFileApiV1FilesUploadPostRequestSchema,
  UploadFileApiV1FilesUploadPostParamsSchema,
  UploadMultipleFilesApiV1FilesUploadMultiplePostResponseSchema,
  UploadMultipleFilesApiV1FilesUploadMultiplePostRequestSchema,
  UploadMultipleFilesApiV1FilesUploadMultiplePostParamsSchema
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
 * Optimized mutation hook for POST /api/v1/files/upload
 * Features: Optimistic updates, smart invalidation, error handling
 * @param options - Mutation options
 * @returns Mutation result with enhanced features
 */
export function useUploadFileApiV1FilesUploadPostMutation(options?: {
  onSuccess?: (data: z.infer<typeof UploadFileApiV1FilesUploadPostResponseSchema>, variables: { body: z.infer<typeof UploadFileApiV1FilesUploadPostRequestSchema>, params: z.infer<typeof UploadFileApiV1FilesUploadPostParamsSchema> }) => void
  onError?: (error: Error, variables: { body: z.infer<typeof UploadFileApiV1FilesUploadPostRequestSchema>, params: z.infer<typeof UploadFileApiV1FilesUploadPostParamsSchema> }) => void
  optimisticUpdate?: (variables: { body: z.infer<typeof UploadFileApiV1FilesUploadPostRequestSchema>, params: z.infer<typeof UploadFileApiV1FilesUploadPostParamsSchema> }) => unknown
  showToast?: boolean
}) {
  const queryClient = useQueryClient()
  const [isPending, startTransition] = useTransition()
  const [optimisticData, setOptimisticData] = useOptimistic<unknown, { body: z.infer<typeof UploadFileApiV1FilesUploadPostRequestSchema>, params: z.infer<typeof UploadFileApiV1FilesUploadPostParamsSchema> }>(null, (_, newData) => newData)

  const mutation = useMutation({
    mutationFn: async (variables: { body: z.infer<typeof UploadFileApiV1FilesUploadPostRequestSchema>, params: z.infer<typeof UploadFileApiV1FilesUploadPostParamsSchema> }): Promise<z.infer<typeof UploadFileApiV1FilesUploadPostResponseSchema>> => {
      try {
        const result = await resolveActionResult<z.infer<typeof UploadFileApiV1FilesUploadPostResponseSchema>>(uploadFileApiV1FilesUploadPost(variables))
        return (result ?? ({} as z.infer<typeof UploadFileApiV1FilesUploadPostResponseSchema>))
      } catch (error) {
        handleActionError(error)
      }
    },
    
    onMutate: async (variables: { body: z.infer<typeof UploadFileApiV1FilesUploadPostRequestSchema>, params: z.infer<typeof UploadFileApiV1FilesUploadPostParamsSchema> }) => {
      // No queries to cancel

      // Optimistic update (if provided)
      if (options?.optimisticUpdate) {
        const optimisticValue = options.optimisticUpdate(variables)
        setOptimisticData(optimisticValue as { body: z.infer<typeof UploadFileApiV1FilesUploadPostRequestSchema>, params: z.infer<typeof UploadFileApiV1FilesUploadPostParamsSchema> })
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
    
    onError: (error: Error, variables: { body: z.infer<typeof UploadFileApiV1FilesUploadPostRequestSchema>, params: z.infer<typeof UploadFileApiV1FilesUploadPostParamsSchema> }) => {
      // Show error toast
      if (options?.showToast !== false) {
        toast.error(error.message || 'Failed to create')
      }
      
      // Custom error handler
      options?.onError?.(error as Error, variables)
    },
    
    onSettled: async () => {
      // Always refetch after error or success
      await queryClient.invalidateQueries({ queryKey: ['Files'] })
    }
  })

  return {
    ...mutation,
    mutateWithTransition: (variables: { body: z.infer<typeof UploadFileApiV1FilesUploadPostRequestSchema>, params: z.infer<typeof UploadFileApiV1FilesUploadPostParamsSchema> }) => {
      startTransition(() => {
        mutation.mutate(variables)
      })
    },
    isPending: isPending || mutation.isPending,
    optimisticData
  }
}

/**
 * Optimized mutation hook for POST /api/v1/files/upload-multiple
 * Features: Optimistic updates, smart invalidation, error handling
 * @param options - Mutation options
 * @returns Mutation result with enhanced features
 */
export function useUploadMultipleFilesApiV1FilesUploadMultiplePostMutation(options?: {
  onSuccess?: (data: z.infer<typeof UploadMultipleFilesApiV1FilesUploadMultiplePostResponseSchema>, variables: { body: z.infer<typeof UploadMultipleFilesApiV1FilesUploadMultiplePostRequestSchema>, params: z.infer<typeof UploadMultipleFilesApiV1FilesUploadMultiplePostParamsSchema> }) => void
  onError?: (error: Error, variables: { body: z.infer<typeof UploadMultipleFilesApiV1FilesUploadMultiplePostRequestSchema>, params: z.infer<typeof UploadMultipleFilesApiV1FilesUploadMultiplePostParamsSchema> }) => void
  optimisticUpdate?: (variables: { body: z.infer<typeof UploadMultipleFilesApiV1FilesUploadMultiplePostRequestSchema>, params: z.infer<typeof UploadMultipleFilesApiV1FilesUploadMultiplePostParamsSchema> }) => unknown
  showToast?: boolean
}) {
  const queryClient = useQueryClient()
  const [isPending, startTransition] = useTransition()
  const [optimisticData, setOptimisticData] = useOptimistic<unknown, { body: z.infer<typeof UploadMultipleFilesApiV1FilesUploadMultiplePostRequestSchema>, params: z.infer<typeof UploadMultipleFilesApiV1FilesUploadMultiplePostParamsSchema> }>(null, (_, newData) => newData)

  const mutation = useMutation({
    mutationFn: async (variables: { body: z.infer<typeof UploadMultipleFilesApiV1FilesUploadMultiplePostRequestSchema>, params: z.infer<typeof UploadMultipleFilesApiV1FilesUploadMultiplePostParamsSchema> }): Promise<z.infer<typeof UploadMultipleFilesApiV1FilesUploadMultiplePostResponseSchema>> => {
      try {
        const result = await resolveActionResult<z.infer<typeof UploadMultipleFilesApiV1FilesUploadMultiplePostResponseSchema>>(uploadMultipleFilesApiV1FilesUploadMultiplePost(variables))
        return (result ?? ({} as z.infer<typeof UploadMultipleFilesApiV1FilesUploadMultiplePostResponseSchema>))
      } catch (error) {
        handleActionError(error)
      }
    },
    
    onMutate: async (variables: { body: z.infer<typeof UploadMultipleFilesApiV1FilesUploadMultiplePostRequestSchema>, params: z.infer<typeof UploadMultipleFilesApiV1FilesUploadMultiplePostParamsSchema> }) => {
      // No queries to cancel

      // Optimistic update (if provided)
      if (options?.optimisticUpdate) {
        const optimisticValue = options.optimisticUpdate(variables)
        setOptimisticData(optimisticValue as { body: z.infer<typeof UploadMultipleFilesApiV1FilesUploadMultiplePostRequestSchema>, params: z.infer<typeof UploadMultipleFilesApiV1FilesUploadMultiplePostParamsSchema> })
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
    
    onError: (error: Error, variables: { body: z.infer<typeof UploadMultipleFilesApiV1FilesUploadMultiplePostRequestSchema>, params: z.infer<typeof UploadMultipleFilesApiV1FilesUploadMultiplePostParamsSchema> }) => {
      // Show error toast
      if (options?.showToast !== false) {
        toast.error(error.message || 'Failed to create')
      }
      
      // Custom error handler
      options?.onError?.(error as Error, variables)
    },
    
    onSettled: async () => {
      // Always refetch after error or success
      await queryClient.invalidateQueries({ queryKey: ['Files'] })
    }
  })

  return {
    ...mutation,
    mutateWithTransition: (variables: { body: z.infer<typeof UploadMultipleFilesApiV1FilesUploadMultiplePostRequestSchema>, params: z.infer<typeof UploadMultipleFilesApiV1FilesUploadMultiplePostParamsSchema> }) => {
      startTransition(() => {
        mutation.mutate(variables)
      })
    },
    isPending: isPending || mutation.isPending,
    optimisticData
  }
}