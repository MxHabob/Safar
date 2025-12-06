"use client";

import Link from "next/link";
import Image from "next/image";
import { MapPin, Star, Heart } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useListListingsApiV1ListingsGet } from "@/generated/hooks/listings";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { Home } from "lucide-react";

/**
 * Featured listings section - Showcases top accommodations
 * Modern card-based design with ratings and pricing
 */
export const FeaturedListings = () => {
  const { data, isLoading, error } = useListListingsApiV1ListingsGet(
    undefined, // skip
    6, // limit - show 6 featured listings
    undefined, // city
    undefined, // country
    undefined, // listing_type
    undefined, // min_price
    undefined, // max_price
    undefined, // min_guests
    "active" // status
  );

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="rounded-[18px] overflow-hidden">
            <Skeleton className="w-full h-64" />
            <CardContent className="p-4 space-y-3">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-1/3" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState
        icon={<Home className="h-12 w-12" />}
        title="Unable to load listings"
        description="Please try again later"
      />
    );
  }

  const listings = data?.items || [];

  if (listings.length === 0) {
    return (
      <EmptyState
        icon={<Home className="h-12 w-12" />}
        title="No listings available"
        description="Check back soon for amazing accommodations"
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl lg:text-3xl font-bold">Featured Stays</h2>
          <p className="text-muted-foreground mt-1">
            Discover unique places to stay around the world
          </p>
        </div>
        <Button asChild variant="outline" className="rounded-[18px]">
          <Link href="/listings">View All</Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {listings.map((listing) => {
          const primaryPhoto = listing.photos?.[0] || listing.images?.[0];
          const photoUrl = primaryPhoto?.url || "/images/image1.jpg";

          return (
            <Link key={listing.id} href={`/listings/${listing.slug}`}>
              <Card className="rounded-[18px] overflow-hidden hover:shadow-xl transition-all duration-300 group cursor-pointer border-2 hover:border-primary">
                <div className="relative h-64 overflow-hidden">
                  <Image
                    src={photoUrl}
                    alt={listing.title}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-500"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                  <div className="absolute top-4 right-4">
                    <Button
                      size="icon"
                      variant="secondary"
                      className="rounded-full bg-background/90 backdrop-blur-sm hover:bg-background"
                      onClick={(e) => {
                        e.preventDefault();
                        // Handle favorite toggle
                      }}
                    >
                      <Heart className="size-4" />
                    </Button>
                  </div>
                </div>
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg line-clamp-1">
                        {listing.title}
                      </h3>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                        <MapPin className="size-4" />
                        <span className="line-clamp-1">
                          {listing.city}, {listing.country}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center gap-1">
                      <Star className="size-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-semibold">{listing.rating}</span>
                      <span className="text-sm text-muted-foreground">
                        ({listing.review_count})
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-lg">
                        {listing.currency} {listing.base_price}
                      </div>
                      <div className="text-xs text-muted-foreground">per night</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

