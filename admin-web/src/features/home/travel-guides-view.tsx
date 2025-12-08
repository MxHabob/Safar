"use client";

import { AspectRatio } from "@/components/ui/aspect-ratio";
import TravelGuideCard from "./components/travel-guide-card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { MapPin } from "lucide-react";
import { useGetGuidesApiV1TravelGuidesGet } from "@/generated/hooks/travelGuides";
import type { FileUploadResponse } from "@/generated/schemas";

/**
 * Travel guides view component - Displays travel guides grouped by city
 * Shows the most viewed published guides in a grid layout
 */
export const TravelGuidesView = () => {
  const { data: guides, isLoading, error } = useGetGuidesApiV1TravelGuidesGet(
    undefined, // destination
    undefined, // country
    undefined, // city
    undefined, // tags
    undefined, // category
    undefined, // is_official
    "published", // status - only published guides
    undefined, // skip
    9, // limit - get 9 guides
    "view_count" // sort_by - most viewed
  );

  if (isLoading) {
    return <TravelGuidesViewLoading />;
  }

  if (error) {
    return (
      <EmptyState
        icon={<MapPin className="h-12 w-12" />}
        title="Unable to load destinations"
        description="There was an error loading travel destinations. Please try again later."
      />
    );
  }

  if (!guides || guides.length === 0) {
    return (
      <EmptyState
        icon={<MapPin className="h-12 w-12" />}
        title="No destinations available"
        description="Check back soon for amazing travel guides"
      />
    );
  }

  // Group guides by city and get unique cities with their cover images
  const cityMap = new Map<string, typeof guides[0]>();
  
  guides.forEach((guide) => {
    const city = guide.city || guide.destination;
    if (city && !cityMap.has(city)) {
      cityMap.set(city, guide);
    }
  });

  const uniqueCities = Array.from(cityMap.values());

  return (
    <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {uniqueCities.map((guide) => {
        const city = guide.city || guide.destination || "Unknown";
        const coverImageUrl = guide.cover_image_url || guide.image_urls?.[0];
        
        const coverPhoto: FileUploadResponse = {
          message: "Travel guide cover image",
          file: {
            id: "0",
            filename: coverImageUrl || "/images/image1.jpg",
            original_filename: `${city} - Travel Guide`,
            file_url: coverImageUrl || "/images/image1.jpg",
            file_type: "image",
            file_category: "other",
            mime_type: "image/jpeg",
            file_size: 0,
            uploaded_by: "0",
            created_at: new Date().toISOString(),
            description: undefined,
          },
        };

        return (
          <TravelGuideCard
            key={guide.id}
            title={city}
            coverPhoto={coverPhoto}
          />
        );
      })}
    </div>
  );
};

export const TravelGuidesViewLoading = () => {
  return (
    <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="w-full relative group cursor-pointer">
          <AspectRatio
            ratio={0.75 / 1}
            className="overflow-hidden rounded-[18px] relative"
          >
            <Skeleton className="w-full h-full" />
          </AspectRatio>
        </div>
      ))}
    </div>
  );
};

