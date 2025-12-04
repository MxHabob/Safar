/**
 * Next.js 16 Optimized Fetch Utilities
 * 
 * Provides fetch wrappers with proper caching strategies for optimal performance:
 * - Static data: force-cache (never revalidate)
 * - ISR data: revalidate with time-based or on-demand
 * - Dynamic data: no-store (always fresh)
 */

type FetchCacheOptions =
  | { cache: 'force-cache' } // Static - never revalidate
  | { cache: 'no-store' } // Dynamic - always fresh
  | { next: { revalidate: number } } // ISR - revalidate after X seconds
  | { next: { tags: string[] } }; // On-demand revalidation

/**
 * Fetch static data that never changes (e.g., configuration, constants)
 * Uses force-cache for maximum performance
 */
export async function fetchStatic<T>(
  url: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(url, {
    ...options,
    cache: 'force-cache',
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Fetch data with ISR (Incremental Static Regeneration)
 * Revalidates after specified seconds
 */
export async function fetchISR<T>(
  url: string,
  revalidateSeconds: number,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(url, {
    ...options,
    next: { revalidate: revalidateSeconds },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Fetch dynamic data that always needs to be fresh
 * Uses no-store to bypass cache
 */
export async function fetchDynamic<T>(
  url: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(url, {
    ...options,
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Fetch data with on-demand revalidation using tags
 * Use revalidateTag() to trigger revalidation
 */
export async function fetchWithTags<T>(
  url: string,
  tags: string[],
  options?: RequestInit
): Promise<T> {
  const response = await fetch(url, {
    ...options,
    next: { tags },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Generic fetch with explicit cache options
 */
export async function fetchWithCache<T>(
  url: string,
  cacheOptions: FetchCacheOptions,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(url, {
    ...options,
    ...cacheOptions,
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch: ${response.statusText}`);
  }

  return response.json();
}

