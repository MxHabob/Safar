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
      <footer className="border-t py-6 md:py-0">
        <div className="flex flex-col items-center justify-between gap-4 md:h-14 md:flex-row">
          <p className="text-center text-sm leading-loose text-muted-foreground md:text-left ml-11">
            © {new Date().getFullYear()} Safar. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
