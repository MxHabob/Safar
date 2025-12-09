import { z } from 'zod'
import { cache } from 'react'
import { BaseApiClient } from './base'
import type { ClientResponse, RequestConfiguration } from './base'
import { defaultMiddleware } from './middleware'
import {
  GetGuidesApiV1TravelGuidesGetResponseSchema,
  GetGuidesApiV1TravelGuidesGetParamsSchema,
  CreateGuideApiV1TravelGuidesPostRequestSchema,
  CreateGuideApiV1TravelGuidesPostResponseSchema,
  PublishGuideApiV1TravelGuidesGuideIdPublishPostResponseSchema,
  PublishGuideApiV1TravelGuidesGuideIdPublishPostParamsSchema,
  GetGuideApiV1TravelGuidesGuideIdGetResponseSchema,
  GetGuideApiV1TravelGuidesGuideIdGetParamsSchema,
  BookmarkGuideApiV1TravelGuidesGuideIdBookmarkPostResponseSchema,
  BookmarkGuideApiV1TravelGuidesGuideIdBookmarkPostParamsSchema,
  LikeGuideApiV1TravelGuidesGuideIdLikePostResponseSchema,
  LikeGuideApiV1TravelGuidesGuideIdLikePostParamsSchema,
  GetStoriesApiV1TravelGuidesStoriesGetResponseSchema,
  GetStoriesApiV1TravelGuidesStoriesGetParamsSchema,
  CreateStoryApiV1TravelGuidesStoriesPostRequestSchema,
  CreateStoryApiV1TravelGuidesStoriesPostResponseSchema,
  PublishStoryApiV1TravelGuidesStoriesStoryIdPublishPostResponseSchema,
  PublishStoryApiV1TravelGuidesStoriesStoryIdPublishPostParamsSchema,
  GetStoryApiV1TravelGuidesStoriesStoryIdGetResponseSchema,
  GetStoryApiV1TravelGuidesStoriesStoryIdGetParamsSchema
} from '@/generated/schemas'

export class TravelGuidesApiClient extends BaseApiClient {
  constructor() {
    super()
    
    // Add tag-specific middleware
    this.addMiddleware({
      name: 'travelGuides-context',
      onRequest: async (config) => {
        return {
          ...config,
          headers: {
            ...config.headers,
            'X-API-Context': 'travelGuides'
          }
        }
      }
    })
  }

  /**
   * Get Guides
   * Get travel guides with filters.
   * @param options - Request options
   * @returns Promise<ClientResponse<z.infer<typeof GetGuidesApiV1TravelGuidesGetResponseSchema>>>
   * @example
   * const result = await client.getGuidesApiV1TravelGuidesGet({
   *   config: { timeout: 5000 }
   * })
   */
  getGuidesApiV1TravelGuidesGet = cache(async (options: {
    params: z.infer<typeof GetGuidesApiV1TravelGuidesGetParamsSchema>
    config?: RequestConfiguration
  }) => {
// Validate and extract parameters
const validatedParams = await GetGuidesApiV1TravelGuidesGetParamsSchema.parseAsync(options.params)

    return this.request<z.infer<typeof GetGuidesApiV1TravelGuidesGetResponseSchema>>(
      'GET',
      '/api/v1/travel-guides',
      {
queryParams: validatedParams.query,
config: { ...options?.config, middleware: [...defaultMiddleware, ...(options?.config?.middleware || [])] },
responseSchema: GetGuidesApiV1TravelGuidesGetResponseSchema
      }
    )
  })

  /**
   * Create Guide
   * Create a new travel guide.
   * @param options - Request options
   * @returns Promise<ClientResponse<z.infer<typeof CreateGuideApiV1TravelGuidesPostResponseSchema>>>
   * @example
   * const result = await client.createGuideApiV1TravelGuidesPost({
   *   config: { timeout: 5000 }
   * })
   */
  createGuideApiV1TravelGuidesPost = async (options: {
    body: z.infer<typeof CreateGuideApiV1TravelGuidesPostRequestSchema>
    config?: RequestConfiguration
  }) => {
    // Validate request body
    const validatedBody = await CreateGuideApiV1TravelGuidesPostRequestSchema.parseAsync(options.body)

    return this.request<z.infer<typeof CreateGuideApiV1TravelGuidesPostResponseSchema>>(
      'POST',
      '/api/v1/travel-guides',
      {
body: validatedBody,
config: { ...options?.config, middleware: [...defaultMiddleware, ...(options?.config?.middleware || [])] },
responseSchema: CreateGuideApiV1TravelGuidesPostResponseSchema
      }
    )
  }

