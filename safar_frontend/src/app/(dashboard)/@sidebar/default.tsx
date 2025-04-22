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
  Menu,
  X,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useRealtimeNotifications } from "@/core/hooks/realtime/use-realtime-notifications"

export default function DashboardSidebar() {
  const [isOpen, setIsOpen] = useState(false)
  const {  unreadCount } = useRealtimeNotifications()
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
          ${isOpen ? "left-0 w-64" : "-left-full w-64"}`}
      >
        <div className="flex flex-col h-full">
          <div className="flex-1 overflow-y-auto py-4">
            <div className="px-3 mb-6">
              <NavItem
                href="/account"
                icon={<Home className="h-5 w-5" />}
                label="Home"
                isActive={true}
              />
              <NavItem
                href="/bookings"
                icon={<Bell className="h-5 w-5" />}
                label="My Bookings"
              />
              <NavItem
                href="/messages"
                icon={<MessageSquare className="h-5 w-5" />}
                label="Messages"
                badge={unreadCount > 0 ? unreadCount : undefined}
              />
              <NavItem
                href="/notifications"
                icon={<Bell className="h-5 w-5" />}
                label="Notifications"
                badge={unreadCount > 0 ? unreadCount : undefined}
              />
              <NavItem
                href="/dashboard/wishlist"
                icon={<Heart className="h-5 w-5" />}
                label="Wishlist"
              />
            </div>
          </div>

          <div className="border-t p-3">
            <NavItem
              href="/account/profile"
              icon={<User className="h-5 w-5" />}
              label="Profile"
            />
            <NavItem
              href="/account/settings"
              icon={<Settings className="h-5 w-5" />}
              label="Settings"
  
            />
            <NavItem
              href="/safar/help"
              icon={<HelpCircle className="h-5 w-5" />}
              label="Help Center"
            />
          </div>
        </div>
      </aside>
    </>
  )
}

function NavItem({
  href,
  icon,
  label,
  isActive = false,
  badge,
}: {
  href: string
  icon: React.ReactNode
  label: string
  isActive?: boolean
  badge?: number
}) {
  return (
    <Link
      href={href}
      className={`flex items-center p-2 rounded-md group transition-colors relative ${
        isActive ? "bg-primary/10 text-primary" : "hover:bg-muted text-muted-foreground hover:text-foreground"
      }`}
    >
      <div className="flex items-center justify-center w-5 h-5">{icon}</div>
      <span className="ml-3 text-sm font-medium">{label}</span>
      {badge && (
        <Badge variant="secondary" className="ml-auto text-xs">
          {badge}
        </Badge>
      )}
    </Link>
  )
}
