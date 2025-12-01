import { z } from 'zod'
import { cache } from 'react'
import { BaseApiClient } from './base'
import { defaultMiddleware } from '@/generated/client/middleware'
import type { ClientResponse, RequestConfiguration } from './base'
import {
  CreatePaymentIntentApiV1PaymentsIntentPostRequestSchema,
  CreatePaymentIntentApiV1PaymentsIntentPostResponseSchema,
  ProcessPaymentApiV1PaymentsProcessPostRequestSchema,
  ProcessPaymentApiV1PaymentsProcessPostResponseSchema
} from '@/generated/schemas'

export class PaymentsApiClient extends BaseApiClient {
  constructor() {
    super()
    
    // Add tag-specific middleware
    this.addMiddleware({
      name: 'payments-context',
      onRequest: async (config) => {
        return {
          ...config,
          headers: {
            ...config.headers,
            'X-API-Context': 'payments'
          }
        }
      }
    })
  }

  /**
   * Create Payment Intent
   * Create a payment intent for a booking.
   * @param options - Request options
   * @returns Promise<ClientResponse<z.infer<typeof CreatePaymentIntentApiV1PaymentsIntentPostResponseSchema>>>
   * @example
   * const result = await client.createPaymentIntentApiV1PaymentsIntentPost({
   *   config: { timeout: 5000 }
   * })
   */
  createPaymentIntentApiV1PaymentsIntentPost = async (options: {
    body: z.infer<typeof CreatePaymentIntentApiV1PaymentsIntentPostRequestSchema>
    config?: RequestConfiguration
  }) => {
    // Validate request body
    const validatedBody = await CreatePaymentIntentApiV1PaymentsIntentPostRequestSchema.parseAsync(options.body)

    return this.request<z.infer<typeof CreatePaymentIntentApiV1PaymentsIntentPostResponseSchema>>(
      'POST',
      '/api/v1/payments/intent',
      {
body: validatedBody,
config: { ...options?.config, middleware: [...defaultMiddleware, ...(options?.config?.middleware || [])] },
responseSchema: CreatePaymentIntentApiV1PaymentsIntentPostResponseSchema
      }
    )
  }

  /**
   * Process Payment
   * Process a payment.

CRITICAL: This endpoint is idempotent. Processing the same ``payment_intent_id``
multiple times will return the existing payment record.
   * @param options - Request options
   * @returns Promise<ClientResponse<z.infer<typeof ProcessPaymentApiV1PaymentsProcessPostResponseSchema>>>
   * @example
   * const result = await client.processPaymentApiV1PaymentsProcessPost({
   *   config: { timeout: 5000 }
   * })
   */
  processPaymentApiV1PaymentsProcessPost = async (options: {
    body: z.infer<typeof ProcessPaymentApiV1PaymentsProcessPostRequestSchema>
    config?: RequestConfiguration
  }) => {
    // Validate request body
    const validatedBody = await ProcessPaymentApiV1PaymentsProcessPostRequestSchema.parseAsync(options.body)

    return this.request<z.infer<typeof ProcessPaymentApiV1PaymentsProcessPostResponseSchema>>(
      'POST',
      '/api/v1/payments/process',
      {
body: validatedBody,
config: { ...options?.config, middleware: [...defaultMiddleware, ...(options?.config?.middleware || [])] },
responseSchema: ProcessPaymentApiV1PaymentsProcessPostResponseSchema
      }
    )
  }
}