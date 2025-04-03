'use client'

import { useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

interface MapboxMapProps {
  location: string;
}

export const MapboxMap = ({ location }:MapboxMapProps) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);
  const [isMapInitialized, setIsMapInitialized] = useState(false);

  // Function to parse the SRID POINT string into lat/lng
  const parseLocation = (locationString: string) => {
    if (!locationString) return null;
    
    try {
      // Extract the coordinates part
      const coordsString = locationString.match(/POINT \(([^)]+)\)/)?.[1];
      if (!coordsString) return null;
      
      // Split into lng and lat (order is lng lat in POINT)
      const [lng, lat] = coordsString.split(' ').map(Number);
      
      // Validate coordinates
      if (isNaN(lng) || isNaN(lat)) return null;
      
      return { lng, lat };
    } catch (error) {
      console.error('Error parsing location string:', error);
      return null;
    }
  };

  const initializeMap = () => {
    if (!mapContainerRef.current || mapRef.current) return;

    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

    // Parse the initial location
    const initialCoords = parseLocation(location);
    const defaultCenter = initialCoords || { lng: 0, lat: 0 }; // Fallback to 0,0 if parsing fails

    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [defaultCenter.lng, defaultCenter.lat],
      zoom: 14,
    });

    mapRef.current.addControl(new mapboxgl.NavigationControl());
    setIsMapInitialized(true);
    
    // Add initial marker if we have valid coordinates
    if (initialCoords) {
      addMarker(initialCoords.lat, initialCoords.lng);
    }
  };

  const addMarker = (lat: number, lng: number) => {
    if (!mapRef.current) return;

    // Remove existing marker if it exists
    if (markerRef.current) {
      markerRef.current.remove();
    }

    // Create a new marker
    const el = document.createElement('div');
    el.className = 'marker';
    el.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24"><path fill="#3f51b5" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"></path></svg>`;

    markerRef.current = new mapboxgl.Marker(el)
      .setLngLat([lng, lat])
      .addTo(mapRef.current);

    // Center the map on the marker
    mapRef.current.setCenter([lng, lat]);
  };

  // Initialize map when component mounts
  if (typeof window !== 'undefined' && !isMapInitialized) {
    initializeMap();
  }

  // Update marker when location changes
  if (isMapInitialized && location) {
    const coords = parseLocation(location);
    if (coords) {
      addMarker(coords.lat, coords.lng);
    }
  }

  return <div ref={mapContainerRef} className="w-full h-screen" />;
};

export default MapboxMap;