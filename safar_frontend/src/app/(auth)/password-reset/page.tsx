import { RequestPasswordResetForm } from "@/components/forms/request-password-reset-form"
import type { Metadata } from "next"
import Link from "next/link"


export const metadata: Metadata = {
  title: "Reset Password",
  description: "Reset your password",
}

export default function ResetPasswordPage() {
  return (
    <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px] md:w-[450px]">
      <div className="flex flex-col space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Reset your password</h1>
        <p className="text-sm text-muted-foreground">
          Enter your email address and we&apos;ll send you a link to reset your password
        </p>
      </div>
      <RequestPasswordResetForm />
      <p className="px-8 text-center text-sm text-muted-foreground">
        <Link href="/login" className="hover:text-brand underline underline-offset-4">
          Back to login
        </Link>
      </p>
    </div>
  )
}

