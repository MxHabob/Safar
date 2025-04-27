"use client"

import { useRef, useState, useEffect } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'

interface MapboxMapProps {
  location: string
  height?: string
  zoom?: number
  interactive?: boolean
}

export const MapboxMap = ({ 
  location, 
  height = "300px", 
  zoom = 14, 
  interactive = true 
}: MapboxMapProps) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const markerRef = useRef<mapboxgl.Marker | null>(null)
  const [isMapInitialized, setIsMapInitialized] = useState(false)

  const parseLocation = (locationString: string) => {
    if (!locationString) return null
    
    try {
      const coordsString = locationString.match(/POINT $$([^)]+)$$/)?.[1]
      if (!coordsString) return null

      const [lng, lat] = coordsString.split(' ').map(Number)
      
      if (isNaN(lng) || isNaN(lat)) return null
      
      return { lng, lat }
    } catch (error) {
      console.error('Error parsing location string:', error)
      return null
    }
  }

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current || !process.env.NEXT_PUBLIC_MAPBOX_TOKEN) return

    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN

    const initialCoords = parseLocation(location)
    const defaultCenter = initialCoords || { lng: 0, lat: 0 }

    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [defaultCenter.lng, defaultCenter.lat],
      zoom: zoom,
      interactive: interactive,
    })

    if (interactive) {
      mapRef.current.addControl(new mapboxgl.NavigationControl())
    }
    
    setIsMapInitialized(true)
    
    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [location, zoom, interactive])

  useEffect(() => {
    if (!mapRef.current || !isMapInitialized) return

    const coords = parseLocation(location)
    if (!coords) return

    if (markerRef.current) {
      markerRef.current.remove()
    }

    const el = document.createElement('div')
    el.className = 'marker'
    el.innerHTML = `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="#ef4444" />
      <circle cx="12" cy="9" r="3" fill="white" />
    </svg>`
    el.style.width = '32px'
    el.style.height = '32px'
    el.style.backgroundSize = '100%'
    el.style.cursor = 'pointer'
    el.style.transform = 'translate(-16px, -32px)'

    markerRef.current = new mapboxgl.Marker(el)
      .setLngLat([coords.lng, coords.lat])
      .addTo(mapRef.current)

    mapRef.current.flyTo({
      center: [coords.lng, coords.lat],
      essential: true,
      duration: 1000
    })
  }, [location, isMapInitialized])

  return (
    <div 
      ref={mapContainerRef} 
      className="w-full rounded-lg overflow-hidden shadow-inner" 
      style={{ height }}
    />
  )
}

export default MapboxMap
