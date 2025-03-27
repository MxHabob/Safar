import { ResendActivationForm } from "@/components/forms/resend-activation-form"
import type { Metadata } from "next"
import Link from "next/link"


export const metadata: Metadata = {
  title: "Resend Activation Email",
  description: "Resend account activation email",
}

export default function ResendActivationPage() {
  return (
    <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px] md:w-[450px]">
      <div className="flex flex-col space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Resend activation email</h1>
        <p className="text-sm text-muted-foreground">Enter your email address to receive a new activation link</p>
      </div>
      <ResendActivationForm />
      <p className="px-8 text-center text-sm text-muted-foreground">
        <Link href="/sign-in" className="hover:text-brand underline underline-offset-4">
          Back to login
        </Link>
      </p>
    </div>
  )
}

