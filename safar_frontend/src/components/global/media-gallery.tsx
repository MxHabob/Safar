"use client"

import { useState } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { ChevronLeft, ChevronRight, Grid } from "lucide-react"
import { useModal } from "@/core/hooks/use-modal"
import type { Media } from "@/core/types"

export interface MediaGalleryProps {
  media: Media[]
  variant?: "default" | "grid" | "carousel" | "compact"
  maxDisplay?: number
  aspectRatio?: "square" | "video" | "wide"
  className?: string
  showViewAll?: boolean
  viewAllText?: string
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
  priority = false,
}: MediaGalleryProps) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const { onOpen } = useModal()

  if (!media.length) {
    return (
      <div className={cn("relative overflow-hidden rounded-lg bg-muted", className)}>
        <div className={cn(
          "relative w-full overflow-hidden",
          aspectRatio === "square" && "aspect-square",
          aspectRatio === "video" && "aspect-video",
          aspectRatio === "wide" && "aspect-[16/9]",
        )}>
          <Image src="/placeholder.svg" alt="No image available" fill className="object-cover w-full h-full" />
        </div>
      </div>
    )
  }

  const displayCount = Math.min(maxDisplay, media.length)
  const displayMedia = media.slice(0, displayCount)
  const hasMoreMedia = media.length > displayCount

  const handleImageClick = (index: number, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onOpen("MediaModal", { mediaArray: media, initialIndex: index })
  }

  const changeImage = (step: number) => (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setCurrentImageIndex((prev) => (prev + step + media.length) % media.length)
  }

  const renderMediaContent = (item: Media, index: number, size: string, roundedClasses?: string) => (
    <div
      key={index}
      className={cn("relative cursor-pointer", roundedClasses)}
      onClick={(e) => handleImageClick(index, e)}
    >
      <div className={cn(
        "w-full h-full",
        aspectRatio === "square" && "aspect-square",
        aspectRatio === "video" && "aspect-video",
        aspectRatio === "wide" && "aspect-[16/9]"
      )}>
        {item.type === "video" ? (
          <video src={item.file || item.url || ""} muted autoPlay loop className="object-cover w-full h-full" />
        ) : (
          <Image
            src={item.file || item.url || ""}
            alt={`Media ${index + 1}`}
            fill
            sizes={size}
            className="object-cover"
            priority={index === 0 && priority}
          />
        )}
      </div>
    </div>
  )

  const renderCompact = () => (
    <div className={cn("relative overflow-hidden rounded-lg", className)}>
      {renderMediaContent(displayMedia[0], 0, "(max-width: 768px) 100vw, 50vw")}
      {showViewAll && media.length > 1 && (
        <Button
          variant="secondary"
          size="sm"
          className="absolute bottom-2 right-2 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background/90"
          onClick={(e) => handleImageClick(0, e)}
        >
          <Grid className="h-4 w-4 mr-1" />
          <span className="text-xs">{media.length}</span>
        </Button>
      )}
    </div>
  )

  const renderDefault = () => (
    <div className={cn("relative overflow-hidden rounded-lg", className)}>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-1">
        {renderMediaContent(displayMedia[0], 0, "(max-width: 768px) 100vw, 50vw")}
        {displayMedia.slice(1).map((item, index) =>
          renderMediaContent(item, index + 1, "25vw")
        )}
      </div>

      {hasMoreMedia && showViewAll && (
        <Button
          variant="secondary"
          className="absolute bottom-3 right-3 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background/90"
          onClick={(e) => handleImageClick(0, e)}
        >
          <Grid className="h-4 w-4 mr-2" />
          <span>{viewAllText}</span>
        </Button>
      )}
    </div>
  )

  const renderGrid = () => (
    <div className={cn("relative overflow-hidden rounded-lg", className)}>
      <div className="grid grid-cols-2 gap-1">
        {displayMedia.map((item, index) => {
          const isLastOdd = displayMedia.length % 2 === 1 && index === displayMedia.length - 1
          const roundedClasses = cn(
            index === 0 && "rounded-tl-lg",
            index === 1 && "rounded-tr-lg",
            isLastOdd && "rounded-bl-lg rounded-br-lg col-span-2",
            !isLastOdd && index === displayMedia.length - 2 && "rounded-bl-lg",
            !isLastOdd && index === displayMedia.length - 1 && "rounded-br-lg"
          )
          return renderMediaContent(item, index, "(max-width: 768px) 50vw, 25vw", roundedClasses)
        })}
      </div>

      {hasMoreMedia && showViewAll && (
        <Button
          variant="secondary"
          className="absolute bottom-3 right-3 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background/90"
          onClick={(e) => handleImageClick(0, e)}
        >
          <Grid className="h-4 w-4 mr-2" />
          <span>{viewAllText}</span>
        </Button>
      )}
    </div>
  )

  const renderCarousel = () => {
    const currentMedia = displayMedia[currentImageIndex % displayMedia.length]
    const isVideo = currentMedia.type === "video"

    return (
      <div className={cn("relative overflow-hidden rounded-lg group", className)}>
        <div
          className={cn(
            "w-full",
            aspectRatio === "square" && "aspect-square",
            aspectRatio === "video" && "aspect-video",
            aspectRatio === "wide" && "aspect-[16/9]"
          )}
          onClick={(e) => handleImageClick(currentImageIndex, e)}
        >
          {isVideo ? (
            <video src={currentMedia.file || currentMedia.url || ""} muted autoPlay loop className="object-cover w-full h-full" />
          ) : (
            <Image
              src={currentMedia.file || currentMedia.url || ""}
              alt={`Media ${currentImageIndex + 1}`}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
              priority={priority}
            />
          )}
        </div>

        {displayMedia.length > 1 && (
          <>
            <button
              onClick={changeImage(-1)}
              aria-label="Previous"
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/70 hover:bg-background/90 rounded-full p-2 backdrop-blur-sm hidden group-hover:block"
            >
              <ChevronLeft className="h-5 w-5 text-foreground" />
            </button>

            <button
              onClick={changeImage(1)}
              aria-label="Next"
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-background/70 hover:bg-background/90 rounded-full p-2 backdrop-blur-sm hidden group-hover:block"
            >
              <ChevronRight className="h-5 w-5 text-foreground" />
            </button>
          </>
        )}
      </div>
    )
  }

  const renderVariant = () => {
    switch (variant) {
      case "compact": return renderCompact()
      case "grid": return renderGrid()
      case "carousel": return renderCarousel()
      case "default":
      default: return renderDefault()
    }
  }

  return renderVariant()
}
