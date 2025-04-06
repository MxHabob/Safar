"use client"

import { useState } from "react"
import Link from "next/link"
import {
  ArrowDownAZ,
  ArrowUpAZ,
  Calendar,
  Clock,
  Filter,
  MapPin,
  Package,
  Plane,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import type { Booking, Place, Experience, Flight, Box } from "@/types"

// Sample data - replace with your actual data fetching logic
const SAMPLE_BOOKINGS: Booking[] = [
  {
    id: "1",
    created_at: "2023-04-15T10:30:00Z",
    updated_at: "2023-04-15T10:30:00Z",
    is_deleted: false,
    user: {
      id: "user1",
      email: "user@example.com",
      is_active: true,
      created_at: "2022-01-01T00:00:00Z",
      updated_at: "2022-01-01T00:00:00Z",
      is_deleted: false,
    },
    place: {
      id: "place1",
      created_at: "2022-12-01T00:00:00Z",
      updated_at: "2022-12-01T00:00:00Z",
      is_deleted: false,
      category: {
        id: "cat1",
        name: "Beach Resort",
        created_at: "2022-01-01T00:00:00Z",
        updated_at: "2022-01-01T00:00:00Z",
        is_deleted: false,
      },
      owner: {
        id: "owner1",
        email: "owner@example.com",
        is_active: true,
        created_at: "2022-01-01T00:00:00Z",
        updated_at: "2022-01-01T00:00:00Z",
        is_deleted: false,
      },
      name: "Sunset Beach Resort",
      description: "A beautiful beachfront resort with stunning sunset views",
      location: "Maldives",
      country: "Maldives",
      city: "Male",
      rating: 4.8,
      images: [
        {
          id: "img1",
          url: "/placeholder.svg?height=300&width=500",
          file: "beach.jpg",
          created_at: "2022-01-01T00:00:00Z",
          updated_at: "2022-01-01T00:00:00Z",
          is_deleted: false,
        },
      ],
      is_available: true,
      price: 350,
      currency: "USD",
    },
    check_in: "2023-05-10T15:00:00Z",
    check_out: "2023-05-15T11:00:00Z",
    booking_date: "2023-04-15T10:30:00Z",
    status: "Confirmed",
    total_price: 1750,
    currency: "USD",
    payment_status: "Paid",
  },
  {
    id: "2",
    created_at: "2023-04-14T15:45:00Z",
    updated_at: "2023-04-14T15:45:00Z",
    is_deleted: false,
    user: {
      id: "user1",
      email: "user@example.com",
      is_active: true,
      created_at: "2022-01-01T00:00:00Z",
      updated_at: "2022-01-01T00:00:00Z",
      is_deleted: false,
    },
    experience: {
      id: "exp1",
      created_at: "2022-11-01T00:00:00Z",
      updated_at: "2022-11-01T00:00:00Z",
      is_deleted: false,
      owner: {
        id: "owner2",
        email: "guide@example.com",
        is_active: true,
        created_at: "2022-01-01T00:00:00Z",
        updated_at: "2022-01-01T00:00:00Z",
        is_deleted: false,
      },
      title: "Guided Mountain Trek",
      description: "Experience the thrill of mountain trekking with expert guides",
      location: "Swiss Alps",
      price_per_person: 120,
      currency: "CHF",
      duration: 6,
      capacity: 10,
      schedule: [],
      images: [
        {
          id: "img2",
          url: "/placeholder.svg?height=300&width=500",
          file: "trek.jpg",
          created_at: "2022-01-01T00:00:00Z",
          updated_at: "2022-01-01T00:00:00Z",
          is_deleted: false,
        },
      ],
      rating: 4.9,
      is_available: true,
    },
    booking_date: "2023-04-14T15:45:00Z",
    status: "Pending",
    total_price: 240,
    currency: "CHF",
    payment_status: "Pending",
  },
  {
    id: "3",
    created_at: "2023-04-13T09:20:00Z",
    updated_at: "2023-04-13T09:20:00Z",
    is_deleted: false,
    user: {
      id: "user1",
      email: "user@example.com",
      is_active: true,
      created_at: "2022-01-01T00:00:00Z",
      updated_at: "2022-01-01T00:00:00Z",
      is_deleted: false,
    },
    flight: {
      id: "flight1",
      created_at: "2022-10-01T00:00:00Z",
      updated_at: "2022-10-01T00:00:00Z",
      is_deleted: false,
      airline: "SkyWings",
      flight_number: "SW123",
      departure_airport: "JFK",
      arrival_airport: "LAX",
      airline_url: "https://example.com",
      arrival_city: "Los Angeles",
      departure_time: "2023-06-15T08:00:00Z",
      arrival_time: "2023-06-15T11:30:00Z",
      price: 299,
      currency: "USD",
      duration: 5.5,
      baggage_policy: {},
    },
    booking_date: "2023-04-13T09:20:00Z",
    status: "Confirmed",
    total_price: 299,
    currency: "USD",
    payment_status: "Paid",
  },
  {
    id: "4",
    created_at: "2023-04-12T14:10:00Z",
    updated_at: "2023-04-12T14:10:00Z",
    is_deleted: false,
    user: {
      id: "user1",
      email: "user@example.com",
      is_active: true,
      created_at: "2022-01-01T00:00:00Z",
      updated_at: "2022-01-01T00:00:00Z",
      is_deleted: false,
    },
    box: {
      id: "box1",
      created_at: "2022-09-01T00:00:00Z",
      updated_at: "2022-09-01T00:00:00Z",
      is_deleted: false,
      name: "Paris Weekend Getaway",
      description: "A complete weekend package in the city of love",
      total_price: 899,
      currency: "EUR",
      country: "France",
      city: "Paris",
      contents: [],
      images: [
        {
          id: "img3",
          url: "/placeholder.svg?height=300&width=500",
          file: "paris.jpg",
          created_at: "2022-01-01T00:00:00Z",
          updated_at: "2022-01-01T00:00:00Z",
          is_deleted: false,
        },
      ],
    },
    check_in: "2023-07-21T15:00:00Z",
    check_out: "2023-07-23T11:00:00Z",
    booking_date: "2023-04-12T14:10:00Z",
    status: "Confirmed",
    total_price: 899,
    currency: "EUR",
    payment_status: "Paid",
  },
  {
    id: "5",
    created_at: "2023-04-11T11:05:00Z",
    updated_at: "2023-04-11T11:05:00Z",
    is_deleted: false,
    user: {
      id: "user1",
      email: "user@example.com",
      is_active: true,
      created_at: "2022-01-01T00:00:00Z",
      updated_at: "2022-01-01T00:00:00Z",
      is_deleted: false,
    },
    place: {
      id: "place2",
      created_at: "2022-08-01T00:00:00Z",
      updated_at: "2022-08-01T00:00:00Z",
      is_deleted: false,
      category: {
        id: "cat2",
        name: "Mountain Cabin",
        created_at: "2022-01-01T00:00:00Z",
        updated_at: "2022-01-01T00:00:00Z",
        is_deleted: false,
      },
      owner: {
        id: "owner3",
        email: "cabin@example.com",
        is_active: true,
        created_at: "2022-01-01T00:00:00Z",
        updated_at: "2022-01-01T00:00:00Z",
        is_deleted: false,
      },
      name: "Alpine Retreat Cabin",
      description: "Cozy cabin nestled in the mountains with breathtaking views",
      location: "Colorado",
      country: "USA",
      city: "Aspen",
      rating: 4.7,
      images: [
        {
          id: "img4",
          url: "/placeholder.svg?height=300&width=500",
          file: "cabin.jpg",
          created_at: "2022-01-01T00:00:00Z",
          updated_at: "2022-01-01T00:00:00Z",
          is_deleted: false,
        },
      ],
      is_available: true,
      price: 220,
      currency: "USD",
    },
    check_in: "2023-08-05T15:00:00Z",
    check_out: "2023-08-12T11:00:00Z",
    booking_date: "2023-04-11T11:05:00Z",
    status: "Cancelled",
    total_price: 1540,
    currency: "USD",
    payment_status: "Refunded",
  },
]

type BookingType = "All" | "Place" | "Experience" | "Flight" | "Box"
type BookingStatus = "All" | "Pending" | "Confirmed" | "Cancelled"
type SortOption = "newest" | "oldest" | "price-high" | "price-low" | "date-near" | "date-far"

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>(SAMPLE_BOOKINGS)
  const [searchQuery, setSearchQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState<BookingType>("All")
  const [statusFilter, setStatusFilter] = useState<BookingStatus>("All")
  const [sortOption, setSortOption] = useState<SortOption>("newest")

  const cancelBooking = (id: string) => {
    setBookings(bookings.map((booking) => (booking.id === id ? { ...booking, status: "Cancelled" } : booking)))
  }

  const getBookingType = (booking: Booking): BookingType => {
    if (booking.place) return "Place"
    if (booking.experience) return "Experience"
    if (booking.flight) return "Flight"
    if (booking.box) return "Box"
    return "All" // Fallback
  }

  const filteredBookings = bookings
    .filter((booking) => {
      // Apply search filter
      const bookingName =
        booking.place?.name || booking.experience?.title || booking.flight?.flight_number || booking.box?.name || ""

      if (searchQuery && !bookingName.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false
      }

      // Apply type filter
      if (typeFilter !== "All" && getBookingType(booking) !== typeFilter) {
        return false
      }

      // Apply status filter
      if (statusFilter !== "All" && booking.status !== statusFilter) {
        return false
      }

      return true
    })
    .sort((a, b) => {
      // Apply sorting
      switch (sortOption) {
        case "newest":
          return new Date(b.booking_date).getTime() - new Date(a.booking_date).getTime()
        case "oldest":
          return new Date(a.booking_date).getTime() - new Date(b.booking_date).getTime()
        case "price-high":
          return b.total_price - a.total_price
        case "price-low":
          return a.total_price - b.total_price
        case "date-near":
          const aDate = a.check_in || a.flight?.departure_time || a.booking_date
          const bDate = b.check_in || b.flight?.departure_time || b.booking_date
          return new Date(aDate).getTime() - new Date(bDate).getTime()
        case "date-far":
          const aDate2 = a.check_in || a.flight?.departure_time || a.booking_date
          const bDate2 = b.check_in || b.flight?.departure_time || b.booking_date
          return new Date(bDate2).getTime() - new Date(aDate2).getTime()
        default:
          return 0
      }
    })

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold">My Bookings</h1>
          <p className="text-muted-foreground mt-1">Manage your trips, experiences, flights, and packages</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search bookings..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="flex-shrink-0">
                <Filter className="h-4 w-4 mr-2" />
                Type: {typeFilter}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuRadioGroup value={typeFilter} onValueChange={(value) => setTypeFilter(value as BookingType)}>
                <DropdownMenuRadioItem value="All">All</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="Place">Places</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="Experience">Experiences</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="Flight">Flights</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="Box">Packages</DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="flex-shrink-0">
                <Filter className="h-4 w-4 mr-2" />
                Status: {statusFilter}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuRadioGroup
                value={statusFilter}
                onValueChange={(value) => setStatusFilter(value as BookingStatus)}
              >
                <DropdownMenuRadioItem value="All">All</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="Pending">Pending</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="Confirmed">Confirmed</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="Cancelled">Cancelled</DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="flex-shrink-0">
                <SlidersHorizontal className="h-4 w-4 mr-2" />
                Sort
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuRadioGroup value={sortOption} onValueChange={(value) => setSortOption(value as SortOption)}>
                <DropdownMenuRadioItem value="newest">
                  <ArrowUpAZ className="h-4 w-4 mr-2" />
                  Newest first
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="oldest">
                  <ArrowDownAZ className="h-4 w-4 mr-2" />
                  Oldest first
                </DropdownMenuRadioItem>
                <DropdownMenuSeparator />
                <DropdownMenuRadioItem value="price-high">Price: High to low</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="price-low">Price: Low to high</DropdownMenuRadioItem>
                <DropdownMenuSeparator />
                <DropdownMenuRadioItem value="date-near">Date: Soonest first</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="date-far">Date: Latest first</DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {filteredBookings.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16">
          <Calendar className="h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-2xl font-semibold mb-2">No bookings found</h2>
          <p className="text-muted-foreground text-center max-w-md">
            {bookings.length === 0
              ? "You don't have any bookings yet. Start exploring and book your next adventure!"
              : "No bookings match your current filters. Try adjusting your search or filters."}
          </p>
          {bookings.length === 0 && (
            <Button asChild className="mt-6">
              <Link href="/explore">Explore Now</Link>
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBookings.map((booking) => (
            <BookingCard key={booking.id} booking={booking} onCancel={() => cancelBooking(booking.id)} />
          ))}
        </div>
      )}
    </div>
  )
}

