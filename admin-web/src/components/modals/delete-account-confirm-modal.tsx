"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ActionButton } from "@/components/ui/action-button"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useModal } from "@/lib/stores/modal-store"
import { useState } from "react"
import { Trash2, AlertTriangle, Shield } from "lucide-react"
import { useAuth } from "@/lib/auth/client/provider"

type Step = "confirm" | "mfa" | "deleting"

export function DeleteAccountConfirmModal() {
  const { user } = useAuth()
  const { isOpen, type, data, onClose, onOpen } = useModal()
  const isActive = isOpen && type === "deleteAccountConfirm"

  const [step, setStep] = useState<Step>("confirm")
  const [confirmName, setConfirmName] = useState("")
  const registeredName = user?.first_name || (data.initialValue as string) || ""
  const mfaEnabled = user?.mfa_enabled || false

  const nameMatches = registeredName.trim().length > 0 && confirmName.trim() === registeredName.trim()

  const handleNameConfirm = async () => {
    if (!nameMatches) return

    // If MFA is enabled, require MFA verification
    if (mfaEnabled) {
      setStep("mfa")
      onOpen("mfaVerify", {
        title: "Verify Your Identity",
        description: "Enter your MFA code to confirm account deletion. This action cannot be undone.",
        actionLabel: "Verify & Delete",
        onConfirm: async (mfaCode?: string) => {
          if (data.onConfirm) {
            await data.onConfirm(mfaCode)
          }
          setStep("deleting")
          setTimeout(() => {
            onClose()
          }, 1000)
        },
        onCancel: () => {
          setStep("confirm")
        },
      })
    } else {
      // No MFA, proceed directly
      setStep("deleting")
      if (data.onConfirm) {
        await data.onConfirm()
      }
      onClose()
    }
  }

  if (!isActive) {
    return null
  }

  if (step === "deleting") {
    return (
      <Dialog open={isActive} onOpenChange={() => {}}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Deleting Account...</DialogTitle>
            <DialogDescription>
              Please wait while we process your request.
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={isActive} onOpenChange={(open) => (!open ? onClose() : undefined)}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
              <Trash2 className="h-4 w-4" />
            </div>
            <DialogTitle className="text-lg">Delete account</DialogTitle>
          </div>
          <DialogDescription className="text-sm text-zinc-400">
            This action will permanently delete your account and all associated data.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Warning:</strong> This action cannot be undone. You can restore your account if you log in again within 30 days.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label className="text-xs font-medium text-zinc-400">
              Type your full name &quot;{registeredName}&quot; to confirm
            </Label>
            <Input
              placeholder={registeredName ? `Type "${registeredName}" to confirm` : "Type your full name to confirm"}
              value={confirmName}
              onChange={(e) => setConfirmName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && nameMatches) {
                  handleNameConfirm()
                }
              }}
              autoFocus
              className="rounded-xl h-9 text-sm"
            />
            {!nameMatches && confirmName.length > 0 && (
              <p className="text-xs text-destructive">The name you entered does not match your account name.</p>
            )}
          </div>

          {mfaEnabled && (
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription className="text-sm">
                You have MFA enabled. You'll be asked to verify with your authenticator app after confirming your name.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter className="pt-2">
          <Button variant="outline" onClick={onClose} className="rounded-xl h-9 px-4 text-sm">
            Cancel
          </Button>
          <ActionButton
            variant="destructive"
            onClick={handleNameConfirm}
            disabled={!nameMatches}
            icon={Trash2}
            className="rounded-xl h-9 px-4 text-sm"
          >
            Continue
          </ActionButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}


