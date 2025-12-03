"use client";

import { AspectRatio } from "@/components/ui/aspect-ratio";
import CityCard from "@/pages/home/components/city-card";
import { Skeleton } from "@/components/ui/skeleton";
import VectorTopLeftAnimation from "@/pages/home/components/vector-top-left-animation";

export const CitiesView = () => {


  return (
    <div className="w-full grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-3">
      {/* {data.map((item) => (
        <CityCard
          key={item.id}
          title={item.city}
          coverPhoto={item.coverPhoto}
        />
      ))} */}
    </div>
  );
};

export const CitiesViewLoadingStatus = () => {
  return (
    <div className="mt-3 w-full grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="w-full relative group cursor-pointer">
          <AspectRatio
            ratio={0.75 / 1}
            className="overflow-hidden rounded-lg relative"
          >
            <Skeleton className="w-full h-full" />
          </AspectRatio>

          <div className="absolute top-0 left-0 z-20">
            <VectorTopLeftAnimation title="Loading..." />
          </div>
        </div>
      ))}
    </div>
  );
};
