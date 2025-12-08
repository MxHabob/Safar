'use client'
import { useQuery, useQueryClient, useSuspenseQuery, useMutation } from '@tanstack/react-query'
import { useOptimistic, useTransition } from 'react'
import { parseAsInteger, parseAsString, useQueryStates } from 'nuqs'
import { toast } from 'sonner'
import { listCouponsApiV1PromotionsCouponsGet, validateCouponApiV1PromotionsCouponsCouponCodeValidateGet, getApplicablePromotionsApiV1PromotionsApplicableGet, createCouponApiV1PromotionsCouponsPost } from '@/generated/actions/promotions'
import {
  ListCouponsApiV1PromotionsCouponsGetResponseSchema,
  ListCouponsApiV1PromotionsCouponsGetParamsSchema,
  ValidateCouponApiV1PromotionsCouponsCouponCodeValidateGetResponseSchema,
  ValidateCouponApiV1PromotionsCouponsCouponCodeValidateGetParamsSchema,
  GetApplicablePromotionsApiV1PromotionsApplicableGetResponseSchema,
  GetApplicablePromotionsApiV1PromotionsApplicableGetParamsSchema,
  CreateCouponApiV1PromotionsCouponsPostResponseSchema,
  CreateCouponApiV1PromotionsCouponsPostRequestSchema
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
 * Optimized query hook for GET /api/v1/promotions/coupons
 * Features: Smart caching, error handling, type safety
 * @returns useQuery result with data of type z.infer<typeof ListCouponsApiV1PromotionsCouponsGetResponseSchema>
 */
export function useListCouponsApiV1PromotionsCouponsGet(skip?: number, limit?: number, active_only?: boolean, options?: { enabled?: boolean; suspense?: boolean; refetchInterval?: number; initialData?: z.infer<typeof ListCouponsApiV1PromotionsCouponsGetResponseSchema> }) {
  const { initialData, ...restOptions } = options ?? {}

  return useQuery({
    queryKey: ['listCouponsApiV1PromotionsCouponsGet', skip, limit, active_only],
    queryFn: async ({ signal }: { signal?: AbortSignal }) => {
      try {
        const result = await resolveActionResult<z.infer<typeof ListCouponsApiV1PromotionsCouponsGetResponseSchema>>(listCouponsApiV1PromotionsCouponsGet({ query: { skip, limit, active_only } }))
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
    placeholderData: (previousData: z.infer<typeof ListCouponsApiV1PromotionsCouponsGetResponseSchema> | undefined) => previousData,
    retry: (failureCount: number, error: Error) => {
      // Don't retry on 4xx errors (client errors)
      if (error instanceof Error && error.message.includes('4')) return false
      // Retry up to 3 times for network/server errors
      return failureCount < 3
    },
    initialData: initialData as z.infer<typeof ListCouponsApiV1PromotionsCouponsGetResponseSchema> | undefined,
    ...restOptions
  })
}

/**
 * Suspense version for /api/v1/promotions/coupons
 * @returns useSuspenseQuery result with data of type z.infer<typeof ListCouponsApiV1PromotionsCouponsGetResponseSchema>
 */
export function useSuspenseListCouponsApiV1PromotionsCouponsGet(skip?: number, limit?: number, active_only?: boolean, options?: { enabled?: boolean; suspense?: boolean; refetchInterval?: number; initialData?: z.infer<typeof ListCouponsApiV1PromotionsCouponsGetResponseSchema> }) {
  const { initialData, ...restOptions } = options ?? {}

  return useSuspenseQuery({
    queryKey: ['listCouponsApiV1PromotionsCouponsGet', skip, limit, active_only],
    queryFn: async () => {
      const result = await resolveActionResult<z.infer<typeof ListCouponsApiV1PromotionsCouponsGetResponseSchema>>(listCouponsApiV1PromotionsCouponsGet({ query: { skip, limit, active_only } }))
      return result
    },
    staleTime: 180000,
    initialData: initialData as z.infer<typeof ListCouponsApiV1PromotionsCouponsGetResponseSchema> | undefined,
    ...restOptions
  })
}

/**
 * Optimized query hook for GET /api/v1/promotions/coupons/{coupon_code}/validate
 * Features: Smart caching, error handling, type safety
 * @returns useQuery result with data of type z.infer<typeof ValidateCouponApiV1PromotionsCouponsCouponCodeValidateGetResponseSchema>
 */
export function useValidateCouponApiV1PromotionsCouponsCouponCodeValidateGet(coupon_code: string, listing_id: string, booking_amount: number, check_in_date: string, check_out_date: string, nights: number, guests: number, options?: { enabled?: boolean; suspense?: boolean; refetchInterval?: number; initialData?: z.infer<typeof ValidateCouponApiV1PromotionsCouponsCouponCodeValidateGetResponseSchema> }) {
  const { initialData, ...restOptions } = options ?? {}

  return useQuery({
    queryKey: ['validateCouponApiV1PromotionsCouponsCouponCodeValidateGet', coupon_code, listing_id, booking_amount, check_in_date, check_out_date, nights, guests],
    queryFn: async ({ signal }: { signal?: AbortSignal }) => {
      try {
        const result = await resolveActionResult<z.infer<typeof ValidateCouponApiV1PromotionsCouponsCouponCodeValidateGetResponseSchema>>(validateCouponApiV1PromotionsCouponsCouponCodeValidateGet({ path: { coupon_code }, query: { listing_id, booking_amount, check_in_date, check_out_date, nights, guests } }))
        return result
      } catch (error) {
        handleActionError(error)
      }
    },
    staleTime: 180000,
    gcTime: 360000, // React Query v5: gcTime replaces cacheTime
    enabled: !!coupon_code && (options?.enabled ?? true),
    refetchOnWindowFocus: true, // Refetch when window regains focus
    refetchOnReconnect: true, // Refetch when network reconnects
    refetchOnMount: 'always', // Always refetch on mount for fresh data
    refetchInterval: options?.refetchInterval, // Optional polling interval
    // React Query v5: placeholderData replaces keepPreviousData
    placeholderData: (previousData: z.infer<typeof ValidateCouponApiV1PromotionsCouponsCouponCodeValidateGetResponseSchema> | undefined) => previousData,
    retry: (failureCount: number, error: Error) => {
      // Don't retry on 4xx errors (client errors)
      if (error instanceof Error && error.message.includes('4')) return false
      // Retry up to 3 times for network/server errors
      return failureCount < 3
    },
    initialData: initialData as z.infer<typeof ValidateCouponApiV1PromotionsCouponsCouponCodeValidateGetResponseSchema> | undefined,
    ...restOptions
  })
}

/**
 * Suspense version for /api/v1/promotions/coupons/{coupon_code}/validate
 * @returns useSuspenseQuery result with data of type z.infer<typeof ValidateCouponApiV1PromotionsCouponsCouponCodeValidateGetResponseSchema>
 */
export function useSuspenseValidateCouponApiV1PromotionsCouponsCouponCodeValidateGet(coupon_code: string, listing_id: string, booking_amount: number, check_in_date: string, check_out_date: string, nights: number, guests: number, options?: { enabled?: boolean; suspense?: boolean; refetchInterval?: number; initialData?: z.infer<typeof ValidateCouponApiV1PromotionsCouponsCouponCodeValidateGetResponseSchema> }) {
  const { initialData, ...restOptions } = options ?? {}

  return useSuspenseQuery({
    queryKey: ['validateCouponApiV1PromotionsCouponsCouponCodeValidateGet', coupon_code, listing_id, booking_amount, check_in_date, check_out_date, nights, guests],
    queryFn: async () => {
      const result = await resolveActionResult<z.infer<typeof ValidateCouponApiV1PromotionsCouponsCouponCodeValidateGetResponseSchema>>(validateCouponApiV1PromotionsCouponsCouponCodeValidateGet({ path: { coupon_code }, query: { listing_id, booking_amount, check_in_date, check_out_date, nights, guests } }))
      return result
    },
    staleTime: 180000,
    initialData: initialData as z.infer<typeof ValidateCouponApiV1PromotionsCouponsCouponCodeValidateGetResponseSchema> | undefined,
    ...restOptions
  })
}

/**
 * Optimized query hook for GET /api/v1/promotions/applicable
 * Features: Smart caching, error handling, type safety
 * @returns useQuery result with data of type z.infer<typeof GetApplicablePromotionsApiV1PromotionsApplicableGetResponseSchema>
 */
export function useGetApplicablePromotionsApiV1PromotionsApplicableGet(listing_id?: unknown, check_in_date?: unknown, nights?: unknown, guests?: unknown, options?: { enabled?: boolean; suspense?: boolean; refetchInterval?: number; initialData?: z.infer<typeof GetApplicablePromotionsApiV1PromotionsApplicableGetResponseSchema> }) {
  const { initialData, ...restOptions } = options ?? {}

  return useQuery({
    queryKey: ['getApplicablePromotionsApiV1PromotionsApplicableGet', listing_id, check_in_date, nights, guests],
    queryFn: async ({ signal }: { signal?: AbortSignal }) => {
      try {
        const result = await resolveActionResult<z.infer<typeof GetApplicablePromotionsApiV1PromotionsApplicableGetResponseSchema>>(getApplicablePromotionsApiV1PromotionsApplicableGet({ query: { listing_id, check_in_date, nights, guests } }))
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
    placeholderData: (previousData: z.infer<typeof GetApplicablePromotionsApiV1PromotionsApplicableGetResponseSchema> | undefined) => previousData,
    retry: (failureCount: number, error: Error) => {
      // Don't retry on 4xx errors (client errors)
      if (error instanceof Error && error.message.includes('4')) return false
      // Retry up to 3 times for network/server errors
      return failureCount < 3
    },
    initialData: initialData as z.infer<typeof GetApplicablePromotionsApiV1PromotionsApplicableGetResponseSchema> | undefined,
    ...restOptions
  })
}

/**
 * Suspense version for /api/v1/promotions/applicable
 * @returns useSuspenseQuery result with data of type z.infer<typeof GetApplicablePromotionsApiV1PromotionsApplicableGetResponseSchema>
 */
export function useSuspenseGetApplicablePromotionsApiV1PromotionsApplicableGet(listing_id?: unknown, check_in_date?: unknown, nights?: unknown, guests?: unknown, options?: { enabled?: boolean; suspense?: boolean; refetchInterval?: number; initialData?: z.infer<typeof GetApplicablePromotionsApiV1PromotionsApplicableGetResponseSchema> }) {
  const { initialData, ...restOptions } = options ?? {}

  return useSuspenseQuery({
    queryKey: ['getApplicablePromotionsApiV1PromotionsApplicableGet', listing_id, check_in_date, nights, guests],
    queryFn: async () => {
      const result = await resolveActionResult<z.infer<typeof GetApplicablePromotionsApiV1PromotionsApplicableGetResponseSchema>>(getApplicablePromotionsApiV1PromotionsApplicableGet({ query: { listing_id, check_in_date, nights, guests } }))
      return result
    },
    staleTime: 180000,
    initialData: initialData as z.infer<typeof GetApplicablePromotionsApiV1PromotionsApplicableGetResponseSchema> | undefined,
    ...restOptions
  })
}

/**
 * Optimized mutation hook for POST /api/v1/promotions/coupons
 * Features: Optimistic updates, smart invalidation, error handling
 * @param options - Mutation options
 * @returns Mutation result with enhanced features
 */
export function useCreateCouponApiV1PromotionsCouponsPostMutation(options?: {
  onSuccess?: (data: z.infer<typeof CreateCouponApiV1PromotionsCouponsPostResponseSchema>, variables: z.infer<typeof CreateCouponApiV1PromotionsCouponsPostRequestSchema>) => void
  onError?: (error: Error, variables: z.infer<typeof CreateCouponApiV1PromotionsCouponsPostRequestSchema>) => void
  optimisticUpdate?: (variables: z.infer<typeof CreateCouponApiV1PromotionsCouponsPostRequestSchema>) => unknown
  showToast?: boolean
}) {
  const queryClient = useQueryClient()
  const [isPending, startTransition] = useTransition()
  const [optimisticData, setOptimisticData] = useOptimistic<unknown, z.infer<typeof CreateCouponApiV1PromotionsCouponsPostRequestSchema>>(null, (_, newData) => newData)

  const mutation = useMutation({
    mutationFn: async (variables: z.infer<typeof CreateCouponApiV1PromotionsCouponsPostRequestSchema>): Promise<z.infer<typeof CreateCouponApiV1PromotionsCouponsPostResponseSchema>> => {
      try {
        const result = await resolveActionResult<z.infer<typeof CreateCouponApiV1PromotionsCouponsPostResponseSchema>>(createCouponApiV1PromotionsCouponsPost(variables))
        return (result ?? ({} as z.infer<typeof CreateCouponApiV1PromotionsCouponsPostResponseSchema>))
      } catch (error) {
        handleActionError(error)
      }
    },
    
    onMutate: async (variables: z.infer<typeof CreateCouponApiV1PromotionsCouponsPostRequestSchema>) => {
      await Promise.all([
        queryClient.cancelQueries({ queryKey: ['listCouponsApiV1PromotionsCouponsGet'] }),
        queryClient.cancelQueries({ queryKey: ['validateCouponApiV1PromotionsCouponsCouponCodeValidateGet'] }),
        queryClient.cancelQueries({ queryKey: ['getApplicablePromotionsApiV1PromotionsApplicableGet'] })
      ])

      // Optimistic update (if provided)
      if (options?.optimisticUpdate) {
        const optimisticValue = options.optimisticUpdate(variables)
        setOptimisticData(optimisticValue as z.infer<typeof CreateCouponApiV1PromotionsCouponsPostRequestSchema>)
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
    
    onError: (error: Error, variables: z.infer<typeof CreateCouponApiV1PromotionsCouponsPostRequestSchema>) => {
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
        queryClient.invalidateQueries({ queryKey: ['listCouponsApiV1PromotionsCouponsGet'] }),
        queryClient.invalidateQueries({ queryKey: ['validateCouponApiV1PromotionsCouponsCouponCodeValidateGet'] }),
        queryClient.invalidateQueries({ queryKey: ['getApplicablePromotionsApiV1PromotionsApplicableGet'] }),
        queryClient.invalidateQueries({ queryKey: ['Promotions'] })
      ])
    }
  })

  return {
    ...mutation,
    mutateWithTransition: (variables: z.infer<typeof CreateCouponApiV1PromotionsCouponsPostRequestSchema>) => {
      startTransition(() => {
        mutation.mutate(variables)
      })
    },
    isPending: isPending || mutation.isPending,
    optimisticData
  }
}