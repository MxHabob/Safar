"use client"

import { useMemo } from "react"
import { useSelector } from "react-redux"
import type { RootState } from "@/redux/store"
import type { Booking } from "@/redux/types"

export function useRealtimeBookings() {
  const bookings = useSelector((state: RootState) => state.realtime.bookings)

  // Convert bookings object to array and sort by date
  const bookingsList = useMemo(() => {
    return Object.values(bookings).sort(
      (a, b) => new Date(b.booking_date).getTime() - new Date(a.booking_date).getTime(),
    )
  }, [bookings])

  // Group bookings by status
  const bookingsByStatus = useMemo(() => {
    const pending: Booking[] = []
    const confirmed: Booking[] = []
    const cancelled: Booking[] = []

    bookingsList.forEach((booking) => {
      switch (booking.status) {
        case "Pending":
          pending.push(booking)
          break
        case "Confirmed":
          confirmed.push(booking)
          break
        case "Cancelled":
          cancelled.push(booking)
          break
      }
    })

    return { pending, confirmed, cancelled }
  }, [bookingsList])

  // Get upcoming bookings (confirmed and in the future)
  const upcomingBookings = useMemo(() => {
    const now = new Date()

    return bookingsList.filter((booking) => {
      if (booking.status !== "Confirmed") return false

      // For place bookings, check check_in date
      if (booking.place && booking.check_in) {
        return new Date(booking.check_in) > now
      }

      // For experience bookings, we would need to check the experience date
      // This would depend on your data structure

      return false
    })
  }, [bookingsList])

  return {
    bookings: bookingsList,
    bookingsByStatus,
    upcomingBookings,
  }
}
