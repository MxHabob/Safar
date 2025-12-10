"use client";

import Link from "next/link";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, Star } from "lucide-react";
import Graphic from "@/components/shared/graphic";
import { useListListingsApiV1ListingsGet } from "@/generated/hooks/listings";
import type { ListingListResponse } from "@/generated/schemas";

interface HostProfileViewProps {
  hostId: string;
  initialData?: ListingListResponse;
}

/**
 * Host profile view
 * Shows host information and their listings
 */
export const HostProfileView = ({ hostId, initialData }: HostProfileViewProps) => {
  // Fetch host's listings
  // Note: Currently fetches all active listings, should filter by host_id when API supports it
  const { data, isLoading } = useListListingsApiV1ListingsGet(
    0,
    12,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    "active",
    {
      initialData
    }
  );

  const listings = data?.items || [];

  return (
    <div className="min-h-screen w-full">
      <div className="w-full max-w-7xl mx-auto px-3 lg:px-6 py-8 lg:py-12 space-y-12">
        {/* Host Header */}
        <div className="space-y-6">
          <div className="flex items-center gap-6">
            <Skeleton className="size-24 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
        </div>

        {/* Host Listings */}
        <section className="space-y-6">
          <div className="flex items-baseline gap-4">
            <h2 className="text-3xl lg:text-4xl font-light tracking-tight">
              Listings
            </h2>
            <div className="flex-1 h-px bg-border" />
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-96 rounded-[18px]" />
              ))}
            </div>
          ) : listings.length === 0 ? (
            <Card className="rounded-[18px] border border-border">
              <CardContent className="p-12 text-center">
                <p className="text-muted-foreground font-light">
                  No listings found for this host.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {listings.map((listing) => {
                const primaryPhoto = listing.photos?.[0] || listing.images?.[0];
                const photoUrl = (primaryPhoto?.url || "/images/image1.jpg").trim();

                if (!photoUrl) return null;

                return (
                  <Link
                    key={listing.id}
                    href={`/listings/${listing.id}`}
                    className="group relative overflow-hidden rounded-[18px] bg-card border border-border hover:border-foreground/20 transition-all duration-500 block"
                  >
                    <div className="absolute top-0 left-0 size-[18px] z-10">
                      <Graphic />
                    </div>

                    <div className="relative h-64 overflow-hidden">
                      <Image
                        src={photoUrl}
                        alt={listing.title || "Listing"}
                        fill
                        quality={75}
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                    </div>

                    <div className="p-6 space-y-3">
                      <h3 className="text-xl font-light line-clamp-1">
                        {listing.title}
                      </h3>
                      <p className="text-sm text-muted-foreground font-light flex items-center gap-1">
                        <MapPin className="size-3" />
                        {listing.city}, {listing.country}
                      </p>
                      <div className="flex items-center justify-between pt-2 border-t border-border">
                        <div className="flex items-center gap-1 text-sm">
                          <Star className="size-4 fill-foreground/20 text-foreground/40" />
                          <span className="font-light">{listing.rating}</span>
                        </div>
                        <div className="text-right">
                          <div className="font-light text-lg">
                            {listing.currency} {listing.base_price}
                          </div>
                          <div className="text-xs text-muted-foreground font-light">
                            per night
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export const HostProfileLoading = () => {
  return (
    <div className="min-h-screen w-full">
      <div className="w-full max-w-7xl mx-auto px-3 lg:px-6 py-8 lg:py-12 space-y-12">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-96 w-full rounded-[18px]" />
      </div>
    </div>
  );
};

