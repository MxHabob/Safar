import { z } from 'zod'
import { cache } from 'react'
import { BaseApiClient } from './base'
import type { ClientResponse, RequestConfiguration } from './base'
import { defaultMiddleware } from './middleware'
import {
  ListTravelPlansApiV1AiTravelPlannerGetResponseSchema,
  ListTravelPlansApiV1AiTravelPlannerGetParamsSchema,
  CreateTravelPlanApiV1AiTravelPlannerPostRequestSchema,
  CreateTravelPlanApiV1AiTravelPlannerPostResponseSchema,
  GetTravelPlanApiV1AiTravelPlannerPlanIdGetResponseSchema,
  GetTravelPlanApiV1AiTravelPlannerPlanIdGetParamsSchema
} from '@/generated/schemas'

export class AITravelPlannerApiClient extends BaseApiClient {
  constructor() {
    super()
    
    // Add tag-specific middleware
    this.addMiddleware({
      name: 'aITravelPlanner-context',
      onRequest: async (config) => {
        return {
          ...config,
          headers: {
            ...config.headers,
            'X-API-Context': 'aITravelPlanner'
          }
        }
      }
    })
  }

  /**
   * List Travel Plans
   * @param options - Request options
   * @returns Promise<ClientResponse<z.infer<typeof ListTravelPlansApiV1AiTravelPlannerGetResponseSchema>>>
   * @example
   * const result = await client.listTravelPlansApiV1AiTravelPlannerGet({
   *   config: { timeout: 5000 }
   * })
   */
  listTravelPlansApiV1AiTravelPlannerGet = cache(async (options: {
    params: z.infer<typeof ListTravelPlansApiV1AiTravelPlannerGetParamsSchema>
    config?: RequestConfiguration
  }) => {
// Validate and extract parameters
const validatedParams = await ListTravelPlansApiV1AiTravelPlannerGetParamsSchema.parseAsync(options.params)

    return this.request<z.infer<typeof ListTravelPlansApiV1AiTravelPlannerGetResponseSchema>>(
      'GET',
      '/api/v1/ai/travel-planner',
      {
queryParams: validatedParams.query,
config: { ...options?.config, middleware: [...defaultMiddleware, ...(options?.config?.middleware || [])] },
responseSchema: ListTravelPlansApiV1AiTravelPlannerGetResponseSchema
      }
    )
  })

  /**
   * Create Travel Plan
   * Create an AI-powered travel plan from a natural language request.
   * @param options - Request options
   * @returns Promise<ClientResponse<z.infer<typeof CreateTravelPlanApiV1AiTravelPlannerPostResponseSchema>>>
   * @example
   * const result = await client.createTravelPlanApiV1AiTravelPlannerPost({
   *   config: { timeout: 5000 }
   * })
   */
  createTravelPlanApiV1AiTravelPlannerPost = async (options: {
    body: z.infer<typeof CreateTravelPlanApiV1AiTravelPlannerPostRequestSchema>
    config?: RequestConfiguration
  }) => {
    // Validate request body
    const validatedBody = await CreateTravelPlanApiV1AiTravelPlannerPostRequestSchema.parseAsync(options.body)

    return this.request<z.infer<typeof CreateTravelPlanApiV1AiTravelPlannerPostResponseSchema>>(
      'POST',
      '/api/v1/ai/travel-planner',
      {
body: validatedBody,
config: { ...options?.config, middleware: [...defaultMiddleware, ...(options?.config?.middleware || [])] },
responseSchema: CreateTravelPlanApiV1AiTravelPlannerPostResponseSchema
      }
    )
  }

  /**
   * Get Travel Plan
   * Get travel plan
   * @param options - Request options
   * @returns Promise<ClientResponse<z.infer<typeof GetTravelPlanApiV1AiTravelPlannerPlanIdGetResponseSchema>>>
   * @example
   * const result = await client.getTravelPlanApiV1AiTravelPlannerPlanIdGet({
   *   config: { timeout: 5000 }
   * })
   */
  getTravelPlanApiV1AiTravelPlannerPlanIdGet = cache(async (options: {
    params: z.infer<typeof GetTravelPlanApiV1AiTravelPlannerPlanIdGetParamsSchema>
    config?: RequestConfiguration
  }) => {
// Validate and extract parameters
const validatedParams = await GetTravelPlanApiV1AiTravelPlannerPlanIdGetParamsSchema.parseAsync(options.params)

    return this.request<z.infer<typeof GetTravelPlanApiV1AiTravelPlannerPlanIdGetResponseSchema>>(
      'GET',
      '/api/v1/ai/travel-planner/{plan_id}',
      {
        pathParams: validatedParams.path,
config: { ...options?.config, middleware: [...defaultMiddleware, ...(options?.config?.middleware || [])] },
responseSchema: GetTravelPlanApiV1AiTravelPlannerPlanIdGetResponseSchema
      }
    )
  })
}