interface BookingCardProps {
  booking: Booking
  onCancel: () => void
}

function BookingCard({ booking, onCancel }: BookingCardProps) {
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

function PlaceBookingCard({ booking, place, onCancel }: { booking: Booking; place: Place; onCancel: () => void }) {
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
        <img
          src={place.images && place.images[0] ? place.images[0].url : "/placeholder.svg?height=300&width=500"}
          alt={place.name}
          className="w-full h-48 object-cover"
        />
        <div className="absolute top-0 left-0 p-2">
          <Badge className="hover:bg-rose-600">
            <MapPin className="h-3 w-3 mr-1" />
            Place
          </Badge>
        </div>
        <div className="absolute top-0 right-0 p-2">{getStatusBadge()}</div>
      </div>
      <CardContent className="flex-grow pt-6">
        <h3 className="font-semibold text-lg mb-1">{place.name}</h3>
        <div className="flex items-center gap-1 mb-4">
          <MapPin className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {place.city}, {place.country}
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
          <Button variant="destructive" onClick={onCancel} disabled={booking.status === "Cancelled"}>
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
}: { booking: Booking; experience: Experience; onCancel: () => void }) {
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
            experience.images && experience.images[0]
              ? experience.images[0].url
              : "/placeholder.svg?height=300&width=500"
          }
          alt={experience.title}
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
        <h3 className="font-semibold text-lg mb-1">{experience.title}</h3>
        <div className="flex items-center gap-1 mb-4">
          <MapPin className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">{experience.location}</span>
        </div>

        <div className="flex items-center gap-4 mb-4">
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">{bookingDate}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">{experience.duration} hours</span>
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
          <Button variant="destructive" onClick={onCancel} disabled={booking.status === "Cancelled"}>
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}

