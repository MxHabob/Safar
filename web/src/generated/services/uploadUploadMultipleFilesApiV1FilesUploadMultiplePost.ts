'use client'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { uploadMultipleFilesApiV1FilesUploadMultiplePost } from '@/generated/actions'
import { validateFile, compressFile, type UploadConfig } from '@/generated/services/uploadUtils'
import type { z } from 'zod'
import type { UploadMultipleFilesApiV1FilesUploadMultiplePostResponseSchema } from '@/generated/schemas'


/**
 * Upload via backend API with progress tracking
 * Uses XMLHttpRequest for progress tracking support
 */
async function uploadViaBackendApi(
  formData: FormData,
  onProgress?: (progress: { loaded: number; total: number; percentage: number }) => void
): Promise<z.infer<typeof UploadMultipleFilesApiV1FilesUploadMultiplePostResponseSchema>> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()

    if (onProgress) {
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const percentage = Math.round((event.loaded / event.total) * 100)
          onProgress({
            loaded: event.loaded,
            total: event.total,
            percentage,
          })
        }
      })
    }

    xhr.addEventListener('load', () => {
      const responseBody = xhr.response ?? xhr.responseText
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = typeof responseBody === 'string' ? JSON.parse(responseBody) : responseBody
          resolve(data)
        } catch (error) {
          reject(new Error('Failed to parse response'))
        }
      } else {
        const detail =
          typeof responseBody === 'object' && responseBody !== null && 'detail' in responseBody
            ? (responseBody as { detail?: string }).detail
            : undefined
        reject(new Error(detail || xhr.statusText || 'Upload failed'))
      }
    })

    xhr.addEventListener('error', () => {
      reject(new Error('Network error while uploading to backend'))
    })

    xhr.addEventListener('abort', () => {
      reject(new Error('Backend upload aborted'))
    })

    xhr.responseType = 'json'
    // Use base URL from environment or configuration
    const baseUrl = typeof window !== 'undefined' 
      ? (process.env.NEXT_PUBLIC_API_URL || 'https://safar.mulverse.com')
      : 'https://safar.mulverse.com'
    xhr.open('POST', `${baseUrl}/api/v1/files/upload-multiple`)
    xhr.send(formData)
  })
}


type ActionResultLike<T> = {
  data?: T
  serverError?: unknown
  validationErrors?: unknown
}

async function resolveActionResult<T>(actionPromise: Promise<any>): Promise<T> {
  const result = await actionPromise
  if (result && typeof result === 'object') {
    const actionResult = result as ActionResultLike<T>
    if (actionResult.serverError) {
      const message = typeof actionResult.serverError === 'string' ? actionResult.serverError : 'Server action failed'
      throw new Error(message)
    }
    if (actionResult.validationErrors) {
      throw new Error('Validation failed, please check your input')
    }
    if (typeof actionResult.data !== 'undefined') {
      return actionResult.data as T
    }
  }
  return result as T
}

/**
 * Upload hook for POST /api/v1/files/upload-multiple
 * Features: File validation, compression, progress tracking
 * 
 * Best Practice: Standard FormData upload with progress tracking
 */
export type UploadMultipleFilesApiV1FilesUploadMultiplePostUploadInput = {
  files: File[]
  additionalFields?: Record<string, string | number | boolean>
  folder?: string
}



export function useUploadMultipleFilesApiV1FilesUploadMultiplePostMutationUpload(options?: {
  onSuccess?: (data: z.infer<typeof UploadMultipleFilesApiV1FilesUploadMultiplePostResponseSchema>) => void
  onError?: (error: Error) => void
  onProgress?: (progress: { loaded: number; total: number; percentage: number }) => void
  uploadConfig?: UploadConfig
}) {
  const queryClient = useQueryClient()

  return useMutation<z.infer<typeof UploadMultipleFilesApiV1FilesUploadMultiplePostResponseSchema>, Error, UploadMultipleFilesApiV1FilesUploadMultiplePostUploadInput>({
    mutationFn: async ({ files, additionalFields, folder }: UploadMultipleFilesApiV1FilesUploadMultiplePostUploadInput) => {
      
      // Validate all files
      for (const file of files) {
        const validation = validateFile(file, options?.uploadConfig)
        if (!validation.valid) {
          throw new Error(validation.error || `File validation failed for ${file.name}`)
        }
      }

      // Compress files if enabled
      const processedFiles = await Promise.all(
        files.map(file => compressFile(file, options?.uploadConfig?.compression?.formats))
      )

      // Create FormData with all files
      const formData = new FormData()
      processedFiles.forEach((file, index) => {
        formData.append(`file_${index}`, file)
      })
      
      if (additionalFields) {
        Object.entries(additionalFields).forEach(([key, value]) => {
          formData.append(key, String(value))
        })
      }

      // Convert FormData to the format expected by the action
      const actionInput = {
        body: formData as any,
        params: {
          query: folder ? { folder } : undefined
        }
      }
      
      // Use server action for upload and extract data from SafeActionResult
      const result = await resolveActionResult<z.infer<typeof UploadMultipleFilesApiV1FilesUploadMultiplePostResponseSchema>>(
        uploadMultipleFilesApiV1FilesUploadMultiplePost(actionInput as any)
      )
      return result
    },
    
    onSuccess: (data: z.infer<typeof UploadMultipleFilesApiV1FilesUploadMultiplePostResponseSchema>) => {
      // Don't show toast here, let the page handle it
      options?.onSuccess?.(data)
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['Files'] })
    },
    
    onError: (error: Error) => {
      toast.error(error.message || 'Upload failed')
      options?.onError?.(error)
    },
  })
}
