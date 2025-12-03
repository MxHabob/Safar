"use client";

import { useState, useEffect } from "react";
import Footer from "@/components/footer";
import { CoverPhoto } from "./components/cover-photo";
import { Introduction } from "./components/introduction";
import { CityItem } from "./components/city-item";
import { TravelGuideResponse } from "@/generated/schemas";
import { Skeleton } from "@/components/ui/skeleton";

interface TravelViewProps {
  data: TravelGuideResponse[];
}

export const TravelView = ({ data }: TravelViewProps) => {
  const [activeTravelGuide, setActiveTravelGuide] = useState<TravelGuideResponse | null>(null);

  // Ensure data is always an array
  const guides = Array.isArray(data) ? data : [];

  useEffect(() => {
    if (!activeTravelGuide && guides.length > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setActiveTravelGuide(guides[0]);
    }
  }, [activeTravelGuide, guides]);

  return (
    <div className="flex flex-col lg:flex-row min-h-screen w-full">
      <CoverPhoto travelGuideId={activeTravelGuide?.id || ""} travelGuides={guides} />

      {/* Spacer for fixed left content */}
      <div className="hidden lg:block lg:w-1/2" />

      {/* RIGHT CONTENT - Scrollable */}
      <div className="w-full mt-3 lg:mt-0 lg:w-1/2 space-y-3 pb-3">
        <Introduction />
        <div className="space-y-3">
          {guides.map((travelGuide: TravelGuideResponse) => (
            <CityItem key={travelGuide.id} travelGuide={travelGuide} onMouseEnter={setActiveTravelGuide} />
          ))}
        </div>
        <Footer />
      </div>
    </div>
  );
};

export const LoadingStatus = () => {
  return (
    <div className="flex flex-col lg:flex-row min-h-screen w-full">
      <Skeleton />

      {/* Spacer for fixed left content */}
      <div className="hidden lg:block lg:w-1/2" />

      {/* RIGHT CONTENT - Scrollable */}
      <div className="w-full mt-3 lg:mt-0 lg:w-1/2 space-y-3 pb-3">
        <Introduction />
        <div className="space-y-3">
          <Skeleton className="w-full h-12" />
          <Skeleton className="w-full h-12" />
          <Skeleton className="w-full h-12" />
          <Skeleton className="w-full h-12" />
          <Skeleton className="w-full h-12" />
        </div>
        <Footer />
      </div>
    </div>
  );
};
