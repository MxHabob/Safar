/**
 * Next.js 16 Server Actions Examples
 * 
 * This file demonstrates best practices for Server Actions in Next.js 16.
 * Server Actions reduce client-side JavaScript and improve performance.
 * 
 * Key benefits:
 * - Zero client-side JavaScript for form submissions
 * - Automatic revalidation of cached data
 * - Built-in error handling
 * - Type-safe with TypeScript
 */

'use server'

import { revalidateTag, revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

/**
 * Example: Simple Server Action with useActionState
 * 
 * Usage in component:
 * ```tsx
 * 'use client'
 * import { useActionState } from 'react'
 * 
 * const [state, formAction] = useActionState(createPost, null)
 * 
 * <form action={formAction}>
 *   <input name="title" />
 *   <button type="submit">Create</button>
 * </form>
 * ```
 */
export async function createPost(
  prevState: { error?: string } | null,
  formData: FormData
): Promise<{ error?: string } | null> {
  const title = formData.get('title') as string

  if (!title || title.trim().length === 0) {
    return { error: 'Title is required' }
  }

  try {
    // Call your API or database
    // const response = await fetch(...)
    
    // Revalidate the posts page
    revalidatePath('/posts')
    revalidateTag('posts')
    
    // Redirect to the new post
    redirect(`/posts/${title}`)
  } catch (error) {
    return { error: 'Failed to create post' }
  }
}

/**
 * Example: Server Action with optimistic updates
 * 
 * For better UX, you can use useOptimistic hook on the client side
 */
export async function updatePost(
  id: string,
  formData: FormData
): Promise<{ success: boolean; error?: string }> {
  const title = formData.get('title') as string

  try {
    // Update post logic here
    
    // Revalidate specific paths
    revalidatePath(`/posts/${id}`)
    revalidatePath('/posts')
    
    return { success: true }
  } catch (error) {
    return { success: false, error: 'Failed to update post' }
  }
}

/**
 * Example: Server Action with file upload
 */
export async function uploadPhoto(formData: FormData) {
  const file = formData.get('file') as File

  if (!file) {
    return { error: 'No file provided' }
  }

  try {
    // Upload file logic here
    // const uploadResponse = await uploadToS3(file)
    
    // Revalidate photos page
    revalidateTag('photos')
    
    return { success: true, url: 'https://example.com/photo.jpg' }
  } catch (error) {
    return { error: 'Failed to upload photo' }
  }
}

/**
 * Example: Server Action with authentication check
 */
export async function deletePost(id: string) {
  // Check authentication (you'd use your auth system here)
  // const user = await getCurrentUser()
  // if (!user) throw new Error('Unauthorized')

  try {
    // Delete logic here
    
    // Revalidate paths
    revalidatePath('/posts')
    revalidateTag('posts')
    
    return { success: true }
  } catch (error) {
    return { error: 'Failed to delete post' }
  }
}

