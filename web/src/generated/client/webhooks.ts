import { z } from 'zod'
import { cache } from 'react'
import { BaseApiClient } from './base'
import { defaultMiddleware } from './middleware'
import type { ClientResponse, RequestConfiguration } from './base'
import {
  StripeWebhookApiV1WebhooksStripePostResponseSchema,
  StripeWebhookApiV1WebhooksStripePostParamsSchema
} from '@/generated/schemas'

export class WebhooksApiClient extends BaseApiClient {
  constructor() {
    super()
    
    // Add tag-specific middleware
    this.addMiddleware({
      name: 'webhooks-context',
      onRequest: async (config) => {
        return {
          ...config,
          headers: {
            ...config.headers,
            'X-API-Context': 'webhooks'
          }
        }
      }
    })
  }

  /**
   * Stripe Webhook
   * Stripe webhook endpoint with signature verification

CRITICAL: Verifies webhook signature to prevent spoofing attacks.
Only processes webhooks that are cryptographically verified.
   * @param options - Request options
   * @returns Promise<ClientResponse<z.infer<typeof StripeWebhookApiV1WebhooksStripePostResponseSchema>>>
   * @example
   * const result = await client.stripeWebhookApiV1WebhooksStripePost({
   *   config: { timeout: 5000 }
   * })
   */
  stripeWebhookApiV1WebhooksStripePost = async (options: {
    params: z.infer<typeof StripeWebhookApiV1WebhooksStripePostParamsSchema>
    config?: RequestConfiguration
  }) => {
// Validate and extract parameters
const validatedParams = await StripeWebhookApiV1WebhooksStripePostParamsSchema.parseAsync(options.params)

    // Convert headers to plain objects
    const rawConfigHeaders = options.config?.headers
    const configHeaders: Record<string, string> = rawConfigHeaders
      ? (rawConfigHeaders instanceof Headers
          ? Object.fromEntries(rawConfigHeaders.entries())
          : Array.isArray(rawConfigHeaders)
          ? Object.fromEntries(rawConfigHeaders)
          : rawConfigHeaders)
      : {}
    const rawValidatedHeaders = validatedParams.headers
    const validatedHeaders: Record<string, string> = rawValidatedHeaders
      ? (rawValidatedHeaders instanceof Headers
          ? Object.fromEntries(rawValidatedHeaders.entries())
          : Array.isArray(rawValidatedHeaders)
          ? Object.fromEntries(rawValidatedHeaders)
          : rawValidatedHeaders)
      : {}

    return this.request<z.infer<typeof StripeWebhookApiV1WebhooksStripePostResponseSchema>>(
      'POST',
      '/api/v1/webhooks/stripe',
      {
headers: { ...configHeaders, ...validatedHeaders },
config: { ...options?.config, middleware: [...defaultMiddleware, ...(options?.config?.middleware || [])] },
responseSchema: StripeWebhookApiV1WebhooksStripePostResponseSchema
      }
    )
  }
}