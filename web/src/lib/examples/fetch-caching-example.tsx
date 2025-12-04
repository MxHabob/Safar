/**
 * Next.js 16 Fetch Caching Examples
 * 
 * Demonstrates proper fetch caching strategies for optimal performance.
 * 
 * Key strategies:
 * - Static data: force-cache (never changes)
 * - ISR data: revalidate with time (updates periodically)
 * - Dynamic data: no-store (always fresh)
 * - Tagged data: on-demand revalidation
 */

import { fetchStatic, fetchISR, fetchDynamic, fetchWithTags } from '@/lib/utils/fetch'

/**
 * Example 1: Static Data (Configuration, Constants)
 * 
 * Use for data that never changes (e.g., app config, constants)
 * This is cached forever until next deployment
 */
export async function getAppConfig() {
  // Static data - cached forever
  return fetchStatic<{ theme: string; features: string[] }>(
    'https://api.example.com/config'
  )
}

/**
 * Example 2: ISR Data (Travel Guides, Blog Posts)
 * 
 * Use for data that changes occasionally but doesn't need to be real-time
 * Revalidates every 3600 seconds (1 hour)
 * 
 * Perfect for: Blog posts, travel guides, product listings
 */
export async function getTravelGuides() {
  // ISR - revalidates every hour
  return fetchISR<Array<{ id: string; title: string }>>(
    'https://api.example.com/travel-guides',
    3600 // 1 hour
  )
}

/**
 * Example 3: Dynamic Data (User Profile, Real-time Data)
 * 
 * Use for data that must always be fresh (user data, real-time stats)
 * Always fetches fresh data, never cached
 */
export async function getUserProfile(userId: string) {
  // Dynamic - always fresh
  return fetchDynamic<{ name: string; email: string }>(
    `https://api.example.com/users/${userId}`
  )
}

/**
 * Example 4: Tagged Data (On-demand Revalidation)
 * 
 * Use for data that needs to be revalidated on-demand
 * Call revalidateTag('posts') after mutations
 * 
 * Perfect for: Content that changes after user actions
 */
export async function getPosts() {
  // Tagged - can be revalidated on-demand
  return fetchWithTags<Array<{ id: string; title: string }>>(
    'https://api.example.com/posts',
    ['posts'] // Tag for on-demand revalidation
  )
}

/**
 * Example 5: Server Component with Proper Caching
 * 
 * This is how you'd use it in a Server Component
 */
export default async function TravelGuidesPage() {
  // This data is cached for 1 hour
  const guides = await fetchISR<Array<{ id: string; title: string }>>(
    'https://api.example.com/travel-guides',
    3600
  )

  return (
    <div>
      <h1>Travel Guides</h1>
      {guides.map((guide) => (
        <div key={guide.id}>{guide.title}</div>
      ))}
    </div>
  )
}

/**
 * Example 6: Combining Static and Dynamic Data
 * 
 * Mix static shell with dynamic content for optimal performance
 */
export async function TravelGuidePage({ id }: { id: string }) {
  // Static metadata - cached forever
  const metadata = await fetchStatic<{ title: string; description: string }>(
    `https://api.example.com/guides/${id}/metadata`
  )

  // Dynamic content - always fresh
  const content = await fetchDynamic<{ body: string }>(
    `https://api.example.com/guides/${id}/content`
  )

  return (
    <article>
      <h1>{metadata.title}</h1>
      <p>{metadata.description}</p>
      <div>{content.body}</div>
    </article>
  )
}

