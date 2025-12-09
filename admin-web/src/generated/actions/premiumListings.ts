'use server'
import { z } from 'zod'
import { cache } from 'react'
import { updateTag } from 'next/cache'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { apiClient } from '@/generated/client'
import { actionClientWithMeta, authActionClient, ActionError } from '@/generated/lib/safe-action'
import {
  UpgradeListingToPremiumApiV1ListingsPremiumListingIdUpgradePostParamsSchema,
  UpgradeListingToPremiumApiV1ListingsPremiumListingIdUpgradePostResponseSchema,
  FeatureListingApiV1ListingsPremiumListingIdFeaturePostParamsSchema,
  FeatureListingApiV1ListingsPremiumListingIdFeaturePostResponseSchema,
  GetFeaturedListingsApiV1ListingsPremiumFeaturedGetParamsSchema,
  GetFeaturedListingsApiV1ListingsPremiumFeaturedGetResponseSchema,
  GetPremiumListingsApiV1ListingsPremiumPremiumGetParamsSchema,
  GetPremiumListingsApiV1ListingsPremiumPremiumGetResponseSchema,
  GetPricingOptionsApiV1ListingsPremiumPricingGetResponseSchema
} from '@/generated/schemas'

// Utility functions for enhanced server actions

async function getClientInfo() {
  const headersList = await headers()
  const userAgent = headersList.get('user-agent') || 'unknown'
  const ip = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || 'unknown'
  
  return { userAgent, ip }
}

async function validateAndSanitizeInput<T>(schema: z.ZodSchema<T>, input: unknown): Promise<T> {
  try {
    return await schema.parseAsync(input)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.issues.map(issue => {
        const path = issue.path.length > 0 ? `${issue.path.join('.')}: ` : ''
        return `${path}${issue.message}`
      }).join(', ')
      throw new ActionError(`Input validation failed: ${errorMessages}`, 'VALIDATION_ERROR')
    }
    throw new ActionError('Invalid input format', 'VALIDATION_ERROR')
  }
}

// Enhanced error handling with context
class ActionExecutionError extends ActionError {
  constructor(
    message: string,
    public readonly context: {
      endpoint: string
      method: string
      timestamp: number
    },
    public readonly originalError?: unknown
  ) {
    super(message, 'EXECUTION_ERROR')
  }
}

