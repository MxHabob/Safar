import { z } from 'zod'
import { cache } from 'react'
import { BaseApiClient } from './base'
import type { ClientResponse, RequestConfiguration } from './base'
import { defaultMiddleware } from './middleware'
import {
  ListBookingsApiV1BookingsGetResponseSchema,
  ListBookingsApiV1BookingsGetParamsSchema,
  CreateBookingApiV1BookingsPostRequestSchema,
  CreateBookingApiV1BookingsPostResponseSchema,
  GetBookingApiV1BookingsBookingIdGetResponseSchema,
  GetBookingApiV1BookingsBookingIdGetParamsSchema,
  CancelBookingApiV1BookingsBookingIdCancelPostRequestSchema,
  CancelBookingApiV1BookingsBookingIdCancelPostResponseSchema,
  CancelBookingApiV1BookingsBookingIdCancelPostParamsSchema,
  ConfirmBookingApiV1BookingsBookingIdConfirmPostResponseSchema,
  ConfirmBookingApiV1BookingsBookingIdConfirmPostParamsSchema,
  CompleteBookingApiV1BookingsBookingIdCompletePostResponseSchema,
  CompleteBookingApiV1BookingsBookingIdCompletePostParamsSchema,
  ListHostBookingsApiV1BookingsHostListingsGetResponseSchema,
  ListHostBookingsApiV1BookingsHostListingsGetParamsSchema
} from '@/generated/schemas'

export class BookingsApiClient extends BaseApiClient {
  constructor() {
    super()
    
    // Add tag-specific middleware
    this.addMiddleware({
      name: 'bookings-context',
      onRequest: async (config) => {
        return {
          ...config,
          headers: {
            ...config.headers,
            'X-API-Context': 'bookings'
          }
        }
      }
    })
  }

  /**
   * List Bookings
   * List bookings for the current user.
   * @param options - Request options
   * @returns Promise<ClientResponse<z.infer<typeof ListBookingsApiV1BookingsGetResponseSchema>>>
   * @example
   * const result = await client.listBookingsApiV1BookingsGet({
   *   config: { timeout: 5000 }
   * })
   */
  listBookingsApiV1BookingsGet = cache(async (options: {
    params: z.infer<typeof ListBookingsApiV1BookingsGetParamsSchema>
    config?: RequestConfiguration
  }) => {
// Validate and extract parameters
const validatedParams = await ListBookingsApiV1BookingsGetParamsSchema.parseAsync(options.params)

    return this.request<z.infer<typeof ListBookingsApiV1BookingsGetResponseSchema>>(
      'GET',
      '/api/v1/bookings',
      {
queryParams: validatedParams.query,
config: { ...options?.config, middleware: [...defaultMiddleware, ...(options?.config?.middleware || [])] },
responseSchema: ListBookingsApiV1BookingsGetResponseSchema
      }
    )
  })

  /**
   * Create Booking
   * Create a new booking.
   * @param options - Request options
   * @returns Promise<ClientResponse<z.infer<typeof CreateBookingApiV1BookingsPostResponseSchema>>>
   * @example
   * const result = await client.createBookingApiV1BookingsPost({
   *   config: { timeout: 5000 }
   * })
   */
  createBookingApiV1BookingsPost = async (options: {
    body: z.infer<typeof CreateBookingApiV1BookingsPostRequestSchema>
    config?: RequestConfiguration
  }) => {
    // Validate request body
    const validatedBody = await CreateBookingApiV1BookingsPostRequestSchema.parseAsync(options.body)

    return this.request<z.infer<typeof CreateBookingApiV1BookingsPostResponseSchema>>(
      'POST',
      '/api/v1/bookings',
      {
body: validatedBody,
config: { ...options?.config, middleware: [...defaultMiddleware, ...(options?.config?.middleware || [])] },
responseSchema: CreateBookingApiV1BookingsPostResponseSchema
      }
    )
  }

  /**
   * Get Booking
   * Get booking details.
   * @param options - Request options
   * @returns Promise<ClientResponse<z.infer<typeof GetBookingApiV1BookingsBookingIdGetResponseSchema>>>
   * @example
   * const result = await client.getBookingApiV1BookingsBookingIdGet({
   *   config: { timeout: 5000 }
   * })
   */
  getBookingApiV1BookingsBookingIdGet = cache(async (options: {
    params: z.infer<typeof GetBookingApiV1BookingsBookingIdGetParamsSchema>
    config?: RequestConfiguration
  }) => {
// Validate and extract parameters
const validatedParams = await GetBookingApiV1BookingsBookingIdGetParamsSchema.parseAsync(options.params)

    return this.request<z.infer<typeof GetBookingApiV1BookingsBookingIdGetResponseSchema>>(
      'GET',
      '/api/v1/bookings/{booking_id}',
      {
        pathParams: validatedParams.path,
config: { ...options?.config, middleware: [...defaultMiddleware, ...(options?.config?.middleware || [])] },
responseSchema: GetBookingApiV1BookingsBookingIdGetResponseSchema
      }
    )
  })

