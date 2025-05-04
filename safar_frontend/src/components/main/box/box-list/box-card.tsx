import { cn } from "@/lib/utils"
import { MapPin, Calendar } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"


import { InteractionLink } from "@/components/global/interaction-link"
import { InteractionType } from "@/core/types"
import { MediaGallery } from "@/components/global/media-gallery"
import { WishlistButton } from "@/components/global/wishlist-button"
import { formattedPrice } from "@/lib/utils/date-formatter"

interface BoxCardProps {
  box: any
  className?: string
  placeCount?: number
  experienceCount?: number
}

export function BoxCard({ box, className, placeCount = 0, experienceCount = 0 }: BoxCardProps) {
  return (
    <InteractionLink
      href={`/boxes/${box.id}`}
      className={cn("block group", className)}
      interactionType={InteractionType.VIEW_PLACE}
      contentType="box"
      objectId={box.id}
    >
      <div className="relative w-full rounded-3xl bg-card shadow-md overflow-hidden group transition-all hover:shadow-lg hover:translate-y-[-4px] duration-300">
        <div className="relative h-[220px]">
          <MediaGallery
            media={box.media || []}
            variant="grid"
            maxDisplay={4}
            showViewAll={false}
            className="rounded-t-3xl rounded-b-none"
            priority={true}
            aspectRatio="wide"
          />

          <WishlistButton
            itemId={box.id}
            itemType="box"
            isInwishlist={box.is_in_wishlist || false}
            className="absolute top-3 right-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            size="sm"
            variant="secondary"
          />

          {box.total_price !== undefined && (
            <div className="absolute bottom-3 left-3 z-10">
              <div className="rounded-full px-3 py-1.5 bg-white/90 dark:bg-gray-800/90 shadow-md backdrop-blur-sm">
                <span className="text-sm font-bold">
                  {formattedPrice(box.currency || "USD", box?.total_price || 0)}
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="p-5 space-y-3">
          <div className="flex items-center text-muted-foreground text-xs">
            <MapPin className="mr-1.5 h-3.5 w-3.5 flex-shrink-0" />
            <span className="truncate">
              {[box?.country?.name, box?.city?.name].filter(Boolean).join(" - ") || "Location not specified"}
            </span>
          </div>

          <h3 className="text-xl font-semibold line-clamp-2 leading-tight" title={box.name}>
            {box.name || "Untitled Box"}
          </h3>

          <p className="text-sm text-muted-foreground line-clamp-2">{box.description || "No description available"}</p>

          {(placeCount > 0 || experienceCount > 0) && (
            <div className="flex flex-wrap gap-2 pt-1">
              {placeCount > 0 && (
                <Badge variant="outline" className="text-xs font-normal bg-background/50 backdrop-blur-sm">
                  <MapPin className="h-3 w-3 mr-1" />
                  {placeCount} {placeCount === 1 ? "Place" : "Places"}
                </Badge>
              )}
              {experienceCount > 0 && (
                <Badge variant="outline" className="text-xs font-normal bg-background/50 backdrop-blur-sm">
                  <Calendar className="h-3 w-3 mr-1" />
                  {experienceCount} {experienceCount === 1 ? "Experience" : "Experiences"}
                </Badge>
              )}
            </div>
          )}
        </div>
      </div>
    </InteractionLink>
  )
}

BoxCard.Skeleton = function BoxCardSkeleton() {
  return (
    <div className="relative w-full rounded-3xl bg-card overflow-hidden shadow-md">
      <div className="relative h-[220px]">
        <div className="grid grid-cols-2 gap-0.5 h-full w-full">
          <Skeleton className="h-full rounded-tl-3xl" />
          <Skeleton className="h-full rounded-tr-3xl" />
        </div>
        <Skeleton className="absolute bottom-3 left-3 h-7 w-24 rounded-full" />
      </div>
      <div className="p-5 space-y-3">
        <div className="flex items-center space-x-2">
          <Skeleton className="h-3.5 w-3.5 rounded-full" />
          <Skeleton className="h-3.5 w-32 rounded" />
        </div>
        <Skeleton className="h-6 w-4/5 rounded" />
        <Skeleton className="h-4 w-full rounded" />
        <div className="flex gap-2 pt-1">
          <Skeleton className="h-6 w-24 rounded-full" />
          <Skeleton className="h-6 w-28 rounded-full" />
        </div>
      </div>
    </div>
  )
}
