import { z } from 'zod'
import { cache } from 'react'
import { BaseApiClient } from './base'
import type { ClientResponse, RequestConfiguration } from './base'
import { defaultMiddleware } from './middleware'
import {
  CreateMessageApiV1MessagesPostRequestSchema,
  CreateMessageApiV1MessagesPostResponseSchema,
  GetConversationsApiV1MessagesConversationsGetResponseSchema,
  GetConversationsApiV1MessagesConversationsGetParamsSchema,
  CreateConversationApiV1MessagesConversationsPostRequestSchema,
  CreateConversationApiV1MessagesConversationsPostResponseSchema,
  GetConversationApiV1MessagesConversationsConversationIdGetResponseSchema,
  GetConversationApiV1MessagesConversationsConversationIdGetParamsSchema,
  GetConversationMessagesApiV1MessagesConversationsConversationIdMessagesGetResponseSchema,
  GetConversationMessagesApiV1MessagesConversationsConversationIdMessagesGetParamsSchema,
  MarkConversationReadApiV1MessagesConversationsConversationIdReadPostResponseSchema,
  MarkConversationReadApiV1MessagesConversationsConversationIdReadPostParamsSchema,
  MarkMessageReadApiV1MessagesMessageIdReadPostResponseSchema,
  MarkMessageReadApiV1MessagesMessageIdReadPostParamsSchema
} from '@/generated/schemas'

export class MessagesApiClient extends BaseApiClient {
  constructor() {
    super()
    
    // Add tag-specific middleware
    this.addMiddleware({
      name: 'messages-context',
      onRequest: async (config) => {
        return {
          ...config,
          headers: {
            ...config.headers,
            'X-API-Context': 'messages'
          }
        }
      }
    })
  }

  /**
   * Create Message
   * Create a new message.
   * @param options - Request options
   * @returns Promise<ClientResponse<z.infer<typeof CreateMessageApiV1MessagesPostResponseSchema>>>
   * @example
   * const result = await client.createMessageApiV1MessagesPost({
   *   config: { timeout: 5000 }
   * })
   */
  createMessageApiV1MessagesPost = async (options: {
    body: z.infer<typeof CreateMessageApiV1MessagesPostRequestSchema>
    config?: RequestConfiguration
  }) => {
    // Validate request body
    const validatedBody = await CreateMessageApiV1MessagesPostRequestSchema.parseAsync(options.body)

    return this.request<z.infer<typeof CreateMessageApiV1MessagesPostResponseSchema>>(
      'POST',
      '/api/v1/messages',
      {
body: validatedBody,
config: { ...options?.config, middleware: [...defaultMiddleware, ...(options?.config?.middleware || [])] },
responseSchema: CreateMessageApiV1MessagesPostResponseSchema
      }
    )
  }

  /**
   * Get Conversations
   * Get all conversations for the current user with pagination.
   * @param options - Request options
   * @returns Promise<ClientResponse<z.infer<typeof GetConversationsApiV1MessagesConversationsGetResponseSchema>>>
   * @example
   * const result = await client.getConversationsApiV1MessagesConversationsGet({
   *   config: { timeout: 5000 }
   * })
   */
  getConversationsApiV1MessagesConversationsGet = cache(async (options: {
    params: z.infer<typeof GetConversationsApiV1MessagesConversationsGetParamsSchema>
    config?: RequestConfiguration
  }) => {
// Validate and extract parameters
const validatedParams = await GetConversationsApiV1MessagesConversationsGetParamsSchema.parseAsync(options.params)

    return this.request<z.infer<typeof GetConversationsApiV1MessagesConversationsGetResponseSchema>>(
      'GET',
      '/api/v1/messages/conversations',
      {
queryParams: validatedParams.query,
config: { ...options?.config, middleware: [...defaultMiddleware, ...(options?.config?.middleware || [])] },
responseSchema: GetConversationsApiV1MessagesConversationsGetResponseSchema
      }
    )
  })

  /**
   * Create Conversation
   * Create a new conversation or return an existing one for the participants.
   * @param options - Request options
   * @returns Promise<ClientResponse<z.infer<typeof CreateConversationApiV1MessagesConversationsPostResponseSchema>>>
   * @example
   * const result = await client.createConversationApiV1MessagesConversationsPost({
   *   config: { timeout: 5000 }
   * })
   */
  createConversationApiV1MessagesConversationsPost = async (options: {
    body: z.infer<typeof CreateConversationApiV1MessagesConversationsPostRequestSchema>
    config?: RequestConfiguration
  }) => {
    // Validate request body
    const validatedBody = await CreateConversationApiV1MessagesConversationsPostRequestSchema.parseAsync(options.body)

    return this.request<z.infer<typeof CreateConversationApiV1MessagesConversationsPostResponseSchema>>(
      'POST',
      '/api/v1/messages/conversations',
      {
body: validatedBody,
config: { ...options?.config, middleware: [...defaultMiddleware, ...(options?.config?.middleware || [])] },
responseSchema: CreateConversationApiV1MessagesConversationsPostResponseSchema
      }
    )
  }

