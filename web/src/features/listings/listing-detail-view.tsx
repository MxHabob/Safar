"use client";

import { useState } from "react";
import Image from "next/image";
import { MapPin, Star, Users, Bed, Bath, Calendar, Heart, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import Graphic from "@/components/shared/graphic";
import type { ListingResponse } from "@/generated/schemas";

interface ListingDetailViewProps {
  listing: ListingResponse;
}

/**
 * Listing detail view - Beautiful, minimal design
 * Shows all listing information with booking form
 */
export const ListingDetailView = ({ listing }: ListingDetailViewProps) => {
  // Defensive checks for undefined/null listing
  if (!listing) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground font-light">Listing not found</p>
        </div>
      </div>
    );
  }

  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const photos = listing.photos || listing.images || [];
  const primaryPhoto = photos[selectedImageIndex] || photos[0];
  const photoUrl = primaryPhoto?.url || "/images/image1.jpg";

  return (
    <div className="min-h-screen w-full">
      <div className="w-full max-w-7xl mx-auto px-3 lg:px-6 py-8 lg:py-12 space-y-12">
        {/* Header */}
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-3xl lg:text-4xl font-light tracking-tight mb-2">
                {listing.title}
              </h1>
              <div className="flex items-center gap-2 text-muted-foreground font-light">
                <MapPin className="size-4" />
                <span>{listing.city || "Unknown"}, {listing.country || "Unknown"}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="rounded-[18px]">
                <Share2 className="size-4" />
              </Button>
              <Button variant="ghost" size="icon" className="rounded-[18px]">
                <Heart className="size-4" />
              </Button>
            </div>
          </div>

          {/* Rating and Reviews */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Star className="size-5 fill-foreground/20 text-foreground/40" />
              <span className="font-light text-lg">{listing.rating || "0"}</span>
              <span className="text-muted-foreground">({listing.review_count || 0} reviews)</span>
            </div>
          </div>
        </div>

        {/* Main Image Gallery */}
        <div className="relative w-full h-[60vh] rounded-[18px] overflow-hidden bg-muted">
          <div className="absolute top-0 left-0 size-[18px] z-10">
            <Graphic />
          </div>
          {photoUrl && (
            <Image
              src={photoUrl}
              alt={listing.title}
              fill
              quality={75}
              className="object-cover"
              sizes="100vw"
              priority
            />
          )}
          
          {/* Image Thumbnails */}
          {photos.length > 1 && (
            <div className="absolute bottom-4 left-4 right-4 flex gap-2 overflow-x-auto">
              {photos.slice(0, 5).map((photo, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImageIndex(index)}
                  className={`relative w-20 h-20 rounded-[18px] overflow-hidden border-2 transition-all ${
                    selectedImageIndex === index
                      ? "border-foreground"
                      : "border-transparent opacity-60 hover:opacity-100"
                  }`}
                >
                  <Image
                    src={photo.url}
                    alt={`${listing.title} - Image ${index + 1}`}
                    fill
                    quality={75}
                    className="object-cover"
                    sizes="80px"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Description */}
            <Card className="rounded-[18px] border border-border">
              <div className="absolute top-0 left-0 size-[18px]">
                <Graphic />
              </div>
              <CardContent className="p-6 space-y-4">
                <h2 className="text-2xl font-light">About this place</h2>
                <p className="text-muted-foreground font-light leading-relaxed whitespace-pre-line">
                  {listing.description || listing.summary || "No description available."}
                </p>
              </CardContent>
            </Card>

            {/* Amenities & Details */}
            <Card className="rounded-[18px] border border-border">
              <div className="absolute top-0 left-0 size-[18px]">
                <Graphic />
              </div>
              <CardContent className="p-6 space-y-6">
                <h2 className="text-2xl font-light">Details</h2>
                <div className="grid grid-cols-2 gap-6">
                  <div className="flex items-center gap-3">
                    <Users className="size-5 text-muted-foreground" />
                    <div>
                      <div className="text-sm text-muted-foreground font-light">Guests</div>
                      <div className="font-light">{listing.max_guests || listing.capacity || "N/A"}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Bed className="size-5 text-muted-foreground" />
                    <div>
                      <div className="text-sm text-muted-foreground font-light">Bedrooms</div>
                      <div className="font-light">{listing.bedrooms || "N/A"}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Bed className="size-5 text-muted-foreground" />
                    <div>
                      <div className="text-sm text-muted-foreground font-light">Beds</div>
                      <div className="font-light">{listing.beds || "N/A"}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Bath className="size-5 text-muted-foreground" />
                    <div>
                      <div className="text-sm text-muted-foreground font-light">Bathrooms</div>
                      <div className="font-light">{listing.bathrooms || "N/A"}</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Booking Card */}
          <div className="lg:col-span-1">
            <Card className="rounded-[18px] border-2 border-border sticky top-24">
              <div className="absolute top-0 right-0 size-[18px] rotate-90">
                <Graphic />
              </div>
              <CardContent className="p-6 space-y-6">
                <div>
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-3xl font-light">{listing.currency || "USD"} {listing.base_price || "0"}</span>
                    <span className="text-muted-foreground font-light">per night</span>
                  </div>
                  {listing.cleaning_fee && (
                    <p className="text-sm text-muted-foreground font-light">
                      + {listing.currency || "USD"} {listing.cleaning_fee} cleaning fee
                    </p>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="p-4 border border-border rounded-[18px]">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-light">Check-in</span>
                      <Calendar className="size-4 text-muted-foreground" />
                    </div>
                    <div className="text-muted-foreground font-light">
                      {listing.check_in_time || "15:00"}
                    </div>
                  </div>
                  <div className="p-4 border border-border rounded-[18px]">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-light">Check-out</span>
                      <Calendar className="size-4 text-muted-foreground" />
                    </div>
                    <div className="text-muted-foreground font-light">
                      {listing.check_out_time || "11:00"}
                    </div>
                  </div>
                </div>

                <Button
                  size="lg"
                  className="w-full rounded-[18px] h-14 text-base"
                  disabled={!listing.can_book}
                >
                  {listing.can_book ? "Reserve" : "Unavailable"}
                </Button>

                {listing.min_stay_nights && (
                  <p className="text-xs text-center text-muted-foreground font-light">
                    Minimum stay: {listing.min_stay_nights} {listing.min_stay_nights === 1 ? "night" : "nights"}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export const ListingDetailLoading = () => {
  return (
    <div className="min-h-screen w-full">
      <div className="w-full max-w-7xl mx-auto px-3 lg:px-6 py-8 lg:py-12 space-y-12">
        <Skeleton className="h-12 w-3/4" />
        <Skeleton className="h-[60vh] w-full rounded-[18px]" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <Skeleton className="h-64 rounded-[18px]" />
            <Skeleton className="h-64 rounded-[18px]" />
          </div>
          <Skeleton className="h-96 rounded-[18px]" />
        </div>
      </div>
    </div>
  );
};

