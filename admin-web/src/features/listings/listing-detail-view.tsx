"use client";

import { MapPin, Star, Users, Bed, Bath, Heart, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import Graphic from "@/components/shared/graphic";
import { BookingForm } from "@/features/bookings/components/booking-form";
import type { ListingResponse } from "@/generated/schemas";

interface ListingDetailViewProps {
  listing: ListingResponse;
}

/**
 * Listing detail view - Beautiful, minimal design
 * Content only - Images are handled separately in the page layout
 */
export const ListingDetailView = ({ listing }: ListingDetailViewProps) => {
  // Defensive checks for undefined/null listing
  if (!listing) {
    return (
      <div className="w-full flex items-center justify-center py-12">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground font-light">Listing not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="px-3 lg:px-6 py-6 lg:py-8 space-y-6 lg:space-y-8">
        {/* Header */}
        <div className="space-y-">
          <div className="flex items-start justify-between gap-4 lg:my-4">
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

        {/* Content Grid - About and Details side by side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          {/* About this place */}
          <Card className="rounded-[18px] border border-border relative">
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

          {/* Details */}
          <Card className="rounded-[18px] border border-border relative">
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

        {/* Booking Form - Below the cards */}
        <div className="w-full max-w-2xl mx-auto lg:max-w-full">
          <BookingForm listing={listing} />
        </div>

        {/* Reviews Section */}
        <div className="w-full max-w-2xl mx-auto lg:max-w-full pt-8 border-t">
          <a
            href={`/listings/${listing.id}/reviews`}
            className="text-primary hover:underline font-light"
          >
            View all reviews ({listing.review_count || 0})
          </a>
        </div>
      </div>
    </div>
  );
};

export const ListingDetailLoading = () => {
  return (
    <div className="w-full">
      <div className="px-3 lg:px-6 py-6 lg:py-8 space-y-6 lg:space-y-8">
        <Skeleton className="h-12 w-3/4" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          <Skeleton className="h-64 rounded-[18px]" />
          <Skeleton className="h-64 rounded-[18px]" />
        </div>
        <div className="w-full max-w-2xl mx-auto lg:max-w-full">
          <Skeleton className="h-96 rounded-[18px]" />
        </div>
      </div>
    </div>
  );
};



