import { z } from 'zod'
import { defaultMiddleware } from '@/generated/client/middleware'
import { BaseApiClient } from './base'
import type { RequestConfiguration } from './base'
import {
  UploadFileApiV1FilesUploadPostRequestSchema,
  UploadFileApiV1FilesUploadPostResponseSchema,
  UploadFileApiV1FilesUploadPostParamsSchema,
  UploadMultipleFilesApiV1FilesUploadMultiplePostRequestSchema,
  UploadMultipleFilesApiV1FilesUploadMultiplePostResponseSchema,
  UploadMultipleFilesApiV1FilesUploadMultiplePostParamsSchema
} from '@/generated/schemas'

export class FilesApiClient extends BaseApiClient {
  constructor() {
    super()
    
    // Add tag-specific middleware
    this.addMiddleware({
      name: 'files-context',
      onRequest: async (config) => {
        return {
          ...config,
          headers: {
            ...config.headers,
            'X-API-Context': 'files'
          }
        }
      }
    })
  }

  /**
   * Upload File
   * Upload a single file and return its metadata.
   * @param options - Request options
   * @returns Promise<ClientResponse<z.infer<typeof UploadFileApiV1FilesUploadPostResponseSchema>>>
   * @example
   * const result = await client.uploadFileApiV1FilesUploadPost({
   *   config: { timeout: 5000 }
   * })
   */
  uploadFileApiV1FilesUploadPost = async (options: {
    params: z.infer<typeof UploadFileApiV1FilesUploadPostParamsSchema>
    body: z.infer<typeof UploadFileApiV1FilesUploadPostRequestSchema>
    config?: RequestConfiguration
  }) => {
    // Validate request body
    const validatedBody = await UploadFileApiV1FilesUploadPostRequestSchema.parseAsync(options.body)
// Validate and extract parameters
const validatedParams = await UploadFileApiV1FilesUploadPostParamsSchema.parseAsync(options.params)

    return this.request<z.infer<typeof UploadFileApiV1FilesUploadPostResponseSchema>>(
      'POST',
      '/api/v1/files/upload',
      {
queryParams: validatedParams.query,
body: validatedBody,
config: { ...options?.config, middleware: [...defaultMiddleware, ...(options?.config?.middleware || [])] },
responseSchema: UploadFileApiV1FilesUploadPostResponseSchema
      }
    )
  }

  /**
   * Upload Multiple Files
   * Upload multiple files in a single request and return their metadata.
   * @param options - Request options
   * @returns Promise<ClientResponse<z.infer<typeof UploadMultipleFilesApiV1FilesUploadMultiplePostResponseSchema>>>
   * @example
   * const result = await client.uploadMultipleFilesApiV1FilesUploadMultiplePost({
   *   config: { timeout: 5000 }
   * })
   */
  uploadMultipleFilesApiV1FilesUploadMultiplePost = async (options: {
    params: z.infer<typeof UploadMultipleFilesApiV1FilesUploadMultiplePostParamsSchema>
    body: z.infer<typeof UploadMultipleFilesApiV1FilesUploadMultiplePostRequestSchema>
    config?: RequestConfiguration
  }) => {
    // Validate request body
    const validatedBody = await UploadMultipleFilesApiV1FilesUploadMultiplePostRequestSchema.parseAsync(options.body)
// Validate and extract parameters
const validatedParams = await UploadMultipleFilesApiV1FilesUploadMultiplePostParamsSchema.parseAsync(options.params)

    return this.request<z.infer<typeof UploadMultipleFilesApiV1FilesUploadMultiplePostResponseSchema>>(
      'POST',
      '/api/v1/files/upload-multiple',
      {
queryParams: validatedParams.query,
body: validatedBody,
config: { ...options?.config, middleware: [...defaultMiddleware, ...(options?.config?.middleware || [])] },
responseSchema: UploadMultipleFilesApiV1FilesUploadMultiplePostResponseSchema
      }
    )
  }
}