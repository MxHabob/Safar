import { ProtectedRoute } from "@/lib/protected-route"
import type { ReactNode } from "react"

interface DashboardLayoutProps {
  children: ReactNode
  sidebar: ReactNode
}

export default function DashboardLayout({ children, sidebar }: DashboardLayoutProps) {
  return (
    <ProtectedRoute>
    <div className="flex min-h-screen flex-col">
      <div className="flex flex-1">
        {sidebar}
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
   </ProtectedRoute>
  )
}