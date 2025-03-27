import { ConfirmPasswordResetForm } from "@/components/forms/confirm-password-reset-form"
import type { Metadata } from "next"


export const metadata: Metadata = {
  title: "Set New Password",
  description: "Set a new password for your account",
}

export default function ConfirmPasswordResetPage() {
  return (
    <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px] md:w-[450px]">
      <div className="flex flex-col space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Set new password</h1>
        <p className="text-sm text-muted-foreground">Create a new password for your account</p>
      </div>
      <ConfirmPasswordResetForm />
    </div>
  )
}

