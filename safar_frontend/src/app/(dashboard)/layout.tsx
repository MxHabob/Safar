import { ProtectedRoute } from "@/lib/protected-route"
import type { ReactNode } from "react"

interface DashboardLayoutProps {
  children: ReactNode
  sidebar: ReactNode
}

export default function DashboardLayout({ children, sidebar }: DashboardLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex flex-1">
        {sidebar}
      <ProtectedRoute>
        <main className="flex-1 my-4">
          {children}
        </main>
     </ProtectedRoute>
      </div>
    </div>
  )
}