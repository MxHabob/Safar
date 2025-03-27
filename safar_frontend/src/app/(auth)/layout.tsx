import type React from "react"
import Link from "next/link"
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
      <header className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 max-w-screen-2xl items-center">
          <Link href="/" className="flex items-center space-x-2">
            <span className="font-bold">Safar</span>
          </Link>
        </div>
      </header>
      <main className="flex-1 container max-w-screen-2xl py-6">{children}</main>
      <footer className="border-t py-6 md:py-0">
        <div className="container flex flex-col items-center justify-between gap-4 md:h-14 md:flex-row">
          <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
            © {new Date().getFullYear()} YourApp. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}

