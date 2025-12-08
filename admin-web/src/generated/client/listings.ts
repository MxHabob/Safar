import { z } from 'zod'
import { cache } from 'react'
import { BaseApiClient } from './base'
import type { ClientResponse, RequestConfiguration } from './base'
import { defaultMiddleware } from './middleware'
import {
  ListListingsApiV1ListingsGetResponseSchema,
  ListListingsApiV1ListingsGetParamsSchema,
  CreateListingApiV1ListingsPostRequestSchema,
  CreateListingApiV1ListingsPostResponseSchema,
  GetListingApiV1ListingsListingIdGetResponseSchema,
  GetListingApiV1ListingsListingIdGetParamsSchema,
  UpdateListingApiV1ListingsListingIdPutRequestSchema,
  UpdateListingApiV1ListingsListingIdPutResponseSchema,
  UpdateListingApiV1ListingsListingIdPutParamsSchema,
  DeleteListingApiV1ListingsListingIdDeleteResponseSchema,
  DeleteListingApiV1ListingsListingIdDeleteParamsSchema,
  CreateListingLocationApiV1ListingsListingIdLocationPostRequestSchema,
  CreateListingLocationApiV1ListingsListingIdLocationPostResponseSchema,
  CreateListingLocationApiV1ListingsListingIdLocationPostParamsSchema
} from '@/generated/schemas'

export class ListingsApiClient extends BaseApiClient {
  constructor() {
    super()
    
    // Add tag-specific middleware
    this.addMiddleware({
      name: 'listings-context',
      onRequest: async (config) => {
        return {
          ...config,
          headers: {
            ...config.headers,
            'X-API-Context': 'listings'
          }
        }
      }
    })
  }

  /**
   * List Listings
   * List listings with optional filters (city, country, type, price, guests, status).
   * @param options - Request options
   * @returns Promise<ClientResponse<z.infer<typeof ListListingsApiV1ListingsGetResponseSchema>>>
   * @example
   * const result = await client.listListingsApiV1ListingsGet({
   *   config: { timeout: 5000 }
   * })
   */
  listListingsApiV1ListingsGet = cache(async (options: {
    params: z.infer<typeof ListListingsApiV1ListingsGetParamsSchema>
    config?: RequestConfiguration
  }) => {
// Validate and extract parameters
const validatedParams = await ListListingsApiV1ListingsGetParamsSchema.parseAsync(options.params)

    return this.request<z.infer<typeof ListListingsApiV1ListingsGetResponseSchema>>(
      'GET',
      '/api/v1/listings',
      {
queryParams: validatedParams.query,
config: { ...options?.config, middleware: [...defaultMiddleware, ...(options?.config?.middleware || [])] },
responseSchema: ListListingsApiV1ListingsGetResponseSchema
      }
    )
  })

  /**
   * Create Listing
   * Create a new listing for the current host.
   * @param options - Request options
   * @returns Promise<ClientResponse<z.infer<typeof CreateListingApiV1ListingsPostResponseSchema>>>
   * @example
   * const result = await client.createListingApiV1ListingsPost({
   *   config: { timeout: 5000 }
   * })
   */
  createListingApiV1ListingsPost = async (options: {
    body: z.infer<typeof CreateListingApiV1ListingsPostRequestSchema>
    config?: RequestConfiguration
  }) => {
    // Validate request body
    const validatedBody = await CreateListingApiV1ListingsPostRequestSchema.parseAsync(options.body)

    return this.request<z.infer<typeof CreateListingApiV1ListingsPostResponseSchema>>(
      'POST',
      '/api/v1/listings',
      {
body: validatedBody,
config: { ...options?.config, middleware: [...defaultMiddleware, ...(options?.config?.middleware || [])] },
responseSchema: CreateListingApiV1ListingsPostResponseSchema
      }
    )
  }

  /**
   * Get Listing
   * Get listing details.

- Public access: returns limited data (no exact address, limited host info).
- Authenticated access: returns full data with personalized information.
   * @param options - Request options
   * @returns Promise<ClientResponse<z.infer<typeof GetListingApiV1ListingsListingIdGetResponseSchema>>>
   * @example
   * const result = await client.getListingApiV1ListingsListingIdGet({
   *   config: { timeout: 5000 }
   * })
   */
  getListingApiV1ListingsListingIdGet = cache(async (options: {
    params: z.infer<typeof GetListingApiV1ListingsListingIdGetParamsSchema>
    config?: RequestConfiguration
  }) => {
// Validate and extract parameters
const validatedParams = await GetListingApiV1ListingsListingIdGetParamsSchema.parseAsync(options.params)

    return this.request<z.infer<typeof GetListingApiV1ListingsListingIdGetResponseSchema>>(
      'GET',
      '/api/v1/listings/{listing_id}',
      {
        pathParams: validatedParams.path,
config: { ...options?.config, middleware: [...defaultMiddleware, ...(options?.config?.middleware || [])] },
responseSchema: GetListingApiV1ListingsListingIdGetResponseSchema
      }
    )
  })

