"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowUpRight, ArrowRight, Star, MapPin } from "lucide-react";
import { useListListingsApiV1ListingsGet } from "@/generated/hooks/listings";
import { Skeleton } from "@/components/ui/skeleton";
import BlurImage from "@/components/shared/blur-image";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import Graphic from "@/components/shared/graphic";
import type { ListingListResponse } from "@/generated/schemas";

/**
 * Curated listing card component - Displays a single listing
 * Inspired by TravelGuideCard design with clean, minimal aesthetic
 */
interface CuratedListingCardProps {
  id: number | string;
  title: string;
  photoUrl: string;
  alt: string;
  listingType: string;
  rating: string | number;
  reviewCount: number;
  city: string;
  country: string;
  basePrice: string;
  currency: string;
}

const CuratedListingCard = ({
  id,
  title,
  photoUrl,
  alt,
  listingType,
  rating,
  reviewCount,
  city,
  country,
  basePrice,
  currency,
}: CuratedListingCardProps) => {
  const router = useRouter();
  const ratingValue = typeof rating === "string" ? parseFloat(rating) : rating;
  const displayRating = ratingValue > 0 ? ratingValue.toFixed(1) : "0.0";

  return (
    <div
      className="w-full relative group cursor-pointer"
      onClick={() => router.push(`/listings/${id}`)}
    >
      <AspectRatio
        ratio={0.75 / 1}
        className="overflow-hidden rounded-[18px] relative group-hover:shadow-xl transition-shadow duration-500"
      >
        <BlurImage
          src={photoUrl}
          alt={alt}
          fill
          sizes="(max-width: 767px) 100vw, (max-width: 1535px) 50vw, 33vw"
          className="object-cover transition-transform duration-700 group-hover:scale-105"
          blurhash=""
          loading="lazy"
        />
        
        {/* Overlay gradient for bottom text */}
        <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent" />
      </AspectRatio>

      {/* Top corner - Category and Rating */}
      <div className="absolute top-0 left-0 z-20">
        <div className="relative bg-background rounded-br-[18px]">
          <div className="pt-2 px-4 pb-3 overflow-hidden">
            <div className="flex items-center gap-3 text-sm font-light">
              {/* Category */}
              <span className="uppercase text-xs">{listingType}</span>
              {/* Rating */}
              {ratingValue > 0 && (
                <div className="flex items-center gap-1">
                  <Star className="size-3 fill-foreground text-foreground" />
                  <span className="text-xs">{displayRating}</span>
                  {reviewCount > 0 && (
                    <span className="text-xs text-muted-foreground">
                      ({reviewCount})
                    </span>
                  )}
                </div>
              )}
              {/* Hover arrow */}
              <div className="w-0 group-hover:w-[24px] transition-[width] duration-300 ease-out overflow-hidden">
                <ArrowRight size={14} className="ml-2 shrink-0" />
              </div>
            </div>
          </div>

          {/* Graphic corners */}
          <div className="absolute size-[18px]">
            <Graphic />
          </div>
          <div className="absolute size-[18px] top-0 -right-[18px]">
            <Graphic />
          </div>
        </div>
      </div>

      {/* Bottom - Title and Details */}
      <div className="absolute bottom-0 left-0 right-0 z-20 p-6 text-white">
        <h3 className="text-xl lg:text-2xl font-light mb-2 line-clamp-2">
          {title}
        </h3>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-light opacity-90">
            <MapPin className="size-4" />
            <span>
              {city}, {country}
            </span>
          </div>
          <div className="text-right">
            <div className="font-light text-lg">
              {currency} {basePrice}
            </div>
            <div className="text-xs opacity-80 font-light">per night</div>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Curated listings section - Minimal, elegant card design
 * Focus on beauty and simplicity
 * Inspired by TravelGuideCard design
 */
export const CuratedListings = ({ initialData }: { initialData?: ListingListResponse }) => {
  const { data, isLoading } = useListListingsApiV1ListingsGet(
    undefined,
    6,
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
          const photoUrl = (primaryPhoto?.url || "/images/image1.jpg").trim();
          const listingTitle = listing.title?.trim() || "Accommodation";
          const listingAlt = `${listingTitle} in ${listing.city || ""}, ${listing.country || ""}`.trim() || "Travel accommodation";

          if (!photoUrl || photoUrl === "") return null;

          return (
            <CuratedListingCard
              key={listing.id}
              id={listing.id}
              title={listingTitle}
              photoUrl={photoUrl}
              alt={listingAlt}
              listingType={listing.listing_type || "accommodation"}
              rating={listing.rating || "0"}
              reviewCount={listing.review_count || 0}
              city={listing.city || ""}
              country={listing.country || ""}
              basePrice={listing.base_price || "0"}
              currency={listing.currency || "USD"}
            />
          );
        })}
      </div>
    </section>
  );
};

