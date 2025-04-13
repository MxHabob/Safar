"use client"
import Image from "next/image"
import { MapPin, Clock, Users } from "lucide-react"
import { InteractionType, type Experience } from "@/core/types"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { WishlistButton } from "@/components/global/wishlist-button"
import InteractionLink from "@/components/global/interaction-link"
import { MediaGallery } from "@/components/global//media-gallery"

interface ExperienceCardProps {
  experience: Experience
}

export const ExperienceCard = ({ experience }: ExperienceCardProps) => {
  // Format price with proper currency
  const formattedPrice = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: experience.currency || "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(experience.price_per_person || 0)

  const getDurationText = (minutes = 0) => {
    if (minutes >= 1440) {
      const days = Math.floor(minutes / 1440)
      return `${days} Day${days > 1 ? "s" : ""}`
    } else {
      const hours = Math.floor(minutes / 60)
      return `${hours} Hour${hours > 1 ? "s" : ""}`
    }
  }

  return (
    <InteractionLink
      href={`/experience/${experience.id}`}
      className="block"
      interactionType={InteractionType.VIEW_EXPERIENCE}
      contentType={"experience"}
      objectId={experience.id}
    >
      <div className="relative w-full rounded-3xl bg-card shadow-md overflow-hidden group min-w-sm max-w-sm transition-all hover:shadow-lg">
        <div className="relative aspect-[4/3] w-full overflow-hidden">
          <MediaGallery media={experience.media || []} variant="carousel" aspectRatio="video" priority />

          <Badge className="absolute top-3 left-3 px-2 py-1 border-none">
            {experience?.category?.name || "Experience"}
          </Badge>

          <WishlistButton
            itemId={experience.id}
            itemType={"experience"}
            isInwishlist={experience.is_in_wishlist || false}
            className="absolute top-3 right-3 p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200"
            size="default"
            variant="outline"
          />

          <div className="absolute bottom-3 left-3 right-3 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="relative w-8 h-8 rounded-full overflow-hidden border-2 border-white bg-gray-200">
                {experience.owner?.profile?.avatar ? (
                  <Image
                    src={experience.owner.profile.avatar || "/placeholder.svg"}
                    alt={experience.owner.username || "Host"}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-primary/20 text-primary text-xs font-bold">
                    {experience.owner?.username?.charAt(0)?.toUpperCase() || "H"}
                  </div>
                )}
              </div>
              <span className="text-xs font-medium text-white drop-shadow-md">
                by {experience.owner?.username || "Host"}
              </span>
            </div>
            <Badge className="px-2 py-1 bg-black/70 text-white border-none">
              {getDurationText(experience.duration)}
            </Badge>
          </div>

          {!experience.is_available && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <span className="text-white font-medium text-sm px-3 py-1.5 bg-black/40 rounded-md">Not Available</span>
            </div>
          )}
        </div>

        <div className="p-4">
          <div className="flex justify-between items-start mb-1.5">
            <h3 className="font-semibold text-lg line-clamp-1">{experience?.title || "Experience"}</h3>
            {experience.rating !== undefined && (
              <div className="flex items-center gap-1 bg-yellow-50 dark:bg-yellow-950/30 px-1.5 py-0.5 rounded-md">
                <span className="text-sm font-medium text-yellow-500">★</span>
                <span className="text-sm font-medium">{experience.rating.toFixed(1)}</span>
              </div>
            )}
          </div>

          <p className="text-sm text-gray-600 dark:text-gray-300 mb-2.5 line-clamp-2">
            {experience.description || "No description available"}
          </p>

          <div className="flex items-center text-gray-500 dark:text-gray-400 text-sm mb-3">
            <MapPin className="h-3.5 w-3.5 mr-1 flex-shrink-0" />
            <span className="truncate">{experience.location}</span>
          </div>

          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center">
                <Clock className="h-3.5 w-3.5 mr-1" />
                <span>{Math.floor((experience.duration || 0) / 60)} hrs</span>
              </div>
              <div className="flex items-center">
                <Users className="h-3.5 w-3.5 mr-1" />
                <span>Up to {experience.capacity || 0}</span>
              </div>
            </div>
            <div className="font-semibold text-base text-gray-900 dark:text-white">
              {formattedPrice}
              <span className="text-xs font-normal text-gray-500 dark:text-gray-400"> / person</span>
            </div>
          </div>
        </div>
      </div>
    </InteractionLink>
  )
}

ExperienceCard.Skeleton = function ExperienceCardSkeleton() {
  return (
    <div className="relative w-full min-w-sm max-w-sm rounded-3xl bg-card overflow-hidden">
      {/* Image area skeleton */}
      <div className="relative aspect-[4/3] w-full">
        <Skeleton className="h-full w-full rounded-none" />

        {/* Badge skeleton */}
        <div className="absolute top-3 left-3">
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>

        {/* Favorite button skeleton */}
        <div className="absolute top-3 right-3">
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>

        {/* Bottom area skeletons */}
        <div className="absolute bottom-3 left-3 right-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-3 w-16 rounded" />
          </div>
          <Skeleton className="h-6 w-12 rounded-full" />
        </div>
      </div>

      {/* Content area skeleton */}
      <div className="p-4">
        {/* Title and rating */}
        <div className="flex justify-between items-start mb-3">
          <Skeleton className="h-5 w-3/4 rounded" />
          <Skeleton className="h-5 w-10 rounded-md" />
        </div>

        {/* Description */}
        <div className="space-y-2 mb-3">
          <Skeleton className="h-3 w-full rounded" />
          <Skeleton className="h-3 w-5/6 rounded" />
        </div>

        {/* Location */}
        <div className="flex items-center mb-3">
          <Skeleton className="h-3.5 w-3.5 rounded-full mr-1" />
          <Skeleton className="h-3 w-24 rounded" />
        </div>

        {/* Duration, capacity, and price */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Skeleton className="h-4 w-12 rounded" />
            <Skeleton className="h-4 w-16 rounded" />
          </div>
          <Skeleton className="h-5 w-20 rounded" />
        </div>
      </div>
    </div>
  )
}
