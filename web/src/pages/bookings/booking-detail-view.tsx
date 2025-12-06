"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, MapPin, Users, CreditCard, CheckCircle2 } from "lucide-react";
import Graphic from "@/components/shared/graphic";

interface BookingDetailViewProps {
  bookingId: string;
}

/**
 * Booking detail view
 * Shows booking information, dates, guests, and payment details
 */
export const BookingDetailView = ({ bookingId }: BookingDetailViewProps) => {
  // TODO: Fetch booking data using React Query hook
  // const { data: booking, isLoading } = useGetBookingApiV1BookingsBookingIdGet(bookingId);

  // For now, show loading state
  return (
    <div className="min-h-screen w-full">
      <div className="w-full max-w-4xl mx-auto px-3 lg:px-6 py-8 lg:py-12 space-y-8">
        <div className="space-y-4">
          <h1 className="text-3xl lg:text-4xl font-light tracking-tight">
            Booking Details
          </h1>
          <p className="text-muted-foreground font-light">
            Booking ID: {bookingId}
          </p>
        </div>

        <Card className="rounded-[18px] border border-border">
          <div className="absolute top-0 left-0 size-[18px]">
            <Graphic />
          </div>
          <CardContent className="p-6 space-y-6">
            <div className="flex items-center gap-2 text-muted-foreground">
              <CheckCircle2 className="size-5 text-green-500" />
              <span className="font-light">Confirmed</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-center gap-3">
                <Calendar className="size-5 text-muted-foreground" />
                <div>
                  <div className="text-sm text-muted-foreground font-light">Check-in</div>
                  <div className="font-light">Loading...</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="size-5 text-muted-foreground" />
                <div>
                  <div className="text-sm text-muted-foreground font-light">Check-out</div>
                  <div className="font-light">Loading...</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Users className="size-5 text-muted-foreground" />
                <div>
                  <div className="text-sm text-muted-foreground font-light">Guests</div>
                  <div className="font-light">Loading...</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="size-5 text-muted-foreground" />
                <div>
                  <div className="text-sm text-muted-foreground font-light">Location</div>
                  <div className="font-light">Loading...</div>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-border">
              <div className="flex items-center gap-3">
                <CreditCard className="size-5 text-muted-foreground" />
                <div>
                  <div className="text-sm text-muted-foreground font-light">Total Amount</div>
                  <div className="font-light text-2xl">Loading...</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export const BookingDetailLoading = () => {
  return (
    <div className="min-h-screen w-full">
      <div className="w-full max-w-4xl mx-auto px-3 lg:px-6 py-8 lg:py-12 space-y-8">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-96 rounded-[18px]" />
      </div>
    </div>
  );
};

