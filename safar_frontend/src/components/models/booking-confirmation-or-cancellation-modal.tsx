"use client"

import { useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import { Button } from "@/components/ui/button"
import { AlertTriangle, CheckCircle, Loader2 } from 'lucide-react'
import { Modal } from "../global/modal"
import { toastPromise } from "@/lib/toast-promise"
import { closeModal, openModal } from "@/core/features/ui/modal-slice"
import { useConfirmBookingMutation, useCancelBookingMutation } from "@/core/services/api"
import { RootState } from "@reduxjs/toolkit/query"

export default function BookingConfirmationOrCancellationModal() {
  const dispatch = useDispatch()
  const { isOpen, type, data } = useSelector((state: RootState) => state.modal)
  const [confirmBooking] = useConfirmBookingMutation()
  const [cancelBooking] = useCancelBookingMutation()
  const [isLoading, setIsLoading] = useState(false)

  const isModalOpen = isOpen && type === "BookingConfirmationOrCancellation"
  const booking = data.Booking
  const isConfirmation = booking?.status === "Pending"

  const onClose = () => {
    dispatch(closeModal())
  }

  const handleAction = async () => {
    if (!booking?.id) return

    setIsLoading(true)

    try {
      if (isConfirmation) {
        await toastPromise(confirmBooking(booking.id).unwrap(), {
          loading: "Confirming booking...",
          success: "Booking confirmed successfully!",
          error: (error) => `Failed to confirm booking: ${error.data?.message || "Unknown error"}`,
        })
      } else {
        await toastPromise(cancelBooking(booking.id).unwrap(), {
          loading: "Cancelling booking...",
          success: "Booking cancelled successfully!",
          error: (error) => `Failed to cancel booking: ${error.data?.message || "Unknown error"}`,
        })
      }

      dispatch(closeModal())
      dispatch(
        openModal({
          type: "SuccessOrFailure",
          data: {
            Booking: booking,
            success: true,
            message: isConfirmation ? "Booking confirmed successfully!" : "Booking cancelled successfully!",
          },
        }),
      )
    } catch (error) {
      console.error("Error processing booking action:", error)
      dispatch(
        openModal({
          type: "SuccessOrFailure",
          data: {
            Booking: booking,
            success: false,
            message: `Failed to ${isConfirmation ? "confirm" : "cancel"} booking`,
          },
        }),
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Modal title={isConfirmation ? "Confirm Booking" : "Cancel Booking"} isOpen={isModalOpen} onClose={onClose}>
      <div className="flex flex-col items-center justify-center space-y-4 py-4">
        <div className={`rounded-full p-3 ${isConfirmation ? "bg-green-50" : "bg-red-50"}`}>
          {isConfirmation ? (
            <CheckCircle className="h-6 w-6 text-green-600" />
          ) : (
            <AlertTriangle className="h-6 w-6 text-red-600" />
          )}
        </div>

        <div className="text-center">
          <h3 className="text-lg font-medium">{isConfirmation ? "Confirm this booking?" : "Cancel this booking?"}</h3>
          <p className="text-sm text-muted-foreground">
            {isConfirmation
              ? "This will confirm the booking and notify the guest."
              : "This will cancel the booking and notify the guest. This action cannot be undone."}
          </p>
        </div>

        <div className="flex w-full justify-end space-x-2 pt-4">
          <Button variant="outline" onClick={onClose}>
            Back
          </Button>
          <Button variant={isConfirmation ? "default" : "destructive"} onClick={handleAction} disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isConfirmation ? "Confirm" : "Cancel Booking"}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

