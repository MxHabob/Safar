import { z } from 'zod'
import { cache } from 'react'
import { BaseApiClient } from './base'
import type { ClientResponse, RequestConfiguration } from './base'
import { defaultMiddleware } from './middleware'
import {
  GetMyRecommendationsApiV1RecommendationsForMeGetResponseSchema,
  GetMyRecommendationsApiV1RecommendationsForMeGetParamsSchema,
  GetSimilarListingsApiV1RecommendationsSimilarListingIdGetResponseSchema,
  GetSimilarListingsApiV1RecommendationsSimilarListingIdGetParamsSchema,
  GetTrendingListingsApiV1RecommendationsTrendingGetResponseSchema,
  GetTrendingListingsApiV1RecommendationsTrendingGetParamsSchema,
  GetMlRecommendationsApiV1RecommendationsMlForMeGetResponseSchema,
  GetMlRecommendationsApiV1RecommendationsMlForMeGetParamsSchema,
  ExplainRecommendationApiV1RecommendationsMlExplainListingIdGetResponseSchema,
  ExplainRecommendationApiV1RecommendationsMlExplainListingIdGetParamsSchema,
  TrainRecommendationModelApiV1RecommendationsMlTrainPostResponseSchema,
  TrainRecommendationModelApiV1RecommendationsMlTrainPostParamsSchema
} from '@/generated/schemas'

export class RecommendationsApiClient extends BaseApiClient {
  constructor() {
    super()
    
    // Add tag-specific middleware
    this.addMiddleware({
      name: 'recommendations-context',
      onRequest: async (config) => {
        return {
          ...config,
          headers: {
            ...config.headers,
            'X-API-Context': 'recommendations'
          }
        }
      }
    })
  }

  /**
   * Get My Recommendations
   * Get personalized recommendations for the current user.
Uses collaborative filtering, content-based filtering, and popularity.
   * @param options - Request options
   * @returns Promise<ClientResponse<z.infer<typeof GetMyRecommendationsApiV1RecommendationsForMeGetResponseSchema>>>
   * @example
   * const result = await client.getMyRecommendationsApiV1RecommendationsForMeGet({
   *   config: { timeout: 5000 }
   * })
   */
  getMyRecommendationsApiV1RecommendationsForMeGet = cache(async (options: {
    params: z.infer<typeof GetMyRecommendationsApiV1RecommendationsForMeGetParamsSchema>
    config?: RequestConfiguration
  }) => {
// Validate and extract parameters
const validatedParams = await GetMyRecommendationsApiV1RecommendationsForMeGetParamsSchema.parseAsync(options.params)

    return this.request<z.infer<typeof GetMyRecommendationsApiV1RecommendationsForMeGetResponseSchema>>(
      'GET',
      '/api/v1/recommendations/for-me',
      {
queryParams: validatedParams.query,
config: { ...options?.config, middleware: [...defaultMiddleware, ...(options?.config?.middleware || [])] },
responseSchema: GetMyRecommendationsApiV1RecommendationsForMeGetResponseSchema
      }
    )
  })

  /**
   * Get Similar Listings
   * Get listings similar to the specified listing.
Based on location, type, price, and amenities.
   * @param options - Request options
   * @returns Promise<ClientResponse<z.infer<typeof GetSimilarListingsApiV1RecommendationsSimilarListingIdGetResponseSchema>>>
   * @example
   * const result = await client.getSimilarListingsApiV1RecommendationsSimilarListingIdGet({
   *   config: { timeout: 5000 }
   * })
   */
  getSimilarListingsApiV1RecommendationsSimilarListingIdGet = cache(async (options: {
    params: z.infer<typeof GetSimilarListingsApiV1RecommendationsSimilarListingIdGetParamsSchema>
    config?: RequestConfiguration
  }) => {
// Validate and extract parameters
const validatedParams = await GetSimilarListingsApiV1RecommendationsSimilarListingIdGetParamsSchema.parseAsync(options.params)

    return this.request<z.infer<typeof GetSimilarListingsApiV1RecommendationsSimilarListingIdGetResponseSchema>>(
      'GET',
      '/api/v1/recommendations/similar/{listing_id}',
      {
        pathParams: validatedParams.path,
queryParams: validatedParams.query,
config: { ...options?.config, middleware: [...defaultMiddleware, ...(options?.config?.middleware || [])] },
responseSchema: GetSimilarListingsApiV1RecommendationsSimilarListingIdGetResponseSchema
      }
    )
  })

