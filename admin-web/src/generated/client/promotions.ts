import { z } from 'zod'
import { cache } from 'react'
import { BaseApiClient } from './base'
import type { ClientResponse, RequestConfiguration } from './base'
import { defaultMiddleware } from './middleware'
import {
  ListCouponsApiV1PromotionsCouponsGetResponseSchema,
  ListCouponsApiV1PromotionsCouponsGetParamsSchema,
  CreateCouponApiV1PromotionsCouponsPostRequestSchema,
  CreateCouponApiV1PromotionsCouponsPostResponseSchema,
  ValidateCouponApiV1PromotionsCouponsCouponCodeValidateGetResponseSchema,
  ValidateCouponApiV1PromotionsCouponsCouponCodeValidateGetParamsSchema,
  GetApplicablePromotionsApiV1PromotionsApplicableGetResponseSchema,
  GetApplicablePromotionsApiV1PromotionsApplicableGetParamsSchema
} from '@/generated/schemas'

export class PromotionsApiClient extends BaseApiClient {
  constructor() {
    super()
    
    // Add tag-specific middleware
    this.addMiddleware({
      name: 'promotions-context',
      onRequest: async (config) => {
        return {
          ...config,
          headers: {
            ...config.headers,
            'X-API-Context': 'promotions'
          }
        }
      }
    })
  }

  /**
   * List Coupons
   * List coupons.
   * @param options - Request options
   * @returns Promise<ClientResponse<z.infer<typeof ListCouponsApiV1PromotionsCouponsGetResponseSchema>>>
   * @example
   * const result = await client.listCouponsApiV1PromotionsCouponsGet({
   *   config: { timeout: 5000 }
   * })
   */
  listCouponsApiV1PromotionsCouponsGet = cache(async (options: {
    params: z.infer<typeof ListCouponsApiV1PromotionsCouponsGetParamsSchema>
    config?: RequestConfiguration
  }) => {
// Validate and extract parameters
const validatedParams = await ListCouponsApiV1PromotionsCouponsGetParamsSchema.parseAsync(options.params)

    return this.request<z.infer<typeof ListCouponsApiV1PromotionsCouponsGetResponseSchema>>(
      'GET',
      '/api/v1/promotions/coupons',
      {
queryParams: validatedParams.query,
config: { ...options?.config, middleware: [...defaultMiddleware, ...(options?.config?.middleware || [])] },
responseSchema: ListCouponsApiV1PromotionsCouponsGetResponseSchema
      }
    )
  })

  /**
   * Create Coupon
   * Create a new coupon.
Requires HOST role.
   * @param options - Request options
   * @returns Promise<ClientResponse<z.infer<typeof CreateCouponApiV1PromotionsCouponsPostResponseSchema>>>
   * @example
   * const result = await client.createCouponApiV1PromotionsCouponsPost({
   *   config: { timeout: 5000 }
   * })
   */
  createCouponApiV1PromotionsCouponsPost = async (options: {
    body: z.infer<typeof CreateCouponApiV1PromotionsCouponsPostRequestSchema>
    config?: RequestConfiguration
  }) => {
    // Validate request body
    const validatedBody = await CreateCouponApiV1PromotionsCouponsPostRequestSchema.parseAsync(options.body)

    return this.request<z.infer<typeof CreateCouponApiV1PromotionsCouponsPostResponseSchema>>(
      'POST',
      '/api/v1/promotions/coupons',
      {
body: validatedBody,
config: { ...options?.config, middleware: [...defaultMiddleware, ...(options?.config?.middleware || [])] },
responseSchema: CreateCouponApiV1PromotionsCouponsPostResponseSchema
      }
    )
  }

  /**
   * Validate Coupon
   * Validate a coupon code and get discount amount.
   * @param options - Request options
   * @returns Promise<ClientResponse<z.infer<typeof ValidateCouponApiV1PromotionsCouponsCouponCodeValidateGetResponseSchema>>>
   * @example
   * const result = await client.validateCouponApiV1PromotionsCouponsCouponCodeValidateGet({
   *   config: { timeout: 5000 }
   * })
   */
  validateCouponApiV1PromotionsCouponsCouponCodeValidateGet = cache(async (options: {
    params: z.infer<typeof ValidateCouponApiV1PromotionsCouponsCouponCodeValidateGetParamsSchema>
    config?: RequestConfiguration
  }) => {
// Validate and extract parameters
const validatedParams = await ValidateCouponApiV1PromotionsCouponsCouponCodeValidateGetParamsSchema.parseAsync(options.params)

    return this.request<z.infer<typeof ValidateCouponApiV1PromotionsCouponsCouponCodeValidateGetResponseSchema>>(
      'GET',
      '/api/v1/promotions/coupons/{coupon_code}/validate',
      {
        pathParams: validatedParams.path,
queryParams: validatedParams.query,
config: { ...options?.config, middleware: [...defaultMiddleware, ...(options?.config?.middleware || [])] },
responseSchema: ValidateCouponApiV1PromotionsCouponsCouponCodeValidateGetResponseSchema
      }
    )
  })

  /**
   * Get Applicable Promotions
   * Get active promotions applicable to a listing or booking.
Public endpoint.
   * @param options - Request options
   * @returns Promise<ClientResponse<z.infer<typeof GetApplicablePromotionsApiV1PromotionsApplicableGetResponseSchema>>>
   * @example
   * const result = await client.getApplicablePromotionsApiV1PromotionsApplicableGet({
   *   config: { timeout: 5000 }
   * })
   */
  getApplicablePromotionsApiV1PromotionsApplicableGet = cache(async (options: {
    params: z.infer<typeof GetApplicablePromotionsApiV1PromotionsApplicableGetParamsSchema>
    config?: RequestConfiguration
  }) => {
// Validate and extract parameters
const validatedParams = await GetApplicablePromotionsApiV1PromotionsApplicableGetParamsSchema.parseAsync(options.params)

    return this.request<z.infer<typeof GetApplicablePromotionsApiV1PromotionsApplicableGetResponseSchema>>(
      'GET',
      '/api/v1/promotions/applicable',
      {
queryParams: validatedParams.query,
config: { ...options?.config, middleware: [...defaultMiddleware, ...(options?.config?.middleware || [])] },
responseSchema: GetApplicablePromotionsApiV1PromotionsApplicableGetResponseSchema
      }
    )
  })
}