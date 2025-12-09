import { z } from 'zod'
import { cache } from 'react'
import { BaseApiClient } from './base'
import type { ClientResponse, RequestConfiguration } from './base'
import { defaultMiddleware } from './middleware'
import {
  CreateReviewApiV1ReviewsPostRequestSchema,
  CreateReviewApiV1ReviewsPostResponseSchema,
  GetListingReviewsApiV1ReviewsListingsListingIdGetResponseSchema,
  GetListingReviewsApiV1ReviewsListingsListingIdGetParamsSchema,
  GetReviewApiV1ReviewsReviewIdGetResponseSchema,
  GetReviewApiV1ReviewsReviewIdGetParamsSchema,
  CreateReviewResponseApiV1ReviewsReviewIdResponsePostRequestSchema,
  CreateReviewResponseApiV1ReviewsReviewIdResponsePostResponseSchema,
  CreateReviewResponseApiV1ReviewsReviewIdResponsePostParamsSchema,
  MarkReviewHelpfulApiV1ReviewsReviewIdHelpfulPostRequestSchema,
  MarkReviewHelpfulApiV1ReviewsReviewIdHelpfulPostResponseSchema,
  MarkReviewHelpfulApiV1ReviewsReviewIdHelpfulPostParamsSchema
} from '@/generated/schemas'

export class ReviewsApiClient extends BaseApiClient {
  constructor() {
    super()
    
    // Add tag-specific middleware
    this.addMiddleware({
      name: 'reviews-context',
      onRequest: async (config) => {
        return {
          ...config,
          headers: {
            ...config.headers,
            'X-API-Context': 'reviews'
          }
        }
      }
    })
  }

  /**
   * Create Review
   * Create a new review.
   * @param options - Request options
   * @returns Promise<ClientResponse<z.infer<typeof CreateReviewApiV1ReviewsPostResponseSchema>>>
   * @example
   * const result = await client.createReviewApiV1ReviewsPost({
   *   config: { timeout: 5000 }
   * })
   */
  createReviewApiV1ReviewsPost = async (options: {
    body: z.infer<typeof CreateReviewApiV1ReviewsPostRequestSchema>
    config?: RequestConfiguration
  }) => {
    // Validate request body
    const validatedBody = await CreateReviewApiV1ReviewsPostRequestSchema.parseAsync(options.body)

    return this.request<z.infer<typeof CreateReviewApiV1ReviewsPostResponseSchema>>(
      'POST',
      '/api/v1/reviews',
      {
body: validatedBody,
config: { ...options?.config, middleware: [...defaultMiddleware, ...(options?.config?.middleware || [])] },
responseSchema: CreateReviewApiV1ReviewsPostResponseSchema
      }
    )
  }

  /**
   * Get Listing Reviews
   * Get reviews for a listing.
   * @param options - Request options
   * @returns Promise<ClientResponse<z.infer<typeof GetListingReviewsApiV1ReviewsListingsListingIdGetResponseSchema>>>
   * @example
   * const result = await client.getListingReviewsApiV1ReviewsListingsListingIdGet({
   *   config: { timeout: 5000 }
   * })
   */
  getListingReviewsApiV1ReviewsListingsListingIdGet = cache(async (options: {
    params: z.infer<typeof GetListingReviewsApiV1ReviewsListingsListingIdGetParamsSchema>
    config?: RequestConfiguration
  }) => {
// Validate and extract parameters
const validatedParams = await GetListingReviewsApiV1ReviewsListingsListingIdGetParamsSchema.parseAsync(options.params)

    return this.request<z.infer<typeof GetListingReviewsApiV1ReviewsListingsListingIdGetResponseSchema>>(
      'GET',
      '/api/v1/reviews/listings/{listing_id}',
      {
        pathParams: validatedParams.path,
queryParams: validatedParams.query,
config: { ...options?.config, middleware: [...defaultMiddleware, ...(options?.config?.middleware || [])] },
responseSchema: GetListingReviewsApiV1ReviewsListingsListingIdGetResponseSchema
      }
    )
  })

