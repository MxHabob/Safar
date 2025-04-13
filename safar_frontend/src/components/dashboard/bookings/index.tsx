"use client"

import { useState } from "react"
import Link from "next/link"
import {
  ArrowDownAZ,
  ArrowUpAZ,
  Calendar,
  Filter,
  Search,
  SlidersHorizontal,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import type { Booking } from "@/redux/types/types"
import { useCancelBookingMutation, useGetBookingsQuery, useGetUpcomingBookingsQuery } from "@/redux/services/api"
import { BookingCard } from "./booking-card"

type BookingType = "All" | "Place" | "Experience" | "Flight" | "Box"
type BookingStatus = "All" | "Pending" | "Confirmed" | "Cancelled"
type SortOption = "newest" | "oldest" | "price-high" | "price-low" | "date-near" | "date-far"

export default function BookingsPageContent() {
  const [searchQuery, setSearchQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState<BookingType>("All")
  const [statusFilter, setStatusFilter] = useState<BookingStatus>("All")
  const [sortOption, setSortOption] = useState<SortOption>("newest")
  const [showUpcoming, setShowUpcoming] = useState(true)

  // Fetch bookings data
  const { data: upcomingBookings } = useGetUpcomingBookingsQuery({})
  const { data: allBookings } = useGetBookingsQuery({})
  const [cancelBooking] = useCancelBookingMutation()

  const bookings = showUpcoming ? upcomingBookings?.results || [] : allBookings?.results || []

  const handleCancelBooking = async (id: string) => {
    try {
      await cancelBooking(id).unwrap()
    } catch (error) {
      console.error("Failed to cancel booking:", error)
    }
  }

  console.log("Bookings:", bookings)

  const getBookingType = (booking: Booking): BookingType => {
    if (booking.place) return "Place"
    if (booking.experience) return "Experience"
    if (booking.flight) return "Flight"
    if (booking.box) return "Box"
    return "All"
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
        <div className="flex gap-2">
          <Button
            variant={showUpcoming ? "default" : "outline"}
            onClick={() => setShowUpcoming(true)}
          >
            Upcoming
          </Button>
          <Button
            variant={!showUpcoming ? "default" : "outline"}
            onClick={() => setShowUpcoming(false)}
          >
            All Bookings
          </Button>
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
            <BookingCard 
              key={booking.id} 
              booking={booking} 
              onCancel={() => handleCancelBooking(booking.id)} 
            />
          ))}
        </div>
      )}
    </div>
  )
}