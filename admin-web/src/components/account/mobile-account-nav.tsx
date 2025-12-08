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
  FileText,
  Menu
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import type { GetCurrentUserInfoApiV1UsersMeGetResponse } from '@/generated/schemas'

interface MobileAccountNavProps {
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
  { href: '/dashboard', label: 'Host Dashboard', icon: Building2 },
  { href: '/dashboard', label: 'Analytics', icon: BarChart3 },
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

export function MobileAccountNav({ user }: MobileAccountNavProps) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  
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
  const currentItem = navItems.find(item => 
    pathname === item.href || (item.href !== '/account' && pathname?.startsWith(item.href))
  )

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <div className="bg-card border rounded-[18px] p-4">
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            className="w-full justify-between h-auto p-0 hover:bg-transparent"
          >
            <div className="flex items-center gap-3">
              {currentItem && (
                <>
                  <currentItem.icon className="h-5 w-5" />
                  <span className="font-medium">{currentItem.label}</span>
                </>
              )}
            </div>
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
      </div>

      <SheetContent side="left" className="w-[280px] p-0">
        <div className="h-full flex flex-col">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold">Account</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {user.email}
            </p>
          </div>
          
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href || 
                (item.href !== '/account' && pathname?.startsWith(item.href))
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
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
          </nav>
        </div>
      </SheetContent>
    </Sheet>
  )
}

