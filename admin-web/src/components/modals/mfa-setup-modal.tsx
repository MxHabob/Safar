"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ActionButton } from "@/components/ui/action-button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp"
import { useModal } from "@/lib/stores/modal-store"
import { useVerify2faSetupApiV1Users2faVerifyPostMutation } from "@/generated/hooks/users"
import { Shield, CheckCircle2, Copy, Download, Eye, EyeOff } from "lucide-react"
import Image from "next/image"
import { Alert, AlertDescription } from "@/components/ui/alert"
// Note: useSession removed - using direct session management if needed

export function MfaSetupModal() {
  const { isOpen, type, data, onClose } = useModal()
  const isActive = isOpen && type === "mfaSetup"

  const [verificationCode, setVerificationCode] = useState("")
  const [showBackupCodes, setShowBackupCodes] = useState(false)
  const [codesCopied, setCodesCopied] = useState(false)
  const [step, setStep] = useState<"setup" | "verified">("setup")

  const secret = data?.secret as string | undefined
  const otpauthUrl = data?.otpauthUrl as string | undefined
  const qrCode = data?.qrCode as string | undefined
  const backupCodes = (data?.backupCodes as string[] | undefined) || []

  const verifyMutation = useVerify2faSetupApiV1Users2faVerifyPostMutation({
    showToast: true,
    onSuccess: () => {
      setStep("verified")
      // Session will be updated automatically via query invalidation
      if (data?.onSuccess) {
        data.onSuccess()
      }
    },
  })

  const handleVerify = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      // Validation error - can be shown via UI state instead of toast
      return
    }

    try {
      await verifyMutation.mutateAsync({
        code: verificationCode,
        method: "totp",
      })
    } catch (error) {
      // Error handled in onError
    }
  }

  const handleCopySecret = () => {
    if (secret) {
      navigator.clipboard.writeText(secret)
      // Copy success can be shown via UI state if needed
    }
  }

  const handleCopyBackupCodes = () => {
    const codesText = backupCodes.join("\n")
    navigator.clipboard.writeText(codesText)
    setCodesCopied(true)
    setTimeout(() => setCodesCopied(false), 2000)
    // Copy success is shown via codesCopied state in UI
  }

  const handleDownloadBackupCodes = () => {
    const codesText = backupCodes.join("\n")
    const blob = new Blob([codesText], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "authen-backup-codes.txt"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    // Download success - file download is implicit feedback
  }

  if (!isActive || !secret || !qrCode) {
    return null
  }

  if (step === "verified") {
    return (
      <Dialog open={isActive} onOpenChange={(open) => (!open ? onClose() : undefined)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-500/10 text-green-600 dark:text-green-400">
                <CheckCircle2 className="h-4 w-4" />
              </div>
              <DialogTitle className="text-lg">MFA Enabled Successfully</DialogTitle>
            </div>
            <DialogDescription className="text-sm text-zinc-400">
              Your account is now protected with multi-factor authentication.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Alert className="rounded-xl">
              <Shield className="h-4 w-4" />
              <AlertDescription className="text-sm">
                Make sure to save your backup codes in a safe place. You'll need them if you lose access to your authenticator app.
              </AlertDescription>
            </Alert>
            <div className="space-y-2">
              <Label className="text-xs font-medium text-zinc-400">Backup Codes</Label>
              <div className="rounded-xl border bg-muted/30 p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-medium text-foreground">Save these codes</p>
                  <div className="flex gap-1.5">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCopyBackupCodes}
                      className="h-8 rounded-lg text-xs px-2"
                    >
                      <Copy className="h-3.5 w-3.5 mr-1" />
                      {codesCopied ? "Copied!" : "Copy"}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleDownloadBackupCodes}
                      className="h-8 rounded-lg text-xs px-2"
                    >
                      <Download className="h-3.5 w-3.5 mr-1" />
                      Download
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 font-mono text-xs">
                  {backupCodes.map((code, index) => (
                    <div key={index} className="p-2 bg-background rounded-lg border border-border/50 text-center">
                      {code}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <Button onClick={onClose} className="w-full h-9 rounded-xl text-sm">
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={isActive} onOpenChange={(open) => (!open ? onClose() : undefined)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Shield className="h-4 w-4" />
            </div>
            <DialogTitle className="text-lg">Setup Multi-Factor Authentication</DialogTitle>
          </div>
          <DialogDescription className="text-sm text-zinc-400">
            Scan the QR code with your authenticator app, then enter the verification code.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* QR Code */}
          <div className="flex flex-col items-center space-y-3">
            <div className="rounded-xl border p-3 bg-background">
              {qrCode && (
                <Image
                  src={qrCode}
                  alt="MFA QR Code"
                  width={160}
                  height={160}
                  className="rounded-lg"
                />
              )}
            </div>
            <p className="text-xs text-muted-foreground text-center">
              Scan this QR code with your authenticator app
            </p>
          </div>

          {/* Manual Entry */}
          <div className="space-y-2">
            <Label className="text-xs font-medium text-zinc-400">Or enter this code manually</Label>
            <div className="flex gap-2">
              <Input
                value={secret}
                readOnly
                className="font-mono text-xs rounded-xl h-9"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={handleCopySecret}
                title="Copy secret"
                className="rounded-xl h-9 w-9"
              >
                <Copy className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {/* Verification Code Input */}
          <div className="space-y-2">
            <Label className="text-xs font-medium text-zinc-400">Enter verification code</Label>
            <div className="flex justify-center">
              <InputOTP
                value={verificationCode}
                onChange={(value) => setVerificationCode(value)}
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
            <p className="text-xs text-muted-foreground text-center">
              Enter the 6-digit code from your authenticator app
            </p>
          </div>

          {/* Backup Codes Preview */}
          {backupCodes.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium text-zinc-400">Backup Codes</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowBackupCodes(!showBackupCodes)}
                  className="h-8 text-xs"
                >
                  {showBackupCodes ? (
                    <>
                      <EyeOff className="h-3.5 w-3.5 mr-1" />
                      Hide
                    </>
                  ) : (
                    <>
                      <Eye className="h-3.5 w-3.5 mr-1" />
                      Show
                    </>
                  )}
                </Button>
              </div>
              {showBackupCodes && (
                <div className="rounded-xl border bg-muted/30 p-3">
                  <p className="text-xs text-muted-foreground mb-2">
                    Save these codes in a safe place. You'll need them if you lose access to your authenticator app.
                  </p>
                  <div className="grid grid-cols-2 gap-2 font-mono text-xs">
                    {backupCodes.map((code, index) => (
                      <div key={index} className="p-2 bg-background rounded-lg border border-border/50 text-center">
                        {code}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={onClose} className="flex-1 h-9 rounded-xl text-sm">
              Cancel
            </Button>
            <ActionButton
              onClick={handleVerify}
              loading={verifyMutation.isPending}
              disabled={verificationCode.length !== 6}
              className="flex-1 h-9 rounded-xl text-sm"
              loadingText="Verifying..."
            >
              Verify & Enable
            </ActionButton>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

