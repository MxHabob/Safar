"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BookingItem } from "../ui/booking-item"
import { useRealtimeBookings } from "@/core/hooks/realtime/use-realtime-bookings"

export function UpcomingBookingsCard() {
    const { upcomingBookings } = useRealtimeBookings()

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
                title={
                  booking.place
                    ? `${booking.place.name} in ${booking.place.city} - ${booking.place.country}`
                    : `Live the experience with ${booking.experience?.owner?.first_name} - ${booking.experience?.location}`
                    || `Trip to ${booking.flight?.arrival_city} in ${booking.flight?.departure_time}`
                }
                location={
                  booking.place
                  ? `${booking.place.location}`
                  : `${booking.experience?.location}`
                  || `${booking.flight?.arrival_city} to ${booking.flight?.departure_airport}`
               }  
                date={booking?.check_in || ""}
                status={booking.status}
                actions={
                  <div className="flex gap-2 items-center justify-between">
                    <Button variant="outline" size="lg" className="text-xl">
                    {booking?.check_in || ""}
                    </Button>
                    <Button variant="outline" size="lg" className="text-xl">
                    {booking?.check_out || ""}
                    </Button>
                  </div>
                }
              />
            ))}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
