"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, Star, MapPin, Filter, Grid3x3, List } from "lucide-react";
import { useListListingsApiV1ListingsGet } from "@/generated/hooks/listings";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { Home } from "lucide-react";
import Graphic from "@/components/shared/graphic";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import type { ListingListResponse } from "@/generated/schemas";

/**
 * Listings browse view - Grid layout with filters
 * Beautiful, minimal design following Safar's aesthetic
 */
export const ListingsView = ({ initialData }: { initialData?: ListingListResponse }) => {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [filters, setFilters] = useState({
    city: "",
    country: "",
    listing_type: "",
    min_price: "",
    max_price: "",
    min_guests: "",
  });

  const { data, isLoading, error } = useListListingsApiV1ListingsGet(
    0, // skip
    24, // limit
    filters.city || undefined,
    filters.country || undefined,
    filters.listing_type || undefined,
    filters.min_price ? parseFloat(filters.min_price) : undefined,
    filters.max_price ? parseFloat(filters.max_price) : undefined,
    filters.min_guests ? parseInt(filters.min_guests) : undefined,
    "active",
    {
      initialData: filters.city === "" && filters.country === "" && filters.listing_type === "" ? initialData : undefined
    }
  );

  if (isLoading) {
    return <ListingsViewLoading />;
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
  const total = data?.total || 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-6">
        <div className="flex items-baseline gap-4">
          <h1 className="text-4xl lg:text-5xl font-light tracking-tight">
            Browse Stays
          </h1>
          <div className="flex-1 h-px bg-border" />
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setViewMode("grid")}
              className={viewMode === "grid" ? "bg-muted" : ""}
            >
              <Grid3x3 className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setViewMode("list")}
              className={viewMode === "list" ? "bg-muted" : ""}
            >
              <List className="size-4" />
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 p-6 bg-muted/50 rounded-[18px] border border-border">
          <div className="flex items-center gap-2">
            <Filter className="size-4 text-muted-foreground" />
            <span className="text-sm font-light">Filters</span>
          </div>
          <Input
            placeholder="City"
            value={filters.city}
            onChange={(e) => setFilters({ ...filters, city: e.target.value })}
            className="w-32 h-9 rounded-[18px]"
          />
          <Input
            placeholder="Country"
            value={filters.country}
            onChange={(e) => setFilters({ ...filters, country: e.target.value })}
            className="w-32 h-9 rounded-[18px]"
          />
          <Input
            type="number"
            placeholder="Min price"
            value={filters.min_price}
            onChange={(e) => setFilters({ ...filters, min_price: e.target.value })}
            className="w-24 h-9 rounded-[18px]"
          />
          <Input
            type="number"
            placeholder="Max price"
            value={filters.max_price}
            onChange={(e) => setFilters({ ...filters, max_price: e.target.value })}
            className="w-24 h-9 rounded-[18px]"
          />
          <Input
            type="number"
            placeholder="Guests"
            value={filters.min_guests}
            onChange={(e) => setFilters({ ...filters, min_guests: e.target.value })}
            className="w-20 h-9 rounded-[18px]"
          />
        </div>

        <p className="text-sm text-muted-foreground font-light">
          {total} {total === 1 ? "listing" : "listings"} found
        </p>
      </div>

      {/* Listings Grid */}
      {listings.length === 0 ? (
        <EmptyState
          icon={<Home className="h-12 w-12" />}
          title="No listings found"
          description="Try adjusting your filters"
        />
      ) : (
        <div
          className={
            viewMode === "grid"
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
              : "space-y-6"
          }
        >
          {listings.map((listing, index) => {
            const primaryPhoto = listing.images?.[0];
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
                {/* Graphic corner */}
                <div className="absolute top-0 left-0 size-[18px] z-10">
                  <Graphic />
                </div>

                <div className={`relative ${viewMode === "grid" ? "h-64" : "h-48"} overflow-hidden`}>
                  <Image
                    src={photoUrl}
                    alt={listingAlt}
                    fill
                    loading={index < 6 ? "eager" : "lazy"}
                    priority={index < 3}
                    quality={75}
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
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

export const ListingsViewLoading = () => {
  return (
    <div className="space-y-8">
      <Skeleton className="h-12 w-64" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array.from({ length: 12 }).map((_, i) => (
          <Skeleton key={i} className="h-96 rounded-[18px]" />
        ))}
      </div>
    </div>
  );
};

