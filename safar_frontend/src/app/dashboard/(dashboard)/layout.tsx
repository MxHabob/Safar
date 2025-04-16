import type { ReactNode } from "react"

interface DashboardLayoutProps {
  children: ReactNode
  sidebar: ReactNode
  content: ReactNode
}

export default function DashboardLayout({ children, sidebar, content }: DashboardLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex flex-1">
        {/* Remove the hidden class and let the sidebar component handle its own responsive behavior */}
        {sidebar}
        <main className="flex-1">
          {content}
          {children}
        </main>
      </div>
    </div>
  )
}