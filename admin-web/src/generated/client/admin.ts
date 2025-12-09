import { z } from 'zod'
import { cache } from 'react'
import { BaseApiClient } from './base'
import type { ClientResponse, RequestConfiguration } from './base'
import { defaultMiddleware } from './middleware'
import {
  ListUsersApiV1AdminUsersGetResponseSchema,
  ListUsersApiV1AdminUsersGetParamsSchema,
  GetUserApiV1AdminUsersUserIdGetResponseSchema,
  GetUserApiV1AdminUsersUserIdGetParamsSchema,
  UpdateUserApiV1AdminUsersUserIdPutRequestSchema,
  UpdateUserApiV1AdminUsersUserIdPutResponseSchema,
  UpdateUserApiV1AdminUsersUserIdPutParamsSchema,
  SuspendUserApiV1AdminUsersUserIdSuspendPostResponseSchema,
  SuspendUserApiV1AdminUsersUserIdSuspendPostParamsSchema,
  ActivateUserApiV1AdminUsersUserIdActivatePostResponseSchema,
  ActivateUserApiV1AdminUsersUserIdActivatePostParamsSchema,
  GetUserStatsApiV1AdminUsersStatsGetResponseSchema,
  GetDashboardMetricsApiV1AdminDashboardMetricsGetResponseSchema,
  GetDashboardMetricsApiV1AdminDashboardMetricsGetParamsSchema,
  GetBookingTrendsApiV1AdminDashboardBookingTrendsGetResponseSchema,
  GetBookingTrendsApiV1AdminDashboardBookingTrendsGetParamsSchema,
  GetPopularDestinationsApiV1AdminDashboardPopularDestinationsGetResponseSchema,
  GetPopularDestinationsApiV1AdminDashboardPopularDestinationsGetParamsSchema,
  ListListingsApiV1AdminListingsGetResponseSchema,
  ListListingsApiV1AdminListingsGetParamsSchema,
  GetListingApiV1AdminListingsListingIdGetResponseSchema,
  GetListingApiV1AdminListingsListingIdGetParamsSchema,
  GetListingStatsApiV1AdminListingsStatsGetResponseSchema,
  ListBookingsApiV1AdminBookingsGetResponseSchema,
  ListBookingsApiV1AdminBookingsGetParamsSchema,
  GetBookingApiV1AdminBookingsBookingIdGetResponseSchema,
  GetBookingApiV1AdminBookingsBookingIdGetParamsSchema,
  GetBookingStatsApiV1AdminBookingsStatsGetResponseSchema,
  ListPaymentsApiV1AdminPaymentsGetResponseSchema,
  ListPaymentsApiV1AdminPaymentsGetParamsSchema,
  GetPaymentApiV1AdminPaymentsPaymentIdGetResponseSchema,
  GetPaymentApiV1AdminPaymentsPaymentIdGetParamsSchema,
  GetPaymentStatsApiV1AdminPaymentsStatsGetResponseSchema
} from '@/generated/schemas'

export class AdminApiClient extends BaseApiClient {
  constructor() {
    super()
    
    // Add tag-specific middleware
    this.addMiddleware({
      name: 'admin-context',
      onRequest: async (config) => {
        return {
          ...config,
          headers: {
            ...config.headers,
            'X-API-Context': 'admin'
          }
        }
      }
    })
  }

  /**
   * List Users
   * List all users with optional filters.
Only accessible to admins.
   * @param options - Request options
   * @returns Promise<ClientResponse<z.infer<typeof ListUsersApiV1AdminUsersGetResponseSchema>>>
   * @example
   * const result = await client.listUsersApiV1AdminUsersGet({
   *   config: { timeout: 5000 }
   * })
   */
  listUsersApiV1AdminUsersGet = cache(async (options: {
    params: z.infer<typeof ListUsersApiV1AdminUsersGetParamsSchema>
    config?: RequestConfiguration
  }) => {
// Validate and extract parameters
const validatedParams = await ListUsersApiV1AdminUsersGetParamsSchema.parseAsync(options.params)

    return this.request<z.infer<typeof ListUsersApiV1AdminUsersGetResponseSchema>>(
      'GET',
      '/api/v1/admin/users',
      {
queryParams: validatedParams.query,
config: { ...options?.config, middleware: [...defaultMiddleware, ...(options?.config?.middleware || [])] },
responseSchema: ListUsersApiV1AdminUsersGetResponseSchema
      }
    )
  })

