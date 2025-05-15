"use client"

import { useState, useCallback, useRef } from "react"
import { useGetRecommendationsQuery } from "@/core/services/api"
import { Button } from "@/components/ui/button"
import { PlaceCard } from "./place-card"
import { Spinner } from "@/components/ui/spinner"
import type { Place } from "@/core/types"
import { useSearchParams } from "next/navigation"

type Props = {
  country?: string
  city?: string
  overlay?: boolean
  selected?: string
  recommendationType?: "personalized" | "trending" | "seasonal" | "nearby" | "popular"
}

export const ListPlaces = ({ selected, country, city, recommendationType = "personalized" }: Props) => {
  const searchParams = useSearchParams()
  const category = searchParams.get("category")
  const [page, setPage] = useState(1)
  const placesCache = useRef<Place[]>([])

  // Calculate offset based on page
  const offset = (page - 1) * 12

  const { data, isLoading, isFetching, error } = useGetRecommendationsQuery(
    {
      type: recommendationType,
      item_type: "places",
      limit: 12,
      offset,
      category: category || undefined,
      country: country || undefined,
      city: city || undefined,
    },
    {
      refetchOnMountOrArgChange: false,
      selectFromResult: (result) => {
        if (result.data?.places && !result.isFetching) {
          if (page === 1) {
            placesCache.current = result.data.places
          } else {
            const newPlaces = result.data.places.filter(
              (newPlace) => !placesCache.current.some((place) => place.id === newPlace.id),
            )
            if (newPlaces.length > 0) {
              placesCache.current = [...placesCache.current, ...newPlaces]
            }
          }
        }
        return result
      },
    },
  )

  const handleLoadMore = useCallback(() => {
    if (!isFetching) {
      setPage((prev) => prev + 1)
    }
  }, [isFetching])

  // Check if there are more places to load
  // Since the recommendation endpoint might not have pagination info,
  // we'll assume there are more if we received a full page of results
  const hasMorePlaces = data?.places && data.places.length === 12

  if (error) {
    return (
      <div className="flex justify-center items-center p-8 text-red-500">
        <p>Error loading recommendations. Please try again later.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col w-full mt-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 w-full pb-4">
        {placesCache.current.length > 0 ? (
          placesCache.current.map((place) => (
            <div
              key={place.id}
              className={`w-full transition-all duration-200 ${
                selected === place.id ? "scale-[1.02] ring-2 ring-primary ring-offset-2 rounded-3xl" : ""
              }`}
            >
              <PlaceCard place={place} />
            </div>
          ))
        ) : !isLoading ? (
          <div className="flex justify-center items-center p-8 text-gray-500 col-span-full">
            <p>No places found.</p>
          </div>
        ) : null}

        {isLoading && page === 1 && (
          <>
            {Array.from({ length: 4 }).map((_, i) => (
              <PlaceCard.Skeleton key={i} />
            ))}
          </>
        )}
      </div>

      {hasMorePlaces && (
        <div className="my-8 w-full flex justify-center">
          <Button onClick={handleLoadMore} disabled={isFetching} className="px-8" variant="outline">
            {isFetching ? <Spinner size={"lg"} /> : "More"}
          </Button>
        </div>
      )}
    </div>
  )
}
