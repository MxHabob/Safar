"use client";

import { Suspense } from "react";
import { HostListings, HostListingsLoading } from "./components/host-listings";
import { HostBookings, HostBookingsLoading } from "./components/host-bookings";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Home, Calendar, BarChart3, Settings, Star, DollarSign, MessageSquare } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { ListingResponse, BookingResponse } from "@/generated/schemas";

interface HostDashboardProps {
  listings: ListingResponse[];
  bookings: BookingResponse[];
  stats?: {
    totalListings: number;
    totalBookings: number;
    totalRevenue: number;
    activeBookings: number;
  };
}

export function HostDashboard({ listings, bookings, stats }: HostDashboardProps) {
  return (
    <div className="min-h-screen w-full">
      <div className="w-full max-w-7xl mx-auto px-3 lg:px-6 py-8 lg:py-12 space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl lg:text-4xl font-light tracking-tight">Host Dashboard</h1>
          <p className="text-muted-foreground font-light">
            Manage your listings and bookings
          </p>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="rounded-[18px] border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Listings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-light">{stats.totalListings}</div>
              </CardContent>
            </Card>
            <Card className="rounded-[18px] border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Bookings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-light">{stats.totalBookings}</div>
              </CardContent>
            </Card>
            <Card className="rounded-[18px] border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Active Bookings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-light">{stats.activeBookings}</div>
              </CardContent>
            </Card>
            <Card className="rounded-[18px] border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Revenue
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-light">${stats.totalRevenue.toLocaleString()}</div>
              </CardContent>
            </Card>
          </div>
        )}

        <Tabs defaultValue="listings" className="w-full">
          <TabsList className="grid w-full max-w-2xl grid-cols-3 rounded-[18px]">
            <TabsTrigger value="listings" className="rounded-[18px]">
              <Home className="size-4" />
              Listings
            </TabsTrigger>
            <TabsTrigger value="bookings" className="rounded-[18px]">
              <Calendar className="size-4" />
              Bookings
            </TabsTrigger>
            <TabsTrigger value="analytics" className="rounded-[18px]">
              <BarChart3 className="size-4" />
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="listings" className="mt-6">
            <Suspense fallback={<HostListingsLoading />}>
              <HostListings listings={listings} />
            </Suspense>
          </TabsContent>

          <TabsContent value="bookings" className="mt-6">
            <Suspense fallback={<HostBookingsLoading />}>
              <HostBookings bookings={bookings} />
            </Suspense>
          </TabsContent>

          <TabsContent value="analytics" className="mt-6">
            <Card className="rounded-[18px] border">
              <CardContent className="p-12 text-center space-y-4">
                <p className="text-muted-foreground font-light">View detailed analytics</p>
                <Link href="/analytics">
                  <Button className="rounded-[18px]">
                    <BarChart3 className="size-4 mr-2" />
                    View Full Analytics
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link href="/analytics">
            <Card className="rounded-[18px] border hover:border-primary/50 transition-colors cursor-pointer">
              <CardContent className="p-6 flex items-center gap-4">
                <BarChart3 className="size-8 text-primary" />
                <div>
                  <p className="font-medium">Analytics</p>
                  <p className="text-sm text-muted-foreground">View insights</p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/reviews">
            <Card className="rounded-[18px] border hover:border-primary/50 transition-colors cursor-pointer">
              <CardContent className="p-6 flex items-center gap-4">
                <Star className="size-8 text-primary" />
                <div>
                  <p className="font-medium">Reviews</p>
                  <p className="text-sm text-muted-foreground">Manage reviews</p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/earnings">
            <Card className="rounded-[18px] border hover:border-primary/50 transition-colors cursor-pointer">
              <CardContent className="p-6 flex items-center gap-4">
                <DollarSign className="size-8 text-primary" />
                <div>
                  <p className="font-medium">Earnings</p>
                  <p className="text-sm text-muted-foreground">View revenue</p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/settings">
            <Card className="rounded-[18px] border hover:border-primary/50 transition-colors cursor-pointer">
              <CardContent className="p-6 flex items-center gap-4">
                <Settings className="size-8 text-primary" />
                <div>
                  <p className="font-medium">Settings</p>
                  <p className="text-sm text-muted-foreground">Preferences</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}