  /**
   * Get User
   * Get user details by ID.
Only accessible to admins.
   * @param options - Request options
   * @returns Promise<ClientResponse<z.infer<typeof GetUserApiV1AdminUsersUserIdGetResponseSchema>>>
   * @example
   * const result = await client.getUserApiV1AdminUsersUserIdGet({
   *   config: { timeout: 5000 }
   * })
   */
  getUserApiV1AdminUsersUserIdGet = cache(async (options: {
    params: z.infer<typeof GetUserApiV1AdminUsersUserIdGetParamsSchema>
    config?: RequestConfiguration
  }) => {
// Validate and extract parameters
const validatedParams = await GetUserApiV1AdminUsersUserIdGetParamsSchema.parseAsync(options.params)

    return this.request<z.infer<typeof GetUserApiV1AdminUsersUserIdGetResponseSchema>>(
      'GET',
      '/api/v1/admin/users/{user_id}',
      {
        pathParams: validatedParams.path,
config: { ...options?.config, middleware: [...defaultMiddleware, ...(options?.config?.middleware || [])] },
responseSchema: GetUserApiV1AdminUsersUserIdGetResponseSchema
      }
    )
  })

  /**
   * Update User
   * Update user (role, status, etc.).
Only accessible to admins.

Security:
- Prevents self-suspension
- Prevents removing last admin
- All changes are audit logged
   * @param options - Request options
   * @returns Promise<ClientResponse<z.infer<typeof UpdateUserApiV1AdminUsersUserIdPutResponseSchema>>>
   * @example
   * const result = await client.updateUserApiV1AdminUsersUserIdPut({
   *   config: { timeout: 5000 }
   * })
   */
  updateUserApiV1AdminUsersUserIdPut = async (options: {
    params: z.infer<typeof UpdateUserApiV1AdminUsersUserIdPutParamsSchema>
    body: z.infer<typeof UpdateUserApiV1AdminUsersUserIdPutRequestSchema>
    config?: RequestConfiguration
  }) => {
    // Validate request body
    const validatedBody = await UpdateUserApiV1AdminUsersUserIdPutRequestSchema.parseAsync(options.body)
// Validate and extract parameters
const validatedParams = await UpdateUserApiV1AdminUsersUserIdPutParamsSchema.parseAsync(options.params)

    return this.request<z.infer<typeof UpdateUserApiV1AdminUsersUserIdPutResponseSchema>>(
      'PUT',
      '/api/v1/admin/users/{user_id}',
      {
        pathParams: validatedParams.path,
body: validatedBody,
config: { ...options?.config, middleware: [...defaultMiddleware, ...(options?.config?.middleware || [])] },
responseSchema: UpdateUserApiV1AdminUsersUserIdPutResponseSchema
      }
    )
  }

  /**
   * Suspend User
   * Suspend a user account.
Only accessible to admins.

Security:
- Prevents self-suspension
- Audit logged
   * @param options - Request options
   * @returns Promise<ClientResponse<z.infer<typeof SuspendUserApiV1AdminUsersUserIdSuspendPostResponseSchema>>>
   * @example
   * const result = await client.suspendUserApiV1AdminUsersUserIdSuspendPost({
   *   config: { timeout: 5000 }
   * })
   */
  suspendUserApiV1AdminUsersUserIdSuspendPost = async (options: {
    params: z.infer<typeof SuspendUserApiV1AdminUsersUserIdSuspendPostParamsSchema>
    config?: RequestConfiguration
  }) => {
// Validate and extract parameters
const validatedParams = await SuspendUserApiV1AdminUsersUserIdSuspendPostParamsSchema.parseAsync(options.params)

    return this.request<z.infer<typeof SuspendUserApiV1AdminUsersUserIdSuspendPostResponseSchema>>(
      'POST',
      '/api/v1/admin/users/{user_id}/suspend',
      {
        pathParams: validatedParams.path,
config: { ...options?.config, middleware: [...defaultMiddleware, ...(options?.config?.middleware || [])] },
responseSchema: SuspendUserApiV1AdminUsersUserIdSuspendPostResponseSchema
      }
    )
  }