  /**
   * Cancel Booking
   * Cancel a booking.
   * @param options - Request options
   * @returns Promise<ClientResponse<z.infer<typeof CancelBookingApiV1BookingsBookingIdCancelPostResponseSchema>>>
   * @example
   * const result = await client.cancelBookingApiV1BookingsBookingIdCancelPost({
   *   config: { timeout: 5000 }
   * })
   */
  cancelBookingApiV1BookingsBookingIdCancelPost = async (options: {
    params: z.infer<typeof CancelBookingApiV1BookingsBookingIdCancelPostParamsSchema>
    body: z.infer<typeof CancelBookingApiV1BookingsBookingIdCancelPostRequestSchema>
    config?: RequestConfiguration
  }) => {
    // Validate request body
    const validatedBody = await CancelBookingApiV1BookingsBookingIdCancelPostRequestSchema.parseAsync(options.body)
// Validate and extract parameters
const validatedParams = await CancelBookingApiV1BookingsBookingIdCancelPostParamsSchema.parseAsync(options.params)

    return this.request<z.infer<typeof CancelBookingApiV1BookingsBookingIdCancelPostResponseSchema>>(
      'POST',
      '/api/v1/bookings/{booking_id}/cancel',
      {
        pathParams: validatedParams.path,
body: validatedBody,
config: { ...options?.config, middleware: [...defaultMiddleware, ...(options?.config?.middleware || [])] },
responseSchema: CancelBookingApiV1BookingsBookingIdCancelPostResponseSchema
      }
    )
  }

  /**
   * Confirm Booking
   * Confirm a booking (host only).
   * @param options - Request options
   * @returns Promise<ClientResponse<z.infer<typeof ConfirmBookingApiV1BookingsBookingIdConfirmPostResponseSchema>>>
   * @example
   * const result = await client.confirmBookingApiV1BookingsBookingIdConfirmPost({
   *   config: { timeout: 5000 }
   * })
   */
  confirmBookingApiV1BookingsBookingIdConfirmPost = async (options: {
    params: z.infer<typeof ConfirmBookingApiV1BookingsBookingIdConfirmPostParamsSchema>
    config?: RequestConfiguration
  }) => {
// Validate and extract parameters
const validatedParams = await ConfirmBookingApiV1BookingsBookingIdConfirmPostParamsSchema.parseAsync(options.params)

    return this.request<z.infer<typeof ConfirmBookingApiV1BookingsBookingIdConfirmPostResponseSchema>>(
      'POST',
      '/api/v1/bookings/{booking_id}/confirm',
      {
        pathParams: validatedParams.path,
config: { ...options?.config, middleware: [...defaultMiddleware, ...(options?.config?.middleware || [])] },
responseSchema: ConfirmBookingApiV1BookingsBookingIdConfirmPostResponseSchema
      }
    )
  }

  /**
   * Complete Booking
   * Mark a booking as completed and award loyalty points.

This should be called after guest checkout. Awards loyalty points to the guest.
   * @param options - Request options
   * @returns Promise<ClientResponse<z.infer<typeof CompleteBookingApiV1BookingsBookingIdCompletePostResponseSchema>>>
   * @example
   * const result = await client.completeBookingApiV1BookingsBookingIdCompletePost({
   *   config: { timeout: 5000 }
   * })
   */
  completeBookingApiV1BookingsBookingIdCompletePost = async (options: {
    params: z.infer<typeof CompleteBookingApiV1BookingsBookingIdCompletePostParamsSchema>
    config?: RequestConfiguration
  }) => {
// Validate and extract parameters
const validatedParams = await CompleteBookingApiV1BookingsBookingIdCompletePostParamsSchema.parseAsync(options.params)

    return this.request<z.infer<typeof CompleteBookingApiV1BookingsBookingIdCompletePostResponseSchema>>(
      'POST',
      '/api/v1/bookings/{booking_id}/complete',
      {
        pathParams: validatedParams.path,
config: { ...options?.config, middleware: [...defaultMiddleware, ...(options?.config?.middleware || [])] },
responseSchema: CompleteBookingApiV1BookingsBookingIdCompletePostResponseSchema
      }
    )
  }

  /**
   * List Host Bookings
   * List bookings for the current host.
   * @param options - Request options
   * @returns Promise<ClientResponse<z.infer<typeof ListHostBookingsApiV1BookingsHostListingsGetResponseSchema>>>
   * @example
   * const result = await client.listHostBookingsApiV1BookingsHostListingsGet({
   *   config: { timeout: 5000 }
   * })
   */
  listHostBookingsApiV1BookingsHostListingsGet = cache(async (options: {
    params: z.infer<typeof ListHostBookingsApiV1BookingsHostListingsGetParamsSchema>
    config?: RequestConfiguration
  }) => {
// Validate and extract parameters
const validatedParams = await ListHostBookingsApiV1BookingsHostListingsGetParamsSchema.parseAsync(options.params)

    return this.request<z.infer<typeof ListHostBookingsApiV1BookingsHostListingsGetResponseSchema>>(
      'GET',
      '/api/v1/bookings/host/listings',
      {
queryParams: validatedParams.query,
config: { ...options?.config, middleware: [...defaultMiddleware, ...(options?.config?.middleware || [])] },
responseSchema: ListHostBookingsApiV1BookingsHostListingsGetResponseSchema
      }
    )
  })
}