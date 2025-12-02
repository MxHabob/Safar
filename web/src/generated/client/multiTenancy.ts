import { z } from 'zod'
import { cache } from 'react'
import { BaseApiClient } from './base'
import type { ClientResponse, RequestConfiguration } from './base'
import { defaultMiddleware } from './middleware'
import {
  GetCurrentTenantApiV1TenancyTenantGetResponseSchema,
  CreateTenantApiV1TenancyTenantPostResponseSchema,
  CreateTenantApiV1TenancyTenantPostParamsSchema,
  UpdateBrandingApiV1TenancyTenantTenantIdBrandingPutResponseSchema,
  UpdateBrandingApiV1TenancyTenantTenantIdBrandingPutParamsSchema,
  AddCustomDomainApiV1TenancyTenantTenantIdDomainPostResponseSchema,
  AddCustomDomainApiV1TenancyTenantTenantIdDomainPostParamsSchema,
  VerifyDomainApiV1TenancyTenantDomainVerifyPostResponseSchema,
  VerifyDomainApiV1TenancyTenantDomainVerifyPostParamsSchema,
  GetConfigApiV1TenancyTenantTenantIdConfigGetResponseSchema,
  GetConfigApiV1TenancyTenantTenantIdConfigGetParamsSchema,
  UpdateConfigApiV1TenancyTenantTenantIdConfigPutRequestSchema,
  UpdateConfigApiV1TenancyTenantTenantIdConfigPutResponseSchema,
  UpdateConfigApiV1TenancyTenantTenantIdConfigPutParamsSchema
} from '@/generated/schemas'

export class MultiTenancyApiClient extends BaseApiClient {
  constructor() {
    super()
    
    // Add tag-specific middleware
    this.addMiddleware({
      name: 'multiTenancy-context',
      onRequest: async (config) => {
        return {
          ...config,
          headers: {
            ...config.headers,
            'X-API-Context': 'multiTenancy'
          }
        }
      }
    })
  }

  /**
   * Get Current Tenant
   * Get current tenant based on domain or header.
   * @param options - Request options
   * @returns Promise<ClientResponse<z.infer<typeof GetCurrentTenantApiV1TenancyTenantGetResponseSchema>>>
   * @example
   * const result = await client.getCurrentTenantApiV1TenancyTenantGet({
   *   config: { timeout: 5000 }
   * })
   */
  getCurrentTenantApiV1TenancyTenantGet = cache(async (options?: { config?: RequestConfiguration }) => {
    return this.request<z.infer<typeof GetCurrentTenantApiV1TenancyTenantGetResponseSchema>>(
      'GET',
      '/api/v1/tenancy/tenant',
      {
config: { ...options?.config, middleware: [...defaultMiddleware, ...(options?.config?.middleware || [])] },
responseSchema: GetCurrentTenantApiV1TenancyTenantGetResponseSchema
      }
    )
  })

  /**
   * Create Tenant
   * Create a new tenant (admin only).
   * @param options - Request options
   * @returns Promise<ClientResponse<z.infer<typeof CreateTenantApiV1TenancyTenantPostResponseSchema>>>
   * @example
   * const result = await client.createTenantApiV1TenancyTenantPost({
   *   config: { timeout: 5000 }
   * })
   */
  createTenantApiV1TenancyTenantPost = async (options: {
    params: z.infer<typeof CreateTenantApiV1TenancyTenantPostParamsSchema>
    config?: RequestConfiguration
  }) => {
// Validate and extract parameters
const validatedParams = await CreateTenantApiV1TenancyTenantPostParamsSchema.parseAsync(options.params)

    return this.request<z.infer<typeof CreateTenantApiV1TenancyTenantPostResponseSchema>>(
      'POST',
      '/api/v1/tenancy/tenant',
      {
queryParams: validatedParams.query,
config: { ...options?.config, middleware: [...defaultMiddleware, ...(options?.config?.middleware || [])] },
responseSchema: CreateTenantApiV1TenancyTenantPostResponseSchema
      }
    )
  }

  /**
   * Update Branding
   * Update tenant branding.
   * @param options - Request options
   * @returns Promise<ClientResponse<z.infer<typeof UpdateBrandingApiV1TenancyTenantTenantIdBrandingPutResponseSchema>>>
   * @example
   * const result = await client.updateBrandingApiV1TenancyTenantTenantIdBrandingPut({
   *   config: { timeout: 5000 }
   * })
   */
  updateBrandingApiV1TenancyTenantTenantIdBrandingPut = async (options: {
    params: z.infer<typeof UpdateBrandingApiV1TenancyTenantTenantIdBrandingPutParamsSchema>
    config?: RequestConfiguration
  }) => {
// Validate and extract parameters
const validatedParams = await UpdateBrandingApiV1TenancyTenantTenantIdBrandingPutParamsSchema.parseAsync(options.params)

    return this.request<z.infer<typeof UpdateBrandingApiV1TenancyTenantTenantIdBrandingPutResponseSchema>>(
      'PUT',
      '/api/v1/tenancy/tenant/{tenant_id}/branding',
      {
        pathParams: validatedParams.path,
queryParams: validatedParams.query,
config: { ...options?.config, middleware: [...defaultMiddleware, ...(options?.config?.middleware || [])] },
responseSchema: UpdateBrandingApiV1TenancyTenantTenantIdBrandingPutResponseSchema
      }
    )
  }

