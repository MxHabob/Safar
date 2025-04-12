"use client"

import type React from "react"

import { useState } from "react"
import Image from "next/image"
import { MapPin, ChevronRight, ChevronLeft, Clock, Users } from "lucide-react"
import { cn } from "@/lib/utils"
import { InteractionType, type Experience } from "@/redux/types/types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { WishlistButton } from "../wishlist-button"
import InteractionLink from "../interaction-link"

interface ExperienceCardProps {
  experience: Experience
  onFavorite?: (id: string) => void
  isFavorited?: boolean
}

export const ExperienceCard =({ experience, isFavorited: externalFavorite }: ExperienceCardProps) =>{
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [internalFavorite] = useState(false)

  const isFavorite = externalFavorite !== undefined ? externalFavorite : internalFavorite

  const images = experience.media || []
  const hasMultipleImages = images.length > 1

  const nextImage = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (hasMultipleImages) {
      setCurrentImageIndex((prev) => (prev + 1) % images.length)
    }
  }

  const prevImage = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (hasMultipleImages) {
      setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length)
    }
  }


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
  <InteractionLink href={`/experience/${experience.id}`} className="block" interactionType={InteractionType.VIEW_EXPERIENCE} contentType={"experience"} objectId={experience.id}>
    <div className="relative w-full rounded-3xl bg-card shadow-md overflow-hidden group min-w-sm max-w-sm transition-all hover:shadow-lg">
      <div className="relative aspect-[4/3] w-full overflow-hidden">
        <Image
          src={images[currentImageIndex]?.file || "/placeholder.svg?height=300&width=400"}
          alt={experience.title || "Experience image"}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, 400px"
        />

        <Badge className="absolute top-3 left-3 px-2 py-1 border-none">
          {experience?.category?.name || "Experience"}
        </Badge>
        <WishlistButton 
          itemId={experience.id} 
          itemType={"experience"} 
          isFavorite={isFavorite} 
          className="absolute top-3 right-3 p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200"
          size="default"
          variant="outline"
        />
        {hasMultipleImages && (
          <>
            <Button
              onClick={prevImage}
              variant="ghost"
              className="absolute left-2 top-1/2 -translate-y-1/2 p-1 rounded-full bg-white/80 hover:bg-white dark:bg-gray-800/80 dark:hover:bg-gray-800 opacity-0 group-hover:opacity-100 transition-all duration-200"
              size="icon"
            >
              <ChevronLeft className="h-5 w-5 text-gray-700 dark:text-gray-300" />
              <span className="sr-only">Previous image</span>
            </Button>
            <Button
              onClick={nextImage}
              variant="ghost"
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full bg-white/80 hover:bg-white dark:bg-gray-800/80 dark:hover:bg-gray-800 opacity-0 group-hover:opacity-100 transition-all duration-200"
              size="icon"
            >
              <ChevronRight className="h-5 w-5 text-gray-700 dark:text-gray-300" />
              <span className="sr-only">Next image</span>
            </Button>
          </>
        )}

        {hasMultipleImages && (
          <div className="absolute bottom-16 left-1/2 -translate-x-1/2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-200">
            {images.map((_, index) => (
              <div
                key={index}
                className={cn(
                  "w-1.5 h-1.5 rounded-full transition-all",
                  index === currentImageIndex ? "bg-white w-2.5" : "bg-white/50",
                )}
              />
            ))}
          </div>
        )}

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
          <Badge className="px-2 py-1 bg-black/70 text-white border-none">{getDurationText(experience.duration)}</Badge>
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