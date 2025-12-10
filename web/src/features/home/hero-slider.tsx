"use client";

import Link from "next/link";
import Carousel from "@/components/shared/photo-carousel";
import BlurImage from "@/components/shared/blur-image";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { ImageOff } from "lucide-react";
import { useListListingsApiV1ListingsGet } from "@/generated/hooks/listings";
import { ListingListResponse } from "@/generated/schemas";
  
export const HeroSlider = ( {initialsData }: { initialsData?: ListingListResponse } ) => {
  const { data, isLoading, error } = useListListingsApiV1ListingsGet(
    undefined,
    10,
    undefined, // city
    undefined, // country
    undefined, // listing_type
    undefined, // min_price
    undefined, // max_price
    undefined, // min_guests
    "active", // status - only show active listings
    { 
      initialData: initialsData
    }
  );

  if (isLoading) {
    return (
      <div className="absolute top-0 left-0 w-full h-full rounded-[18px] overflow-hidden">
        <Skeleton className="w-full h-full" />
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState
        icon={<ImageOff className="h-12 w-12" />}
        title="Unable to load listings"
        description="There was an error loading featured listings. Please try again later."
        height="h-full"
      />
    );
  }

  const listings = data?.items || [];
  
  const allPhotos = listings
    .flatMap((listing) => {
      if (!listing) return [];
      
      const photosArray = listing.images || [];
      console.log("listing", listing);
      console.log("photosArray", photosArray);

      
      if (!Array.isArray(photosArray) || photosArray.length === 0) {
        return [];
      }
      return photosArray
        .map((photo: any) => {
          if (!photo) return null;
          
          const photoUrl = photo?.url 
          
          console.log("photoUrl", photoUrl);
          if (!photoUrl || typeof photoUrl !== 'string' || photoUrl.trim() === '') {
            return null;
          }
          
          const trimmedUrl = photoUrl.trim();
          
          if (
            trimmedUrl === "/images/image1.jpg" ||
            trimmedUrl === "placeholder" ||
            trimmedUrl.startsWith("data:") ||
            trimmedUrl.length < 10
          ) {
            return null;
          }
          
          return {
            url: trimmedUrl,
            thumbnail_url: photo?.thumbnail_url || photo?.url || trimmedUrl,
            alt: listing.title || listing.city || listing.country || "Travel destination",
            listingId: listing.id,
            listingSlug: listing.slug || listing.id?.toString() || "",
          };
        })
        .filter((photo): photo is NonNullable<typeof photo> => photo !== null);
    })
    .filter((photo) => {
      return (
        photo && 
        photo.url && 
        photo.url.trim() !== "" && 
        photo.listingId &&
        photo.listingSlug
      );
    });

  if (allPhotos.length === 0) {
    return (
      <div className="absolute inset-0 w-full h-full rounded-[18px] overflow-hidden">
        <EmptyState
          icon={<ImageOff className="h-12 w-12" />}
          title="No featured listings yet"
          description="Check back soon for new destinations."
          height="h-full"
        />
      </div>
    );
  }

  return (
    <Carousel
      className="absolute top-0 left-0 w-full h-full"
      containerClassName="h-full"
    >
      {allPhotos.map((photo, index) => {
        const shouldPreload = index < 2;
        const imageUrl = photo.url?.trim();
        const imageAlt = photo.alt?.trim() || "Travel destination";

        if (!imageUrl || imageUrl === "" || imageUrl === "/images/image1.jpg") {
          return null;
        }

        return (
          <Link
            key={`${photo.listingId}-${index}`}
            href={`/listings/${photo.listingSlug || photo.listingId}`}
            className="flex-[0_0_100%] h-full relative block"
          >
            <BlurImage
              src={imageUrl}
              alt={imageAlt}
              fill
              sizes="75vw"
              priority={shouldPreload}
              loading={shouldPreload ? "eager" : "lazy"}
              className="w-full h-full object-cover"
              blurhash=""
            />
          </Link>
        );
      })}
    </Carousel>
  );
};

export const HeroSliderLoading = () => {
  return (
    <div className="absolute inset-0 w-full h-full">
      <Skeleton className="w-full h-full" />
    </div>
  );
};

