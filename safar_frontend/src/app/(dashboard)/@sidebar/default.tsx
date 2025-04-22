"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import {
  Home,
  Bell,
  MessageSquare,
  Heart,
  User,
  HelpCircle,
  Settings,
  Compass,
  PlaneTakeoff,
  Hotel,
  Menu,
  X,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export default function DashboardSidebar() {
  const [isHovered, setIsHovered] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  const toggleSidebar = () => {
    setIsOpen(!isOpen)
  }

  return (
    <>
      <Button variant="ghost" size="icon" className="fixed top-4 left-4 z-50 md:hidden" onClick={toggleSidebar}>
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      <aside
        className={`fixed md:sticky top-0 h-screen z-40 transition-all duration-300 ease-in-out bg-background border-r
          md:w-auto md:block
          ${isOpen ? "left-0 w-64" : "-left-full w-64"}
          ${isHovered ? "md:w-64" : "md:w-16"}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="flex flex-col h-full">
          <div className="flex-1 overflow-y-auto py-4">
            <div className="px-3 mb-6">
              <div className={`mb-2 px-2 text-xs font-semibold text-muted-foreground ${!isHovered && "md:hidden"}`}>
                MAIN MENU
              </div>
              <NavItem
                href="/dashboard"
                icon={<Home className="h-5 w-5" />}
                label="Home"
                isCollapsed={!isHovered}
                isActive={true}
              />
              <NavItem
                href="/dashboard/bookings"
                icon={<Bell className="h-5 w-5" />}
                label="My Bookings"
                isCollapsed={!isHovered}
              />
              <NavItem
                href="/dashboard/messages"
                icon={<MessageSquare className="h-5 w-5" />}
                label="Messages"
                isCollapsed={!isHovered}
                badge="3"
              />
              <NavItem
                href="/dashboard/notifications"
                icon={<Bell className="h-5 w-5" />}
                label="Notifications"
                isCollapsed={!isHovered}
                badge="5"
              />
              <NavItem
                href="/dashboard/wishlist"
                icon={<Heart className="h-5 w-5" />}
                label="Wishlist"
                isCollapsed={!isHovered}
              />
            </div>

            <div className={`px-3 mb-6 ${!isHovered && "md:hidden"}`}>
              <div className="mb-2 px-2 text-xs font-semibold text-muted-foreground">DISCOVER</div>
              <NavItem
                href="/dashboard/explore"
                icon={<Compass className="h-5 w-5" />}
                label="Explore"
                isCollapsed={false}
              />
              <NavItem
                href="/dashboard/flights"
                icon={<PlaneTakeoff className="h-5 w-5" />}
                label="Flights"
                isCollapsed={false}
              />
              <NavItem
                href="/dashboard/hotels"
                icon={<Hotel className="h-5 w-5" />}
                label="Hotels"
                isCollapsed={false}
              />
            </div>
          </div>

          <div className="border-t p-3">
            <NavItem
              href="/dashboard/profile"
              icon={<User className="h-5 w-5" />}
              label="Profile"
              isCollapsed={!isHovered}
            />
            <NavItem
              href="/dashboard/settings"
              icon={<Settings className="h-5 w-5" />}
              label="Settings"
              isCollapsed={!isHovered}
            />
            <NavItem
              href="/dashboard/help"
              icon={<HelpCircle className="h-5 w-5" />}
              label="Help Center"
              isCollapsed={!isHovered}
            />
          </div>
        </div>
      </aside>
    </>
  )
}

// Navigation Item Component
function NavItem({
  href,
  icon,
  label,
  isCollapsed,
  isActive = false,
  badge,
}: {
  href: string
  icon: React.ReactNode
  label: string
  isCollapsed: boolean
  isActive?: boolean
  badge?: string
}) {
  return (
    <Link
      href={href}
      className={`flex items-center p-2 rounded-md group transition-colors relative ${
        isActive ? "bg-primary/10 text-primary" : "hover:bg-muted text-muted-foreground hover:text-foreground"
      }`}
    >
      <div className="flex items-center justify-center w-5 h-5">{icon}</div>
      <span className={`ml-3 text-sm font-medium ${isCollapsed && "md:hidden"}`}>{label}</span>
      {!isCollapsed && badge && (
        <Badge variant="secondary" className="ml-auto text-xs">
          {badge}
        </Badge>
      )}
      {isCollapsed && badge && (
        <Badge
          variant="secondary"
          className="absolute top-0 right-0 translate-x-1/2 -translate-y-1/2 w-4 h-4 p-0 flex items-center justify-center text-[10px] md:block"
        >
          {badge}
        </Badge>
      )}
    </Link>
  )
}
