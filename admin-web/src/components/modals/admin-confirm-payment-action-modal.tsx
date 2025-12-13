"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ActionButton } from "@/components/ui/action-button"
import { useModal } from "@/lib/stores/modal-store"
import { useQueryClient } from "@tanstack/react-query"
import { RotateCcw } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

export function AdminConfirmPaymentActionModal() {
  const { isOpen, type, data, onClose } = useModal()
  const queryClient = useQueryClient()
  const isRefund = type === "adminConfirmRefundPayment"
  const isActive = isOpen && isRefund

  const handleSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ["listPaymentsApiV1AdminPaymentsGet"] })
    queryClient.invalidateQueries({ queryKey: ["getPaymentStatsApiV1AdminPaymentsStatsGet"] })
    if (data?.onSuccess) {
      data.onSuccess()
    }
    onClose()
  }

  const onConfirm = async () => {
    if (!data?.paymentId) return
    
    try {
      // Note: There's no refund payment endpoint in admin API, so we'll show a message
      toast.info("Payment refund functionality will be available soon")
      handleSuccess()
    } catch (error) {
      toast.error("Failed to process refund")
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
              "bg-primary/10 text-primary"
            )}>
              <RotateCcw className="h-4 w-4" />
            </div>
            <DialogTitle className="text-lg">Refund Payment</DialogTitle>
          </div>
        </DialogHeader>
        <DialogDescription className="text-sm text-zinc-400">
          This will refund payment {typeof data?.paymentId === 'string' ? data.paymentId : "this payment"}. The amount of ${typeof data?.amount === 'number' ? data.amount.toLocaleString() : "0.00"} will be returned to the customer. This action cannot be undone.
        </DialogDescription>
        <DialogFooter className="pt-2">
          <Button variant="outline" onClick={onClose} className="rounded-xl h-9 px-4 text-sm">
            Cancel
          </Button>
          <ActionButton
            onClick={onConfirm}
            variant="default"
            icon={RotateCcw}
            className="rounded-xl h-9 px-4 text-sm"
          >
            Process Refund
          </ActionButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

