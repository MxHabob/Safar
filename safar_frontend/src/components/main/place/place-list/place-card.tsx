"use client"
import { MapPin } from "lucide-react";
import { InteractionType, Place } from "@/core/types";
import { Badge } from "@/components/ui/badge";
import { WishlistButton } from "@/components/global/wishlist-button";
import InteractionLink from "@/components/global/interaction-link";
import { MediaGallery } from "@/components/global/media-gallery";
import { Skeleton } from "@/components/ui/skeleton";


interface PlaceCardProps {
  place: Place
}

export const PlaceCard = ({ place }: PlaceCardProps) => {
  const formattedPrice = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: place.currency || "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(place.price || 0)
  return (
 <InteractionLink
      href={`/places/${place.id}`}
      className="block w-full h-full"
      interactionType={InteractionType.VIEW_PLACE}
      contentType={"safar_place"}
      objectId={place.id}
    >
    <div className="relative w-full aspect-[3/3] rounded-3xl bg-card shadow-md overflow-hidden group transition-all hover:shadow-lg">
        <div className="relative aspect-[4/3] w-full overflow-hidden flex-shrink-0">
          <MediaGallery media={place.media || []} variant="carousel" aspectRatio="video" priority showViewAll={false} />

          {place?.category?.name && (
            <Badge className="absolute top-3 left-3 px-2 py-1 border-none">{place.category.name}</Badge>
          )}

          <WishlistButton
            itemId={place.id}
            itemType={"place"}
            isInwishlist={place.is_in_wishlist || false}
            className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-200"
            size="default"
            variant="outline"
          />

          {!place.is_available && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <span className="text-white font-medium text-sm px-3 py-1.5 bg-black/40 rounded-md">Not Available</span>
            </div>
          )}
        </div>

        <div className="p-4 flex flex-col flex-grow">
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

          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600 dark:text-gray-400 truncate max-w-[60%]">
              {place.city && <span className="mr-1">{place.city.name}</span>}
              {place.city && place.region && <span className="mr-1">,</span>}
              {place.region && <span>{place.region.name}</span>}
            </div>
            <div className="font-semibold text-base">{formattedPrice}</div>
          </div>
        </div>
      </div>
    </InteractionLink>
  )
}

PlaceCard.Skeleton = function PlaceCardSkeleton() {
  return (
    <div className="relative w-full rounded-3xl bg-card overflow-hidden">
      <div className="relative aspect-[4/3] w-full">
        <Skeleton className="h-full w-full rounded-none" />
        
        <div className="absolute top-3 left-3">
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
      
        <div className="absolute top-3 right-3">
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
      </div>

      <div className="p-4">
        <div className="flex justify-between items-start mb-3">
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

        <div className="flex justify-between items-center">
          <Skeleton className="h-4 w-32 rounded" />
          <Skeleton className="h-5 w-20 rounded" />
        </div>
      </div>
    </div>
  )
}