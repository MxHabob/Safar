import { RequestPasswordResetForm } from "@/components/forms/request-password-reset-form"
import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Safar | Reset Password",
  description: "Reset your Safar password to continue your journey",
}

export default function ResetPasswordPage() {
  return (
    <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px] md:w-[450px]">
      <div className="flex flex-col space-y-2 text-center">
        <h1 className="text-3xl font-semibold tracking-tight bg-gradient-to-r from-sky-600 to-emerald-500 text-transparent bg-clip-text">
          Lost Your Way?
        </h1>
        <p className="text-sm text-muted-foreground">
          Enter your email and we&apos;ll send you directions to reset your password
        </p>
      </div>
      <RequestPasswordResetForm />
      <p className="px-8 text-center text-sm text-muted-foreground">
        <Link href="/auth/login" className="hover:text-sky-600 underline underline-offset-4">
          Back to login
        </Link>
      </p>
    </div>
  )
}

