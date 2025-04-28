"use client"
import { MapPin, Calendar } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { type Box, InteractionType } from "@/core/types"
import { Skeleton } from "@/components/ui/skeleton"
import { WishlistButton } from "@/components/global/wishlist-button"
import InteractionLink from "@/components/global/interaction-link"
import { MediaGallery } from "@/components/global/media-gallery"
import { cn } from "@/lib/utils"
import { formattedPrice } from "@/lib/utils/date-formatter"

interface BoxCardProps {
  box: Box
  className?: string
}

export const BoxCard = ({ box, className }: BoxCardProps) => {

  const placeCount = box.itinerary_days?.items?.place?.length || 0
  const experienceCount = box.itinerary_days?.items?.experience?.length || 0

  return (
    <InteractionLink
      href={`/boxes/${box.id}`}
      className={cn("block group", className)}
      interactionType={InteractionType.VIEW_PLACE}
      contentType="box"
      objectId={box.id}
    >
      <div className="relative h-full w-full rounded-3xl bg-card shadow-md overflow-hidden transition-all hover:shadow-lg">
        <div className="relative h-[180px]">
          <MediaGallery
            media={box.media || []}
            variant="grid"
            maxDisplay={4}
            showViewAll={false}
            className="rounded-t-3xl rounded-b-none"
            priority={true}
          />

          <WishlistButton
            itemId={box.id}
            itemType="box"
            isInwishlist={box.is_in_wishlist || false}
            className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            size="sm"
            variant="secondary"
          />

          {box.total_price !== undefined && (
            <div className="absolute bottom-3 left-3 z-10">
              <div className="rounded-full px-3 py-1 bg-white/90 dark:bg-gray-800/90 shadow-md backdrop-blur-sm">
                <span className="text-sm font-bold">{formattedPrice(box.currency || "USD",box?.total_price || 0)}</span>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 space-y-2">
          <div className="flex items-center text-muted-foreground text-xs">
            <MapPin className="mr-1 h-3.5 w-3.5 flex-shrink-0" />
            <span className="truncate">
              {[box?.country?.name, box?.city?.name].filter(Boolean).join(' - ') || 'Location not specified'}
            </span>
          </div>

          <h3 className="text-lg font-semibold line-clamp-2" title={box.name}>
            {box.name || 'Untitled Box'}
          </h3>
          
          <p className="text-sm text-muted-foreground line-clamp-2">
            {box.description || 'No description available'}
          </p>

          {(placeCount > 0 || experienceCount > 0) && (
            <div className="flex flex-wrap gap-2 pt-1">
              {placeCount > 0 && (
                <Badge variant="outline" className="text-xs font-normal">
                  <Calendar className="h-3 w-3 mr-1" />
                  {placeCount} {placeCount === 1 ? 'Place' : 'Places'}
                </Badge>
              )}
              {experienceCount > 0 && (
                <Badge variant="outline" className="text-xs font-normal">
                  <Calendar className="h-3 w-3 mr-1" />
                  {experienceCount} {experienceCount === 1 ? 'Experience' : 'Experiences'}
                </Badge>
              )}
            </div>
          )}
        </div>
      </div>
    </InteractionLink>
  )
}

BoxCard.Skeleton = function BoxCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("relative rounded-3xl shadow-md bg-card overflow-hidden", className)}>
      <div className="relative aspect-video">
        <div className="grid grid-cols-3 gap-0.5 h-full w-full">
          <Skeleton className="col-span-2 row-span-2 rounded-tl-3xl" />
          <div className="flex flex-col gap-0.5">
            <Skeleton className="h-full" />
            <Skeleton className="h-full" />
            <Skeleton className="h-full rounded-tr-3xl" />
          </div>
        </div>
        <Skeleton className="absolute bottom-3 left-3 h-6 w-20 rounded-full" />
      </div>
      <div className="p-4 space-y-3">
        <div className="flex items-center space-x-2">
          <Skeleton className="h-3 w-3 rounded-full" />
          <Skeleton className="h-3 w-24 rounded" />
        </div>
        <Skeleton className="h-5 w-3/4 rounded" />
        <Skeleton className="h-4 w-full rounded" />
        <div className="flex gap-2 pt-1">
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-6 w-24 rounded-full" />
        </div>
      </div>
    </div>
  )
}