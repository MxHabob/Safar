"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useModal } from "@/lib/stores/modal-store"
import { LogOut } from "lucide-react"

export function SignOutConfirmModal() {
  const { isOpen, type, data, onClose } = useModal()
  const isActive = isOpen && type === "signOutConfirm"

  const handleConfirm = async () => {
    await data.onConfirm?.()
    onClose()
  }

  return (
    <Dialog open={isActive} onOpenChange={(open) => (!open ? onClose() : undefined)} key={isActive ? "open" : "closed"}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <LogOut className="h-4 w-4" />
            </div>
            <DialogTitle className="text-lg">Sign out</DialogTitle>
          </div>
          <DialogDescription className="text-sm text-zinc-400">
            Are you sure you want to sign out of this session?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="pt-2">
          <Button variant="outline" onClick={onClose} className="rounded-xl h-9 px-4 text-sm">Cancel</Button>
          <Button onClick={handleConfirm} className="rounded-xl h-9 px-4 text-sm">Sign out</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
