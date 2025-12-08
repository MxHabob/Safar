"use client";

import { Calendar, User, MapPin, DollarSign } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { formatDate } from "@/lib/utils/date";
import { formatCurrency } from "@/lib/utils/currency";
import type { BookingResponse } from "@/generated/schemas";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BookingActions } from "./booking-actions";

interface HostBookingsProps {
  bookings: BookingResponse[];
}

const statusColors = {
  pending: "secondary",
  confirmed: "default",
  cancelled: "destructive",
  completed: "default",
} as const;

export function HostBookings({ bookings }: HostBookingsProps) {
  if (!bookings || bookings.length === 0) {
    return (
      <Card className="rounded-[18px] border">
        <CardContent className="p-12 text-center">
          <p className="text-muted-foreground font-light">No bookings yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-light">Bookings</h2>

      <div className="border rounded-[18px] overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Guest</TableHead>
              <TableHead>Listing</TableHead>
              <TableHead>Check-in</TableHead>
              <TableHead>Check-out</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bookings.map((booking) => (
              <TableRow key={booking.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <User className="size-4 text-muted-foreground" />
                    <span>
                      Guest #{booking.guest_id || "Unknown"}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <Link
                    href={`/listings/${booking.listing_id}`}
                    className="text-primary hover:underline"
                  >
                    Listing #{booking.listing_id}
                  </Link>
                </TableCell>
                <TableCell>
                  {booking.check_in
                    ? formatDate(booking.check_in, "MMM d, yyyy")
                    : "N/A"}
                </TableCell>
                <TableCell>
                  {booking.check_out
                    ? formatDate(booking.check_out, "MMM d, yyyy")
                    : "N/A"}
                </TableCell>
                <TableCell>
                  {booking.total_amount} {booking.currency || "USD"}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={statusColors[booking.status as keyof typeof statusColors] || "secondary"}
                    className="rounded-[18px]"
                  >
                    {booking.status || "pending"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Link href={`/bookings/${booking.id}`}>
                      <span className="text-primary hover:underline text-sm">View</span>
                    </Link>
                    <BookingActions booking={booking} />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

export function HostBookingsLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-48" />
      <Card className="rounded-[18px] border">
        <CardContent className="p-6">
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

