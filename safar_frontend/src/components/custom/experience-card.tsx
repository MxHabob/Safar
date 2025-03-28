"use client"

import { useState } from "react"
import Image from "next/image"
import { Heart, MapPin, ChevronRight, ChevronLeft, Clock, Users } from "lucide-react"
import { cn } from "@/lib/utils"

interface ExperienceCardProps {
  id: string
  title: string
  description: string
  place?: {
    id: string
    name: string
  }
  owner: {
    id: string
    name: string
    avatar: string
  }
  location: string
  price_per_person: number
  currency: string
  duration: number
  capacity: number
  schedule: unknown[]
  images: string[]
  rating: number
  is_available: boolean
  category: string
  onFavorite?: (id: string) => void
}

export default function ExperienceCard({
  id,
  title,
  description,
  owner,
  location,
  price_per_person,
  currency,
  duration,
  capacity,
  images,
  rating,
  is_available,
  category,
  onFavorite,
}: ExperienceCardProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isFavorite, setIsFavorite] = useState(false)

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length)
  }

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length)
  }

  const handleFavorite = () => {
    setIsFavorite(!isFavorite)
    if (onFavorite) {
      onFavorite(id)
    }
  }

  const formattedPrice = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price_per_person)
  const getDurationText = (minutes: number) => {
    if (minutes >= 1440) {
      const days = Math.floor(minutes / 1440)
      return `${days} Day${days > 1 ? "s" : ""}`
    } else {
      const hours = Math.floor(minutes / 60)
      return `${hours} Hour${hours > 1 ? "s" : ""}`
    }
  }

  return (
    <div className="relative w-full max-w-sm rounded-3xl bg-white dark:bg-gray-800 shadow-md dark:shadow-gray-900/30 overflow-hidden group transition-colors">
      <div className="relative aspect-[4/3] w-full overflow-hidden">
        <Image
          src={images[currentImageIndex] || "/placeholder.svg?height=300&width=400"}
          alt={title}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 400px"
        />

        <div className="absolute top-3 left-3 bg-white dark:bg-gray-900 text-black dark:text-white text-xs font-medium px-2 py-1 rounded-full">
          {category}
        </div>

        <button
          onClick={handleFavorite}
          className="absolute top-3 right-3 bg-white/80 dark:bg-gray-800/80 p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"
        >
          <Heart
            className={cn("h-5 w-5", isFavorite ? "fill-red-500 text-red-500" : "text-gray-700 dark:text-gray-300")}
          />
        </button>

        {images.length > 1 && (
          <>
            <button
              onClick={prevImage}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 dark:bg-gray-800/80 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            >
              <ChevronLeft className="h-5 w-5 text-gray-700 dark:text-gray-300" />
            </button>
            <button
              onClick={nextImage}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 dark:bg-gray-800/80 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            >
              <ChevronRight className="h-5 w-5 text-gray-700 dark:text-gray-300" />
            </button>
          </>
        )}

        {images.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            {images.map((_, index) => (
              <div
                key={index}
                className={cn("w-1.5 h-1.5 rounded-full", index === currentImageIndex ? "bg-white" : "bg-white/50")}
              />
            ))}
          </div>
        )}

        <div className="absolute bottom-3 left-3 right-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="relative w-8 h-8 rounded-full overflow-hidden border-2 border-white dark:border-gray-800">
              <Image
                src={owner.avatar || "/placeholder.svg?height=40&width=40"}
                alt={owner.name}
                fill
                className="object-cover"
              />
            </div>
            <span className="text-xs text-white font-medium drop-shadow-md">by {owner.name}</span>
          </div>
          <div className="bg-white/80 dark:bg-gray-800/80 text-gray-900 dark:text-white text-xs font-medium px-2 py-1 rounded-full">
            {getDurationText(duration)}
          </div>
        </div>

        {!is_available && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="text-white font-medium">Not Available</span>
          </div>
        )}
      </div>

      <div className="p-4">
        <div className="flex justify-between items-start mb-1">
          <h3 className="font-semibold text-lg text-gray-900 dark:text-white">{title}</h3>
          <div className="flex items-center gap-1">
            <span className="text-sm font-medium text-yellow-500">★</span>
            <span className="text-sm font-medium text-gray-900 dark:text-white">{rating.toFixed(2)}</span>
          </div>
        </div>

        <p className="text-sm text-gray-600 dark:text-gray-300 mb-2 line-clamp-2">{description}</p>

        <div className="flex items-center text-gray-500 dark:text-gray-400 text-sm mb-3">
          <MapPin className="h-3.5 w-3.5 mr-1" />
          <span>{location}</span>
        </div>

        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-center">
              <Clock className="h-3.5 w-3.5 mr-1" />
              <span>{Math.floor(duration / 60)} hrs</span>
            </div>
            <div className="flex items-center">
              <Users className="h-3.5 w-3.5 mr-1" />
              <span>Up to {capacity}</span>
            </div>
          </div>
          <div className="font-semibold text-base text-gray-900 dark:text-white">
            {formattedPrice}
            <span className="text-xs font-normal text-gray-500 dark:text-gray-400">/person</span>
          </div>
        </div>
      </div>
    </div>
  )
}

