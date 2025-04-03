"use client"

import { useEffect, useRef, useState } from "react"
import mapboxgl from "mapbox-gl"
import "mapbox-gl/dist/mapbox-gl.css"
import { Card, CardContent } from "@/components/ui/card"

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || ""

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
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const markersRef = useRef<{ [key: string]: mapboxgl.Marker }>({})
  const [mapLoaded, setMapLoaded] = useState(false)

  // Improved location parsing
  const parseLocation = (location: string): [number, number] | null => {
    if (!location) return null
    
    try {
      // Handle different location formats
      const coords = location.split(',').map(coord => parseFloat(coord.trim()))
      
      // Check if we have valid coordinates
      if (coords.length >= 2 && !isNaN(coords[0]) && !isNaN(coords[1])) {
        // Return [lng, lat] as Mapbox expects
        return [coords[1], coords[0]]
      }
      
      return null
    } catch (error) {
      console.error("Error parsing location:", error)
      return null
    }
  }

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [0, 20], // Default center
      zoom: 1,
    })

    map.current.on("load", () => {
      setMapLoaded(true)
    })

    map.current.addControl(new mapboxgl.NavigationControl(), "top-right")

    return () => {
      map.current?.remove()
      map.current = null
    }
  }, [])

  // Add/update markers when items or selection changes
  useEffect(() => {
    if (!map.current || !mapLoaded) return

    const bounds = new mapboxgl.LngLatBounds()
    let hasValidCoordinates = false

    // Clear existing markers
    Object.values(markersRef.current).forEach(marker => marker.remove())
    markersRef.current = {}

    items.forEach(item => {
      const coordinates = parseLocation(item.location)
      if (!coordinates) return

      hasValidCoordinates = true
      bounds.extend(coordinates)

      // Create marker element
      const markerEl = document.createElement("div")
      markerEl.className = `marker ${selectedItemId === item.id ? "selected" : ""}`
      markerEl.innerHTML = `
        <div class="w-8 h-8 flex items-center justify-center ${
          selectedItemId === item.id ? "text-primary animate-bounce" : "text-gray-700"
        }">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" class="lucide lucide-map-pin">
            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path>
            <circle cx="12" cy="10" r="3"></circle>
          </svg>
        </div>
      `

      // Create popup
      const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
        <div class="max-w-xs">
          <h3 class="font-bold">${item.title}</h3>
          ${item.description ? `<p class="text-sm mt-1">${item.description}</p>` : ""}
          ${item.image ? `<img src="${item.image}" alt="${item.title}" class="mt-2 w-full h-24 object-cover rounded" />` : ""}
        </div>
      `)

      // Create marker
      const marker = new mapboxgl.Marker({
        element: markerEl,
        anchor: "bottom"
      })
        .setLngLat(coordinates)
        .setPopup(popup)
        .addTo(map.current!)

      markersRef.current[item.id] = marker

      // Open popup if this is the selected item
      if (selectedItemId === item.id) {
        marker.togglePopup()
      }
    })

    // Fit bounds if we have valid coordinates
    if (hasValidCoordinates) {
      // Add some padding
      const padding = {
        top: 50,
        bottom: 50,
        left: 50,
        right: 50
      }

      map.current.fitBounds(bounds, {
        padding,
        maxZoom: 14,
        duration: 1000
      })
    }
  }, [items, mapLoaded, selectedItemId])

  // Handle selected item changes
  useEffect(() => {
    if (!map.current || !mapLoaded || !selectedItemId) return

    const marker = markersRef.current[selectedItemId]
    if (!marker) return

    const coordinates = marker.getLngLat()

    // Fly to the marker
    map.current.flyTo({
      center: coordinates,
      zoom: 14,
      essential: true, // ensures the animation happens even if user is interacting
      duration: 1500
    })

    // Open the popup
    setTimeout(() => {
      marker.togglePopup()
    }, 1600) // Slight delay to ensure map has moved

  }, [selectedItemId, mapLoaded])

  return (
    <>
      <div ref={mapContainer} className="w-full h-full" />
      {!mapboxgl.supported() && (
        <Card className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 max-w-md">
          <CardContent className="p-4">
            <p>Your browser doesn&apos;t support Mapbox GL. Please use a supported browser.</p>
          </CardContent>
        </Card>
      )}
    </>
  )
}