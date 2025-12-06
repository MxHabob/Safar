'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  User, 
  Shield, 
  Settings, 
  Calendar, 
  Heart,
  Building2,
  BarChart3,
  FileText
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { GetCurrentUserInfoApiV1UsersMeGetResponse } from '@/generated/schemas'

interface AccountSidebarProps {
  user: GetCurrentUserInfoApiV1UsersMeGetResponse
}

const guestNavItems = [
  { href: '/account', label: 'Overview', icon: LayoutDashboard },
  { href: '/account/profile', label: 'Profile', icon: User },
  { href: '/account/bookings', label: 'My Bookings', icon: Calendar },
  { href: '/account/wishlist', label: 'Wishlist', icon: Heart },
  { href: '/account/security', label: 'Security', icon: Shield },
  { href: '/account/settings', label: 'Settings', icon: Settings },
]

const hostNavItems = [
  { href: '/account', label: 'Overview', icon: LayoutDashboard },
  { href: '/account/profile', label: 'Profile', icon: User },
  { href: '/account/bookings', label: 'My Bookings', icon: Calendar },
  { href: '/account/wishlist', label: 'Wishlist', icon: Heart },
  { href: '/host', label: 'Host Dashboard', icon: Building2 },
  { href: '/host/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/account/security', label: 'Security', icon: Shield },
  { href: '/account/settings', label: 'Settings', icon: Settings },
]

const adminNavItems = [
  { href: '/account', label: 'Overview', icon: LayoutDashboard },
  { href: '/account/profile', label: 'Profile', icon: User },
  { href: '/admin', label: 'Admin Panel', icon: FileText },
  { href: '/account/security', label: 'Security', icon: Shield },
  { href: '/account/settings', label: 'Settings', icon: Settings },
]

export function AccountSidebar({ user }: AccountSidebarProps) {
  const pathname = usePathname()
  
  const getNavItems = () => {
    if (user.role === 'admin' || user.role === 'super_admin') {
      return adminNavItems
    }
    if (user.role === 'host' || user.role === 'agency') {
      return hostNavItems
    }
    return guestNavItems
  }

  const navItems = getNavItems()

  return (
    <nav className="bg-card border rounded-[18px] p-4 space-y-1">
      <div className="mb-4 pb-4 border-b">
        <h2 className="text-lg font-semibold text-foreground">Account</h2>
        <p className="text-sm text-muted-foreground mt-1">
          {user.email}
        </p>
      </div>
      
      <div className="space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || 
            (item.href !== '/account' && pathname?.startsWith(item.href))
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-[18px] text-sm font-light transition-all duration-200",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