  /**
   * Get Conversation
   * Get a single conversation by ID for the current user.
   * @param options - Request options
   * @returns Promise<ClientResponse<z.infer<typeof GetConversationApiV1MessagesConversationsConversationIdGetResponseSchema>>>
   * @example
   * const result = await client.getConversationApiV1MessagesConversationsConversationIdGet({
   *   config: { timeout: 5000 }
   * })
   */
  getConversationApiV1MessagesConversationsConversationIdGet = cache(async (options: {
    params: z.infer<typeof GetConversationApiV1MessagesConversationsConversationIdGetParamsSchema>
    config?: RequestConfiguration
  }) => {
// Validate and extract parameters
const validatedParams = await GetConversationApiV1MessagesConversationsConversationIdGetParamsSchema.parseAsync(options.params)

    return this.request<z.infer<typeof GetConversationApiV1MessagesConversationsConversationIdGetResponseSchema>>(
      'GET',
      '/api/v1/messages/conversations/{conversation_id}',
      {
        pathParams: validatedParams.path,
queryParams: validatedParams.query,
config: { ...options?.config, middleware: [...defaultMiddleware, ...(options?.config?.middleware || [])] },
responseSchema: GetConversationApiV1MessagesConversationsConversationIdGetResponseSchema
      }
    )
  })

  /**
   * Get Conversation Messages
   * Get paginated messages for a conversation.
   * @param options - Request options
   * @returns Promise<ClientResponse<z.infer<typeof GetConversationMessagesApiV1MessagesConversationsConversationIdMessagesGetResponseSchema>>>
   * @example
   * const result = await client.getConversationMessagesApiV1MessagesConversationsConversationIdMessagesGet({
   *   config: { timeout: 5000 }
   * })
   */
  getConversationMessagesApiV1MessagesConversationsConversationIdMessagesGet = cache(async (options: {
    params: z.infer<typeof GetConversationMessagesApiV1MessagesConversationsConversationIdMessagesGetParamsSchema>
    config?: RequestConfiguration
  }) => {
// Validate and extract parameters
const validatedParams = await GetConversationMessagesApiV1MessagesConversationsConversationIdMessagesGetParamsSchema.parseAsync(options.params)

    return this.request<z.infer<typeof GetConversationMessagesApiV1MessagesConversationsConversationIdMessagesGetResponseSchema>>(
      'GET',
      '/api/v1/messages/conversations/{conversation_id}/messages',
      {
        pathParams: validatedParams.path,
queryParams: validatedParams.query,
config: { ...options?.config, middleware: [...defaultMiddleware, ...(options?.config?.middleware || [])] },
responseSchema: GetConversationMessagesApiV1MessagesConversationsConversationIdMessagesGetResponseSchema
      }
    )
  })

  /**
   * Mark Conversation Read
   * Mark all messages in a conversation as read for the current user.
   * @param options - Request options
   * @returns Promise<ClientResponse<z.infer<typeof MarkConversationReadApiV1MessagesConversationsConversationIdReadPostResponseSchema>>>
   * @example
   * const result = await client.markConversationReadApiV1MessagesConversationsConversationIdReadPost({
   *   config: { timeout: 5000 }
   * })
   */
  markConversationReadApiV1MessagesConversationsConversationIdReadPost = async (options: {
    params: z.infer<typeof MarkConversationReadApiV1MessagesConversationsConversationIdReadPostParamsSchema>
    config?: RequestConfiguration
  }) => {
// Validate and extract parameters
const validatedParams = await MarkConversationReadApiV1MessagesConversationsConversationIdReadPostParamsSchema.parseAsync(options.params)

    return this.request<z.infer<typeof MarkConversationReadApiV1MessagesConversationsConversationIdReadPostResponseSchema>>(
      'POST',
      '/api/v1/messages/conversations/{conversation_id}/read',
      {
        pathParams: validatedParams.path,
config: { ...options?.config, middleware: [...defaultMiddleware, ...(options?.config?.middleware || [])] },
responseSchema: MarkConversationReadApiV1MessagesConversationsConversationIdReadPostResponseSchema
      }
    )
  }

  /**
   * Mark Message Read
   * Mark a single message as read for the current user.
   * @param options - Request options
   * @returns Promise<ClientResponse<z.infer<typeof MarkMessageReadApiV1MessagesMessageIdReadPostResponseSchema>>>
   * @example
   * const result = await client.markMessageReadApiV1MessagesMessageIdReadPost({
   *   config: { timeout: 5000 }
   * })
   */
  markMessageReadApiV1MessagesMessageIdReadPost = async (options: {
    params: z.infer<typeof MarkMessageReadApiV1MessagesMessageIdReadPostParamsSchema>
    config?: RequestConfiguration
  }) => {
// Validate and extract parameters
const validatedParams = await MarkMessageReadApiV1MessagesMessageIdReadPostParamsSchema.parseAsync(options.params)

    return this.request<z.infer<typeof MarkMessageReadApiV1MessagesMessageIdReadPostResponseSchema>>(
      'POST',
      '/api/v1/messages/{message_id}/read',
      {
        pathParams: validatedParams.path,
config: { ...options?.config, middleware: [...defaultMiddleware, ...(options?.config?.middleware || [])] },
responseSchema: MarkMessageReadApiV1MessagesMessageIdReadPostResponseSchema
      }
    )
  }
}