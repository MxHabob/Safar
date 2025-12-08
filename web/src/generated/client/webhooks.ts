import { z } from 'zod'
import { defaultMiddleware } from '@/generated/client/middleware'
import { BaseApiClient } from './base'
import type { RequestConfiguration } from './base'
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

    const mergedHeaders: Record<string, string> = {
      ...(options.config?.headers as Record<string, string> | undefined),
      ...(validatedParams.headers || {}),
    }

    return this.request<z.infer<typeof StripeWebhookApiV1WebhooksStripePostResponseSchema>>(
      'POST',
      '/api/v1/webhooks/stripe',
      {
headers: mergedHeaders,
config: { ...options?.config, middleware: [...defaultMiddleware, ...(options?.config?.middleware || [])] },
responseSchema: StripeWebhookApiV1WebhooksStripePostResponseSchema
      }
    )
  }
}