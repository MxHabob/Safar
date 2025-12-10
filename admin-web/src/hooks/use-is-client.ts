import * as React from "react"

/**
 * Hook to check if code is running on the client-side.
 * 
 * Useful for:
 * - Avoiding hydration mismatches in Next.js
 * - Conditionally rendering client-only components
 * - Accessing browser APIs safely
 * 
 * @returns `true` if running on client-side, `false` otherwise
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const isClient = useIsClient()
 *   
 *   if (!isClient) {
 *     return <div>Loading...</div>
 *   }
 *   
 *   return <div>Client-only content</div>
 * }
 * ```
 */
export function useIsClient() {
  const [isClient, setIsClient] = React.useState(false)

  React.useEffect(() => {
    setIsClient(true)
  }, [])

  return isClient
}

