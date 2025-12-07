"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PaymentForm } from "./components/payment-form";
import { useGetBookingApiV1BookingsBookingIdGet } from "@/generated/hooks/bookings";
import { EmptyState } from "@/components/shared/empty-state";
import { AlertCircle } from "lucide-react";

interface PaymentPageProps {
  bookingId: string;
}

export function PaymentPage({ bookingId }: PaymentPageProps) {
  const router = useRouter();
  const [paymentCompleted, setPaymentCompleted] = useState(false);
  const [paymentId, setPaymentId] = useState<string | null>(null);

  const {
    data: booking,
    isLoading,
    error,
  } = useGetBookingApiV1BookingsBookingIdGet(bookingId);

  const handlePaymentSuccess = (paymentId: string) => {
    setPaymentCompleted(true);
    setPaymentId(paymentId);
    // Optionally redirect after a delay
    setTimeout(() => {
      router.push(`/bookings/${bookingId}`);
    }, 3000);
  };

  const handleCancel = () => {
    router.back();
  };

  if (isLoading) {
    return <PaymentPageLoading />;
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center p-4">
        <EmptyState
          icon={<AlertCircle className="h-12 w-12" />}
          title="Booking not found"
          description="The booking you're trying to pay for doesn't exist or you don't have access to it."
        />
      </div>
    );
  }

  if (paymentCompleted) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center p-4">
        <Card className="w-full max-w-md rounded-[18px] border">
          <CardContent className="p-8 text-center space-y-6">
            <div className="flex justify-center">
              <div className="size-16 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                <CheckCircle className="size-8 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-light">Payment Successful!</h2>
              <p className="text-muted-foreground font-light">
                Your payment has been processed successfully.
              </p>
            </div>
            <div className="space-y-2 pt-4 border-t">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground font-light">Booking ID</span>
                <span className="font-light font-mono text-xs">{booking.id}</span>
              </div>
              {paymentId && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground font-light">Payment ID</span>
                  <span className="font-light font-mono text-xs">{paymentId}</span>
                </div>
              )}
            </div>
            <Button
              onClick={() => router.push(`/bookings/${bookingId}`)}
              className="w-full rounded-[18px] font-light"
            >
              View Booking Details
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full">
      <div className="w-full max-w-4xl mx-auto px-3 lg:px-6 py-8 lg:py-12 space-y-8">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleCancel}
            className="rounded-[18px]"
          >
            <ArrowLeft className="size-4" />
          </Button>
          <div>
            <h1 className="text-3xl lg:text-4xl font-light tracking-tight">
              Complete Payment
            </h1>
            <p className="text-sm text-muted-foreground font-light mt-1">
              Booking ID: {booking.id}
            </p>
          </div>
        </div>

        {/* Booking Summary */}
        <Card className="rounded-[18px] border">
          <CardContent className="p-6">
            <h2 className="text-lg font-light mb-4">Booking Summary</h2>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground font-light">Check-in</span>
                <span className="font-light">
                  {new Date(booking.check_in).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground font-light">Check-out</span>
                <span className="font-light">
                  {new Date(booking.check_out).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground font-light">Guests</span>
                <span className="font-light">{booking.guests}</span>
              </div>
              <div className="flex justify-between pt-3 border-t font-light">
                <span>Total Amount</span>
                <span className="text-lg">
                  {booking.currency} {booking.total_amount}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Form */}
        <PaymentForm
          booking={booking}
          onSuccess={handlePaymentSuccess}
          onCancel={handleCancel}
        />
      </div>
    </div>
  );
}

export function PaymentPageLoading() {
  return (
    <div className="min-h-screen w-full">
      <div className="w-full max-w-4xl mx-auto px-3 lg:px-6 py-8 lg:py-12 space-y-8">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-48 rounded-[18px]" />
        <Skeleton className="h-96 rounded-[18px]" />
      </div>
    </div>
  );
}

