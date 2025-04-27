"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { useGetPlacesQuery } from "@/core/services/api"
import { Button } from "@/components/ui/button"
import { PlaceCard } from "./place-card"
import { Spinner } from "@/components/ui/spinner"
import type { Place } from "@/core/types"

type Props = {
  overlay?: boolean
  selected?: string
}

export const ListPlaces = ({ selected }: Props) => {
  const [page, setPage] = useState(1)
  const placesCache = useRef<Place[]>([])

  const { data, isLoading, isFetching, error } = useGetPlacesQuery(
    { page, page_size: 12 },
    { refetchOnMountOrArgChange: false },
  )

  useEffect(() => {
    if (data?.results && !isFetching && page === 1) {
      placesCache.current = data.results
    } else if (data?.results && !isFetching && page > 1) {
      const newPlaces = data.results.filter(
        (newPlace) => !placesCache.current.some((place) => place.id === newPlace.id),
      )
      if (newPlaces.length > 0) {
        placesCache.current = [...placesCache.current, ...newPlaces]
      }
    }
  }, [data, isFetching, page])

  const handleLoadMore = useCallback(() => {
    if (!isFetching) {
      setPage((prev) => prev + 1)
    }
  }, [isFetching])

  const hasMorePlaces = data?.next !== null

  if (error) {
    return (
      <div className="flex justify-center items-center p-8 text-red-500">
        <p>Error loading places. Please try again later.</p>
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
            {[1, 2, 3, 4].map((i) => (
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
