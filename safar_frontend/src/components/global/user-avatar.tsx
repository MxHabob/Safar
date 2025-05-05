"use client"

import { useRouter } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
import { MembershipLevel } from "@/core/types"

interface UserAvatarProps {
  className?: string
  showName?: boolean
  showDropdown?: boolean
}

const membershipColors: Record<MembershipLevel, string> = {
  bronze: "border-amber-600",
  silver: "border-slate-400",
  gold: "border-yellow-400",
  platinum: "border-cyan-300"
}

export const UserAvatar = ({ className, showName = false, showDropdown = true }: UserAvatarProps) => {
  const router = useRouter()
  const { user: userData, isAuthenticated, isLoading, logout } = useAuth()

  if (isLoading) {
    return (
      <div className="flex items-center space-x-2">
        <Skeleton className="h-8 w-8 rounded-full" />
        {showName && <Skeleton className="h-4 w-20" />}
      </div>
    )
  }

  const handleLogout = async () => {
    try {
      await logout()
    } catch {
    }
  }

  const formatPoints = (points: number) => {
    if (points >= 1000) {
      return `${(points / 1000).toFixed(1)}K`
    }
    return points.toString()
  }

const membershipColor = userData?.membership_level 
  ? membershipColors[userData.membership_level as MembershipLevel] 
  : "border-transparent";

  const avatarContent = (
    <div className="relative">
      <Avatar className={className}>
        <AvatarImage 
          src={userData?.profile?.avatar || "/placeholder.svg"} 
          alt={userData?.first_name || "User avatar"} 
        />
        <AvatarFallback>
          {isAuthenticated && userData
            ? (((userData.first_name?.charAt(0)?.toUpperCase() ?? "") + 
                (userData.last_name?.charAt(0)?.toUpperCase() ?? "")) || 
                (userData.username?.charAt(0)?.toUpperCase() ?? ""))
            : <User2 className="h-4 w-4" />
          }
        </AvatarFallback>
      </Avatar>
      
      {isAuthenticated && userData && (
        <div className={`absolute -inset-1 rounded-full border-2 ${membershipColor}`}></div>
      )}
      
      {/* {isAuthenticated && userData && userData.points > 0 && (
        <div className="absolute -bottom-1 -right-1 flex h-3 min-w-3 items-center justify-center rounded-full bg-card px-1">
          <span className="text-xs font-bold text-primary-foreground">
          {formatPoints(userData.points)}
           </span>
        </div>
      )} */}
    </div>
  )

  if (!showDropdown) {
    return (
      <div className="flex items-center gap-2">
        {avatarContent}
        {showName && isAuthenticated && userData && (
          <span className="font-medium">{userData.first_name || userData.email?.split("@")[0]}</span>
        )}
      </div>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0">
          {avatarContent}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        {isAuthenticated && userData ? (
          <>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{userData.username || "User"}</p>
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
                    <span className="ml-auto text-xs font-semibold text-primary">{formatPoints(userData.points)} pts</span>
                  </div>
                )}
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push("/account/profile")}>
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
