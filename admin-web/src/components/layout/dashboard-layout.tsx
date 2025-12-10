"use client"

import type React from "react"
import { useIsClient } from "@uidotdev/usehooks"

import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "./sidebar/app-sidebar"
import { DashboardHeader } from "./dashboard-header"
import { DashboardSkeleton } from "./dashboard-skeleton"

type Model = {
  id: string
  name?: string
  display_name: string
  description: string
  type?: string
  version?: string
  inference_time?: number
  status?: string
  is_active?: boolean
  accuracy?: number
}

type Props = {
  children: React.ReactNode
  defaultModel?: Model
}

/**
 * DashboardLayoutWrapper Component
 *
 * Main layout wrapper for dashboard pages.
 * Handles sidebar state and provides the basic layout structure with
 * sidebar, header, and content area.
 *
 * Updated to pass defaultModel to DashboardHeader for store initialization
 */
function DashboardLayoutWrapper({ children, defaultModel }: Props) {
  const isClient = useIsClient()

  // Get sidebar open state from localStorage, with fallback to true
  const isOpen = isClient
    ? localStorage.getItem("sidebar-open")
      ? localStorage.getItem("sidebar-open") === "true"
      : true
    : true

  // Show skeleton during initial client-side rendering
  if (!isClient) {
    return <DashboardSkeleton />
  }

  return (
    <SidebarProvider defaultOpen={isOpen}>
      <AppSidebar id="main-sidebar" />
      <SidebarInset className="flex flex-col md:peer-data-[variant=inset]:peer-data-[state=collapsed]:ml-0" role="main">
        <DashboardHeader defaultModel={defaultModel} />
        <div className="flex-1 overflow-auto p-4" aria-label="Dashboard content">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

export default DashboardLayoutWrapper
