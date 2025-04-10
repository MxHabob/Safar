"use client"

import { useDispatch, useSelector } from "react-redux"
import type { RootState } from "@/redux/store"
import { closeModal, openModal } from "@/redux/features/ui/modal-slice"
import { Modal } from "@/components/global/modal"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CalendarDays, Clock, DollarSign, MapPin, User } from "lucide-react"
import { formatDate } from "@/lib/utils/date-formatter"
import { formatCurrency } from "@/lib/utils"

export default function BookingDetailsModal() {
  const dispatch = useDispatch()
  const { isOpen, type, data } = useSelector((state: RootState) => state.modal)

  const isModalOpen = isOpen && type === "BookingDetails"
  const booking = data.Booking

  if (!booking) return null

  const onClose = () => {
    dispatch(closeModal())
  }

  const handleModify = () => {
    dispatch(closeModal())
    dispatch(openModal({ type: "BookingModification", data: { Booking: booking } }))
  }

  const handleCancel = () => {
    dispatch(closeModal())
    dispatch(
      openModal({
        type: "BookingConfirmationOrCancellation",
        data: { Booking: booking },
      }),
    )
  }

  return (
    <Modal title="Booking Details" isOpen={isModalOpen} onClose={onClose} className="sm:max-w-xl">
      <div className="space-y-6 py-4">
        <div className="flex justify-between">
          <h3 className="text-lg font-medium">
            {booking.place?.name || booking.experience?.title || booking.flight?.flight_number || "Booking"}
          </h3>
          <Badge
            className={
              booking.status === "Confirmed"
                ? "bg-green-500"
                : booking.status === "Cancelled"
                  ? "bg-red-500"
                  : "bg-amber-500"
            }
          >
            {booking.status}
          </Badge>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex items-start gap-2">
            <CalendarDays className="mt-0.5 h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Check-in</p>
              <p className="text-sm text-muted-foreground">{booking.check_in ? formatDate(booking.check_in) : "N/A"}</p>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <CalendarDays className="mt-0.5 h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Check-out</p>
              <p className="text-sm text-muted-foreground">
                {booking.check_out ? formatDate(booking.check_out) : "N/A"}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <MapPin className="mt-0.5 h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Location</p>
              <p className="text-sm text-muted-foreground">
                {booking.place?.location || booking.experience?.location || "N/A"}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <Clock className="mt-0.5 h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Booking Date</p>
              <p className="text-sm text-muted-foreground">{formatDate(booking.booking_date)}</p>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <User className="mt-0.5 h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Guest</p>
              <p className="text-sm text-muted-foreground">
                {booking.user?.first_name} {booking.user?.last_name}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <DollarSign className="mt-0.5 h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Total Price</p>
              <p className="text-sm text-muted-foreground">{formatCurrency(booking.total_price, booking.currency)}</p>
            </div>
          </div>
        </div>

        <div className="rounded-md bg-muted p-4">
          <p className="text-sm font-medium">Payment Status</p>
          <p className="text-sm text-muted-foreground">{booking.payment_status}</p>
        </div>

        {booking.status !== "Cancelled" && (
          <div className="flex justify-end space-x-2 pt-2">
            <Button variant="outline" onClick={handleModify}>
              Modify
            </Button>
            <Button variant="destructive" onClick={handleCancel}>
              Cancel Booking
            </Button>
          </div>
        )}
      </div>
    </Modal>
  )
}