  /**
   * Activate User
   * Activate a user account.
Only accessible to admins.

Security:
- Audit logged
   * @param options - Request options
   * @returns Promise<ClientResponse<z.infer<typeof ActivateUserApiV1AdminUsersUserIdActivatePostResponseSchema>>>
   * @example
   * const result = await client.activateUserApiV1AdminUsersUserIdActivatePost({
   *   config: { timeout: 5000 }
   * })
   */
  activateUserApiV1AdminUsersUserIdActivatePost = async (options: {
    params: z.infer<typeof ActivateUserApiV1AdminUsersUserIdActivatePostParamsSchema>
    config?: RequestConfiguration
  }) => {
// Validate and extract parameters
const validatedParams = await ActivateUserApiV1AdminUsersUserIdActivatePostParamsSchema.parseAsync(options.params)

    return this.request<z.infer<typeof ActivateUserApiV1AdminUsersUserIdActivatePostResponseSchema>>(
      'POST',
      '/api/v1/admin/users/{user_id}/activate',
      {
        pathParams: validatedParams.path,
config: { ...options?.config, middleware: [...defaultMiddleware, ...(options?.config?.middleware || [])] },
responseSchema: ActivateUserApiV1AdminUsersUserIdActivatePostResponseSchema
      }
    )
  }

  /**
   * Get User Stats
   * Get user statistics for admin dashboard.
Only accessible to admins.
   * @param options - Request options
   * @returns Promise<ClientResponse<z.infer<typeof GetUserStatsApiV1AdminUsersStatsGetResponseSchema>>>
   * @example
   * const result = await client.getUserStatsApiV1AdminUsersStatsGet({
   *   config: { timeout: 5000 }
   * })
   */
  getUserStatsApiV1AdminUsersStatsGet = cache(async (options?: { config?: RequestConfiguration }) => {
    return this.request<z.infer<typeof GetUserStatsApiV1AdminUsersStatsGetResponseSchema>>(
      'GET',
      '/api/v1/admin/users/stats',
      {
config: { ...options?.config, middleware: [...defaultMiddleware, ...(options?.config?.middleware || [])] },
responseSchema: GetUserStatsApiV1AdminUsersStatsGetResponseSchema
      }
    )
  })

  /**
   * Get Dashboard Metrics
   * Get comprehensive dashboard metrics for admin.
Only accessible to admins.
   * @param options - Request options
   * @returns Promise<ClientResponse<z.infer<typeof GetDashboardMetricsApiV1AdminDashboardMetricsGetResponseSchema>>>
   * @example
   * const result = await client.getDashboardMetricsApiV1AdminDashboardMetricsGet({
   *   config: { timeout: 5000 }
   * })
   */
  getDashboardMetricsApiV1AdminDashboardMetricsGet = cache(async (options: {
    params: z.infer<typeof GetDashboardMetricsApiV1AdminDashboardMetricsGetParamsSchema>
    config?: RequestConfiguration
  }) => {
// Validate and extract parameters
const validatedParams = await GetDashboardMetricsApiV1AdminDashboardMetricsGetParamsSchema.parseAsync(options.params)

    return this.request<z.infer<typeof GetDashboardMetricsApiV1AdminDashboardMetricsGetResponseSchema>>(
      'GET',
      '/api/v1/admin/dashboard/metrics',
      {
queryParams: validatedParams.query,
config: { ...options?.config, middleware: [...defaultMiddleware, ...(options?.config?.middleware || [])] },
responseSchema: GetDashboardMetricsApiV1AdminDashboardMetricsGetResponseSchema
      }
    )
  })

