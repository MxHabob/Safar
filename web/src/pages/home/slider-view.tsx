"use client";

// UI Components
import Link from "next/link";
import Carousel from "@/components/shared/photo-carousel";
import BlurImage from "@/components/shared/blur-image";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { ImageOff } from "lucide-react";

// Generated hooks
import { useListListingsApiV1ListingsGet } from "@/generated/hooks/listings";

export const SliderView = () => {
  // Fetch featured listings for the slider
  const { data, isLoading, error } = useListListingsApiV1ListingsGet(
    undefined, // skip
    10, // limit - get 10 featured listings
    undefined, // city
    undefined, // country
    undefined, // listing_type
    undefined, // min_price
    undefined, // max_price
    undefined, // min_guests
    "active" // status - only show active listings
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


  // Extract listings from response
  const listings = data?.items || [];

  console.log("listings", listings);
  
  // Get all photos from listings (flatten photos arrays)
  const allPhotos = listings
    .flatMap((listing) => 
      (listing.images || []).map((photo) => ({
        url: photo.url,
        thumbnail_url: photo.url,
        alt: listing.title || "Travel destination",
        listingId: listing.id,
        listingSlug: listing.slug,
      }))
    )
    .filter((photo) => photo.url && photo.url.trim() !== ""); // Filter out listings without photos

  // if (!allPhotos || allPhotos.length === 0) {
  //   return (
  //     <EmptyState
  //       icon={<ImageOff className="h-12 w-12" />}
  //       title="No listings available"
  //       description="Check back soon for amazing travel destinations"
  //       action={
  //         <Button asChild>
  //           <Link href="/listings">Browse All Listings</Link>
  //         </Button>
  //       }
  //       height="h-full"
  //     />
  //   );
  // }

  return (
    <Carousel
      className="absolute top-0 left-0 w-full h-full"
      containerClassName="h-full"
    >
      {allPhotos.map((photo, index) => {
        const shouldPreload = index < 2; // Preload first 2 images
        const imageUrl = photo.url?.trim() || "/images/image1.jpg";
        const imageAlt = photo.alt?.trim() || "Travel destination";

        if (!imageUrl || imageUrl === "") return null;

        return (
          <Link
            key={`${photo.listingId}-${index}`}
            href={`/listings/${photo.listingSlug}`}
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

export const SliderViewLoadingStatus = () => {
  return (
    <div className="absolute inset-0 w-full h-full">
      <Skeleton className="w-full h-full" />
    </div>
  );
};
