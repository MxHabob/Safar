"use client"

import { useState } from "react"
import Image from "next/image"
import { Heart, MapPin, ChevronRight, ChevronLeft } from 'lucide-react'
import { cn } from "@/lib/utils"
import { Place } from "@/redux/types/types"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { WishlistButton } from "../wishlist-button"

interface PlaceCardProps {
  place: Place;
  onFavorite?: (id: string) => void;
  isFavorited?: boolean;
}

export const PlaceCard =({ place, onFavorite, isFavorited: externalFavorite }: PlaceCardProps) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [internalFavorite, setInternalFavorite] = useState(false)
  
  // Use external favorite state if provided, otherwise use internal state
  const isFavorite = externalFavorite !== undefined ? externalFavorite : internalFavorite
  
  // Safely access images array with fallbacks
  const images = place.media || []
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

  const handleFavorite = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    setInternalFavorite(!internalFavorite)
    if (onFavorite) {
      onFavorite(place.id)
    }
  }

  // Format price with proper currency
  const formattedPrice = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: place.currency || "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(place.price || 0)


  return (
<Link href={`/place/${place.id}`} className="block">
  <div className="relative w-full rounded-3xl bg-card shadow-md overflow-hidden group transition-all hover:shadow-lg">
      <div className="relative aspect-[4/3] w-full overflow-hidden">
        <Image
          src={images[currentImageIndex]?.file ?? "/placeholder.svg?height=300&width=400"}
          alt={place.name || "Place image"}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, 400px"
        />

        {place?.category?.name && (
           <Badge className="absolute top-3 left-3 px-2 py-1 border-none">
            {place.category.name}
          </Badge>
        )}

          <WishlistButton 
           placeId={place.id} 
           className="absolute top-3 right-3 p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200"
           isInitiallyFavorited={isFavorite} 
           size="default"
           variant="outline"
         />

        {hasMultipleImages && (
          <>
            <Button
              onClick={prevImage}
              className="absolute left-2 top-1/2 -translate-y-1/2 p-1 rounded-full bg-white/80 hover:bg-white dark:bg-gray-800/80 dark:hover:bg-gray-800 opacity-0 group-hover:opacity-100 transition-all duration-200"
              size="icon"
              variant="ghost"
            >
              <ChevronLeft className="h-5 w-5 text-gray-700 dark:text-gray-300" />
              <span className="sr-only">Previous image</span>
            </Button>
            <Button
              onClick={nextImage}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full bg-white/80 hover:bg-white dark:bg-gray-800/80 dark:hover:bg-gray-800 opacity-0 group-hover:opacity-100 transition-all duration-200"
              size="icon"
              variant="ghost"
            >
              <ChevronRight className="h-5 w-5 text-gray-700 dark:text-gray-300" />
              <span className="sr-only">Next image</span>
            </Button>
          </>
        )}

        {hasMultipleImages && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-200">
            {images.map((_, index) => (
              <div
                key={index}
                className={cn(
                  "w-1.5 h-1.5 rounded-full transition-all", 
                  index === currentImageIndex ? "bg-white w-2.5" : "bg-white/50"
                )}
              />
            ))}
          </div>
        )}

        {!place.is_available && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <span className="text-white font-medium text-sm px-3 py-1.5 bg-black/40 rounded-md">Not Available</span>
          </div>
        )}
      </div>

      <div className="p-4">
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

        <p className="text-sm text-gray-600 dark:text-gray-300 mb-2.5 line-clamp-2">{place.description || "No description available"}</p>

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
</Link>
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