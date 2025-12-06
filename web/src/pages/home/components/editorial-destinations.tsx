"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { useGetGuidesApiV1TravelGuidesGet } from "@/generated/hooks/travelGuides";
import { Skeleton } from "@/components/ui/skeleton";
import Graphic from "@/components/shared/graphic";

/**
 * Editorial destinations section - Asymmetric, magazine-style layout
 * Beautiful, minimal design with creative use of space
 */
export const EditorialDestinations = () => {
  const { data: guides, isLoading } = useGetGuidesApiV1TravelGuidesGet(
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    true,
    "published",
    undefined,
    6,
    "view_count"
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-96 rounded-[18px]" />
          ))}
        </div>
      </div>
    );
  }

  if (!guides || guides.length === 0) return null;

  const destinationMap = new Map<string, typeof guides[0]>();
  guides.forEach((guide) => {
    const key = guide.city || guide.destination || guide.country;
    if (key && !destinationMap.has(key)) {
      destinationMap.set(key, guide);
    }
  });

  const destinations = Array.from(destinationMap.values()).slice(0, 6);

  return (
    <section className="space-y-12">
      <div className="flex items-baseline gap-4">
        <h2 className="text-3xl lg:text-4xl font-light tracking-tight">
          Destinations
        </h2>
        <div className="flex-1 h-px bg-border" />
        <Link
          href="/discover"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 group"
        >
          View all
          <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {destinations.map((destination, index) => {
          const city = destination.city || destination.destination || destination.country || "Unknown";
          let coverImageUrl = (destination.cover_image_url || destination.image_urls?.[0] || "/images/image1.jpg").trim();
          const isLarge = index === 0 || index === 3;

          if (!coverImageUrl || coverImageUrl === "") return null;

          // For external URLs with query params, ensure proper encoding
          // Next.js Image handles external URLs, but query params might need special handling
          if (coverImageUrl.startsWith("http") && coverImageUrl.includes("?")) {
            try {
              const url = new URL(coverImageUrl);
              // Keep the base URL without query params for Next.js optimization
              // Or use the full URL if it's a CDN that handles optimization
              coverImageUrl = url.origin + url.pathname;
            } catch {
              // If URL parsing fails, use as-is
            }
          }

          return (
            <Link
              key={destination.id}
              href={`/travel/${city}`}
              className={`group relative overflow-hidden rounded-[18px] bg-muted transition-all duration-500 hover:shadow-xl ${
                isLarge ? "md:col-span-2 lg:col-span-1" : ""
              }`}
            >
              {/* Graphic corner */}
              <div className="absolute top-0 right-0 size-[18px] rotate-90 z-10">
                <Graphic />
              </div>

              <div className={`relative ${isLarge ? "h-96" : "h-80"}`}>
                <Image
                  src={coverImageUrl}
                  alt={`${city} travel destination`}
                  fill
                  quality={75}
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
                <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent" />

                <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                  <div className="mb-2 text-sm font-light opacity-90">
                    {destination.country}
                  </div>
                  <h3 className="text-2xl lg:text-3xl font-light mb-2">{city}</h3>
                  <p className="text-sm font-light opacity-80 line-clamp-2">
                    {destination.summary || `Explore ${city}`}
                  </p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
};

