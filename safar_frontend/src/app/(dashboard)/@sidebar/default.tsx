"use client"

import type React from "react"

import { useState, useCallback } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
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
  Calendar,
  Building,
  Users,
  Percent,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useRealtimeNotifications } from "@/core/hooks/realtime/use-realtime-notifications"
import { useAuth } from "@/core/hooks/use-auth"

interface NavItemProps {
  href: string
  icon: React.ReactNode
  label: string
  exact?: boolean
  badge?: number
}

const NavItem = ({ href, icon, label, exact = false, badge }: NavItemProps) => {
  const pathname = usePathname()
  const isActive = exact ? pathname === href : pathname.startsWith(href)

  return (
    <Link
      href={href}
      className={`flex items-center p-2 rounded-md group transition-colors relative ${
        isActive ? "bg-primary/10 text-primary" : "hover:bg-muted text-muted-foreground hover:text-foreground"
      }`}
      prefetch={false}
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

export default function DashboardSidebar() {
  const [isOpen, setIsOpen] = useState(false)
  const { unreadCount } = useRealtimeNotifications()
  const { user } = useAuth()
  const isOwner = user?.role === "owner" || user?.role === "admin"

  const toggleSidebar = useCallback(() => {
    setIsOpen((prev) => !prev)
  }, [])

  const closeSidebar = useCallback(() => {
    setIsOpen(false)
  }, [])

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 md:hidden"
        onClick={toggleSidebar}
        aria-label="Toggle sidebar"
        aria-expanded={isOpen}
      >
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {isOpen && <div className="fixed inset-0 bg-black/50 md:hidden z-30" onClick={closeSidebar} />}

      <aside
        className={`fixed md:sticky top-0 h-screen z-40 transition-all duration-300 ease-in-out bg-background border-r
          md:w-64 md:block
          ${isOpen ? "left-0 w-64" : "-left-full w-64"}`}
      >
        <div className="flex flex-col h-full">
          <div className="flex-1 overflow-y-auto py-4">
            <div className="px-3 mb-6">
              <NavItem href="/dashboard" icon={<Home className="h-5 w-5" />} label="Home" exact />
              <NavItem href="/bookings" icon={<Calendar className="h-5 w-5" />} label="My Bookings" />
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
              <NavItem href="/wishlist" icon={<Heart className="h-5 w-5" />} label="Wishlist" />
              <NavItem href="/discounts" icon={<Percent className="h-5 w-5" />} label="discounts" />
            </div>

            {isOwner && (
              <div className="px-3 py-2">
                <h3 className="mb-2 px-2 text-xs font-semibold text-muted-foreground">OWNER DASHBOARD</h3>
                <NavItem href="/dashboard" icon={<Building className="h-5 w-5" />} label="Owner Dashboard" />
                <NavItem href="/owner/reservations" icon={<Calendar className="h-5 w-5" />} label="Reservations" />
                <NavItem href="/owner/places" icon={<Home className="h-5 w-5" />} label="My Places" />
                <NavItem href="/owner/experiences" icon={<Users className="h-5 w-5" />} label="My Experiences" />
              </div>
            )}
          </div>

          <div className="border-t p-3">
            <NavItem href="/account/profile" icon={<User className="h-5 w-5" />} label="Profile" />
            <NavItem href="/account/settings" icon={<Settings className="h-5 w-5" />} label="Settings" />
            <NavItem href="/safar/help" icon={<HelpCircle className="h-5 w-5" />} label="Help Center" />
          </div>
        </div>
      </aside>
    </>
  )
}
