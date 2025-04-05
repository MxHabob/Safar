"use client";

import { useState, useEffect } from "react";
import MapView from "./map-view";
import { Loader2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { useGetBoxItineraryQuery, useGetBoxQuery } from "@/redux/services/api";
import ItineraryView from "./itinerary-view";

export default function BoxPageContant({id}:{id:string}) {
  const [visitedPlaces, setVisitedPlaces] = useState<Set<string>>(new Set());
  const [isMapReady, setIsMapReady] = useState(false);
  const [activeDay, setActiveDay] = useState<number | null>(null);
  
  const { 
    data: box, 
    isLoading: isBoxLoading, 
    error: boxError 
  } = useGetBoxQuery(id, { 
    skip: !id 
  });
  
  const { 
    data: itineraryData, 
    isLoading: isItineraryLoading, 
    error: itineraryError 
  } = useGetBoxItineraryQuery(id, { 
    skip: !id 
  });

  const handleMapReady = () => {
    setIsMapReady(true);
  };

  const toggleVisitedPlace = (placeId: string) => {
    setVisitedPlaces(prev => {
      const newSet = new Set(prev);
      if (newSet.has(placeId)) {
        newSet.delete(placeId);
      } else {
        newSet.add(placeId);
      }
      return newSet;
    });
  };

  useEffect(() => {
    if (itineraryData && itineraryData.days && itineraryData.days.length > 0 && activeDay === null) {
      setActiveDay(1);
    }
  }, [itineraryData, activeDay]);

  const isLoading = isBoxLoading || isItineraryLoading;
  const error = boxError || itineraryError;

  if (!id) {
    return (
      <div className="flex flex-col items-center justify-center h-screen p-4">
        <h2 className="text-2xl font-bold mb-4">No Travel Box Selected</h2>
        <p className="text-gray-600 mb-6 text-center">
          Please provide a id parameter in the URL to view an itinerary.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading itinerary...</span>
      </div>
    );
  }

  if (error || !itineraryData) {
    return (
      <div className="flex flex-col items-center justify-center h-screen p-4">
        <h2 className="text-2xl font-bold text-red-600 mb-4">Error Loading Data</h2>
        <p className="text-gray-600 mb-6">
          We couldn&apos;t load the travel box data. Please try again or select a different box.
        </p>
        <Button onClick={() => window.location.href = "/"}>
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row h-screen md:h-[50vh] ">
      <div className="h-screen md:h-[90vh] md:w-1/2">
        <ItineraryView 
          itinerary={itineraryData} 
          visitedPlaces={visitedPlaces} 
          onToggleVisited={toggleVisitedPlace}
          isMapReady={isMapReady}
          activeDay={activeDay}
          setActiveDay={setActiveDay}
        />
      </div>
      <div className="h-screen md:h-[90vh] md:w-1/2 ">
        <MapView 
          itinerary={itineraryData} 
          visitedPlaces={visitedPlaces}
          onMapReady={handleMapReady}
          activeDay={activeDay}
        />
      </div>
    </div>
  );
}
