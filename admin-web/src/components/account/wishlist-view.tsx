'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Heart, MapPin, Trash2 } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import Image from 'next/image'
import { toast } from 'sonner'
import { useListListingsApiV1ListingsGet } from '@/generated/hooks/listings'

export function WishlistView() {
  const queryClient = useQueryClient()

  // Note: Wishlist API endpoint not available yet
  // Using listings API with a filter for wishlist items
  // TODO: Replace with actual wishlist API when available (e.g., getWishlistApiV1WishlistGet)
  const { data: wishlistData, isLoading } = useListListingsApiV1ListingsGet(
    0, // skip
    50, // limit
    undefined, // city
    undefined, // country
    undefined, // listing_type
    undefined, // min_price
    undefined, // max_price
    undefined, // min_guests
    "active" // status
  )

  // Extract wishlist items from response
  // In production, this should come from a dedicated wishlist endpoint
  const wishlist = wishlistData?.items?.slice(0, 10) || [] // Temporary: show first 10 as wishlist

  const removeFromWishlistMutation = useMutation({
    mutationFn: async (listingId: string) => {
      // TODO: Replace with actual remove from wishlist API call when available
      // Example: await removeFromWishlistApiV1WishlistListingIdDelete({ path: { listing_id: listingId } })
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500))
      return Promise.resolve()
    },
    onSuccess: () => {
      toast.success('Removed from wishlist')
      queryClient.invalidateQueries({ queryKey: ['wishlist'] })
      queryClient.invalidateQueries({ queryKey: ['listings'] })
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to remove from wishlist')
    },
  })

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i} className="border rounded-[18px] animate-pulse overflow-hidden">
            <div className="aspect-video bg-muted" />
            <CardContent className="p-4">
              <div className="h-4 bg-muted rounded w-3/4 mb-2" />
              <div className="h-4 bg-muted rounded w-1/2" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!wishlist || wishlist.length === 0) {
    return (
      <Card className="border rounded-[18px]">
        <CardContent className="p-12">
          <div className="flex flex-col items-center justify-center text-center space-y-4">
            <p className="text-lg font-semibold">Your wishlist is empty</p>
            <p className="text-sm text-muted-foreground">
              Start saving your favorite listings to your wishlist!
            </p>
            <Link href="/listings">
              <Button className="rounded-[18px]">
                Browse Listings
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {wishlist.map((item) => (
        <Card
          key={item.id}
          className="border rounded-[18px] overflow-hidden hover:border-primary/50 transition-colors group"
        >
          <Link href={`/listings/${item.id}`}>
            <div className="relative aspect-video overflow-hidden">
              {item.images?.[0]?.url || item.photos?.[0]?.url ? (
                <Image
                  src={(item.images?.[0]?.url || item.photos?.[0]?.url) as string}
                  alt={item.title || 'Listing'}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full bg-muted flex items-center justify-center">
                  <Heart className="h-12 w-12 text-muted-foreground/30" />
                </div>
              )}
              <div className="absolute top-2 right-2">
                <Button
                  size="sm"
                  variant="secondary"
                  className="rounded-[18px] bg-background/80 backdrop-blur-sm hover:bg-background"
                  onClick={(e) => {
                    e.preventDefault()
                    removeFromWishlistMutation.mutate(String(item.id || ''))
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Link>
          <CardContent className="p-4">
            <Link href={`/listings/${item.id}`}>
              <h3 className="font-semibold text-lg mb-1 line-clamp-1 hover:text-primary transition-colors">
                {item.title || 'Untitled Listing'}
              </h3>
            </Link>
            {(item.city || item.country) && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
                <MapPin className="h-3 w-3" />
                <span className="line-clamp-1">
                  {[item.city, item.country].filter(Boolean).join(', ')}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between mt-3">
              <div className="flex items-baseline gap-1">
                <span className="text-lg font-bold">
                  {item.base_price 
                    ? `${item.currency || 'USD'} ${item.base_price}`
                    : 'N/A'}
                </span>
                <span className="text-sm text-muted-foreground">/ night</span>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

