'use client'
import { useMutation } from '@tanstack/react-query'
import { useOptimistic, useTransition } from 'react'
import { toast } from 'sonner'
import { sendPushNotificationApiV1NotificationsPushSendPost, sendBulkPushNotificationsApiV1NotificationsPushBulkPost } from '@/generated/actions/notifications'
import {
  SendPushNotificationApiV1NotificationsPushSendPostResponseSchema,
  SendPushNotificationApiV1NotificationsPushSendPostRequestSchema,
  SendBulkPushNotificationsApiV1NotificationsPushBulkPostResponseSchema,
  SendBulkPushNotificationsApiV1NotificationsPushBulkPostRequestSchema
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
 * Optimized mutation hook for POST /api/v1/notifications/push/send
 * Features: Optimistic updates, smart invalidation, error handling
 * @param options - Mutation options
 * @returns Mutation result with enhanced features
 */
export function useSendPushNotificationApiV1NotificationsPushSendPostMutation(options?: {
  onSuccess?: (data: z.infer<typeof SendPushNotificationApiV1NotificationsPushSendPostResponseSchema>, variables: z.infer<typeof SendPushNotificationApiV1NotificationsPushSendPostRequestSchema>) => void
  onError?: (error: Error, variables: z.infer<typeof SendPushNotificationApiV1NotificationsPushSendPostRequestSchema>) => void
  optimisticUpdate?: (variables: z.infer<typeof SendPushNotificationApiV1NotificationsPushSendPostRequestSchema>) => unknown
  showToast?: boolean
}) {
  const queryClient = useQueryClient()
  const [isPending, startTransition] = useTransition()
  const [optimisticData, setOptimisticData] = useOptimistic<unknown, z.infer<typeof SendPushNotificationApiV1NotificationsPushSendPostRequestSchema>>(null, (_, newData) => newData)

  const mutation = useMutation({
    mutationFn: async (variables: z.infer<typeof SendPushNotificationApiV1NotificationsPushSendPostRequestSchema>): Promise<z.infer<typeof SendPushNotificationApiV1NotificationsPushSendPostResponseSchema>> => {
      try {
        const result = await resolveActionResult<z.infer<typeof SendPushNotificationApiV1NotificationsPushSendPostResponseSchema>>(sendPushNotificationApiV1NotificationsPushSendPost(variables))
        return (result ?? ({} as z.infer<typeof SendPushNotificationApiV1NotificationsPushSendPostResponseSchema>))
      } catch (error) {
        handleActionError(error)
      }
    },
    
    onMutate: async (variables: z.infer<typeof SendPushNotificationApiV1NotificationsPushSendPostRequestSchema>) => {
      // No queries to cancel

      // Optimistic update (if provided)
      if (options?.optimisticUpdate) {
        const optimisticValue = options.optimisticUpdate(variables)
        setOptimisticData(optimisticValue as z.infer<typeof SendPushNotificationApiV1NotificationsPushSendPostRequestSchema>)
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
    
    onError: (error: Error, variables: z.infer<typeof SendPushNotificationApiV1NotificationsPushSendPostRequestSchema>) => {
      // Show error toast
      if (options?.showToast !== false) {
        toast.error(error.message || 'Failed to create')
      }
      
      // Custom error handler
      options?.onError?.(error as Error, variables)
    },
    
    onSettled: async () => {
      // Always refetch after error or success
      await queryClient.invalidateQueries({ queryKey: ['Notifications'] })
    }
  })

  return {
    ...mutation,
    mutateWithTransition: (variables: z.infer<typeof SendPushNotificationApiV1NotificationsPushSendPostRequestSchema>) => {
      startTransition(() => {
        mutation.mutate(variables)
      })
    },
    isPending: isPending || mutation.isPending,
    optimisticData
  }
}

/**
 * Optimized mutation hook for POST /api/v1/notifications/push/bulk
 * Features: Optimistic updates, smart invalidation, error handling
 * @param options - Mutation options
 * @returns Mutation result with enhanced features
 */
export function useSendBulkPushNotificationsApiV1NotificationsPushBulkPostMutation(options?: {
  onSuccess?: (data: z.infer<typeof SendBulkPushNotificationsApiV1NotificationsPushBulkPostResponseSchema>, variables: z.infer<typeof SendBulkPushNotificationsApiV1NotificationsPushBulkPostRequestSchema>) => void
  onError?: (error: Error, variables: z.infer<typeof SendBulkPushNotificationsApiV1NotificationsPushBulkPostRequestSchema>) => void
  optimisticUpdate?: (variables: z.infer<typeof SendBulkPushNotificationsApiV1NotificationsPushBulkPostRequestSchema>) => unknown
  showToast?: boolean
}) {
  const queryClient = useQueryClient()
  const [isPending, startTransition] = useTransition()
  const [optimisticData, setOptimisticData] = useOptimistic<unknown, z.infer<typeof SendBulkPushNotificationsApiV1NotificationsPushBulkPostRequestSchema>>(null, (_, newData) => newData)

  const mutation = useMutation({
    mutationFn: async (variables: z.infer<typeof SendBulkPushNotificationsApiV1NotificationsPushBulkPostRequestSchema>): Promise<z.infer<typeof SendBulkPushNotificationsApiV1NotificationsPushBulkPostResponseSchema>> => {
      try {
        const result = await resolveActionResult<z.infer<typeof SendBulkPushNotificationsApiV1NotificationsPushBulkPostResponseSchema>>(sendBulkPushNotificationsApiV1NotificationsPushBulkPost(variables))
        return (result ?? ({} as z.infer<typeof SendBulkPushNotificationsApiV1NotificationsPushBulkPostResponseSchema>))
      } catch (error) {
        handleActionError(error)
      }
    },
    
    onMutate: async (variables: z.infer<typeof SendBulkPushNotificationsApiV1NotificationsPushBulkPostRequestSchema>) => {
      // No queries to cancel

      // Optimistic update (if provided)
      if (options?.optimisticUpdate) {
        const optimisticValue = options.optimisticUpdate(variables)
        setOptimisticData(optimisticValue as z.infer<typeof SendBulkPushNotificationsApiV1NotificationsPushBulkPostRequestSchema>)
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
    
    onError: (error: Error, variables: z.infer<typeof SendBulkPushNotificationsApiV1NotificationsPushBulkPostRequestSchema>) => {
      // Show error toast
      if (options?.showToast !== false) {
        toast.error(error.message || 'Failed to create')
      }
      
      // Custom error handler
      options?.onError?.(error as Error, variables)
    },
    
    onSettled: async () => {
      // Always refetch after error or success
      await queryClient.invalidateQueries({ queryKey: ['Notifications'] })
    }
  })

  return {
    ...mutation,
    mutateWithTransition: (variables: z.infer<typeof SendBulkPushNotificationsApiV1NotificationsPushBulkPostRequestSchema>) => {
      startTransition(() => {
        mutation.mutate(variables)
      })
    },
    isPending: isPending || mutation.isPending,
    optimisticData
  }
}