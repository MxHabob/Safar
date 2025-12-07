"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Search, MapPin, Star } from "lucide-react";
import { useSearchListingsApiV1SearchListingsGet } from "@/generated/hooks/search";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import Graphic from "@/components/shared/graphic";
import { AdvancedSearchFilters, SearchFilters } from "./components/advanced-search-filters";
import { useState } from "react";
import { useQueryStates } from "nuqs";
import { parseAsInteger, parseAsFloat, parseAsString, parseAsStringEnum } from "nuqs";
import { ListingType } from "@/generated/schemas";

/**
 * Search results view with advanced search capabilities
 * Uses the advanced Search API with personalization and ranking
 */
export const SearchResultsView = () => {
  const searchParams = useSearchParams();
  const destination = searchParams?.get("destination") || "";
  const checkIn = searchParams?.get("check_in") || "";
  const checkOut = searchParams?.get("check_out") || "";
  const guests = searchParams?.get("guests") || "";

  // Use query states for filters
  const [params] = useQueryStates({
    query: parseAsString.withDefault(""),
    city: parseAsString.withDefault(""),
    country: parseAsString.withDefault(""),
    listing_type: parseAsStringEnum<"apartment" | "house" | "room" | "hotel" | "other">(["apartment", "house", "room", "hotel", "other"]),
    minPrice: parseAsInteger,
    maxPrice: parseAsInteger,
    guests: parseAsInteger,
    bedrooms: parseAsInteger,
    bathrooms: parseAsInteger,
    lat: parseAsFloat,
    lng: parseAsFloat,
    radius: parseAsFloat,
    sortBy: parseAsString.withDefault("relevance"),
  });

  // Extract city/country from destination if available
  const city = params.city || destination.split(",")[0]?.trim() || "";
  const country = params.country || destination.split(",")[1]?.trim() || "";
  const searchQuery = params.query || destination || "";

  // Use advanced search API
  const { data, isLoading, error } = useSearchListingsApiV1SearchListingsGet(
    searchQuery || undefined,
    city || undefined,
    country || undefined,
    params.listing_type as ListingType | undefined,
    params.minPrice || undefined,
    params.maxPrice || undefined,
    params.guests || (guests ? parseInt(guests) : undefined),
    params.bedrooms || undefined,
    params.bathrooms || undefined,
    params.lat || undefined,
    params.lng || undefined,
    params.radius || undefined,
    0, // skip
    24, // limit
    params.sortBy || "relevance",
    true, // enable_personalization
    true, // enable_popularity_boost
    true, // enable_location_boost
    undefined // ab_test_variant
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

        {(destination || searchQuery) && (
          <div className="text-sm text-muted-foreground font-light">
            Searching for: <span className="text-foreground">{searchQuery || destination}</span>
            {guests && ` • ${guests} ${guests === "1" ? "guest" : "guests"}`}
            {checkIn && checkOut && ` • ${checkIn} to ${checkOut}`}
          </div>
        )}

        <p className="text-sm text-muted-foreground font-light">
          {total} {total === 1 ? "result" : "results"} found
        </p>
      </div>

      {/* Advanced Search Filters */}
      <AdvancedSearchFilters />

      {/* Results */}
      {!isLoading && listings.length === 0 ? (
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

