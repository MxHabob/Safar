import type React from "react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Authentication",
  description: "Authentication pages for your application",
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 flex items-center justify-center">
        {children}
      </main>
    </div>
  )
}
