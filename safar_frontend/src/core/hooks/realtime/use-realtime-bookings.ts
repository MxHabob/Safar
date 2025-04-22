"use client"

import { useMemo } from "react"
import { useSelector } from "react-redux"
import type { RootState } from "@/core/store"
import type { Booking } from "@/core/types"

export function useRealtimeBookings() {
  const bookings = useSelector((state: RootState) => state.realtime.bookings)

  const bookingsList = useMemo(() => {
    return Object.values(bookings).sort(
      (a, b) => new Date(b.booking_date).getTime() - new Date(a.booking_date).getTime(),
    )
  }, [bookings])

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

  const upcomingBookings = useMemo(() => {
    const now = new Date()

    return bookingsList.filter((booking) => {
      if (booking.status !== "Confirmed") return false

      if (booking.place && booking.check_in) {
        return new Date(booking.check_in) > now
      }

      return false
    })
  }, [bookingsList])

  return {
    bookings: bookingsList,
    bookingsByStatus,
    upcomingBookings,
  }
}
