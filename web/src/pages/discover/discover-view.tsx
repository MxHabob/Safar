"use client";

import { useCallback, useMemo, useState } from "react";
import Mapbox from "@/components/shared/map";
import VectorCombined from "@/components/shared/vector-combined";
import { usePhotoClustering } from "@/pages/discover/hooks/use-photo-clustering";
import { PhotoMarker } from "@/pages/discover/components/photo-marker";
import { ClusterMarker } from "@/pages/discover/components/cluster-marker";
import { PhotoPopup } from "@/pages/discover/components/photo-popup";
import type { PhotoPoint, Cluster } from "@/pages/discover/lib/clustering";
import { FramedPhoto } from "@/components/shared/framed-photo";
import { format } from "date-fns/format";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { cn } from "@/lib/utils";
import { useListListingsApiV1ListingsGet } from "@/generated/hooks/listings";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { MapPin } from "lucide-react";
import { keyToImage } from "@/lib/keyToImage";

/**
 * Convert Listing to PhotoPoint for map display
 */
function convertListingToPhotoPoint(listing: any): PhotoPoint | null {
  // Only include listings with valid coordinates
  if (!listing.latitude || !listing.longitude) return null;

  const primaryPhoto = listing.photos?.[0] || listing.images?.[0];
  const photoUrl = primaryPhoto?.url;
  if (!photoUrl) return null;

  const lat = typeof listing.latitude === "string" 
    ? parseFloat(listing.latitude) 
    : listing.latitude;
  const lng = typeof listing.longitude === "string" 
    ? parseFloat(listing.longitude) 
    : listing.longitude;

  // Validate coordinates
  if (isNaN(lat) || isNaN(lng) || lat === 0 || lng === 0) return null;

  return {
    id: listing.id,
    title: listing.title || `${listing.city}, ${listing.country}`,
    url: photoUrl,
    blurData: primaryPhoto?.blurhash,
    latitude: lat,
    longitude: lng,
    width: primaryPhoto?.width || 800,
    height: primaryPhoto?.height || 600,
    dateTimeOriginal: listing.created_at ? new Date(listing.created_at) : undefined,
  };
}

