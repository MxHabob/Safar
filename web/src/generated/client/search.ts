import { z } from 'zod'
import { cache } from 'react'
import { BaseApiClient } from './base'
import type { ClientResponse, RequestConfiguration } from './base'
import { defaultMiddleware } from './middleware'
import {
  SearchListingsApiV1SearchListingsGetResponseSchema,
  SearchListingsApiV1SearchListingsGetParamsSchema,
  GetSearchSuggestionsApiV1SearchSuggestionsGetResponseSchema,
  GetSearchSuggestionsApiV1SearchSuggestionsGetParamsSchema
} from '@/generated/schemas'

export class SearchApiClient extends BaseApiClient {
  constructor() {
    super()
    
    // Add tag-specific middleware
    this.addMiddleware({
      name: 'search-context',
      onRequest: async (config) => {
        return {
          ...config,
          headers: {
            ...config.headers,
            'X-API-Context': 'search'
          }
        }
      }
    })
  }

  /**
   * Search Listings
   * Search listings with text, filter, and location parameters.
   * @param options - Request options
   * @returns Promise<ClientResponse<z.infer<typeof SearchListingsApiV1SearchListingsGetResponseSchema>>>
   * @example
   * const result = await client.searchListingsApiV1SearchListingsGet({
   *   config: { timeout: 5000 }
   * })
   */
  searchListingsApiV1SearchListingsGet = cache(async (options: {
    params: z.infer<typeof SearchListingsApiV1SearchListingsGetParamsSchema>
    config?: RequestConfiguration
  }) => {
// Validate and extract parameters
const validatedParams = await SearchListingsApiV1SearchListingsGetParamsSchema.parseAsync(options.params)

    return this.request<z.infer<typeof SearchListingsApiV1SearchListingsGetResponseSchema>>(
      'GET',
      '/api/v1/search/listings',
      {
queryParams: validatedParams.query,
config: { ...options?.config, middleware: [...defaultMiddleware, ...(options?.config?.middleware || [])] },
responseSchema: SearchListingsApiV1SearchListingsGetResponseSchema
      }
    )
  })

  /**
   * Get Search Suggestions
   * Get search suggestions for the given query string.
   * @param options - Request options
   * @returns Promise<ClientResponse<z.infer<typeof GetSearchSuggestionsApiV1SearchSuggestionsGetResponseSchema>>>
   * @example
   * const result = await client.getSearchSuggestionsApiV1SearchSuggestionsGet({
   *   config: { timeout: 5000 }
   * })
   */
  getSearchSuggestionsApiV1SearchSuggestionsGet = cache(async (options: {
    params: z.infer<typeof GetSearchSuggestionsApiV1SearchSuggestionsGetParamsSchema>
    config?: RequestConfiguration
  }) => {
// Validate and extract parameters
const validatedParams = await GetSearchSuggestionsApiV1SearchSuggestionsGetParamsSchema.parseAsync(options.params)

    return this.request<z.infer<typeof GetSearchSuggestionsApiV1SearchSuggestionsGetResponseSchema>>(
      'GET',
      '/api/v1/search/suggestions',
      {
queryParams: validatedParams.query,
config: { ...options?.config, middleware: [...defaultMiddleware, ...(options?.config?.middleware || [])] },
responseSchema: GetSearchSuggestionsApiV1SearchSuggestionsGetResponseSchema
      }
    )
  })
}