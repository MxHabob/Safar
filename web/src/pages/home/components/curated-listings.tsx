"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, Star } from "lucide-react";
import { useListListingsApiV1ListingsGet } from "@/generated/hooks/listings";
import { Skeleton } from "@/components/ui/skeleton";
import Graphic from "@/components/shared/graphic";

/**
 * Curated listings section - Minimal, elegant card design
 * Focus on beauty and simplicity
 */
export const CuratedListings = () => {
  const { data, isLoading } = useListListingsApiV1ListingsGet(
    undefined,
    6,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    "active"
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-96 rounded-[18px]" />
          ))}
        </div>
      </div>
    );
  }

  const listings = data?.items || [];
  if (listings.length === 0) return null;

  return (
    <section className="space-y-12">
      <div className="flex items-baseline gap-4">
        <h2 className="text-3xl lg:text-4xl font-light tracking-tight">
          Curated Stays
        </h2>
        <div className="flex-1 h-px bg-border" />
        <Link
          href="/listings"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 group"
        >
          View all
          <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {listings.map((listing) => {
          const primaryPhoto = listing.photos?.[0] || listing.images?.[0];
          let photoUrl = (primaryPhoto?.url || "/images/image1.jpg").trim();
          const listingTitle = listing.title?.trim() || "Accommodation";
          const listingAlt = `${listingTitle} in ${listing.city || ""}, ${listing.country || ""}`.trim() || "Travel accommodation";

          if (!photoUrl || photoUrl === "") return null;

          // For external URLs with query params, ensure proper encoding
          if (photoUrl.startsWith("http") && photoUrl.includes("?")) {
            try {
              const url = new URL(photoUrl);
              // Keep the base URL without query params for Next.js optimization
              photoUrl = url.origin + url.pathname;
            } catch {
              // If URL parsing fails, use as-is
            }
          }

          return (
            <Link
              key={listing.id}
              href={`/listings/${listing.id}`}
              className="group relative overflow-hidden rounded-[18px] bg-card border border-border hover:border-foreground/20 transition-all duration-500"
            >
              {/* Graphic corner */}
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
                  <p className="text-sm text-muted-foreground font-light">
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
    </section>
  );
};

