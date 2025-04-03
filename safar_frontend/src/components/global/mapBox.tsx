'use client'
import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

// Define types for props
interface Coordinate {
  lat: number;
  lng: number;
}

interface Place {
  latitude: number;
  longitude: number;
  name: string;
  photo?: {
    images: {
      large: {
        url: string;
      };
    };
  };
  rating: number;
}

interface WeatherData {
  list: Array<{
    coord: {
      lat: number;
      lon: number;
    };
    weather: Array<{
      icon: string;
    }>;
  }>;
}

interface MapboxMapProps {
  coords: Coordinate;
  places: Place[];
  setCoords: (coords: Coordinate) => void;
  setBounds: (bounds: { ne: Coordinate; sw: Coordinate }) => void;
  setChildClicked: (child: number) => void;
  weatherData: WeatherData;
}

const MapboxMap: React.FC<MapboxMapProps> = ({
  coords,
  places,
  setCoords,
  setBounds,
  setChildClicked,
  weatherData,
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  
  // Default center coordinates if coords are invalid
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const defaultCenter = [-74.5, 40]; // Default coordinates (e.g., New York)

  // Initialize map only once on component mount
  useEffect(() => {
    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

    if (mapContainerRef.current && !mapRef.current) { // Only create map if it doesn't exist
      const center = (coords && !isNaN(coords.lng) && !isNaN(coords.lat)) 
        ? [coords.lng, coords.lat] 
        : defaultCenter;
      
      mapRef.current = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: center as [number, number],
        zoom: 14,
      });

      // Add navigation controls
      mapRef.current.addControl(new mapboxgl.NavigationControl());

      // Handle map movement events
      mapRef.current.on('moveend', () => {
        const mapCenter = mapRef.current?.getCenter();
        const bounds = mapRef.current?.getBounds();

        if (mapCenter && bounds) {
          setCoords({ lat: mapCenter.lat, lng: mapCenter.lng });
          setBounds({
            ne: { lat: bounds.getNorthEast().lat, lng: bounds.getNorthEast().lng },
            sw: { lat: bounds.getSouthWest().lat, lng: bounds.getSouthWest().lng },
          });
        }
      });
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [coords, defaultCenter, setBounds, setCoords]); // Empty dependency array to run only once on mount

  // Update map center when coords change (without reinitializing the map)
  useEffect(() => {
    if (mapRef.current && coords && !isNaN(coords.lng) && !isNaN(coords.lat)) {
      mapRef.current.setCenter([coords.lng, coords.lat]);
    }
  }, [coords, coords.lat, coords.lng]); // Only depend on the specific properties that change

  // Add place markers when places change
  useEffect(() => {
    // Clear previous markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    if (mapRef.current && places?.length) {
      places.forEach((place, i) => {
        // Validate coordinates before creating markers
        if (isNaN(Number(place.longitude)) || isNaN(Number(place.latitude))) {
          console.warn(`Invalid coordinates for place ${place.name}`);
          return;
        }
        
        const el = document.createElement('div');
        el.className = 'marker cursor-pointer';

        // Simple icon for mobile
        el.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24"><path fill="#3f51b5" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"></path></svg>`;

        const paper = document.createElement('div');
        paper.className = 'bg-white rounded-lg shadow-lg p-2';

        const title = document.createElement('div');
        title.className = 'font-bold text-lg';
        title.textContent = place.name;
        paper.appendChild(title);

        const img = document.createElement('img');
        img.className = 'w-24 h-auto';
        img.crossOrigin="anonymous"
        img.src = place.photo ? place.photo.images.large.url : 'https://www.foodserviceandhospitality.com/wp-content/uploads/2016/09/Restaurant-Placeholder-001.jpg';
        paper.appendChild(img);

        const rating = document.createElement('div');
        rating.textContent = `Rating: ${place.rating}`;
        paper.appendChild(rating);

        el.appendChild(paper);

        // Make marker clickable
        el.addEventListener('click', () => {
          setChildClicked(i);
        });

        // Add marker to map
        const marker = new mapboxgl.Marker(el)
          .setLngLat([Number(place.longitude), Number(place.latitude)])
          .addTo(mapRef.current!);

        markersRef.current.push(marker);
      });
    }
  }, [places, setChildClicked]);

  // Add weather data markers
  useEffect(() => {
    if (mapRef.current && weatherData?.list?.length) {
      weatherData.list.forEach((data) => {
        // Validate coordinates before creating markers
        if (isNaN(data.coord.lon) || isNaN(data.coord.lat)) {
          console.warn('Invalid coordinates for weather data');
          return;
        }
        
        const el = document.createElement('div');
        el.innerHTML = `<img crossOrigin="anonymous" src="http://openweathermap.org/img/w/${data.weather[0].icon}.png" height="70px" />`;

        const marker = new mapboxgl.Marker(el)
          .setLngLat([data.coord.lon, data.coord.lat])
          .addTo(mapRef.current!);

        markersRef.current.push(marker);
      });
    }
  }, [weatherData]);

  return <div ref={mapContainerRef} className="w-full h-screen" />;
};

export default MapboxMap;