"use client"

import { useState } from "react"
import { useGetPlacesQuery } from "@/redux/services/api"
import { Button } from "@/components/ui/button"
import { Loader2 } from 'lucide-react'
import { PlaceCard } from "./place-card"

type Props = {
  overlay?: boolean
  selected?: string
  favorites?: string[]
  onFavoriteToggle?: (id: string) => void
}

export const ListPlaces = ({ selected, favorites = [], onFavoriteToggle }: Props) => {
  const [page, setPage] = useState(1)

  const { data, isLoading, isFetching, error } = useGetPlacesQuery({
    page,
    page_size: 10,
  })
  
  const allPlaces = (() => {
    const accumulated = []
    for (let i = 1; i <= page; i++) {
      const pageData = data?.results || []

      if (i === page && pageData.length > 0) {
        accumulated.push(...pageData)
      }
    }
    const uniquePlaces = []
    const seenIds = new Set()

    for (const place of accumulated) {
      if (!seenIds.has(place.id)) {
        seenIds.add(place.id)
        uniquePlaces.push(place)
      }
    }

    return uniquePlaces
  })()

  const handleLoadMore = () => {
    setPage((prev) => prev + 1)
  }

  const hasMorePlaces = data?.next !== null
  
  const isPlaceFavorited = (placeId: string) => {
    return favorites.includes(placeId)
  }

  const handleFavorite = (id: string) => {
    if (onFavoriteToggle) {
      onFavoriteToggle(id)
    }
  }

  if (error) {
    return (
      <div className="flex justify-center items-center p-8 text-red-500">
        <p>Error loading places. Please try again later.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col w-full mt-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-12 w-full overflow-x-auto pb-4">
        {allPlaces.length > 0 ? (
          allPlaces.map((place) => (
            <div
              key={place.id}
              className={`transition-all duration-200 ${
                selected === place.id ? "scale-[1.02] ring-2 ring-primary ring-offset-2 rounded-3xl" : ""
              }`}
            >
                <PlaceCard 
                  place={place} 
                  onFavorite={handleFavorite} 
                  isFavorited={isPlaceFavorited(place.id)} 
                />
            </div>
          ))
        ) : !isLoading ? (
          <div className="flex justify-center items-center p-8 text-gray-500 col-span-full">
            <p>No places found.</p>
          </div>
        ) : null}

        {isLoading && (
          <div className="flex justify-center p-6 col-span-full">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-12 w-full overflow-x-auto pb-4">
            <PlaceCard.Skeleton />
            <PlaceCard.Skeleton />
            <PlaceCard.Skeleton />
            <PlaceCard.Skeleton />
            </div>
          </div>
        )}
      </div>

      {/* Load more button */}
      {hasMorePlaces && (
        <div className="mt-4 w-full flex justify-center">
          <Button 
            onClick={handleLoadMore} 
            disabled={isFetching} 
            className="px-8" 
            variant="outline"
          >
            {isFetching ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              "Load More"
            )}
          </Button>
        </div>
      )}
    </div>
  )
}
