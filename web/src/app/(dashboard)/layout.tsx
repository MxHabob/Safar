/**
 * Protected Dashboard Layout
 * 
 * Server Component that validates authentication before rendering.
 * Uses getServerSession() for server-side validation.
 * 
 * @security Server-side authentication check prevents unauthorized access
 */

import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { SiteHeader } from '@/pages/dashboard/components/site-header'
import CreatePhotoModal from '@/pages/photos/components/create-photo-modal'
import { DashboardSidebar } from '@/pages/dashboard/components/dashboard-sidebar'
import { getServerSession } from '@/lib/auth/server'
import { Skeleton } from '@/components/ui/skeleton'

export const metadata: Metadata = {
  title: {
    template: '%s - Dashboard',
    default: 'Dashboard',
  },
}

/**
 * Loading skeleton for auth check
 */
function AuthLoadingSkeleton() {
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="space-y-4 w-full max-w-md">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    </div>
  )
}

/**
 * Protected layout content
 */
async function ProtectedContent({ children }: { children: React.ReactNode }) {
  // Server-side authentication check
  const session = await getServerSession()

  if (!session) {
    // Not authenticated - redirect to login
    redirect('/auth/signin?redirect=/dashboard')
  }

  // Authenticated - render dashboard
  return (
    <SidebarProvider
      style={
        {
          '--sidebar-width': 'calc(var(--spacing) * 72)',
          '--header-height': 'calc(var(--spacing) * 12)',
        } as React.CSSProperties
      }
    >
      <DashboardSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        {children}
        <CreatePhotoModal />
      </SidebarInset>
    </SidebarProvider>
  )
}

/**
 * Dashboard layout with authentication
 */
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<AuthLoadingSkeleton />}>
      <ProtectedContent>{children}</ProtectedContent>
    </Suspense>
  )
}
