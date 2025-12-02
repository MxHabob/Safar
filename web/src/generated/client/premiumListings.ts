import { z } from 'zod'
import { cache } from 'react'
import { BaseApiClient } from './base'
import type { ClientResponse, RequestConfiguration } from './base'
import { defaultMiddleware } from './middleware'
import {
  UpgradeListingToPremiumApiV1ListingsPremiumListingIdUpgradePostResponseSchema,
  UpgradeListingToPremiumApiV1ListingsPremiumListingIdUpgradePostParamsSchema,
  FeatureListingApiV1ListingsPremiumListingIdFeaturePostResponseSchema,
  FeatureListingApiV1ListingsPremiumListingIdFeaturePostParamsSchema,
  GetFeaturedListingsApiV1ListingsPremiumFeaturedGetResponseSchema,
  GetFeaturedListingsApiV1ListingsPremiumFeaturedGetParamsSchema,
  GetPremiumListingsApiV1ListingsPremiumPremiumGetResponseSchema,
  GetPremiumListingsApiV1ListingsPremiumPremiumGetParamsSchema,
  GetPricingOptionsApiV1ListingsPremiumPricingGetResponseSchema
} from '@/generated/schemas'

export class PremiumListingsApiClient extends BaseApiClient {
  constructor() {
    super()
    
    // Add tag-specific middleware
    this.addMiddleware({
      name: 'premiumListings-context',
      onRequest: async (config) => {
        return {
          ...config,
          headers: {
            ...config.headers,
            'X-API-Context': 'premiumListings'
          }
        }
      }
    })
  }

  /**
   * Upgrade Listing To Premium
   * Upgrade a listing to premium status.

Requires host authentication and ownership of the listing.
   * @param options - Request options
   * @returns Promise<ClientResponse<z.infer<typeof UpgradeListingToPremiumApiV1ListingsPremiumListingIdUpgradePostResponseSchema>>>
   * @example
   * const result = await client.upgradeListingToPremiumApiV1ListingsPremiumListingIdUpgradePost({
   *   config: { timeout: 5000 }
   * })
   */
  upgradeListingToPremiumApiV1ListingsPremiumListingIdUpgradePost = async (options: {
    params: z.infer<typeof UpgradeListingToPremiumApiV1ListingsPremiumListingIdUpgradePostParamsSchema>
    config?: RequestConfiguration
  }) => {
// Validate and extract parameters
const validatedParams = await UpgradeListingToPremiumApiV1ListingsPremiumListingIdUpgradePostParamsSchema.parseAsync(options.params)

    return this.request<z.infer<typeof UpgradeListingToPremiumApiV1ListingsPremiumListingIdUpgradePostResponseSchema>>(
      'POST',
      '/api/v1/listings/premium/{listing_id}/upgrade',
      {
        pathParams: validatedParams.path,
queryParams: validatedParams.query,
config: { ...options?.config, middleware: [...defaultMiddleware, ...(options?.config?.middleware || [])] },
responseSchema: UpgradeListingToPremiumApiV1ListingsPremiumListingIdUpgradePostResponseSchema
      }
    )
  }

  /**
   * Feature Listing
   * Feature a listing (appears in featured section).

Requires host authentication and ownership of the listing.
   * @param options - Request options
   * @returns Promise<ClientResponse<z.infer<typeof FeatureListingApiV1ListingsPremiumListingIdFeaturePostResponseSchema>>>
   * @example
   * const result = await client.featureListingApiV1ListingsPremiumListingIdFeaturePost({
   *   config: { timeout: 5000 }
   * })
   */
  featureListingApiV1ListingsPremiumListingIdFeaturePost = async (options: {
    params: z.infer<typeof FeatureListingApiV1ListingsPremiumListingIdFeaturePostParamsSchema>
    config?: RequestConfiguration
  }) => {
// Validate and extract parameters
const validatedParams = await FeatureListingApiV1ListingsPremiumListingIdFeaturePostParamsSchema.parseAsync(options.params)

    return this.request<z.infer<typeof FeatureListingApiV1ListingsPremiumListingIdFeaturePostResponseSchema>>(
      'POST',
      '/api/v1/listings/premium/{listing_id}/feature',
      {
        pathParams: validatedParams.path,
queryParams: validatedParams.query,
config: { ...options?.config, middleware: [...defaultMiddleware, ...(options?.config?.middleware || [])] },
responseSchema: FeatureListingApiV1ListingsPremiumListingIdFeaturePostResponseSchema
      }
    )
  }

