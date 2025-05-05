"use client"

import { useGetBookingsQuery } from "@/core/services/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { CalendarCheck, CalendarX, Clock, DollarSign } from "lucide-react"
import { useAuth } from "@/core/hooks/use-auth"

export function StatsRow() {
  const { data: bookingsData, isLoading } = useGetBookingsQuery({
    page: 1,
    page_size: 100,
  });
  const { user } = useAuth()

  const getOwnerBookings = () => {
    if (!bookingsData?.results) return []

    return bookingsData.results.filter((booking) => booking.place?.owner.id === user.id)
  }

  const ownerBookings = getOwnerBookings()

  // Calculate stats
  const pendingCount = ownerBookings.filter((b) => b.status === "Pending").length
  const confirmedCount = ownerBookings.filter((b) => b.status === "Confirmed").length
  const rejectedCount = ownerBookings.filter((b) => b.status === "Cancelled").length

  // Calculate total revenue from confirmed bookings
  const totalRevenue = ownerBookings
    .filter((b) => b.status === "Confirmed")
    .reduce((sum, booking) => sum + (booking.total_price || 0), 0)

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                <Skeleton className="h-4 w-24" />
              </CardTitle>
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-4 w-32 mt-1" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
          <Clock className="h-4 w-4 text-yellow-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{pendingCount}</div>
          <p className="text-xs text-muted-foreground">Reservations awaiting your response</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Confirmed</CardTitle>
          <CalendarCheck className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{confirmedCount}</div>
          <p className="text-xs text-muted-foreground">Upcoming confirmed reservations</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Rejected</CardTitle>
          <CalendarX className="h-4 w-4 text-red-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{rejectedCount}</div>
          <p className="text-xs text-muted-foreground">Reservations you&apos;ve declined</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          <DollarSign className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">${totalRevenue.toFixed(2)}</div>
          <p className="text-xs text-muted-foreground">From confirmed reservations</p>
        </CardContent>
      </Card>
    </div>
  )
}