  /**
   * Get Booking Trends
   * Get booking trends over time for admin dashboard.
Only accessible to admins.
   * @param options - Request options
   * @returns Promise<ClientResponse<z.infer<typeof GetBookingTrendsApiV1AdminDashboardBookingTrendsGetResponseSchema>>>
   * @example
   * const result = await client.getBookingTrendsApiV1AdminDashboardBookingTrendsGet({
   *   config: { timeout: 5000 }
   * })
   */
  getBookingTrendsApiV1AdminDashboardBookingTrendsGet = cache(async (options: {
    params: z.infer<typeof GetBookingTrendsApiV1AdminDashboardBookingTrendsGetParamsSchema>
    config?: RequestConfiguration
  }) => {
// Validate and extract parameters
const validatedParams = await GetBookingTrendsApiV1AdminDashboardBookingTrendsGetParamsSchema.parseAsync(options.params)

    return this.request<z.infer<typeof GetBookingTrendsApiV1AdminDashboardBookingTrendsGetResponseSchema>>(
      'GET',
      '/api/v1/admin/dashboard/booking-trends',
      {
queryParams: validatedParams.query,
config: { ...options?.config, middleware: [...defaultMiddleware, ...(options?.config?.middleware || [])] },
responseSchema: GetBookingTrendsApiV1AdminDashboardBookingTrendsGetResponseSchema
      }
    )
  })

  /**
   * Get Popular Destinations
   * Get most popular destinations for admin dashboard.
Only accessible to admins.
   * @param options - Request options
   * @returns Promise<ClientResponse<z.infer<typeof GetPopularDestinationsApiV1AdminDashboardPopularDestinationsGetResponseSchema>>>
   * @example
   * const result = await client.getPopularDestinationsApiV1AdminDashboardPopularDestinationsGet({
   *   config: { timeout: 5000 }
   * })
   */
  getPopularDestinationsApiV1AdminDashboardPopularDestinationsGet = cache(async (options: {
    params: z.infer<typeof GetPopularDestinationsApiV1AdminDashboardPopularDestinationsGetParamsSchema>
    config?: RequestConfiguration
  }) => {
// Validate and extract parameters
const validatedParams = await GetPopularDestinationsApiV1AdminDashboardPopularDestinationsGetParamsSchema.parseAsync(options.params)

    return this.request<z.infer<typeof GetPopularDestinationsApiV1AdminDashboardPopularDestinationsGetResponseSchema>>(
      'GET',
      '/api/v1/admin/dashboard/popular-destinations',
      {
queryParams: validatedParams.query,
config: { ...options?.config, middleware: [...defaultMiddleware, ...(options?.config?.middleware || [])] },
responseSchema: GetPopularDestinationsApiV1AdminDashboardPopularDestinationsGetResponseSchema
      }
    )
  })

  /**
   * List Listings
   * List all listings (admin view).
Only accessible to admins.
   * @param options - Request options
   * @returns Promise<ClientResponse<z.infer<typeof ListListingsApiV1AdminListingsGetResponseSchema>>>
   * @example
   * const result = await client.listListingsApiV1AdminListingsGet({
   *   config: { timeout: 5000 }
   * })
   */
  listListingsApiV1AdminListingsGet = cache(async (options: {
    params: z.infer<typeof ListListingsApiV1AdminListingsGetParamsSchema>
    config?: RequestConfiguration
  }) => {
// Validate and extract parameters
const validatedParams = await ListListingsApiV1AdminListingsGetParamsSchema.parseAsync(options.params)

    return this.request<z.infer<typeof ListListingsApiV1AdminListingsGetResponseSchema>>(
      'GET',
      '/api/v1/admin/listings',
      {
queryParams: validatedParams.query,
config: { ...options?.config, middleware: [...defaultMiddleware, ...(options?.config?.middleware || [])] },
responseSchema: ListListingsApiV1AdminListingsGetResponseSchema
      }
    )
  })

  /**
   * Get Listing
   * Get listing details by ID.
Only accessible to admins.
   * @param options - Request options
   * @returns Promise<ClientResponse<z.infer<typeof GetListingApiV1AdminListingsListingIdGetResponseSchema>>>
   * @example
   * const result = await client.getListingApiV1AdminListingsListingIdGet({
   *   config: { timeout: 5000 }
   * })
   */
  getListingApiV1AdminListingsListingIdGet = cache(async (options: {
    params: z.infer<typeof GetListingApiV1AdminListingsListingIdGetParamsSchema>
    config?: RequestConfiguration
  }) => {
// Validate and extract parameters
const validatedParams = await GetListingApiV1AdminListingsListingIdGetParamsSchema.parseAsync(options.params)

    return this.request<z.infer<typeof GetListingApiV1AdminListingsListingIdGetResponseSchema>>(
      'GET',
      '/api/v1/admin/listings/{listing_id}',
      {
        pathParams: validatedParams.path,
config: { ...options?.config, middleware: [...defaultMiddleware, ...(options?.config?.middleware || [])] },
responseSchema: GetListingApiV1AdminListingsListingIdGetResponseSchema
      }
    )
  })

