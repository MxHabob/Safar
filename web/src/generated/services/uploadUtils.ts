'use client'

/**
 * Upload configuration
 */
export interface UploadConfig {
  maxSize?: string
  allowedTypes?: string[]
  compression?: {
    enabled: boolean
    formats?: ('gzip' | 'webp' | 'brotli')[]
  }
}

/**
 * File validation result
 */
export interface FileValidationResult {
  valid: boolean
  error?: string
}

/**
 * Upload progress information
 */
export interface UploadProgress {
  loaded: number
  total: number
  percentage: number
}

/**
 * Validate file before upload
 */
export function validateFile(file: File, config?: UploadConfig): FileValidationResult {
  const maxSizeBytes = parseSize(config?.maxSize || '100MB')
  const allowedTypes = config?.allowedTypes || ["image/*","video/*","audio/*"]

  // Check file size
  if (file.size > maxSizeBytes) {
    return {
      valid: false,
      error: `File size exceeds maximum allowed size of ${config?.maxSize || '100MB'}`
    }
  }

  // Check file type
  const isAllowed = allowedTypes.some(type => {
    if (type.endsWith('/*')) {
      const baseType = type.split('/')[0]
      return file.type.startsWith(baseType + '/')
    }
    return file.type === type
  })

  if (!isAllowed) {
    return {
      valid: false,
      error: `File type ${file.type} is not allowed. Allowed types: ${allowedTypes.join(', ')}`
    }
  }

  return { valid: true }
}

/**
 * Parse size string to bytes (e.g., "10MB" -> 10485760)
 */
function parseSize(size: string): number {
  const units: Record<string, number> = {
    B: 1,
    KB: 1024,
    MB: 1024 * 1024,
    GB: 1024 * 1024 * 1024,
  }

  const match = size.match(/^(\d+)([A-Z]+)$/i)
  if (!match) return 0

  const value = parseInt(match[1], 10)
  const unit = match[2].toUpperCase()
  return value * (units[unit] || 1)
}

/**
 * Compress file if enabled
 */
export async function compressFile(
  file: File,
  formats: ('gzip' | 'webp' | 'brotli')[] = ["gzip","webp"]
): Promise<File> {
  // Compression disabled
  
  return file
}

/**
 * Compress image to WebP format
 */
async function compressImageToWebP(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width = img.width
        canvas.height = img.height
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('Failed to get canvas context'))
          return
        }
        ctx.drawImage(img, 0, 0)
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name.replace(/\.[^.]+$/, '.webp'), {
                type: 'image/webp',
                lastModified: Date.now(),
              })
              resolve(compressedFile)
            } else {
              reject(new Error('Compression failed'))
            }
          },
          'image/webp',
          0.8 // 80% quality
        )
      }
      img.onerror = reject
      img.src = e.target?.result as string
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

/**
 * Create FormData with file and additional fields
 */
export function createUploadFormData(
  file: File,
  additionalFields?: Record<string, string | number | boolean>
): FormData {
  const formData = new FormData()
  formData.append('file', file)
  
  if (additionalFields) {
    Object.entries(additionalFields).forEach(([key, value]) => {
      formData.append(key, String(value))
    })
  }
  
  return formData
}
