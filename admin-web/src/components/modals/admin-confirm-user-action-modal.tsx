"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ActionButton } from "@/components/ui/action-button"
import { useModal } from "@/lib/stores/modal-store"
import { useActivateUserApiV1AdminUsersUserIdActivatePostMutation, useSuspendUserApiV1AdminUsersUserIdSuspendPostMutation } from "@/generated/hooks/admin"
import { useQueryClient } from "@tanstack/react-query"
import { Ban, Check, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"

export function AdminConfirmUserActionModal() {
  const { isOpen, type, data, onClose } = useModal()
  const queryClient = useQueryClient()
  const isSuspend = type === "adminConfirmSuspendUser"
  const isActivate = type === "adminConfirmActivateUser"
  const isDelete = type === "adminConfirmDeleteUser"
  const isActive = isOpen && (isSuspend || isActivate || isDelete)

  const handleSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ["admin", "users"] })
    if (data?.onSuccess) {
      data.onSuccess()
    }
    onClose()
  }

  const activateMutation = useActivateUserApiV1AdminUsersUserIdActivatePostMutation({ 
    showToast: true,
    onSuccess: handleSuccess,
  })
  const suspendMutation = useSuspendUserApiV1AdminUsersUserIdSuspendPostMutation({ 
    showToast: true,
    onSuccess: handleSuccess,
  })

  const busy = activateMutation.isPending || suspendMutation.isPending

  const title = isSuspend ? "Suspend user" : isActivate ? "Activate user" : "Delete user"
  const description = isSuspend
    ? `This will suspend ${data?.userEmail || "this user"}. They won't be able to sign in until reactivated.`
    : isActivate
    ? `This will activate ${data?.userEmail || "this user"} and restore access.`
    : `This will permanently suspend ${data?.userEmail || "this user"}. This action may be irreversible.`

  const onConfirm = async () => {
    if (!data?.userId) return
    if (isSuspend) {
      await suspendMutation.mutateAsync({ path: { user_id: data.userId } })
    } else if (isActivate) {
      await activateMutation.mutateAsync({ path: { user_id: data.userId } })
    } else if (isDelete) {
      await suspendMutation.mutateAsync({ path: { user_id: data.userId } })
    }
  }

  const Icon = isDelete ? Trash2 : isSuspend ? Ban : Check
  const iconColor = isDelete || isSuspend ? "destructive" : "primary"

  return (
    <Dialog open={isActive} onOpenChange={(open) => (!open ? onClose() : undefined)} key={isActive ? "open" : "closed"}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className={cn(
              "flex h-8 w-8 items-center justify-center rounded-lg",
              isDelete || isSuspend 
                ? "bg-destructive/10 text-destructive" 
                : "bg-primary/10 text-primary"
            )}>
              <Icon className="h-4 w-4" />
            </div>
            <DialogTitle className="text-lg">{title}</DialogTitle>
          </div>
        </DialogHeader>
        <DialogDescription className="text-sm text-zinc-400">
          {description}
        </DialogDescription>
        <DialogFooter className="pt-2">
          <Button variant="outline" onClick={onClose} disabled={busy} className="rounded-xl h-9 px-4 text-sm">
            Cancel
          </Button>
          {isDelete ? (
            <ActionButton
              loading={busy}
              icon={Trash2}
              onClick={onConfirm}
              variant="destructive"
              loadingText="Deleting..."
              className="rounded-xl h-9 px-4 text-sm"
            >
              Delete
            </ActionButton>
          ) : isSuspend ? (
            <ActionButton
              loading={busy}
              icon={Ban}
              onClick={onConfirm}
              variant="destructive"
              loadingText="Suspending..."
              className="rounded-xl h-9 px-4 text-sm"
            >
              Suspend
            </ActionButton>
          ) : (
            <ActionButton
              loading={busy}
              icon={Check}
              onClick={onConfirm}
              variant="default"
              loadingText="Activating..."
              className="rounded-xl h-9 px-4 text-sm"
            >
              Activate
            </ActionButton>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}