  /**
   * Get Listing Stats
   * Get listing statistics for admin.
Only accessible to admins.
   * @param options - Request options
   * @returns Promise<ClientResponse<z.infer<typeof GetListingStatsApiV1AdminListingsStatsGetResponseSchema>>>
   * @example
   * const result = await client.getListingStatsApiV1AdminListingsStatsGet({
   *   config: { timeout: 5000 }
   * })
   */
  getListingStatsApiV1AdminListingsStatsGet = cache(async (options?: { config?: RequestConfiguration }) => {
    return this.request<z.infer<typeof GetListingStatsApiV1AdminListingsStatsGetResponseSchema>>(
      'GET',
      '/api/v1/admin/listings/stats',
      {
config: { ...options?.config, middleware: [...defaultMiddleware, ...(options?.config?.middleware || [])] },
responseSchema: GetListingStatsApiV1AdminListingsStatsGetResponseSchema
      }
    )
  })

  /**
   * List Bookings
   * List all bookings (admin view).
Only accessible to admins.
   * @param options - Request options
   * @returns Promise<ClientResponse<z.infer<typeof ListBookingsApiV1AdminBookingsGetResponseSchema>>>
   * @example
   * const result = await client.listBookingsApiV1AdminBookingsGet({
   *   config: { timeout: 5000 }
   * })
   */
  listBookingsApiV1AdminBookingsGet = cache(async (options: {
    params: z.infer<typeof ListBookingsApiV1AdminBookingsGetParamsSchema>
    config?: RequestConfiguration
  }) => {
// Validate and extract parameters
const validatedParams = await ListBookingsApiV1AdminBookingsGetParamsSchema.parseAsync(options.params)

    return this.request<z.infer<typeof ListBookingsApiV1AdminBookingsGetResponseSchema>>(
      'GET',
      '/api/v1/admin/bookings',
      {
queryParams: validatedParams.query,
config: { ...options?.config, middleware: [...defaultMiddleware, ...(options?.config?.middleware || [])] },
responseSchema: ListBookingsApiV1AdminBookingsGetResponseSchema
      }
    )
  })

  /**
   * Get Booking
   * Get booking details by ID.
Only accessible to admins.
   * @param options - Request options
   * @returns Promise<ClientResponse<z.infer<typeof GetBookingApiV1AdminBookingsBookingIdGetResponseSchema>>>
   * @example
   * const result = await client.getBookingApiV1AdminBookingsBookingIdGet({
   *   config: { timeout: 5000 }
   * })
   */
  getBookingApiV1AdminBookingsBookingIdGet = cache(async (options: {
    params: z.infer<typeof GetBookingApiV1AdminBookingsBookingIdGetParamsSchema>
    config?: RequestConfiguration
  }) => {
// Validate and extract parameters
const validatedParams = await GetBookingApiV1AdminBookingsBookingIdGetParamsSchema.parseAsync(options.params)

    return this.request<z.infer<typeof GetBookingApiV1AdminBookingsBookingIdGetResponseSchema>>(
      'GET',
      '/api/v1/admin/bookings/{booking_id}',
      {
        pathParams: validatedParams.path,
config: { ...options?.config, middleware: [...defaultMiddleware, ...(options?.config?.middleware || [])] },
responseSchema: GetBookingApiV1AdminBookingsBookingIdGetResponseSchema
      }
    )
  })