  /**
   * Get Featured Listings
   * Get featured listings (for homepage/featured section).

Returns listings sorted by priority and rating.
   * @param options - Request options
   * @returns Promise<ClientResponse<z.infer<typeof GetFeaturedListingsApiV1ListingsPremiumFeaturedGetResponseSchema>>>
   * @example
   * const result = await client.getFeaturedListingsApiV1ListingsPremiumFeaturedGet({
   *   config: { timeout: 5000 }
   * })
   */
  getFeaturedListingsApiV1ListingsPremiumFeaturedGet = cache(async (options: {
    params: z.infer<typeof GetFeaturedListingsApiV1ListingsPremiumFeaturedGetParamsSchema>
    config?: RequestConfiguration
  }) => {
// Validate and extract parameters
const validatedParams = await GetFeaturedListingsApiV1ListingsPremiumFeaturedGetParamsSchema.parseAsync(options.params)

    return this.request<z.infer<typeof GetFeaturedListingsApiV1ListingsPremiumFeaturedGetResponseSchema>>(
      'GET',
      '/api/v1/listings/premium/featured',
      {
queryParams: validatedParams.query,
config: { ...options?.config, middleware: [...defaultMiddleware, ...(options?.config?.middleware || [])] },
responseSchema: GetFeaturedListingsApiV1ListingsPremiumFeaturedGetResponseSchema
      }
    )
  })

  /**
   * Get Premium Listings
   * Get premium listings (boosted in search results).

Returns premium listings sorted by priority.
   * @param options - Request options
   * @returns Promise<ClientResponse<z.infer<typeof GetPremiumListingsApiV1ListingsPremiumPremiumGetResponseSchema>>>
   * @example
   * const result = await client.getPremiumListingsApiV1ListingsPremiumPremiumGet({
   *   config: { timeout: 5000 }
   * })
   */
  getPremiumListingsApiV1ListingsPremiumPremiumGet = cache(async (options: {
    params: z.infer<typeof GetPremiumListingsApiV1ListingsPremiumPremiumGetParamsSchema>
    config?: RequestConfiguration
  }) => {
// Validate and extract parameters
const validatedParams = await GetPremiumListingsApiV1ListingsPremiumPremiumGetParamsSchema.parseAsync(options.params)

    return this.request<z.infer<typeof GetPremiumListingsApiV1ListingsPremiumPremiumGetResponseSchema>>(
      'GET',
      '/api/v1/listings/premium/premium',
      {
queryParams: validatedParams.query,
config: { ...options?.config, middleware: [...defaultMiddleware, ...(options?.config?.middleware || [])] },
responseSchema: GetPremiumListingsApiV1ListingsPremiumPremiumGetResponseSchema
      }
    )
  })

  /**
   * Get Pricing Options
   * Get available pricing options for premium and featured listings.

Returns pricing tiers and options.
   * @param options - Request options
   * @returns Promise<ClientResponse<z.infer<typeof GetPricingOptionsApiV1ListingsPremiumPricingGetResponseSchema>>>
   * @example
   * const result = await client.getPricingOptionsApiV1ListingsPremiumPricingGet({
   *   config: { timeout: 5000 }
   * })
   */
  getPricingOptionsApiV1ListingsPremiumPricingGet = cache(async (options?: { config?: RequestConfiguration }) => {
    return this.request<z.infer<typeof GetPricingOptionsApiV1ListingsPremiumPricingGetResponseSchema>>(
      'GET',
      '/api/v1/listings/premium/pricing',
      {
config: { ...options?.config, middleware: [...defaultMiddleware, ...(options?.config?.middleware || [])] },
responseSchema: GetPricingOptionsApiV1ListingsPremiumPricingGetResponseSchema
      }
    )
  })
}