export const DiscoverView = () => {
  const isMobile = useIsMobile();
  
  // Fetch listings from API (listings have latitude/longitude)
  // Note: API limit max is 100, so we use 100
  const { data, isLoading, error } = useListListingsApiV1ListingsGet(
    0, // skip - start from beginning
    100, // limit - max allowed by API
    undefined, // city
    undefined, // country
    undefined, // listing_type
    undefined, // min_price
    undefined, // max_price
    undefined, // min_guests
    "active" // status - only active listings
  );

  // Convert listings to photo points
  const photoPoints = useMemo(() => {
    const listings = data?.items || [];
    if (listings.length === 0) return [];
    return listings
      .map(convertListingToPhotoPoint)
      .filter((point): point is PhotoPoint => point !== null);
  }, [data]);
  
  // Use photo clustering hook
  const { clusters, singlePhotos, handleMoveEnd } = usePhotoClustering({
    photos: photoPoints,
    initialZoom: 3,
  });
  const [selectedPhotos, setSelectedPhotos] = useState<PhotoPoint[]>([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);


  const handleSelectPhotos = useCallback(
    (photos: PhotoPoint[]) => {
      setSelectedPhotos(photos);
      if (isMobile) {
        setIsDrawerOpen(true);
      }
    },
    [isMobile]
  );

  const clearSelection = () => {
    setSelectedPhotos([]);
    setIsDrawerOpen(false);
  };

  // Convert clusters and photos to map markers
  const markers = useMemo(() => {
    const result: Array<{
      id: string;
      longitude: number;
      latitude: number;
      popupContent?: React.ReactNode;
      element: React.ReactNode;
    }> = [];

    // Add cluster markers
    clusters.forEach((cluster: Cluster) => {
      result.push({
        id: cluster.id,
        longitude: cluster.longitude,
        latitude: cluster.latitude,
        element: (
          <ClusterMarker
            cluster={cluster}
            onClick={() => {
              if (cluster.photos.length) {
                handleSelectPhotos(cluster.photos);
              }
            }}
          />
        ),
      });
    });

    // Add single photo markers
    singlePhotos.forEach((photo: PhotoPoint) => {
      result.push({
        id: photo.id,
        longitude: photo.longitude!,
        latitude: photo.latitude!,
        popupContent: <PhotoPopup photo={photo} />,
        element: (
          <PhotoMarker
            photo={photo}
            onClick={() => {
              handleSelectPhotos([photo]);
            }}
          />
        ),
      });
    });

    return result;
  }, [clusters, singlePhotos, handleSelectPhotos]);

  const hasSelection = selectedPhotos.length > 0;

  if (isLoading) {
    return (
      <div className="w-full h-full rounded-xl overflow-hidden">
        <Skeleton className="w-full h-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-full rounded-xl overflow-hidden flex items-center justify-center">
        <EmptyState
          icon={<MapPin className="h-12 w-12" />}
          title="Unable to load destinations"
          description="There was an error loading travel destinations. Please try again later."
        />
      </div>
    );
  }

  return (
    <div className="w-full h-full rounded-xl overflow-hidden">
      <div className="flex h-full gap-x-3">
        <div
          className="relative h-full rounded-xl overflow-hidden"
          style={{ width: !isMobile && hasSelection ? "50%" : "100%" }}
        >
          <Mapbox
            id="discoverMap"
            initialViewState={{
              longitude: 121.2816980216146,
              latitude: 31.31395498607465,
              zoom: 3,
            }}
            markers={markers}
            onMoveEnd={handleMoveEnd}
            onMapClick={() => {
              if (hasSelection) {
                clearSelection();
              }
            }}
          />
          <div className="absolute right-0 bottom-0 z-10">
            <VectorCombined title="Discover" position="bottom-right" />
          </div>
        </div>

        {/* Desktop / tablet side panel */}
        {hasSelection && (
          <div className="hidden md:flex h-full bg-background flex-col w-1/2 rounded-xl">
            <div className="h-full p-4 overflow-y-auto bg-muted rounded-xl hide-scrollbar">
              {selectedPhotos.length > 0 && (
                <div
                  className={cn(
                    "w-full grid grid-cols-2 gap-x-1 gap-y-8",
                    selectedPhotos.length === 1 ? "grid-cols-1" : "grid-cols-2"
                  )}
                >
                  {selectedPhotos.map((photo) => (
                    <div key={photo.id} className="space-y-2">
                      <div className="flex items-center justify-center bg-gray-50 dark:bg-muted h-[80vh] p-10">
                        <FramedPhoto
                          src={photo.url}
                          alt={photo.title}
                          blurhash={photo.blurData!}
                          width={photo.width}
                          height={photo.height}
                        />
                      </div>
                      <div className="flex flex-col w-full items-center justify-center">
                        <p className="text-sm font-medium">{photo.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {photo.dateTimeOriginal
                            ? format(photo.dateTimeOriginal, "d MMM yyyy")
                            : ""}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Mobile full-screen drawer */}
      {isMobile && (
        <Drawer
          open={isDrawerOpen && hasSelection}
          onOpenChange={(open) => {
            setIsDrawerOpen(open);
            if (!open) {
              setSelectedPhotos([]);
            }
          }}
        >
          <DrawerContent className="md:hidden inset-0 h-screen w-screen rounded-none">
            <div className="flex flex-col h-full">
              <DrawerHeader className="flex items-center justify-between">
                <DrawerTitle></DrawerTitle>
              </DrawerHeader>
              <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-6 hide-scrollbar">
                {selectedPhotos.map((photo) => (
                  <div key={photo.id} className="space-y-2">
                    <div className="flex items-center justify-center bg-gray-50 dark:bg-muted p-4 rounded-xl">
                      <FramedPhoto
                        src={photo.url}
                        alt={photo.title}
                        blurhash={photo.blurData!}
                        width={photo.width}
                        height={photo.height}
                      />
                    </div>
                    <div className="flex flex-col items-center justify-center">
                      <p className="text-sm font-medium text-center">
                        {photo.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {photo.dateTimeOriginal
                          ? format(photo.dateTimeOriginal, "d MMM yyyy")
                          : ""}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </DrawerContent>
        </Drawer>
      )}
    </div>
  );
};
