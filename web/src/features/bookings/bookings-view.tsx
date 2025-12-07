"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Calendar, MapPin, Users, X, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { useListBookingsApiV1BookingsGet } from "@/generated/hooks/bookings";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import Graphic from "@/components/shared/graphic";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQueryStates } from "nuqs";
import { parseAsString } from "nuqs";
import { cancelBookingApiV1BookingsBookingIdCancelPost } from "@/generated/actions/bookings";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

/**
 * Bookings view - displays all user bookings with filtering and management
 */
export function BookingsView() {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useQueryStates({
    status: parseAsString.withDefault(""),
  });

  const { data, isLoading, error, refetch } = useListBookingsApiV1BookingsGet(
    0,
    50,
    statusFilter.status || undefined
  );

  const handleCancelBooking = async (bookingId: string) => {
    if (!confirm("Are you sure you want to cancel this booking?")) {
      return;
    }

    try {
      const result = await cancelBookingApiV1BookingsBookingIdCancelPost({
        params: {
          path: {
            booking_id: bookingId,
          },
        },
        body: {
          cancellation_reason: "User cancelled",
        },
      });
    } catch (error) {
      toast.error("Failed to cancel booking. Please try again.");
      console.error("Cancel booking error:", error);
    }
  };

    const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { variant: "secondary" as const, icon: Clock, label: "Pending" },
      confirmed: { variant: "default" as const, icon: CheckCircle, label: "Confirmed" },
      completed: { variant: "default" as const, icon: CheckCircle, label: "Completed" },
      cancelled: { variant: "destructive" as const, icon: X, label: "Cancelled" },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || {
      variant: "secondary" as const,
      icon: AlertCircle,
      label: status,
    };

    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="rounded-full">
        <Icon className="size-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  if (isLoading) {
    return <BookingsLoading />;
  }

  if (error) {
    return (
      <EmptyState
        icon={<AlertCircle className="h-12 w-12" />}
        title="Error loading bookings"
        description="Unable to load your bookings. Please try again."
      />
    );
  }

  const bookings = data?.items || [];
  const total = data?.total || 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl lg:text-4xl font-light tracking-tight">
            My Bookings
          </h1>
          <p className="text-sm text-muted-foreground font-light mt-2">
            {total} {total === 1 ? "booking" : "bookings"}
          </p>
        </div>

        {/* Filter */}
        <Select
          value={statusFilter.status}
          onValueChange={(value) => setStatusFilter({ status: value || "" })}
        >
          <SelectTrigger className="w-[180px] rounded-[18px]">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="confirmed">Confirmed</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Bookings List */}
      {bookings.length === 0 ? (
        <EmptyState
          icon={<Calendar className="h-12 w-12" />}
          title="No bookings found"
          description={
            statusFilter.status
              ? `No ${statusFilter.status} bookings found.`
              : "You haven't made any bookings yet."
          }
        />
      ) : (
        <div className="grid gap-6">
          {bookings.map((booking) => {
            const photoUrl = "/images/image1.jpg";

            return (
              <Card
                key={booking.id}
                className="rounded-[18px] border hover:border-foreground/20 transition-all"
              >
                <div className="absolute top-0 left-0 size-[18px]">
                  <Graphic />
                </div>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Image */}
                    <div className="relative h-48 lg:h-full rounded-[18px] overflow-hidden bg-muted">
                      <Image
                        src={photoUrl}
                        alt="Accommodation"
                        fill
                        quality={75}
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 25vw"
                      />
                    </div>

                    {/* Details */}
                    <div className="lg:col-span-2 space-y-4">
                      <div>
                        <div className="flex items-start justify-between mb-2">
                          <Link
                            href={`/listings/${booking.listing_id}`}
                            className="hover:underline"
                          >
                            <h3 className="text-xl font-light">
                              Accommodation
                            </h3>
                          </Link>
                          {getStatusBadge(booking.status)}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground font-light">
                          <MapPin className="size-4" />
                          <span>Location details unavailable</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Calendar className="size-4 text-muted-foreground" />
                          <div>
                            <div className="text-muted-foreground font-light">Check-in</div>
                            <div className="font-light">
                              {new Date(booking.check_in).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="size-4 text-muted-foreground" />
                          <div>
                            <div className="text-muted-foreground font-light">Check-out</div>
                            <div className="font-light">
                              {new Date(booking.check_out).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="size-4 text-muted-foreground" />
                          <div>
                            <div className="text-muted-foreground font-light">Guests</div>
                            <div className="font-light">{booking.guests}</div>
                          </div>
                        </div>
                        <div>
                          <div className="text-muted-foreground font-light">Total</div>
                          <div className="font-light text-lg">
                            {booking.currency} {booking.total_amount}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2">
                      <Button
                        variant="outline"
                        className="rounded-[18px]"
                        onClick={() => router.push(`/bookings/${booking.id}`)}
                      >
                        View Details
                      </Button>
                      {booking.status !== "cancelled" &&
                        booking.status !== "completed" && (
                          <Button
                            variant="destructive"
                            className="rounded-[18px]"
                            onClick={() => handleCancelBooking(booking.id)}
                          >
                            <X className="size-4 mr-2" />
                            Cancel
                          </Button>
                        )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}


export function BookingsLoading() {
  return (
    <div className="space-y-8">
      <Skeleton className="h-12 w-64" />
      <div className="grid gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-48 rounded-[18px]" />
        ))}
      </div>
    </div>
  );
}
