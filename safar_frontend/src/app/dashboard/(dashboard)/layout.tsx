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
        <aside className="hidden w-64 border-r bg-muted/40 md:block">{sidebar}</aside>
        <main className="flex-1">
          {content}
          {children}
        </main>
      </div>
    </div>
  )
}
