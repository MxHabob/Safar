"use client";

import { useMemo, memo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DollarSign, TrendingUp, Calendar, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { BookingResponse } from "@/generated/schemas";
import { formatDate } from "@/lib/utils/date";
import { formatCurrency } from "@/lib/utils/currency";

interface HostEarningsProps {
  bookings: BookingResponse[];
}

export const HostEarnings = memo(function HostEarnings({ bookings }: HostEarningsProps) {
  // Memoize filtered bookings
  const paidBookings = useMemo(
    () => bookings.filter((b) => b.status === "confirmed" || b.status === "completed"),
    [bookings]
  );

  // Memoize totals
  const totalEarnings = useMemo(
    () => paidBookings.reduce((sum, b) => sum + (b.total_amount || 0), 0),
    [paidBookings]
  );
  
  const pendingEarnings = useMemo(
    () => bookings
      .filter((b) => b.status === "pending")
      .reduce((sum, b) => sum + (b.total_amount || 0), 0),
    [bookings]
  );

  const thisMonthEarnings = useMemo(() => {
    const now = new Date();
    return paidBookings
      .filter((b) => {
        if (!b.created_at) return false;
        const bookingDate = new Date(b.created_at);
        return (
          bookingDate.getMonth() === now.getMonth() &&
          bookingDate.getFullYear() === now.getFullYear()
        );
      })
      .reduce((sum, b) => sum + (b.total_amount || 0), 0);
  }, [paidBookings]);

  // Memoize monthly earnings
  const monthlyData = useMemo(() => {
    const monthlyEarnings = paidBookings.reduce((acc, booking) => {
      if (!booking.created_at) return acc;
      const date = new Date(booking.created_at);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      if (!acc[monthKey]) {
        acc[monthKey] = { month: date, earnings: 0, bookings: 0 };
      }
      acc[monthKey].earnings += booking.total_amount || 0;
      acc[monthKey].bookings += 1;
      return acc;
    }, {} as Record<string, { month: Date; earnings: number; bookings: number }>);

    return Object.values(monthlyEarnings)
      .sort((a, b) => a.month.getTime() - b.month.getTime())
      .slice(-6); // Last 6 months
  }, [paidBookings]);

  const handleExport = useCallback(() => {
    try {
      // Prepare CSV data
      const csvHeaders = ["Date", "Booking Number", "Check In", "Check Out", "Amount", "Status"];
      const csvRows = paidBookings.map((booking) => [
        booking.created_at ? formatDate(booking.created_at, "yyyy-MM-dd") : "N/A",
        booking.booking_number || booking.id || "N/A",
        booking.check_in ? formatDate(booking.check_in, "yyyy-MM-dd") : "N/A",
        booking.check_out ? formatDate(booking.check_out, "yyyy-MM-dd") : "N/A",
        (booking.total_amount || 0).toFixed(2),
        booking.status || "N/A",
      ]);

      // Create CSV content
      const csvContent = [
        csvHeaders.join(","),
        ...csvRows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
      ].join("\n");

      // Create blob and download
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      
      link.setAttribute("href", url);
      link.setAttribute("download", `earnings-${formatDate(new Date(), "yyyy-MM-dd")}.csv`);
      link.style.visibility = "hidden";
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
      toast.success("Earnings data exported successfully!");
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export earnings data");
    }
  }, [paidBookings]);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="rounded-[18px] border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign className="size-4" />
              Total Earnings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-light">{formatCurrency(totalEarnings)}</div>
            <p className="text-xs text-muted-foreground mt-1">All time</p>
          </CardContent>
        </Card>

        <Card className="rounded-[18px] border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="size-4" />
              This Month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-light">{formatCurrency(thisMonthEarnings)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {formatDate(new Date(), "MMM yyyy")}
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-[18px] border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Calendar className="size-4" />
              Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-light">{formatCurrency(pendingEarnings)}</div>
            <p className="text-xs text-muted-foreground mt-1">Awaiting payment</p>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Breakdown */}
      <Card className="rounded-[18px] border">
        <CardHeader className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-light">Monthly Earnings</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Last 6 months breakdown
            </p>
          </div>
          <Button variant="outline" onClick={handleExport} className="rounded-[18px]">
            <Download className="size-4 mr-2" />
            Export
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {monthlyData.length > 0 ? (
              monthlyData.map((month, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">
                        {formatDate(month.month, "MMM yyyy")}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {formatCurrency(month.earnings)} ({month.bookings} bookings)
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full transition-all"
                        style={{
                          width: `${
                            (month.earnings /
                              Math.max(...monthlyData.map((m) => m.earnings))) *
                            100
                          }%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-8">No earnings data yet</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recent Transactions */}
      <Card className="rounded-[18px] border">
        <CardHeader>
          <CardTitle className="text-lg font-light">Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {paidBookings.slice(0, 10).length > 0 ? (
              paidBookings.slice(0, 10).map((booking) => (
                <div
                  key={booking.id}
                  className="flex items-center justify-between p-4 border rounded-[18px] hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1">
                    <p className="font-medium">
                      {`Booking #${booking.booking_number || booking.id}`}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {booking.check_in && booking.check_out
                        ? `${formatDate(booking.check_in, "MMM d")} - ${formatDate(booking.check_out, "MMM d")}`
                        : booking.created_at
                        ? formatDate(booking.created_at, "MMM d, yyyy")
                        : "N/A"}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">
                      {formatCurrency(booking.total_amount || 0)}
                    </div>
                    <p className="text-xs text-muted-foreground capitalize">
                      {booking.status}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-8">No transactions yet</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
});

export function HostEarningsLoading() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="rounded-[18px] border">
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card className="rounded-[18px] border">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

