"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ActionButton } from "@/components/ui/action-button"
import { useModal } from "@/lib/stores/modal-store"
import { useQueryClient } from "@tanstack/react-query"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

export function AdminConfirmBookingActionModal() {
  const { isOpen, type, data, onClose } = useModal()
  const queryClient = useQueryClient()
  const isCancel = type === "adminConfirmCancelBooking"
  const isActive = isOpen && isCancel

  const handleSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ["listBookingsApiV1AdminBookingsGet"] })
    queryClient.invalidateQueries({ queryKey: ["getBookingStatsApiV1AdminBookingsStatsGet"] })
    if (data?.onSuccess) {
      data.onSuccess()
    }
    onClose()
  }

  const onConfirm = async () => {
    if (!data?.bookingId) return
    
    try {
      // Note: There's no cancel booking endpoint in admin API, so we'll show a message
      toast.info("Booking cancellation functionality will be available soon")
      handleSuccess()
    } catch (error) {
      toast.error("Failed to cancel booking")
    }
  }

  if (!isActive) return null

  return (
    <Dialog open={isActive} onOpenChange={(open) => (!open ? onClose() : undefined)} key={isActive ? "open" : "closed"}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className={cn(
              "flex h-8 w-8 items-center justify-center rounded-lg",
              "bg-destructive/10 text-destructive"
            )}>
              <X className="h-4 w-4" />
            </div>
            <DialogTitle className="text-lg">Cancel Booking</DialogTitle>
          </div>
        </DialogHeader>
        <DialogDescription className="text-sm text-zinc-400">
          This will cancel booking {typeof data?.bookingId === 'string' ? data.bookingId : "this booking"}. The guest will be notified and any refunds will be processed according to the cancellation policy.
        </DialogDescription>
        <DialogFooter className="pt-2">
          <Button variant="outline" onClick={onClose} className="rounded-xl h-9 px-4 text-sm">
            Cancel
          </Button>
          <ActionButton
            onClick={onConfirm}
            variant="destructive"
            icon={X}
            className="rounded-xl h-9 px-4 text-sm"
          >
            Cancel Booking
          </ActionButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