  /**
   * Get Trending Listings
   * Get trending listings based on recent bookings.
Public endpoint (authentication optional).
   * @param options - Request options
   * @returns Promise<ClientResponse<z.infer<typeof GetTrendingListingsApiV1RecommendationsTrendingGetResponseSchema>>>
   * @example
   * const result = await client.getTrendingListingsApiV1RecommendationsTrendingGet({
   *   config: { timeout: 5000 }
   * })
   */
  getTrendingListingsApiV1RecommendationsTrendingGet = cache(async (options: {
    params: z.infer<typeof GetTrendingListingsApiV1RecommendationsTrendingGetParamsSchema>
    config?: RequestConfiguration
  }) => {
// Validate and extract parameters
const validatedParams = await GetTrendingListingsApiV1RecommendationsTrendingGetParamsSchema.parseAsync(options.params)

    return this.request<z.infer<typeof GetTrendingListingsApiV1RecommendationsTrendingGetResponseSchema>>(
      'GET',
      '/api/v1/recommendations/trending',
      {
queryParams: validatedParams.query,
config: { ...options?.config, middleware: [...defaultMiddleware, ...(options?.config?.middleware || [])] },
responseSchema: GetTrendingListingsApiV1RecommendationsTrendingGetResponseSchema
      }
    )
  })

  /**
   * Get Ml Recommendations
   * Get ML-powered personalized recommendations.

Algorithms:
- hybrid: Combines multiple approaches (default)
- collaborative: User-based collaborative filtering
- content: Content-based filtering
- neural: Neural network-based (future)
   * @param options - Request options
   * @returns Promise<ClientResponse<z.infer<typeof GetMlRecommendationsApiV1RecommendationsMlForMeGetResponseSchema>>>
   * @example
   * const result = await client.getMlRecommendationsApiV1RecommendationsMlForMeGet({
   *   config: { timeout: 5000 }
   * })
   */
  getMlRecommendationsApiV1RecommendationsMlForMeGet = cache(async (options: {
    params: z.infer<typeof GetMlRecommendationsApiV1RecommendationsMlForMeGetParamsSchema>
    config?: RequestConfiguration
  }) => {
// Validate and extract parameters
const validatedParams = await GetMlRecommendationsApiV1RecommendationsMlForMeGetParamsSchema.parseAsync(options.params)

    return this.request<z.infer<typeof GetMlRecommendationsApiV1RecommendationsMlForMeGetResponseSchema>>(
      'GET',
      '/api/v1/recommendations/ml/for-me',
      {
queryParams: validatedParams.query,
config: { ...options?.config, middleware: [...defaultMiddleware, ...(options?.config?.middleware || [])] },
responseSchema: GetMlRecommendationsApiV1RecommendationsMlForMeGetResponseSchema
      }
    )
  })

  /**
   * Explain Recommendation
   * Get explanation for why a listing was recommended.
Provides transparency in recommendation decisions.
   * @param options - Request options
   * @returns Promise<ClientResponse<z.infer<typeof ExplainRecommendationApiV1RecommendationsMlExplainListingIdGetResponseSchema>>>
   * @example
   * const result = await client.explainRecommendationApiV1RecommendationsMlExplainListingIdGet({
   *   config: { timeout: 5000 }
   * })
   */
  explainRecommendationApiV1RecommendationsMlExplainListingIdGet = cache(async (options: {
    params: z.infer<typeof ExplainRecommendationApiV1RecommendationsMlExplainListingIdGetParamsSchema>
    config?: RequestConfiguration
  }) => {
// Validate and extract parameters
const validatedParams = await ExplainRecommendationApiV1RecommendationsMlExplainListingIdGetParamsSchema.parseAsync(options.params)

    return this.request<z.infer<typeof ExplainRecommendationApiV1RecommendationsMlExplainListingIdGetResponseSchema>>(
      'GET',
      '/api/v1/recommendations/ml/explain/{listing_id}',
      {
        pathParams: validatedParams.path,
config: { ...options?.config, middleware: [...defaultMiddleware, ...(options?.config?.middleware || [])] },
responseSchema: ExplainRecommendationApiV1RecommendationsMlExplainListingIdGetResponseSchema
      }
    )
  })

  /**
   * Train Recommendation Model
   * Train recommendation model (admin only).
In production, this would be a scheduled task.
   * @param options - Request options
   * @returns Promise<ClientResponse<z.infer<typeof TrainRecommendationModelApiV1RecommendationsMlTrainPostResponseSchema>>>
   * @example
   * const result = await client.trainRecommendationModelApiV1RecommendationsMlTrainPost({
   *   config: { timeout: 5000 }
   * })
   */
  trainRecommendationModelApiV1RecommendationsMlTrainPost = async (options: {
    params: z.infer<typeof TrainRecommendationModelApiV1RecommendationsMlTrainPostParamsSchema>
    config?: RequestConfiguration
  }) => {
// Validate and extract parameters
const validatedParams = await TrainRecommendationModelApiV1RecommendationsMlTrainPostParamsSchema.parseAsync(options.params)

    return this.request<z.infer<typeof TrainRecommendationModelApiV1RecommendationsMlTrainPostResponseSchema>>(
      'POST',
      '/api/v1/recommendations/ml/train',
      {
queryParams: validatedParams.query,
config: { ...options?.config, middleware: [...defaultMiddleware, ...(options?.config?.middleware || [])] },
responseSchema: TrainRecommendationModelApiV1RecommendationsMlTrainPostResponseSchema
      }
    )
  }
}