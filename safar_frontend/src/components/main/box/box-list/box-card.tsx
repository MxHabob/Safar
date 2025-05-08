"use client"
import { MapPin, Calendar } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { type Box, InteractionType } from "@/core/types"
import { Skeleton } from "@/components/ui/skeleton"
import { WishlistButton } from "@/components/global/wishlist-button"
import InteractionLink from "@/components/global/interaction-link"
import { MediaGallery } from "@/components/global/media-gallery"

interface BoxCardProps {
  box: Box
}

export const BoxCard = ({ box }: BoxCardProps) => {
  return (
    <InteractionLink
      href={`/boxes/${box.id}`}
      className="block w-full"
      interactionType={InteractionType.VIEW_PLACE}
      contentType={"box"}
      objectId={box.id}
    >
      <div className="relative aspect-[4/3] w-full rounded-xl lg:rounded-3xl bg-card shadow-lg overflow-hidden group transition-all hover:shadow-xl">
        <div className="h-full w-full">
          <MediaGallery
            media={box.media || []}
            variant={"compact"}
            maxDisplay={1}
            showViewAll={false}
            className="rounded-xl lg:rounded-3xl w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30 pointer-events-none" />
        </div>
        <WishlistButton
          itemId={box.id}
          itemType={"box"}
          isInwishlist={box.is_in_wishlist || false}
          className="absolute top-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-all duration-200"
          size="default"
          variant="outline"
        />

        <div className="absolute bottom-0 left-0 w-full p-4 md:p-6 lg:p-8">
          <div className="mb-2 flex items-center">
            <MapPin className="mr-2 h-4 w-4 md:h-5 md:w-5 flex-shrink-0" />
            <span className="text-sm md:text-base font-medium">
              {box?.country?.name} - {box?.city?.name}
            </span>
          </div>

          <h3 className="mb-2 text-xl md:text-2xl lg:text-3xl font-bold line-clamp-1" title={box.name}>
            {box.name}
          </h3>
          <p className="mb-4 text-sm md:text-base text-white/80 line-clamp-2 lg:line-clamp-3">
            {box.description || "No description available"}
          </p>

          <div className="flex flex-wrap items-center gap-2 md:gap-3">
            {box.itinerary_days && (
              <Badge
                variant="secondary"
                className="flex items-center text-sm md:text-base font-medium bg-white/20 hover:bg-white/30 border-none py-1.5 px-3"
              >
                <Calendar className="h-4 w-4 md:h-5 md:w-5 mr-1.5" />
                {box.itinerary_days.items?.place?.length || 0} Places
              </Badge>
            )}
            {box.itinerary_days && (
              <Badge
                variant="secondary"
                className="flex items-center text-sm md:text-base font-medium bg-white/20 hover:bg-white/30 border-none py-1.5 px-3"
              >
                <Calendar className="h-4 w-4 md:h-5 md:w-5 mr-1.5" />
                {box.itinerary_days.items?.experience?.length || 0} Experiences
              </Badge>
            )}
          </div>
        </div>
      </div>
    </InteractionLink>
  )
}

BoxCard.Skeleton = function BoxCardSkeleton() {
  return (
    <div className="relative aspect-[4/3] w-full rounded-xl lg:rounded-3xl shadow-lg bg-card overflow-hidden">
      <Skeleton className="h-full w-full" />
      <div className="absolute bottom-0 left-0 w-full p-4 md:p-6 lg:p-8">
        <div className="mb-2 flex items-center">
          <Skeleton className="h-4 w-4 md:h-5 md:w-5 rounded-full mr-2" />
          <Skeleton className="h-4 md:h-5 w-32 md:w-40 rounded" />
        </div>
        <Skeleton className="mb-2 h-6 md:h-7 lg:h-8 w-3/4 rounded" />
        <Skeleton className="mb-4 h-4 md:h-5 w-full rounded" />
        <div className="flex flex-wrap gap-2 md:gap-3">
          <Skeleton className="h-7 md:h-8 w-28 md:w-32 rounded-full" />
          <Skeleton className="h-7 md:h-8 w-36 md:w-40 rounded-full" />
        </div>
      </div>
    </div>
  )
}