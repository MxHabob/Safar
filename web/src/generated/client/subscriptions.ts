import { z } from 'zod'
import { cache } from 'react'
import { BaseApiClient } from './base'
import type { ClientResponse, RequestConfiguration } from './base'
import { defaultMiddleware } from './middleware'
import {
  GetSubscriptionPlansApiV1SubscriptionsPlansGetResponseSchema,
  GetSubscriptionPlansApiV1SubscriptionsPlansGetParamsSchema,
  GetMySubscriptionApiV1SubscriptionsMySubscriptionGetResponseSchema,
  GetMySubscriptionApiV1SubscriptionsMySubscriptionGetParamsSchema,
  SubscribeApiV1SubscriptionsSubscribePostResponseSchema,
  SubscribeApiV1SubscriptionsSubscribePostParamsSchema,
  CancelSubscriptionApiV1SubscriptionsSubscriptionIdCancelPostResponseSchema,
  CancelSubscriptionApiV1SubscriptionsSubscriptionIdCancelPostParamsSchema,
  CheckUsageApiV1SubscriptionsUsageLimitTypeGetResponseSchema,
  CheckUsageApiV1SubscriptionsUsageLimitTypeGetParamsSchema
} from '@/generated/schemas'

export class SubscriptionsApiClient extends BaseApiClient {
  constructor() {
    super()
    
    // Add tag-specific middleware
    this.addMiddleware({
      name: 'subscriptions-context',
      onRequest: async (config) => {
        return {
          ...config,
          headers: {
            ...config.headers,
            'X-API-Context': 'subscriptions'
          }
        }
      }
    })
  }

  /**
   * Get Subscription Plans
   * Get available subscription plans for hosts or guests.
   * @param options - Request options
   * @returns Promise<ClientResponse<z.infer<typeof GetSubscriptionPlansApiV1SubscriptionsPlansGetResponseSchema>>>
   * @example
   * const result = await client.getSubscriptionPlansApiV1SubscriptionsPlansGet({
   *   config: { timeout: 5000 }
   * })
   */
  getSubscriptionPlansApiV1SubscriptionsPlansGet = cache(async (options: {
    params: z.infer<typeof GetSubscriptionPlansApiV1SubscriptionsPlansGetParamsSchema>
    config?: RequestConfiguration
  }) => {
// Validate and extract parameters
const validatedParams = await GetSubscriptionPlansApiV1SubscriptionsPlansGetParamsSchema.parseAsync(options.params)

    return this.request<z.infer<typeof GetSubscriptionPlansApiV1SubscriptionsPlansGetResponseSchema>>(
      'GET',
      '/api/v1/subscriptions/plans',
      {
queryParams: validatedParams.query,
config: { ...options?.config, middleware: [...defaultMiddleware, ...(options?.config?.middleware || [])] },
responseSchema: GetSubscriptionPlansApiV1SubscriptionsPlansGetResponseSchema
      }
    )
  })

  /**
   * Get My Subscription
   * Get current user's active subscription.
   * @param options - Request options
   * @returns Promise<ClientResponse<z.infer<typeof GetMySubscriptionApiV1SubscriptionsMySubscriptionGetResponseSchema>>>
   * @example
   * const result = await client.getMySubscriptionApiV1SubscriptionsMySubscriptionGet({
   *   config: { timeout: 5000 }
   * })
   */
  getMySubscriptionApiV1SubscriptionsMySubscriptionGet = cache(async (options: {
    params: z.infer<typeof GetMySubscriptionApiV1SubscriptionsMySubscriptionGetParamsSchema>
    config?: RequestConfiguration
  }) => {
// Validate and extract parameters
const validatedParams = await GetMySubscriptionApiV1SubscriptionsMySubscriptionGetParamsSchema.parseAsync(options.params)

    return this.request<z.infer<typeof GetMySubscriptionApiV1SubscriptionsMySubscriptionGetResponseSchema>>(
      'GET',
      '/api/v1/subscriptions/my-subscription',
      {
queryParams: validatedParams.query,
config: { ...options?.config, middleware: [...defaultMiddleware, ...(options?.config?.middleware || [])] },
responseSchema: GetMySubscriptionApiV1SubscriptionsMySubscriptionGetResponseSchema
      }
    )
  })

