"use client"

// External dependencies
import { BadgeCheck, Bell, ChevronsUpDown, CreditCard, LogOut, Settings, Sparkles } from "lucide-react"
import { useRouter } from "next/navigation"
// Internal components
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from "@/components/ui/sidebar"
import { useModal } from "@/lib/stores/modal-store"
import { useAuth } from "@/lib/auth/client"
/**
 * NavUser Component
 *
 * User profile section in the dashboard sidebar footer.
 * Displays user information and provides a dropdown with user-related actions.
 * Uses NextAuth session data to show the authenticated user's information.
 */
export function NavUser() {
  const { isMobile } = useSidebar()
  const { user, isLoading, isAuthenticated, logout } = useAuth()
  const { onOpen, onClose } = useModal()
  const router = useRouter()

  const handleSignOut = async () => {
    await logout()
  }
  const handleRedirectProfile = () => { 
    router.push("/account");
    onClose()
  }
  const handleUpgradeToPro = () => {
    router.push("/subscription");
    onClose()
  }

  // Show loading state while session is being fetched
  if (isLoading) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size="lg" className="animate-pulse">
            <div className="h-8 w-8 rounded-lg bg-muted" />
            <div className="grid flex-1 text-left text-sm leading-tight">
              <div className="h-4 w-24 bg-muted rounded" />
              <div className="h-3 w-32 bg-muted rounded mt-1" />
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    )
  }

  // Show fallback if no session
  if (!user) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size="lg" asChild>
            <div className="cursor-pointer">
              <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center">
                <span className="text-xs font-semibold">?</span>
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">Guest User</span>
                <span className="truncate text-xs">Not signed in</span>
              </div>
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    )
  }

  const userName = user.full_name ?? ""
  const userEmail = user.email ?? ""
  const userInitials = userName
    ? userName
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .substring(0, 2)
        .toUpperCase()
    : userEmail
      ? userEmail.split("@")[0].substring(0, 2).toUpperCase()
      : "U"

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground cursor-pointer hover:bg-transparent hover:font-bold hover:underline hover:underline-offset-4"
              aria-label="User profile and options"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage src={user.avatar_url || ""} alt={`${user.full_name || user.email || "User"}'s profile`} />
                <AvatarFallback className="rounded-lg">{userInitials}</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{user.full_name || user.email || "User"}</span>
                <span className="truncate text-xs">{user.email || ""}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" aria-hidden="true" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
            role="menu"
            aria-label="User options"
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={user.avatar_url || ""} alt={`${user.full_name || user.email || "User"}'s profile`} />
                  <AvatarFallback className="rounded-lg">{userInitials}</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{user.full_name || user.email || "User"}</span>
                  <span className="truncate text-xs">{user.email || ""}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleRedirectProfile} role="menuitem">
                <BadgeCheck aria-hidden="true" />
                Account
              </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} role="menuitem">
              <LogOut aria-hidden="true" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
