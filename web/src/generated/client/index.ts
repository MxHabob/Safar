import { BaseApiClient } from './base'
import { defaultMiddleware, createMiddlewareStack } from './middleware'
import { DefaultApiClient } from './default'
import { UsersApiClient } from './users'
import { ListingsApiClient } from './listings'
import { AITravelPlannerApiClient } from './aITravelPlanner'
import { FilesApiClient } from './files'
import { BookingsApiClient } from './bookings'
import { ReviewsApiClient } from './reviews'
import { SearchApiClient } from './search'
import { MessagesApiClient } from './messages'
import { PaymentsApiClient } from './payments'
import { WebhooksApiClient } from './webhooks'
import { RecommendationsApiClient } from './recommendations'
import { AnalyticsApiClient } from './analytics'
import { PromotionsApiClient } from './promotions'
import { NotificationsApiClient } from './notifications'
import { LoyaltyApiClient } from './loyalty'
import { PremiumListingsApiClient } from './premiumListings'
import { TravelGuidesApiClient } from './travelGuides'
import { SubscriptionsApiClient } from './subscriptions'
import { MultiTenancyApiClient } from './multiTenancy'
import { AdminApiClient } from './admin'

/**
 * Enhanced API client with all endpoint groups
 * Features: Request deduplication, caching, middleware, metrics
 * Auto-generated from OpenAPI schema
 */
export class ApiClient extends BaseApiClient {
  public readonly default: DefaultApiClient
  public readonly users: UsersApiClient
  public readonly listings: ListingsApiClient
  public readonly aITravelPlanner: AITravelPlannerApiClient
  public readonly files: FilesApiClient
  public readonly bookings: BookingsApiClient
  public readonly reviews: ReviewsApiClient
  public readonly search: SearchApiClient
  public readonly messages: MessagesApiClient
  public readonly payments: PaymentsApiClient
  public readonly webhooks: WebhooksApiClient
  public readonly recommendations: RecommendationsApiClient
  public readonly analytics: AnalyticsApiClient
  public readonly promotions: PromotionsApiClient
  public readonly notifications: NotificationsApiClient
  public readonly loyalty: LoyaltyApiClient
  public readonly premiumListings: PremiumListingsApiClient
  public readonly travelGuides: TravelGuidesApiClient
  public readonly subscriptions: SubscriptionsApiClient
  public readonly multiTenancy: MultiTenancyApiClient
  public readonly admin: AdminApiClient

  constructor() {
    super()
    
    // Initialize endpoint clients
    this.default = new DefaultApiClient()
    this.users = new UsersApiClient()
    this.listings = new ListingsApiClient()
    this.aITravelPlanner = new AITravelPlannerApiClient()
    this.files = new FilesApiClient()
    this.bookings = new BookingsApiClient()
    this.reviews = new ReviewsApiClient()
    this.search = new SearchApiClient()
    this.messages = new MessagesApiClient()
    this.payments = new PaymentsApiClient()
    this.webhooks = new WebhooksApiClient()
    this.recommendations = new RecommendationsApiClient()
    this.analytics = new AnalyticsApiClient()
    this.promotions = new PromotionsApiClient()
    this.notifications = new NotificationsApiClient()
    this.loyalty = new LoyaltyApiClient()
    this.premiumListings = new PremiumListingsApiClient()
    this.travelGuides = new TravelGuidesApiClient()
    this.subscriptions = new SubscriptionsApiClient()
    this.multiTenancy = new MultiTenancyApiClient()
    this.admin = new AdminApiClient()
    
    // Add global middleware
    createMiddlewareStack().forEach(middleware => {
      this.addMiddleware(middleware)
    })
  }

  // Utility methods
  async healthCheck(): Promise<{ status: 'ok' | 'error', timestamp: number, version?: string }> {
    try {
      const response = await this.get('/health')
      return {
        status: 'ok',
        timestamp: Date.now(),
        version: response.headers.get('x-api-version') || undefined
      }
    } catch {
      return {
        status: 'error',
        timestamp: Date.now()
      }
    }
  }

  // Get client metrics
  getClientMetrics() {
    return {
      requests: this.getMetrics(),
      cacheSize: this.getCacheSize(),
      uptime: Date.now() - this.startTime
    }
  }

  private startTime = Date.now()
  
  private getCacheSize(): number {
    // This would return the size of the request cache
    return 0
  }
}

// Export singleton instance
export const apiClient = new ApiClient()

// Export individual clients for tree-shaking
export { DefaultApiClient } from './default'
export { UsersApiClient } from './users'
export { ListingsApiClient } from './listings'
export { AITravelPlannerApiClient } from './aITravelPlanner'
export { FilesApiClient } from './files'
export { BookingsApiClient } from './bookings'
export { ReviewsApiClient } from './reviews'
export { SearchApiClient } from './search'
export { MessagesApiClient } from './messages'
export { PaymentsApiClient } from './payments'
export { WebhooksApiClient } from './webhooks'
export { RecommendationsApiClient } from './recommendations'
export { AnalyticsApiClient } from './analytics'
export { PromotionsApiClient } from './promotions'
export { NotificationsApiClient } from './notifications'
export { LoyaltyApiClient } from './loyalty'
export { PremiumListingsApiClient } from './premiumListings'
export { TravelGuidesApiClient } from './travelGuides'
export { SubscriptionsApiClient } from './subscriptions'
export { MultiTenancyApiClient } from './multiTenancy'
export { AdminApiClient } from './admin'

// Export types and utilities
export type { ClientResponse, RequestConfiguration, ApiError, ValidationError, TimeoutError, NetworkError } from './base'
export type { RequestMiddleware } from './base'
