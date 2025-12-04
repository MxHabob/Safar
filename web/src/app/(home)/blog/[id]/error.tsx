'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertCircle } from 'lucide-react'
import Link from 'next/link'

/**
 * Error boundary for blog post pages
 * Handles errors when loading blog posts
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Blog post page error:', error)
  }, [error])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="max-w-md w-full space-y-4 text-center">
        <AlertCircle className="h-12 w-12 mx-auto text-destructive" />
        <h2 className="text-2xl font-bold">Failed to load blog post</h2>
        <p className="text-muted-foreground">
          {error.message || 'Unable to load the blog post. Please try again.'}
        </p>
        {error.digest && (
          <p className="text-xs text-muted-foreground">
            Error ID: {error.digest}
          </p>
        )}
        <div className="flex gap-2 justify-center">
          <Button onClick={reset} variant="default">
            Try again
          </Button>
          <Button asChild variant="outline">
            <Link href="/blog">Browse all posts</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}

