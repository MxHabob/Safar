"use client";

import { 
  MoreHorizontal, 
  Eye, 
  Edit, 
  X,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import type { AdminBookingResponse } from "@/generated/schemas";
import { useRouter } from "next/navigation";
import { useModal } from "@/lib/stores/modal-store";

interface BookingActionsProps {
  booking: AdminBookingResponse;
}

export function BookingActionsDropdown({ booking }: BookingActionsProps) {
  const router = useRouter();
  const { onOpen } = useModal();

  const handleViewDetails = () => {
    router.push(`/bookings/${booking.id}`);
  };

  const handleCancelBooking = () => {
    onOpen("adminConfirmCancelBooking", {
      bookingId: booking.id,
      onSuccess: () => {
        // Data will be refetched automatically by the modal
      },
    });
  };

  const canCancel = booking.status === "pending" || booking.status === "confirmed";

  return (
    <div className="text-right">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuItem onClick={handleViewDetails}>
            <Eye className="mr-2 h-4 w-4" />
            <span>View Details</span>
          </DropdownMenuItem>
          {canCancel && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={handleCancelBooking}
                className="text-red-600"
              >
                <X className="mr-2 h-4 w-4" />
                <span>Cancel Booking</span>
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

