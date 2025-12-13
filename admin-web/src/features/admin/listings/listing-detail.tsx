"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, RefreshCw, Home, MapPin, DollarSign, Star, Calendar, User } from "lucide-react";
import { useGetListingApiV1AdminListingsListingIdGet } from "@/generated/hooks/admin";
import type { GetListingApiV1AdminListingsListingIdGetResponse } from "@/generated/schemas";

interface ListingDetailPageProps {
  initialListingData?: GetListingApiV1AdminListingsListingIdGetResponse;
}

// Date formatting utility
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Status badge component
function StatusBadge({ status }: { status: string }) {
  const variant =
    status === "active"
      ? "default"
      : status === "pending"
      ? "secondary"
      : status === "suspended"
      ? "destructive"
      : "outline";

  return (
    <Badge variant={variant} className="capitalize">
      {status}
    </Badge>
  );
}

export function ListingDetailPage({ initialListingData }: ListingDetailPageProps) {
  const router = useRouter();
  
  const listingId = initialListingData?.id || "";

  const { data, isLoading, error, refetch } = useGetListingApiV1AdminListingsListingIdGet(listingId, {
    enabled: !!listingId,
    initialData: initialListingData,
  });

  const listing = data || initialListingData;

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 p-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-destructive mb-2">Error Loading Listing</h2>
          <p className="text-muted-foreground mb-4">
            {error instanceof Error ? error.message : "Failed to load listing details"}
          </p>
          <div className="flex gap-2 justify-center">
            <Button onClick={() => refetch()} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
            <Button onClick={() => router.push("/listings")} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Listings
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-8 w-48" />
        <Card>
          <CardContent className="p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-6 w-full" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 p-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Listing Not Found</h2>
          <p className="text-muted-foreground mb-4">
            The listing you&apos;re looking for doesn&apos;t exist or has been deleted.
          </p>
          <Button onClick={() => router.push("/listings")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Listings
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/listings")}
            className="p-2"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {listing.title || `Listing #${listing.id.slice(0, 8)}`}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {listing.city && listing.country
                ? `${listing.city}, ${listing.country}`
                : "Location not specified"}
            </p>
          </div>
        </div>
        <StatusBadge status={listing.status} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Home className="h-5 w-5" />
              Listing Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-sm text-muted-foreground">Listing ID</div>
              <div className="font-mono text-sm font-medium">{listing.id}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Title</div>
              <div className="font-medium">{listing.title || "N/A"}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Status</div>
              <div className="mt-1">
                <StatusBadge status={listing.status} />
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Price per Night</div>
              <div className="font-medium text-lg">
                ${listing.price_per_night?.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                }) || "0.00"}
              </div>
            </div>
            {listing.rating !== null && listing.rating !== undefined && (
              <div>
                <div className="text-sm text-muted-foreground">Rating</div>
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-medium">{listing.rating.toFixed(1)}</span>
                  {listing.review_count !== null && listing.review_count !== undefined && (
                    <span className="text-sm text-muted-foreground">
                      ({listing.review_count} reviews)
                    </span>
                  )}
                </div>
              </div>
            )}
            <div>
              <div className="text-sm text-muted-foreground">Created At</div>
              <div className="font-medium">{formatDate(listing.created_at)}</div>
            </div>
            {listing.updated_at && (
              <div>
                <div className="text-sm text-muted-foreground">Last Updated</div>
                <div className="font-medium">{formatDate(listing.updated_at)}</div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Location Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {listing.city && (
              <div>
                <div className="text-sm text-muted-foreground">City</div>
                <div className="font-medium">{listing.city}</div>
              </div>
            )}
            {listing.country && (
              <div>
                <div className="text-sm text-muted-foreground">Country</div>
                <div className="font-medium">{listing.country}</div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Host Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-sm text-muted-foreground">Host ID</div>
              <div className="font-mono text-sm font-medium">{listing.host_id}</div>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}

