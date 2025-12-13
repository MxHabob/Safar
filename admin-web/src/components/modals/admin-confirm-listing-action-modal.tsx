"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ActionButton } from "@/components/ui/action-button"
import { useModal } from "@/lib/stores/modal-store"
import { useQueryClient } from "@tanstack/react-query"
import { Trash2, Ban } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

export function AdminConfirmListingActionModal() {
  const { isOpen, type, data, onClose } = useModal()
  const queryClient = useQueryClient()
  const isDelete = type === "adminConfirmDeleteListing"
  const isActive = isOpen && isDelete

  const handleSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ["listListingsApiV1AdminListingsGet"] })
    queryClient.invalidateQueries({ queryKey: ["getListingStatsApiV1AdminListingsStatsGet"] })
    if (data?.onSuccess) {
      data.onSuccess()
    }
    onClose()
  }

  const onConfirm = async () => {
    if (!data?.listingId) return
    
    try {
      // Note: There's no delete listing endpoint in admin API, so we'll show a message
      toast.info("Listing deletion functionality will be available soon")
      handleSuccess()
    } catch (error) {
      toast.error("Failed to delete listing")
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
              <Trash2 className="h-4 w-4" />
            </div>
            <DialogTitle className="text-lg">Delete Listing</DialogTitle>
          </div>
        </DialogHeader>
        <DialogDescription className="text-sm text-zinc-400">
          This will permanently delete {typeof data?.listingTitle === 'string' ? data.listingTitle : "this listing"}. This action cannot be undone.
        </DialogDescription>
        <DialogFooter className="pt-2">
          <Button variant="outline" onClick={onClose} className="rounded-xl h-9 px-4 text-sm">
            Cancel
          </Button>
          <ActionButton
            onClick={onConfirm}
            variant="destructive"
            icon={Trash2}
            className="rounded-xl h-9 px-4 text-sm"
          >
            Delete
          </ActionButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

