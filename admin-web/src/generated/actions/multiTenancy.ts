'use server'
import { z } from 'zod'
import { cache } from 'react'
import { updateTag } from 'next/cache'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { apiClient } from '@/generated/client'
import { actionClientWithMeta, authActionClient, ActionError } from '@/generated/lib/safe-action'
import {
  GetCurrentTenantApiV1TenancyTenantGetResponseSchema,
  CreateTenantApiV1TenancyTenantPostParamsSchema,
  CreateTenantApiV1TenancyTenantPostResponseSchema,
  UpdateBrandingApiV1TenancyTenantTenantIdBrandingPutParamsSchema,
  UpdateBrandingApiV1TenancyTenantTenantIdBrandingPutResponseSchema,
  AddCustomDomainApiV1TenancyTenantTenantIdDomainPostParamsSchema,
  AddCustomDomainApiV1TenancyTenantTenantIdDomainPostResponseSchema,
  VerifyDomainApiV1TenancyTenantDomainVerifyPostParamsSchema,
  VerifyDomainApiV1TenancyTenantDomainVerifyPostResponseSchema,
  GetConfigApiV1TenancyTenantTenantIdConfigGetParamsSchema,
  GetConfigApiV1TenancyTenantTenantIdConfigGetResponseSchema,
  UpdateConfigApiV1TenancyTenantTenantIdConfigPutRequestSchema,
  UpdateConfigApiV1TenancyTenantTenantIdConfigPutParamsSchema,
  UpdateConfigApiV1TenancyTenantTenantIdConfigPutResponseSchema
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
 * Get Current Tenant
 * @generated from GET /api/v1/tenancy/tenant
 * Features: React cache, input validation, error handling
 */
export const getCurrentTenantApiV1TenancyTenantGet = cache(
  actionClientWithMeta
    .metadata({
      name: "get-current-tenant-api-v1-tenancy-tenant-get",
      requiresAuth: false
    })
    .schema(z.void())
    .action(async ({ parsedInput, ctx }: { parsedInput: void; ctx?: any }) => {
      const startTime = Date.now()
      
      try {

        // Execute API call with enhanced error handling
        const response = await apiClient.multiTenancy.getCurrentTenantApiV1TenancyTenantGet({
          config: {
            timeout: 30000,
            retries: 3,
            validateResponse: false,
            responseSchema: GetCurrentTenantApiV1TenancyTenantGetResponseSchema
          }
        })
        

        // Log successful execution
        const duration = Date.now() - startTime
        await logActionExecution('getCurrentTenantApiV1TenancyTenantGet', true, duration, {
          method: 'GET',
          path: '/api/v1/tenancy/tenant'
        })
        
        return response.data
      } catch (error) {

        const duration = Date.now() - startTime

        // Enhanced error logging
        await logActionExecution('getCurrentTenantApiV1TenancyTenantGet', false, duration, {
          method: 'GET',
          path: '/api/v1/tenancy/tenant',
          error: error instanceof Error ? error.message : 'Unknown error'
        })
        
        // Throw enhanced error with context
        throw new ActionExecutionError(
          error instanceof Error ? error.message : 'Unknown error occurred',
          {
            endpoint: '/api/v1/tenancy/tenant',
            method: 'GET',
            timestamp: Date.now()
          },
          error
        )
      }
    })
)

/**
 * Create Tenant
 * @generated from POST /api/v1/tenancy/tenant
 * Features: Input validation, revalidation, error handling
 */
export const createTenantApiV1TenancyTenantPost = authActionClient
  .metadata({
    name: "create-tenant-api-v1-tenancy-tenant-post",
    requiresAuth: true
  })
  .schema(CreateTenantApiV1TenancyTenantPostParamsSchema)
  .action(async ({ parsedInput, ctx }: { parsedInput: z.infer<typeof CreateTenantApiV1TenancyTenantPostParamsSchema>; ctx: { user?: any; ratelimit?: { remaining: number } } }) => {
    const startTime = Date.now()
    
    try {
      // Validate and sanitize parameters
      const validatedParams = await validateAndSanitizeInput(CreateTenantApiV1TenancyTenantPostParamsSchema, parsedInput) as z.infer<typeof CreateTenantApiV1TenancyTenantPostParamsSchema>

      // Execute API call with enhanced configuration
      const response = await apiClient.multiTenancy.createTenantApiV1TenancyTenantPost({params: {
query: validatedParams.query,
    },
        config: {
          timeout: 30000,
          retries: 3,
          validateResponse: false,
          responseSchema: CreateTenantApiV1TenancyTenantPostResponseSchema
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
      updateTag('Multi-Tenancy')
      console.log('Updated tag: Multi-Tenancy')


      // Log successful execution
      const duration = Date.now() - startTime
      await logActionExecution('createTenantApiV1TenancyTenantPost', true, duration, {
        method: 'POST',
        path: '/api/v1/tenancy/tenant'
      })
      
      return response.data
    } catch (error) {

      const duration = Date.now() - startTime

      // Enhanced error logging
      await logActionExecution('createTenantApiV1TenancyTenantPost', false, duration, {
        method: 'POST',
        path: '/api/v1/tenancy/tenant',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      
      // Throw enhanced error with context
      throw new ActionExecutionError(
        error instanceof Error ? error.message : 'Unknown error occurred',
        {
          endpoint: '/api/v1/tenancy/tenant',
          method: 'POST',
          timestamp: Date.now()
        },
        error
      )
    }
  })

/**
 * Update Branding
 * @generated from PUT /api/v1/tenancy/tenant/{tenant_id}/branding
 * Features: Input validation, revalidation, error handling
 */
export const updateBrandingApiV1TenancyTenantTenantIdBrandingPut = authActionClient
  .metadata({
    name: "update-branding-api-v1-tenancy-tenant-tenant-id-branding-put",
    requiresAuth: true
  })
  .schema(UpdateBrandingApiV1TenancyTenantTenantIdBrandingPutParamsSchema)
  .action(async ({ parsedInput, ctx }: { parsedInput: z.infer<typeof UpdateBrandingApiV1TenancyTenantTenantIdBrandingPutParamsSchema>; ctx: { user?: any; ratelimit?: { remaining: number } } }) => {
    const startTime = Date.now()
    
    try {
      // Validate and sanitize parameters
      const validatedParams = await validateAndSanitizeInput(UpdateBrandingApiV1TenancyTenantTenantIdBrandingPutParamsSchema, parsedInput) as z.infer<typeof UpdateBrandingApiV1TenancyTenantTenantIdBrandingPutParamsSchema>

      // Execute API call with enhanced configuration
      const response = await apiClient.multiTenancy.updateBrandingApiV1TenancyTenantTenantIdBrandingPut({params: {
path: {
        tenant_id: validatedParams.path.tenant_id
      },
query: validatedParams.query,
    },
        config: {
          timeout: 30000,
          retries: 3,
          validateResponse: false,
          responseSchema: UpdateBrandingApiV1TenancyTenantTenantIdBrandingPutResponseSchema
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
      updateTag('Multi-Tenancy')
      console.log('Updated tag: Multi-Tenancy')


      // Log successful execution
      const duration = Date.now() - startTime
      await logActionExecution('updateBrandingApiV1TenancyTenantTenantIdBrandingPut', true, duration, {
        method: 'PUT',
        path: '/api/v1/tenancy/tenant/{tenant_id}/branding'
      })
      
      return response.data
    } catch (error) {

      const duration = Date.now() - startTime

      // Enhanced error logging
      await logActionExecution('updateBrandingApiV1TenancyTenantTenantIdBrandingPut', false, duration, {
        method: 'PUT',
        path: '/api/v1/tenancy/tenant/{tenant_id}/branding',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      
      // Throw enhanced error with context
      throw new ActionExecutionError(
        error instanceof Error ? error.message : 'Unknown error occurred',
        {
          endpoint: '/api/v1/tenancy/tenant/{tenant_id}/branding',
          method: 'PUT',
          timestamp: Date.now()
        },
        error
      )
    }
  })

/**
 * Add Custom Domain
 * @generated from POST /api/v1/tenancy/tenant/{tenant_id}/domain
 * Features: Input validation, revalidation, error handling
 */
export const addCustomDomainApiV1TenancyTenantTenantIdDomainPost = authActionClient
  .metadata({
    name: "add-custom-domain-api-v1-tenancy-tenant-tenant-id-domain-post",
    requiresAuth: true
  })
  .schema(AddCustomDomainApiV1TenancyTenantTenantIdDomainPostParamsSchema)
  .action(async ({ parsedInput, ctx }: { parsedInput: z.infer<typeof AddCustomDomainApiV1TenancyTenantTenantIdDomainPostParamsSchema>; ctx: { user?: any; ratelimit?: { remaining: number } } }) => {
    const startTime = Date.now()
    
    try {
      // Validate and sanitize parameters
      const validatedParams = await validateAndSanitizeInput(AddCustomDomainApiV1TenancyTenantTenantIdDomainPostParamsSchema, parsedInput) as z.infer<typeof AddCustomDomainApiV1TenancyTenantTenantIdDomainPostParamsSchema>

      // Execute API call with enhanced configuration
      const response = await apiClient.multiTenancy.addCustomDomainApiV1TenancyTenantTenantIdDomainPost({params: {
path: {
        tenant_id: validatedParams.path.tenant_id
      },
query: validatedParams.query,
    },
        config: {
          timeout: 30000,
          retries: 3,
          validateResponse: false,
          responseSchema: AddCustomDomainApiV1TenancyTenantTenantIdDomainPostResponseSchema
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
      updateTag('Multi-Tenancy')
      console.log('Updated tag: Multi-Tenancy')


      // Log successful execution
      const duration = Date.now() - startTime
      await logActionExecution('addCustomDomainApiV1TenancyTenantTenantIdDomainPost', true, duration, {
        method: 'POST',
        path: '/api/v1/tenancy/tenant/{tenant_id}/domain'
      })
      
      return response.data
    } catch (error) {

      const duration = Date.now() - startTime

      // Enhanced error logging
      await logActionExecution('addCustomDomainApiV1TenancyTenantTenantIdDomainPost', false, duration, {
        method: 'POST',
        path: '/api/v1/tenancy/tenant/{tenant_id}/domain',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      
      // Throw enhanced error with context
      throw new ActionExecutionError(
        error instanceof Error ? error.message : 'Unknown error occurred',
        {
          endpoint: '/api/v1/tenancy/tenant/{tenant_id}/domain',
          method: 'POST',
          timestamp: Date.now()
        },
        error
      )
    }
  })

/**
 * Verify Domain
 * @generated from POST /api/v1/tenancy/tenant/domain/verify
 * Features: Input validation, revalidation, error handling
 */
export const verifyDomainApiV1TenancyTenantDomainVerifyPost = actionClientWithMeta
  .metadata({
    name: "verify-domain-api-v1-tenancy-tenant-domain-verify-post",
    requiresAuth: false
  })
  .schema(VerifyDomainApiV1TenancyTenantDomainVerifyPostParamsSchema)
  .action(async ({ parsedInput, ctx }: { parsedInput: z.infer<typeof VerifyDomainApiV1TenancyTenantDomainVerifyPostParamsSchema>; ctx?: any }) => {
    const startTime = Date.now()
    
    try {
      // Validate and sanitize parameters
      const validatedParams = await validateAndSanitizeInput(VerifyDomainApiV1TenancyTenantDomainVerifyPostParamsSchema, parsedInput) as z.infer<typeof VerifyDomainApiV1TenancyTenantDomainVerifyPostParamsSchema>

      // Execute API call with enhanced configuration
      const response = await apiClient.multiTenancy.verifyDomainApiV1TenancyTenantDomainVerifyPost({params: {
query: validatedParams.query,
    },
        config: {
          timeout: 30000,
          retries: 3,
          validateResponse: false,
          responseSchema: VerifyDomainApiV1TenancyTenantDomainVerifyPostResponseSchema
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
      updateTag('Multi-Tenancy')
      console.log('Updated tag: Multi-Tenancy')


      // Log successful execution
      const duration = Date.now() - startTime
      await logActionExecution('verifyDomainApiV1TenancyTenantDomainVerifyPost', true, duration, {
        method: 'POST',
        path: '/api/v1/tenancy/tenant/domain/verify'
      })
      
      return response.data
    } catch (error) {

      const duration = Date.now() - startTime

      // Enhanced error logging
      await logActionExecution('verifyDomainApiV1TenancyTenantDomainVerifyPost', false, duration, {
        method: 'POST',
        path: '/api/v1/tenancy/tenant/domain/verify',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      
      // Throw enhanced error with context
      throw new ActionExecutionError(
        error instanceof Error ? error.message : 'Unknown error occurred',
        {
          endpoint: '/api/v1/tenancy/tenant/domain/verify',
          method: 'POST',
          timestamp: Date.now()
        },
        error
      )
    }
  })

/**
 * Get Config
 * @generated from GET /api/v1/tenancy/tenant/{tenant_id}/config
 * Features: React cache, input validation, error handling
 */
export const getConfigApiV1TenancyTenantTenantIdConfigGet = cache(
  authActionClient
    .metadata({
      name: "get-config-api-v1-tenancy-tenant-tenant-id-config-get",
      requiresAuth: true
    })
    .schema(GetConfigApiV1TenancyTenantTenantIdConfigGetParamsSchema)
    .action(async ({ parsedInput, ctx }: { parsedInput: z.infer<typeof GetConfigApiV1TenancyTenantTenantIdConfigGetParamsSchema>; ctx: { user?: any; ratelimit?: { remaining: number } } }) => {
      const startTime = Date.now()
      
      try {
      // Validate and sanitize parameters
      const validatedParams = await validateAndSanitizeInput(GetConfigApiV1TenancyTenantTenantIdConfigGetParamsSchema, parsedInput) as z.infer<typeof GetConfigApiV1TenancyTenantTenantIdConfigGetParamsSchema>

        // Execute API call with enhanced error handling
        const response = await apiClient.multiTenancy.getConfigApiV1TenancyTenantTenantIdConfigGet({params: {
path: {
        tenant_id: validatedParams.path.tenant_id
      }
    },
          config: {
            timeout: 30000,
            retries: 3,
            validateResponse: false,
            responseSchema: GetConfigApiV1TenancyTenantTenantIdConfigGetResponseSchema
          }
        })
        

        // Log successful execution
        const duration = Date.now() - startTime
        await logActionExecution('getConfigApiV1TenancyTenantTenantIdConfigGet', true, duration, {
          method: 'GET',
          path: '/api/v1/tenancy/tenant/{tenant_id}/config'
        })
        
        return response.data
      } catch (error) {

        const duration = Date.now() - startTime

        // Enhanced error logging
        await logActionExecution('getConfigApiV1TenancyTenantTenantIdConfigGet', false, duration, {
          method: 'GET',
          path: '/api/v1/tenancy/tenant/{tenant_id}/config',
          error: error instanceof Error ? error.message : 'Unknown error'
        })
        
        // Throw enhanced error with context
        throw new ActionExecutionError(
          error instanceof Error ? error.message : 'Unknown error occurred',
          {
            endpoint: '/api/v1/tenancy/tenant/{tenant_id}/config',
            method: 'GET',
            timestamp: Date.now()
          },
          error
        )
      }
    })
)

/**
 * Update Config
 * @generated from PUT /api/v1/tenancy/tenant/{tenant_id}/config
 * Features: Input validation, revalidation, error handling
 */
const UpdateConfigApiV1TenancyTenantTenantIdConfigPutInputSchema = z.object({ body: UpdateConfigApiV1TenancyTenantTenantIdConfigPutRequestSchema, params: UpdateConfigApiV1TenancyTenantTenantIdConfigPutParamsSchema })

export const updateConfigApiV1TenancyTenantTenantIdConfigPut = authActionClient
  .metadata({
    name: "update-config-api-v1-tenancy-tenant-tenant-id-config-put",
    requiresAuth: true
  })
  .schema(UpdateConfigApiV1TenancyTenantTenantIdConfigPutInputSchema)
  .action(async ({ parsedInput, ctx }: { parsedInput: z.infer<typeof UpdateConfigApiV1TenancyTenantTenantIdConfigPutInputSchema>; ctx: { user?: any; ratelimit?: { remaining: number } } }) => {
    const startTime = Date.now()
    
    try {
      // Validate and sanitize input payload
      const { body, params } = await validateAndSanitizeInput(z.object({
        body: UpdateConfigApiV1TenancyTenantTenantIdConfigPutRequestSchema,
        params: UpdateConfigApiV1TenancyTenantTenantIdConfigPutParamsSchema
      }), parsedInput)
      const validatedBody = body
      const validatedParams = params as z.infer<typeof UpdateConfigApiV1TenancyTenantTenantIdConfigPutParamsSchema>

      // Execute API call with enhanced configuration
      const response = await apiClient.multiTenancy.updateConfigApiV1TenancyTenantTenantIdConfigPut({params: {
path: {
        tenant_id: validatedParams.path.tenant_id
      }
    },
body: validatedBody,
        config: {
          timeout: 30000,
          retries: 3,
          validateResponse: false,
          responseSchema: UpdateConfigApiV1TenancyTenantTenantIdConfigPutResponseSchema
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
      updateTag('Multi-Tenancy')
      console.log('Updated tag: Multi-Tenancy')


      // Log successful execution
      const duration = Date.now() - startTime
      await logActionExecution('updateConfigApiV1TenancyTenantTenantIdConfigPut', true, duration, {
        method: 'PUT',
        path: '/api/v1/tenancy/tenant/{tenant_id}/config'
      })
      
      return response.data
    } catch (error) {

      const duration = Date.now() - startTime

      // Enhanced error logging
      await logActionExecution('updateConfigApiV1TenancyTenantTenantIdConfigPut', false, duration, {
        method: 'PUT',
        path: '/api/v1/tenancy/tenant/{tenant_id}/config',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      
      // Throw enhanced error with context
      throw new ActionExecutionError(
        error instanceof Error ? error.message : 'Unknown error occurred',
        {
          endpoint: '/api/v1/tenancy/tenant/{tenant_id}/config',
          method: 'PUT',
          timestamp: Date.now()
        },
        error
      )
    }
  })