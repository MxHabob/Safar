"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ActionButton } from "@/components/ui/action-button"
import { useModal } from "@/lib/stores/modal-store"
import { useSetup2faApiV1Users2faSetupPostMutation } from "@/generated/hooks/users"
import { Shield } from "lucide-react"

export function EnableMfaConfirmModal() {
  const { isOpen, type, data, onClose, onOpen } = useModal()
  const isActive = isOpen && type === "enableMfaConfirm"

  const setupMutation = useSetup2faApiV1Users2faSetupPostMutation({
    showToast: true,
    onSuccess: (response) => {
      onClose()
      // Open MFA setup modal with QR code and backup codes
      onOpen("mfaSetup", {
        secret: response.secret,
        otpauthUrl: response.secret, // Use secret if otpauth_url not available
        qrCode: response.qr_code,
        backupCodes: response.backup_codes,
      })
    },
  })

  const handleConfirm = async () => {
    try {
      await setupMutation.mutateAsync()
    } catch (error) {
      // Error handled in onError
    }
  }

  return (
    <Dialog open={isActive} onOpenChange={(open) => (!open ? onClose() : undefined)} key={isActive ? "open" : "closed"}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Shield className="h-4 w-4" />
            </div>
            <DialogTitle className="text-lg">Enable multi-factor authentication</DialogTitle>
          </div>
          <DialogDescription className="text-sm text-zinc-400">
            Multi-factor authentication adds an extra layer of security to your account. 
            You'll need to use an authenticator app to generate codes when signing in.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="rounded-xl bg-muted/30 border p-3 text-sm">
            <p className="font-medium mb-1.5 text-foreground text-xs">What you'll need:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground text-xs">
              <li>An authenticator app (Google Authenticator, Authy, etc.)</li>
              <li>Your phone or device</li>
            </ul>
          </div>
        </div>
        <DialogFooter className="pt-2">
          <Button variant="outline" onClick={onClose} disabled={setupMutation.isPending} className="rounded-xl h-9 px-4 text-sm">
            Cancel
          </Button>
          <ActionButton
            onClick={handleConfirm}
            loading={setupMutation.isPending}
            icon={Shield}
            loadingText="Setting up..."
            className="rounded-xl h-9 px-4 text-sm"
          >
            Continue
          </ActionButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
