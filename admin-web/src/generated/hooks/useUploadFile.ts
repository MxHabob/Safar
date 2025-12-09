'use client'

import { useMutation } from '@tanstack/react-query'
import { validateFile, compressFile, createUploadFormData, type UploadConfig } from '@/generated/services/uploadUtils'

/**
 * Generic file upload hook
 * Supports: UploadThing, Vercel Blob, or standard FormData
 */
export type UploadInput = {
  file: File
  additionalFields?: Record<string, string | number | boolean>
}

export function useUploadFile(options?: {
  onSuccess?: (url: string) => void
  onError?: (error: Error) => void
  onProgress?: (progress: { loaded: number; total: number; percentage: number }) => void
  uploadConfig?: UploadConfig
}) {
  return useMutation<string, Error, UploadInput>({
    mutationFn: async ({ file, additionalFields }: UploadInput) => {
      // Validate file
      const validation = validateFile(file, options?.uploadConfig)
      if (!validation.valid) {
        throw new Error(validation.error || 'File validation failed')
      }

      // Compress if enabled
      const processedFile = await compressFile(file, options?.uploadConfig?.compression?.formats)

      // Standard FormData upload - Use generated upload endpoint
      // Note: This requires a file upload endpoint in your OpenAPI schema
      const formData = createUploadFormData(processedFile, additionalFields)
      
      // Use generated API client instead of local API
      // Mulink will generate the upload endpoint from your OpenAPI schema
      const { apiClient } = await import('@/generated/client')
      
      // Try to find upload endpoint in generated client
      try {
        
        // Use the detected upload endpoint
        const response = await apiClient.files?.uploadFileApiV1FilesUploadPost?.({
          body: formData as any,
          params: { query: {} }
        })
        return response?.data?.url || response?.data?.file_url || response?.data?.url || ''
      } catch (error) {
        console.warn('[Mulink] Upload endpoint not found in generated client, using fallback')
        throw new Error('Upload endpoint not found. Please add a file upload endpoint to your OpenAPI schema.')
      }
    },
    onSuccess: (url) => {
      options?.onSuccess?.(url)
    },
    onError: (error: Error) => {
      options?.onError?.(error)
    },
  })
}