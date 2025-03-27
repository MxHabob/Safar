import { ConfirmPasswordResetForm } from "@/components/forms/confirm-password-reset-form"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Safar | New Password",
  description: "Set a new password for your Safar account",
}

export default function ConfirmPasswordResetPage() {
  return (
    <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px] md:w-[450px]">
      <div className="flex flex-col space-y-2 text-center">
        <h1 className="text-3xl font-semibold tracking-tight bg-gradient-to-r from-sky-600 to-emerald-500 text-transparent bg-clip-text">
          New Destination
        </h1>
        <p className="text-sm text-muted-foreground">Create a new password to continue your travel adventures</p>
      </div>
      <ConfirmPasswordResetForm />
    </div>
  )
}

