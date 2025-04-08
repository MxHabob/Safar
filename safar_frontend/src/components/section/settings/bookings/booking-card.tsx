"use client"

import Link from "next/link"
import { MapPin, Calendar, Clock, Plane, Package, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { Booking } from "@/redux/types/types"
import Image from "next/image"
interface BookingCardProps {
  booking: Booking
  onCancel: () => void
}

export function BookingCard({ booking, onCancel }: BookingCardProps) {
  const getBookingContent = () => {
    if (booking.place) {
      return <PlaceBookingCard booking={booking} place={booking.place} onCancel={onCancel} />
    } else if (booking.experience) {
      return <ExperienceBookingCard booking={booking} experience={booking.experience} onCancel={onCancel} />
    } else if (booking.flight) {
      return <FlightBookingCard booking={booking} flight={booking.flight} onCancel={onCancel} />
    } else if (booking.box) {
      return <BoxBookingCard booking={booking} box={booking.box} onCancel={onCancel} />
    }
    return null
  }

  return getBookingContent()
}

function PlaceBookingCard({ booking, place, onCancel }: { booking: Booking; place: Booking['place']; onCancel: () => void }) {
  const checkInDate = new Date(booking.check_in!).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })

  const checkOutDate = new Date(booking.check_out!).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })

  const getStatusBadge = () => {
    switch (booking.status) {
      case "Confirmed":
        return <Badge className="bg-emerald-500 hover:bg-emerald-600">Confirmed</Badge>
      case "Pending":
        return <Badge className="bg-amber-500 hover:bg-amber-600">Pending</Badge>
      case "Cancelled":
        return <Badge className="bg-rose-500 hover:bg-rose-600">Cancelled</Badge>
      default:
        return null
    }
  }

  return (
    <Card className="overflow-hidden h-full flex flex-col">
      <div className="relative">
        {place && (
          <Image
            src={place.media && place.media[0] ? place.media[0].url : "/placeholder.svg?height=300&width=500"}
            alt={place.name || "Place image"}
            width={500}
            height={300}
            className="w-full h-48 object-cover"
          />
        )}
        <div className="absolute top-0 left-0 p-2">
          <Badge className="hover:bg-rose-600">
            <MapPin className="h-3 w-3 mr-1" />
            Place
          </Badge>
        </div>
        <div className="absolute top-0 right-0 p-2">{getStatusBadge()}</div>
      </div>
      <CardContent className="flex-grow pt-6">
        <h3 className="font-semibold text-lg mb-1">{place?.name}</h3>
        <div className="flex items-center gap-1 mb-4">
          <MapPin className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {place?.city}, {place?.country}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="border rounded-md p-2">
            <div className="text-xs text-muted-foreground mb-1">Check-in</div>
            <div className="font-medium">{checkInDate}</div>
          </div>
          <div className="border rounded-md p-2">
            <div className="text-xs text-muted-foreground mb-1">Check-out</div>
            <div className="font-medium">{checkOutDate}</div>
          </div>
        </div>

        <div className="flex justify-between items-center mb-2">
          <div className="text-sm">
            <span className="font-medium">Total:</span> {booking.total_price} {booking.currency}
          </div>
          <div className="text-sm">
            <span className="font-medium">Payment:</span> {booking.payment_status}
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between pt-0 pb-4">
        <Button asChild variant="outline">
          <Link href={`/bookings/${booking.id}`}>View Details</Link>
        </Button>
        {booking.status !== "Cancelled" && (
          <Button variant="destructive" onClick={onCancel} disabled={booking.status as string === "Cancelled"}>
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}

function ExperienceBookingCard({
  booking,
  experience,
  onCancel,
}: { booking: Booking; experience: Booking['experience']; onCancel: () => void }) {
  const bookingDate = new Date(booking.booking_date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })

  const getStatusBadge = () => {
    switch (booking.status) {
      case "Confirmed":
        return <Badge className="bg-emerald-500 hover:bg-emerald-600">Confirmed</Badge>
      case "Pending":
        return <Badge className="bg-amber-500 hover:bg-amber-600">Pending</Badge>
      case "Cancelled":
        return <Badge className="bg-rose-500 hover:bg-rose-600">Cancelled</Badge>
      default:
        return null
    }
  }

  return (
    <Card className="overflow-hidden h-full flex flex-col">
      <div className="relative">
        <img
          src={
            experience?.media && experience?.media[0]
              ? experience?.media[0].url
              : "/placeholder.svg?height=300&width=500"
          }
          alt={experience?.title}
          className="w-full h-48 object-cover"
        />
        <div className="absolute top-0 left-0 p-2">
          <Badge className=" hover:bg-emerald-600">
            <Calendar className="h-3 w-3 mr-1" />
            Experience
          </Badge>
        </div>
        <div className="absolute top-0 right-0 p-2">{getStatusBadge()}</div>
      </div>
      <CardContent className="flex-grow pt-6">
        <h3 className="font-semibold text-lg mb-1">{experience?.title}</h3>
        <div className="flex items-center gap-1 mb-4">
          <MapPin className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">{experience?.location}</span>
        </div>

        <div className="flex items-center gap-4 mb-4">
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">{bookingDate}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">{experience?.duration} hours</span>
          </div>
        </div>

        <div className="flex justify-between items-center mb-2">
          <div className="text-sm">
            <span className="font-medium">Total:</span> {booking.total_price} {booking.currency}
          </div>
          <div className="text-sm">
            <span className="font-medium">Payment:</span> {booking.payment_status}
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between pt-0 pb-4">
        <Button asChild variant="outline">
          <Link href={`/bookings/${booking.id}`}>View Details</Link>
        </Button>
        {booking.status !== "Cancelled" && (
          <Button variant="destructive" onClick={onCancel} disabled={booking.status as string === "Cancelled"}>
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}

function FlightBookingCard({ booking, flight, onCancel }: { booking: Booking; flight: Booking['flight']; onCancel: () => void }) {
  const departureDate = flight?.departure_time
    ? new Date(flight.departure_time).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "N/A";

  const departureTime = new Date(flight.departure_time).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  })

  const arrivalTime = new Date(flight.arrival_time).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  })

  const getStatusBadge = () => {
    switch (booking.status) {
      case "Confirmed":
        return <Badge className="bg-emerald-500 hover:bg-emerald-600">Confirmed</Badge>
      case "Pending":
        return <Badge className="bg-amber-500 hover:bg-amber-600">Pending</Badge>
      case "Cancelled":
        return <Badge className="bg-rose-500 hover:bg-rose-600">Cancelled</Badge>
      default:
        return null
    }
  }

  return (
    <Card className="overflow-hidden h-full flex flex-col">
      <div className="bg-sky-50 p-4 relative">
        <div className="absolute top-0 left-0 p-2">
          <Badge className=" hover:bg-sky-600">
            <Plane className="h-3 w-3 mr-1" />
            Flight
          </Badge>
        </div>
        <div className="absolute top-0 right-0 p-2">{getStatusBadge()}</div>
        <div className="flex items-center justify-between mb-4 mt-4">
          <div className="flex items-center gap-2">
            <Plane className="h-5 w-5 text-sky-600" />
            <span className="font-semibold">{flight?.airline}</span>
          </div>
          <span className="text-sm text-muted-foreground">{flight?.flight_number}</span>
        </div>
        <div className="flex items-center justify-between mb-2">
          <div className="text-center">
            <div className="text-xl font-bold">{flight?.departure_airport}</div>
            <div className="text-sm text-muted-foreground">{departureTime}</div>
          </div>
          <div className="flex-1 mx-4 relative">
            <div className="border-t border-dashed border-sky-300 my-2"></div>
            <Plane className="absolute top-1/2 left-1/2 transform -translate-y-1/2 -translate-x-1/2 h-4 w-4 text-sky-500" />
          </div>
          <div className="text-center">
            <div className="text-xl font-bold">{flight?.arrival_airport}</div>
            <div className="text-sm text-muted-foreground">{arrivalTime}</div>
          </div>
        </div>
      </div>
      <CardContent className="flex-grow pt-4">
        <div className="flex justify-between items-center mb-2">
          <div className="text-sm">
            <span className="font-medium">Date:</span> {departureDate}
          </div>
          <div className="text-sm">
            <span className="font-medium">Duration:</span> {flight?.duration}h
          </div>
        </div>
        <div className="text-sm mb-3">
          <span className="font-medium">Destination:</span> {flight?.arrival_city}
        </div>

        <div className="flex justify-between items-center mb-2">
          <div className="text-sm">
            <span className="font-medium">Total:</span> {booking.total_price} {booking.currency}
          </div>
          <div className="text-sm">
            <span className="font-medium">Payment:</span> {booking.payment_status}
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between pt-0 pb-4">
        <Button asChild variant="outline">
          <Link href={`/bookings/${booking.id}`}>View Details</Link>
        </Button>
        {booking.status !== "Cancelled" && (
          <Button variant="destructive" onClick={onCancel} disabled={booking?.status === "Cancelled"}>
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}

function BoxBookingCard({ booking, box, onCancel }: { booking: Booking; box: Booking['box']; onCancel: () => void }) {
  const checkInDate = booking.check_in
    ? new Date(booking.check_in).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null

  const checkOutDate = booking.check_out
    ? new Date(booking.check_out).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null

  const getStatusBadge = () => {
    switch (booking.status) {
      case "Confirmed":
        return <Badge className="bg-emerald-500 hover:bg-emerald-600">Confirmed</Badge>
      case "Pending":
        return <Badge className="bg-amber-500 hover:bg-amber-600">Pending</Badge>
      case "Cancelled":
        return <Badge className="bg-rose-500 hover:bg-rose-600">Cancelled</Badge>
      default:
        return null
    }
  }

  return (
    <Card className="overflow-hidden h-full flex flex-col">
      <div className="relative">
        <img
          src={box?.media && box?.media[0] ? box?.media[0].url : "/placeholder.svg?height=300&width=500"}
          alt={box.name}
          className="w-full h-48 object-cover"
        />
        <div className="absolute top-0 left-0 p-2">
          <Badge className=" hover:bg-purple-600">
            <Package className="h-3 w-3 mr-1" />
            Package
          </Badge>
        </div>
        <div className="absolute top-0 right-0 p-2">{getStatusBadge()}</div>
      </div>
      <CardContent className="flex-grow pt-6">
        <h3 className="font-semibold text-lg mb-1">{box?.name}</h3>
        <div className="flex items-center gap-1 mb-4">
          <MapPin className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {box?.city}, {box?.country}
          </span>
        </div>

        {checkInDate && checkOutDate && (
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="border rounded-md p-2">
              <div className="text-xs text-muted-foreground mb-1">Check-in</div>
              <div className="font-medium">{checkInDate}</div>
            </div>
            <div className="border rounded-md p-2">
              <div className="text-xs text-muted-foreground mb-1">Check-out</div>
              <div className="font-medium">{checkOutDate}</div>
            </div>
          </div>
        )}

        <div className="flex justify-between items-center mb-2">
          <div className="text-sm">
            <span className="font-medium">Total:</span> {booking.total_price} {booking.currency}
          </div>
          <div className="text-sm">
            <span className="font-medium">Payment:</span> {booking.payment_status}
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between pt-0 pb-4">
        <Button asChild variant="outline">
          <Link href={`/bookings/${booking.id}`}>View Details</Link>
        </Button>
        {booking.status !== "Cancelled" && (
          <Button variant="destructive" onClick={onCancel} disabled={booking.status === "Cancelled"}>
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}