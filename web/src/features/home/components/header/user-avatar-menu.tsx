"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { logoutAction } from "@/lib/auth/server/actions";
import { User, Settings, LogOut, UserCircle } from "lucide-react";
import { ServerSession } from "@/lib/auth/server/session";

export function UserAvatarMenu({ user }: { user: ServerSession }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = () => {
    startTransition(async () => {
      try {
        await logoutAction();
      } catch (error) {
        console.error("Logout failed:", error);
        router.push("/login");
      }
    });
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <button
          className="rounded-[18px] transition-all hover:opacity-80"
          aria-label="User menu"
          disabled={isPending}
        >
          <Avatar className="h-7 w-7 rounded-[18px]">
            <AvatarImage
              src={user.user.avatar_url || undefined}
              alt={
                user.user.full_name ||
                `${user.user.first_name || ""} ${user.user.last_name || ""}`.trim() ||
                user.user.email ||
                "User"
              }
              className="rounded-[18px]"
            />
            <AvatarFallback className="rounded-[18px] bg-muted text-muted-foreground font-medium">
              {`${user.user.first_name?.[0] || ""}${user.user.last_name?.[0] || ""}`.trim() ||
                user.user.email?.[0]?.toUpperCase() ||
                "U"}
            </AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-56 rounded-[18px] border bg-background p-1"
        sideOffset={8}
      >
        <DropdownMenuLabel className="px-3 py-2">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">
              {user.user.full_name ||
                `${user.user.first_name || ""} ${user.user.last_name || ""}`.trim() ||
                "User"}
            </p>
            <p className="text-xs leading-none text-muted-foreground truncate">
              {user.user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="rounded-md cursor-pointer"
          onClick={() => {
            router.push(`/account/profile`);
            setIsOpen(false);
          }}
        >
          <UserCircle className="mr-2 h-4 w-4" />
          <span>Profile</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          className="rounded-md cursor-pointer"
          onClick={() => {
            router.push(`/account`);
            setIsOpen(false);
          }}
        >
          <User className="mr-2 h-4 w-4" />
          <span>Account</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          className="rounded-md cursor-pointer"
          onClick={() => {
            router.push(`/account/settings`);
            setIsOpen(false);
          }}
        >
          <Settings className="mr-2 h-4 w-4" />
          <span>Settings</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="rounded-md cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
          onClick={handleLogout}
          disabled={isPending}
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>{isPending ? "Logging out..." : "Log out"}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

