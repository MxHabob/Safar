"use client";

import { CheckCircle2, XCircle, CalendarCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  confirmBookingApiV1BookingsBookingIdConfirmPost,
  cancelBookingApiV1BookingsBookingIdCancelPost,
  completeBookingApiV1BookingsBookingIdCompletePost,
} from "@/generated/actions/bookings";
import { useAction } from "next-safe-action/hooks";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import type { BookingResponse } from "@/generated/schemas";

interface BookingActionsProps {
  booking: BookingResponse;
}

export function BookingActions({ booking }: BookingActionsProps) {
  const router = useRouter();

  const { execute: confirmBooking, isExecuting: isConfirming } = useAction(
    confirmBookingApiV1BookingsBookingIdConfirmPost,
    {
      onSuccess: () => {
        toast.success("Booking confirmed successfully");
        router.refresh();
      },
      onError: ({ error }) => {
        toast.error(error.message || "Failed to confirm booking");
      },
    }
  );

  const { execute: cancelBooking, isExecuting: isCancelling } = useAction(
    cancelBookingApiV1BookingsBookingIdCancelPost,
    {
      onSuccess: () => {
        toast.success("Booking cancelled successfully");
        router.refresh();
      },
      onError: ({ error }) => {
        toast.error(error.message || "Failed to cancel booking");
      },
    }
  );

  const { execute: completeBooking, isExecuting: isCompleting } = useAction(
    completeBookingApiV1BookingsBookingIdCompletePost,
    {
      onSuccess: () => {
        toast.success("Booking marked as completed");
        router.refresh();
      },
      onError: ({ error }) => {
        toast.error(error.message || "Failed to complete booking");
      },
    }
  );

  const handleConfirm = () => {
    confirmBooking({
      path: {
        booking_id: booking.id!,
      },
    });
  };

  const handleCancel = () => {
    cancelBooking({
      path: {
        booking_id: booking.id!,
      },
      body: {},
    });
  };

  const handleComplete = () => {
    completeBooking({
      path: {
        booking_id: booking.id!,
      },
    });
  };

  return (
    <div className="flex items-center gap-2">
      {booking.status === "pending" && (
        <>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="default"
                size="sm"
                className="rounded-[18px]"
                disabled={isConfirming}
              >
                <CheckCircle2 className="size-4" />
                {isConfirming ? "Confirming..." : "Confirm"}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="rounded-[18px]">
              <AlertDialogHeader>
                <AlertDialogTitle>Confirm Booking</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to confirm this booking? The guest will be notified.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="rounded-[18px]">Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleConfirm}
                  disabled={isConfirming}
                  className="rounded-[18px]"
                >
                  {isConfirming ? "Confirming..." : "Confirm Booking"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                size="sm"
                className="rounded-[18px]"
                disabled={isCancelling}
              >
                <XCircle className="size-4" />
                {isCancelling ? "Cancelling..." : "Cancel"}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="rounded-[18px]">
              <AlertDialogHeader>
                <AlertDialogTitle>Cancel Booking</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to cancel this booking? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="rounded-[18px]">Keep Booking</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleCancel}
                  disabled={isCancelling}
                  className="rounded-[18px] bg-destructive"
                >
                  {isCancelling ? "Cancelling..." : "Cancel Booking"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}

      {booking.status === "confirmed" && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="default"
              size="sm"
              className="rounded-[18px]"
              disabled={isCompleting}
            >
              <CalendarCheck className="size-4" />
              {isCompleting ? "Completing..." : "Mark Complete"}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="rounded-[18px]">
            <AlertDialogHeader>
              <AlertDialogTitle>Complete Booking</AlertDialogTitle>
              <AlertDialogDescription>
                Mark this booking as completed? This will finalize the booking.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="rounded-[18px]">Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleComplete}
                disabled={isCompleting}
                className="rounded-[18px]"
              >
                {isCompleting ? "Completing..." : "Complete Booking"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}

