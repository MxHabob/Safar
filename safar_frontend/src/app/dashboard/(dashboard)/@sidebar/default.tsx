"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Home, Bell, MessageSquare, Heart, User, HelpCircle, Settings, Globe, Compass, PlaneTakeoff, Hotel, Utensils, Ticket, Menu } from 'lucide-react'
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export default function DashboardSidebar() {
  const [isHovered, setIsHovered] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  // Check if mobile on mount and on resize
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkIfMobile()
    window.addEventListener("resize", checkIfMobile)

    return () => {
      window.removeEventListener("resize", checkIfMobile)
    }
  }, [])

  const toggleSidebar = () => {
    setIsOpen(!isOpen)
  }

  return (
    <>
      {/* Mobile menu button */}
      {isMobile && (
        <Button variant="ghost" size="icon" className="fixed top-4 left-4 z-50 md:hidden" onClick={toggleSidebar}>
          <Menu className="h-5 w-5" />
        </Button>
      )}

      {/* Sidebar */}
      <aside
        className={`fixed md:sticky top-0 h-screen z-40 transition-all duration-300 ease-in-out bg-background border-r ${
          isMobile ? (isOpen ? "left-0" : "-left-full") : isHovered ? "w-64" : "w-16"
        }`}
        onMouseEnter={() => !isMobile && setIsHovered(true)}
        onMouseLeave={() => !isMobile && setIsHovered(false)}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-center h-16 border-b">
            {isHovered || isOpen ? (
              <div className="flex items-center px-4">
                <Globe className="h-6 w-6 text-primary" />
                <span className="ml-2 font-bold text-lg">Safar</span>
              </div>
            ) : (
              <Globe className="h-6 w-6 text-primary" />
            )}
          </div>

          <div className="flex-1 overflow-y-auto py-4">
            <div className="px-3 mb-6">
              {(isHovered || isOpen) && (
                <div className="mb-2 px-2 text-xs font-semibold text-muted-foreground">MAIN MENU</div>
              )}
              <NavItem
                href="/dashboard"
                icon={<Home className="h-5 w-5" />}
                label="Home"
                isCollapsed={!isHovered && !isOpen}
                isActive={true}
              />
              <NavItem
                href="/dashboard/bookings"
                icon={<Bell className="h-5 w-5" />}
                label="My Bookings"
                isCollapsed={!isHovered && !isOpen}
              />
              <NavItem
                href="/dashboard/messages"
                icon={<MessageSquare className="h-5 w-5" />}
                label="Messages"
                isCollapsed={!isHovered && !isOpen}
                badge="3"
              />
              <NavItem
                href="/dashboard/notifications"
                icon={<Bell className="h-5 w-5" />}
                label="Notifications"
                isCollapsed={!isHovered && !isOpen}
                badge="5"
              />
              <NavItem
                href="/dashboard/wishlist"
                icon={<Heart className="h-5 w-5" />}
                label="Wishlist"
                isCollapsed={!isHovered && !isOpen}
              />
            </div>

            {(isHovered || isOpen) && (
              <div className="px-3 mb-6">
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
                <NavItem
                  href="/dashboard/restaurants"
                  icon={<Utensils className="h-5 w-5" />}
                  label="Restaurants"
                  isCollapsed={false}
                />
                <NavItem
                  href="/dashboard/activities"
                  icon={<Ticket className="h-5 w-5" />}
                  label="Activities"
                  isCollapsed={false}
                />
              </div>
            )}
          </div>

          <div className="border-t p-3">
            <NavItem
              href="/dashboard/profile"
              icon={<User className="h-5 w-5" />}
              label="Profile"
              isCollapsed={!isHovered && !isOpen}
            />
            <NavItem
              href="/dashboard/settings"
              icon={<Settings className="h-5 w-5" />}
              label="Settings"
              isCollapsed={!isHovered && !isOpen}
            />
            <NavItem
              href="/help"
              icon={<HelpCircle className="h-5 w-5" />}
              label="Help Center"
              isCollapsed={!isHovered && !isOpen}
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
      className={`flex items-center p-2 rounded-md group transition-colors ${
        isActive ? "bg-primary/10 text-primary" : "hover:bg-muted text-muted-foreground hover:text-foreground"
      }`}
    >
      <div className="flex items-center justify-center w-5 h-5">{icon}</div>
      {!isCollapsed && (
        <>
          <span className="ml-3 text-sm font-medium">{label}</span>
          {badge && (
            <Badge variant="secondary" className="ml-auto text-xs">
              {badge}
            </Badge>
          )}
        </>
      )}
      {isCollapsed && badge && (
        <Badge
          variant="secondary"
          className="absolute top-0 right-0 translate-x-1/2 -translate-y-1/2 w-4 h-4 p-0 flex items-center justify-center text-[10px]"
        >
          {badge}
        </Badge>
      )}
    </Link>
  )
}
