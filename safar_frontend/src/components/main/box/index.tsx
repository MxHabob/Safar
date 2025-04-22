"use client";

import { useState } from "react";
import MapView from "@/components/global/maps/map-view";
import { Button } from "@/components/ui/button";
import { useGetBoxQuery } from "@/core/services/api";
import { Spinner } from "@/components/ui/spinner";

export default function BoxPageContent({id}:{id:string}) {
  const [visitedPlaces] = useState<Set<string>>(new Set());
  const { isLoading, error } = useGetBoxQuery(id, { skip: !id});
  
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
        <Spinner />
        <span className="ml-2">Loading itinerary...</span>
      </div>
    );
  }

  if (error) {
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
      <div className="h-screen md:h-[90vh] md:w-1/2 ">
        <MapView 
          visitedPlaces={visitedPlaces}
          onMapReady={() => { } } itinerary={undefined} activeDay={null}
        />
      </div>
    </div>
  );
}
