"use client"

import { useRouter } from "next/navigation"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useAuth } from "@/core/hooks/use-auth"
import { Calendar, LogOut, Settings, User2, MessageSquare, Bell, Home, UserPlus } from 'lucide-react'
import NotificationCenter from "../notification-center"
import { UserAvatar } from "../profile/user-avatar"
import { formatCount } from "@/lib/utils/date-formatter"

interface UserAvatarDropdownMenuProps {
  className?: string
  showDropdown?: boolean
}

export const UserAvatarDropdownMenu = ({ className, showDropdown = true }: UserAvatarDropdownMenuProps) => {
  const router = useRouter()
  const { user: userData, isAuthenticated, isLoading, logout } = useAuth()

  if (isLoading) {
    return (
      <div className="flex items-center space-x-2">
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>
    )
  }

  const handleLogout = async () => {
    try {
      await logout()
    } catch {
    }
  }   
    
  if (!showDropdown) {
    return (
      <div className="flex items-center gap-2">
         <UserAvatar className={className} size={"sm"} src={userData?.profile?.avatar} membership={userData?.membership_level} alt={userData?.username} count={userData?.points || 0} fallback={userData?.username?.charAt(0)?.toUpperCase() || <User2 className="h-4 w-4" />} />   
      </div>
    )
  }

  return (
    <DropdownMenu>
      {isAuthenticated && userData && (
       <div className="mr-4">
       <NotificationCenter/>
     </div>
      )}
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0">
        <UserAvatar className={className} size={"sm"} src={userData?.profile?.avatar} membership={userData?.membership_level} alt={userData?.username} count={userData?.points || 0} fallback={userData?.first_name?.charAt(0)?.toUpperCase() || <User2 className="h-4 w-4" />} />   
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        {isAuthenticated && userData ? (
          <>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{userData.first_name || "User"}</p>
                <p className="text-xs leading-none text-muted-foreground">{userData.email}</p>
                {userData.membership_level && (
                  <div className="mt-1 flex items-center gap-1.5">
                    <div className={`h-2 w-2 rounded-full bg-current ${
                      userData.membership_level === "bronze" ? "text-amber-600" :
                      userData.membership_level === "silver" ? "text-slate-400" :
                      userData.membership_level === "gold" ? "text-yellow-400" :
                      "text-cyan-300"
                    }`}></div>
                    <span className="text-xs capitalize">{userData.membership_level} Member</span>
                    <span className="ml-auto text-xs font-semibold text-primary">{formatCount(userData.points)} pts</span>
                  </div>
                )}
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push(`/profile/${user?.id}`)}>
              <User2 className="mr-2 h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push("/bookings")}>
              <Calendar className="mr-2 h-4 w-4" />
              My Bookings
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push("/messages")}>
              <MessageSquare className="mr-2 h-4 w-4" />
              Chat
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push("/notifications")}>
              <Bell className="mr-2 h-4 w-4" />
              Notifications
            </DropdownMenuItem>
            {userData.role && userData.role !== "guest" && (
              <DropdownMenuItem onClick={() => router.push("/owner")}>
                <Home className="mr-2 h-4 w-4" />
                Owner Page
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push("/settings")}>
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Log out
            </DropdownMenuItem>
          </>
        ) : (
          <>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">Welcome</p>
                <p className="text-xs leading-none text-muted-foreground">Please sign in or register</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push("/login")}>
              <User2 className="mr-2 h-4 w-4" />
              Sign In
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push("/sign-up")}>
              <UserPlus className="mr-2 h-4 w-4" />
              Sign Up
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