  /**
   * Publish Guide
   * Publish a travel guide.
   * @param options - Request options
   * @returns Promise<ClientResponse<z.infer<typeof PublishGuideApiV1TravelGuidesGuideIdPublishPostResponseSchema>>>
   * @example
   * const result = await client.publishGuideApiV1TravelGuidesGuideIdPublishPost({
   *   config: { timeout: 5000 }
   * })
   */
  publishGuideApiV1TravelGuidesGuideIdPublishPost = async (options: {
    params: z.infer<typeof PublishGuideApiV1TravelGuidesGuideIdPublishPostParamsSchema>
    config?: RequestConfiguration
  }) => {
// Validate and extract parameters
const validatedParams = await PublishGuideApiV1TravelGuidesGuideIdPublishPostParamsSchema.parseAsync(options.params)

    return this.request<z.infer<typeof PublishGuideApiV1TravelGuidesGuideIdPublishPostResponseSchema>>(
      'POST',
      '/api/v1/travel-guides/{guide_id}/publish',
      {
        pathParams: validatedParams.path,
config: { ...options?.config, middleware: [...defaultMiddleware, ...(options?.config?.middleware || [])] },
responseSchema: PublishGuideApiV1TravelGuidesGuideIdPublishPostResponseSchema
      }
    )
  }

  /**
   * Get Guide
   * Get a specific travel guide.
   * @param options - Request options
   * @returns Promise<ClientResponse<z.infer<typeof GetGuideApiV1TravelGuidesGuideIdGetResponseSchema>>>
   * @example
   * const result = await client.getGuideApiV1TravelGuidesGuideIdGet({
   *   config: { timeout: 5000 }
   * })
   */
  getGuideApiV1TravelGuidesGuideIdGet = cache(async (options: {
    params: z.infer<typeof GetGuideApiV1TravelGuidesGuideIdGetParamsSchema>
    config?: RequestConfiguration
  }) => {
// Validate and extract parameters
const validatedParams = await GetGuideApiV1TravelGuidesGuideIdGetParamsSchema.parseAsync(options.params)

    return this.request<z.infer<typeof GetGuideApiV1TravelGuidesGuideIdGetResponseSchema>>(
      'GET',
      '/api/v1/travel-guides/{guide_id}',
      {
        pathParams: validatedParams.path,
config: { ...options?.config, middleware: [...defaultMiddleware, ...(options?.config?.middleware || [])] },
responseSchema: GetGuideApiV1TravelGuidesGuideIdGetResponseSchema
      }
    )
  })

  /**
   * Bookmark Guide
   * Bookmark a travel guide.
   * @param options - Request options
   * @returns Promise<ClientResponse<z.infer<typeof BookmarkGuideApiV1TravelGuidesGuideIdBookmarkPostResponseSchema>>>
   * @example
   * const result = await client.bookmarkGuideApiV1TravelGuidesGuideIdBookmarkPost({
   *   config: { timeout: 5000 }
   * })
   */
  bookmarkGuideApiV1TravelGuidesGuideIdBookmarkPost = async (options: {
    params: z.infer<typeof BookmarkGuideApiV1TravelGuidesGuideIdBookmarkPostParamsSchema>
    config?: RequestConfiguration
  }) => {
// Validate and extract parameters
const validatedParams = await BookmarkGuideApiV1TravelGuidesGuideIdBookmarkPostParamsSchema.parseAsync(options.params)

    return this.request<z.infer<typeof BookmarkGuideApiV1TravelGuidesGuideIdBookmarkPostResponseSchema>>(
      'POST',
      '/api/v1/travel-guides/{guide_id}/bookmark',
      {
        pathParams: validatedParams.path,
config: { ...options?.config, middleware: [...defaultMiddleware, ...(options?.config?.middleware || [])] },
responseSchema: BookmarkGuideApiV1TravelGuidesGuideIdBookmarkPostResponseSchema
      }
    )
  }

  /**
   * Like Guide
   * Like a travel guide.
   * @param options - Request options
   * @returns Promise<ClientResponse<z.infer<typeof LikeGuideApiV1TravelGuidesGuideIdLikePostResponseSchema>>>
   * @example
   * const result = await client.likeGuideApiV1TravelGuidesGuideIdLikePost({
   *   config: { timeout: 5000 }
   * })
   */
  likeGuideApiV1TravelGuidesGuideIdLikePost = async (options: {
    params: z.infer<typeof LikeGuideApiV1TravelGuidesGuideIdLikePostParamsSchema>
    config?: RequestConfiguration
  }) => {
// Validate and extract parameters
const validatedParams = await LikeGuideApiV1TravelGuidesGuideIdLikePostParamsSchema.parseAsync(options.params)

    return this.request<z.infer<typeof LikeGuideApiV1TravelGuidesGuideIdLikePostResponseSchema>>(
      'POST',
      '/api/v1/travel-guides/{guide_id}/like',
      {
        pathParams: validatedParams.path,
config: { ...options?.config, middleware: [...defaultMiddleware, ...(options?.config?.middleware || [])] },
responseSchema: LikeGuideApiV1TravelGuidesGuideIdLikePostResponseSchema
      }
    )
  }

