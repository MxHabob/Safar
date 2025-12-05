'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Heart, MapPin, DollarSign, Trash2 } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import Image from 'next/image'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export function WishlistView() {
  const queryClient = useQueryClient()

  // TODO: Replace with actual wishlist API call when available
  const { data: wishlist, isLoading } = useQuery({
    queryKey: ['wishlist'],
    queryFn: async () => {
      // Placeholder - replace with actual API call
      return []
    },
  })

  const removeFromWishlistMutation = useMutation({
    mutationFn: async (listingId: string) => {
      // TODO: Replace with actual remove from wishlist API call
      return Promise.resolve()
    },
    onSuccess: () => {
      toast.success('Removed from wishlist')
      queryClient.invalidateQueries({ queryKey: ['wishlist'] })
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
      {wishlist.map((item: any) => (
        <Card
          key={item.id}
          className="border rounded-[18px] overflow-hidden hover:border-primary/50 transition-colors group"
        >
          <Link href={`/listings/${item.listing_id || item.id}`}>
            <div className="relative aspect-video overflow-hidden">
              {item.listing?.images?.[0] ? (
                <Image
                  src={item.listing.images[0]}
                  alt={item.listing.title || 'Listing'}
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
                    removeFromWishlistMutation.mutate(item.listing_id || item.id)
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Link>
          <CardContent className="p-4">
            <Link href={`/listings/${item.listing_id || item.id}`}>
              <h3 className="font-semibold text-lg mb-1 line-clamp-1 hover:text-primary transition-colors">
                {item.listing?.title || 'Untitled Listing'}
              </h3>
            </Link>
            {item.listing?.location && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
                <MapPin className="h-3 w-3" />
                <span className="line-clamp-1">{item.listing.location}</span>
              </div>
            )}
            <div className="flex items-center justify-between mt-3">
              <div className="flex items-baseline gap-1">
                <span className="text-lg font-bold">
                  {item.listing?.price_per_night 
                    ? `${item.listing.currency || 'USD'} ${item.listing.price_per_night}`
                    : 'N/A'}
                </span>
                <span className="text-sm text-muted-foreground">/ night</span>
              </div>
              {item.listing?.rating && (
                <Badge variant="outline" className="rounded-[18px]">
                  ⭐ {item.listing.rating}
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

