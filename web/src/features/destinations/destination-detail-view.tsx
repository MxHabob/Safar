"use client";

import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Calendar, Users } from "lucide-react";
import Graphic from "@/components/shared/graphic";
import type { TravelGuideResponse } from "@/generated/schemas";
import { Skeleton } from "@/components/ui/skeleton";

interface DestinationDetailViewProps {
  guide: TravelGuideResponse;
}

export const DestinationDetailView = ({ guide }: DestinationDetailViewProps) => {
  const coverImageUrl = guide.cover_image_url || "/images/image1.jpg";
  const city = guide.city || guide.destination || guide.country || "Destination";

  return (
    <div className="min-h-screen w-full">
      <div className="w-full max-w-7xl mx-auto px-3 lg:px-6 py-8 lg:py-12 space-y-12">
        {/* Hero Image */}
        <div className="relative w-full h-[60vh] rounded-[18px] overflow-hidden bg-muted">
          <div className="absolute top-0 left-0 size-[18px] z-10">
            <Graphic />
          </div>
          <Image
            src={coverImageUrl}
            alt={`${city} travel destination`}
            fill
            quality={75}
            className="object-cover"
            sizes="100vw"
            priority
          />
          <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
            <h1 className="text-4xl lg:text-5xl font-light tracking-tight mb-2">
              {city}
            </h1>
            {guide.country && (
              <p className="text-lg font-light opacity-90">{guide.country}</p>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {guide.summary && (
              <Card className="rounded-[18px] border border-border">
                <div className="absolute top-0 left-0 size-[18px]">
                  <Graphic />
                </div>
                <CardContent className="p-6 space-y-4">
                  <h2 className="text-2xl font-light">About</h2>
                  <p className="text-muted-foreground font-light leading-relaxed">
                    {guide.summary}
                  </p>
                </CardContent>
              </Card>
            )}

            {guide.content && (
              <Card className="rounded-[18px] border border-border">
                <div className="absolute top-0 left-0 size-[18px]">
                  <Graphic />
                </div>
                <CardContent className="p-6 space-y-4">
                  <h2 className="text-2xl font-light">Travel Guide</h2>
                  <div
                    className="text-muted-foreground font-light leading-relaxed prose prose-invert max-w-none"
                    dangerouslySetInnerHTML={{ __html: guide.content }}
                  />
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card className="rounded-[18px] border border-border sticky top-24">
              <div className="absolute top-0 right-0 size-[18px] rotate-90">
                <Graphic />
              </div>
              <CardContent className="p-6 space-y-6">
                <h3 className="text-xl font-light">Quick Info</h3>
                <div className="space-y-4">
                  {guide.country && (
                    <div className="flex items-center gap-3">
                      <MapPin className="size-5 text-muted-foreground" />
                      <div>
                        <div className="text-sm text-muted-foreground font-light">Country</div>
                        <div className="font-light">{guide.country}</div>
                      </div>
                    </div>
                  )}
                  {guide.created_at && (
                    <div className="flex items-center gap-3">
                      <Calendar className="size-5 text-muted-foreground" />
                      <div>
                        <div className="text-sm text-muted-foreground font-light">Published</div>
                        <div className="font-light">
                          {new Date(guide.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export const DestinationDetailLoading = () => {
  return (
    <div className="min-h-screen w-full">
      <div className="w-full max-w-7xl mx-auto px-3 lg:px-6 py-8 lg:py-12 space-y-12">
        <Skeleton className="h-[60vh] w-full rounded-[18px]" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <Skeleton className="h-64 rounded-[18px]" />
            <Skeleton className="h-96 rounded-[18px]" />
          </div>
          <Skeleton className="h-64 rounded-[18px]" />
        </div>
      </div>
    </div>
  );
};

