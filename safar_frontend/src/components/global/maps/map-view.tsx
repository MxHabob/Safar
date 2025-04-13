"use client"

import { useRef, useEffect, useState } from "react"
import mapboxgl from "mapbox-gl"
import "mapbox-gl/dist/mapbox-gl.css"

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || ""

interface Location {
  coordinates: [number, number]
  country?: string
  city?: string
}

interface Activity {
  id: string
  type: "place" | "experience" | "custom"
  name?: string
  title?: string
  location?: Location
  [key: string]: any
}

interface ItineraryDay {
  day_number: number
  date: string | null
  location: string | null
  activities: Activity[]
}

interface Itinerary {
  box_name: string
  total_price: number
  currency: string
  days: ItineraryDay[]
}

interface MapViewProps {
  itinerary: Itinerary
  visitedPlaces: Set<string>
  onMapReady: () => void
  activeDay: number | null
}

export default function MapView({ itinerary, visitedPlaces, onMapReady, activeDay }: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const [mapLoaded, setMapLoaded] = useState(false)
  const markersRef = useRef<{ [key: string]: mapboxgl.Marker }>({})
  const pathLayerRef = useRef<string | null>(null)

  const getActivities = () => {
    if (!activeDay) {
      return itinerary.days.flatMap((day) => day.activities)
    }

    const activeItineraryDay = itinerary.days.find((day) => day.day_number === activeDay)
    return activeItineraryDay ? activeItineraryDay.activities : []
  }

  const getInitialCenter = () => {
    const activities = getActivities()

    for (const activity of activities) {
      if (activity.location?.coordinates) {
        return activity.location.coordinates
      }
    }

    return [0, 0]
  }

  useEffect(() => {
    if (!mapContainer.current || map.current) return

    const initialCenter = getInitialCenter()

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: initialCenter || [],
      zoom: 10,
    })

    map.current.on("load", () => {
      setMapLoaded(true)
      onMapReady()
    })

    return () => {
      map.current?.remove()
      map.current = null
    }
  }, [])

  // Update markers and path when data changes
  useEffect(() => {
    if (!map.current || !mapLoaded) return

    // Clear existing markers
    Object.values(markersRef.current).forEach((marker) => marker.remove())
    markersRef.current = {}

    // Remove existing path layer and source
    if (pathLayerRef.current && map.current.getLayer(pathLayerRef.current)) {
      map.current.removeLayer(pathLayerRef.current)
      map.current.removeSource(pathLayerRef.current)
      pathLayerRef.current = null
    }

    const activities = getActivities()
    const coordinates: [number, number][] = []

    // Add markers for all activities with locations
    activities.forEach((activity) => {
      if (!activity.location?.coordinates) return

      const [lng, lat] = activity.location.coordinates
      if (isNaN(lng) || isNaN(lat)) return

      coordinates.push([lng, lat])

      // Create marker element
      const markerEl = document.createElement("div")
      markerEl.className = "flex flex-col items-center"

      const iconEl = document.createElement("div")
      iconEl.className = `w-8 h-8 flex items-center justify-center rounded-full ${
        visitedPlaces.has(activity.id) ? "bg-green-500" : "bg-primary"
      }`

      // Use Flag icon for visited places, MapPin for others
      if (visitedPlaces.has(activity.id)) {
        iconEl.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" class="lucide lucide-flag"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" x2="4" y1="22" y2="15"/></svg>`
      } else {
        iconEl.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" class="lucide lucide-map-pin"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>`
      }

      markerEl.appendChild(iconEl)

      // Add label
      const labelEl = document.createElement("div")
      labelEl.className = "text-xs font-semibold mt-1 text-black px-2 py-1 rounded shadow"
      labelEl.textContent = activity.name || activity.title || "Location"
      markerEl.appendChild(labelEl)

      const marker = new mapboxgl.Marker({ element: markerEl }).setLngLat([lng, lat]).addTo(map.current!)

      markersRef.current[activity.id] = marker
    })

    // Add path if we have coordinates
    if (coordinates.length > 1) {
      const sourceId = `route-${activeDay || "all"}`
      pathLayerRef.current = sourceId

      map.current.addSource(sourceId, {
        type: "geojson",
        data: {
          type: "Feature",
          properties: {},
          geometry: {
            type: "LineString",
            coordinates,
          },
        },
      })

      map.current.addLayer({
        id: sourceId,
        type: "line",
        source: sourceId,
        layout: {
          "line-join": "round",
          "line-cap": "round",
        },
        paint: {
          "line-color": "#4338ca",
          "line-width": 4,
          "line-opacity": 0.8,
        },
      })
    }

    // Fit bounds to include all markers
    if (coordinates.length > 0) {
      const bounds = new mapboxgl.LngLatBounds()
      coordinates.forEach((coord) => bounds.extend(coord))

      if (!bounds.isEmpty()) {
        map.current.fitBounds(bounds, {
          padding: 50,
          maxZoom: 12,
        })
      }
    }
  }, [mapLoaded, itinerary, visitedPlaces, activeDay, getActivities])

  return <div ref={mapContainer} className="w-full h-full" />
}

