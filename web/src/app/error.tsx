'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertCircle } from 'lucide-react'
import Link from 'next/link'

/**
 * Global error boundary
 * Catches all unhandled errors in the app
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log error to monitoring service (e.g., Sentry)
    console.error('Global error:', error)
    
    // In production, send to error tracking service
    // if (process.env.NODE_ENV === 'production') {
    //   Sentry.captureException(error)
    // }
  }, [error])

  return (
    <html lang="en">
      <body>
        <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-background">
          <div className="max-w-md w-full space-y-4 text-center">
            <AlertCircle className="h-16 w-16 mx-auto text-destructive" />
            <h1 className="text-3xl font-bold">Something went wrong!</h1>
            <p className="text-muted-foreground">
              {error.message || 'An unexpected error occurred. Please try again.'}
            </p>
            {error.digest && (
              <p className="text-xs text-muted-foreground">
                Error ID: {error.digest}
              </p>
            )}
            <div className="flex gap-2 justify-center">
              <Button onClick={reset} variant="default" size="lg">
                Try again
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/">Go Home</Link>
              </Button>
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}