  /**
   * Get Review
   * Get review details by ID.
   * @param options - Request options
   * @returns Promise<ClientResponse<z.infer<typeof GetReviewApiV1ReviewsReviewIdGetResponseSchema>>>
   * @example
   * const result = await client.getReviewApiV1ReviewsReviewIdGet({
   *   config: { timeout: 5000 }
   * })
   */
  getReviewApiV1ReviewsReviewIdGet = cache(async (options: {
    params: z.infer<typeof GetReviewApiV1ReviewsReviewIdGetParamsSchema>
    config?: RequestConfiguration
  }) => {
// Validate and extract parameters
const validatedParams = await GetReviewApiV1ReviewsReviewIdGetParamsSchema.parseAsync(options.params)

    return this.request<z.infer<typeof GetReviewApiV1ReviewsReviewIdGetResponseSchema>>(
      'GET',
      '/api/v1/reviews/{review_id}',
      {
        pathParams: validatedParams.path,
config: { ...options?.config, middleware: [...defaultMiddleware, ...(options?.config?.middleware || [])] },
responseSchema: GetReviewApiV1ReviewsReviewIdGetResponseSchema
      }
    )
  })

  /**
   * Create Review Response
   * Create a host response to a review.
   * @param options - Request options
   * @returns Promise<ClientResponse<z.infer<typeof CreateReviewResponseApiV1ReviewsReviewIdResponsePostResponseSchema>>>
   * @example
   * const result = await client.createReviewResponseApiV1ReviewsReviewIdResponsePost({
   *   config: { timeout: 5000 }
   * })
   */
  createReviewResponseApiV1ReviewsReviewIdResponsePost = async (options: {
    params: z.infer<typeof CreateReviewResponseApiV1ReviewsReviewIdResponsePostParamsSchema>
    body: z.infer<typeof CreateReviewResponseApiV1ReviewsReviewIdResponsePostRequestSchema>
    config?: RequestConfiguration
  }) => {
    // Validate request body
    const validatedBody = await CreateReviewResponseApiV1ReviewsReviewIdResponsePostRequestSchema.parseAsync(options.body)
// Validate and extract parameters
const validatedParams = await CreateReviewResponseApiV1ReviewsReviewIdResponsePostParamsSchema.parseAsync(options.params)

    return this.request<z.infer<typeof CreateReviewResponseApiV1ReviewsReviewIdResponsePostResponseSchema>>(
      'POST',
      '/api/v1/reviews/{review_id}/response',
      {
        pathParams: validatedParams.path,
body: validatedBody,
config: { ...options?.config, middleware: [...defaultMiddleware, ...(options?.config?.middleware || [])] },
responseSchema: CreateReviewResponseApiV1ReviewsReviewIdResponsePostResponseSchema
      }
    )
  }

  /**
   * Mark Review Helpful
   * Mark a review as helpful or not helpful for the current user.
   * @param options - Request options
   * @returns Promise<ClientResponse<z.infer<typeof MarkReviewHelpfulApiV1ReviewsReviewIdHelpfulPostResponseSchema>>>
   * @example
   * const result = await client.markReviewHelpfulApiV1ReviewsReviewIdHelpfulPost({
   *   config: { timeout: 5000 }
   * })
   */
  markReviewHelpfulApiV1ReviewsReviewIdHelpfulPost = async (options: {
    params: z.infer<typeof MarkReviewHelpfulApiV1ReviewsReviewIdHelpfulPostParamsSchema>
    body: z.infer<typeof MarkReviewHelpfulApiV1ReviewsReviewIdHelpfulPostRequestSchema>
    config?: RequestConfiguration
  }) => {
    // Validate request body
    const validatedBody = await MarkReviewHelpfulApiV1ReviewsReviewIdHelpfulPostRequestSchema.parseAsync(options.body)
// Validate and extract parameters
const validatedParams = await MarkReviewHelpfulApiV1ReviewsReviewIdHelpfulPostParamsSchema.parseAsync(options.params)

    return this.request<z.infer<typeof MarkReviewHelpfulApiV1ReviewsReviewIdHelpfulPostResponseSchema>>(
      'POST',
      '/api/v1/reviews/{review_id}/helpful',
      {
        pathParams: validatedParams.path,
body: validatedBody,
config: { ...options?.config, middleware: [...defaultMiddleware, ...(options?.config?.middleware || [])] },
responseSchema: MarkReviewHelpfulApiV1ReviewsReviewIdHelpfulPostResponseSchema
      }
    )
  }
}