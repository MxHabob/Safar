import { z } from 'zod'
import { cache } from 'react'
import { BaseApiClient } from './base'
import type { ClientResponse, RequestConfiguration } from './base'
import {
  SendPushNotificationApiV1NotificationsPushSendPostRequestSchema,
  SendPushNotificationApiV1NotificationsPushSendPostResponseSchema,
  SendBulkPushNotificationsApiV1NotificationsPushBulkPostRequestSchema,
  SendBulkPushNotificationsApiV1NotificationsPushBulkPostResponseSchema
} from '@/generated/schemas'

export class NotificationsApiClient extends BaseApiClient {
  constructor() {
    super()
    
    // Add tag-specific middleware
    this.addMiddleware({
      name: 'notifications-context',
      onRequest: async (config) => {
        return {
          ...config,
          headers: {
            ...config.headers,
            'X-API-Context': 'notifications'
          }
        }
      }
    })
  }

  /**
   * Send Push Notification
   * Send a push notification to user's device(s).
   * @param options - Request options
   * @returns Promise<ClientResponse<z.infer<typeof SendPushNotificationApiV1NotificationsPushSendPostResponseSchema>>>
   * @example
   * const result = await client.sendPushNotificationApiV1NotificationsPushSendPost({
   *   config: { timeout: 5000 }
   * })
   */
  sendPushNotificationApiV1NotificationsPushSendPost = async (options: {
    body: z.infer<typeof SendPushNotificationApiV1NotificationsPushSendPostRequestSchema>
    config?: RequestConfiguration
  }) => {
    // Validate request body
    const validatedBody = await SendPushNotificationApiV1NotificationsPushSendPostRequestSchema.parseAsync(options.body)

    return this.request<z.infer<typeof SendPushNotificationApiV1NotificationsPushSendPostResponseSchema>>(
      'POST',
      '/api/v1/notifications/push/send',
      {
body: validatedBody,
config: { ...options?.config, middleware: [...defaultMiddleware, ...(options?.config?.middleware || [])] },
responseSchema: SendPushNotificationApiV1NotificationsPushSendPostResponseSchema
      }
    )
  }

  /**
   * Send Bulk Push Notifications
   * Send push notifications to multiple devices.
Requires authentication.
   * @param options - Request options
   * @returns Promise<ClientResponse<z.infer<typeof SendBulkPushNotificationsApiV1NotificationsPushBulkPostResponseSchema>>>
   * @example
   * const result = await client.sendBulkPushNotificationsApiV1NotificationsPushBulkPost({
   *   config: { timeout: 5000 }
   * })
   */
  sendBulkPushNotificationsApiV1NotificationsPushBulkPost = async (options: {
    body: z.infer<typeof SendBulkPushNotificationsApiV1NotificationsPushBulkPostRequestSchema>
    config?: RequestConfiguration
  }) => {
    // Validate request body
    const validatedBody = await SendBulkPushNotificationsApiV1NotificationsPushBulkPostRequestSchema.parseAsync(options.body)

    return this.request<z.infer<typeof SendBulkPushNotificationsApiV1NotificationsPushBulkPostResponseSchema>>(
      'POST',
      '/api/v1/notifications/push/bulk',
      {
body: validatedBody,
config: { ...options?.config, middleware: [...defaultMiddleware, ...(options?.config?.middleware || [])] },
responseSchema: SendBulkPushNotificationsApiV1NotificationsPushBulkPostResponseSchema
      }
    )
  }
}