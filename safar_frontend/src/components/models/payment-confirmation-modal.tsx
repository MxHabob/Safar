"use client"

import { useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import type { RootState } from "@/core/store"
import { Button } from "@/components/ui/button"

import { CreditCard, Loader2 } from "lucide-react"
import { useMarkPaymentAsPaidMutation } from "@/core/services/api"
import { closeModal, openModal } from "@/core/features/ui/modal-slice"
import { Modal } from "../global/modal"
import { toastPromise } from "@/lib/toast-promise"
import { formatCurrency } from "@/lib/utils"

export default function PaymentConfirmationModal() {
  const dispatch = useDispatch()
  const { isOpen, type, data } = useSelector((state: RootState) => state.modal)
  const [markPaymentAsPaid] = useMarkPaymentAsPaidMutation()
  const [isLoading, setIsLoading] = useState(false)

  const isModalOpen = isOpen && type === "PaymentConfirmation"
  const booking = data.Booking

  const onClose = () => {
    dispatch(closeModal())
  }

  const handleConfirmPayment = async () => {
    if (!booking?.id) return

    setIsLoading(true)

    try {
      await toastPromise(markPaymentAsPaid(booking.id).unwrap(), {
        loading: "Processing payment...",
        success: "Payment confirmed successfully!",
        error: (error) => `Failed to confirm payment: ${error.data?.message || "Unknown error"}`,
      })

      dispatch(closeModal())
      dispatch(
        openModal({
          type: "SuccessOrFailure",
          data: {
            Booking: booking,
            success: true,
            message: "Payment confirmed successfully!",
          },
        }),
      )
    } catch (error) {
      console.error("Error confirming payment:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Modal title="Confirm Payment" isOpen={isModalOpen} onClose={onClose}>
      <div className="flex flex-col items-center justify-center space-y-4 py-4">
        <div className="rounded-full bg-green-50 p-3">
          <CreditCard className="h-6 w-6 text-green-600" />
        </div>

        <div className="text-center">
          <h3 className="text-lg font-medium">
            Confirm Payment of {booking && formatCurrency(booking.total_price, booking?.currency)}
          </h3>
          <p className="text-sm text-muted-foreground">This will mark the payment as completed for this booking.</p>
        </div>

        <div className="flex w-full justify-end space-x-2 pt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleConfirmPayment} disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirm Payment
          </Button>
        </div>
      </div>
    </Modal>
  )
}
