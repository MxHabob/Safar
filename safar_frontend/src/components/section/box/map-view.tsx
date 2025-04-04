"use client"

interface MapItem {
  id: string
  type: "place" | "experience"
  title: string
  location: string
  description?: string
  image?: string | null
}

interface MapViewProps {
  items: MapItem[]
  selectedItemId: string | null
}

export default function MapView({ items, selectedItemId }: MapViewProps) {

  return (
    <div
    </div>
  )
}