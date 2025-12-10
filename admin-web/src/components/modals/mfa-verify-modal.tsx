"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ActionButton } from "@/components/ui/action-button"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useModal } from "@/lib/stores/modal-store"
import { useVerifyTotpApiV1AuthMfaTotpVerifyPostMutation } from "@/generated/hooks/authentication"
import { Shield, AlertCircle } from "lucide-react"
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp"

export function MfaVerifyModal() {
  const { isOpen, type, data, onClose } = useModal()
  const isActive = isOpen && type === "mfaVerify"

  const [verificationCode, setVerificationCode] = useState("")
  const [error, setError] = useState<string | null>(null)

  const verifyMutation = useVerifyTotpApiV1AuthMfaTotpVerifyPostMutation({
    showToast: false, // Don't show toast for MFA verification as we show error in UI
    onSuccess: () => {
      setError(null)
      // Call the onConfirm callback with the verified code
      if (data.onConfirm) {
        data.onConfirm(verificationCode)
      }
      onClose()
    },
    onError: (error) => {
      setError(error.message || "Invalid verification code")
      // Error is shown in UI via setError, no need for toast
    },
  })

  const handleVerify = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      setError("Please enter a 6-digit code")
      return
    }

    setError(null)
    try {
      await verifyMutation.mutateAsync({
        code: verificationCode,
      })
    } catch (error) {
      // Error handled in onError
    }
  }

  const handleCancel = () => {
    setVerificationCode("")
    setError(null)
    if (data.onCancel) {
      data.onCancel()
    }
    onClose()
  }

  if (!isActive) {
    return null
  }

  const title = data.title as string | undefined || "Verify Your Identity"
  const description = data.description as string | undefined || "Enter the 6-digit code from your authenticator app to continue."
  const actionLabel = data.actionLabel as string | undefined || "Verify"

  return (
    <Dialog open={isActive} onOpenChange={(open) => (!open ? handleCancel() : undefined)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Shield className="h-4 w-4" />
            </div>
            <DialogTitle>{title}</DialogTitle>
          </div>
          <DialogDescription className="text-sm">
            {description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* MFA Code Input */}
          <div className="space-y-2">
            <Label htmlFor="mfa-code">Authentication Code</Label>
            <div className="flex justify-center">
              <InputOTP
                value={verificationCode}
                onChange={(value) => {
                  setVerificationCode(value)
                  setError(null)
                }}
                maxLength={6}
                disabled={verifyMutation.isPending}
              >
                <InputOTPGroup>
                  {[0, 1, 2, 3, 4, 5].map((index) => (
                    <InputOTPSlot key={index} index={index} />
                  ))}
                </InputOTPGroup>
              </InputOTP>
            </div>
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <p className="text-xs text-muted-foreground text-center">
              Enter the 6-digit code from your authenticator app
            </p>
          </div>

          {/* Info Alert */}
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription className="text-sm">
              This extra verification step helps protect your account and sensitive data.
            </AlertDescription>
          </Alert>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={verifyMutation.isPending}
              className="flex-1 h-9 rounded-xl text-sm"
            >
              Cancel
            </Button>
            <ActionButton
              onClick={handleVerify}
              loading={verifyMutation.isPending}
              disabled={verificationCode.length !== 6}
              className="flex-1 h-9 rounded-xl text-sm"
              loadingText="Verifying..."
            >
              {actionLabel}
            </ActionButton>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

