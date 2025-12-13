"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, RefreshCw, Calendar, DollarSign, User, Home } from "lucide-react";
import { useGetBookingApiV1AdminBookingsBookingIdGet } from "@/generated/hooks/admin";
import type { GetBookingApiV1AdminBookingsBookingIdGetResponse } from "@/generated/schemas";

interface BookingDetailPageProps {
  initialBookingData?: GetBookingApiV1AdminBookingsBookingIdGetResponse;
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
  const variantMap: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    confirmed: "default",
    pending: "secondary",
    cancelled: "destructive",
    checked_in: "default",
    checked_out: "default",
    completed: "default",
    rejected: "destructive",
    refunded: "outline",
  };

  const variant = variantMap[status] || "outline";

  return (
    <Badge variant={variant} className="capitalize">
      {status}
    </Badge>
  );
}

export function BookingDetailPage({ initialBookingData }: BookingDetailPageProps) {
  const router = useRouter();
  
  const bookingId = initialBookingData?.id || "";

  const { data, isLoading, error, refetch } = useGetBookingApiV1AdminBookingsBookingIdGet(bookingId, {
    enabled: !!bookingId,
    initialData: initialBookingData,
  });

  const booking = data || initialBookingData;

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 p-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-destructive mb-2">Error Loading Booking</h2>
          <p className="text-muted-foreground mb-4">
            {error instanceof Error ? error.message : "Failed to load booking details"}
          </p>
          <div className="flex gap-2 justify-center">
            <Button onClick={() => refetch()} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
            <Button onClick={() => router.push("/bookings")} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Bookings
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

  if (!booking) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 p-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Booking Not Found</h2>
          <p className="text-muted-foreground mb-4">
            The booking you&apos;re looking for doesn&apos;t exist or has been deleted.
          </p>
          <Button onClick={() => router.push("/bookings")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Bookings
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
            onClick={() => router.push("/bookings")}
            className="p-2"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Booking #{booking.id.slice(0, 8)}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {formatDate(booking.created_at)}
            </p>
          </div>
        </div>
        <StatusBadge status={booking.status} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Booking Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-sm text-muted-foreground">Booking ID</div>
              <div className="font-mono text-sm font-medium">{booking.id}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Status</div>
              <div className="mt-1">
                <StatusBadge status={booking.status} />
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Check-in Date</div>
              <div className="font-medium">{formatDate(booking.check_in)}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Check-out Date</div>
              <div className="font-medium">{formatDate(booking.check_out)}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Number of Guests</div>
              <div className="font-medium">{booking.guests || "N/A"}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Total Amount</div>
              <div className="font-medium text-lg">
                ${booking.total_amount?.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                }) || "0.00"}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Created At</div>
              <div className="font-medium">{formatDate(booking.created_at)}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Guest Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-sm text-muted-foreground">Guest ID</div>
              <div className="font-mono text-sm font-medium">{booking.guest_id}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Host ID</div>
              <div className="font-mono text-sm font-medium">{booking.host_id}</div>
            </div>
          </CardContent>
        </Card>

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
              <div className="font-mono text-sm font-medium">{booking.listing_id}</div>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}

