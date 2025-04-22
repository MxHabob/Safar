"use client"

import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import type { User } from "@/core/types"
import { UserAvatar } from "@/components/global/user-avatar"

interface DashboardHeaderProps {
  user: User | null
}

export function DashboardHeader({ user }: DashboardHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Welcome back, {user?.username}</h1>
        <p className="text-muted-foreground">Here&apos;s what&apos;s happening with your travel plans</p>
      </div>
      <div className="flex items-center space-x-4">
        <div className="hidden md:flex items-center space-x-2 bg-muted/50 rounded-full px-3 py-1.5">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search destinations..."
            className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 w-[180px]"
          />
        </div>
        <div className="flex flex-col items-end">
          <span className="text-sm font-medium">
            {user?.first_name} {user?.last_name}
          </span>
          <span className="text-xs text-muted-foreground">{user?.email}</span>
        </div>
        <UserAvatar className="h-9 w-9" />
      </div>
    </div>
  )
}
