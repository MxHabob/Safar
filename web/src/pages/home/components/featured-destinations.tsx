"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useGetGuidesApiV1TravelGuidesGet } from "@/generated/hooks/travelGuides";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { MapPin } from "lucide-react";

/**
 * Featured destinations section - Showcases top travel destinations
 * Large hero-style cards with destination imagery
 */
export const FeaturedDestinations = () => {
  const { data: guides, isLoading, error } = useGetGuidesApiV1TravelGuidesGet(
    undefined, // destination
    undefined, // country
    undefined, // city
    undefined, // tags
    undefined, // category
    true, // is_official - show official guides
    "published", // status
    undefined, // skip
    6, // limit
    "view_count" // sort_by
  );

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="rounded-[18px] overflow-hidden">
            <Skeleton className="w-full h-80" />
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState
        icon={<MapPin className="h-12 w-12" />}
        title="Unable to load destinations"
        description="Please try again later"
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

  // Get unique destinations
  const destinationMap = new Map<string, typeof guides[0]>();
  guides.forEach((guide) => {
    const key = guide.city || guide.destination || guide.country;
    if (key && !destinationMap.has(key)) {
      destinationMap.set(key, guide);
    }
  });

  const destinations = Array.from(destinationMap.values()).slice(0, 6);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl lg:text-3xl font-bold">Explore Destinations</h2>
          <p className="text-muted-foreground mt-1">
            Discover amazing places around the world
          </p>
        </div>
        <Button asChild variant="outline" className="rounded-[18px]">
          <Link href="/discover">
            View All
            <ArrowRight className="ml-2 size-4" />
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {destinations.map((destination) => {
          const city = destination.city || destination.destination || destination.country || "Unknown";
          const coverImageUrl = destination.cover_image_url || destination.image_urls?.[0] || "/images/image1.jpg";

          return (
            <Link key={destination.id} href={`/travel/${city}`}>
              <Card className="rounded-[18px] overflow-hidden hover:shadow-xl transition-all duration-300 group cursor-pointer border-2 hover:border-primary relative h-80">
                <div className="relative h-full">
                  <Image
                    src={coverImageUrl}
                    alt={city}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-500"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent" />
                  <CardContent className="absolute bottom-0 left-0 right-0 p-6 text-white">
                    <div className="flex items-center gap-2 mb-2">
                      <MapPin className="size-5" />
                      <span className="text-sm font-medium">{destination.country}</span>
                    </div>
                    <h3 className="text-2xl font-bold mb-2">{city}</h3>
                    <p className="text-sm text-white/90 line-clamp-2">
                      {destination.summary || `Explore ${city} with our curated travel guide`}
                    </p>
                    <div className="mt-4 flex items-center gap-2 text-sm">
                      <span>{destination.view_count} views</span>
                      <span>•</span>
                      <span>{destination.like_count} likes</span>
                    </div>
                  </CardContent>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

