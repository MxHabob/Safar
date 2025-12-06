"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Search, MapPin, Star } from "lucide-react";
import { useListListingsApiV1ListingsGet } from "@/generated/hooks/listings";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import Graphic from "@/components/shared/graphic";

/**
 * Search results view
 * Displays filtered listings based on search parameters
 */
export const SearchResultsView = () => {
  const searchParams = useSearchParams();
  const destination = searchParams?.get("destination") || "";
  const checkIn = searchParams?.get("check_in") || "";
  const checkOut = searchParams?.get("check_out") || "";
  const guests = searchParams?.get("guests") || "";

  // Extract city/country from destination if possible
  const city = destination.split(",")[0]?.trim() || "";
  const country = destination.split(",")[1]?.trim() || "";

  const { data, isLoading, error } = useListListingsApiV1ListingsGet(
    0,
    24,
    city || undefined,
    country || undefined,
    undefined,
    undefined,
    undefined,
    guests ? parseInt(guests) : undefined,
    "active"
  );

  if (isLoading) {
    return <SearchResultsLoading />;
  }

  if (error) {
    return (
      <EmptyState
        icon={<Search className="h-12 w-12" />}
        title="Search error"
        description="Unable to perform search. Please try again."
      />
    );
  }

  const listings = data?.items || [];
  const total = data?.total || 0;

  return (
    <div className="space-y-8">
      {/* Search Header */}
      <div className="space-y-4">
        <div className="flex items-baseline gap-4">
          <h1 className="text-3xl lg:text-4xl font-light tracking-tight">
            Search Results
          </h1>
          <div className="flex-1 h-px bg-border" />
        </div>

        {destination && (
          <div className="text-sm text-muted-foreground font-light">
            Searching for: <span className="text-foreground">{destination}</span>
            {guests && ` • ${guests} ${guests === "1" ? "guest" : "guests"}`}
            {checkIn && checkOut && ` • ${checkIn} to ${checkOut}`}
          </div>
        )}

        <p className="text-sm text-muted-foreground font-light">
          {total} {total === 1 ? "result" : "results"} found
        </p>
      </div>

      {/* Results */}
      {listings.length === 0 ? (
        <EmptyState
          icon={<Search className="h-12 w-12" />}
          title="No results found"
          description="Try adjusting your search criteria"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {listings.map((listing) => {
            const primaryPhoto = listing.photos?.[0] || listing.images?.[0];
            const photoUrl = (primaryPhoto?.url || "/images/image1.jpg").trim();
            const listingTitle = listing.title?.trim() || "Accommodation";
            const listingAlt = `${listingTitle} in ${listing.city || ""}, ${listing.country || ""}`.trim() || "Travel accommodation";

            if (!photoUrl || photoUrl === "") return null;

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
                    alt={listingAlt}
                    fill
                    quality={75}
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                </div>

                <div className="p-6 space-y-3">
                  <div>
                    <h3 className="text-xl font-light mb-1 line-clamp-1">
                      {listing.title}
                    </h3>
                    <p className="text-sm text-muted-foreground font-light flex items-center gap-1">
                      <MapPin className="size-3" />
                      {listing.city}, {listing.country}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-border">
                    <div className="flex items-center gap-1 text-sm">
                      <Star className="size-4 fill-foreground/20 text-foreground/40" />
                      <span className="font-light">{listing.rating}</span>
                      <span className="text-muted-foreground">
                        ({listing.review_count})
                      </span>
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
    </div>
  );
};

export const SearchResultsLoading = () => {
  return (
    <div className="space-y-8">
      <Skeleton className="h-12 w-64" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 9 }).map((_, i) => (
          <Skeleton key={i} className="h-96 rounded-[18px]" />
        ))}
      </div>
    </div>
  );
};

