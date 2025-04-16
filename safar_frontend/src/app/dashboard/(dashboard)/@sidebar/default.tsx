import Link from "next/link"
import { Home, Building2, Bell, MessageSquare, Heart, User, HelpCircle, BookOpen, Settings } from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
} from "@/components/ui/sidebar"

export default function DashboardSidebar() {
  return (
    <Sidebar className="border-r">
      <SidebarContent>
        <div className="flex justify-center py-4">
          <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
            <span className="font-semibold text-sm">OA</span>
          </div>
        </div>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Home">
              <Link href="/dashboard">
                <Home className="h-5 w-5" />
                <span>Home</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Bookings">
              <Link href="/dashboard/bookings">
                <Building2 className="h-5 w-5" />
                <span>Bookings</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Messages">
              <Link href="/dashboard/messages">
                <MessageSquare className="h-5 w-5" />
                <span>Messages</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Notifications">
              <Link href="/dashboard/notifications">
                <Bell className="h-5 w-5" />
                <span>Notifications</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Wishlist">
              <Link href="/dashboard/wishlist">
                <Heart className="h-5 w-5" />
                <span>Wishlist</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Profile">
              <Link href="/dashboard/profile">
                <User className="h-5 w-5" />
                <span>Profile</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Help">
              <Link href="#">
                <HelpCircle className="h-5 w-5" />
                <span>Help</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Documentation">
              <Link href="#">
                <BookOpen className="h-5 w-5" />
                <span>Docs</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Settings">
              <Link href="#">
                <Settings className="h-5 w-5" />
                <span>Settings</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
