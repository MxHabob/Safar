"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useDispatch, useSelector } from "react-redux"
import type { RootState } from "@/redux/store"
import { closeModal } from "@/redux/features/ui/modal-slice"
import { Modal } from "@/components/global/modal"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { format, parseISO } from "date-fns"
import { Loader2, Plane, Calendar, Users, CheckCircle, AlertCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useCreateFlightMutation, useConfirmBookingMutation } from "@/redux/services/api"
import { toastPromise } from "@/lib/toast-promise"

export default function BookingConfirmationModal() {
  const router = useRouter()
  const dispatch = useDispatch()
  const { isOpen, type, data } = useSelector((state: RootState) => state.modal)
  const [createFlight] = useCreateFlightMutation()
  const [confirmBooking] = useConfirmBookingMutation()
  const [isLoading, setIsLoading] = useState(false)
  const [bookingStep, setBookingStep] = useState<"details" | "payment" | "confirmation" | "error">("details")
  const [bookingId, setBookingId] = useState<string | null>(null)

  const isModalOpen = isOpen && type === "BookingConfirmationOrCancellation"
  const flight = data.Flight || null
  const searchParams = data.searchParams || {}

  // Get total passenger count
  const totalPassengers =
    (searchParams.adults ? Number.parseInt(searchParams.adults) : 1) +
    (searchParams.children ? Number.parseInt(searchParams.children) : 0) +
    (searchParams.infants ? Number.parseInt(searchParams.infants) : 0)

  const onClose = () => {
    dispatch(closeModal())
    setBookingStep("details")
    setBookingId(null)
  }

  const handleConfirmBooking = async () => {
    if (!flight) return

    setIsLoading(true)
    setBookingStep("payment")

    try {
      // First create the flight in your database
      const flightResult = await toastPromise(
        createFlight({
          airline: flight.airline,
          flight_number: flight.flight_number,
          departure_airport: flight.departure_airport,
          arrival_airport: flight.arrival_airport,
          departure_time: flight.departure_time,
          arrival_time: flight.arrival_time,
          price: flight.price,
          currency: flight.currency,
          duration: flight.duration,
        }).unwrap(),
        {
          loading: "Creating flight record...",
          success: "Flight record created!",
          error: (error) => `Failed to create flight: ${error.data?.message || "Unknown error"}`,
        },
      )

      // Then create the booking with the flight ID
      const bookingResult = await toastPromise(
        confirmBooking({
          flight: flightResult.id,
          passengers: totalPassengers,
          status: "confirmed",
          total_price: flight.price * totalPassengers,
          currency: flight.currency,
          // Add any other required booking fields
        }).unwrap(),
        {
          loading: "Confirming your booking...",
          success: "Booking confirmed!",
          error: (error) => `Failed to confirm booking: ${error.data?.message || "Unknown error"}`,
        },
      )

      // Store the booking ID for reference
      setBookingId(bookingResult.id)
      setBookingStep("confirmation")
    } catch (error) {
      console.error("Error creating booking:", error)
      setBookingStep("error")
    } finally {
      setIsLoading(false)
    }
  }

  const handleViewBooking = () => {
    onClose()
    router.push(`/bookings/${bookingId}`)
  }

  const handleTryAgain = () => {
    setBookingStep("details")
  }

  if (!isModalOpen || !flight) return null

  return (
    <Modal
      title={bookingStep === "confirmation" ? "Booking Confirmed" : "Confirm Your Booking"}
      description={
        bookingStep === "confirmation"
          ? `Booking reference: ${bookingId}`
          : bookingStep === "error"
            ? "There was an error with your booking"
            : "Please review your flight details before confirming"
      }
      isOpen={isModalOpen}
      onClose={onClose}
      className="sm:max-w-md"
    >
      {bookingStep === "details" && (
        <div className="space-y-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                  <Plane className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-medium">{flight.airline}</h3>
                  <p className="text-sm text-muted-foreground">Flight {flight.flight_number}</p>
                </div>
              </div>

              <Separator className="my-4" />

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{format(parseISO(flight.departure_time), "HH:mm")}</p>
                    <p className="text-sm text-muted-foreground">
                      {format(parseISO(flight.departure_time), "EEE, MMM d")}
                    </p>
                    <p className="text-sm">{flight.departure_airport}</p>
                  </div>

                  <div className="flex flex-col items-center px-4">
                    <p className="text-xs text-muted-foreground">{flight.duration}</p>
                    <div className="relative w-16">
                      <Separator className="my-2" />
                      <Plane className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rotate-90 text-muted-foreground" />
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="font-medium">{format(parseISO(flight.arrival_time), "HH:mm")}</p>
                    <p className="text-sm text-muted-foreground">
                      {format(parseISO(flight.arrival_time), "EEE, MMM d")}
                    </p>
                    <p className="text-sm">{flight.arrival_airport}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-3 rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span>Passengers</span>
              </div>
              <span>{totalPassengers}</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>Travel Class</span>
              </div>
              <Badge variant="outline">{searchParams.travelClass || "ECONOMY"}</Badge>
            </div>

            <Separator />

            <div className="flex items-center justify-between font-medium">
              <span>Total Price</span>
              <span className="text-lg">
                {(flight.price * totalPassengers).toFixed(2)} {flight.currency}
              </span>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleConfirmBooking}>Confirm Booking</Button>
          </div>
        </div>
      )}

      {bookingStep === "payment" && (
        <div className="flex flex-col items-center justify-center py-8">
          <Loader2 className="mb-4 h-8 w-8 animate-spin text-primary" />
          <h3 className="text-lg font-medium">Processing Your Booking</h3>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            Please wait while we confirm your flight booking...
          </p>
        </div>
      )}

      {bookingStep === "confirmation" && (
        <div className="flex flex-col items-center justify-center py-6">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <CheckCircle className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-lg font-medium">Booking Confirmed!</h3>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            Your flight has been booked successfully. You can view your booking details in your account.
          </p>
          <div className="mt-6 flex gap-3">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button onClick={handleViewBooking}>View Booking</Button>
          </div>
        </div>
      )}

      {bookingStep === "error" && (
        <div className="flex flex-col items-center justify-center py-6">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
            <AlertCircle className="h-8 w-8 text-destructive" />
          </div>
          <h3 className="text-lg font-medium">Booking Failed</h3>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            There was an error processing your booking. Please try again or contact customer support.
          </p>
          <div className="mt-6 flex gap-3">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleTryAgain}>Try Again</Button>
          </div>
        </div>
      )}
    </Modal>
  )
}
