'use client'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useOptimistic, useTransition } from 'react'
import { toast } from 'sonner'
import { stripeWebhookApiV1WebhooksStripePost } from '@/generated/actions/webhooks'
import {
  StripeWebhookApiV1WebhooksStripePostResponseSchema,
  StripeWebhookApiV1WebhooksStripePostParamsSchema
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
 * Optimized mutation hook for POST /api/v1/webhooks/stripe
 * Features: Optimistic updates, smart invalidation, error handling
 * @param options - Mutation options
 * @returns Mutation result with enhanced features
 */
export function useStripeWebhookApiV1WebhooksStripePostMutation(options?: {
  onSuccess?: (data: z.infer<typeof StripeWebhookApiV1WebhooksStripePostResponseSchema>, variables: z.infer<typeof StripeWebhookApiV1WebhooksStripePostParamsSchema>) => void
  onError?: (error: Error, variables: z.infer<typeof StripeWebhookApiV1WebhooksStripePostParamsSchema>) => void
  optimisticUpdate?: (variables: z.infer<typeof StripeWebhookApiV1WebhooksStripePostParamsSchema>) => unknown
  showToast?: boolean
}) {
  const queryClient = useQueryClient()
  const [isPending, startTransition] = useTransition()
  const [optimisticData, setOptimisticData] = useOptimistic<unknown, z.infer<typeof StripeWebhookApiV1WebhooksStripePostParamsSchema>>(null, (_, newData) => newData)

  const mutation = useMutation({
    mutationFn: async (variables: z.infer<typeof StripeWebhookApiV1WebhooksStripePostParamsSchema>): Promise<z.infer<typeof StripeWebhookApiV1WebhooksStripePostResponseSchema>> => {
      try {
        const result = await resolveActionResult<z.infer<typeof StripeWebhookApiV1WebhooksStripePostResponseSchema>>(stripeWebhookApiV1WebhooksStripePost(variables))
        return (result ?? ({} as z.infer<typeof StripeWebhookApiV1WebhooksStripePostResponseSchema>))
      } catch (error) {
        handleActionError(error)
      }
    },
    
    onMutate: async (variables: z.infer<typeof StripeWebhookApiV1WebhooksStripePostParamsSchema>) => {
      // No queries to cancel

      // Optimistic update (if provided)
      if (options?.optimisticUpdate) {
        const optimisticValue = options.optimisticUpdate(variables)
        setOptimisticData(optimisticValue as z.infer<typeof StripeWebhookApiV1WebhooksStripePostParamsSchema>)
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
    
    onError: (error: Error, variables: z.infer<typeof StripeWebhookApiV1WebhooksStripePostParamsSchema>) => {
      // Show error toast
      if (options?.showToast !== false) {
        toast.error(error.message || 'Failed to create')
      }
      
      // Custom error handler
      options?.onError?.(error as Error, variables)
    },
    
    onSettled: async () => {
      // Always refetch after error or success
      await queryClient.invalidateQueries({ queryKey: ['Webhooks'] })
    }
  })

  return {
    ...mutation,
    mutateWithTransition: (variables: z.infer<typeof StripeWebhookApiV1WebhooksStripePostParamsSchema>) => {
      startTransition(() => {
        mutation.mutate(variables)
      })
    },
    isPending: isPending || mutation.isPending,
    optimisticData
  }
}