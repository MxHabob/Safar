"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Building2, Listings, Calendar, DollarSign } from "lucide-react";

interface AgencyDashboardProps {
  agency: any | null;
  listings: any[];
  bookings: any[];
  stats: {
    totalListings: number;
    totalBookings: number;
    activeBookings: number;
    totalRevenue: number;
  };
}

export function AgencyDashboard({
  agency,
  listings,
  bookings,
  stats,
}: AgencyDashboardProps) {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl lg:text-4xl font-light tracking-tight">
          {agency?.name || "Agency Dashboard"}
        </h1>
        {agency?.description && (
          <p className="text-muted-foreground font-light">
            {agency.description}
          </p>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="rounded-[18px] border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Listings</CardTitle>
            <Listings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalListings}</div>
            <p className="text-xs text-muted-foreground">
              Active listings
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-[18px] border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalBookings}</div>
            <p className="text-xs text-muted-foreground">
              All time bookings
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-[18px] border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Bookings</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeBookings}</div>
            <p className="text-xs text-muted-foreground">
              Currently active
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-[18px] border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${stats.totalRevenue.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              All time revenue
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="rounded-[18px] border">
          <CardHeader>
            <CardTitle>Recent Listings</CardTitle>
          </CardHeader>
          <CardContent>
            {listings.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                No listings yet. Create your first listing to get started.
              </p>
            ) : (
              <div className="space-y-4">
                {listings.slice(0, 5).map((listing: any) => (
                  <div key={listing.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{listing.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {listing.city}, {listing.country}
                      </p>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {listing.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-[18px] border">
          <CardHeader>
            <CardTitle>Recent Bookings</CardTitle>
          </CardHeader>
          <CardContent>
            {bookings.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                No bookings yet.
              </p>
            ) : (
              <div className="space-y-4">
                {bookings.slice(0, 5).map((booking: any) => (
                  <div key={booking.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Booking #{booking.booking_number}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(booking.check_in).toLocaleDateString()} - {new Date(booking.check_out).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="text-sm font-medium">
                      ${booking.total_amount}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* API Notice */}
      {!agency && (
        <Card className="rounded-[18px] border border-yellow-500/20 bg-yellow-500/5">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">
              <strong>Note:</strong> Agency API endpoints are not yet available. 
              This dashboard will be fully functional once the backend endpoints are implemented.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export function AgencyDashboardLoading() {
  return (
    <div className="space-y-8">
      <Skeleton className="h-12 w-64" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-[18px]" />
        ))}
      </div>
      <Skeleton className="h-96 w-full rounded-[18px]" />
    </div>
  );
}

