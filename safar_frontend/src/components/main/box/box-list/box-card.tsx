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
  const formattedPrice = (box?.total_price ?? 0).toLocaleString()

  return (
    <InteractionLink
      href={`/boxes/${box.id}`}
      className="block"
      interactionType={InteractionType.VIEW_PLACE}
      contentType={"box"}
      objectId={box.id}
    >
      <div className="relative h-[370px] w-[280px] min-w-sm rounded-3xl bg-card shadow-md overflow-hidden group transition-all hover:shadow-lg">
        <div className="relative h-[180px]">
          <MediaGallery
            media={box.media || []}
            variant="grid"
            maxDisplay={4}
            showViewAll={false}
            className="rounded-t-3xl rounded-b-none"
          />

          <WishlistButton
            itemId={box.id}
            itemType={"box"}
            isInwishlist={box.is_in_wishlist || false}
            className="absolute top-3 right-3 opacity-0 group-hover:opacity-100  transition-all duration-200"
            size="default"
            variant={"secondary"}
          />

          <div className="absolute bottom-3 left-3 z-10">
            <div className="rounded-full px-3 py-1 bg-white/90 dark:bg-gray-800/90 shadow-md backdrop-blur-sm">
              <span className="text-base font-bold">{formattedPrice}</span>
              <span className="ml-1 text-gray-700 dark:text-gray-300">{box.currency}</span>
            </div>
          </div>
        </div>

        <div className="p-4">
          <div className="mb-1 flex items-center text-gray-500 dark:text-gray-400">
            <MapPin className="mr-1 h-3.5 w-3.5 flex-shrink-0" />
            <span className="truncate text-xs">
              {box?.country?.name} - {box?.city?.name}
            </span>
          </div>

          <h3 className="mb-1 text-lg font-semibold line-clamp-1" title={box.name}>
            {box.name}
          </h3>
          <p className="mb-3 text-sm text-muted-foreground line-clamp-1">{box.description || "Unknown"}</p>

          <div className="flex flex-wrap items-center gap-2 mb-1">
            {box.itinerary_days && (
              <Badge variant="outline" className="flex items-center text-sm font-normal">
                <Calendar className="h-3 w-3 mr-1" />
                Place - {box.itinerary_days.items?.place?.length || 0}
              </Badge>
            )}
            {box.itinerary_days && (
              <Badge variant="outline" className="flex items-center text-sm font-normal">
                <Calendar className="h-3 w-3 mr-1" />
                Experiences - {box.itinerary_days.items?.experience?.length || 0}
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
    <div className="relative h-[370px] w-[280px] min-w-sm rounded-3xl shadow-md bg-card overflow-hidden hover:shadow-lg">
      <div className="relative h-[180px]">
        <div className="grid grid-cols-3 gap-0.5 h-full w-full">
          <div className="col-span-2 row-span-2 rounded-l-3xl">
            <Skeleton className="h-full w-full" />
          </div>
          <div className="flex flex-col gap-0.5 row-span-2">
            <Skeleton className="h-1/3 w-full" />
            <Skeleton className="h-1/3 w-full" />
            <Skeleton className="h-1/3 w-full" />
          </div>
        </div>

        <div className="absolute bottom-3 left-3 z-10">
          <Skeleton className="h-7 w-20 rounded-full" />
        </div>
      </div>
      <div className="p-4">
        <div className="mb-1 flex items-center">
          <Skeleton className="h-3.5 w-3.5 rounded-full mr-1" />
          <Skeleton className="h-3 w-20 rounded" />
        </div>
        <Skeleton className="mb-1 h-5 w-3/4 rounded" />
        <Skeleton className="mb-3 h-3 w-full rounded" />
        <div className="flex flex-wrap gap-2 mb-1">
          <Skeleton className="h-6 w-24 rounded-full" />
          <Skeleton className="h-6 w-28 rounded-full" />
        </div>
      </div>
    </div>
  )
}
