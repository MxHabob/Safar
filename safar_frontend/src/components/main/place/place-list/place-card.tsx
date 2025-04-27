"use client";
import { MapPin } from "lucide-react";
import { InteractionType, Place } from "@/core/types";
import { Badge } from "@/components/ui/badge";
import { WishlistButton } from "@/components/global/wishlist-button";
import InteractionLink from "@/components/global/interaction-link";
import { MediaGallery } from "@/components/global/media-gallery";
import { Skeleton } from "@/components/ui/skeleton";
import { formattedPrice } from "@/lib/utils/date-formatter";

interface PlaceCardProps {
  place: Place
}

export const PlaceCard = ({ place }: PlaceCardProps) => {

  return (
    <InteractionLink
      href={`/places/${place.id}`}
      className="block w-full h-full"
      interactionType={InteractionType.VIEW_PLACE}
      contentType="safar_place"
      objectId={place.id}
    >
      <div className="group flex flex-col w-full h-full rounded-3xl bg-card shadow-md overflow-hidden transition-all hover:shadow-lg relative">
        <MediaGallery
          media={place.media || []}
          variant="carousel"
          aspectRatio="video"
          priority
          showViewAll={false}
          className="relative w-full"
        />

        {place?.category?.name && (
          <Badge className="absolute top-3 left-3 px-2 py-1 border-none">
            {place.category.name}
          </Badge>
        )}

        <WishlistButton
          itemId={place.id}
          itemType="place"
          isInwishlist={place.is_in_wishlist || false}
          className="absolute top-3 right-3 opacity-0 group-hover:opacity-100  transition-all duration-200"
          size="default"
          variant={"secondary"}
        />

        {!place.is_available && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <span className="text-white font-medium text-sm px-3 py-1.5 bg-black/40 rounded-md">
              Not Available
            </span>
          </div>
        )}

        <div className="flex flex-col p-4 flex-1">
          <div className="flex justify-between items-start mb-1.5">
            <h3 className="font-semibold text-lg line-clamp-1">
              {place.name}
              {place.country?.name && `, ${place.country.name}`}
            </h3>
            {place.rating !== undefined && (
              <div className="flex items-center gap-1 bg-yellow-50 dark:bg-yellow-950/30 px-1.5 py-0.5 rounded-md">
                <span className="text-sm font-medium text-yellow-500">★</span>
                <span className="text-sm font-medium">{place.rating.toFixed(1)}</span>
              </div>
            )}
          </div>

          <p className="text-sm text-gray-600 dark:text-gray-300 mb-2.5 line-clamp-2 flex-grow">
            {place.description || "No description available"}
          </p>

          <div className="flex items-center text-gray-500 dark:text-gray-400 text-sm mb-3">
            <MapPin className="h-3.5 w-3.5 mr-1 flex-shrink-0" />
            <span className="truncate">{place.location}</span>
          </div>

          <div className="flex justify-between items-center mt-auto">
            <div className="text-sm text-gray-600 dark:text-gray-400 truncate max-w-[60%]">
              {place.city && <span className="mr-1">{place.city.name}</span>}
              {place.city && place.region && <span className="mr-1">,</span>}
              {place.region && <span>{place.region.name}</span>}
            </div>
            <div className="font-semibold text-base">{formattedPrice(place.currency,place.price)}</div>
          </div>
        </div>
      </div>
    </InteractionLink>
  );
};

PlaceCard.Skeleton = function PlaceCardSkeleton() {
  return (
    <div className="flex flex-col w-full rounded-3xl bg-card overflow-hidden shadow-md relative group">
      <Skeleton className="h-60 w-full rounded-none" />
      
      <div className="absolute top-3 left-3">
        <Skeleton className="h-6 w-24 rounded-full" />
      </div>

      <div className="absolute top-3 right-3">
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>

      <div className="flex flex-col p-4 flex-1">
        <div className="flex justify-between items-start mb-1.5">
          <div className="space-y-1.5 w-full">
            <Skeleton className="h-5 w-3/4 rounded" />
            <Skeleton className="h-3 w-1/2 rounded" />
          </div>
          <Skeleton className="h-5 w-10 rounded-md" />
        </div>

        <div className="space-y-2 mb-3">
          <Skeleton className="h-3 w-full rounded" />
          <Skeleton className="h-3 w-5/6 rounded" />
        </div>

        <div className="flex items-center mb-3">
          <Skeleton className="h-3.5 w-3.5 rounded-full mr-1" />
          <Skeleton className="h-3 w-24 rounded" />
        </div>

        <div className="flex justify-between items-center mt-auto">
          <Skeleton className="h-4 w-32 rounded" />
          <Skeleton className="h-5 w-20 rounded" />
        </div>
      </div>
    </div>
  );
};