  /**
   * Get Booking Stats
   * Get booking statistics for admin.
Only accessible to admins.
   * @param options - Request options
   * @returns Promise<ClientResponse<z.infer<typeof GetBookingStatsApiV1AdminBookingsStatsGetResponseSchema>>>
   * @example
   * const result = await client.getBookingStatsApiV1AdminBookingsStatsGet({
   *   config: { timeout: 5000 }
   * })
   */
  getBookingStatsApiV1AdminBookingsStatsGet = cache(async (options?: { config?: RequestConfiguration }) => {
    return this.request<z.infer<typeof GetBookingStatsApiV1AdminBookingsStatsGetResponseSchema>>(
      'GET',
      '/api/v1/admin/bookings/stats',
      {
config: { ...options?.config, middleware: [...defaultMiddleware, ...(options?.config?.middleware || [])] },
responseSchema: GetBookingStatsApiV1AdminBookingsStatsGetResponseSchema
      }
    )
  })

  /**
   * List Payments
   * List all payments (admin view).
Only accessible to admins.
   * @param options - Request options
   * @returns Promise<ClientResponse<z.infer<typeof ListPaymentsApiV1AdminPaymentsGetResponseSchema>>>
   * @example
   * const result = await client.listPaymentsApiV1AdminPaymentsGet({
   *   config: { timeout: 5000 }
   * })
   */
  listPaymentsApiV1AdminPaymentsGet = cache(async (options: {
    params: z.infer<typeof ListPaymentsApiV1AdminPaymentsGetParamsSchema>
    config?: RequestConfiguration
  }) => {
// Validate and extract parameters
const validatedParams = await ListPaymentsApiV1AdminPaymentsGetParamsSchema.parseAsync(options.params)

    return this.request<z.infer<typeof ListPaymentsApiV1AdminPaymentsGetResponseSchema>>(
      'GET',
      '/api/v1/admin/payments',
      {
queryParams: validatedParams.query,
config: { ...options?.config, middleware: [...defaultMiddleware, ...(options?.config?.middleware || [])] },
responseSchema: ListPaymentsApiV1AdminPaymentsGetResponseSchema
      }
    )
  })

  /**
   * Get Payment
   * Get payment details by ID.
Only accessible to admins.
   * @param options - Request options
   * @returns Promise<ClientResponse<z.infer<typeof GetPaymentApiV1AdminPaymentsPaymentIdGetResponseSchema>>>
   * @example
   * const result = await client.getPaymentApiV1AdminPaymentsPaymentIdGet({
   *   config: { timeout: 5000 }
   * })
   */
  getPaymentApiV1AdminPaymentsPaymentIdGet = cache(async (options: {
    params: z.infer<typeof GetPaymentApiV1AdminPaymentsPaymentIdGetParamsSchema>
    config?: RequestConfiguration
  }) => {
// Validate and extract parameters
const validatedParams = await GetPaymentApiV1AdminPaymentsPaymentIdGetParamsSchema.parseAsync(options.params)

    return this.request<z.infer<typeof GetPaymentApiV1AdminPaymentsPaymentIdGetResponseSchema>>(
      'GET',
      '/api/v1/admin/payments/{payment_id}',
      {
        pathParams: validatedParams.path,
config: { ...options?.config, middleware: [...defaultMiddleware, ...(options?.config?.middleware || [])] },
responseSchema: GetPaymentApiV1AdminPaymentsPaymentIdGetResponseSchema
      }
    )
  })

  /**
   * Get Payment Stats
   * Get payment statistics for admin.
Only accessible to admins.
   * @param options - Request options
   * @returns Promise<ClientResponse<z.infer<typeof GetPaymentStatsApiV1AdminPaymentsStatsGetResponseSchema>>>
   * @example
   * const result = await client.getPaymentStatsApiV1AdminPaymentsStatsGet({
   *   config: { timeout: 5000 }
   * })
   */
  getPaymentStatsApiV1AdminPaymentsStatsGet = cache(async (options?: { config?: RequestConfiguration }) => {
    return this.request<z.infer<typeof GetPaymentStatsApiV1AdminPaymentsStatsGetResponseSchema>>(
      'GET',
      '/api/v1/admin/payments/stats',
      {
config: { ...options?.config, middleware: [...defaultMiddleware, ...(options?.config?.middleware || [])] },
responseSchema: GetPaymentStatsApiV1AdminPaymentsStatsGetResponseSchema
      }
    )
  })
}