// Logging utility for server actions
async function logActionExecution(
  action: string,
  success: boolean,
  duration: number,
  context?: Record<string, any>
) {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[ACTION] ${action} - ${success ? 'SUCCESS' : 'FAILED'} (${duration}ms)`, context)
  }
  
  // In production, send to your logging service
  // await analytics.track('server_action_executed', { action, success, duration, ...context })
}

/**
 * Upgrade Listing To Premium
 * @generated from POST /api/v1/listings/premium/{listing_id}/upgrade
 * Features: Input validation, revalidation, error handling
 */
export const upgradeListingToPremiumApiV1ListingsPremiumListingIdUpgradePost = authActionClient
  .metadata({
    name: "upgrade-listing-to-premium-api-v1-listings-premium-listing-id-upgrade-post",
    requiresAuth: true
  })
  .schema(UpgradeListingToPremiumApiV1ListingsPremiumListingIdUpgradePostParamsSchema)
  .action(async ({ parsedInput, ctx }: { parsedInput: z.infer<typeof UpgradeListingToPremiumApiV1ListingsPremiumListingIdUpgradePostParamsSchema>; ctx: { user?: any; ratelimit?: { remaining: number } } }) => {
    const startTime = Date.now()
    
    try {
      // Validate and sanitize parameters
      const validatedParams = await validateAndSanitizeInput(UpgradeListingToPremiumApiV1ListingsPremiumListingIdUpgradePostParamsSchema, parsedInput) as z.infer<typeof UpgradeListingToPremiumApiV1ListingsPremiumListingIdUpgradePostParamsSchema>

      // Execute API call with enhanced configuration
      const response = await apiClient.premiumListings.upgradeListingToPremiumApiV1ListingsPremiumListingIdUpgradePost({params: {
path: {
        listing_id: validatedParams.path.listing_id
      },
query: validatedParams.query,
    },
        config: {
          timeout: 30000,
          retries: 3,
          validateResponse: false,
          responseSchema: UpgradeListingToPremiumApiV1ListingsPremiumListingIdUpgradePostResponseSchema
        }
      })
        // Handle streaming responses
        if (response.headers.get('content-type')?.includes('text/stream')) {
          // Process streaming response
          return response.data
        }
        // Handle potential redirects based on response
        if (response.status === 201 && response.headers.get('location')) {
          const location = response.headers.get('location')!
          redirect(location)
        }

            // Revalidate cache after successful mutation
      updateTag('Premium Listings')
      console.log('Updated tag: Premium Listings')


      // Log successful execution
      const duration = Date.now() - startTime
      await logActionExecution('upgradeListingToPremiumApiV1ListingsPremiumListingIdUpgradePost', true, duration, {
        method: 'POST',
        path: '/api/v1/listings/premium/{listing_id}/upgrade'
      })
      
      return response.data
    } catch (error) {

      const duration = Date.now() - startTime

      // Enhanced error logging
      await logActionExecution('upgradeListingToPremiumApiV1ListingsPremiumListingIdUpgradePost', false, duration, {
        method: 'POST',
        path: '/api/v1/listings/premium/{listing_id}/upgrade',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      
      // Throw enhanced error with context
      throw new ActionExecutionError(
        error instanceof Error ? error.message : 'Unknown error occurred',
        {
          endpoint: '/api/v1/listings/premium/{listing_id}/upgrade',
          method: 'POST',
          timestamp: Date.now()
        },
        error
      )
    }
  })

/**
 * Feature Listing
 * @generated from POST /api/v1/listings/premium/{listing_id}/feature
 * Features: Input validation, revalidation, error handling
 */
export const featureListingApiV1ListingsPremiumListingIdFeaturePost = authActionClient
  .metadata({
    name: "feature-listing-api-v1-listings-premium-listing-id-feature-post",
    requiresAuth: true
  })
  .schema(FeatureListingApiV1ListingsPremiumListingIdFeaturePostParamsSchema)
  .action(async ({ parsedInput, ctx }: { parsedInput: z.infer<typeof FeatureListingApiV1ListingsPremiumListingIdFeaturePostParamsSchema>; ctx: { user?: any; ratelimit?: { remaining: number } } }) => {
    const startTime = Date.now()
    
    try {
      // Validate and sanitize parameters
      const validatedParams = await validateAndSanitizeInput(FeatureListingApiV1ListingsPremiumListingIdFeaturePostParamsSchema, parsedInput) as z.infer<typeof FeatureListingApiV1ListingsPremiumListingIdFeaturePostParamsSchema>

      // Execute API call with enhanced configuration
      const response = await apiClient.premiumListings.featureListingApiV1ListingsPremiumListingIdFeaturePost({params: {
path: {
        listing_id: validatedParams.path.listing_id
      },
query: validatedParams.query,
    },
        config: {
          timeout: 30000,
          retries: 3,
          validateResponse: false,
          responseSchema: FeatureListingApiV1ListingsPremiumListingIdFeaturePostResponseSchema
        }
      })
        // Handle streaming responses
        if (response.headers.get('content-type')?.includes('text/stream')) {
          // Process streaming response
          return response.data
        }
        // Handle potential redirects based on response
        if (response.status === 201 && response.headers.get('location')) {
          const location = response.headers.get('location')!
          redirect(location)
        }

            // Revalidate cache after successful mutation
      updateTag('Premium Listings')
      console.log('Updated tag: Premium Listings')


      // Log successful execution
      const duration = Date.now() - startTime
      await logActionExecution('featureListingApiV1ListingsPremiumListingIdFeaturePost', true, duration, {
        method: 'POST',
        path: '/api/v1/listings/premium/{listing_id}/feature'
      })
      
      return response.data
    } catch (error) {

      const duration = Date.now() - startTime

      // Enhanced error logging
      await logActionExecution('featureListingApiV1ListingsPremiumListingIdFeaturePost', false, duration, {
        method: 'POST',
        path: '/api/v1/listings/premium/{listing_id}/feature',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      
      // Throw enhanced error with context
      throw new ActionExecutionError(
        error instanceof Error ? error.message : 'Unknown error occurred',
        {
          endpoint: '/api/v1/listings/premium/{listing_id}/feature',
          method: 'POST',
          timestamp: Date.now()
        },
        error
      )
    }
  })

/**
 * Get Featured Listings
 * @generated from GET /api/v1/listings/premium/featured
 * Features: React cache, input validation, error handling
 */
export const getFeaturedListingsApiV1ListingsPremiumFeaturedGet = cache(
  actionClientWithMeta
    .metadata({
      name: "get-featured-listings-api-v1-listings-premium-featured-get",
      requiresAuth: false
    })
    .schema(GetFeaturedListingsApiV1ListingsPremiumFeaturedGetParamsSchema)
    .action(async ({ parsedInput, ctx }: { parsedInput: z.infer<typeof GetFeaturedListingsApiV1ListingsPremiumFeaturedGetParamsSchema>; ctx?: any }) => {
      const startTime = Date.now()
      
      try {
      // Validate and sanitize parameters
      const validatedParams = await validateAndSanitizeInput(GetFeaturedListingsApiV1ListingsPremiumFeaturedGetParamsSchema, parsedInput) as z.infer<typeof GetFeaturedListingsApiV1ListingsPremiumFeaturedGetParamsSchema>

        // Execute API call with enhanced error handling
        const response = await apiClient.premiumListings.getFeaturedListingsApiV1ListingsPremiumFeaturedGet({params: {
query: validatedParams.query,
    },
          config: {
            timeout: 30000,
            retries: 3,
            validateResponse: false,
            responseSchema: GetFeaturedListingsApiV1ListingsPremiumFeaturedGetResponseSchema
          }
        })
        

        // Log successful execution
        const duration = Date.now() - startTime
        await logActionExecution('getFeaturedListingsApiV1ListingsPremiumFeaturedGet', true, duration, {
          method: 'GET',
          path: '/api/v1/listings/premium/featured'
        })
        
        return response.data
      } catch (error) {

        const duration = Date.now() - startTime

        // Enhanced error logging
        await logActionExecution('getFeaturedListingsApiV1ListingsPremiumFeaturedGet', false, duration, {
          method: 'GET',
          path: '/api/v1/listings/premium/featured',
          error: error instanceof Error ? error.message : 'Unknown error'
        })
        
        // Throw enhanced error with context
        throw new ActionExecutionError(
          error instanceof Error ? error.message : 'Unknown error occurred',
          {
            endpoint: '/api/v1/listings/premium/featured',
            method: 'GET',
            timestamp: Date.now()
          },
          error
        )
      }
    })
)

/**
 * Get Premium Listings
 * @generated from GET /api/v1/listings/premium/premium
 * Features: React cache, input validation, error handling
 */
export const getPremiumListingsApiV1ListingsPremiumPremiumGet = cache(
  actionClientWithMeta
    .metadata({
      name: "get-premium-listings-api-v1-listings-premium-premium-get",
      requiresAuth: false
    })
    .schema(GetPremiumListingsApiV1ListingsPremiumPremiumGetParamsSchema)
    .action(async ({ parsedInput, ctx }: { parsedInput: z.infer<typeof GetPremiumListingsApiV1ListingsPremiumPremiumGetParamsSchema>; ctx?: any }) => {
      const startTime = Date.now()
      
      try {
      // Validate and sanitize parameters
      const validatedParams = await validateAndSanitizeInput(GetPremiumListingsApiV1ListingsPremiumPremiumGetParamsSchema, parsedInput) as z.infer<typeof GetPremiumListingsApiV1ListingsPremiumPremiumGetParamsSchema>

        // Execute API call with enhanced error handling
        const response = await apiClient.premiumListings.getPremiumListingsApiV1ListingsPremiumPremiumGet({params: {
query: validatedParams.query,
    },
          config: {
            timeout: 30000,
            retries: 3,
            validateResponse: false,
            responseSchema: GetPremiumListingsApiV1ListingsPremiumPremiumGetResponseSchema
          }
        })
        

        // Log successful execution
        const duration = Date.now() - startTime
        await logActionExecution('getPremiumListingsApiV1ListingsPremiumPremiumGet', true, duration, {
          method: 'GET',
          path: '/api/v1/listings/premium/premium'
        })
        
        return response.data
      } catch (error) {

        const duration = Date.now() - startTime

        // Enhanced error logging
        await logActionExecution('getPremiumListingsApiV1ListingsPremiumPremiumGet', false, duration, {
          method: 'GET',
          path: '/api/v1/listings/premium/premium',
          error: error instanceof Error ? error.message : 'Unknown error'
        })
        
        // Throw enhanced error with context
        throw new ActionExecutionError(
          error instanceof Error ? error.message : 'Unknown error occurred',
          {
            endpoint: '/api/v1/listings/premium/premium',
            method: 'GET',
            timestamp: Date.now()
          },
          error
        )
      }
    })
)

/**
 * Get Pricing Options
 * @generated from GET /api/v1/listings/premium/pricing
 * Features: React cache, input validation, error handling
 */
export const getPricingOptionsApiV1ListingsPremiumPricingGet = cache(
  authActionClient
    .metadata({
      name: "get-pricing-options-api-v1-listings-premium-pricing-get",
      requiresAuth: true
    })
    .schema(z.void())
    .action(async ({ parsedInput, ctx }: { parsedInput: void; ctx: { user?: any; ratelimit?: { remaining: number } } }) => {
      const startTime = Date.now()
      
      try {

        // Execute API call with enhanced error handling
        const response = await apiClient.premiumListings.getPricingOptionsApiV1ListingsPremiumPricingGet({
          config: {
            timeout: 30000,
            retries: 3,
            validateResponse: false,
            responseSchema: GetPricingOptionsApiV1ListingsPremiumPricingGetResponseSchema
          }
        })
        

        // Log successful execution
        const duration = Date.now() - startTime
        await logActionExecution('getPricingOptionsApiV1ListingsPremiumPricingGet', true, duration, {
          method: 'GET',
          path: '/api/v1/listings/premium/pricing'
        })
        
        return response.data
      } catch (error) {

        const duration = Date.now() - startTime

        // Enhanced error logging
        await logActionExecution('getPricingOptionsApiV1ListingsPremiumPricingGet', false, duration, {
          method: 'GET',
          path: '/api/v1/listings/premium/pricing',
          error: error instanceof Error ? error.message : 'Unknown error'
        })
        
        // Throw enhanced error with context
        throw new ActionExecutionError(
          error instanceof Error ? error.message : 'Unknown error occurred',
          {
            endpoint: '/api/v1/listings/premium/pricing',
            method: 'GET',
            timestamp: Date.now()
          },
          error
        )
      }
    })
)