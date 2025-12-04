import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { FileText } from 'lucide-react'

/**
 * Not found page for blog post routes
 * Shown when a blog post doesn't exist
 */
export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="max-w-md w-full space-y-4 text-center">
        <FileText className="h-12 w-12 mx-auto text-muted-foreground" />
        <h2 className="text-2xl font-bold">Blog post not found</h2>
        <p className="text-muted-foreground">
          The blog post you're looking for doesn't exist or has been removed.
        </p>
        <div className="flex gap-2 justify-center">
          <Button asChild variant="default">
            <Link href="/blog">Browse all posts</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/">Go home</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}