  /**
   * Subscribe
   * Subscribe to a plan.

Note: In production, this would integrate with Stripe to create
a subscription and handle payment.
   * @param options - Request options
   * @returns Promise<ClientResponse<z.infer<typeof SubscribeApiV1SubscriptionsSubscribePostResponseSchema>>>
   * @example
   * const result = await client.subscribeApiV1SubscriptionsSubscribePost({
   *   config: { timeout: 5000 }
   * })
   */
  subscribeApiV1SubscriptionsSubscribePost = async (options: {
    params: z.infer<typeof SubscribeApiV1SubscriptionsSubscribePostParamsSchema>
    config?: RequestConfiguration
  }) => {
// Validate and extract parameters
const validatedParams = await SubscribeApiV1SubscriptionsSubscribePostParamsSchema.parseAsync(options.params)

    return this.request<z.infer<typeof SubscribeApiV1SubscriptionsSubscribePostResponseSchema>>(
      'POST',
      '/api/v1/subscriptions/subscribe',
      {
queryParams: validatedParams.query,
config: { ...options?.config, middleware: [...defaultMiddleware, ...(options?.config?.middleware || [])] },
responseSchema: SubscribeApiV1SubscriptionsSubscribePostResponseSchema
      }
    )
  }

  /**
   * Cancel Subscription
   * Cancel a subscription.

If cancel_immediately is False, subscription will remain active
until the end of the current billing period.
   * @param options - Request options
   * @returns Promise<ClientResponse<z.infer<typeof CancelSubscriptionApiV1SubscriptionsSubscriptionIdCancelPostResponseSchema>>>
   * @example
   * const result = await client.cancelSubscriptionApiV1SubscriptionsSubscriptionIdCancelPost({
   *   config: { timeout: 5000 }
   * })
   */
  cancelSubscriptionApiV1SubscriptionsSubscriptionIdCancelPost = async (options: {
    params: z.infer<typeof CancelSubscriptionApiV1SubscriptionsSubscriptionIdCancelPostParamsSchema>
    config?: RequestConfiguration
  }) => {
// Validate and extract parameters
const validatedParams = await CancelSubscriptionApiV1SubscriptionsSubscriptionIdCancelPostParamsSchema.parseAsync(options.params)

    return this.request<z.infer<typeof CancelSubscriptionApiV1SubscriptionsSubscriptionIdCancelPostResponseSchema>>(
      'POST',
      '/api/v1/subscriptions/{subscription_id}/cancel',
      {
        pathParams: validatedParams.path,
queryParams: validatedParams.query,
config: { ...options?.config, middleware: [...defaultMiddleware, ...(options?.config?.middleware || [])] },
responseSchema: CancelSubscriptionApiV1SubscriptionsSubscriptionIdCancelPostResponseSchema
      }
    )
  }

  /**
   * Check Usage
   * Check usage against subscription limits.

limit_type: listings, bookings_per_month, or guests
   * @param options - Request options
   * @returns Promise<ClientResponse<z.infer<typeof CheckUsageApiV1SubscriptionsUsageLimitTypeGetResponseSchema>>>
   * @example
   * const result = await client.checkUsageApiV1SubscriptionsUsageLimitTypeGet({
   *   config: { timeout: 5000 }
   * })
   */
  checkUsageApiV1SubscriptionsUsageLimitTypeGet = cache(async (options: {
    params: z.infer<typeof CheckUsageApiV1SubscriptionsUsageLimitTypeGetParamsSchema>
    config?: RequestConfiguration
  }) => {
// Validate and extract parameters
const validatedParams = await CheckUsageApiV1SubscriptionsUsageLimitTypeGetParamsSchema.parseAsync(options.params)

    return this.request<z.infer<typeof CheckUsageApiV1SubscriptionsUsageLimitTypeGetResponseSchema>>(
      'GET',
      '/api/v1/subscriptions/usage/{limit_type}',
      {
        pathParams: validatedParams.path,
queryParams: validatedParams.query,
config: { ...options?.config, middleware: [...defaultMiddleware, ...(options?.config?.middleware || [])] },
responseSchema: CheckUsageApiV1SubscriptionsUsageLimitTypeGetResponseSchema
      }
    )
  })
}