  /**
   * Add Custom Domain
   * Add a custom domain for a tenant.
   * @param options - Request options
   * @returns Promise<ClientResponse<z.infer<typeof AddCustomDomainApiV1TenancyTenantTenantIdDomainPostResponseSchema>>>
   * @example
   * const result = await client.addCustomDomainApiV1TenancyTenantTenantIdDomainPost({
   *   config: { timeout: 5000 }
   * })
   */
  addCustomDomainApiV1TenancyTenantTenantIdDomainPost = async (options: {
    params: z.infer<typeof AddCustomDomainApiV1TenancyTenantTenantIdDomainPostParamsSchema>
    config?: RequestConfiguration
  }) => {
// Validate and extract parameters
const validatedParams = await AddCustomDomainApiV1TenancyTenantTenantIdDomainPostParamsSchema.parseAsync(options.params)

    return this.request<z.infer<typeof AddCustomDomainApiV1TenancyTenantTenantIdDomainPostResponseSchema>>(
      'POST',
      '/api/v1/tenancy/tenant/{tenant_id}/domain',
      {
        pathParams: validatedParams.path,
queryParams: validatedParams.query,
config: { ...options?.config, middleware: [...defaultMiddleware, ...(options?.config?.middleware || [])] },
responseSchema: AddCustomDomainApiV1TenancyTenantTenantIdDomainPostResponseSchema
      }
    )
  }

  /**
   * Verify Domain
   * Verify a custom domain.
   * @param options - Request options
   * @returns Promise<ClientResponse<z.infer<typeof VerifyDomainApiV1TenancyTenantDomainVerifyPostResponseSchema>>>
   * @example
   * const result = await client.verifyDomainApiV1TenancyTenantDomainVerifyPost({
   *   config: { timeout: 5000 }
   * })
   */
  verifyDomainApiV1TenancyTenantDomainVerifyPost = async (options: {
    params: z.infer<typeof VerifyDomainApiV1TenancyTenantDomainVerifyPostParamsSchema>
    config?: RequestConfiguration
  }) => {
// Validate and extract parameters
const validatedParams = await VerifyDomainApiV1TenancyTenantDomainVerifyPostParamsSchema.parseAsync(options.params)

    return this.request<z.infer<typeof VerifyDomainApiV1TenancyTenantDomainVerifyPostResponseSchema>>(
      'POST',
      '/api/v1/tenancy/tenant/domain/verify',
      {
queryParams: validatedParams.query,
config: { ...options?.config, middleware: [...defaultMiddleware, ...(options?.config?.middleware || [])] },
responseSchema: VerifyDomainApiV1TenancyTenantDomainVerifyPostResponseSchema
      }
    )
  }

  /**
   * Get Config
   * Get tenant configuration.
   * @param options - Request options
   * @returns Promise<ClientResponse<z.infer<typeof GetConfigApiV1TenancyTenantTenantIdConfigGetResponseSchema>>>
   * @example
   * const result = await client.getConfigApiV1TenancyTenantTenantIdConfigGet({
   *   config: { timeout: 5000 }
   * })
   */
  getConfigApiV1TenancyTenantTenantIdConfigGet = cache(async (options: {
    params: z.infer<typeof GetConfigApiV1TenancyTenantTenantIdConfigGetParamsSchema>
    config?: RequestConfiguration
  }) => {
// Validate and extract parameters
const validatedParams = await GetConfigApiV1TenancyTenantTenantIdConfigGetParamsSchema.parseAsync(options.params)

    return this.request<z.infer<typeof GetConfigApiV1TenancyTenantTenantIdConfigGetResponseSchema>>(
      'GET',
      '/api/v1/tenancy/tenant/{tenant_id}/config',
      {
        pathParams: validatedParams.path,
config: { ...options?.config, middleware: [...defaultMiddleware, ...(options?.config?.middleware || [])] },
responseSchema: GetConfigApiV1TenancyTenantTenantIdConfigGetResponseSchema
      }
    )
  })

  /**
   * Update Config
   * Update tenant configuration.
   * @param options - Request options
   * @returns Promise<ClientResponse<z.infer<typeof UpdateConfigApiV1TenancyTenantTenantIdConfigPutResponseSchema>>>
   * @example
   * const result = await client.updateConfigApiV1TenancyTenantTenantIdConfigPut({
   *   config: { timeout: 5000 }
   * })
   */
  updateConfigApiV1TenancyTenantTenantIdConfigPut = async (options: {
    params: z.infer<typeof UpdateConfigApiV1TenancyTenantTenantIdConfigPutParamsSchema>
    body: z.infer<typeof UpdateConfigApiV1TenancyTenantTenantIdConfigPutRequestSchema>
    config?: RequestConfiguration
  }) => {
    // Validate request body
    const validatedBody = await UpdateConfigApiV1TenancyTenantTenantIdConfigPutRequestSchema.parseAsync(options.body)
// Validate and extract parameters
const validatedParams = await UpdateConfigApiV1TenancyTenantTenantIdConfigPutParamsSchema.parseAsync(options.params)

    return this.request<z.infer<typeof UpdateConfigApiV1TenancyTenantTenantIdConfigPutResponseSchema>>(
      'PUT',
      '/api/v1/tenancy/tenant/{tenant_id}/config',
      {
        pathParams: validatedParams.path,
body: validatedBody,
config: { ...options?.config, middleware: [...defaultMiddleware, ...(options?.config?.middleware || [])] },
responseSchema: UpdateConfigApiV1TenancyTenantTenantIdConfigPutResponseSchema
      }
    )
  }
}