  /**
   * Get Stories
   * Get user stories with filters.
   * @param options - Request options
   * @returns Promise<ClientResponse<z.infer<typeof GetStoriesApiV1TravelGuidesStoriesGetResponseSchema>>>
   * @example
   * const result = await client.getStoriesApiV1TravelGuidesStoriesGet({
   *   config: { timeout: 5000 }
   * })
   */
  getStoriesApiV1TravelGuidesStoriesGet = cache(async (options: {
    params: z.infer<typeof GetStoriesApiV1TravelGuidesStoriesGetParamsSchema>
    config?: RequestConfiguration
  }) => {
// Validate and extract parameters
const validatedParams = await GetStoriesApiV1TravelGuidesStoriesGetParamsSchema.parseAsync(options.params)

    return this.request<z.infer<typeof GetStoriesApiV1TravelGuidesStoriesGetResponseSchema>>(
      'GET',
      '/api/v1/travel-guides/stories',
      {
queryParams: validatedParams.query,
config: { ...options?.config, middleware: [...defaultMiddleware, ...(options?.config?.middleware || [])] },
responseSchema: GetStoriesApiV1TravelGuidesStoriesGetResponseSchema
      }
    )
  })

  /**
   * Create Story
   * Create a new user story.
   * @param options - Request options
   * @returns Promise<ClientResponse<z.infer<typeof CreateStoryApiV1TravelGuidesStoriesPostResponseSchema>>>
   * @example
   * const result = await client.createStoryApiV1TravelGuidesStoriesPost({
   *   config: { timeout: 5000 }
   * })
   */
  createStoryApiV1TravelGuidesStoriesPost = async (options: {
    body: z.infer<typeof CreateStoryApiV1TravelGuidesStoriesPostRequestSchema>
    config?: RequestConfiguration
  }) => {
    // Validate request body
    const validatedBody = await CreateStoryApiV1TravelGuidesStoriesPostRequestSchema.parseAsync(options.body)

    return this.request<z.infer<typeof CreateStoryApiV1TravelGuidesStoriesPostResponseSchema>>(
      'POST',
      '/api/v1/travel-guides/stories',
      {
body: validatedBody,
config: { ...options?.config, middleware: [...defaultMiddleware, ...(options?.config?.middleware || [])] },
responseSchema: CreateStoryApiV1TravelGuidesStoriesPostResponseSchema
      }
    )
  }

  /**
   * Publish Story
   * Publish a user story.
   * @param options - Request options
   * @returns Promise<ClientResponse<z.infer<typeof PublishStoryApiV1TravelGuidesStoriesStoryIdPublishPostResponseSchema>>>
   * @example
   * const result = await client.publishStoryApiV1TravelGuidesStoriesStoryIdPublishPost({
   *   config: { timeout: 5000 }
   * })
   */
  publishStoryApiV1TravelGuidesStoriesStoryIdPublishPost = async (options: {
    params: z.infer<typeof PublishStoryApiV1TravelGuidesStoriesStoryIdPublishPostParamsSchema>
    config?: RequestConfiguration
  }) => {
// Validate and extract parameters
const validatedParams = await PublishStoryApiV1TravelGuidesStoriesStoryIdPublishPostParamsSchema.parseAsync(options.params)

    return this.request<z.infer<typeof PublishStoryApiV1TravelGuidesStoriesStoryIdPublishPostResponseSchema>>(
      'POST',
      '/api/v1/travel-guides/stories/{story_id}/publish',
      {
        pathParams: validatedParams.path,
config: { ...options?.config, middleware: [...defaultMiddleware, ...(options?.config?.middleware || [])] },
responseSchema: PublishStoryApiV1TravelGuidesStoriesStoryIdPublishPostResponseSchema
      }
    )
  }

  /**
   * Get Story
   * Get a specific user story.
   * @param options - Request options
   * @returns Promise<ClientResponse<z.infer<typeof GetStoryApiV1TravelGuidesStoriesStoryIdGetResponseSchema>>>
   * @example
   * const result = await client.getStoryApiV1TravelGuidesStoriesStoryIdGet({
   *   config: { timeout: 5000 }
   * })
   */
  getStoryApiV1TravelGuidesStoriesStoryIdGet = cache(async (options: {
    params: z.infer<typeof GetStoryApiV1TravelGuidesStoriesStoryIdGetParamsSchema>
    config?: RequestConfiguration
  }) => {
// Validate and extract parameters
const validatedParams = await GetStoryApiV1TravelGuidesStoriesStoryIdGetParamsSchema.parseAsync(options.params)

    return this.request<z.infer<typeof GetStoryApiV1TravelGuidesStoriesStoryIdGetResponseSchema>>(
      'GET',
      '/api/v1/travel-guides/stories/{story_id}',
      {
        pathParams: validatedParams.path,
config: { ...options?.config, middleware: [...defaultMiddleware, ...(options?.config?.middleware || [])] },
responseSchema: GetStoryApiV1TravelGuidesStoriesStoryIdGetResponseSchema
      }
    )
  })
}