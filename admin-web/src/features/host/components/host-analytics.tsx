"use client";

import { useMemo, memo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, DollarSign, Calendar, Eye } from "lucide-react";
import type { ListingResponse, BookingResponse } from "@/generated/schemas";
import { formatCurrency, formatNumber } from "@/lib/utils/currency";

interface HostAnalyticsProps {
  listings: ListingResponse[];
  bookings: BookingResponse[];
}

export const HostAnalytics = memo(function HostAnalytics({ listings, bookings }: HostAnalyticsProps) {
  // Memoize filtered bookings
  const confirmedBookings = useMemo(
    () => bookings.filter((b) => b.status === "confirmed"),
    [bookings]
  );
  const completedBookings = useMemo(
    () => bookings.filter((b) => b.status === "completed"),
    [bookings]
  );
  const cancelledBookings = useMemo(
    () => bookings.filter((b) => b.status === "cancelled"),
    [bookings]
  );

  // Memoize total revenue
  const totalRevenue = useMemo(
    () => bookings.reduce((sum, b) => sum + (b.total_amount || 0), 0),
    [bookings]
  );

  // Memoize monthly revenue (last 6 months)
  const monthlyRevenue = useMemo(() => {
    const maxRevenue = Math.max(
      ...Array.from({ length: 6 }, (_, i) => {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const monthBookings = bookings.filter((b) => {
          if (!b.created_at) return false;
          const bookingDate = new Date(b.created_at);
          return (
            bookingDate.getMonth() === date.getMonth() &&
            bookingDate.getFullYear() === date.getFullYear() &&
            b.status !== "cancelled"
          );
        });
        return monthBookings.reduce((sum, b) => sum + (b.total_amount || 0), 0);
      })
    );

    return Array.from({ length: 6 }, (_, i) => {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const month = date.toLocaleString("default", { month: "short", year: "numeric" });
      const monthBookings = bookings.filter((b) => {
        if (!b.created_at) return false;
        const bookingDate = new Date(b.created_at);
        return (
          bookingDate.getMonth() === date.getMonth() &&
          bookingDate.getFullYear() === date.getFullYear() &&
          b.status !== "cancelled"
        );
      });
      const revenue = monthBookings.reduce((sum, b) => sum + (b.total_amount || 0), 0);
      return { month, revenue, bookings: monthBookings.length, maxRevenue };
    }).reverse();
  }, [bookings]);

  // Memoize top performing listings
  const listingPerformance = useMemo(() => {
    return listings
      .map((listing) => {
        const listingBookings = bookings.filter(
          (b) => b.listing_id === listing.id && b.status !== "cancelled"
        );
        const revenue = listingBookings.reduce((sum, b) => sum + (b.total_amount || 0), 0);
        return {
          listing,
          bookings: listingBookings.length,
          revenue,
        };
      })
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }, [listings, bookings]);

  // Memoize average booking value
  const avgBookingValue = useMemo(() => {
    return confirmedBookings.length > 0
      ? confirmedBookings.reduce((sum, b) => sum + (b.total_amount || 0), 0) / confirmedBookings.length
      : 0;
  }, [confirmedBookings]);

  // Memoize occupancy rate
  const occupancyRate = useMemo(() => {
    const activeListings = listings.filter((l) => l.status === "active");
    return activeListings.length > 0
      ? (confirmedBookings.length / (activeListings.length * 30)) * 100
      : 0;
  }, [listings, confirmedBookings]);

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="rounded-[18px] border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign className="size-4" />
              Total Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-light">{formatCurrency(totalRevenue)}</div>
            <p className="text-xs text-muted-foreground mt-1">All time</p>
          </CardContent>
        </Card>

        <Card className="rounded-[18px] border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Calendar className="size-4" />
              Confirmed Bookings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-light">{confirmedBookings.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {completedBookings.length} completed
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-[18px] border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="size-4" />
              Avg Booking Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-light">{formatCurrency(avgBookingValue)}</div>
            <p className="text-xs text-muted-foreground mt-1">Per booking</p>
          </CardContent>
        </Card>

        <Card className="rounded-[18px] border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Eye className="size-4" />
              Occupancy Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-light">{occupancyRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground mt-1">Estimated</p>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Revenue Chart */}
      <Card className="rounded-[18px] border">
        <CardHeader>
          <CardTitle className="text-lg font-light">Monthly Revenue</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {monthlyRevenue.map((month, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{month.month}</span>
                    <span className="text-sm text-muted-foreground">
                      {formatCurrency(month.revenue)} ({month.bookings} bookings)
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all"
                      style={{
                        width: `${month.maxRevenue > 0 ? (month.revenue / month.maxRevenue) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Top Performing Listings */}
      <Card className="rounded-[18px] border">
        <CardHeader>
          <CardTitle className="text-lg font-light">Top Performing Listings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {listingPerformance.length > 0 ? (
              listingPerformance.map((item, index) => (
                <div
                  key={item.listing.id}
                  className="flex items-center justify-between p-4 border rounded-[18px] hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="flex items-center justify-center size-10 rounded-full bg-primary/10 text-primary font-medium">
                      #{index + 1}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium">{item.listing.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {item.listing.city}, {item.listing.country}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{formatCurrency(item.revenue)}</div>
                    <p className="text-xs text-muted-foreground">{item.bookings} bookings</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-8">No bookings yet</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Booking Status Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="rounded-[18px] border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Confirmed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-light text-primary">{confirmedBookings.length}</div>
          </CardContent>
        </Card>

        <Card className="rounded-[18px] border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Completed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-light text-green-600">{completedBookings.length}</div>
          </CardContent>
        </Card>

        <Card className="rounded-[18px] border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Cancelled
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-light text-destructive">{cancelledBookings.length}</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
});

export function HostAnalyticsLoading() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
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

