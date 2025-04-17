"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BookingItem } from "../ui/booking-item"

export function UpcomingBookingsCard() {
  const upcomingBookings = [
    {
      title: "Desert Safari Adventure",
      location: "Dubai Desert Conservation Reserve",
      date: "May 15, 2025",
      status: "Pending",
    },
    {
      title: "Luxury Beach Resort",
      location: "Palm Jumeirah",
      date: "June 3, 2025",
      status: "Confirmed",
    },
  ]

  const pastBookings = [
    {
      title: "City Sightseeing Tour",
      location: "Downtown Dubai",
      date: "April 10, 2025",
      status: "Completed",
      rating: 4.5,
    },
    {
      title: "Mountain Hiking Experience",
      location: "Hatta Mountains",
      date: "March 22, 2025",
      status: "Completed",
      rating: 5,
    },
  ]

  return (
    <Card className="col-span-1 row-span-1">
      <CardHeader className="p-4">
        <CardTitle className="text-sm font-medium flex justify-between">
          <span>Upcoming Bookings</span>
          <Button variant="ghost" size="sm" className="h-auto p-0">
            <span className="text-xs">View all</span>
            <ArrowRight className="ml-1 h-3 w-3" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Tabs defaultValue="upcoming" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="past">Past</TabsTrigger>
          </TabsList>
          <TabsContent value="upcoming" className="space-y-1">
            {upcomingBookings.map((booking, index) => (
              <BookingItem
                key={index}
                title={booking.title}
                location={booking.location}
                date={booking.date}
                status={booking.status}
                actions={
                  <div className="flex gap-2 mt-2">
                    <Button variant="outline" size="sm" className="h-7 text-xs">
                      Check in
                    </Button>
                    <Button variant="outline" size="sm" className="h-7 text-xs">
                      Check out
                    </Button>
                  </div>
                }
              />
            ))}
          </TabsContent>
          <TabsContent value="past" className="space-y-1">
            {pastBookings.map((booking, index) => (
              <BookingItem
                key={index}
                title={booking.title}
                location={booking.location}
                date={booking.date}
                status={booking.status}
                rating={booking.rating}
              />
            ))}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