  /**
   * Update Listing
   * Update an existing listing (host or admin only).
   * @param options - Request options
   * @returns Promise<ClientResponse<z.infer<typeof UpdateListingApiV1ListingsListingIdPutResponseSchema>>>
   * @example
   * const result = await client.updateListingApiV1ListingsListingIdPut({
   *   config: { timeout: 5000 }
   * })
   */
  updateListingApiV1ListingsListingIdPut = async (options: {
    params: z.infer<typeof UpdateListingApiV1ListingsListingIdPutParamsSchema>
    body: z.infer<typeof UpdateListingApiV1ListingsListingIdPutRequestSchema>
    config?: RequestConfiguration
  }) => {
    // Validate request body
    const validatedBody = await UpdateListingApiV1ListingsListingIdPutRequestSchema.parseAsync(options.body)
// Validate and extract parameters
const validatedParams = await UpdateListingApiV1ListingsListingIdPutParamsSchema.parseAsync(options.params)

    return this.request<z.infer<typeof UpdateListingApiV1ListingsListingIdPutResponseSchema>>(
      'PUT',
      '/api/v1/listings/{listing_id}',
      {
        pathParams: validatedParams.path,
body: validatedBody,
config: { ...options?.config, middleware: [...defaultMiddleware, ...(options?.config?.middleware || [])] },
responseSchema: UpdateListingApiV1ListingsListingIdPutResponseSchema
      }
    )
  }

  /**
   * Delete Listing
   * Delete a listing (host or admin only).
   * @param options - Request options
   * @returns Promise<ClientResponse<z.infer<typeof DeleteListingApiV1ListingsListingIdDeleteResponseSchema>>>
   * @example
   * const result = await client.deleteListingApiV1ListingsListingIdDelete({
   *   config: { timeout: 5000 }
   * })
   */
  deleteListingApiV1ListingsListingIdDelete = async (options: {
    params: z.infer<typeof DeleteListingApiV1ListingsListingIdDeleteParamsSchema>
    config?: RequestConfiguration
  }) => {
// Validate and extract parameters
const validatedParams = await DeleteListingApiV1ListingsListingIdDeleteParamsSchema.parseAsync(options.params)

    return this.request<z.infer<typeof DeleteListingApiV1ListingsListingIdDeleteResponseSchema>>(
      'DELETE',
      '/api/v1/listings/{listing_id}',
      {
        pathParams: validatedParams.path,
config: { ...options?.config, middleware: [...defaultMiddleware, ...(options?.config?.middleware || [])] },
responseSchema: DeleteListingApiV1ListingsListingIdDeleteResponseSchema
      }
    )
  }

  /**
   * Create Listing Location
   * Create or update the listing location with PostGIS coordinates.
   * @param options - Request options
   * @returns Promise<ClientResponse<z.infer<typeof CreateListingLocationApiV1ListingsListingIdLocationPostResponseSchema>>>
   * @example
   * const result = await client.createListingLocationApiV1ListingsListingIdLocationPost({
   *   config: { timeout: 5000 }
   * })
   */
  createListingLocationApiV1ListingsListingIdLocationPost = async (options: {
    params: z.infer<typeof CreateListingLocationApiV1ListingsListingIdLocationPostParamsSchema>
    body: z.infer<typeof CreateListingLocationApiV1ListingsListingIdLocationPostRequestSchema>
    config?: RequestConfiguration
  }) => {
    // Validate request body
    const validatedBody = await CreateListingLocationApiV1ListingsListingIdLocationPostRequestSchema.parseAsync(options.body)
// Validate and extract parameters
const validatedParams = await CreateListingLocationApiV1ListingsListingIdLocationPostParamsSchema.parseAsync(options.params)

    return this.request<z.infer<typeof CreateListingLocationApiV1ListingsListingIdLocationPostResponseSchema>>(
      'POST',
      '/api/v1/listings/{listing_id}/location',
      {
        pathParams: validatedParams.path,
body: validatedBody,
config: { ...options?.config, middleware: [...defaultMiddleware, ...(options?.config?.middleware || [])] },
responseSchema: CreateListingLocationApiV1ListingsListingIdLocationPostResponseSchema
      }
    )
  }
}