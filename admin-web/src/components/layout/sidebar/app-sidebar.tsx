"use client";

import * as React from "react";
import Link from "next/link";

import { NavMain } from "./nav-main";
import { NavSecondary } from "./nav-secondary";
import { NavUser } from "./nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { sidebarMenus } from "@/constants";
import { SafarLogo } from "@/components/shared/safar-logo";

/**
 * AppSidebar Component
 *
 * Main application sidebar with navigation sections for the dashboard.
 * Includes app logo/header, main navigation, workspace selection,
 * secondary links, and user profile.
 */
export function AppSidebar(props: React.ComponentProps<typeof Sidebar>) {
  const { open } = useSidebar();

  // Persist sidebar open state in localStorage
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("sidebar-open", open.toString());
    }
  }, [open]);

  
  return (
    <Sidebar
      variant="inset"
      collapsible="icon"
      {...props}
      aria-label="Main navigation"
    >
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link
                href="/ai"
                className="hover:bg-transparent"
                aria-label="Go to ai"
              >
                <div
                  className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg"
                  aria-hidden="true"
                >
                  <SafarLogo size={18}/>
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">Authen</span>
                  <span className="truncate text-xs">Enterprise</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={sidebarMenus.navMain} label="Platform" />
        <NavSecondary
          items={ sidebarMenus.navSecondary }
          className="mt-auto"
        />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