function FlightBookingCard({ booking, flight, onCancel }: { booking: Booking; flight: Flight; onCancel: () => void }) {
  const departureDate = new Date(flight.departure_time).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })

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
            <span className="font-semibold">{flight.airline}</span>
          </div>
          <span className="text-sm text-muted-foreground">{flight.flight_number}</span>
        </div>
        <div className="flex items-center justify-between mb-2">
          <div className="text-center">
            <div className="text-xl font-bold">{flight.departure_airport}</div>
            <div className="text-sm text-muted-foreground">{departureTime}</div>
          </div>
          <div className="flex-1 mx-4 relative">
            <div className="border-t border-dashed border-sky-300 my-2"></div>
            <Plane className="absolute top-1/2 left-1/2 transform -translate-y-1/2 -translate-x-1/2 h-4 w-4 text-sky-500" />
          </div>
          <div className="text-center">
            <div className="text-xl font-bold">{flight.arrival_airport}</div>
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
            <span className="font-medium">Duration:</span> {flight.duration}h
          </div>
        </div>
        <div className="text-sm mb-3">
          <span className="font-medium">Destination:</span> {flight.arrival_city}
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
          <Button variant="destructive" onClick={onCancel} disabled={booking.status === "Cancelled"}>
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}

function BoxBookingCard({ booking, box, onCancel }: { booking: Booking; box: Box; onCancel: () => void }) {
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
          src={box.images && box.images[0] ? box.images[0].url : "/placeholder.svg?height=300&width=500"}
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
        <h3 className="font-semibold text-lg mb-1">{box.name}</h3>
        <div className="flex items-center gap-1 mb-4">
          <MapPin className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {box.city}, {box.country}
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

