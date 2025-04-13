"use client"

import { useRealtimeBookings } from "@/redux/hooks/realtime/use-realtime-bookings"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function BookingUpdates() {
  const { bookings, bookingsByStatus, upcomingBookings } = useRealtimeBookings()

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Bookings</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <h3 className="font-medium mb-2">Upcoming Bookings</h3>
            {upcomingBookings.length > 0 ? (
              <div className="space-y-2">
                {upcomingBookings.map((booking) => (
                  <div key={booking.id} className="border rounded-lg p-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium">
                          {booking.place?.name ||
                            booking.experience?.title ||
                            booking.flight?.flight_number ||
                            "Booking"}
                        </div>
                        <div className="text-sm text-gray-500">
                          {booking.check_in && `Check-in: ${new Date(booking.check_in).toLocaleDateString()}`}
                          {booking.check_out && ` - Check-out: ${new Date(booking.check_out).toLocaleDateString()}`}
                        </div>
                      </div>
                      <Badge>{booking.status}</Badge>
                    </div>
                    <div className="mt-2 text-sm">
                      <span className="font-medium">Total:</span> {booking.total_price} {booking.currency}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-gray-500 text-sm">No upcoming bookings</div>
            )}
          </div>

          <div>
            <h3 className="font-medium mb-2">Pending Bookings</h3>
            {bookingsByStatus.pending.length > 0 ? (
              <div className="space-y-2">
                {bookingsByStatus.pending.map((booking) => (
                  <div key={booking.id} className="border rounded-lg p-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium">
                          {booking.place?.name ||
                            booking.experience?.title ||
                            booking.flight?.flight_number ||
                            "Booking"}
                        </div>
                        <div className="text-sm text-gray-500">
                          Booked on {new Date(booking.booking_date).toLocaleDateString()}
                        </div>
                      </div>
                      <Badge variant="outline">Pending</Badge>
                    </div>
                    <div className="mt-2 text-sm">
                      <span className="font-medium">Total:</span> {booking.total_price} {booking.currency}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-gray-500 text-sm">No pending bookings</div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
