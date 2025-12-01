'use client'
import { useMutation } from '@tanstack/react-query'
import { useOptimistic, useTransition } from 'react'
import { toast } from 'sonner'
import { createPaymentIntentApiV1PaymentsIntentPost, processPaymentApiV1PaymentsProcessPost } from '@/generated/actions/payments'
import {
  CreatePaymentIntentApiV1PaymentsIntentPostResponseSchema,
  CreatePaymentIntentApiV1PaymentsIntentPostRequestSchema,
  ProcessPaymentApiV1PaymentsProcessPostResponseSchema,
  ProcessPaymentApiV1PaymentsProcessPostRequestSchema
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
 * Optimized mutation hook for POST /api/v1/payments/intent
 * Features: Optimistic updates, smart invalidation, error handling
 * @param options - Mutation options
 * @returns Mutation result with enhanced features
 */
export function useCreatePaymentIntentApiV1PaymentsIntentPostMutation(options?: {
  onSuccess?: (data: z.infer<typeof CreatePaymentIntentApiV1PaymentsIntentPostResponseSchema>, variables: z.infer<typeof CreatePaymentIntentApiV1PaymentsIntentPostRequestSchema>) => void
  onError?: (error: Error, variables: z.infer<typeof CreatePaymentIntentApiV1PaymentsIntentPostRequestSchema>) => void
  optimisticUpdate?: (variables: z.infer<typeof CreatePaymentIntentApiV1PaymentsIntentPostRequestSchema>) => unknown
  showToast?: boolean
}) {
  const queryClient = useQueryClient()
  const [isPending, startTransition] = useTransition()
  const [optimisticData, setOptimisticData] = useOptimistic<unknown, z.infer<typeof CreatePaymentIntentApiV1PaymentsIntentPostRequestSchema>>(null, (_, newData) => newData)

  const mutation = useMutation({
    mutationFn: async (variables: z.infer<typeof CreatePaymentIntentApiV1PaymentsIntentPostRequestSchema>): Promise<z.infer<typeof CreatePaymentIntentApiV1PaymentsIntentPostResponseSchema>> => {
      try {
        const result = await resolveActionResult<z.infer<typeof CreatePaymentIntentApiV1PaymentsIntentPostResponseSchema>>(createPaymentIntentApiV1PaymentsIntentPost(variables))
        return (result ?? ({} as z.infer<typeof CreatePaymentIntentApiV1PaymentsIntentPostResponseSchema>))
      } catch (error) {
        handleActionError(error)
      }
    },
    
    onMutate: async (variables: z.infer<typeof CreatePaymentIntentApiV1PaymentsIntentPostRequestSchema>) => {
      // No queries to cancel

      // Optimistic update (if provided)
      if (options?.optimisticUpdate) {
        const optimisticValue = options.optimisticUpdate(variables)
        setOptimisticData(optimisticValue as z.infer<typeof CreatePaymentIntentApiV1PaymentsIntentPostRequestSchema>)
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
    
    onError: (error: Error, variables: z.infer<typeof CreatePaymentIntentApiV1PaymentsIntentPostRequestSchema>) => {
      // Show error toast
      if (options?.showToast !== false) {
        toast.error(error.message || 'Failed to create')
      }
      
      // Custom error handler
      options?.onError?.(error as Error, variables)
    },
    
    onSettled: async () => {
      // Always refetch after error or success
      await queryClient.invalidateQueries({ queryKey: ['Payments'] })
    }
  })

  return {
    ...mutation,
    mutateWithTransition: (variables: z.infer<typeof CreatePaymentIntentApiV1PaymentsIntentPostRequestSchema>) => {
      startTransition(() => {
        mutation.mutate(variables)
      })
    },
    isPending: isPending || mutation.isPending,
    optimisticData
  }
}

/**
 * Optimized mutation hook for POST /api/v1/payments/process
 * Features: Optimistic updates, smart invalidation, error handling
 * @param options - Mutation options
 * @returns Mutation result with enhanced features
 */
export function useProcessPaymentApiV1PaymentsProcessPostMutation(options?: {
  onSuccess?: (data: z.infer<typeof ProcessPaymentApiV1PaymentsProcessPostResponseSchema>, variables: z.infer<typeof ProcessPaymentApiV1PaymentsProcessPostRequestSchema>) => void
  onError?: (error: Error, variables: z.infer<typeof ProcessPaymentApiV1PaymentsProcessPostRequestSchema>) => void
  optimisticUpdate?: (variables: z.infer<typeof ProcessPaymentApiV1PaymentsProcessPostRequestSchema>) => unknown
  showToast?: boolean
}) {
  const queryClient = useQueryClient()
  const [isPending, startTransition] = useTransition()
  const [optimisticData, setOptimisticData] = useOptimistic<unknown, z.infer<typeof ProcessPaymentApiV1PaymentsProcessPostRequestSchema>>(null, (_, newData) => newData)

  const mutation = useMutation({
    mutationFn: async (variables: z.infer<typeof ProcessPaymentApiV1PaymentsProcessPostRequestSchema>): Promise<z.infer<typeof ProcessPaymentApiV1PaymentsProcessPostResponseSchema>> => {
      try {
        const result = await resolveActionResult<z.infer<typeof ProcessPaymentApiV1PaymentsProcessPostResponseSchema>>(processPaymentApiV1PaymentsProcessPost(variables))
        return (result ?? ({} as z.infer<typeof ProcessPaymentApiV1PaymentsProcessPostResponseSchema>))
      } catch (error) {
        handleActionError(error)
      }
    },
    
    onMutate: async (variables: z.infer<typeof ProcessPaymentApiV1PaymentsProcessPostRequestSchema>) => {
      // No queries to cancel

      // Optimistic update (if provided)
      if (options?.optimisticUpdate) {
        const optimisticValue = options.optimisticUpdate(variables)
        setOptimisticData(optimisticValue as z.infer<typeof ProcessPaymentApiV1PaymentsProcessPostRequestSchema>)
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
    
    onError: (error: Error, variables: z.infer<typeof ProcessPaymentApiV1PaymentsProcessPostRequestSchema>) => {
      // Show error toast
      if (options?.showToast !== false) {
        toast.error(error.message || 'Failed to create')
      }
      
      // Custom error handler
      options?.onError?.(error as Error, variables)
    },
    
    onSettled: async () => {
      // Always refetch after error or success
      await queryClient.invalidateQueries({ queryKey: ['Payments'] })
    }
  })

  return {
    ...mutation,
    mutateWithTransition: (variables: z.infer<typeof ProcessPaymentApiV1PaymentsProcessPostRequestSchema>) => {
      startTransition(() => {
        mutation.mutate(variables)
      })
    },
    isPending: isPending || mutation.isPending,
    optimisticData
  }
}