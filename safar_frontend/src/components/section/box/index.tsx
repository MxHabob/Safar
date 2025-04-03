"use client"

import { useState } from "react"

import { Skeleton } from "@/components/ui/skeleton"
import { useGetBoxQuery } from "@/redux/services/api"
import MapView from "./map-view"
import BoxContentsView from "./box-contents-view"

export const BoxPageContant = ({id}:{id:string}) => {
  const { data: box, isLoading, error } = useGetBoxQuery(id)
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null)

  console.log("box : ", box)
  const mapItems: Array<{
    id: string;
    type: "place" | "experience";
    title: string;
    location: string;
    description: string;
    image: string | null;
  }> = []

  if (box) {
    // Add places to map items
    if (box.places && box.places.length > 0) {
      box.places.forEach((place) => {
        if (place.location) {
          mapItems.push({
            id: place.id,
            type: "place" as const,
            title: place.name,
            location: place.location,
            description: place.description || "",
            image: place.images && place.images.length > 0 ? place.images[0].url : null,
          })
        }
      })
    }

    // Add experiences to map items
    if (box.experiences && box.experiences.length > 0) {
      box.experiences.forEach((experience) => {
        if (experience.location) {
          mapItems.push({
            id: experience.id,
            type: "experience" as const,
            title: experience.title,
            location: experience.location,
            description: experience.description || "",
            image: experience.images && experience.images.length > 0 ? experience.images[0].url : null,
          })
        }
      })
    }
  }

  const handleItemClick = (id: string) => {
    setSelectedItemId(id)
  }

  if (isLoading) {
    return (
      <div className="flex h-screen flex-col md:flex-row">
        <div className="h-1/2 md:h-screen md:w-1/2">
          <Skeleton className="h-full w-full" />
        </div>
        <div className="h-1/2 md:h-screen md:w-1/2 p-4">
          <Skeleton className="h-24 w-full mb-4" />
          <Skeleton className="h-full w-full" />
        </div>
      </div>
    )
  }

  if (error || !box) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold">Error loading travel box</h2>
          <p className="text-muted-foreground">Please try again later</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen flex-col md:flex-row">
      <div className="h-[50vh] md:h-screen md:w-1/2 overflow-y-auto p-4">
        <h1 className="text-2xl font-bold mb-2">{box.name}</h1>
        {box.description && <p className="text-muted-foreground mb-4">{box.description}</p>}
        <BoxContentsView box={box} onItemClick={handleItemClick} selectedItemId={selectedItemId} />
      </div>
      <div className="h-[50vh] md:h-screen md:w-1/2 relative">
        <MapView items={mapItems} selectedItemId={selectedItemId} />
      </div>
    </div>
  )
}

