"use client"

import type React from "react"

import { useState } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { ChevronLeft, ChevronRight, Grid } from "lucide-react"
import { useModal } from "@/core/hooks/use-modal"

export interface MediaItem {
  file: string
  url?: string
  type?: "image" | "video"
  id?: string
}

export interface MediaGalleryProps {
  media: MediaItem[]
  variant?: "default" | "grid" | "carousel" | "compact"
  maxDisplay?: number
  aspectRatio?: "square" | "video" | "wide"
  className?: string
  showViewAll?: boolean
  viewAllText?: string
  onViewAll?: () => void
  priority?: boolean
}

export const MediaGallery = ({
  media = [],
  variant = "default",
  maxDisplay = 5,
  aspectRatio = "square",
  className,
  showViewAll = true,
  viewAllText = "Show all photos",
  onViewAll,
  priority = false,
}: MediaGalleryProps) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const { onOpen } = useModal()

  // Handle empty media array
  if (!media.length) {
    return (
      <div className={cn("relative overflow-hidden rounded-lg bg-muted", className)}>
        <div
          className={cn(
            "w-full",
            aspectRatio === "square" && "aspect-square",
            aspectRatio === "video" && "aspect-video",
            aspectRatio === "wide" && "aspect-[16/9]",
          )}
        >
          <Image src="/placeholder.svg" alt="No image available" fill className="object-cover" />
        </div>
      </div>
    )
  }

  // Ensure we don't try to display more images than we have
  const displayCount = Math.min(maxDisplay, media.length)
  const displayMedia = media.slice(0, displayCount)
  const hasMoreMedia = media.length > displayCount

  const handleViewAll = (e?: React.MouseEvent) => {
    e?.preventDefault()
    e?.stopPropagation()

    if (onViewAll) {
      onViewAll()
    } else {
      onOpen("MediaModel", { media: { file: media[0].file, type: "image" }, mediaArray: media })
    }
  }

  const handleImageClick = (index: number, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onOpen("MediaModel", {
      media: { file: media[index].file, type: "image" },
      mediaArray: media,
      initialIndex: index,
    })
  }

  const nextImage = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (media.length > 1) {
      setCurrentImageIndex((prev) => (prev + 1) % media.length)
    }
  }

  const prevImage = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (media.length > 1) {
      setCurrentImageIndex((prev) => (prev - 1 + media.length) % media.length)
    }
  }

  const renderCompactVariant = () => (
    <div className={cn("relative overflow-hidden rounded-lg", className)}>
      <div
        className={cn(
          "w-full",
          aspectRatio === "square" && "aspect-square",
          aspectRatio === "video" && "aspect-video",
          aspectRatio === "wide" && "aspect-[16/9]",
        )}
        onClick={(e) => handleImageClick(0, e)}
      >
        <Image
          src={displayMedia[0].file || "/placeholder.svg"}
          alt="Media"
          fill
          className="object-cover cursor-pointer"
          sizes="(max-width: 768px) 100vw, 50vw"
          priority={priority}
        />
      </div>

      {media.length > 1 && showViewAll && (
        <Button
          variant="secondary"
          size="sm"
          className="absolute bottom-2 right-2 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background/90"
          onClick={handleViewAll}
        >
          <Grid className="h-4 w-4 mr-1" />
          <span className="text-xs">{media.length}</span>
        </Button>
      )}
    </div>
  )

  const renderDefaultVariant = () => (
    <div className={cn("relative overflow-hidden rounded-lg", className)}>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-1">
        <div className="md:col-span-2 md:row-span-2 relative cursor-pointer" onClick={(e) => handleImageClick(0, e)}>
          <div
            className={cn(
              "w-full h-full min-h-[200px]",
              aspectRatio === "square" && "aspect-square md:aspect-auto",
              aspectRatio === "video" && "aspect-video md:aspect-auto",
              aspectRatio === "wide" && "aspect-[16/9] md:aspect-auto",
            )}
          >
            <Image
              src={displayMedia[0].file || "/placeholder.svg"}
              alt="Main image"
              fill
              className="object-cover rounded-l-lg"
              sizes="(max-width: 768px) 100vw, 50vw"
              priority={priority}
            />
          </div>
        </div>

        {displayMedia.slice(1).map((item, index) => (
          <div
            key={index}
            className="relative hidden md:block cursor-pointer"
            onClick={(e) => handleImageClick(index + 1, e)}
          >
            <div
              className={cn(
                "w-full h-full",
                index === 0 && "rounded-tr-lg",
                index === displayMedia.length - 2 && "rounded-br-lg",
              )}
            >
              <Image
                src={item.file || "/placeholder.svg"}
                alt={`Image ${index + 2}`}
                fill
                className="object-cover"
                sizes="25vw"
              />
            </div>
          </div>
        ))}
      </div>

      {hasMoreMedia && showViewAll && (
        <Button
          variant="secondary"
          className="absolute bottom-3 right-3 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background/90"
          onClick={handleViewAll}
        >
          <Grid className="h-4 w-4 mr-2" />
          <span>{viewAllText}</span>
        </Button>
      )}
    </div>
  )

  const renderGridVariant = () => (
    <div className={cn("relative overflow-hidden rounded-lg", className)}>
      <div className="grid grid-cols-2 gap-1">
        {displayMedia.map((item, index) => (
          <div key={index} className="relative cursor-pointer" onClick={(e) => handleImageClick(index, e)}>
            <div
              className={cn(
                "w-full",
                aspectRatio === "square" && "aspect-square",
                aspectRatio === "video" && "aspect-video",
                aspectRatio === "wide" && "aspect-[16/9]",
                index === 0 && "rounded-tl-lg",
                index === 1 && "rounded-tr-lg",
                displayMedia.length % 2 === 1 &&
                  index === displayMedia.length - 1 &&
                  "rounded-bl-lg rounded-br-lg col-span-2",
                displayMedia.length % 2 === 0 && index === displayMedia.length - 2 && "rounded-bl-lg",
                displayMedia.length % 2 === 0 && index === displayMedia.length - 1 && "rounded-br-lg",
              )}
            >
              <Image
                src={item.file || "/placeholder.svg"}
                alt={`Image ${index + 1}`}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 50vw, 25vw"
                priority={index === 0 && priority}
              />
            </div>
          </div>
        ))}
      </div>

      {hasMoreMedia && showViewAll && (
        <Button
          variant="secondary"
          className="absolute bottom-3 right-3 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background/90"
          onClick={handleViewAll}
        >
          <Grid className="h-4 w-4 mr-2" />
          <span>{viewAllText}</span>
        </Button>
      )}
    </div>
  )

  const renderCarouselVariant = () => (
    <div className={cn("relative overflow-hidden rounded-lg", className)}>
      <div
        className={cn(
          "w-full cursor-pointer",
          aspectRatio === "square" && "aspect-square",
          aspectRatio === "video" && "aspect-video",
          aspectRatio === "wide" && "aspect-[16/9]",
        )}
        onClick={(e) => handleImageClick(currentImageIndex, e)}
      >
        <Image
          src={displayMedia[currentImageIndex % displayMedia.length].file || "/placeholder.svg"}
          alt={`Image ${currentImageIndex + 1}`}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 50vw"
          priority={priority}
        />
      </div>

      {displayMedia.length > 1 && (
        <>
          <Button
            onClick={prevImage}
            className="absolute left-2 top-1/2 -translate-y-1/2 p-1 rounded-full bg-background/60 hover:bg-background/80 opacity-0 group-hover:opacity-100 transition-all duration-200"
            size="icon"
            variant="ghost"
          >
            <ChevronLeft className="h-5 w-5" />
            <span className="sr-only">Previous image</span>
          </Button>
          <Button
            onClick={nextImage}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full bg-background/60 hover:bg-background/80 opacity-0 group-hover:opacity-100 transition-all duration-200"
            size="icon"
            variant="ghost"
          >
            <ChevronRight className="h-5 w-5" />
            <span className="sr-only">Next image</span>
          </Button>
        </>
      )}

      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
        {displayMedia.map((_, index) => (
          <div
            key={index}
            className={cn(
              "w-1.5 h-1.5 rounded-full transition-all cursor-pointer",
              index === currentImageIndex % displayMedia.length ? "bg-white w-2.5" : "bg-white/50",
            )}
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              setCurrentImageIndex(index)
            }}
          />
        ))}
      </div>

      {hasMoreMedia && showViewAll && (
        <Button
          variant="secondary"
          className="absolute bottom-3 right-3 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background/90"
          onClick={handleViewAll}
        >
          <Grid className="h-4 w-4 mr-2" />
          <span>{viewAllText}</span>
        </Button>
      )}
    </div>
  )

  // Render the appropriate variant
  const renderVariant = () => {
    switch (variant) {
      case "compact":
        return renderCompactVariant()
      case "grid":
        return renderGridVariant()
      case "carousel":
        return renderCarouselVariant()
      case "default":
      default:
        return renderDefaultVariant()
    }
  }

  return renderVariant()
}
