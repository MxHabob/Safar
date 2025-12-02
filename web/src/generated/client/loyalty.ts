import { z } from 'zod'
import { cache } from 'react'
import { BaseApiClient } from './base'
import type { ClientResponse, RequestConfiguration } from './base'
import { defaultMiddleware } from './middleware'
import {
  GetLoyaltyStatusApiV1LoyaltyStatusGetResponseSchema,
  RedeemPointsApiV1LoyaltyRedeemPostRequestSchema,
  RedeemPointsApiV1LoyaltyRedeemPostResponseSchema,
  GetRedemptionOptionsApiV1LoyaltyRedemptionOptionsGetResponseSchema,
  GetLoyaltyHistoryApiV1LoyaltyHistoryGetResponseSchema,
  GetLoyaltyHistoryApiV1LoyaltyHistoryGetParamsSchema
} from '@/generated/schemas'

export class LoyaltyApiClient extends BaseApiClient {
  constructor() {
    super()
    
    // Add tag-specific middleware
    this.addMiddleware({
      name: 'loyalty-context',
      onRequest: async (config) => {
        return {
          ...config,
          headers: {
            ...config.headers,
            'X-API-Context': 'loyalty'
          }
        }
      }
    })
  }

  /**
   * Get Loyalty Status
   * Get user's loyalty program status.

Returns:
    Current balance, tier, benefits, and transaction history
   * @param options - Request options
   * @returns Promise<ClientResponse<z.infer<typeof GetLoyaltyStatusApiV1LoyaltyStatusGetResponseSchema>>>
   * @example
   * const result = await client.getLoyaltyStatusApiV1LoyaltyStatusGet({
   *   config: { timeout: 5000 }
   * })
   */
  getLoyaltyStatusApiV1LoyaltyStatusGet = cache(async (options?: { config?: RequestConfiguration }) => {
    return this.request<z.infer<typeof GetLoyaltyStatusApiV1LoyaltyStatusGetResponseSchema>>(
      'GET',
      '/api/v1/loyalty/status',
      {
config: { ...options?.config, middleware: [...defaultMiddleware, ...(options?.config?.middleware || [])] },
responseSchema: GetLoyaltyStatusApiV1LoyaltyStatusGetResponseSchema
      }
    )
  })

  /**
   * Redeem Points
   * Redeem loyalty points for discount.

Points can be redeemed in multiples of 100 (100 points = $1 discount).
Minimum redemption is 100 points.
   * @param options - Request options
   * @returns Promise<ClientResponse<z.infer<typeof RedeemPointsApiV1LoyaltyRedeemPostResponseSchema>>>
   * @example
   * const result = await client.redeemPointsApiV1LoyaltyRedeemPost({
   *   config: { timeout: 5000 }
   * })
   */
  redeemPointsApiV1LoyaltyRedeemPost = async (options: {
    body: z.infer<typeof RedeemPointsApiV1LoyaltyRedeemPostRequestSchema>
    config?: RequestConfiguration
  }) => {
    // Validate request body
    const validatedBody = await RedeemPointsApiV1LoyaltyRedeemPostRequestSchema.parseAsync(options.body)

    return this.request<z.infer<typeof RedeemPointsApiV1LoyaltyRedeemPostResponseSchema>>(
      'POST',
      '/api/v1/loyalty/redeem',
      {
body: validatedBody,
config: { ...options?.config, middleware: [...defaultMiddleware, ...(options?.config?.middleware || [])] },
responseSchema: RedeemPointsApiV1LoyaltyRedeemPostResponseSchema
      }
    )
  }

  /**
   * Get Redemption Options
   * Get available redemption options.

Returns list of redemption options with point costs and values.
   * @param options - Request options
   * @returns Promise<ClientResponse<z.infer<typeof GetRedemptionOptionsApiV1LoyaltyRedemptionOptionsGetResponseSchema>>>
   * @example
   * const result = await client.getRedemptionOptionsApiV1LoyaltyRedemptionOptionsGet({
   *   config: { timeout: 5000 }
   * })
   */
  getRedemptionOptionsApiV1LoyaltyRedemptionOptionsGet = cache(async (options?: { config?: RequestConfiguration }) => {
    return this.request<z.infer<typeof GetRedemptionOptionsApiV1LoyaltyRedemptionOptionsGetResponseSchema>>(
      'GET',
      '/api/v1/loyalty/redemption-options',
      {
config: { ...options?.config, middleware: [...defaultMiddleware, ...(options?.config?.middleware || [])] },
responseSchema: GetRedemptionOptionsApiV1LoyaltyRedemptionOptionsGetResponseSchema
      }
    )
  })

  /**
   * Get Loyalty History
   * Get loyalty transaction history.

Returns recent transactions from user's loyalty ledger.
   * @param options - Request options
   * @returns Promise<ClientResponse<z.infer<typeof GetLoyaltyHistoryApiV1LoyaltyHistoryGetResponseSchema>>>
   * @example
   * const result = await client.getLoyaltyHistoryApiV1LoyaltyHistoryGet({
   *   config: { timeout: 5000 }
   * })
   */
  getLoyaltyHistoryApiV1LoyaltyHistoryGet = cache(async (options: {
    params: z.infer<typeof GetLoyaltyHistoryApiV1LoyaltyHistoryGetParamsSchema>
    config?: RequestConfiguration
  }) => {
// Validate and extract parameters
const validatedParams = await GetLoyaltyHistoryApiV1LoyaltyHistoryGetParamsSchema.parseAsync(options.params)

    return this.request<z.infer<typeof GetLoyaltyHistoryApiV1LoyaltyHistoryGetResponseSchema>>(
      'GET',
      '/api/v1/loyalty/history',
      {
queryParams: validatedParams.query,
config: { ...options?.config, middleware: [...defaultMiddleware, ...(options?.config?.middleware || [])] },
responseSchema: GetLoyaltyHistoryApiV1LoyaltyHistoryGetResponseSchema
      }
    )
  })
}