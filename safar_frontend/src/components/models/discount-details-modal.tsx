"use client"

import { useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import type { RootState } from "@/redux/store"
import { closeModal } from "@/redux/features/ui/modal-slice"
import { Modal } from "@/components/global/modal"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { useApplyDiscountMutation } from "@/redux/services/api"
import { CalendarDays, Copy, Loader2, Percent, Tag } from "lucide-react"
import { toastPromise } from "@/lib/toast-promise"
import { formatDate } from "@/lib/utils/date-formatter"

export default function DiscountDetailsModal() {
  const dispatch = useDispatch()
  const { isOpen, type, data } = useSelector((state: RootState) => state.modal)
  const [applyDiscount] = useApplyDiscountMutation()
  const [isLoading, setIsLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  const isModalOpen = isOpen && type === "DiscountDetails"
  const booking = data.Booking

  // Mock discount data - replace with actual data from your store
  const discount = {
    id: "disc_123",
    code: "SUMMER25",
    discount_type: "Percentage",
    amount: 25,
    valid_from: new Date(Date.now() - 7 * 86400000).toISOString(), // 7 days ago
    valid_to: new Date(Date.now() + 30 * 86400000).toISOString(), // 30 days from now
    is_active: true,
  }

  const onClose = () => {
    dispatch(closeModal())
  }

  const handleCopyCode = () => {
    navigator.clipboard.writeText(discount.code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleApplyDiscount = async () => {
    if (!booking?.id || !discount.id) return

    setIsLoading(true)

    try {
      await toastPromise(applyDiscount({ id: discount.id, booking_id: booking.id }).unwrap(), {
        loading: "Applying discount...",
        success: "Discount applied successfully!",
        error: (error) => `Failed to apply discount: ${error.data?.message || "Unknown error"}`,
      })
      onClose()
    } catch (error) {
      console.error("Error applying discount:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Modal title="Discount Details" isOpen={isModalOpen} onClose={onClose}>
      <div className="space-y-4 py-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Tag className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-medium">{discount.code}</h3>
              </div>
              <Button variant="outline" size="icon" onClick={handleCopyCode}>
                {copied ? <span className="text-xs">Copied!</span> : <Copy className="h-4 w-4" />}
              </Button>
            </div>

            <div className="mt-4 grid gap-3">
              <div className="flex items-center gap-2">
                <Percent className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  {discount.discount_type === "Percentage" ? `${discount.amount}% off` : `$${discount.amount} off`}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  Valid from {formatDate(new Date(discount.valid_from))} to {formatDate(new Date(discount.valid_to))}
                </span>
              </div>
            </div>

            <Badge className="mt-4" variant={discount.is_active ? "default" : "outline"}>
              {discount.is_active ? "Active" : "Expired"}
            </Badge>
          </CardContent>
        </Card>

        {booking && discount.is_active && (
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleApplyDiscount} disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Apply to Booking
            </Button>
          </div>
        )}
      </div>
    </Modal>
  )
}
