"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Heart, MapPin, Calendar } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { Box } from "@/redux/types/types"

interface BoxCardProps {
  box: Box
}

export const BoxCard = ({ box }: BoxCardProps) => {
  const [isFavorite, setIsFavorite] = useState(false)

  const formattedPrice = (box?.total_price ?? 0).toLocaleString()
  const toggleFavorite = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsFavorite((prev) => !prev)
  }

  return (
    <Link href={`/box/${box.id}`} className="block">
      <div className="relative h-[350px] w-[280px] min-w-sm rounded-3xl bg-card hover:backdrop-blur-lg overflow-hidden group transition-all hover:shadow-lg">
        <div className="relative h-[180px]">
        <div className="grid grid-cols-3 gap-0.5 h-full w-full">
          <div className="relative col-span-2 row-span-2 overflow-hidden rounded-l-3xl">
            <Image
              src={box.images?.[0]?.file || "/placeholder.svg"}
              alt={`${box.name} main image`}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 768px) 60vw, 40vw"
              priority
            />
          </div>
          <div className="flex flex-col gap-0.5  row-span-2">
            {box.images.slice(1, 4).map((image, index) => (
              <div key={`${box.id}-side-image-${index}`} className="relative flex-1 overflow-hidden">
                <Image
                  src={image.file || "/placeholder.svg"}
                  alt={`${box.name} additional image ${index + 1}`}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 768px) 20vw, 15vw"
                />
              </div>
            ))}
          </div>
        </div>
          <Button
            variant="ghost"
            className="absolute top-3 right-3 p-1.5 rounded-full bg-white/80 hover:bg-white dark:bg-gray-800/80 dark:hover:bg-gray-800 opacity-0 group-hover:opacity-100 transition-all duration-200 z-10"
            size="icon"
            onClick={toggleFavorite}
          >
            <Heart
              className={cn("h-4 w-4", isFavorite ? "fill-red-500 text-red-500" : "text-gray-700 dark:text-gray-300")}
            />
            <span className="sr-only">Add to favorites</span>
          </Button>

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
            <span className="truncate text-xs">{box?.country} - {box?.city}</span>
          </div>

          <h3 className="mb-1 text-lg font-semibold line-clamp-1" title={box.name}>
            {box.name}
          </h3>
          <p className="mb-3 text-sm text-muted-foreground line-clamp-1">
            {box.description || "Unknown"}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-2 mb-1">
            {box.places && (
              <Badge variant="outline" className="flex items-center text-sm font-normal">
                <Calendar className="h-3 w-3 mr-1" />
                Place - {box.places.length}
              </Badge>
            )}
            {box.experiences && (
              <Badge variant="outline" className="flex items-center text-sm font-normal">
                <Calendar className="h-3 w-3 mr-1" />
                Experiences - {box.experiences.length}
              </Badge>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}
