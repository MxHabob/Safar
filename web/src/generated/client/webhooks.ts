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

    // Extract headers safely, converting Headers object to plain object if needed
    const configHeaders = options.config?.headers
    const headers: Record<string, string> = {}
    
    // Convert config headers to plain object
    if (configHeaders) {
      if (configHeaders instanceof Headers) {
        configHeaders.forEach((value, key) => {
          headers[key] = value
        })
      } else if (typeof configHeaders === 'object' && !Array.isArray(configHeaders)) {
        Object.entries(configHeaders).forEach(([key, value]) => {
          if (typeof value === 'string') {
            headers[key] = value
          }
        })
      }
    }
    
    // Add validated headers if they exist
    const headerParams = validatedParams.headers
    if (headerParams && typeof headerParams === 'object' && !Array.isArray(headerParams) && 'stripe_signature' in headerParams) {
      if (typeof headerParams.stripe_signature === 'string') {
        headers['stripe-signature'] = headerParams.stripe_signature
      }
    }

    return this.request<z.infer<typeof StripeWebhookApiV1WebhooksStripePostResponseSchema>>(
      'POST',
      '/api/v1/webhooks/stripe',
      {
        headers,
        config: { ...options?.config, middleware: [...defaultMiddleware, ...(options?.config?.middleware || [])] },
        responseSchema: StripeWebhookApiV1WebhooksStripePostResponseSchema
      }
    )
  }
}